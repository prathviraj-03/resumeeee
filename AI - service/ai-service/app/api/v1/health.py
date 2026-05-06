"""
GET /api/v1/health — liveness + readiness check
"""
import time
from fastapi import APIRouter
from app.utils.logger import logger

router = APIRouter()


@router.get("/health", tags=["health"], summary="Service health check")
async def health_check():
    start = time.time()
    checks: dict = {}

    # Database
    try:
        from app.utils.database import engine
        import sqlalchemy
        async with engine.connect() as conn:
            await conn.execute(sqlalchemy.text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as e:
        checks["database"] = f"error: {e}"

    elapsed = round((time.time() - start) * 1000, 2)
    all_ok = all(v == "ok" for v in checks.values())

    return {
        "status": "healthy" if all_ok else "degraded",
        "checks": checks,
        "latency_ms": elapsed,
    }
