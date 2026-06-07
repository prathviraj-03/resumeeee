"""
Unit tests for the ATS scoring engine.
Run with: pytest tests/ -v
"""
import pytest
from unittest.mock import patch, MagicMock
from app.services.ats_scorer import (
    compute_keyword_score,
    compute_format_score,
    compute_semantic_score,
)
from app.schemas.resume import (
    ParsedResume,
    ParsedContact,
    ParsedExperience,
    ParsedEducation,
)


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def sample_resume():
    return ParsedResume(
        contact=ParsedContact(
            name="Jane Doe",
            email="jane@example.com",
            phone="+1-555-0100",
            linkedin="linkedin.com/in/janedoe",
        ),
        summary="Senior software engineer with 7 years of Python and cloud experience.",
        experience=[
            ParsedExperience(
                title="Senior Software Engineer",
                company="TechCorp",
                duration="2020-2024",
                description=[
                    "Built scalable REST APIs in Python and FastAPI",
                    "Reduced latency by 40% through Redis caching",
                    "Led a team of 5 engineers on the platform migration",
                ],
            )
        ],
        education=[
            ParsedEducation(
                degree="B.S. Computer Science",
                institution="State University",
                year="2017",
            )
        ],
        skills=["Python", "FastAPI", "Redis", "PostgreSQL", "Docker", "AWS", "Kubernetes"],
        raw_text=(
            "Jane Doe\njane@example.com\n+1-555-0100\nlinkedin.com/in/janedoe\n\n"
            "Summary\nSenior software engineer with 7 years Python cloud experience.\n\n"
            "Experience\nSenior Software Engineer at TechCorp 2020-2024\n"
            "Built scalable REST APIs Python FastAPI\nReduced latency 40% Redis caching\n\n"
            "Skills\nPython FastAPI Redis PostgreSQL Docker AWS Kubernetes\n\n"
            "Education\nB.S. Computer Science State University 2017\n"
        ),
        sections_detected=["header", "summary", "experience", "skills", "education"],
    )


@pytest.fixture
def sample_jd():
    return (
        "We are looking for a Senior Python Engineer with experience in FastAPI, "
        "Redis, PostgreSQL, Docker, and Kubernetes. The ideal candidate has worked "
        "with AWS, CI/CD pipelines, and microservices architecture. "
        "Strong communication and team leadership skills required."
    )


# ── Keyword Score ─────────────────────────────────────────────────────────────

def test_keyword_score_high_match(sample_resume, sample_jd):
    import spacy
    try:
        nlp = spacy.load("en_core_web_lg")
    except OSError:
        nlp = spacy.load("en_core_web_sm")

    score, matched, gaps = compute_keyword_score(
        sample_resume.raw_text, sample_jd, nlp
    )
    assert 0 <= score <= 100
    assert isinstance(matched, list)
    assert isinstance(gaps, list)
    # Should match several keywords
    assert len(matched) > 0


def test_keyword_score_empty_jd(sample_resume):
    import spacy
    try:
        nlp = spacy.load("en_core_web_lg")
    except OSError:
        nlp = spacy.load("en_core_web_sm")

    score, matched, gaps = compute_keyword_score(sample_resume.raw_text, "", nlp)
    assert score == 50.0  # fallback when no JD keywords


# ── Format Score ──────────────────────────────────────────────────────────────

def test_format_score_complete_resume(sample_resume):
    score, analysis = compute_format_score(sample_resume)
    assert score > 70, f"Expected >70, got {score}"
    assert analysis["experience"] == "present"
    assert analysis["education"] == "present"
    assert analysis["skills"] == "present"


def test_format_score_minimal_resume():
    minimal = ParsedResume(
        contact=ParsedContact(),
        raw_text="John Doe Software Engineer",
        sections_detected=[],
    )
    score, analysis = compute_format_score(minimal)
    assert score < 30, f"Expected <30, got {score}"
    assert analysis["experience"] == "missing"


# ── Semantic Score ────────────────────────────────────────────────────────────

def test_semantic_score_range(sample_resume, sample_jd):
    score = compute_semantic_score(sample_resume.raw_text, sample_jd)
    assert 0 <= score <= 100


def test_semantic_score_identical_text():
    text = "Python FastAPI Redis PostgreSQL Docker Kubernetes AWS microservices"
    score = compute_semantic_score(text, text)
    assert score > 90, f"Identical texts should score >90, got {score}"


# ── Composite Score ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_calculate_ats_score_integration(sample_resume, sample_jd):
    from app.services.ats_scorer import calculate_ats_score
    result = await calculate_ats_score(
        parsed_resume=sample_resume,
        job_description=sample_jd,
        resume_id="test-resume-001",
        user_id="test-user-001",
    )
    assert 0 <= result.composite_score <= 100
    assert result.resume_id == "test-resume-001"
    assert isinstance(result.keyword_gaps, list)
    assert isinstance(result.keyword_matches, list)
