"""
Document Checklist Generation Service
Returns the list of documents a citizen should collect
before approaching court/lawyer, based on case category.
Also uses LLM to add case-specific documents.
"""
from __future__ import annotations
import json
from typing import Dict, Any, List, Optional
from loguru import logger
from app.services.llm_client import get_llm_response

# ── Static checklists ─────────────────────────────────────────────────────────
DOCUMENT_CHECKLISTS: Dict[str, List[Dict]] = {
    "Criminal": [
        {"name": "Aadhaar Card / Voter ID", "purpose": "Identity proof of complainant", "mandatory": True},
        {"name": "FIR Copy", "purpose": "Official record of complaint filed with police", "mandatory": True},
        {"name": "Police Investigation Report", "purpose": "Status report from investigating officer", "mandatory": False},
        {"name": "Medical Report (if assault)", "purpose": "Evidence of physical injury", "mandatory": False},
        {"name": "Witness Statements", "purpose": "Supporting evidence from witnesses", "mandatory": False},
        {"name": "CCTV / Photographs / Videos", "purpose": "Visual evidence of the incident", "mandatory": False},
        {"name": "Prior Complaint Records", "purpose": "History of previous complaints", "mandatory": False},
        {"name": "Bail Application Documents", "purpose": "Required if seeking bail", "mandatory": False},
    ],
    "Property Dispute": [
        {"name": "Aadhaar Card / Passport", "purpose": "Identity proof", "mandatory": True},
        {"name": "Sale Deed / Gift Deed", "purpose": "Proof of ownership transfer", "mandatory": True},
        {"name": "Registered Title Document", "purpose": "Registered title in owner's name", "mandatory": True},
        {"name": "Encumbrance Certificate (EC)", "purpose": "Confirms no pending liabilities", "mandatory": True},
        {"name": "Property Tax Receipts (last 5 years)", "purpose": "Proof of continuous possession", "mandatory": True},
        {"name": "Survey / Sketch Plan", "purpose": "Land boundary and area details", "mandatory": True},
        {"name": "Possession Certificate", "purpose": "Confirms physical possession", "mandatory": False},
        {"name": "Ration Card / Utility Bills", "purpose": "Proof of residence/occupancy", "mandatory": False},
        {"name": "Witness Affidavits", "purpose": "Supporting declarations", "mandatory": False},
        {"name": "Patta / Chitta (if applicable)", "purpose": "Revenue records for agricultural land", "mandatory": False},
    ],
    "Family Law": [
        {"name": "Marriage Certificate", "purpose": "Proof of legal marriage", "mandatory": True},
        {"name": "Aadhaar Card / Voter ID", "purpose": "Identity proof of both parties", "mandatory": True},
        {"name": "Wedding Photographs", "purpose": "Evidence of marriage ceremony", "mandatory": False},
        {"name": "Birth Certificate of Children", "purpose": "Required for custody matters", "mandatory": False},
        {"name": "Income Proof (Salary Slips / ITR)", "purpose": "For maintenance/alimony calculation", "mandatory": True},
        {"name": "Bank Statements (6 months)", "purpose": "Financial disclosure", "mandatory": True},
        {"name": "Property Documents", "purpose": "For division of assets", "mandatory": False},
        {"name": "Medical Records (if domestic violence)", "purpose": "Evidence of abuse/injuries", "mandatory": False},
        {"name": "Communication Records (WhatsApp/Emails)", "purpose": "Evidence of behavior", "mandatory": False},
    ],
    "Labour & Employment": [
        {"name": "Appointment Letter / Offer Letter", "purpose": "Proof of employment contract", "mandatory": True},
        {"name": "Salary Slips (last 6 months)", "purpose": "Proof of salary and deductions", "mandatory": True},
        {"name": "Termination Letter (if dismissed)", "purpose": "Reason for termination", "mandatory": True},
        {"name": "Employee ID / Company ID Card", "purpose": "Proof of employment", "mandatory": True},
        {"name": "PF / ESIC Statement", "purpose": "Proof of provident fund contributions", "mandatory": False},
        {"name": "Performance Appraisals / Increment Letters", "purpose": "Evidence of work performance", "mandatory": False},
        {"name": "Complaint Records (HR communications)", "purpose": "Evidence of prior complaints", "mandatory": False},
        {"name": "Bank Account Statements", "purpose": "Proof of salary credits / non-payment", "mandatory": True},
    ],
    "Consumer Dispute": [
        {"name": "Purchase Receipt / Invoice", "purpose": "Proof of purchase", "mandatory": True},
        {"name": "Product / Service Contract", "purpose": "Terms of purchase", "mandatory": True},
        {"name": "Warranty / Guarantee Card", "purpose": "Manufacturer's commitment", "mandatory": False},
        {"name": "Photographs of Defect", "purpose": "Visual evidence of defective product", "mandatory": False},
        {"name": "Complaint Letters to Company", "purpose": "Evidence of prior complaint", "mandatory": True},
        {"name": "Company's Response / Rejection Letter", "purpose": "Proof company refused to resolve", "mandatory": False},
        {"name": "Medical Bills (if injury from product)", "purpose": "Consequential damage proof", "mandatory": False},
        {"name": "Insurance Policy (if applicable)", "purpose": "For insurance disputes", "mandatory": False},
    ],
    "Civil": [
        {"name": "Aadhaar Card / Identity Proof", "purpose": "Identity of both parties", "mandatory": True},
        {"name": "Contract / Agreement Copy", "purpose": "The disputed contract", "mandatory": True},
        {"name": "Correspondence Records (emails/letters)", "purpose": "Evidence of breach", "mandatory": True},
        {"name": "Payment Proofs / Bank Transfers", "purpose": "Evidence of financial transactions", "mandatory": False},
        {"name": "Witness Affidavits", "purpose": "Supporting statements", "mandatory": False},
        {"name": "Earlier Court Orders (if any)", "purpose": "Prior litigation history", "mandatory": False},
    ],
    "Cyber Crime": [
        {"name": "Aadhaar Card / Identity Proof", "purpose": "Identity proof", "mandatory": True},
        {"name": "Screenshots of Conversation / Fraud", "purpose": "Primary digital evidence", "mandatory": True},
        {"name": "Bank Transaction Records", "purpose": "Proof of financial loss", "mandatory": True},
        {"name": "Email/SMS/Chat Records (exported)", "purpose": "Evidence of cyber fraud", "mandatory": True},
        {"name": "Cybercrime Complaint Number (if filed)", "purpose": "Reference for online complaint", "mandatory": False},
        {"name": "Device details (IMEI, IP address logs)", "purpose": "Technical evidence", "mandatory": False},
        {"name": "Social Media Profile Links", "purpose": "Evidence of cyberbullying/impersonation", "mandatory": False},
    ],
    "Constitutional/Public Law": [
        {"name": "Identity Proof", "purpose": "Proof of locus standi", "mandatory": True},
        {"name": "Government Order / Notification", "purpose": "The impugned government action", "mandatory": True},
        {"name": "Communication with Authority", "purpose": "Evidence of approaching authority first", "mandatory": True},
        {"name": "Affected Party Declarations", "purpose": "Evidence of harm suffered", "mandatory": True},
        {"name": "Legal Notice (if sent)", "purpose": "Prior notice to authority", "mandatory": False},
    ],
}


async def get_document_checklist(category: str, description: Optional[str] = None) -> Dict[str, Any]:
    base_list = DOCUMENT_CHECKLISTS.get(category, DOCUMENT_CHECKLISTS.get("Civil", []))

    # LLM adds case-specific additional documents
    additional = []
    if description:
        additional = await _llm_additional_docs(category, description, base_list)

    mandatory = [d for d in base_list if d["mandatory"]]
    optional = [d for d in base_list if not d["mandatory"]]

    return {
        "category": category,
        "mandatory_documents": mandatory,
        "optional_documents": optional,
        "ai_additional_documents": additional,
        "total_count": len(base_list) + len(additional),
        "preparation_tips": _preparation_tips(category),
    }


async def _llm_additional_docs(category: str, description: str, base_docs: List[Dict]) -> List[Dict]:
    existing = [d["name"] for d in base_docs]
    system = "You are an expert Indian lawyer helping a client prepare documents for their case."
    user = f"""Category: {category}
Case Description: \"\"\"{description[:400]}\"\"\"

Existing required documents: {', '.join(existing[:8])}

Based on this specific case, suggest 2-3 ADDITIONAL documents not in the existing list that would specifically strengthen this case.

Respond ONLY with JSON:
{{
  "additional_documents": [
    {{
      "name": "Document name",
      "purpose": "Why this specific document is needed",
      "mandatory": true/false
    }}
  ]
}}"""
    try:
        raw = await get_llm_response(system, user, temperature=0.2, json_mode=True)
        parsed = json.loads(raw)
        return parsed.get("additional_documents", [])
    except Exception as e:
        logger.error(f"[Checklist] LLM error: {e}")
        return []


def _preparation_tips(category: str) -> List[str]:
    tips = {
        "Criminal": [
            "File an FIR at the nearest police station immediately",
            "Keep original documents and provide notarized copies to lawyer",
            "Do not tamper with or lose any evidence",
            "Get medical examination done within 24 hours if physically assaulted",
        ],
        "Property Dispute": [
            "Get an EC (Encumbrance Certificate) for the last 30 years",
            "Survey land boundaries officially before filing",
            "Keep all original documents — do not hand originals to anyone",
            "Register all documents at the Sub-Registrar Office",
        ],
        "Family Law": [
            "File for maintenance under Section 125 CrPC at the earliest",
            "Keep records of all financial transactions with spouse",
            "Children's school records and medical records are important for custody",
            "Seek protection order under DV Act if facing domestic violence",
        ],
        "Labour & Employment": [
            "Send a legal notice to employer before filing complaint",
            "File complaint with Labour Commissioner within limitation period",
            "Preserve all digital communications (emails, WhatsApp)",
            "Check your employment contract carefully for arbitration clauses",
        ],
        "Consumer Dispute": [
            "File complaint within 2 years of cause of action",
            "Send registered legal notice to company first",
            "District Commission handles claims up to ₹50 lakhs",
            "Keep all original bills, receipts and warranty cards",
        ],
        "Civil": [
            "Check limitation period before filing suit",
            "Send legal notice 30-60 days before filing suit",
            "Keep all written correspondence documented",
            "Consider mediation/arbitration as faster alternatives",
        ],
    }
    return tips.get(category, [
        "Consult a qualified advocate before proceeding",
        "Keep all original documents safely",
        "Maintain a record of all events with dates",
    ])
