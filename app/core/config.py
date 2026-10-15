"""Application configuration."""

from pydantic_settings import BaseSettings
from pydantic import ConfigDict, Field, field_validator, model_validator
from typing import Optional, Literal
from urllib.parse import urlparse


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Settings
    app_name: str = "Resume Parser API"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Server Settings
    host: str = "0.0.0.0"
    port: int = 8000
    
    # File Upload Settings
    max_file_size_mb: int = 25
    allowed_extensions: list[str] = [".pdf", ".docx", ".txt"]
    max_extracted_characters: int = Field(default=250_000, ge=1_000, le=250_000)
    max_pdf_pages: int = Field(default=100, ge=1, le=100)
    max_docx_expanded_mb: int = Field(default=100, ge=1, le=100)
    max_concurrent_processing: int = Field(default=0, ge=0, le=20)
    request_body_timeout_seconds: float = Field(default=0, ge=0, le=180)
    # Local mode processes uploads/exports without saving personal documents.
    storage_mode: Literal["guest", "local"] = "guest"

    # Exact frontend origins. Set CORS_ORIGINS to a JSON array in production.
    cors_origins: list[str] = [
        "https://resume.docheng.co.za", "http://localhost:3000", "http://127.0.0.1:3000"
    ]
    workspace_secret: Optional[str] = None
    cookie_secure: bool = True
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    ai_api_key: Optional[str] = None
    ai_base_url: str = "https://api.openai.com/v1"
    ai_model: Optional[str] = None
    rate_limit_requests: int = 60
    ai_requests_per_minute: int = 10
    
    # NLP Settings
    spacy_model: str = "en_core_web_md"
    
    # Logging
    log_level: str = "INFO"
    
    # Paths
    data_dir: str = "data"
    taxonomy_dir: Optional[str] = None
    
    @field_validator("cors_origins")
    @classmethod
    def validate_origins(cls, origins):
        for origin in origins:
            parsed = urlparse(origin)
            if parsed.scheme not in {"http", "https"} or not parsed.netloc or parsed.path or parsed.query or parsed.fragment or parsed.username:
                raise ValueError("CORS origins must be exact HTTP(S) origins without a trailing slash")
        return origins

    @model_validator(mode="after")
    def validate_cookie_security(self):
        if self.cookie_samesite == "none" and not self.cookie_secure:
            raise ValueError("SameSite=None requires secure cookies")
        return self

    model_config = ConfigDict(
        env_file=".env",
        case_sensitive=False
    )


# Singleton instance
settings = Settings()
