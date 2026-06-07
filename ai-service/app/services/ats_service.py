import json
import logging
from app.config.settings import get_settings
from app.utils.llm_client import get_ai_client, get_ai_model, supports_json_mode, build_system_prompt

settings = get_settings()
logger = logging.getLogger(__name__)

_BASE_SYSTEM_PROMPT = """
You are an expert ATS (Applicant Tracking System) specialist. Your task is to analyze a candidate's profile against a specific Job Description (JD).
Evaluate the candidate based on:
1. Keyword Match: How many essential skills and keywords from the JD are present in the profile.
2. Semantic Fit: How well the candidate's experience and background align with the core requirements of the role.
3. Format Quality: Structural completeness of the profile.

You MUST return a JSON object with the following structure:
{
  "composite_score": (int, 0-100),
  "keyword_score": (int, 0-100),
  "semantic_score": (int, 0-100),
  "format_score": (int, 0-100),
  "keyword_matches": ["list", "of", "found", "keywords"],
  "keyword_gaps": ["list", "of", "missing", "keywords"],
  "section_analysis": {
    "summary": "analysis text",
    "experience": "analysis text",
    "skills": "analysis text"
  },
  "suggestions": ["improvement tip 1", "improvement tip 2"]
}

Rules:
- Be objective and critical.
- Ensure the JSON is valid.
- Do not include any explanations outside the JSON object.
"""

SYSTEM_PROMPT = build_system_prompt(_BASE_SYSTEM_PROMPT)


import re

async def run_ats_score(profile: dict, jd: str) -> dict:
    """
    Calculate ATS score using the configured LLM provider (Ollama or OpenAI).
    """
    client = get_ai_client()
    model  = get_ai_model()

    # Truncate inputs to stay within context limits
    profile_str = json.dumps(profile)[:5000]
    jd_str      = jd[:3000]
    user_message = f"PROFILE DATA:\n{profile_str}\n\nJOB DESCRIPTION:\n{jd_str}"

    # Build API call kwargs — only add response_format if provider supports it
    call_kwargs: dict = dict(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": user_message},
        ],
        temperature=0.2,
        timeout=120.0,
    )
    if supports_json_mode():
        call_kwargs["response_format"] = {"type": "json_object"}

    try:
        logger.info("ATS score request → provider=%s model=%s", settings.LLM_PROVIDER, model)
        response = await client.chat.completions.create(**call_kwargs)

        raw_output = response.choices[0].message.content or ""
        
        # Robust JSON extraction
        match = re.search(r'(\{.*\})', raw_output, re.DOTALL)
        if match:
            return json.loads(match.group(1))
        return json.loads(raw_output)

    except Exception as e:
        logger.error("Error in run_ats_score [%s]: %s", settings.LLM_PROVIDER, str(e))
        return {
            "composite_score": 0,
            "error": str(e),
            "suggestions": ["An error occurred while communicating with the AI service."]
        }
