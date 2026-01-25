"""
Centralized configuration management using Pydantic settings.

All configuration is loaded from environment variables with sensible defaults.
"""

import os
from functools import lru_cache
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    database_url: str = ""
    db_pool_size: int = 5
    db_max_overflow: int = 10
    db_pool_recycle: int = 3600

    # Security
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 168  # 7 days
    admin_secret: str = ""

    # OAuth - GitHub
    github_client_id: str = ""
    github_client_secret: str = ""

    # OAuth - Google
    google_client_id: str = ""
    google_client_secret: str = ""

    # URLs
    app_url: str = "http://localhost:3000"
    api_url: str = "http://localhost:8090/api"
    allowed_origins: str = "http://localhost:3000"

    # Logging
    log_level: str = "INFO"
    log_json: bool = True

    @field_validator("database_url", mode="before")
    @classmethod
    def resolve_database_url(cls, v: str) -> str:
        """Try multiple env var names for database URL."""
        if v:
            return v
        # Try alternative names
        url = os.environ.get("DATABASE_URL") or os.environ.get("POSTGRES_URL", "")
        # Convert postgres:// to postgresql:// for SQLAlchemy
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    @field_validator("log_json", mode="before")
    @classmethod
    def parse_log_json(cls, v) -> bool:
        """Parse LOG_JSON from string to bool."""
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            return v.lower() in ("true", "1", "yes")
        return True

    @property
    def allowed_origins_list(self) -> List[str]:
        """Get allowed origins as a list."""
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def is_github_oauth_configured(self) -> bool:
        """Check if GitHub OAuth is properly configured."""
        return bool(self.github_client_id and self.github_client_secret)

    @property
    def is_google_oauth_configured(self) -> bool:
        """Check if Google OAuth is properly configured."""
        return bool(self.google_client_id and self.google_client_secret)

    @property
    def is_database_configured(self) -> bool:
        """Check if database is configured."""
        return bool(self.database_url)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        # Map environment variable names to field names
        env_prefix = ""
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.

    Uses lru_cache to ensure settings are only loaded once.
    """
    return Settings()
