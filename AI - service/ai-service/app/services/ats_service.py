import json
import logging
from app.config.settings import get_settings
from app.utils.llm_client import get_ai_client, get_ai_model, supports_json_mode, build_system_prompt

settings = get_settings()
logger = logging.getLogger(__name__)

_BASE_SYSTEM_PROMPT_WITH_JD = """
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

_BASE_SYSTEM_PROMPT_NO_JD = """
You are an expert resume analyst. Your task is to analyze a candidate's resume for overall quality and completeness, without a specific job description.
Evaluate the resume based on:
1. Clarity and Conciseness: How well the information is presented.
2. Action Verbs and Impact: Use of strong action verbs and quantifiable achievements.
3. Completeness: Presence of essential sections like summary, experience, education, and skills.

You MUST return a JSON object with the following structure:
{
  "composite_score": (int, 0-100),
  "clarity_score": (int, 0-100),
  "impact_score": (int, 0-100),
  "completeness_score": (int, 0-100),
  "section_analysis": {
    "summary": "analysis text",
    "experience": "analysis text",
    "skills": "analysis text"
  },
  "suggestions": ["general improvement tip 1", "tip 2"]
}

Rules:
- Be objective and critical.
- Ensure the JSON is valid.
- Do not include any explanations outside the JSON object.
"""

SYSTEM_PROMPT_WITH_JD = build_system_prompt(_BASE_SYSTEM_PROMPT_WITH_JD)
SYSTEM_PROMPT_NO_JD = build_system_prompt(_BASE_SYSTEM_PROMPT_NO_JD)


import re

async def run_ats_score(profile: dict, jd: Optional[str] = None) -> dict:
    """
    Calculate ATS score using the configured LLM provider.
    If a Job Description (jd) is provided, it performs a full ATS analysis.
    If the JD is omitted, it performs a general resume quality analysis.
    """
    client = get_ai_client()
    model = get_ai_model()

    # Determine which prompt to use
    if jd:
        system_prompt = SYSTEM_PROMPT_WITH_JD
        user_message = f"PROFILE DATA:\n{json.dumps(profile)[:5000]}\n\nJOB DESCRIPTION:\n{jd[:3000]}"
    else:
        system_prompt = SYSTEM_PROMPT_NO_JD
        # If it's a parsed PDF, the profile dict might just have 'raw_text'
        if "raw_text" in profile and len(profile.keys()) == 1:
             profile_str = profile["raw_text"]
        else:
             profile_str = json.dumps(profile)
        user_message = f"RESUME CONTENT:\n{profile_str[:8000]}"

    # Build API call kwargs
    call_kwargs: dict = dict(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_message},
        ],
        temperature=0.2,
        timeout=120.0,
    )
    if supports_json_mode():
        call_kwargs["response_format"] = {"type": "json_object"}

    try:
        logger.info("ATS score request → provider=%s model=%s with_jd=%s", settings.LLM_PROVIDER, model, bool(jd))
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
