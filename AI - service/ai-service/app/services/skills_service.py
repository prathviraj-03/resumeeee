import json
import logging
import math
from app.config.settings import get_settings
from app.utils.llm_client import get_ai_client, get_ai_model, supports_json_mode, build_system_prompt

settings = get_settings()
logger = logging.getLogger(__name__)

# ── Prompts ────────────────────────────────────────────────────────────────────

_BASE_GAP_PROMPT = """
You are a skills assessment expert. Analyze the candidate's profile against the provided Job Description (JD).
Identify:
1. Matched Skills: Skills the candidate has that are required by the JD.
2. Partially Matched Skills: Skills where the candidate has some exposure but needs more depth.
3. Missing Skills: Essential skills required by the JD that are not in the candidate's profile.

You MUST return a JSON object with the following structure:
{
  "matched": ["skill1", "skill2"],
  "partially_matched": ["skill3"],
  "missing": ["skill4", "skill5"],
  "overall_score": (int, 0-100),
  "skillCategories": [
    {
      "name": "Category Name",
      "skills": [
        {"name": "Skill Name", "status": "Matched | Partially Matched | Missing"}
      ]
    }
  ]
}
"""

_BASE_ROADMAP_PROMPT = """
You are a career coach and technical mentor. Based on the list of missing skills and the target job description, create a detailed, week-by-week learning roadmap.
Each item in the roadmap should include a clear title, description, and a link to a high-quality learning resource (e.g., documentation, Coursera, Udemy, YouTube).

You MUST return a JSON object with the following structure:
{
  "target_role": "string",
  "estimated_weeks": (int),
  "weeks": [
    {
      "week_number": (int),
      "focus_area": "string",
      "items": [
        {
          "skill": "Skill Name",
          "title": "Topic Name",
          "description": "What to learn specifically",
          "resource": "URL",
          "priority": "High | Medium | Low"
        }
      ]
    }
  ]
}
"""

GAP_ANALYSIS_PROMPT = build_system_prompt(_BASE_GAP_PROMPT)
ROADMAP_PROMPT      = build_system_prompt(_BASE_ROADMAP_PROMPT)


import re

# ── Helpers ────────────────────────────────────────────────────────────────────

def _parse_json(raw: str) -> dict:
    """
    Extract and parse JSON from the LLM output. 
    Handles markdown blocks and stray text more robustly than simple stripping.
    """
    try:
        # Find everything between the first '{' and the last '}'
        match = re.search(r'(\{.*\})', raw, re.DOTALL)
        if match:
            return json.loads(match.group(1))
        return json.loads(raw)
    except Exception as e:
        logger.error("JSON parse error: %s | Raw output: %s", str(e), raw)
        raise e


def _call_kwargs(prompt: str, user_msg: str, *, timeout_seconds: float, max_tokens: int | None = None) -> dict:
    """Build the kwargs dict for client.chat.completions.create."""
    kwargs: dict = dict(
        model=get_ai_model(),
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": user_msg},
        ],
        temperature=0.2,
        timeout=timeout_seconds,
    )
    if max_tokens is not None:
        kwargs["max_tokens"] = max_tokens
    if supports_json_mode():
        kwargs["response_format"] = {"type": "json_object"}
    return kwargs


def _fallback_resource_for(skill: str) -> str:
    key = skill.lower()
    if "postgres" in key:
        return "https://www.postgresql.org/docs/"
    if "mongo" in key:
        return "https://www.mongodb.com/docs/"
    if "microservice" in key:
        return "https://microservices.io/patterns/index.html"
    if "cloud" in key or "deploy" in key:
        return "https://cloud.google.com/architecture"
    if "agile" in key:
        return "https://www.scrum.org/resources/what-is-scrum"
    return "https://roadmap.sh/"


def _build_fallback_roadmap(missing_skills: list[str], jd: str) -> dict:
    cleaned_skills = [s.strip() for s in missing_skills if isinstance(s, str) and s.strip()]
    if not cleaned_skills:
        cleaned_skills = ["Core role skills"]

    weeks_count = min(max(len(cleaned_skills), 2), 8)
    chunksize = max(1, math.ceil(len(cleaned_skills) / weeks_count))
    chunks = [cleaned_skills[i:i + chunksize] for i in range(0, len(cleaned_skills), chunksize)]

    weeks = []
    for index, group in enumerate(chunks, start=1):
        items = []
        for skill in group:
            items.append({
                "skill": skill,
                "title": f"Build practical {skill} proficiency",
                "description": f"Study fundamentals and complete one hands-on project focused on {skill}.",
                "resource": _fallback_resource_for(skill),
                "priority": "High" if index <= 2 else "Medium",
            })

        weeks.append({
            "week_number": index,
            "focus_area": ", ".join(group),
            "items": items,
        })

    return {
        "target_role": "Target role from job description",
        "estimated_weeks": len(weeks),
        "weeks": weeks,
    }


# ── Service functions ──────────────────────────────────────────────────────────

async def analyze_skill_gap(profile: dict, jd: str) -> dict:
    """
    Analyze skill gaps using the configured LLM provider (Ollama or OpenAI).
    """
    client    = get_ai_client()
    model     = get_ai_model()
    profile_str = json.dumps(profile)[:5000]
    jd_str      = jd[:3000]
    user_msg    = f"PROFILE DATA:\n{profile_str}\n\nJOB DESCRIPTION:\n{jd_str}"

    try:
        logger.info("Skill gap request → provider=%s model=%s", settings.LLM_PROVIDER, model)
        response = await client.chat.completions.create(**_call_kwargs(
            GAP_ANALYSIS_PROMPT,
            user_msg,
            timeout_seconds=90.0,
            max_tokens=1200,
        ))
        return _parse_json(response.choices[0].message.content or "")
    except Exception as e:
        logger.exception("Error in analyze_skill_gap [%s]: %s", settings.LLM_PROVIDER, str(e))
        raise RuntimeError("Failed to analyze skill gap") from e


async def generate_roadmap(missing_skills: list, jd: str) -> dict:
    """
    Generate a learning roadmap using the configured LLM provider (Ollama or OpenAI).
    """
    client   = get_ai_client()
    model    = get_ai_model()
    skills_str = ", ".join(missing_skills)
    jd_str     = jd[:3000]
    user_msg   = f"MISSING SKILLS:\n{skills_str}\n\nJOB DESCRIPTION:\n{jd_str}"

    try:
        logger.info("Roadmap request → provider=%s model=%s", settings.LLM_PROVIDER, model)
        response = await client.chat.completions.create(**_call_kwargs(
            ROADMAP_PROMPT,
            user_msg,
            timeout_seconds=90.0,
            max_tokens=1400,
        ))
        return _parse_json(response.choices[0].message.content or "")
    except Exception as e:
        logger.exception("Error in generate_roadmap [%s]: %s", settings.LLM_PROVIDER, str(e))
        logger.warning("Returning fallback roadmap due to generation failure")
        return _build_fallback_roadmap(missing_skills, jd)
