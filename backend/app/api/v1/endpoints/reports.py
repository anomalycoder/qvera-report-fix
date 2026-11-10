from typing import Annotated, Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.schemas.report import (
    GroupedReportListResponse,
    ReportListResponse,
    StudentReport,
)
from app.services.data_loader import data_loader
from app.services.report_grouper import report_grouper

router = APIRouter()


@router.get("", response_model=ReportListResponse, summary="List student reports with pagination and filtering")
def list_reports(
    skip: Annotated[int, Query(ge=0, description="Pagination offset")] = 0,
    limit: Annotated[int, Query(ge=1, le=100, description="Items per page")] = 50,
    source: Annotated[Optional[str], Query(description="Filter by reporting source: web, android, ios")] = None,
    question_id: Annotated[Optional[str], Query(description="Filter by questionId")] = None,
) -> ReportListResponse:
    reports = data_loader.load_reports()

    filtered = []
    for r in reports:
        if source and r.get("source", "").lower() != source.lower():
            continue
        if question_id and r.get("questionId") != question_id:
            continue
        filtered.append(StudentReport(**r))

    total = len(filtered)
    paginated = filtered[skip : skip + limit]

    return ReportListResponse(
        total=total,
        skip=skip,
        limit=limit,
        reports=paginated,
    )


@router.get("/grouped", response_model=GroupedReportListResponse, summary="Get reports grouped by question with aggregated metrics")
def get_grouped_reports() -> GroupedReportListResponse:
    """Returns reports aggregated by questionId, with multi-student detection and source breakdowns."""
    groups = report_grouper.group_reports()
    total_reps = sum(g.total_reports for g in groups)

    return GroupedReportListResponse(
        total_questions_reported=len(groups),
        total_reports=total_reps,
        groups=groups,
    )


@router.get("/{report_id}", response_model=StudentReport, summary="Get specific student report by ID")
def get_report(report_id: str) -> StudentReport:
    report = data_loader.get_report_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found")
    return StudentReport(**report)
