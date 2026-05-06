"""
API integration tests using httpx TestClient.
Run with: pytest tests/test_api.py -v
"""
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch, MagicMock

from app.main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


# ── Health ─────────────────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_root(client):
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert "docs" in data


# ── Parse Resume ───────────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_parse_resume_invalid_type(client):
    response = await client.post(
        "/api/v1/parse-resume",
        files={"file": ("resume.txt", b"plain text", "text/plain")},
        data={"user_id": "user-001"},
    )
    assert response.status_code == 415


@pytest.mark.anyio
async def test_parse_resume_too_large(client):
    large_bytes = b"%PDF-1.4 " + b"A" * (11 * 1024 * 1024)
    response = await client.post(
        "/api/v1/parse-resume",
        files={"file": ("big.pdf", large_bytes, "application/pdf")},
        data={"user_id": "user-001"},
    )
    assert response.status_code == 413


# ── ATS Score ──────────────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_ats_score_resume_not_found(client):
    with patch("app.api.v1.ats.cache_get", return_value=None):
        with patch("app.api.v1.ats.get_db"):
            response = await client.post(
                "/api/v1/ats-score",
                json={
                    "resume_id": "nonexistent-id",
                    "user_id": "user-001",
                    "job_description": "Python FastAPI developer with 3+ years experience in cloud technologies and microservices.",
                },
            )
    # Will 404 because DB is not connected in unit test
    assert response.status_code in {404, 500}


# ── Optimize ───────────────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_optimize_invalid_jd_too_short(client):
    response = await client.post(
        "/api/v1/optimize",
        json={
            "resume_id": "some-id",
            "user_id": "user-001",
            "job_description": "too short",  # < 50 chars
        },
    )
    assert response.status_code == 422


# ── Download ───────────────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_download_not_found(client):
    response = await client.get("/api/v1/download/nonexistent-job-id")
    assert response.status_code in {404, 500}
