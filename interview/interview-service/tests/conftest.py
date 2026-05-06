"""
conftest.py — Pytest fixtures for the Interview Service.
Uses an in-memory SQLite database so tests need no external Postgres.
"""

import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from unittest.mock import AsyncMock, patch

from app.main import app
from app.config.database import Base, get_db
from app.api.auth import create_access_token

# ── In-memory SQLite for tests ─────────────────────────────────────────────

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session():
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session):
    """HTTP test client with DB and Redis mocked."""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    # Mock Redis
    with patch("app.services.session_service.get_redis") as mock_redis, \
         patch("app.api.question.get_redis") as mock_qredis:
        mock_r = AsyncMock()
        mock_r.get = AsyncMock(return_value=None)
        mock_r.setex = AsyncMock(return_value=True)
        mock_r.keys = AsyncMock(return_value=[])
        mock_r.delete = AsyncMock(return_value=1)
        mock_redis.return_value = mock_r
        mock_qredis.return_value = mock_r

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as ac:
            yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers():
    """JWT headers for a fixed test user."""
    import uuid
    user_id = str(uuid.uuid4())
    token = create_access_token(user_id)
    return {"Authorization": f"Bearer {token}"}, user_id
