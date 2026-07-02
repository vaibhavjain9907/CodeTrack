"""
Application configuration.

Centralizes all environment-driven settings using pydantic-settings.
This is the single source of truth for configuration — no module
should read os.environ directly; everything goes through `settings`.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # --- Project metadata ---
    PROJECT_NAME: str = "CodeTrack"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"  # development | staging | production

    # --- Security / JWT ---
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # --- Database ---
    DATABASE_URL: str

    # --- Redis / Celery (background sync jobs) ---
    REDIS_URL: str = "redis://redis:6379/0"
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/0"

    # --- CORS ---
    # Stored as a raw comma-separated string because pydantic-settings
    # attempts JSON-decoding of List-typed fields sourced from env vars
    # before any field_validator runs, which breaks plain comma-separated
    # input like "http://localhost:5173,https://codetrack.app".
    BACKEND_CORS_ORIGINS_RAW: str = "http://localhost:5173"

    @property
    def BACKEND_CORS_ORIGINS(self) -> list[str]:
        return [
            origin.strip() for origin in self.BACKEND_CORS_ORIGINS_RAW.split(",") if origin.strip()
        ]

    # --- External APIs ---
    LEETCODE_GRAPHQL_URL: str = "https://leetcode.com/graphql"
    CODEFORCES_API_BASE_URL: str = "https://codeforces.com/api"

    # --- Sync intervals (in minutes) ---
    PERIODIC_SYNC_INTERVAL_MINUTES: int = 360  # 6 hours


@lru_cache
def get_settings() -> Settings:
    """
    Cached settings accessor. Using lru_cache ensures the .env file
    is parsed only once per process, not on every import/request.
    """
    return Settings()


settings = get_settings()
