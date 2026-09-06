"""Application settings, loaded from environment variables prefixed with ``HYPERSIGNAL_``."""

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="HYPERSIGNAL_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    cors_origins: list[str] = Field(
        default=["http://localhost:5173"],
        description="Browser origins allowed to call the API.",
    )
    feed_cache_ttl_seconds: float = Field(
        default=240.0,
        ge=0,
        description="Seconds a parsed feed is served from memory before being re-fetched.",
    )
    feed_timeout_seconds: float = Field(
        default=10.0,
        gt=0,
        description="Total timeout for an upstream feed request.",
    )
    feed_max_bytes: int = Field(
        default=5 * 1024 * 1024,
        gt=0,
        description="Maximum accepted feed body size in bytes.",
    )
    feed_allowed_hosts: list[str] = Field(
        default_factory=list,
        description="Optional host allowlist (exact or subdomain match); empty = any public host.",
    )
    user_agent: str = Field(
        default="hypersignal/0.1 (+https://github.com/haxybaxy/hypersignal)",
        description="User-Agent sent to upstream feeds.",
    )
    log_level: str = Field(default="INFO", description="Python logging level name.")
