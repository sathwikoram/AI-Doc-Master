"""
Unified LLM client — switches between OpenAI / Gemini / local based on config.
All AI modules call get_llm_response() instead of calling provider SDKs directly.
"""
from __future__ import annotations
import json
from typing import Optional
from loguru import logger
from app.config import settings


async def get_llm_response(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.3,
    max_tokens: int = 1500,
    json_mode: bool = False,
) -> str:
    """Returns the model's text response."""
    provider = settings.LLM_PROVIDER.lower()
    try:
        if provider == "openai":
            return await _openai_call(system_prompt, user_prompt, temperature, max_tokens, json_mode)
        elif provider == "gemini":
            return await _gemini_call(system_prompt, user_prompt, temperature, max_tokens)
        else:
            # Fallback: return a structured placeholder so the app stays functional
            return _mock_response(user_prompt, json_mode)
    except Exception as e:
        logger.warning(f"[LLM] {provider} call failed: {e}. Using mock response.")
        return _mock_response(user_prompt, json_mode)


# ── OpenAI ────────────────────────────────────────────────────────────────────
async def _openai_call(
    system_prompt: str,
    user_prompt: str,
    temperature: float,
    max_tokens: int,
    json_mode: bool,
) -> str:
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    kwargs = dict(
        model=settings.LLM_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=temperature,
        max_tokens=max_tokens,
    )
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    response = await client.chat.completions.create(**kwargs)
    return response.choices[0].message.content


# ── Gemini ─────────────────────────────────────────────────────────────────────
async def _gemini_call(
    system_prompt: str,
    user_prompt: str,
    temperature: float,
    max_tokens: int,
) -> str:
    import google.generativeai as genai

    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=system_prompt,
    )
    response = await asyncio.to_thread(
        model.generate_content,
        user_prompt,
        generation_config={"temperature": temperature, "max_output_tokens": max_tokens},
    )
    return response.text


# ── Mock (no API key) ──────────────────────────────────────────────────────────
def _mock_response(user_prompt: str, json_mode: bool) -> str:
    if json_mode:
        return json.dumps({"note": "LLM not configured. Add OPENAI_API_KEY or GEMINI_API_KEY to .env"})
    return "AI service is not configured yet. Please add your API key to the .env file."


# asyncio import for Gemini thread wrapper
import asyncio
