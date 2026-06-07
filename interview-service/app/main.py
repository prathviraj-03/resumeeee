"""
main.py — FastAPI application factory for the Interview Service.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config.settings import settings
from app.config.database import engine
from app.config.redis_client import close_redis
from app.models.models import Base  # noqa: F401 — registers all models
from app.api.session import router as session_router
from app.api.response import router as response_router
from app.api.question import router as question_router

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL, logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


# ── Lifespan ───────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Interview Service…")
    # Auto-create tables (use Alembic migrations in production)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables ensured.")
    yield
    logger.info("Shutting down Interview Service…")
    await close_redis()
    await engine.dispose()


# ── App factory ────────────────────────────────────────────────────────────

def create_app() -> FastAPI:
    app = FastAPI(
        title="Interview Service",
        description=(
            "AI-powered mock interview backend. "
            "Generates questions, evaluates answers with LangChain, "
            "and produces session reports."
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    app.include_router(session_router)
    app.include_router(response_router)
    app.include_router(question_router)

    # ── Development helpers ────────────────────────────────────────────────
    if settings.APP_ENV == "development":
        from fastapi import APIRouter
        from app.api.auth import create_access_token
        import uuid

        dev_router = APIRouter(prefix="/dev", tags=["dev-only"])

        @dev_router.post("/token")
        async def get_dev_token(user_id: str | None = None):
            """Generate a dev JWT — DO NOT expose in production."""
            uid = user_id or str(uuid.uuid4())
            token = create_access_token(uid)
            return {"access_token": token, "user_id": uid, "token_type": "bearer"}

        app.include_router(dev_router)
        logger.warning("Dev token endpoint enabled — disable in production!")

    # ── Health & root ──────────────────────────────────────────────────────
    @app.get("/health", tags=["health"])
    async def health():
        return {"status": "ok", "service": "interview-service"}

    @app.get("/", tags=["health"])
    async def root():
        return {"message": "Interview Service is running", "docs": "/docs"}

    # ── Global exception handler ───────────────────────────────────────────
    @app.exception_handler(Exception)
    async def global_exception_handler(request, exc):
        logger.error("Unhandled exception: %s", exc, exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )

    return app


app = create_app()
