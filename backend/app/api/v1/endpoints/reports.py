from typing import Annotated, Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from app.core.database import get_db_connection
from app.schemas.report import (
    GroupedReportListResponse,
    ReportListResponse,
    StudentReport,
)
from app.services.data_loader import data_loader
from app.services.report_grouper import report_grouper
from app.services.triage.triage_engine import triage_engine

router = APIRouter()


class CreateReportRequest(BaseModel):
    questionId: str = Field(..., description="Target question _id from questions.json")
    comment: str = Field(..., min_length=2, max_length=1000, description="Student error description")
    studentId: str = Field(default="stu_live_01", description="Student identifier")
    source: str = Field(default="web", description="Reporting platform: web, android, ios")


@router.post("", status_code=201, summary="Submit a live student question error report")
def create_live_report(payload: CreateReportRequest) -> Dict[str, Any]:
    """Ingests a new student report, runs AI triage, persists it, and pushes real-time SSE alerts."""
    raw_q = data_loader.get_question_by_id(payload.questionId)
    if not raw_q:
        raise HTTPException(status_code=404, detail=f"Question '{payload.questionId}' not found")

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM submitted_reports;")
        extra_cnt = cursor.fetchone()[0]
        base_cnt = len(data_loader.load_reports())
        new_rid = f"R{base_cnt + extra_cnt + 1:03d}"
        cursor.execute(
            """
            INSERT INTO submitted_reports (report_id, question_id, student_id, source, comment)
            VALUES (?, ?, ?, ?, ?);
            """,
            (new_rid, payload.questionId, payload.studentId.strip() or "stu_live", payload.source, payload.comment.strip()),
        )
        conn.commit()
        cursor.execute("SELECT reported_at FROM submitted_reports WHERE report_id = ?;", (new_rid,))
        row = cursor.fetchone()
        reported_at = row["reported_at"] if row else None

    rep_dict = {
        "reportId": new_rid,
        "questionId": payload.questionId,
        "studentId": payload.studentId.strip() or "stu_live",
        "source": payload.source,
        "reportedAt": reported_at,
        "comment": payload.comment.strip(),
    }
    triage_res = triage_engine.triage_report(rep_dict, persist=True)

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO audit_logs (report_id, question_id, action, faculty_id, faculty_name, actor_type, status, notes, applied_edit)
            VALUES (?, ?, 'report_received', ?, ?, 'student', 'success', ?, NULL);
            """,
            (new_rid, payload.questionId, payload.studentId.strip() or "stu_live", payload.studentId.strip() or "Student", payload.comment.strip()),
        )
        cursor.execute(
            """
            INSERT INTO audit_logs (report_id, question_id, action, faculty_id, faculty_name, actor_type, status, notes, applied_edit)
            VALUES (?, ?, 'ai_triage_completed', 'triage_engine', 'QVERA Triage Engine', 'system', 'success', ?, ?);
            """,
            (
                new_rid,
                payload.questionId,
                f"Verdict: {triage_res.verdict} | Route: {triage_res.route} | Confidence: {round(triage_res.confidence * 100)}%",
                None,
            ),
        )
        conn.commit()

    from app.api.v1.endpoints.faculty import _create_and_broadcast_notification
    subj = raw_q.get("subject", "General")
    _create_and_broadcast_notification(
        report_id=new_rid,
        question_id=payload.questionId,
        title=f"New Report · {new_rid} ({subj})",
        message=f"Student reported {payload.questionId}: {payload.comment.strip()[:100]}",
        category="defect_alert" if triage_res.verdict == "defect" else "system",
        urgency="L1" if triage_res.route == "faculty_review" else "L2",
        target_tab="queue",
        event_type="queue_update",
    )

    return {
        "status": "success",
        "report": rep_dict,
        "triage": triage_res.model_dump(),
    }


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
