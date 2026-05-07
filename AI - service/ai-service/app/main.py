"""
AI Resume Service — FastAPI Application (v2, OpenAI-only)
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.config import get_settings
from app.api import api_router
from app.utils.logger import setup_logging, logger
from app.models.base import Base
from app.utils.database import engine

settings = get_settings()
setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info("service_startup", version=settings.APP_VERSION)

    # Ensure local storage dirs exist
    os.makedirs(os.path.join(settings.LOCAL_STORAGE_PATH, "resumes"), exist_ok=True)
    os.makedirs(os.path.join(settings.LOCAL_STORAGE_PATH, "output"), exist_ok=True)

    # Auto-create DB tables in debug mode (use Alembic migrations in production)
    if settings.DEBUG:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("db_tables_created")

    yield

    logger.info("service_shutdown")
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI Resume Optimization Service — powered by OpenAI",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global exception handlers ─────────────────────────────────────────────────

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error("validation_error", path=request.url.path, errors=exc.errors())
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("unhandled_exception", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred.", "error": str(exc)},
    )

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(api_router, prefix="/api/v1")


@app.get("/", tags=["root"])
async def root():
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/api/v1/health",
        "endpoints": {
            "optimize": "POST /api/v1/optimize",
            "job_status": "GET /api/v1/optimize/{job_id}",
            "download": "GET /api/v1/download/{job_id}",
            "job_history": "GET /api/v1/jobs",
            "delete_job": "DELETE /api/v1/jobs/{job_id}",
            "ats_score": "POST /api/v1/ats/score",
        },
    }
