"""
Case Classification Service
Uses a two-stage approach:
  1. Fast rule/keyword classifier (no API cost, instant)
  2. LLM refinement for ambiguous cases

Returns:
  {
    "category": "Property Dispute",
    "sub_category": "Land Encroachment",
    "confidence": 0.91,
    "keywords_matched": ["land", "neighbor", "boundary"],
    "method": "keyword | llm"
  }
"""
from __future__ import annotations
import re
from typing import Dict, Any
from loguru import logger
from app.services.llm_client import get_llm_response
import json

# ── Keyword taxonomy ──────────────────────────────────────────────────────────
LEGAL_CATEGORIES: Dict[str, Dict[str, Any]] = {
    "Criminal": {
        "keywords": [
            "murder", "theft", "robbery", "assault", "rape", "harassment",
            "kidnap", "fraud", "forgery", "extortion", "fir", "police",
            "arrest", "bail", "custody", "accused", "victim", "ipc", "bns",
            "dowry", "domestic violence", "abetment", "cheating",
        ],
        "sub_categories": {
            "Murder/Homicide": ["murder", "killing", "homicide", "death"],
            "Theft/Robbery": ["theft", "stolen", "robbery", "burglary"],
            "Sexual Offence": ["rape", "sexual assault", "molestation", "harassment"],
            "Domestic Violence": ["domestic", "wife", "husband", "dowry", "cruelty"],
            "Fraud/Cheating": ["fraud", "cheating", "forgery", "embezzlement"],
            "General Criminal": [],
        },
    },
    "Property Dispute": {
        "keywords": [
            "property", "land", "house", "boundary", "encroach", "trespass",
            "sale deed", "title", "ownership", "tenant", "landlord", "rent",
            "eviction", "lease", "mortgage", "registry", "mutation",
        ],
        "sub_categories": {
            "Land Encroachment": ["encroach", "boundary", "land", "fence"],
            "Rent/Tenancy": ["rent", "tenant", "landlord", "eviction", "lease"],
            "Ownership Dispute": ["ownership", "title", "sale deed", "registry"],
            "General Property": [],
        },
    },
    "Family Law": {
        "keywords": [
            "divorce", "marriage", "custody", "alimony", "maintenance",
            "adoption", "succession", "will", "inheritance", "guardian",
            "child", "spouse", "matrimonial", "separation",
        ],
        "sub_categories": {
            "Divorce": ["divorce", "separation", "matrimonial"],
            "Child Custody": ["custody", "child", "guardian"],
            "Maintenance/Alimony": ["maintenance", "alimony", "support"],
            "Succession": ["will", "inheritance", "succession"],
            "General Family": [],
        },
    },
    "Labour & Employment": {
        "keywords": [
            "salary", "wage", "employment", "termination", "dismiss",
            "labour", "worker", "employer", "provident fund", "pf",
            "gratuity", "compensation", "unfair", "workplace", "union",
        ],
        "sub_categories": {
            "Wrongful Termination": ["termination", "dismiss", "fired", "sacked"],
            "Wage Dispute": ["salary", "wage", "arrears", "payment"],
            "Workplace Harassment": ["harassment", "workplace", "hostile"],
            "General Labour": [],
        },
    },
    "Consumer Dispute": {
        "keywords": [
            "consumer", "product", "defective", "refund", "deficiency",
            "service", "company", "brand", "complaint", "forum",
            "compensation", "insurance", "bank",
        ],
        "sub_categories": {
            "Defective Product": ["defective", "product", "faulty"],
            "Service Deficiency": ["service", "deficiency", "poor service"],
            "Insurance Claim": ["insurance", "claim", "policy"],
            "General Consumer": [],
        },
    },
    "Civil": {
        "keywords": [
            "contract", "agreement", "breach", "damages", "debt",
            "loan", "recovery", "injunction", "partition", "decree",
            "suit", "plaint", "defendant", "plaintiff",
        ],
        "sub_categories": {
            "Contract Dispute": ["contract", "agreement", "breach"],
            "Debt Recovery": ["debt", "loan", "recovery", "money"],
            "Injunction": ["injunction", "stay", "restraint"],
            "General Civil": [],
        },
    },
    "Constitutional/Public Law": {
        "keywords": [
            "fundamental right", "constitutional", "writ", "habeas corpus",
            "mandamus", "certiorari", "public", "government", "authority",
            "discrimination", "article 14", "article 21", "pil",
        ],
        "sub_categories": {
            "Writ Petition": ["writ", "habeas corpus", "mandamus"],
            "PIL": ["pil", "public interest"],
            "Fundamental Rights": ["fundamental right", "article 21", "article 14"],
            "General Constitutional": [],
        },
    },
    "Cyber Crime": {
        "keywords": [
            "cyber", "online", "hacking", "phishing", "scam", "social media",
            "email", "identity theft", "data breach", "pornography", "morphed",
        ],
        "sub_categories": {
            "Online Fraud": ["fraud", "scam", "phishing"],
            "Hacking": ["hacking", "data breach", "unauthorized access"],
            "Cyberbullying": ["cyberbullying", "social media", "morphed"],
            "General Cyber": [],
        },
    },
}

CONFIDENCE_THRESHOLD = 0.45


def _keyword_classify(text: str) -> Dict[str, Any]:
    text_lower = text.lower()
    tokens = set(re.findall(r"\b\w+\b", text_lower))
    scores: Dict[str, float] = {}
    matched_keywords: Dict[str, list] = {}

    for category, data in LEGAL_CATEGORIES.items():
        hits = [kw for kw in data["keywords"] if kw in text_lower]
        if hits:
            scores[category] = len(hits) / len(data["keywords"])
            matched_keywords[category] = hits

    if not scores:
        return {"category": None, "confidence": 0.0, "keywords_matched": []}

    best = max(scores, key=scores.get)
    confidence = min(scores[best] * 3.5, 1.0)   # normalize

    # Sub-category detection
    sub_category = _detect_sub_category(best, text_lower)

    return {
        "category": best,
        "sub_category": sub_category,
        "confidence": round(confidence, 3),
        "keywords_matched": matched_keywords.get(best, []),
        "all_scores": {k: round(v, 3) for k, v in sorted(scores.items(), key=lambda x: -x[1])},
    }


def _detect_sub_category(category: str, text: str) -> str:
    subs = LEGAL_CATEGORIES.get(category, {}).get("sub_categories", {})
    for sub_name, sub_keywords in subs.items():
        if sub_keywords and any(kw in text for kw in sub_keywords):
            return sub_name
    # Return the "General ..." fallback
    for sub_name in subs:
        if "general" in sub_name.lower():
            return sub_name
    return category


async def classify_case(description: str) -> Dict[str, Any]:
    """Main entry point — fast keyword first, LLM fallback.
    spaCy is optional; keyword + LLM classification works without it.
    """
    keyword_result = _keyword_classify(description)

    if keyword_result["confidence"] >= CONFIDENCE_THRESHOLD:
        keyword_result["method"] = "keyword"
        logger.debug(f"[Classifier] Keyword match: {keyword_result['category']} ({keyword_result['confidence']})")
        return keyword_result

    # Low confidence → ask LLM
    logger.debug("[Classifier] Low confidence — falling back to LLM")
    return await _llm_classify(description, keyword_result)


async def _llm_classify(description: str, keyword_hint: Dict[str, Any]) -> Dict[str, Any]:
    categories = list(LEGAL_CATEGORIES.keys())
    system = (
        "You are an expert Indian legal assistant. "
        "Classify legal cases accurately. Always respond with valid JSON only."
    )
    user = f"""Classify the following legal case description into one of these categories:
{', '.join(categories)}

Case description:
\"\"\"{description}\"\"\"

Respond ONLY with a JSON object like:
{{
  "category": "<category name>",
  "sub_category": "<specific sub-type>",
  "confidence": <0.0-1.0>,
  "reasoning": "<one sentence explanation>"
}}
"""
    try:
        raw = await get_llm_response(system, user, temperature=0.1, json_mode=True)
        result = json.loads(raw)
        result["method"] = "llm"
        result["keywords_matched"] = keyword_hint.get("keywords_matched", [])
        return result
    except Exception as e:
        logger.error(f"[Classifier] LLM parse error: {e}")
        return {
            "category": keyword_hint.get("category") or "General",
            "sub_category": keyword_hint.get("sub_category") or "General",
            "confidence": 0.3,
            "method": "fallback",
            "keywords_matched": keyword_hint.get("keywords_matched", []),
        }
