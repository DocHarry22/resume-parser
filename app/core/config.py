"""Application configuration."""

from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Optional


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
    allowed_extensions: list[str] = [".pdf", ".docx"]
    
    # NLP Settings
    spacy_model: str = "en_core_web_md"
    
    # Logging
    log_level: str = "INFO"
    
    # Paths
    data_dir: str = "data"
    
    model_config = ConfigDict(
        env_file=".env",
        case_sensitive=False
    )


# Singleton instance
settings = Settings()
