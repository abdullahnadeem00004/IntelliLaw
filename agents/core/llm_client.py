import json
import logging
import re
import time

import httpx

from core.config import settings

logger = logging.getLogger(__name__)

# Lazy-initialized Gemini client (only if key is configured)
_gemini_client = None
_gemini_available = None


def _get_gemini_client():
    """Return the google.genai Client, or None if not available."""
    global _gemini_client, _gemini_available
    if _gemini_available is False:
        return None
    if _gemini_client is not None:
        return _gemini_client
    if not settings.GEMINI_API_KEY:
        _gemini_available = False
        return None
    try:
        from google import genai
        _gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
        _gemini_available = True
        logger.info("Gemini client initialized (primary LLM)")
        return _gemini_client
    except ImportError:
        logger.warning("google-genai not installed, Gemini unavailable — using Ollama only")
        _gemini_available = False
        return None


def _call_gemini(prompt: str, temperature: float) -> str:
    """Call Gemini API. Raises on any error."""
    from google.genai import types
    client = _get_gemini_client()
    if client is None:
        raise RuntimeError("Gemini not available")
    config = types.GenerateContentConfig(temperature=temperature)
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
        config=config,
    )
    return response.text


def _call_ollama(prompt: str, temperature: float) -> str:
    """Call Ollama local API. Raises on any error."""
    url = f"{settings.OLLAMA_URL}/api/chat"
    payload = {
        "model": settings.OLLAMA_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
        "options": {"temperature": temperature},
    }
    response = httpx.post(url, json=payload, timeout=120.0)
    response.raise_for_status()
    return response.json()["message"]["content"]


def call_llm(prompt: str, temperature: float = 0.1, max_retries: int = 3) -> str:
    """Call LLM with dual-backend strategy: Gemini primary, Ollama fallback.

    Tries Gemini first. On 429 (rate limit) or any error, falls back to Ollama.
    Retries up to max_retries times across both backends.
    """
    gemini_client = _get_gemini_client()

    for attempt in range(1, max_retries + 1):
        # --- Try Gemini first ---
        if gemini_client is not None:
            try:
                text = _call_gemini(prompt, temperature)
                logger.info("LLM call succeeded via Gemini (attempt %d/%d)", attempt, max_retries)
                return text
            except Exception as e:
                logger.warning(
                    "Gemini attempt %d/%d failed: %s — falling back to Ollama",
                    attempt, max_retries, e,
                )

        # --- Fallback to Ollama ---
        try:
            text = _call_ollama(prompt, temperature)
            logger.info("LLM call succeeded via Ollama (attempt %d/%d)", attempt, max_retries)
            return text
        except Exception as e:
            logger.warning("Ollama attempt %d/%d failed: %s", attempt, max_retries, e)
            if attempt < max_retries:
                time.sleep(2)
            else:
                logger.error("All %d LLM call attempts failed (both Gemini and Ollama)", max_retries)
                raise


def call_llm_json(prompt: str, temperature: float = 0.1) -> dict:
    """Call LLM expecting a JSON response. Strips markdown fences and parses."""
    full_prompt = prompt + "\n\nReturn ONLY valid JSON. No markdown, no backticks, no explanation."
    raw = call_llm(full_prompt, temperature=temperature)

    # Strip ```json ... ``` fences
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw.strip())
    cleaned = re.sub(r"\s*```$", "", cleaned.strip())

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.error("Failed to parse LLM JSON response: %s\nRaw: %s", e, raw[:500])
        raise ValueError(f"LLM returned invalid JSON: {e}") from e
