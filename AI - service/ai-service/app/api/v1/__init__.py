from fastapi import APIRouter
from .health import router as health_router
from .optimize import router as optimize_router
from .download import router as download_router
from .jobs import router as jobs_router
from .ats import router as ats_router
from .skills import router as skills_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(optimize_router)
api_router.include_router(download_router)
api_router.include_router(jobs_router)
api_router.include_router(ats_router)
api_router.include_router(skills_router)
