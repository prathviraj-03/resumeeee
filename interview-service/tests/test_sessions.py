"""Tests for interview session lifecycle."""

import pytest
from unittest.mock import patch, AsyncMock


async def _seed(client, headers):
    with patch("app.api.question.get_redis") as mock_redis:
        mock_r = AsyncMock()
        mock_r.keys = AsyncMock(return_value=[])
        mock_r.delete = AsyncMock(return_value=1)
        mock_redis.return_value = mock_r
        await client.post("/api/interview/questions/seed", headers=headers)


@pytest.mark.asyncio
async def test_start_session(client, auth_headers):
    headers, _ = auth_headers
    await _seed(client, headers)

    resp = await client.post(
        "/api/interview/session/start",
        json={"session_type": "technical", "num_questions": 3},
        headers=headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "session_id" in data
    assert len(data["questions"]) == 3
    assert data["session_type"] == "technical"


@pytest.mark.asyncio
async def test_start_session_with_filters(client, auth_headers):
    headers, _ = auth_headers
    await _seed(client, headers)

    resp = await client.post(
        "/api/interview/session/start",
        json={
            "session_type": "behavioral",
            "num_questions": 2,
            "difficulty": "medium",
        },
        headers=headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert len(data["questions"]) <= 2


@pytest.mark.asyncio
async def test_get_session(client, auth_headers):
    headers, _ = auth_headers
    await _seed(client, headers)

    start = await client.post(
        "/api/interview/session/start",
        json={"session_type": "hr", "num_questions": 2},
        headers=headers,
    )
    session_id = start.json()["session_id"]

    resp = await client.get(f"/api/interview/session/{session_id}", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["session_id"] == session_id
    assert data["status"] == "active"


@pytest.mark.asyncio
async def test_list_sessions(client, auth_headers):
    headers, _ = auth_headers
    await _seed(client, headers)

    await client.post(
        "/api/interview/session/start",
        json={"session_type": "technical", "num_questions": 2},
        headers=headers,
    )
    resp = await client.get("/api/interview/session/sessions", headers=headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert len(resp.json()) >= 1


@pytest.mark.asyncio
async def test_end_session(client, auth_headers):
    headers, _ = auth_headers
    await _seed(client, headers)

    start = await client.post(
        "/api/interview/session/start",
        json={"session_type": "technical", "num_questions": 2},
        headers=headers,
    )
    session_id = start.json()["session_id"]

    with patch(
        "app.services.session_service.generate_session_summary",
        AsyncMock(return_value="Great session! Score: 70/100. Hire recommendation."),
    ):
        resp = await client.post(
            f"/api/interview/session/{session_id}/end", headers=headers
        )

    assert resp.status_code == 200
    data = resp.json()
    assert "overall_score" in data
    assert "summary_report" in data
    assert data["summary_report"] != ""


@pytest.mark.asyncio
async def test_end_session_twice_fails(client, auth_headers):
    headers, _ = auth_headers
    await _seed(client, headers)

    start = await client.post(
        "/api/interview/session/start",
        json={"session_type": "hr", "num_questions": 1},
        headers=headers,
    )
    session_id = start.json()["session_id"]

    with patch(
        "app.services.session_service.generate_session_summary",
        AsyncMock(return_value="Summary."),
    ):
        await client.post(f"/api/interview/session/{session_id}/end", headers=headers)
        resp = await client.post(
            f"/api/interview/session/{session_id}/end", headers=headers
        )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_session_not_found_for_other_user(client, auth_headers):
    headers, _ = auth_headers
    await _seed(client, headers)

    start = await client.post(
        "/api/interview/session/start",
        json={"session_type": "technical", "num_questions": 2},
        headers=headers,
    )
    session_id = start.json()["session_id"]

    # Different user
    from app.api.auth import create_access_token
    import uuid
    other_token = create_access_token(str(uuid.uuid4()))
    other_headers = {"Authorization": f"Bearer {other_token}"}

    resp = await client.get(
        f"/api/interview/session/{session_id}", headers=other_headers
    )
    assert resp.status_code == 404
