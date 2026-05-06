"""
eval_chain.py — LangChain rubric-based answer evaluator.

Works with any OpenAI-compatible endpoint (OpenAI, Groq, Ollama, etc.)
Scoring dimensions:
  - relevance  (0-10): Does the answer address the question?
  - depth      (0-10): Technical/conceptual depth
  - clarity    (0-10): Communication quality
  - star_format(0-10): STAR method adherence (behavioral questions only)
Final score = weighted average → normalised to 0-10.
"""

import json
import asyncio
import logging
from typing import Optional

from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema.output_parser import StrOutputParser

from app.config.settings import settings

logger = logging.getLogger(__name__)

# ── LLM instance (shared, reused across requests) ──────────────────────────

def _build_llm():
    if settings.LLM_PROVIDER == "google":
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model=settings.LLM_MODEL,
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=0.3,
            timeout=settings.LLM_TIMEOUT,
            max_retries=settings.LLM_MAX_RETRIES,
        )
    elif settings.LLM_PROVIDER == "ollama":
        from langchain_community.chat_models import ChatOllama
        return ChatOllama(
            model=settings.LLM_MODEL,
            temperature=0.3,
            # For ollama, base_url is usually http://localhost:11434
            base_url=settings.OPENAI_BASE_URL or "http://localhost:11434",
        )
    
    # Default to OpenAI-compatible (works for Groq too)
    from langchain_openai import ChatOpenAI
    kwargs: dict = {
        "model": settings.LLM_MODEL,
        "api_key": settings.OPENAI_API_KEY,
        "temperature": 0.3,
        "max_tokens": 800,
        "timeout": settings.LLM_TIMEOUT,
        "max_retries": settings.LLM_MAX_RETRIES,
    }
    if settings.OPENAI_BASE_URL:
        kwargs["base_url"] = settings.OPENAI_BASE_URL
    return ChatOpenAI(**kwargs)


_llm = None


def get_llm():
    global _llm
    if _llm is None:
        _llm = _build_llm()
    return _llm


# ── Prompts ────────────────────────────────────────────────────────────────

TECHNICAL_SYSTEM = """You are an expert technical interviewer evaluating a candidate's answer.
Score the answer on three dimensions (0-10 each):
1. relevance  — Does it directly address the question?
2. depth      — Technical accuracy, detail, and completeness.
3. clarity    — Clear, structured, easy to follow.

Respond ONLY with valid JSON (no markdown, no prose) in this exact structure:
{{
  "relevance": <int 0-10>,
  "depth": <int 0-10>,
  "clarity": <int 0-10>,
  "overall_score": <int 0-10>,
  "feedback": "<2-4 sentences of specific, constructive feedback>"
}}"""

BEHAVIORAL_SYSTEM = """You are an expert behavioral interviewer evaluating a candidate's answer.
Score on four dimensions (0-10 each):
1. relevance   — Does it address the behavioral question?
2. depth       — Richness of context, actions, and outcome.
3. clarity     — Communication quality.
4. star_format — Adherence to STAR (Situation, Task, Action, Result).

Respond ONLY with valid JSON (no markdown, no prose):
{{
  "relevance": <int 0-10>,
  "depth": <int 0-10>,
  "clarity": <int 0-10>,
  "star_format": <int 0-10>,
  "overall_score": <int 0-10>,
  "feedback": "<2-4 sentences of specific, constructive feedback>"
}}"""

HR_SYSTEM = """You are a senior HR interviewer evaluating a candidate's answer.
Score on three dimensions (0-10 each):
1. relevance — Addresses the HR question directly.
2. depth     — Self-awareness, cultural fit signals, professionalism.
3. clarity   — Articulate, confident, concise.

Respond ONLY with valid JSON (no markdown, no prose):
{{
  "relevance": <int 0-10>,
  "depth": <int 0-10>,
  "clarity": <int 0-10>,
  "overall_score": <int 0-10>,
  "feedback": "<2-4 sentences of specific, constructive feedback>"
}}"""

USER_TEMPLATE = """Question: {question}

Candidate's answer: {answer}

{jd_context}"""

SUMMARY_SYSTEM = """You are a professional interview coach writing a post-interview report.
Given the interview transcript (questions + answers + scores), write a concise 200-300 word
summary covering: overall performance, key strengths, areas for improvement, and a final
recommendation (Strong Hire / Hire / Maybe / No Hire).
Format as clean paragraphs — no bullet points, no markdown."""

SUMMARY_USER = """Session type: {session_type}
Overall score: {overall_score}/100

Interview Q&A:
{qa_transcript}"""


def _get_system(session_type: str) -> str:
    mapping = {
        "technical": TECHNICAL_SYSTEM,
        "behavioral": BEHAVIORAL_SYSTEM,
        "hr": HR_SYSTEM,
    }
    return mapping.get(session_type, TECHNICAL_SYSTEM)


# ── Fallback scorer (when LLM is unavailable) ──────────────────────────────

def _fallback_score(answer: str, session_type: str) -> dict:
    """Simple heuristic fallback — never surfaces to prod if LLM is healthy."""
    length = len(answer.split())
    score = min(10, max(1, length // 20))
    result = {
        "relevance": score,
        "depth": score,
        "clarity": score,
        "overall_score": score,
        "feedback": (
            "Automated evaluation was unavailable. "
            "Your answer has been recorded for manual review."
        ),
    }
    if session_type == "behavioral":
        result["star_format"] = score
    return result


# ── Main evaluation function ───────────────────────────────────────────────

async def evaluate_answer(
    question_text: str,
    answer_text: str,
    session_type: str,
    job_description: Optional[str] = None,
) -> dict:
    """
    Evaluate a candidate answer using an LLM rubric chain.
    Returns a dict with scores and feedback.
    Gracefully falls back on timeout / API error.
    """
    system_prompt = _get_system(session_type)
    if job_description:
        system_prompt += "\nEvaluate this answer considering the requirements of the following Job Description. Check for keyword alignment and relevance to the role's needs."
        
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", USER_TEMPLATE),
    ])
    chain = prompt | get_llm() | StrOutputParser()

    jd_context = f"Job Description Context:\n{job_description}" if job_description else ""

    try:
        raw = await asyncio.wait_for(
            chain.ainvoke({
                "question": question_text, 
                "answer": answer_text,
                "jd_context": jd_context
            }),
            timeout=settings.LLM_TIMEOUT,
        )
        # Strip potential markdown fences from poorly-behaved models
        raw = raw.strip().strip("```json").strip("```").strip()
        result = json.loads(raw)
        # Clamp all int fields to 0-10
        for key in ("relevance", "depth", "clarity", "star_format", "overall_score"):
            if key in result:
                result[key] = max(0, min(10, int(result[key])))
        return result

    except asyncio.TimeoutError:
        logger.warning("LLM timeout during answer evaluation — using fallback")
        return _fallback_score(answer_text, session_type)
    except (json.JSONDecodeError, KeyError) as exc:
        logger.warning("LLM returned malformed JSON: %s — using fallback", exc)
        return _fallback_score(answer_text, session_type)
    except Exception as exc:
        logger.error("LLM evaluation failed: %s", exc, exc_info=True)
        return _fallback_score(answer_text, session_type)


async def generate_session_summary(
    session_type: str,
    overall_score: int,
    qa_pairs: list[dict],
) -> str:
    """Generate a post-session summary report via LLM."""
    transcript_lines = []
    for i, pair in enumerate(qa_pairs, 1):
        transcript_lines.append(
            f"Q{i}: {pair['question']}\n"
            f"A{i}: {pair['answer']}\n"
            f"Score: {pair['score']}/10"
        )
    transcript = "\n\n".join(transcript_lines)

    prompt = ChatPromptTemplate.from_messages([
        ("system", SUMMARY_SYSTEM),
        ("human", SUMMARY_USER),
    ])
    chain = prompt | get_llm() | StrOutputParser()

    try:
        summary = await asyncio.wait_for(
            chain.ainvoke({
                "session_type": session_type,
                "overall_score": overall_score,
                "qa_transcript": transcript,
            }),
            timeout=settings.LLM_TIMEOUT + 15,
        )
        return summary.strip()
    except Exception as exc:
        logger.error("Summary generation failed: %s", exc)
        return (
            f"Session completed with an overall score of {overall_score}/100. "
            "Detailed summary could not be generated at this time."
        )
