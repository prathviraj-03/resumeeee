"""
llm_client.py — Central LLM provider factory for the AI Service.

Usage:
    from app.utils.llm_client import get_ai_client, get_ai_model, supports_json_mode

Supports:
    LLM_PROVIDER=openai  → real OpenAI API (default fallback)
    LLM_PROVIDER=ollama  → local Ollama via its OpenAI-compatible /v1 endpoint

Ollama exposes the same OpenAI REST wire-protocol at OLLAMA_BASE_URL/v1,
so we reuse AsyncOpenAI with a custom base_url — no extra dependency needed.
"""

import logging
from openai import AsyncOpenAI
from app.config.settings import get_settings

logger = logging.getLogger(__name__)


def get_ai_client() -> AsyncOpenAI:
    """
    Return a configured AsyncOpenAI client for the active LLM provider.

    - openai: standard client using OPENAI_API_KEY
    - ollama: client pointed at Ollama's OpenAI-compatible API
              (api_key is a dummy string; Ollama ignores it)
    """
    settings = get_settings()

    if settings.LLM_PROVIDER == "ollama":
        base_url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/v1"
        logger.debug("LLM client → Ollama @ %s", base_url)
        return AsyncOpenAI(
            api_key="ollama",          # Ollama ignores the key; can't be empty
            base_url=base_url,
        )

    # Default: real OpenAI
    logger.debug("LLM client → OpenAI (model=%s)", settings.OPENAI_MODEL)
    return AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


def get_ai_model() -> str:
    """Return the model name to use for the active provider."""
    settings = get_settings()
    if settings.LLM_PROVIDER == "ollama":
        return settings.OLLAMA_MODEL
    return settings.OPENAI_MODEL


def supports_json_mode() -> bool:
    """
    Whether the active provider supports OpenAI-style JSON mode
    (response_format={"type": "json_object"}).

    Ollama does NOT support this parameter in the OpenAI-compat API.
    Instead we append a JSON instruction to the system prompt.
    """
    settings = get_settings()
    return settings.LLM_PROVIDER != "ollama"


def build_system_prompt(base_prompt: str) -> str:
    """
    If the provider doesn't support JSON mode, append a strict JSON reminder
    to the system prompt so the model still returns parseable JSON.
    """
    if supports_json_mode():
        return base_prompt
    return (
        base_prompt.rstrip()
        + "\n\nCRITICAL: Respond ONLY with a valid JSON object. "
        "Do NOT include markdown fences, prose, or any text outside the JSON."
    )
