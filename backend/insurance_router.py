import os
import json
import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Header
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db
import models_insurance as models
from services.insurance_service import (
    generate_claim_number,
    generate_policy_number,
    analyze_document_with_gemini,
    detect_missing_documents,
    generate_claim_summary_with_gemini,
    perform_consistency_check
)

router = APIRouter(prefix="/insurance", tags=["Insurance Claims"])

# Local secure uploads root
UPLOAD_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads", "insurance")
os.makedirs(UPLOAD_ROOT, exist_ok=True)

# Allowed upload extensions and max file size (15 MB)
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".bmp", ".webp", ".dcm"}
MAX_FILE_SIZE = 15 * 1024 * 1024


# ─────────────────────────────────────────────────────────────
# Pydantic Request/Response Models & Status Transitions
# ─────────────────────────────────────────────────────────────

VALID_TRANSITIONS = {
    models.ClaimStatus.DRAFT: [models.ClaimStatus.SUBMITTED, models.ClaimStatus.CANCELLED],
    models.ClaimStatus.SUBMITTED: [models.ClaimStatus.UNDER_REVIEW, models.ClaimStatus.CANCELLED],
    models.ClaimStatus.UNDER_REVIEW: [
        models.ClaimStatus.DOCUMENTS_REQUIRED,
        models.ClaimStatus.AWAITING_HOSPITAL_RESPONSE,
        models.ClaimStatus.APPROVED,
        models.ClaimStatus.PARTIALLY_APPROVED,
        models.ClaimStatus.REJECTED,
        models.ClaimStatus.CANCELLED,
    ],
    models.ClaimStatus.DOCUMENTS_REQUIRED: [models.ClaimStatus.DOCUMENTS_RESUBMITTED, models.ClaimStatus.CANCELLED],
    models.ClaimStatus.DOCUMENTS_RESUBMITTED: [models.ClaimStatus.UNDER_REVIEW],
    models.ClaimStatus.AWAITING_HOSPITAL_RESPONSE: [
        models.ClaimStatus.UNDER_REVIEW,
        models.ClaimStatus.APPROVED,
        models.ClaimStatus.PARTIALLY_APPROVED,
        models.ClaimStatus.REJECTED
    ],
    models.ClaimStatus.APPROVED: [models.ClaimStatus.PAYMENT_PROCESSING, models.ClaimStatus.SETTLED],
    models.ClaimStatus.PARTIALLY_APPROVED: [models.ClaimStatus.PAYMENT_PROCESSING, models.ClaimStatus.SETTLED],
    models.ClaimStatus.PAYMENT_PROCESSING: [models.ClaimStatus.SETTLED],
    models.ClaimStatus.REJECTED: [models.ClaimStatus.UNDER_REVIEW],
    models.ClaimStatus.SETTLED: [],
    models.ClaimStatus.CANCELLED: []
}

class PolicyCreateRequest(BaseModel):
    patient_id: str
    patient_name: Optional[str] = "John Miller"
    insurance_company: str
    policy_number: Optional[str] = None
    policy_type: Optional[str] = "Comprehensive Health"
    sum_insured: float = 500000.0
    coverage_amount: float = 500000.0
    remaining_coverage: Optional[float] = 450000.0
    deductible: Optional[float] = 5000.0
    copay_percentage: Optional[float] = 10.0
    network_hospitals: Optional[str] = "Apollo Multi-Specialty Hospital, Fortis Healthcare, Max Healthcare, Manipal Hospitals"
    start_date: str
    end_date: str


class ClaimCreateRequest(BaseModel):
    patient_id: str
    patient_name: str
    patient_id_number: Optional[str] = None
    policyholder_name: Optional[str] = None
    policy_id: int
    appointment_id: Optional[str] = None
    hospital_name: str
    doctor_name: str
    treatment_type: str
    diagnosis_reference: Optional[str] = None
    treatment_date: Optional[str] = None
    admission_date: Optional[str] = None
    discharge_date: Optional[str] = None
    claim_amount: float
    description: Optional[str] = ""
    claim_type: Optional[str] = "REIMBURSEMENT"
    expense_breakdown: Optional[dict] = None
    is_ai_report_attached: Optional[bool] = False
    ai_report_id: Optional[str] = None
    ai_report_summary: Optional[str] = None
    idempotency_key: Optional[str] = None


class ClaimUpdateRequest(BaseModel):
    hospital_name: Optional[str] = None
    doctor_name: Optional[str] = None
    treatment_type: Optional[str] = None
    diagnosis_reference: Optional[str] = None
    treatment_date: Optional[str] = None
    admission_date: Optional[str] = None
    discharge_date: Optional[str] = None
    claim_amount: Optional[float] = None
    description: Optional[str] = None
    claim_type: Optional[str] = None
    expense_breakdown: Optional[dict] = None


class ReviewDecisionRequest(BaseModel):
    reviewer_id: str
    reviewer_name: str
    reviewer_role: Optional[str] = "Insurance Reviewer"
    comments: Optional[str] = None
    approved_amount: Optional[float] = None
    settlement_reference: Optional[str] = None
    payment_date: Optional[str] = None
    requested_documents_note: Optional[str] = None
    rejection_reason: Optional[str] = None


class ClaimAppealRequest(BaseModel):
    appeal_notes: str
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None


class ClaimResubmitDocsRequest(BaseModel):
    notes: Optional[str] = "Uploaded missing requested documents."
    patient_id: Optional[str] = None


class ClaimStatusTransitionRequest(BaseModel):
    new_status: str
    reviewer_id: str
    reviewer_name: str
    reviewer_role: Optional[str] = "INSURANCE_REVIEWER"
    comments: Optional[str] = None


class ClaimReportPreviewRequest(BaseModel):
    patient_name: str = "John Miller"
    patient_id: Optional[str] = "john.miller@patient.medivision.ai"
    patient_id_number: Optional[str] = "MED-ID-88421"
    policyholder_name: Optional[str] = "John Miller"
    policy_id: Optional[int] = None
    policy_details: Optional[dict] = None
    hospital_name: str = "Apollo Multi-Specialty Hospital"
    doctor_name: str = "Dr. Sarah Patel"
    treatment_type: str = "Radiological Scan & Consultation"
    diagnosis_reference: Optional[str] = "Suspected Respiratory Infection"
    treatment_date: Optional[str] = None
    admission_date: Optional[str] = None
    discharge_date: Optional[str] = None
    claim_amount: Optional[float] = 0.0
    claim_type: Optional[str] = "REIMBURSEMENT"
    description: Optional[str] = ""
    expense_breakdown: Optional[dict] = None
    attached_ai_report: Optional[dict] = None
    uploaded_docs: Optional[list] = None


def calculate_expenses_and_eligibility(policy: models.InsurancePolicy, breakdown: Optional[dict], fallback_amount: float):
    """Calculates server-verified itemized totals, eligible coverage, deductible and patient copay."""
    if breakdown and isinstance(breakdown, dict):
        consultation = float(breakdown.get("consultation", 0) or 0)
        diagnostic = float(breakdown.get("diagnostic", 0) or 0)
        hospitalization = float(breakdown.get("hospitalization", 0) or 0)
        surgery = float(breakdown.get("surgery", 0) or 0)
        medication = float(breakdown.get("medication", 0) or 0)
        other = float(breakdown.get("other", 0) or 0)
        total_calculated = consultation + diagnostic + hospitalization + surgery + medication + other
        if total_calculated <= 0 and fallback_amount > 0:
            total_calculated = fallback_amount
            breakdown = {
                "consultation": 0.0,
                "diagnostic": fallback_amount,
                "hospitalization": 0.0,
                "surgery": 0.0,
                "medication": 0.0,
                "other": 0.0,
                "total": fallback_amount
            }
        else:
            breakdown["total"] = total_calculated
    else:
        total_calculated = float(fallback_amount or 0)
        breakdown = {
            "consultation": 0.0,
            "diagnostic": total_calculated,
            "hospitalization": 0.0,
            "surgery": 0.0,
            "medication": 0.0,
            "other": 0.0,
            "total": total_calculated
        }

    remaining = getattr(policy, "remaining_coverage", None) or getattr(policy, "coverage_amount", 500000.0) or 500000.0
    deductible = getattr(policy, "deductible", 5000.0) or 5000.0
    copay_pct = getattr(policy, "copay_percentage", 10.0) or 10.0

    eligible_base = max(0.0, min(total_calculated, float(remaining)) - float(deductible))
    estimated_copay = eligible_base * (float(copay_pct) / 100.0)
    estimated_payable = max(0.0, eligible_base - estimated_copay)
    estimated_patient_responsibility = max(0.0, total_calculated - estimated_payable)

    summary = {
        "remaining_coverage": float(remaining),
        "deductible": float(deductible),
        "copay_percentage": float(copay_pct),
        "estimated_eligible_base": round(eligible_base, 2),
        "estimated_copay": round(estimated_copay, 2),
        "estimated_payable": round(estimated_payable, 2),
        "estimated_patient_responsibility": round(estimated_patient_responsibility, 2),
        "disclaimer": "This is an automated preliminary estimate. Final approved amount is determined solely by the insurance company reviewer upon verification of original bills and medical necessity."
    }
    return total_calculated, breakdown, summary



# ─────────────────────────────────────────────────────────────
# Helper: Extract User Context from Headers
# ─────────────────────────────────────────────────────────────

def get_current_user_id(x_user_id: Optional[str] = Header(None)) -> str:
    """Extract user identifier from request header or default to demo patient."""
    return x_user_id or "usr_demo_patient"


# ─────────────────────────────────────────────────────────────
# Seed / Demo Data Route
# ─────────────────────────────────────────────────────────────

@router.post("/seed-demo-data")
def seed_demo_data(db: Session = Depends(get_db)):
    """Seed initial policies, appointments and realistic demo claims for testing."""
    # Check if demo policies already exist
    existing_policies = db.query(models.InsurancePolicy).all()
    if not existing_policies:
        # Create standard demo policies
        demo_policy1 = models.InsurancePolicy(
            patient_id="john.miller@patient.medivision.ai",
            patient_name="John Miller",
            insurance_company="Star Health Allied Insurance",
            policy_number="POL-STAR-2026-8941",
            policy_type="Comprehensive Health Guard",
            sum_insured=1000000.0,
            coverage_amount=950000.0,
            remaining_coverage=885000.0,
            deductible=5000.0,
            copay_percentage=10.0,
            network_hospitals="Apollo Multi-Specialty Hospital, Fortis Healthcare, Max Healthcare, Manipal Hospitals",
            start_date="2026-01-01",
            end_date="2026-12-31",
            status=models.PolicyStatus.ACTIVE
        )
        demo_policy2 = models.InsurancePolicy(
            patient_id="john.miller@patient.medivision.ai",
            patient_name="John Miller",
            insurance_company="Care Health Insurance",
            policy_number="POL-CARE-2026-3412",
            policy_type="Critical Illness Cover",
            sum_insured=500000.0,
            coverage_amount=500000.0,
            remaining_coverage=450000.0,
            deductible=2500.0,
            copay_percentage=5.0,
            network_hospitals="Fortis Healthcare Centre, Apollo Hospitals, Medanta The Medicity",
            start_date="2025-06-01",
            end_date="2026-05-31",
            status=models.PolicyStatus.ACTIVE
        )
        db.add_all([demo_policy1, demo_policy2])
        db.commit()
    else:
        # Ensure fields are populated for existing demo policies
        for p in existing_policies:
            if not getattr(p, "deductible", None):
                p.deductible = 5000.0
            if not getattr(p, "copay_percentage", None):
                p.copay_percentage = 10.0
            if not getattr(p, "remaining_coverage", None):
                p.remaining_coverage = (p.sum_insured or 500000.0) - 25000.0
            if not getattr(p, "network_hospitals", None):
                p.network_hospitals = "Apollo Multi-Specialty Hospital, Fortis Healthcare, Max Healthcare, Manipal Hospitals"
        db.commit()

    # Create demo appointments if none exist
    existing_app = db.query(models.Appointment).first()
    if not existing_app:
        demo_app1 = models.Appointment(
            appointment_number="APT-2026-1024",
            patient_id="john.miller@patient.medivision.ai",
            patient_name="John Miller",
            doctor_name="Dr. Sarah Patel",
            doctor_specialty="Chief Radiologist",
            hospital_name="Apollo Multi-Specialty Hospital",
            appointment_date="2026-08-15",
            diagnosis_summary="Suspected Pulmonary Infiltration / Pneumonia",
            estimated_bill=18500.0,
            status="COMPLETED"
        )
        demo_app2 = models.Appointment(
            appointment_number="APT-2026-1088",
            patient_id="john.miller@patient.medivision.ai",
            patient_name="John Miller",
            doctor_name="Dr. Rajesh Mehta",
            doctor_specialty="Orthopedic Surgeon",
            hospital_name="Fortis Healthcare Centre",
            appointment_date="2026-08-20",
            diagnosis_summary="Right Wrist Hairline Fracture",
            estimated_bill=12000.0,
            status="COMPLETED"
        )
        db.add_all([demo_app1, demo_app2])
        db.commit()

    # Check and seed realistic demo claims if empty
    existing_claims = db.query(models.InsuranceClaim).first()
    first_policy = db.query(models.InsurancePolicy).first()
    if not existing_claims and first_policy:
        demo_claim1 = models.InsuranceClaim(
            claim_number="CLM-20260815-1042",
            patient_id="john.miller@patient.medivision.ai",
            patient_name="John Miller",
            patient_id_number="MED-ID-88421",
            policyholder_name="John Miller",
            policy_id=first_policy.id,
            hospital_name="Apollo Multi-Specialty Hospital",
            doctor_name="Dr. Sarah Patel",
            treatment_type="Radiological Scan & Consultation",
            diagnosis_reference="Right Lower Lobe Pneumonia / Infiltration",
            treatment_date="2026-08-15",
            admission_date="2026-08-15",
            discharge_date="2026-08-16",
            claim_amount=18500.0,
            approved_amount=16200.0,
            settlement_reference="SETTLE-NEFT-9841203",
            payment_date="2026-08-22",
            claim_type="REIMBURSEMENT",
            status=models.ClaimStatus.SETTLED,
            description="Emergency pulmonary consultation following severe productive cough and fever.",
            expense_breakdown=json.dumps({
                "consultation": 2500.0,
                "diagnostic": 8500.0,
                "hospitalization": 4500.0,
                "surgery": 0.0,
                "medication": 3000.0,
                "other": 0.0,
                "total": 18500.0
            }),
            is_ai_report_attached=1,
            ai_report_summary="MediVision AI detected right lower zone infiltration consistent with acute bacterial pneumonia."
        )

        demo_claim2 = models.InsuranceClaim(
            claim_number="CLM-20260902-3914",
            patient_id="john.miller@patient.medivision.ai",
            patient_name="John Miller",
            patient_id_number="MED-ID-88421",
            policyholder_name="John Miller",
            policy_id=first_policy.id,
            hospital_name="Fortis Healthcare Centre",
            doctor_name="Dr. Rajesh Mehta",
            treatment_type="Orthopedic Imaging & Splinting",
            diagnosis_reference="Distal Radius Non-Displaced Fracture",
            treatment_date="2026-09-02",
            claim_amount=12000.0,
            approved_amount=0.0,
            claim_type="CASHLESS",
            status=models.ClaimStatus.UNDER_REVIEW,
            description="Pre-authorization cashless claim request for wrist immobilizer splinting and follow-up radiological assessment.",
            expense_breakdown=json.dumps({
                "consultation": 1500.0,
                "diagnostic": 5500.0,
                "hospitalization": 0.0,
                "surgery": 3500.0,
                "medication": 1500.0,
                "other": 0.0,
                "total": 12000.0
            }),
            is_ai_report_attached=1
        )
        db.add_all([demo_claim1, demo_claim2])
        db.commit()

    return {"message": "Demo insurance data seeded successfully."}



# ─────────────────────────────────────────────────────────────
# Policy Endpoints
# ─────────────────────────────────────────────────────────────

@router.get("/policies")
def get_policies(patient_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Retrieve insurance policies for a patient or all policies for admins."""
    query = db.query(models.InsurancePolicy)
    if patient_id:
        # Match patient id or match demo accounts
        query = query.filter(
            (models.InsurancePolicy.patient_id == patient_id) | 
            (models.InsurancePolicy.patient_id.in_(["john.miller@patient.medivision.ai", "usr_demo_patient"]))
        )
    policies = query.order_by(desc(models.InsurancePolicy.created_at)).all()
    
    # Auto-seed if empty
    if not policies:
        seed_demo_data(db)
        policies = db.query(models.InsurancePolicy).all()

    return policies


@router.post("/policies")
def create_policy(req: PolicyCreateRequest, db: Session = Depends(get_db)):
    """Create a new insurance policy."""
    policy_num = req.policy_number or generate_policy_number()
    
    # Check duplicate
    existing = db.query(models.InsurancePolicy).filter(models.InsurancePolicy.policy_number == policy_num).first()
    if existing:
        raise HTTPException(status_code=400, detail="Policy number already exists.")

    policy = models.InsurancePolicy(
        patient_id=req.patient_id,
        patient_name=req.patient_name,
        insurance_company=req.insurance_company,
        policy_number=policy_num,
        policy_type=req.policy_type or "Comprehensive Health",
        sum_insured=req.sum_insured,
        coverage_amount=req.coverage_amount,
        remaining_coverage=req.remaining_coverage if req.remaining_coverage is not None else req.coverage_amount,
        deductible=req.deductible if req.deductible is not None else 5000.0,
        copay_percentage=req.copay_percentage if req.copay_percentage is not None else 10.0,
        network_hospitals=req.network_hospitals or "Apollo Multi-Specialty Hospital, Fortis Healthcare, Max Healthcare, Manipal Hospitals",
        start_date=req.start_date,
        end_date=req.end_date,
        status=models.PolicyStatus.ACTIVE
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy


@router.get("/policies/{policy_id}")
def get_policy(policy_id: int, db: Session = Depends(get_db)):
    """Retrieve single policy details."""
    policy = db.query(models.InsurancePolicy).filter(models.InsurancePolicy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found.")
    return policy


@router.delete("/policies/{policy_id}")
def delete_policy(policy_id: int, db: Session = Depends(get_db)):
    """Delete policy if no active claims exist."""
    policy = db.query(models.InsurancePolicy).filter(models.InsurancePolicy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found.")
    
    active_claims = db.query(models.InsuranceClaim).filter(
        models.InsuranceClaim.policy_id == policy_id,
        models.InsuranceClaim.status.in_([
            models.ClaimStatus.SUBMITTED,
            models.ClaimStatus.UNDER_REVIEW,
            models.ClaimStatus.APPROVED,
            models.ClaimStatus.PARTIALLY_APPROVED
        ])
    ).count()

    if active_claims > 0:
        raise HTTPException(status_code=400, detail="Cannot delete policy with active/under-review claims.")

    db.delete(policy)
    db.commit()
    return {"message": "Policy deleted successfully."}


# ─────────────────────────────────────────────────────────────
# Appointment Helper Route
# ─────────────────────────────────────────────────────────────

@router.get("/appointments")
def get_appointments(patient_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Return completed and scheduled doctor appointments for auto-linking."""
    query = db.query(models.Appointment)
    if patient_id:
        query = query.filter(
            (models.Appointment.patient_id == patient_id) | 
            (models.Appointment.patient_id.in_(["john.miller@patient.medivision.ai", "usr_demo_patient"]))
        )
    apps = query.order_by(desc(models.Appointment.created_at)).all()
    if not apps:
        seed_demo_data(db)
        apps = db.query(models.Appointment).all()
    return apps


# ─────────────────────────────────────────────────────────────
# Claim Management Endpoints
# ─────────────────────────────────────────────────────────────

@router.get("/claims")
def get_claims(
    patient_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get claims list for patient with optional status filter."""
    query = db.query(models.InsuranceClaim)
    if patient_id:
        query = query.filter(
            (models.InsuranceClaim.patient_id == patient_id) |
            (models.InsuranceClaim.patient_id.in_(["john.miller@patient.medivision.ai", "usr_demo_patient"]))
        )
    if status and status != "ALL":
        query = query.filter(models.InsuranceClaim.status == status)

    claims = query.order_by(desc(models.InsuranceClaim.created_at)).all()
    
    # Return formatted claims with summary counts
    results = []
    for c in claims:
        doc_count = db.query(models.ClaimDocument).filter(models.ClaimDocument.claim_id == c.id).count()
        results.append({
            "id": c.id,
            "claim_number": c.claim_number,
            "patient_id": c.patient_id,
            "patient_name": c.patient_name,
            "patient_id_number": c.patient_id_number,
            "policyholder_name": c.policyholder_name or c.patient_name,
            "policy_id": c.policy_id,
            "policy_number": c.policy.policy_number if c.policy else "N/A",
            "insurance_company": c.policy.insurance_company if c.policy else "N/A",
            "hospital_name": c.hospital_name,
            "doctor_name": c.doctor_name,
            "treatment_type": c.treatment_type,
            "diagnosis_reference": c.diagnosis_reference,
            "claim_amount": c.claim_amount,
            "approved_amount": c.approved_amount or 0.0,
            "settlement_reference": c.settlement_reference,
            "payment_date": c.payment_date,
            "claim_type": c.claim_type,
            "status": c.status,
            "is_ai_report_attached": bool(c.is_ai_report_attached),
            "document_count": doc_count,
            "submitted_at": c.submitted_at.isoformat() if c.submitted_at else None,
            "reviewed_at": c.reviewed_at.isoformat() if c.reviewed_at else None,
            "settled_at": c.settled_at.isoformat() if c.settled_at else None,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        })
    return results


@router.post("/claims")
def create_claim(req: ClaimCreateRequest, db: Session = Depends(get_db)):
    """Create a new insurance claim draft with server-side validation and duplicate protection."""
    policy = db.query(models.InsurancePolicy).filter(models.InsurancePolicy.id == req.policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Selected insurance policy not found.")

    # 1. Idempotency Check for duplicate prevention
    if req.idempotency_key:
        existing_idemp = db.query(models.InsuranceClaim).filter(models.InsuranceClaim.idempotency_key == req.idempotency_key).first()
        if existing_idemp:
            return existing_idemp

    # Rapid duplicate check within 30 seconds
    recent_dup = db.query(models.InsuranceClaim).filter(
        models.InsuranceClaim.patient_id == req.patient_id,
        models.InsuranceClaim.policy_id == req.policy_id,
        models.InsuranceClaim.hospital_name == req.hospital_name,
        models.InsuranceClaim.created_at >= datetime.datetime.utcnow() - datetime.timedelta(seconds=30)
    ).first()
    if recent_dup:
        return recent_dup

    # 2. Server-side expense verification & calculations
    total_calculated, final_breakdown, calc_summary = calculate_expenses_and_eligibility(
        policy=policy,
        breakdown=req.expense_breakdown,
        fallback_amount=req.claim_amount
    )

    claim_num = generate_claim_number(db)

    claim = models.InsuranceClaim(
        claim_number=claim_num,
        patient_id=req.patient_id,
        patient_name=req.patient_name,
        patient_id_number=req.patient_id_number or "MED-ID-88421",
        policyholder_name=req.policyholder_name or policy.patient_name or req.patient_name,
        policy_id=req.policy_id,
        appointment_id=req.appointment_id,
        hospital_name=req.hospital_name,
        doctor_name=req.doctor_name,
        treatment_type=req.treatment_type,
        diagnosis_reference=req.diagnosis_reference,
        treatment_date=req.treatment_date or datetime.date.today().isoformat(),
        admission_date=req.admission_date,
        discharge_date=req.discharge_date,
        claim_amount=total_calculated,
        approved_amount=0.0,
        description=req.description,
        claim_type=req.claim_type or "REIMBURSEMENT",
        status=models.ClaimStatus.DRAFT,
        expense_breakdown=json.dumps(final_breakdown),
        is_ai_report_attached=1 if req.is_ai_report_attached else 0,
        ai_report_id=req.ai_report_id,
        ai_report_summary=req.ai_report_summary,
        idempotency_key=req.idempotency_key
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)

    # Initial Audit Trail
    audit = models.ClaimAuditLog(
        claim_id=claim.id,
        user_id=req.patient_id,
        user_name=req.patient_name,
        user_role="PATIENT",
        action="CLAIM_DRAFT_CREATED",
        old_status=None,
        new_status=models.ClaimStatus.DRAFT,
        comments=f"Claim draft initiated for {claim.claim_type} with claimed amount ₹{total_calculated:,.2f}."
    )
    db.add(audit)
    db.commit()

    return claim


@router.get("/claims/{claim_id}")
def get_claim_details(claim_id: int, db: Session = Depends(get_db)):
    """Get complete claim information, policy details, itemized expenses, documents, and audit trail."""
    claim = db.query(models.InsuranceClaim).filter(models.InsuranceClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")

    policy = claim.policy
    documents = db.query(models.ClaimDocument).filter(models.ClaimDocument.claim_id == claim.id).all()
    audit_logs = db.query(models.ClaimAuditLog).filter(models.ClaimAuditLog.claim_id == claim.id).order_by(desc(models.ClaimAuditLog.created_at)).all()

    doc_list = []
    for d in documents:
        extracted = None
        if d.ai_extracted_data:
            try:
                extracted = json.loads(d.ai_extracted_data)
            except Exception:
                extracted = d.ai_extracted_data
        
        doc_list.append({
            "id": d.id,
            "document_type": d.document_type,
            "original_filename": d.original_filename,
            "mime_type": d.mime_type,
            "file_size": d.file_size,
            "uploaded_by": d.uploaded_by,
            "verification_status": d.verification_status,
            "ai_extracted_data": extracted,
            "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
        })

    logs_list = [{
        "id": l.id,
        "action": l.action,
        "user_id": l.user_id,
        "user_name": l.user_name,
        "user_role": l.user_role,
        "old_status": l.old_status,
        "new_status": l.new_status,
        "comments": l.comments,
        "created_at": l.created_at.isoformat() if l.created_at else None
    } for l in audit_logs]

    # Parse expense breakdown & consistency
    breakdown_data = {}
    if claim.expense_breakdown:
        try:
            breakdown_data = json.loads(claim.expense_breakdown)
        except Exception:
            breakdown_data = {"total": claim.claim_amount}

    consistency_issues_list = []
    if claim.consistency_issues:
        try:
            consistency_issues_list = json.loads(claim.consistency_issues)
        except Exception:
            consistency_issues_list = [claim.consistency_issues]

    # Calculate financial coverage projection
    _, _, financial_estimate = calculate_expenses_and_eligibility(
        policy=policy,
        breakdown=breakdown_data,
        fallback_amount=claim.claim_amount
    )

    return {
        "id": claim.id,
        "claim_number": claim.claim_number,
        "patient_id": claim.patient_id,
        "patient_name": claim.patient_name,
        "patient_id_number": claim.patient_id_number or "MED-ID-88421",
        "policyholder_name": claim.policyholder_name or claim.patient_name,
        "policy_id": claim.policy_id,
        "policy": {
            "id": policy.id,
            "insurance_company": policy.insurance_company,
            "policy_number": policy.policy_number,
            "policy_type": policy.policy_type,
            "sum_insured": policy.sum_insured,
            "coverage_amount": policy.coverage_amount,
            "remaining_coverage": policy.remaining_coverage if hasattr(policy, "remaining_coverage") and policy.remaining_coverage is not None else policy.coverage_amount,
            "deductible": policy.deductible if hasattr(policy, "deductible") and policy.deductible is not None else 5000.0,
            "copay_percentage": policy.copay_percentage if hasattr(policy, "copay_percentage") and policy.copay_percentage is not None else 10.0,
            "network_hospitals": policy.network_hospitals if hasattr(policy, "network_hospitals") and policy.network_hospitals else "Apollo Multi-Specialty Hospital, Fortis Healthcare, Max Healthcare, Manipal Hospitals",
            "start_date": policy.start_date,
            "end_date": policy.end_date,
            "status": policy.status
        } if policy else None,
        "appointment_id": claim.appointment_id,
        "hospital_name": claim.hospital_name,
        "doctor_name": claim.doctor_name,
        "treatment_type": claim.treatment_type,
        "diagnosis_reference": claim.diagnosis_reference,
        "treatment_date": claim.treatment_date,
        "admission_date": claim.admission_date,
        "discharge_date": claim.discharge_date,
        "claim_amount": claim.claim_amount,
        "approved_amount": claim.approved_amount or 0.0,
        "settlement_reference": claim.settlement_reference,
        "payment_date": claim.payment_date,
        "description": claim.description,
        "claim_type": claim.claim_type,
        "status": claim.status,
        "expense_breakdown": breakdown_data,
        "financial_estimate": financial_estimate,
        "rejection_reason": claim.rejection_reason,
        "appeal_notes": claim.appeal_notes,
        "requested_documents_note": claim.requested_documents_note,
        "is_ai_report_attached": bool(claim.is_ai_report_attached),
        "ai_report_id": claim.ai_report_id,
        "ai_report_summary": claim.ai_report_summary,
        "ai_summary": claim.ai_summary,
        "consistency_status": claim.consistency_status,
        "consistency_issues": consistency_issues_list,
        "submitted_at": claim.submitted_at.isoformat() if claim.submitted_at else None,
        "reviewed_at": claim.reviewed_at.isoformat() if claim.reviewed_at else None,
        "reviewer_id": claim.reviewer_id,
        "reviewer_name": claim.reviewer_name,
        "reviewer_comments": claim.reviewer_comments,
        "settled_at": claim.settled_at.isoformat() if claim.settled_at else None,
        "created_at": claim.created_at.isoformat() if claim.created_at else None,
        "documents": doc_list,
        "audit_logs": logs_list
    }



@router.put("/claims/{claim_id}")
def update_claim(claim_id: int, req: ClaimUpdateRequest, db: Session = Depends(get_db)):
    """Update draft claim fields before submission."""
    claim = db.query(models.InsuranceClaim).filter(models.InsuranceClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")

    if claim.status in [models.ClaimStatus.SUBMITTED, models.ClaimStatus.APPROVED, models.ClaimStatus.SETTLED]:
        raise HTTPException(status_code=400, detail="Cannot edit a submitted or settled claim.")

    if req.hospital_name is not None:
        claim.hospital_name = req.hospital_name
    if req.doctor_name is not None:
        claim.doctor_name = req.doctor_name
    if req.treatment_type is not None:
        claim.treatment_type = req.treatment_type
    if req.diagnosis_reference is not None:
        claim.diagnosis_reference = req.diagnosis_reference
    if req.treatment_date is not None:
        claim.treatment_date = req.treatment_date
    if req.claim_amount is not None:
        claim.claim_amount = req.claim_amount
    if req.description is not None:
        claim.description = req.description
    if req.claim_type is not None:
        claim.claim_type = req.claim_type

    db.commit()
    db.refresh(claim)
    return claim


# ─────────────────────────────────────────────────────────────
# Document Upload & Gemini Analysis Endpoints
# ─────────────────────────────────────────────────────────────

@router.post("/claims/{claim_id}/documents")
async def upload_claim_document(
    claim_id: int,
    file: UploadFile = File(...),
    document_type: str = Form("OTHER"),
    uploaded_by: str = Form("PATIENT"),
    db: Session = Depends(get_db)
):
    """Upload a private supporting document and perform initial validation."""
    claim = db.query(models.InsuranceClaim).filter(models.InsuranceClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")

    # Validate file extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file format '{ext}'. Allowed formats: PDF, JPG, PNG, BMP, WEBP, DCM."
        )

    # Read bytes and validate size
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds maximum allowed size of 15MB.")

    # Secure directory structure: backend/uploads/insurance/{claim_id}/
    claim_upload_dir = os.path.join(UPLOAD_ROOT, str(claim_id))
    os.makedirs(claim_upload_dir, exist_ok=True)

    unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
    secure_path = os.path.join(claim_upload_dir, unique_filename)

    with open(secure_path, "wb") as f:
        f.write(file_bytes)

    # Trigger Gemini AI Analysis for structured extraction
    ai_result = analyze_document_with_gemini(
        file_bytes=file_bytes,
        mime_type=file.content_type or "application/octet-stream",
        filename=file.filename or "document",
        hint_doc_type=document_type
    )

    doc = models.ClaimDocument(
        claim_id=claim.id,
        document_type=document_type or ai_result.get("document_type", models.DocumentType.OTHER),
        original_filename=file.filename or "uploaded_document",
        secure_file_path=secure_path,
        mime_type=file.content_type or "application/octet-stream",
        file_size=len(file_bytes),
        uploaded_by=uploaded_by,
        verification_status=models.VerificationStatus.VERIFIED if ai_result.get("confidence", 0) > 0.7 else models.VerificationStatus.PENDING,
        ai_extracted_data=json.dumps(ai_result)
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Update claim status if ready
    if claim.status == models.ClaimStatus.DOCUMENTS_PENDING:
        claim.status = models.ClaimStatus.READY_TO_SUBMIT
        db.commit()

    # Log document upload in audit trail
    audit = models.ClaimAuditLog(
        claim_id=claim.id,
        user_id=uploaded_by,
        user_name=uploaded_by,
        user_role="PATIENT",
        action="DOCUMENT_UPLOADED",
        old_status=None,
        new_status=claim.status,
        comments=f"Uploaded {doc.document_type}: {doc.original_filename}"
    )
    db.add(audit)
    db.commit()

    return {
        "document_id": doc.id,
        "document_type": doc.document_type,
        "filename": doc.original_filename,
        "verification_status": doc.verification_status,
        "ai_extracted_data": ai_result
    }


@router.get("/documents/{document_id}/download")
def download_document(document_id: int, db: Session = Depends(get_db)):
    """Stream private document file securely."""
    doc = db.query(models.ClaimDocument).filter(models.ClaimDocument.id == document_id).first()
    if not doc or not os.path.exists(doc.secure_file_path):
        raise HTTPException(status_code=404, detail="Document file not found.")

    return FileResponse(
        path=doc.secure_file_path,
        media_type=doc.mime_type,
        filename=doc.original_filename
    )


@router.post("/documents/{document_id}/analyze")
def analyze_document_endpoint(document_id: int, db: Session = Depends(get_db)):
    """Manually re-trigger Gemini document analysis on an uploaded document."""
    doc = db.query(models.ClaimDocument).filter(models.ClaimDocument.id == document_id).first()
    if not doc or not os.path.exists(doc.secure_file_path):
        raise HTTPException(status_code=404, detail="Document file not found.")

    with open(doc.secure_file_path, "rb") as f:
        file_bytes = f.read()

    ai_result = analyze_document_with_gemini(
        file_bytes=file_bytes,
        mime_type=doc.mime_type,
        filename=doc.original_filename,
        hint_doc_type=doc.document_type
    )

    doc.ai_extracted_data = json.dumps(ai_result)
    doc.verification_status = models.VerificationStatus.VERIFIED
    doc.verified_at = datetime.datetime.utcnow()
    db.commit()

    return ai_result


# ─────────────────────────────────────────────────────────────
# AI Summary, Missing Check & Consistency Check
# ─────────────────────────────────────────────────────────────

@router.post("/claims/{claim_id}/check-documents")
def check_missing_documents_endpoint(claim_id: int, db: Session = Depends(get_db)):
    """Check uploaded documents against expected checklist."""
    claim = db.query(models.InsuranceClaim).filter(models.InsuranceClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")

    docs = db.query(models.ClaimDocument).filter(models.ClaimDocument.claim_id == claim_id).all()
    uploaded_types = [d.document_type for d in docs]

    result = detect_missing_documents(
        claim_type=claim.claim_type,
        treatment_type=claim.treatment_type,
        uploaded_doc_types=uploaded_types
    )

    claim.missing_documents_notes = json.dumps(result)
    db.commit()

    return result


@router.post("/claims/{claim_id}/generate-summary")
def generate_claim_summary_endpoint(claim_id: int, db: Session = Depends(get_db)):
    """Generate Gemini AI claim summary."""
    claim = db.query(models.InsuranceClaim).filter(models.InsuranceClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")

    docs = db.query(models.ClaimDocument).filter(models.ClaimDocument.claim_id == claim_id).all()
    extracted_docs = []
    for d in docs:
        if d.ai_extracted_data:
            try:
                extracted_docs.append(json.loads(d.ai_extracted_data))
            except Exception:
                pass

    claim_dict = {
        "patient_name": claim.patient_name,
        "hospital_name": claim.hospital_name,
        "doctor_name": claim.doctor_name,
        "treatment_type": claim.treatment_type,
        "diagnosis_reference": claim.diagnosis_reference,
        "claim_amount": claim.claim_amount,
        "claim_type": claim.claim_type
    }

    summary = generate_claim_summary_with_gemini(claim_dict, extracted_docs)
    claim.ai_summary = summary
    db.commit()

    return {"summary": summary}


@router.post("/claims/{claim_id}/validate")
def validate_claim_consistency_endpoint(claim_id: int, db: Session = Depends(get_db)):
    """Run consistency check across claim form and uploaded documents."""
    claim = db.query(models.InsuranceClaim).filter(models.InsuranceClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")

    docs = db.query(models.ClaimDocument).filter(models.ClaimDocument.claim_id == claim_id).all()
    extracted_docs = []
    for d in docs:
        extracted_docs.append({
            "document_type": d.document_type,
            "ai_extracted_data": d.ai_extracted_data
        })

    claim_dict = {
        "patient_name": claim.patient_name,
        "hospital_name": claim.hospital_name,
        "claim_amount": claim.claim_amount
    }

    result = perform_consistency_check(claim_dict, extracted_docs)
    claim.consistency_status = result.get("status", "VALID")
    claim.consistency_issues = json.dumps(result.get("issues", []))
    db.commit()

    return result


@router.post("/claims/{claim_id}/submit")
def submit_claim(claim_id: int, db: Session = Depends(get_db)):
    """Finalize claim and submit to Reviewer Queue."""
    claim = db.query(models.InsuranceClaim).filter(models.InsuranceClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")

    if claim.status in [models.ClaimStatus.SUBMITTED, models.ClaimStatus.APPROVED, models.ClaimStatus.SETTLED]:
        return {
            "message": "Claim is already submitted.",
            "claim_number": claim.claim_number,
            "status": claim.status
        }

    docs_count = db.query(models.ClaimDocument).filter(models.ClaimDocument.claim_id == claim_id).count()

    # Automatically generate summary and validate consistency if not already done
    try:
        if not claim.ai_summary:
            generate_claim_summary_endpoint(claim_id, db)
        validate_claim_consistency_endpoint(claim_id, db)
    except Exception as e:
        print(f"Summary/validation notice: {e}")

    old_status = claim.status
    claim.status = models.ClaimStatus.SUBMITTED
    claim.submitted_at = datetime.datetime.utcnow()
    db.commit()

    # Log in audit trail
    audit = models.ClaimAuditLog(
        claim_id=claim.id,
        user_id=claim.patient_id,
        user_name=claim.patient_name,
        user_role="PATIENT",
        action="CLAIM_SUBMITTED",
        old_status=old_status,
        new_status=models.ClaimStatus.SUBMITTED,
        comments=f"Claim submitted by patient for insurance reviewer assessment ({docs_count} document(s) attached)."
    )
    db.add(audit)
    db.commit()

    return {
        "message": "Claim submitted successfully!",
        "claim_number": claim.claim_number,
        "status": claim.status,
        "submitted_at": claim.submitted_at.isoformat()
    }


@router.post("/claims/{claim_id}/resubmit-documents")
def resubmit_documents(claim_id: int, req: ClaimResubmitDocsRequest, db: Session = Depends(get_db)):
    """Patient resubmits requested documents."""
    claim = db.query(models.InsuranceClaim).filter(models.InsuranceClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")

    if claim.status not in [models.ClaimStatus.DOCUMENTS_REQUIRED, "MORE_INFORMATION_REQUIRED"]:
        raise HTTPException(status_code=400, detail="Claim is not currently awaiting supplementary documents.")

    old_status = claim.status
    claim.status = models.ClaimStatus.DOCUMENTS_RESUBMITTED
    db.commit()

    audit = models.ClaimAuditLog(
        claim_id=claim.id,
        user_id=req.patient_id or claim.patient_id,
        user_name=claim.patient_name,
        user_role="PATIENT",
        action="DOCUMENTS_RESUBMITTED",
        old_status=old_status,
        new_status=models.ClaimStatus.DOCUMENTS_RESUBMITTED,
        comments=req.notes or "Patient uploaded requested supplementary documents."
    )
    db.add(audit)
    db.commit()

    return {
        "message": "Documents resubmitted successfully. Your claim is now back in the review queue.",
        "claim_number": claim.claim_number,
        "status": claim.status
    }


@router.post("/claims/{claim_id}/appeal")
def appeal_claim(claim_id: int, req: ClaimAppealRequest, db: Session = Depends(get_db)):
    """Submit reconsideration or appeal request for a rejected claim."""
    if not req.appeal_notes or len(req.appeal_notes.strip()) < 10:
        raise HTTPException(status_code=400, detail="Please provide detailed justification for your appeal.")

    claim = db.query(models.InsuranceClaim).filter(models.InsuranceClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")

    if claim.status != models.ClaimStatus.REJECTED:
        raise HTTPException(status_code=400, detail="Appeals can only be submitted for rejected claims.")

    old_status = claim.status
    claim.status = models.ClaimStatus.UNDER_REVIEW
    claim.appeal_notes = req.appeal_notes
    db.commit()

    audit = models.ClaimAuditLog(
        claim_id=claim.id,
        user_id=req.patient_id or claim.patient_id,
        user_name=req.patient_name or claim.patient_name,
        user_role="PATIENT",
        action="CLAIM_APPEALED",
        old_status=old_status,
        new_status=models.ClaimStatus.UNDER_REVIEW,
        comments=f"Patient appeal submitted: {req.appeal_notes}"
    )
    db.add(audit)
    db.commit()

    return {
        "message": "Reconsideration appeal registered. The adjudication board will re-evaluate your claim.",
        "claim_number": claim.claim_number,
        "status": claim.status
    }


@router.post("/claims/{claim_id}/cancel")
def cancel_claim(claim_id: int, db: Session = Depends(get_db)):
    """Cancel a draft or submitted claim."""
    claim = db.query(models.InsuranceClaim).filter(models.InsuranceClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")

    if claim.status in [models.ClaimStatus.APPROVED, models.ClaimStatus.SETTLED]:
        raise HTTPException(status_code=400, detail="Approved or settled claims cannot be cancelled.")

    old_status = claim.status
    claim.status = models.ClaimStatus.CANCELLED
    db.commit()

    audit = models.ClaimAuditLog(
        claim_id=claim.id,
        user_id=claim.patient_id,
        user_name=claim.patient_name,
        user_role="PATIENT",
        action="CLAIM_CANCELLED",
        old_status=old_status,
        new_status=models.ClaimStatus.CANCELLED,
        comments="Claim cancelled by patient."
    )
    db.add(audit)
    db.commit()

    return {"message": "Claim cancelled successfully.", "status": claim.status}


@router.delete("/claims/{claim_ref}")
def delete_claim(claim_ref: str, db: Session = Depends(get_db)):
    """Permanently delete a claim by id or claim_number."""
    claim = None
    if claim_ref.isdigit():
        claim = db.query(models.InsuranceClaim).filter(models.InsuranceClaim.id == int(claim_ref)).first()
    if not claim:
        claim = db.query(models.InsuranceClaim).filter(models.InsuranceClaim.claim_number == claim_ref).first()

    if claim:
        db.delete(claim)
        db.commit()
        return {"message": f"Claim {claim_ref} deleted successfully.", "deleted": True}

    return {"message": f"Claim {claim_ref} not found in database.", "deleted": True}


@router.get("/claims/{claim_id}/receipt")
def get_claim_receipt(claim_id: int, db: Session = Depends(get_db)):
    """Generate structured claim receipt and verification document."""
    claim = db.query(models.InsuranceClaim).filter(models.InsuranceClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")

    policy = claim.policy
    breakdown = {}
    if claim.expense_breakdown:
        try:
            breakdown = json.loads(claim.expense_breakdown)
        except Exception:
            pass

    return {
        "receipt_number": f"RCPT-{claim.claim_number}",
        "claim_number": claim.claim_number,
        "generated_at": datetime.datetime.utcnow().isoformat(),
        "status": claim.status,
        "patient": {
            "name": claim.patient_name,
            "patient_id": claim.patient_id,
            "patient_id_number": claim.patient_id_number or "MED-ID-88421",
            "policyholder": claim.policyholder_name or claim.patient_name
        },
        "policy": {
            "company": policy.insurance_company if policy else "Star Health Allied Insurance",
            "number": policy.policy_number if policy else "POL-2026-XXXX",
            "type": policy.policy_type if policy else "Comprehensive Health",
            "sum_insured": policy.sum_insured if policy else 500000.0,
            "deductible": policy.deductible if hasattr(policy, "deductible") and policy.deductible is not None else 5000.0,
            "copay_percentage": policy.copay_percentage if hasattr(policy, "copay_percentage") and policy.copay_percentage is not None else 10.0
        },
        "treatment": {
            "hospital": claim.hospital_name,
            "doctor": claim.doctor_name,
            "treatment_type": claim.treatment_type,
            "diagnosis": claim.diagnosis_reference or "Medical Treatment",
            "date": claim.treatment_date,
            "admission_date": claim.admission_date,
            "discharge_date": claim.discharge_date,
            "claim_type": claim.claim_type
        },
        "financials": {
            "total_claimed": claim.claim_amount,
            "approved_amount": claim.approved_amount or (claim.claim_amount if claim.status in ["APPROVED", "SETTLED"] else 0.0),
            "settlement_reference": claim.settlement_reference,
            "payment_date": claim.payment_date,
            "breakdown": breakdown
        },
        "disclaimer": "This receipt is an official administrative record generated by MediVision AI Healthcare Platform. Reimbursement eligibility is determined by the insurance underwriting terms."
    }


@router.get("/recent-diagnoses")
def get_recent_diagnoses():
    """Return completed MediVision AI diagnostic reports that can be attached to claims."""
    results = [
        {
            "id": "diag_demo_xray_01",
            "modality": "CHEST X-RAY",
            "diagnosis": "Right Lower Lobe Pneumonia / Infiltration",
            "confidence": "94.2%",
            "date": "2026-08-15",
            "summary": "Dense patchy opacity identified in the right lower lung zone consistent with acute bacterial consolidation. Minimal blunting of the right costophrenic angle.",
            "specialty": "Pulmonology & Radiology"
        },
        {
            "id": "diag_demo_mri_02",
            "modality": "BRAIN MRI",
            "diagnosis": "Mild Microvascular Ischemic Changes, No Acute Infarct",
            "confidence": "91.8%",
            "date": "2026-08-10",
            "summary": "T2/FLAIR hyperintensities noted in periventricular white matter. Normal ventricular caliber with no intracranial hemorrhage or space occupying lesion.",
            "specialty": "Neurology & Neuro-Radiology"
        },
        {
            "id": "diag_demo_fracture_03",
            "modality": "ORTHOPEDIC X-RAY",
            "diagnosis": "Non-Displaced Distal Radius Fracture",
            "confidence": "96.5%",
            "date": "2026-08-20",
            "summary": "Cortical disruption noted across the metaphyseal aspect of the distal radius without significant intra-articular step-off or radiocarpal dislocation.",
            "specialty": "Orthopedics"
        }
    ]
    return results


# ─────────────────────────────────────────────────────────────
# Reviewer & Admin Workflow Endpoints (Strict Human Decision)
# ─────────────────────────────────────────────────────────────

@router.get("/reviewer/claims")
def get_reviewer_claims(
    status: Optional[str] = None,
    search: Optional[str] = None,
    claim_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Reviewer Claims Queue with filtering and search."""
    query = db.query(models.InsuranceClaim)

    if status and status != "ALL":
        query = query.filter(models.InsuranceClaim.status == status)

    if claim_type and claim_type != "ALL":
        query = query.filter(models.InsuranceClaim.claim_type == claim_type)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (models.InsuranceClaim.patient_name.ilike(search_pattern)) |
            (models.InsuranceClaim.claim_number.ilike(search_pattern)) |
            (models.InsuranceClaim.hospital_name.ilike(search_pattern))
        )

    claims = query.order_by(desc(models.InsuranceClaim.created_at)).all()

    results = []
    for c in claims:
        doc_count = db.query(models.ClaimDocument).filter(models.ClaimDocument.claim_id == c.id).count()
        results.append({
            "id": c.id,
            "claim_number": c.claim_number,
            "patient_id": c.patient_id,
            "patient_name": c.patient_name,
            "policy_number": c.policy.policy_number if c.policy else "N/A",
            "insurance_company": c.policy.insurance_company if c.policy else "N/A",
            "hospital_name": c.hospital_name,
            "doctor_name": c.doctor_name,
            "treatment_type": c.treatment_type,
            "claim_amount": c.claim_amount,
            "approved_amount": c.approved_amount or 0.0,
            "claim_type": c.claim_type,
            "status": c.status,
            "consistency_status": c.consistency_status,
            "document_count": doc_count,
            "is_ai_report_attached": bool(c.is_ai_report_attached),
            "submitted_at": c.submitted_at.isoformat() if c.submitted_at else None,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        })
    return results


@router.post("/reviewer/claims/{claim_id}/transition-status")
def transition_claim_status(claim_id: int, req: ClaimStatusTransitionRequest, db: Session = Depends(get_db)):
    """Reviewer manual status transition with validation."""
    claim = db.query(models.InsuranceClaim).filter(models.InsuranceClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")

    allowed = VALID_TRANSITIONS.get(claim.status, [])
    if req.new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from {claim.status} to {req.new_status}. Allowed transitions: {', '.join(allowed) or 'None (Terminal state)'}"
        )

    old_status = claim.status
    claim.status = req.new_status
    claim.reviewer_id = req.reviewer_id
    claim.reviewer_name = req.reviewer_name
    if req.comments:
        claim.reviewer_comments = (claim.reviewer_comments or "") + f" | {req.comments}"
    db.commit()

    audit = models.ClaimAuditLog(
        claim_id=claim.id,
        user_id=req.reviewer_id,
        user_name=req.reviewer_name,
        user_role=req.reviewer_role or "INSURANCE_REVIEWER",
        action=f"STATUS_TRANSITION_TO_{req.new_status}",
        old_status=old_status,
        new_status=req.new_status,
        comments=req.comments or f"Reviewer changed status to {req.new_status}"
    )
    db.add(audit)
    db.commit()

    return {"message": f"Claim status updated to {req.new_status}.", "status": claim.status}


@router.post("/claims/{claim_id}/approve")
def approve_claim(claim_id: int, req: ReviewDecisionRequest, db: Session = Depends(get_db)):
    """Human Reviewer Claim Approval with full or partial amount."""
    claim = db.query(models.InsuranceClaim).filter(models.InsuranceClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")

    approved_amt = req.approved_amount if req.approved_amount is not None else claim.claim_amount
    is_partial = approved_amt < claim.claim_amount

    old_status = claim.status
    claim.status = models.ClaimStatus.PARTIALLY_APPROVED if is_partial else models.ClaimStatus.APPROVED
    claim.approved_amount = float(approved_amt)
    claim.reviewed_at = datetime.datetime.utcnow()
    claim.reviewer_id = req.reviewer_id
    claim.reviewer_name = req.reviewer_name
    claim.reviewer_comments = req.comments or ("Partially approved with non-payable medical deductions." if is_partial else "Full claim approved after verification.")

    # Deduct approved amount from remaining policy coverage
    if claim.policy and hasattr(claim.policy, "remaining_coverage"):
        curr_remaining = claim.policy.remaining_coverage or claim.policy.coverage_amount
        claim.policy.remaining_coverage = max(0.0, curr_remaining - approved_amt)

    db.commit()

    action_name = "CLAIM_PARTIALLY_APPROVED" if is_partial else "CLAIM_APPROVED"
    audit = models.ClaimAuditLog(
        claim_id=claim.id,
        user_id=req.reviewer_id,
        user_name=req.reviewer_name,
        user_role=req.reviewer_role or "INSURANCE_REVIEWER",
        action=action_name,
        old_status=old_status,
        new_status=claim.status,
        comments=f"{'Partially approved' if is_partial else 'Approved'} for ₹{approved_amt:,.2f}. {claim.reviewer_comments}"
    )
    db.add(audit)
    db.commit()

    return {
        "message": f"Claim {'partially ' if is_partial else ''}approved successfully.",
        "claim_number": claim.claim_number,
        "approved_amount": claim.approved_amount,
        "status": claim.status
    }


@router.post("/claims/{claim_id}/reject")
def reject_claim(claim_id: int, req: ReviewDecisionRequest, db: Session = Depends(get_db)):
    """Human Reviewer Claim Rejection with mandatory reason."""
    reason = req.rejection_reason or req.comments
    if not reason or len(reason.strip()) < 5:
        raise HTTPException(status_code=400, detail="A mandatory rejection reason / explanation is required for claim denial.")

    claim = db.query(models.InsuranceClaim).filter(models.InsuranceClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")

    old_status = claim.status
    claim.status = models.ClaimStatus.REJECTED
    claim.rejection_reason = reason
    claim.reviewed_at = datetime.datetime.utcnow()
    claim.reviewer_id = req.reviewer_id
    claim.reviewer_name = req.reviewer_name
    claim.reviewer_comments = reason
    db.commit()

    audit = models.ClaimAuditLog(
        claim_id=claim.id,
        user_id=req.reviewer_id,
        user_name=req.reviewer_name,
        user_role=req.reviewer_role or "INSURANCE_REVIEWER",
        action="CLAIM_REJECTED",
        old_status=old_status,
        new_status=models.ClaimStatus.REJECTED,
        comments=reason
    )
    db.add(audit)
    db.commit()

    return {"message": "Claim rejected.", "claim_number": claim.claim_number, "status": claim.status}


@router.post("/claims/{claim_id}/request-information")
def request_information_claim(claim_id: int, req: ReviewDecisionRequest, db: Session = Depends(get_db)):
    """Reviewer requests more documents or clarification from patient."""
    notes = req.requested_documents_note or req.comments
    if not notes:
        raise HTTPException(status_code=400, detail="Please specify what additional information or documents are required.")

    claim = db.query(models.InsuranceClaim).filter(models.InsuranceClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")

    old_status = claim.status
    claim.status = models.ClaimStatus.DOCUMENTS_REQUIRED
    claim.requested_documents_note = notes
    claim.reviewer_id = req.reviewer_id
    claim.reviewer_name = req.reviewer_name
    claim.reviewer_comments = notes
    db.commit()

    audit = models.ClaimAuditLog(
        claim_id=claim.id,
        user_id=req.reviewer_id,
        user_name=req.reviewer_name,
        user_role=req.reviewer_role or "INSURANCE_REVIEWER",
        action="DOCUMENTS_REQUIRED",
        old_status=old_status,
        new_status=models.ClaimStatus.DOCUMENTS_REQUIRED,
        comments=notes
    )
    db.add(audit)
    db.commit()

    return {
        "message": "Additional information requested from patient.",
        "claim_number": claim.claim_number,
        "status": claim.status
    }


@router.post("/claims/{claim_id}/settle")
def settle_claim(claim_id: int, req: ReviewDecisionRequest, db: Session = Depends(get_db)):
    """Mark an approved claim as settled / disbursed with reference number and date."""
    claim = db.query(models.InsuranceClaim).filter(models.InsuranceClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")

    if claim.status not in [models.ClaimStatus.APPROVED, models.ClaimStatus.PARTIALLY_APPROVED, models.ClaimStatus.PAYMENT_PROCESSING]:
        raise HTTPException(status_code=400, detail="Only approved or processing claims can be settled.")

    settle_ref = req.settlement_reference or f"SETTLE-NEFT-{uuid.uuid4().hex[:8].upper()}"
    pay_date = req.payment_date or datetime.date.today().isoformat()

    old_status = claim.status
    claim.status = models.ClaimStatus.SETTLED
    claim.settled_at = datetime.datetime.utcnow()
    claim.settlement_reference = settle_ref
    claim.payment_date = pay_date
    claim.reviewer_comments = (claim.reviewer_comments or "") + f" | Disbursed via Ref: {settle_ref} on {pay_date}."
    db.commit()

    audit = models.ClaimAuditLog(
        claim_id=claim.id,
        user_id=req.reviewer_id,
        user_name=req.reviewer_name,
        user_role=req.reviewer_role or "INSURANCE_REVIEWER",
        action="CLAIM_SETTLED",
        old_status=old_status,
        new_status=models.ClaimStatus.SETTLED,
        comments=f"Claim reimbursement settled. Ref: {settle_ref}, Date: {pay_date}"
    )
    db.add(audit)
    db.commit()

    return {
        "message": "Claim marked as settled and payment reference recorded.",
        "claim_number": claim.claim_number,
        "settlement_reference": settle_ref,
        "payment_date": pay_date,
        "status": claim.status
    }


# ─────────────────────────────────────────────────────────────
# Summary Stats Endpoint (All 8 Required Metrics)
# ─────────────────────────────────────────────────────────────

@router.get("/stats")
def get_insurance_stats(patient_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Return dashboard summary metrics covering all 8 required KPIs."""
    policy_query = db.query(models.InsurancePolicy)
    claim_query = db.query(models.InsuranceClaim)

    if patient_id:
        policy_query = policy_query.filter(
            (models.InsurancePolicy.patient_id == patient_id) |
            (models.InsurancePolicy.patient_id.in_(["john.miller@patient.medivision.ai", "usr_demo_patient"]))
        )
        claim_query = claim_query.filter(
            (models.InsuranceClaim.patient_id == patient_id) |
            (models.InsuranceClaim.patient_id.in_(["john.miller@patient.medivision.ai", "usr_demo_patient"]))
        )

    all_claims = claim_query.all()
    active_policies = policy_query.filter(models.InsurancePolicy.status == models.PolicyStatus.ACTIVE).count()
    total_claims = len(all_claims)
    
    under_review = sum(1 for c in all_claims if c.status in [
        models.ClaimStatus.SUBMITTED,
        models.ClaimStatus.UNDER_REVIEW,
        models.ClaimStatus.DOCUMENTS_RESUBMITTED,
        models.ClaimStatus.AWAITING_HOSPITAL_RESPONSE
    ])
    
    approved = sum(1 for c in all_claims if c.status in [
        models.ClaimStatus.APPROVED,
        models.ClaimStatus.PARTIALLY_APPROVED
    ])
    
    rejected = sum(1 for c in all_claims if c.status == models.ClaimStatus.REJECTED)
    
    awaiting_documents = sum(1 for c in all_claims if c.status in [
        models.ClaimStatus.DOCUMENTS_REQUIRED,
        "MORE_INFORMATION_REQUIRED"
    ])
    
    settled = sum(1 for c in all_claims if c.status == models.ClaimStatus.SETTLED)

    # 7. Total Amount Claimed
    total_claimed_amount = sum(c.claim_amount or 0.0 for c in all_claims if c.status != models.ClaimStatus.DRAFT)

    # 8. Total Amount Approved or Settled
    total_approved_settled_amount = sum(
        (c.approved_amount if (c.approved_amount and c.approved_amount > 0) else (c.claim_amount or 0.0))
        for c in all_claims if c.status in [
            models.ClaimStatus.APPROVED,
            models.ClaimStatus.PARTIALLY_APPROVED,
            models.ClaimStatus.PAYMENT_PROCESSING,
            models.ClaimStatus.SETTLED
        ]
    )

    return {
        "active_policies": active_policies,
        "total_claims": total_claims,
        "under_review": under_review,
        "approved": approved,
        "rejected": rejected,
        "awaiting_documents": awaiting_documents,
        "settled": settled,
        "total_claimed_amount": round(total_claimed_amount, 2),
        "total_approved_settled_amount": round(total_approved_settled_amount, 2)
    }

