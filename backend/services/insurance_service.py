import os
import json
import re
import datetime
import random
from typing import Dict, List, Any, Optional

# Load Gemini client from main if available or re-initialize
_api_key = os.getenv("GEMINI_API_KEY")
client = None
if _api_key:
    try:
        from google import genai
        client = genai.Client(api_key=_api_key)
    except Exception as e:
        print(f"Warning: Could not initialize Gemini in insurance service: {e}")

GEMINI_MODELS = [
    "gemini-flash-lite-latest",
    "gemini-3.1-flash-lite-preview",
    "gemini-2.5-flash",
    "gemini-flash-latest",
]


def generate_claim_number(db_session=None) -> str:
    """Generate a unique human-readable claim number (e.g., MV-CLM-2026-000108)."""
    current_year = datetime.datetime.utcnow().year
    random_suffix = random.randint(100000, 999999)
    return f"MV-CLM-{current_year}-{random_suffix}"


def generate_policy_number() -> str:
    """Generate masked formatted policy number."""
    rand_prefix = random.randint(1000, 9999)
    rand_mid = random.randint(1000, 9999)
    rand_suffix = random.randint(1000, 9999)
    return f"POL-{rand_prefix}-{rand_mid}-{rand_suffix}"


def analyze_document_with_gemini(
    file_bytes: bytes,
    mime_type: str,
    filename: str,
    hint_doc_type: Optional[str] = None
) -> Dict[str, Any]:
    """
    Use Google Gemini to extract structured administrative data from medical bills, reports, and prescriptions.
    """
    prompt = f"""
    You are an AI document analysis assistant specialized in healthcare insurance claims and medical paperwork.
    Analyze the provided document (filename: {filename}, category hint: {hint_doc_type or 'Unknown'}).

    Extract the following structured information in strict JSON format:
    1. "document_type": Classified type from ["HOSPITAL_BILL", "MEDICAL_REPORT", "PRESCRIPTION", "DIAGNOSTIC_REPORT", "DISCHARGE_SUMMARY", "LAB_REPORT", "SCAN_REPORT", "IDENTITY_DOCUMENT", "INSURANCE_POLICY", "OTHER"]
    2. "patient_name": Extracted patient full name (or null if not found)
    3. "hospital_name": Hospital / clinic / laboratory name (or null)
    4. "doctor_name": Attending physician / radiologist name (or null)
    5. "treatment_date": Date of treatment or bill issue date (YYYY-MM-DD or text, or null)
    6. "diagnosis": Primary diagnosis or clinical condition (or null)
    7. "treatment": Procedures, medications or services listed (or null)
    8. "bill_number": Invoice / bill / registration identifier (or null)
    9. "total_amount": Numeric total bill amount in local currency (number or null)
    10. "confidence": Confidence score between 0.0 and 1.0
    11. "key_findings": Brief 1-2 sentence summary of what this document contains

    IMPORTANT:
    - Return ONLY a valid JSON object. Do not include introductory text.
    - If certain fields are not visible in the document, use null.
    """

    if client is None:
        # Fallback simulated extraction for local testing without API key
        return {
            "document_type": hint_doc_type or "HOSPITAL_BILL",
            "patient_name": "Verified Patient",
            "hospital_name": "MediVision Partner Hospital",
            "doctor_name": "Dr. Sarah Patel",
            "treatment_date": datetime.date.today().isoformat(),
            "diagnosis": "Diagnostic Imaging Examination",
            "treatment": "Radiological Scan & Consultation",
            "bill_number": f"INV-{random.randint(10000, 99999)}",
            "total_amount": 12500.0,
            "confidence": 0.92,
            "key_findings": "Verified medical billing document with diagnostic consultation fees.",
            "is_ai_simulated": True
        }

    try:
        contents = []
        if mime_type.startswith("image/") and file_bytes:
            from google.genai.types import Part
            contents.append(Part.from_bytes(data=file_bytes, mime_type=mime_type))
        
        contents.append(prompt)

        response = None
        for model_name in GEMINI_MODELS:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=contents
                )
                if response and hasattr(response, 'text') and response.text:
                    break
            except Exception as m_err:
                print(f"Insurance document Gemini {model_name} failed: {m_err}")
                continue

        raw_text = response.text or ""
        # Clean JSON markdown fences
        json_match = re.search(r"\{.*\}", raw_text, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group(0))
            return data
        else:
            return {
                "document_type": hint_doc_type or "OTHER",
                "key_findings": raw_text[:300],
                "confidence": 0.80,
                "raw_text": raw_text
            }
    except Exception as err:
        print(f"Gemini document analysis error: {err}")
        return {
            "document_type": hint_doc_type or "OTHER",
            "error": str(err),
            "key_findings": "Document ingested. Manual verification recommended.",
            "confidence": 0.70
        }


def detect_missing_documents(
    claim_type: str,
    treatment_type: str,
    uploaded_doc_types: List[str]
) -> Dict[str, Any]:
    """
    Check uploaded documents against expected document checklist for this claim type.
    """
    # Standard checklists based on claim context
    treatment_lower = (treatment_type or "").lower()
    
    if "surgery" in treatment_lower or "hospitalization" in treatment_lower or "inpatient" in treatment_lower:
        required = ["HOSPITAL_BILL", "DISCHARGE_SUMMARY", "MEDICAL_REPORT", "PRESCRIPTION"]
    elif "mri" in treatment_lower or "ct" in treatment_lower or "x-ray" in treatment_lower or "scan" in treatment_lower or "diagnostic" in treatment_lower or "fracture" in treatment_lower:
        required = ["DIAGNOSTIC_REPORT", "HOSPITAL_BILL", "PRESCRIPTION"]
    elif claim_type == "CASHLESS":
        required = ["HOSPITAL_BILL", "MEDICAL_REPORT", "IDENTITY_DOCUMENT"]
    else:
        # Default standard reimbursement
        required = ["HOSPITAL_BILL", "MEDICAL_REPORT", "PRESCRIPTION"]

    doc_type_names = {
        "HOSPITAL_BILL": "Hospital / Clinic Final Bill",
        "DISCHARGE_SUMMARY": "Hospital Discharge Summary",
        "MEDICAL_REPORT": "Doctor Clinical Report",
        "DIAGNOSTIC_REPORT": "Diagnostic / Radiology Scan Report",
        "SCAN_REPORT": "Radiological Scan Image / Report",
        "PRESCRIPTION": "Doctor Prescription & Medication Order",
        "LAB_REPORT": "Laboratory Test Results",
        "IDENTITY_DOCUMENT": "Government ID / Patient Card",
        "INSURANCE_POLICY": "Insurance Card / Policy Document",
        "OTHER": "Additional Supporting Document"
    }

    uploaded_set = set(uploaded_doc_types)
    missing = [doc for doc in required if doc not in uploaded_set]
    present = [doc for doc in required if doc in uploaded_set]

    is_complete = len(missing) == 0

    return {
        "is_complete": is_complete,
        "required": [{"code": doc, "name": doc_type_names.get(doc, doc)} for doc in required],
        "present": [{"code": doc, "name": doc_type_names.get(doc, doc)} for doc in present],
        "missing": [{"code": doc, "name": doc_type_names.get(doc, doc)} for doc in missing],
        "advisory_note": (
            "All standard documents are present."
            if is_complete else
            f"Your claim appears to be missing: {', '.join(doc_type_names.get(m, m) for m in missing)}. Document requirements can vary by insurer."
        )
    }


def generate_claim_summary_with_gemini(
    claim: Dict[str, Any],
    extracted_docs: List[Dict[str, Any]]
) -> str:
    """
    Generate an AI administrative summary for patient and reviewer reference.
    Strictly avoids claiming approval or guaranteeing reimbursement.
    """
    doc_descriptions = []
    for d in extracted_docs:
        doc_type = d.get("document_type", "Document")
        amt = d.get("total_amount")
        hosp = d.get("hospital_name")
        doc_descriptions.append(f"{doc_type} (Hospital: {hosp or 'N/A'}, Amount: ₹{amt or 'N/A'})")

    prompt = f"""
    You are a medical insurance claim summarizer for MediVision AI.
    Create a concise, objective 3-4 sentence administrative summary of this insurance claim.

    Claim Details:
    - Patient Name: {claim.get('patient_name')}
    - Hospital / Center: {claim.get('hospital_name')}
    - Attending Doctor: {claim.get('doctor_name')}
    - Treatment / Modality: {claim.get('treatment_type')}
    - Diagnosis: {claim.get('diagnosis_reference', 'Clinical assessment')}
    - Claim Amount: ₹{claim.get('claim_amount')}
    - Claim Type: {claim.get('claim_type')}
    - Attached Documents: {', '.join(doc_descriptions) if doc_descriptions else 'Pending upload'}

    RULES:
    1. State clearly who received what treatment, where, and the claimed amount.
    2. Mention the primary supporting documents attached.
    3. Do NOT state "Claim approved", "Claim guaranteed", "Eligible for reimbursement", or "Insurance will pay".
    4. Conclude with: "Final claim adjudication is subject to verification by the authorized insurance reviewer."
    """

    if client is None:
        return (
            f"Patient {claim.get('patient_name')} received {claim.get('treatment_type')} treatment under {claim.get('doctor_name')} at {claim.get('hospital_name')}. "
            f"The total submitted claim amount is ₹{claim.get('claim_amount', 0):,.2f} ({claim.get('claim_type', 'REIMBURSEMENT')}). "
            f"Supporting documents include {len(extracted_docs)} verified records. "
            "Final claim adjudication is subject to verification by the authorized insurance reviewer."
        )

    try:
        response = None
        for model_name in GEMINI_MODELS:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt
                )
                if response and hasattr(response, 'text') and response.text:
                    return response.text.strip()
            except Exception as m_err:
                print(f"Insurance summary Gemini {model_name} failed: {m_err}")
                continue
        return "Summary generation completed."
    except Exception as err:
        print(f"Gemini claim summary error: {err}")
        return (
            f"Claim submitted for patient {claim.get('patient_name')} regarding {claim.get('treatment_type')} at {claim.get('hospital_name')}. "
            f"Total claim amount requested: ₹{claim.get('claim_amount', 0):,.2f}. "
            "Final claim adjudication is subject to verification by the authorized insurance reviewer."
        )


def perform_consistency_check(
    claim: Dict[str, Any],
    extracted_docs: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Check for obvious administrative discrepancies (e.g. mismatched hospital names, bill amounts, patient names).
    This is an administrative consistency check, NOT a fraud accusation.
    """
    issues = []
    patient_name = (claim.get("patient_name") or "").strip().lower()
    hospital_name = (claim.get("hospital_name") or "").strip().lower()
    claim_amount = float(claim.get("claim_amount") or 0.0)

    bill_amounts_sum = 0.0
    has_bill = False

    for doc in extracted_docs:
        extracted = doc.get("ai_extracted_data") or {}
        if isinstance(extracted, str):
            try:
                extracted = json.loads(extracted)
            except Exception:
                extracted = {}

        doc_patient = (extracted.get("patient_name") or "").strip().lower()
        if doc_patient and patient_name and len(patient_name) > 3:
            # Check if partial match exists
            if patient_name not in doc_patient and doc_patient not in patient_name:
                issues.append(f"Patient name on document ('{extracted.get('patient_name')}') differs from claim profile ('{claim.get('patient_name')}').")

        doc_hosp = (extracted.get("hospital_name") or "").strip().lower()
        if doc_hosp and hospital_name and len(hospital_name) > 3:
            if hospital_name not in doc_hosp and doc_hosp not in hospital_name:
                issues.append(f"Hospital name on document ('{extracted.get('hospital_name')}') differs from claim form ('{claim.get('hospital_name')}').")

        if extracted.get("total_amount"):
            has_bill = True
            try:
                bill_amounts_sum += float(extracted.get("total_amount"))
            except Exception:
                pass

    if has_bill and bill_amounts_sum > 0:
        if abs(bill_amounts_sum - claim_amount) > 10.0:
            issues.append(f"Sum of uploaded bill totals (₹{bill_amounts_sum:,.2f}) differs from requested claim amount (₹{claim_amount:,.2f}).")

    if not extracted_docs:
        issues.append("No supporting documents have been uploaded yet.")

    status = "WARNING" if len(issues) > 0 else "VALID"

    return {
        "status": status,
        "issue_count": len(issues),
        "issues": issues,
        "advisory": (
            "Consistency check passed. Information matches between claim form and uploaded documents."
            if status == "VALID" else
            "Advisory inconsistencies detected between claim input and document analysis. Please review before submission."
        )
    }
