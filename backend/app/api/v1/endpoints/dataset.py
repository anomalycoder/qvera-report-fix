from fastapi import APIRouter
from app.schemas.dataset import DatasetHealthResponse, DatasetStatisticsResponse
from app.services.data_loader import data_loader

router = APIRouter()


@router.get("/health", response_model=DatasetHealthResponse, summary="Deep dataset health & integrity verification")
def get_dataset_health() -> DatasetHealthResponse:
    """Returns dataset integrity, missing/duplicate ID detection, and orphaned reference checks."""
    return data_loader.get_health_report()


@router.get("/statistics", response_model=DatasetStatisticsResponse, summary="Dataset statistical distributions")
def get_dataset_statistics() -> DatasetStatisticsResponse:
    """Returns question type, subject, report source distributions, and missing option counts."""
    return data_loader.get_statistics()
