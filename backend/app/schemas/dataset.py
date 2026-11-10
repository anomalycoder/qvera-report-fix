from datetime import datetime, timezone
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class DatasetIntegrity(BaseModel):
    questions_count: int
    reports_count: int
    distinct_questions_in_questions: int
    distinct_reports_in_reports: int
    distinct_reported_questions: int
    duplicate_question_ids: List[str]
    duplicate_report_ids: List[str]
    invalid_report_references: List[str]
    unreported_questions_count: int
    unreported_question_ids: List[str]
    questions_with_multiple_reports_count: int
    questions_with_multiple_reports: Dict[str, int]


class DatasetHealthResponse(BaseModel):
    status: str = Field(..., description="healthy | degraded | unhealthy")
    dataset_integrity: DatasetIntegrity
    files_present: Dict[str, bool]
    anomalies_detected: List[str]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DatasetStatisticsResponse(BaseModel):
    total_questions: int
    total_reports: int
    distinct_reported_questions: int
    unreported_questions: int
    questions_with_duplicate_reports: int
    question_type_distribution: Dict[str, int]
    subject_distribution: Dict[str, int]
    report_source_distribution: Dict[str, int]
    missing_option_counts: int
    invalid_report_references: int
