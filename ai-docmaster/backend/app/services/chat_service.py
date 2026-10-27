"""
AI Chat Assistant Service
Maintains per-user conversation context in Redis (if available),
falls back to stateless LLM calls.

The assistant acts as a legal guidance bot for Indian law,
helping citizens understand processes and terminology.
"""
from __future__ import annotations
import json
from typing import List, Dict, Optional
from loguru import logger
from app.services.llm_client import get_llm_response
from app.config import settings

SYSTEM_PROMPT = """You are AI DocMaster, an intelligent Indian legal assistant designed to help citizens understand their legal rights and the legal process.

Your role:
- Help users understand legal procedures, terms, and processes in simple language
- Explain what steps to take for different legal situations
- Clarify legal sections and their meaning in simple terms
- Guide users on what documents to prepare
- Explain court processes (FIR, bail, hearing, judgment, appeal)

Important boundaries:
- You are NOT a substitute for a qualified advocate
- Always advise users to consult a registered lawyer for their specific case
- Do not predict case outcomes or guarantee results
- Be empathetic and clear — many users are experiencing stressful situations
- Use simple, accessible language; avoid heavy legal jargon unless explaining a term

You are knowledgeable about:
- Indian Penal Code (IPC) / Bharatiya Nyaya Sanhita (BNS) 2023
- Code of Criminal Procedure (CrPC) / Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023
- Consumer Protection Act 2019
- Family laws (Hindu Marriage Act, Muslim Personal Law, etc.)
- Labour laws, property laws, and constitutional law
- Court hierarchy in India (District → High Court → Supreme Court)"""


# In-memory fallback for conversation history
_conversation_cache: Dict[str, List[Dict]] = {}
MAX_HISTORY = 10


async def chat_with_ai(
    user_message: str,
    user_id: str,
    case_id: Optional[str] = None,
) -> str:
    """Get AI response with conversation history."""
    history = await _load_history(user_id)

    # Build messages array for LLM
    # For OpenAI-style APIs, we pass the full history
    context_messages = []
    for msg in history[-MAX_HISTORY:]:
        context_messages.append(f"{msg['role'].upper()}: {msg['content']}")

    # Include case context if provided
    case_context = ""
    if case_id:
        case_context = f"\n[User is asking about Case ID: {case_id}]"

    full_user_prompt = "\n".join(context_messages + [f"USER: {user_message}"])
    if case_context:
        full_user_prompt += case_context

    response = await get_llm_response(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=full_user_prompt,
        temperature=0.5,
        max_tokens=600,
    )

    # Save to history
    history.append({"role": "user", "content": user_message})
    history.append({"role": "assistant", "content": response})
    await _save_history(user_id, history)

    return response


async def _load_history(user_id: str) -> List[Dict]:
    try:
        import redis.asyncio as aioredis
        r = aioredis.from_url(settings.REDIS_URL)
        raw = await r.get(f"chat:{user_id}")
        await r.aclose()
        if raw:
            return json.loads(raw)
    except Exception:
        pass
    return _conversation_cache.get(user_id, [])


async def _save_history(user_id: str, history: List[Dict]) -> None:
    # Keep only last 20 messages
    history = history[-20:]
    try:
        import redis.asyncio as aioredis
        r = aioredis.from_url(settings.REDIS_URL)
        await r.setex(f"chat:{user_id}", 3600 * 24, json.dumps(history))
        await r.aclose()
    except Exception:
        _conversation_cache[user_id] = history
