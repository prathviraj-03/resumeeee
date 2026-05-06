"""Tests for question bank endpoints."""

import pytest
from unittest.mock import patch, AsyncMock


@pytest.mark.asyncio
async def test_seed_questions(client, auth_headers):
    headers, _ = auth_headers
    with patch("app.api.question.get_redis") as mock_redis:
        mock_r = AsyncMock()
        mock_r.keys = AsyncMock(return_value=[])
        mock_r.delete = AsyncMock(return_value=1)
        mock_redis.return_value = mock_r
        resp = await client.post("/api/interview/questions/seed", headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert "message" in data
    assert int(data["message"].split()[1]) > 0


@pytest.mark.asyncio
async def test_list_questions(client, auth_headers):
    headers, _ = auth_headers
    resp = await client.get("/api/interview/questions", headers=headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_list_questions_filter_by_type(client, auth_headers):
    headers, _ = auth_headers
    resp = await client.get(
        "/api/interview/questions?session_type=technical", headers=headers
    )
    assert resp.status_code == 200
    for q in resp.json():
        assert q["session_type"] == "technical"


@pytest.mark.asyncio
async def test_create_question(client, auth_headers):
    headers, _ = auth_headers
    with patch("app.api.question._bust_cache", AsyncMock()):
        resp = await client.post(
            "/api/interview/questions",
            json={
                "question_text": "Explain the difference between TCP and UDP in detail.",
                "category": "Networking",
                "difficulty": "medium",
                "session_type": "technical",
            },
            headers=headers,
        )
    assert resp.status_code == 201
    data = resp.json()
    assert data["category"] == "Networking"
    assert data["question_id"] is not None


@pytest.mark.asyncio
async def test_create_question_too_short(client, auth_headers):
    headers, _ = auth_headers
    resp = await client.post(
        "/api/interview/questions",
        json={
            "question_text": "Short?",
            "category": "X",
            "difficulty": "easy",
            "session_type": "hr",
        },
        headers=headers,
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_unauthenticated_request(client):
    resp = await client.get("/api/interview/questions")
    assert resp.status_code == 403
