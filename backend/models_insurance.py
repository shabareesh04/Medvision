import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Text, DateTime, ForeignKey, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from database import Base


class PolicyStatus:
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"


class ClaimStatus:
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    DOCUMENTS_REQUIRED = "DOCUMENTS_REQUIRED"
    DOCUMENTS_RESUBMITTED = "DOCUMENTS_RESUBMITTED"
    AWAITING_HOSPITAL_RESPONSE = "AWAITING_HOSPITAL_RESPONSE"
    APPROVED = "APPROVED"
    PARTIALLY_APPROVED = "PARTIALLY_APPROVED"
    REJECTED = "REJECTED"
    PAYMENT_PROCESSING = "PAYMENT_PROCESSING"
    SETTLED = "SETTLED"
    CANCELLED = "CANCELLED"
    
    # Backwards compatibility aliases
    DOCUMENTS_PENDING = "DRAFT"
    READY_TO_SUBMIT = "DRAFT"
    MORE_INFORMATION_REQUIRED = "DOCUMENTS_REQUIRED"


class DocumentType:
    MEDICAL_REPORT = "MEDICAL_REPORT"
    PRESCRIPTION = "PRESCRIPTION"
    DIAGNOSTIC_REPORT = "DIAGNOSTIC_REPORT"
    HOSPITAL_BILL = "HOSPITAL_BILL"
    DISCHARGE_SUMMARY = "DISCHARGE_SUMMARY"
    LAB_REPORT = "LAB_REPORT"
    SCAN_REPORT = "SCAN_REPORT"
    IDENTITY_DOCUMENT = "IDENTITY_DOCUMENT"
    INSURANCE_POLICY = "INSURANCE_POLICY"
    OTHER = "OTHER"


class VerificationStatus:
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    INVALID = "INVALID"
    REQUIRES_REVIEW = "REQUIRES_REVIEW"


class InsurancePolicy(Base):
    __tablename__ = "insurance_policies"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(100), index=True, nullable=False)
    patient_name = Column(String(200), nullable=True)
    insurance_company = Column(String(200), nullable=False)
    policy_number = Column(String(100), unique=True, index=True, nullable=False)
    policy_type = Column(String(100), default="Comprehensive Health")
    sum_insured = Column(Float, default=500000.0)
    coverage_amount = Column(Float, default=500000.0)
    remaining_coverage = Column(Float, default=450000.0)
    deductible = Column(Float, default=5000.0)
    copay_percentage = Column(Float, default=10.0)
    network_hospitals = Column(Text, default="Apollo Multi-Specialty Hospital, Fortis Healthcare, Max Healthcare, Manipal Hospitals")
    start_date = Column(String(50), nullable=False)
    end_date = Column(String(50), nullable=False)
    status = Column(String(50), default=PolicyStatus.ACTIVE)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    claims = relationship("InsuranceClaim", back_populates="policy", cascade="all, delete-orphan")


class InsuranceClaim(Base):
    __tablename__ = "insurance_claims"

    id = Column(Integer, primary_key=True, index=True)
    claim_number = Column(String(100), unique=True, index=True, nullable=False)
    patient_id = Column(String(100), index=True, nullable=False)
    patient_name = Column(String(200), nullable=False)
    patient_id_number = Column(String(100), nullable=True)
    policyholder_name = Column(String(200), nullable=True)
    policy_id = Column(Integer, ForeignKey("insurance_policies.id"), nullable=False)
    appointment_id = Column(String(100), nullable=True)
    hospital_name = Column(String(255), nullable=False)
    doctor_name = Column(String(200), nullable=False)
    treatment_type = Column(String(150), nullable=False)
    diagnosis_reference = Column(String(255), nullable=True)
    treatment_date = Column(String(50), nullable=True)
    admission_date = Column(String(50), nullable=True)
    discharge_date = Column(String(50), nullable=True)
    claim_amount = Column(Float, nullable=False)
    approved_amount = Column(Float, default=0.0)
    settlement_reference = Column(String(100), nullable=True)
    payment_date = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    claim_type = Column(String(50), default="REIMBURSEMENT")  # REIMBURSEMENT or CASHLESS
    status = Column(String(50), default=ClaimStatus.DRAFT, index=True)
    
    # Itemized expense breakdown JSON
    expense_breakdown = Column(Text, nullable=True)
    
    # Rejection & Appeal information
    rejection_reason = Column(Text, nullable=True)
    appeal_notes = Column(Text, nullable=True)
    requested_documents_note = Column(Text, nullable=True)

    # MedVision AI Report Integration
    is_ai_report_attached = Column(Integer, default=0)
    ai_report_id = Column(String(100), nullable=True)
    ai_report_summary = Column(Text, nullable=True)

    # Duplicate submission prevention
    idempotency_key = Column(String(100), nullable=True)

    # AI Assistance Outputs (Non-binding)
    ai_summary = Column(Text, nullable=True)
    consistency_status = Column(String(50), default="PENDING")  # VALID, WARNING, INCONSISTENT
    consistency_issues = Column(Text, nullable=True)  # JSON-encoded array of issues
    missing_documents_notes = Column(Text, nullable=True)  # JSON-encoded missing docs summary

    # Workflow & Reviewer Adjudication (Strictly human decision)
    submitted_at = Column(DateTime, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    reviewer_id = Column(String(100), nullable=True)
    reviewer_name = Column(String(200), nullable=True)
    reviewer_comments = Column(Text, nullable=True)
    settled_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    policy = relationship("InsurancePolicy", back_populates="claims")
    documents = relationship("ClaimDocument", back_populates="claim", cascade="all, delete-orphan")
    audit_logs = relationship("ClaimAuditLog", back_populates="claim", cascade="all, delete-orphan")


class ClaimDocument(Base):
    __tablename__ = "claim_documents"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("insurance_claims.id"), nullable=False, index=True)
    document_type = Column(String(50), default=DocumentType.OTHER)
    original_filename = Column(String(255), nullable=False)
    secure_file_path = Column(String(500), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, default=0)
    uploaded_by = Column(String(100), nullable=False)
    verification_status = Column(String(50), default=VerificationStatus.PENDING)
    
    # Gemini Extracted Structured Data (JSON String)
    ai_extracted_data = Column(Text, nullable=True)
    
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    verified_at = Column(DateTime, nullable=True)

    # Relationship
    claim = relationship("InsuranceClaim", back_populates="documents")


class ClaimAuditLog(Base):
    __tablename__ = "claim_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("insurance_claims.id"), nullable=False, index=True)
    user_id = Column(String(100), nullable=False)
    user_name = Column(String(200), nullable=True)
    user_role = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=True)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationship
    claim = relationship("InsuranceClaim", back_populates="audit_logs")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    appointment_number = Column(String(100), unique=True, index=True, nullable=False)
    patient_id = Column(String(100), index=True, nullable=False)
    patient_name = Column(String(200), nullable=False)
    doctor_name = Column(String(200), nullable=False)
    doctor_specialty = Column(String(150), nullable=False)
    hospital_name = Column(String(255), nullable=False)
    appointment_date = Column(String(50), nullable=False)
    diagnosis_summary = Column(Text, nullable=True)
    estimated_bill = Column(Float, default=15000.0)
    status = Column(String(50), default="COMPLETED")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
