from datetime import datetime, timezone
from pydantic import BaseModel, Field


class DataFilesStatus(BaseModel):
    questions_json: bool = False
    reports_json: bool = False
    taxonomy_json: bool = False
    data_dir_path: str = ""


class HealthCheckResponse(BaseModel):
    status: str = "healthy"
    service: str = "qvera-report-fix-backend"
    version: str = "1.0.0"
    environment: str = "development"
    database: str = "connected"
    data_files: DataFilesStatus
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
