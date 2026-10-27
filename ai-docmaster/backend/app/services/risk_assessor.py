"""
Risk Assessment Service
Estimates:
  - Case complexity (Low / Medium / High / Very High)
  - Estimated timeline (months)
  - Likelihood of settlement vs trial
  - Preliminary strength assessment
  - Recommended first steps
"""
from __future__ import annotations
import json
from typing import Dict, Any, Optional
from loguru import logger
from app.services.llm_client import get_llm_response

# Static heuristics per category
CATEGORY_BASELINES = {
    "Criminal": {
        "avg_timeline_months": 24,
        "settlement_probability": 0.20,
        "complexity": "High",
        "notes": "Criminal cases involve investigation, chargesheet, trial, and appeal stages.",
    },
    "Property Dispute": {
        "avg_timeline_months": 36,
        "settlement_probability": 0.45,
        "complexity": "High",
        "notes": "Property disputes often involve survey, title search, and multiple hearings.",
    },
    "Family Law": {
        "avg_timeline_months": 18,
        "settlement_probability": 0.65,
        "complexity": "Medium",
        "notes": "Family cases often resolve through mediation. Divorce takes minimum 6 months.",
    },
    "Labour & Employment": {
        "avg_timeline_months": 12,
        "settlement_probability": 0.55,
        "complexity": "Medium",
        "notes": "Labour tribunals are faster. Many cases settle at conciliation stage.",
    },
    "Consumer Dispute": {
        "avg_timeline_months": 8,
        "settlement_probability": 0.60,
        "complexity": "Low",
        "notes": "Consumer forums are designed for quick disposal. Average 6-9 months.",
    },
    "Civil": {
        "avg_timeline_months": 30,
        "settlement_probability": 0.50,
        "complexity": "Medium",
        "notes": "Civil suits vary widely. Simple suits take 1-2 years, complex ones 5+ years.",
    },
    "Cyber Crime": {
        "avg_timeline_months": 18,
        "settlement_probability": 0.25,
        "complexity": "High",
        "notes": "Cyber cases require technical investigation and forensic evidence.",
    },
    "Constitutional/Public Law": {
        "avg_timeline_months": 24,
        "settlement_probability": 0.15,
        "complexity": "Very High",
        "notes": "Constitutional matters involve complex legal arguments and may reach Supreme Court.",
    },
}


async def assess_risk(case_description: str, category: Optional[str]) -> Dict[str, Any]:
    baseline = CATEGORY_BASELINES.get(category or "Civil", CATEGORY_BASELINES["Civil"])

    llm_assessment = await _llm_risk_analysis(case_description, category, baseline)

    return {
        "category": category,
        "baseline": baseline,
        "ai_assessment": llm_assessment,
        "disclaimer": (
            "This risk assessment is for informational purposes only and does not constitute "
            "legal advice. Actual outcomes depend on specific facts, evidence, and judicial discretion."
        ),
    }


async def _llm_risk_analysis(
    description: str,
    category: Optional[str],
    baseline: Dict,
) -> Dict[str, Any]:
    system = (
        "You are an experienced Indian legal analyst providing preliminary case assessments. "
        "Be honest, balanced, and practical. Respond with valid JSON only."
    )
    user = f"""Analyze this legal case:
Category: {category or 'Unknown'}
Baseline timeline: {baseline['avg_timeline_months']} months
Baseline complexity: {baseline['complexity']}

Case Description:
\"\"\"{description[:500]}\"\"\"

Provide a preliminary risk and viability assessment. Respond ONLY with JSON:
{{
  "complexity_score": 1-10,
  "complexity_label": "Low|Medium|High|Very High",
  "estimated_timeline_months": {{
    "optimistic": <number>,
    "realistic": <number>,
    "pessimistic": <number>
  }},
  "settlement_likelihood": "Low|Medium|High",
  "case_strength_indicators": {{
    "strengths": ["point 1", "point 2"],
    "weaknesses": ["point 1", "point 2"],
    "key_risks": ["risk 1", "risk 2"]
  }},
  "recommended_first_steps": ["step 1", "step 2", "step 3"],
  "court_level": "District Court|High Court|Supreme Court|Tribunal",
  "urgency_flag": true/false,
  "urgency_reason": "reason if urgent, else null"
}}"""
    try:
        raw = await get_llm_response(system, user, temperature=0.3, json_mode=True, max_tokens=800)
        return json.loads(raw)
    except Exception as e:
        logger.error(f"[RiskAssessor] LLM error: {e}")
        return {
            "complexity_label": baseline["complexity"],
            "estimated_timeline_months": {
                "optimistic": baseline["avg_timeline_months"] // 2,
                "realistic": baseline["avg_timeline_months"],
                "pessimistic": baseline["avg_timeline_months"] * 2,
            },
            "settlement_likelihood": "Medium",
            "recommended_first_steps": [
                "Consult a qualified advocate immediately",
                "Collect all relevant documents",
                "Preserve all evidence",
            ],
            "note": "AI assessment unavailable. Showing baseline estimates.",
        }
