from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache
from typing import Literal


class Settings(BaseSettings):
    # ── Application ──────────────────────────────────────────────
    APP_NAME: str = "AI Resume Service"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = "change-me-in-production"
    PORT: int = 8001

    # ── Database ─────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/ai_resume"
    DATABASE_POOL_SIZE: int = 5
    DATABASE_MAX_OVERFLOW: int = 10

    # ── LLM Provider Switch ──────────────────────────────────────
    # Options: "openai" | "ollama"
    LLM_PROVIDER: str = "ollama"

    # ── OpenAI (kept for production / future use) ─────────────────
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    # ── Ollama (local dev) ────────────────────────────────────────
    # Local:  http://localhost:11434
    # Docker: http://host.docker.internal:11434
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"

    # ── Profile Service ──────────────────────────────────────────
    PROFILE_SERVICE_URL: str = "http://localhost:3002"

    # ── Storage (local / cloudinary) ─────────────────────────────
    STORAGE_BACKEND: Literal["local", "cloudinary"] = "local"
    LOCAL_STORAGE_PATH: str = "/tmp/ai_resume_storage"
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    CLOUDINARY_FOLDER: str = "ai_resumes"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
