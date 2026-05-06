"""
OpenAI-powered resume optimization chain.

Input:  master profile (dict) + job description (str)
Output: OptimizedResumeData — structured JSON ready for PDF rendering
"""
import json
import re
from openai import AsyncOpenAI
from app.config import get_settings
from app.schemas.resume import OptimizedResumeData, ContactInfo
from app.utils.logger import logger

settings = get_settings()

SYSTEM_PROMPT = """\
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


def _clean_json(raw: str) -> str:
    """Strip markdown fences and extract the JSON object."""
    raw = re.sub(r"```(?:json)?\s*", "", raw)
    raw = re.sub(r"```\s*", "", raw)
    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end != -1:
        return raw[start:end + 1]
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
    Call OpenAI to generate an ATS-optimized resume from a master profile + JD.
    Falls back to the raw profile if the API call fails.
    """
    if not settings.OPENAI_API_KEY:
        logger.warning("openai_key_missing_using_fallback")
        return _build_fallback(profile)

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    # Compact JSON — saves tokens
    profile_json = json.dumps(profile, indent=None, separators=(",", ":"))
    # Truncate JD to 3000 chars to keep prompt within token budget
    jd_snippet = job_description[:3000]

    user_message = (
        f"MASTER PROFILE:\n{profile_json}\n\n"
        f"JOB DESCRIPTION:\n{jd_snippet}"
    )

    try:
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=2048,
        )

        raw_output = response.choices[0].message.content or ""
        logger.info(
            "openai_optimization_complete",
            model=settings.OPENAI_MODEL,
            tokens_used=response.usage.total_tokens if response.usage else 0,
        )

        data = json.loads(_clean_json(raw_output))

        contact_data = data.get("contact") or {}
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

    except json.JSONDecodeError as e:
        logger.error("optimization_json_parse_error", error=str(e))
        return _build_fallback(profile)

    except Exception as e:
        logger.error("optimization_openai_error", error=str(e))
        return _build_fallback(profile)
