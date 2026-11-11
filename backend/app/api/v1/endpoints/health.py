from datetime import datetime, timezone
from fastapi import APIRouter
from app.core.config import settings
from app.core.database import check_db_health
from app.services.data_loader import data_loader
from app.schemas.health import HealthCheckResponse, DataFilesStatus

router = APIRouter()


@router.get("/health", response_model=HealthCheckResponse, summary="Backend health and connectivity check")
def health_check() -> HealthCheckResponse:
    """Returns system status, SQLite database connectivity, and data files presence."""
    db_healthy = check_db_health()
    files_status = data_loader.check_files_exist()

    data_files = DataFilesStatus(
        questions_json=files_status.get("questions_json", False),
        reports_json=files_status.get("reports_json", False),
        taxonomy_json=files_status.get("taxonomy_json", False),
        data_dir_path=str(data_loader.data_dir.resolve()),
    )

    all_files_ok = all(files_status.values())
    status = "healthy" if db_healthy and all_files_ok else "degraded"

    return HealthCheckResponse(
        status=status,
        service="qvera-report-fix-backend",
        version="1.0.0",
        environment=settings.ENV,
        database="connected" if db_healthy else "disconnected",
        data_files=data_files,
        timestamp=datetime.now(timezone.utc),
    )
