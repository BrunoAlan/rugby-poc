"""Application configuration."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Database
    database_url: str = "postgresql+psycopg://rugby:rugby123@localhost:5432/rugby_stats"

    # Application
    app_env: str = "development"
    debug: bool = True

    # AI Analysis (OpenRouter)
    openrouter_api_key: str | None = None
    openrouter_model: str = "openai/gpt-4o-mini"
    ai_analysis_enabled: bool = True

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"

    @property
    def can_generate_ai_analysis(self) -> bool:
        """Check if AI analysis can be generated (API key configured and enabled)."""
        return self.ai_analysis_enabled and bool(self.openrouter_api_key)


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
