"""
OpenAI-powered resume optimization chain.

Input:  master profile (dict) + job description (str)
Output: OptimizedResumeData — structured JSON ready for PDF rendering
"""
import json
import re
from app.config import get_settings
from app.schemas.resume import OptimizedResumeData, ContactInfo
from app.utils.logger import logger
from app.utils.llm_client import (
    get_ai_client,
    get_ai_model,
    supports_json_mode,
    build_system_prompt,
)

settings = get_settings()

_BASE_SYSTEM_PROMPT = """\
You are an expert ATS resume optimization specialist with 10+ years experience helping
candidates land interviews at top companies. Your task is to rewrite the candidate's
resume to maximize its relevance and ATS score for the given job description.

Rules:
- Use professional, result-oriented language
- Quantify achievements wherever possible (%, $, metrics, timeframes)
- Naturally incorporate job description keywords into the content
- DO NOT invent experience, roles, or companies — only rewrite/enhance existing content
- Keep certifications and education factually accurate
- Return ONLY valid JSON — no markdown, no explanation

Output JSON format:
{
  "contact": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string or null",
    "github": "string or null"
  },
  "summary": "3-4 sentence professional summary using JD keywords",
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Start - End",
      "description": ["bullet 1", "bullet 2", "bullet 3"]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "Institution",
      "year": "YYYY"
    }
  ],
  "skills": ["skill1", "skill2", "skill3"],
  "certifications": ["cert1", "cert2"],
  "projects": [
    {
      "title": "Project Name",
      "description": ["bullet 1", "bullet 2"]
    }
  ],
  "suggestions": ["improvement tip 1", "improvement tip 2"]
}
"""

SYSTEM_PROMPT = build_system_prompt(_BASE_SYSTEM_PROMPT)


def _clean_json(raw: str) -> str:
    """Strip markdown fences and extract the JSON object."""
    # Strip markdown fences
    raw = re.sub(r"```(?:json)?\s*", "", raw)
    raw = re.sub(r"```\s*", "", raw)
    # Extract everything between the first { and the last }
    match = re.search(r"(\{.*\})", raw, re.DOTALL)
    if match:
        return match.group(1)
    return raw.strip()


def _build_fallback(profile: dict) -> OptimizedResumeData:
    """Return the raw profile as-is when OpenAI fails."""
    logger.warning("optimization_llm_fallback")
    contact_raw = profile.get("contact") or {}
    return OptimizedResumeData(
        contact=ContactInfo(
            name=contact_raw.get("name") or profile.get("full_name"),
            email=contact_raw.get("email") or profile.get("email"),
            phone=contact_raw.get("phone") or profile.get("phone_number"),
            location=contact_raw.get("location") or profile.get("location"),
            linkedin=contact_raw.get("linkedin") or profile.get("linkedin_url"),
            github=contact_raw.get("github") or profile.get("github_url"),
        ),
        summary=profile.get("summary", ""),
        experience=profile.get("experience", []),
        education=profile.get("education", []),
        skills=profile.get("skills", []),
        certifications=profile.get("certifications", []),
        projects=profile.get("projects", []),
        suggestions=[
            "Add quantifiable achievements to each experience entry.",
            "Include job description keywords in your summary.",
            "Ensure LinkedIn URL is complete and up-to-date.",
        ],
    )


async def run_optimization_chain(
    profile: dict,
    job_description: str,
) -> OptimizedResumeData:
    """
    Call the configured LLM (OpenAI or Ollama) to generate an ATS-optimized resume.
    Falls back to the raw profile if the API call fails.
    """
    client = get_ai_client()
    model = get_ai_model()

    # Compact JSON — saves tokens
    profile_json = json.dumps(profile, indent=None, separators=(",", ":"))
    # Truncate JD to 3000 chars to keep prompt within token budget
    jd_snippet = job_description[:3000]

    user_message = (
        f"MASTER PROFILE:\n{profile_json}\n\n"
        f"JOB DESCRIPTION:\n{jd_snippet}"
    )

    # Build call arguments
    call_kwargs: dict = dict(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        temperature=0.3,
        max_tokens=2048,
        timeout=120.0,
    )

    if supports_json_mode():
        call_kwargs["response_format"] = {"type": "json_object"}

    try:
        logger.info("optimization_request_start", provider=settings.LLM_PROVIDER, model=model)
        response = await client.chat.completions.create(**call_kwargs)

        raw_output = response.choices[0].message.content or ""
        logger.info(
            "optimization_llm_complete",
            provider=settings.LLM_PROVIDER,
            model=model,
            tokens_used=response.usage.total_tokens if response.usage else 0,
        )

        cleaned_json = _clean_json(raw_output)
        data = json.loads(cleaned_json)

        contact_data = data.get("contact")
        if not isinstance(contact_data, dict):
            contact_data = {}
            
        return OptimizedResumeData(
            contact=ContactInfo(**contact_data) if contact_data else None,
            summary=data.get("summary", ""),
            experience=data.get("experience", []),
            education=data.get("education", []),
            skills=data.get("skills", []),
            certifications=data.get("certifications", []),
            projects=data.get("projects", []),
            suggestions=data.get("suggestions", []),
        )

    except (json.JSONDecodeError, Exception) as e:
        logger.error("optimization_failed", provider=settings.LLM_PROVIDER, error=str(e))
        return _build_fallback(profile)

