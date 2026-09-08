"""Application configuration loaded from environment variables (.env in dev)."""
import os
import logging
from functools import lru_cache
from pydantic_settings import BaseSettings


logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    APP_NAME: str = "CVE Explorer"
    APP_VERSION: str = "4.0.0"
    # development | production
    APP_ENV: str = "development"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    DATABASE_URL: str = "sqlite+aiosqlite:///./cve_explorer.db"
    REDIS_URL: str = "redis://localhost:6379/0"

    # PostgreSQL connection pooling (ignored for SQLite)
    DATABASE_POOL_SIZE: int = 5
    DATABASE_MAX_OVERFLOW: int = 10

    # Comma-separated list of allowed CORS origins, e.g. "https://app.example.com"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://localhost:8080"

    # External intel API endpoints
    CIRCL_API: str = "https://cve.circl.lu/api"
    NVD_API: str = "https://services.nvd.nist.gov/rest/json/cves/2.0"
    NVD_API_KEY: str | None = None
    EPSS_API: str = "https://api.first.org/data/v1/epss"
    KEV_URL: str = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
    # GitHub token (optional) raises exploit-search rate limit from 60 to 5000 req/h
    GITHUB_TOKEN: str | None = None

    HTTP_TIMEOUT: int = 30

    # Upstream HTTP retry behaviour
    MAX_UPSTREAM_ATTEMPTS: int = 3
    UPSTREAM_RETRY_STATUSES: str = "403,429,500,502,503,504"

    # API-key protection for write endpoints (remediation/alerts). Empty = auth disabled.
    # Provide as "api_key_1,api_key_2,..." to accept any of several keys.
    API_KEYS: str = ""

    CACHE_TTL_CVE: int = 86400
    CACHE_TTL_EPSS: int = 21600
    CACHE_TTL_KEV: int = 43200

    # API rate limiting ("N/second", "N/minute", etc.); disabled when DEBUG=true
    RATE_LIMIT_DEFAULT: str = "60/minute"
    RATE_LIMIT_LOOKUP: str = "20/minute"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def api_keys(self) -> set[str]:
        """Accepted API keys for write endpoints. Empty set means auth is disabled."""
        return {k.strip() for k in self.API_KEYS.split(",") if k.strip()}

    @property
    def auth_enabled(self) -> bool:
        return bool(self.api_keys)

    @property
    def retry_statuses(self) -> set[int]:
        out = set()
        for part in self.UPSTREAM_RETRY_STATUSES.split(","):
            part = part.strip()
            if part.isdigit():
                out.add(int(part))
        return out

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() == "production"

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    if settings.is_production and not settings.api_keys:
        logger.warning(
            "API_KEYS is empty in production — write endpoints (remediation, alerts) "
            "are OPEN to anyone. Set API_KEYS in your environment."
        )
    return settings
