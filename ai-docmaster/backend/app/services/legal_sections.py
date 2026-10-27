"""
Legal Section Recommendation Service
Suggests applicable:
  - BNS (Bharatiya Nyaya Sanhita 2023) / IPC sections
  - CrPC / BNSS sections
  - Relevant Acts
  - Constitutional Articles

Uses a curated static knowledge base + LLM enrichment.
"""
from __future__ import annotations
import json
from typing import Dict, Any, List, Optional
from loguru import logger
from app.services.llm_client import get_llm_response

# ── Static Knowledge Base ─────────────────────────────────────────────────────
# Maps case category to commonly applicable sections
SECTION_KB: Dict[str, Dict[str, List[Dict]]] = {
    "Criminal": {
        "bns_sections": [
            {"section": "BNS §103", "description": "Murder", "old_ipc": "IPC 302"},
            {"section": "BNS §304", "description": "Theft", "old_ipc": "IPC 378"},
            {"section": "BNS §310", "description": "Robbery", "old_ipc": "IPC 390"},
            {"section": "BNS §115", "description": "Voluntarily causing hurt", "old_ipc": "IPC 323"},
            {"section": "BNS §64", "description": "Rape", "old_ipc": "IPC 376"},
            {"section": "BNS §85", "description": "Husband/relative cruelty", "old_ipc": "IPC 498A"},
            {"section": "BNS §316", "description": "Criminal breach of trust", "old_ipc": "IPC 406"},
            {"section": "BNS §318", "description": "Cheating", "old_ipc": "IPC 420"},
            {"section": "BNS §336", "description": "Forgery", "old_ipc": "IPC 463"},
        ],
        "crpc_sections": [
            {"section": "BNSS §173", "description": "FIR registration"},
            {"section": "BNSS §436", "description": "Bail in bailable offences"},
            {"section": "BNSS §437", "description": "Bail in non-bailable offences"},
            {"section": "BNSS §167", "description": "Remand procedure"},
        ],
        "acts": [
            "Protection of Women from Domestic Violence Act, 2005",
            "SC/ST (Prevention of Atrocities) Act, 1989",
            "POCSO Act, 2012",
        ],
        "constitutional_articles": ["Article 20", "Article 21", "Article 22"],
    },
    "Property Dispute": {
        "bns_sections": [
            {"section": "BNS §329", "description": "Criminal trespass", "old_ipc": "IPC 441"},
            {"section": "BNS §331", "description": "House trespass", "old_ipc": "IPC 448"},
            {"section": "BNS §303", "description": "Dishonest misappropriation", "old_ipc": "IPC 403"},
        ],
        "civil_sections": [
            {"section": "CPC Order 39 Rules 1 & 2", "description": "Temporary injunction"},
            {"section": "Specific Relief Act §38", "description": "Perpetual injunction"},
            {"section": "Transfer of Property Act §54", "description": "Sale of immovable property"},
            {"section": "Limitation Act §65", "description": "Adverse possession (12 years)"},
        ],
        "acts": [
            "Transfer of Property Act, 1882",
            "Registration Act, 1908",
            "Specific Relief Act, 1963",
            "Land Acquisition Act, 2013",
            "Real Estate (Regulation and Development) Act, 2016 (RERA)",
        ],
        "constitutional_articles": ["Article 300A"],
    },
    "Family Law": {
        "acts": [
            "Hindu Marriage Act, 1955",
            "Special Marriage Act, 1954",
            "Hindu Succession Act, 1956",
            "Hindu Minority and Guardianship Act, 1956",
            "Muslim Personal Law (Shariat) Application Act, 1937",
            "Protection of Women from Domestic Violence Act, 2005",
            "Maintenance and Welfare of Parents and Senior Citizens Act, 2007",
        ],
        "civil_sections": [
            {"section": "HMA §13", "description": "Grounds for divorce"},
            {"section": "HMA §24", "description": "Maintenance pendente lite"},
            {"section": "CrPC §125 / BNSS §144", "description": "Maintenance to wife/children"},
            {"section": "Guardian and Wards Act §17", "description": "Best interest of child"},
        ],
        "constitutional_articles": ["Article 14", "Article 15", "Article 21"],
    },
    "Labour & Employment": {
        "acts": [
            "Industrial Disputes Act, 1947",
            "Employees' Provident Funds Act, 1952",
            "Payment of Gratuity Act, 1972",
            "Payment of Wages Act, 1936",
            "Minimum Wages Act, 1948",
            "Workmen's Compensation Act, 1923",
            "Sexual Harassment of Women at Workplace Act, 2013 (POSH)",
            "Shops and Establishments Acts (State-specific)",
        ],
        "civil_sections": [
            {"section": "IDA §25F", "description": "Conditions for retrenchment"},
            {"section": "IDA §10", "description": "Reference of dispute to tribunal"},
        ],
        "constitutional_articles": ["Article 14", "Article 19(1)(c)", "Article 43"],
    },
    "Consumer Dispute": {
        "acts": [
            "Consumer Protection Act, 2019",
            "Insurance Regulatory and Development Authority Act, 1999",
            "Banking Regulation Act, 1949",
        ],
        "civil_sections": [
            {"section": "CPA §2(7)", "description": "Definition of consumer"},
            {"section": "CPA §35", "description": "Complaint before district commission"},
            {"section": "CPA §47", "description": "Jurisdiction of state commission"},
        ],
        "constitutional_articles": ["Article 19(1)(g)", "Article 21"],
    },
    "Civil": {
        "civil_sections": [
            {"section": "CPC Order 7", "description": "Plaint"},
            {"section": "CPC Order 8", "description": "Written statement"},
            {"section": "CPC §9", "description": "Courts to try all civil suits"},
            {"section": "Limitation Act §3", "description": "Bar of limitation"},
            {"section": "Specific Relief Act §10", "description": "Specific performance of contracts"},
        ],
        "acts": [
            "Indian Contract Act, 1872",
            "Specific Relief Act, 1963",
            "Limitation Act, 1963",
            "Code of Civil Procedure, 1908",
        ],
        "constitutional_articles": ["Article 14", "Article 21"],
    },
    "Constitutional/Public Law": {
        "constitutional_articles": [
            "Article 12 — Definition of State",
            "Article 13 — Laws inconsistent with Fundamental Rights",
            "Article 14 — Equality before law",
            "Article 19 — Freedom of speech etc.",
            "Article 21 — Protection of life and personal liberty",
            "Article 32 — Writ jurisdiction of Supreme Court",
            "Article 226 — Writ jurisdiction of High Court",
        ],
        "acts": [
            "Administrative Tribunals Act, 1985",
            "Right to Information Act, 2005",
            "Right to Education Act, 2009",
        ],
    },
    "Cyber Crime": {
        "acts": [
            "Information Technology Act, 2000",
            "IT (Amendment) Act, 2008",
        ],
        "bns_sections": [
            {"section": "BNS §318", "description": "Cheating (online fraud)", "old_ipc": "IPC 420"},
        ],
        "it_sections": [
            {"section": "IT Act §66", "description": "Computer related offences"},
            {"section": "IT Act §66C", "description": "Identity theft"},
            {"section": "IT Act §66D", "description": "Cheating by impersonation using computer"},
            {"section": "IT Act §67", "description": "Obscene material online"},
            {"section": "IT Act §43", "description": "Penalty for damage to computer"},
        ],
    },
}


async def suggest_legal_sections(description: str, category: Optional[str]) -> Dict[str, Any]:
    """
    Returns curated static sections for the category, then optionally enriches
    with LLM-specific suggestions based on the actual case description.
    """
    # If category not provided, derive it from keywords
    if not category:
        from app.services.case_classifier import classify_case
        classified = await classify_case(description)
        category = classified.get("category", "Civil")

    # Get static base sections
    base = SECTION_KB.get(category, SECTION_KB.get("Civil", {}))

    # LLM enrichment for specific section recommendations
    llm_suggestions = await _llm_section_enrich(description, category, base)

    return {
        "category": category,
        "static_sections": base,
        "ai_specific_suggestions": llm_suggestions,
    }


async def _llm_section_enrich(
    description: str,
    category: str,
    base_sections: Dict,
) -> List[Dict]:
    system = (
        "You are an expert Indian lawyer with 20 years of experience. "
        "Identify the most relevant legal sections for this specific case. "
        "Respond with valid JSON only."
    )
    user = f"""Case Category: {category}
Case Description: \"\"\"{description}\"\"\"

Based on the base sections available: {json.dumps(list(base_sections.keys()))}

Identify the TOP 5 most relevant specific sections for this case. Include:
- Section number and Act name
- Why it applies to this specific case
- Whether it helps the plaintiff or is important for defense

Respond ONLY with JSON:
{{
  "top_sections": [
    {{
      "section": "BNS §103",
      "act": "Bharatiya Nyaya Sanhita, 2023",
      "description": "...",
      "relevance": "...",
      "applicability": "prosecution | defense | both"
    }}
  ]
}}"""
    try:
        raw = await get_llm_response(system, user, temperature=0.2, json_mode=True)
        parsed = json.loads(raw)
        return parsed.get("top_sections", [])
    except Exception as e:
        logger.error(f"[LegalSections] LLM enrich failed: {e}")
        return []
