"""Application configuration."""

from pydantic import ConfigDict, Field, field_validator
from pydantic_settings import BaseSettings


SUPPORTED_SPACY_MODELS = {"en_core_web_sm", "en_core_web_md"}
SUPPORTED_EXTENSIONS = {".pdf", ".docx"}


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
    allowed_extensions: list[str] = Field(default_factory=lambda: [".pdf", ".docx"])

    # NLP Settings
    spacy_model: str = "en_core_web_md"
    nlp_max_text_chars: int = 20000

    # Logging
    log_level: str = "INFO"

    # CORS
    allowed_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])
    cors_allow_credentials: bool = False

    # Paths
    data_dir: str = "data"

    @field_validator("max_file_size_mb")
    @classmethod
    def validate_max_file_size_mb(cls, value: int) -> int:
        """Ensure upload size stays within a safe range."""
        if value <= 0 or value > 50:
            raise ValueError("max_file_size_mb must be between 1 and 50")
        return value

    @field_validator("allowed_extensions")
    @classmethod
    def validate_allowed_extensions(cls, value: list[str]) -> list[str]:
        """Normalize and validate allowed file extensions."""
        normalized = []
        for extension in value:
            ext = extension.strip().lower()
            if not ext.startswith("."):
                ext = f".{ext}"
            if ext not in SUPPORTED_EXTENSIONS:
                raise ValueError(f"Unsupported extension configured: {ext}")
            if ext not in normalized:
                normalized.append(ext)
        return normalized

    @field_validator("spacy_model")
    @classmethod
    def validate_spacy_model(cls, value: str) -> str:
        """Restrict runtime model loading to known-safe models."""
        model = value.strip()
        if model not in SUPPORTED_SPACY_MODELS:
            raise ValueError(
                f"spacy_model must be one of: {', '.join(sorted(SUPPORTED_SPACY_MODELS))}"
            )
        return model

    @field_validator("nlp_max_text_chars")
    @classmethod
    def validate_nlp_max_text_chars(cls, value: int) -> int:
        """Ensure NLP processing limits are sane."""
        if value < 1000 or value > 200000:
            raise ValueError("nlp_max_text_chars must be between 1000 and 200000")
        return value

    @field_validator("allowed_origins")
    @classmethod
    def validate_allowed_origins(cls, value: list[str]) -> list[str]:
        """Trim and deduplicate configured CORS origins."""
        origins = []
        for origin in value:
            cleaned = origin.strip().rstrip("/")
            if cleaned and cleaned not in origins:
                origins.append(cleaned)
        if not origins:
            raise ValueError("allowed_origins must contain at least one origin")
        return origins

    model_config = ConfigDict(
        env_file=".env",
        case_sensitive=False
    )


# Singleton instance
settings = Settings()
