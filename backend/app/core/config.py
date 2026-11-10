from pathlib import Path
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Acadza Report -> Fix Engine"
    API_V1_STR: str = "/api/v1"
    ENV: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # SQLite
    DATABASE_URL: str = "sqlite:///./acadza.db"
    SQLITE_DB_PATH: Path = Path(__file__).resolve().parent.parent.parent / "acadza.db"

    # Data directory location (supports running from root or backend folder)
    DATA_DIR: Path = Path(__file__).resolve().parent.parent.parent.parent / "data"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # AI Configuration (Provider-Independent)
    LLM_PROVIDER: str = "provider_independent"
    LLM_API_KEY: str | None = None
    LLM_MODEL: str = "gemini-2.5-flash"

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parent.parent.parent / ".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def resolved_data_dir(self) -> Path:
        """Find data dir regardless of whether started from root or backend/"""
        candidates = [
            self.DATA_DIR,
            Path(__file__).resolve().parent.parent.parent / "data",
            Path.cwd() / "data",
            Path.cwd().parent / "data",
            Path.cwd() / "acadza-report-fix" / "data",
        ]
        for candidate in candidates:
            if candidate.exists() and (candidate / "taxonomy.json").exists():
                return candidate
        return self.DATA_DIR


settings = Settings()
