from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://interview_user:interview_pass@localhost:5432/interview_db"
    SYNC_DATABASE_URL: str = "postgresql+psycopg2://interview_user:interview_pass@localhost:5432/interview_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    SECRET_KEY: str = "change-me-in-production-must-be-32-chars-min"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # LLM Configuration
    LLM_PROVIDER: str = "openai"  # ollama | google | openai
    OPENAI_API_KEY: str = "sk-placeholder"
    OPENAI_BASE_URL: str | None = None
    GOOGLE_API_KEY: str = ""
    SECRET_KEY: str = "dev-secret-not-used-in-prod" # Only for /dev/token
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_TIMEOUT: int = 120          # bumped for local model latency
    LLM_MAX_RETRIES: int = 2

    # Ollama (local dev)
    # Local:  http://localhost:11434
    # Docker: http://host.docker.internal:11434
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    # Cloudinary storage
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    CLOUDINARY_FOLDER: str = "interview_audio"

    # App
    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"
    CORS_ORIGINS: str = '["http://localhost:3000"]'
    PORT: int = 8002

    # Cache
    QUESTION_CACHE_TTL: int = 3600

    @property
    def cors_origins_list(self) -> List[str]:
        try:
            return json.loads(self.CORS_ORIGINS)
        except Exception:
            return ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
