from typing import Annotated, Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.schemas.question import QuestionDetailResponse, QuestionListResponse
from app.services.data_loader import data_loader
from app.services.question_normalizer import question_normalizer
from app.services.report_grouper import report_grouper

router = APIRouter()


@router.get("", response_model=QuestionListResponse, summary="List questions with pagination and filters")
def list_questions(
    skip: Annotated[int, Query(ge=0, description="Pagination offset")] = 0,
    limit: Annotated[int, Query(ge=1, le=100, description="Items per page")] = 50,
    subject: Annotated[Optional[str], Query(description="Filter by subject: Physics, Zoology, Botany")] = None,
    question_type: Annotated[Optional[str], Query(description="Filter by type: scq, mcq, integerQuestion")] = None,
    has_reports: Annotated[Optional[bool], Query(description="Filter by whether question has student reports")] = None,
) -> QuestionListResponse:
    all_questions = data_loader.load_questions()
    all_reports = data_loader.load_reports()
    reported_qids = set(r["questionId"] for r in all_reports)

    filtered = []
    for q in all_questions:
        if subject and q.get("subject", "").lower() != subject.lower():
            continue
        if question_type and q.get("questionType", "").lower() != question_type.lower():
            continue
        if has_reports is not None:
            is_reported = q.get("_id") in reported_qids
            if is_reported != has_reports:
                continue
        filtered.append(q)

    total = len(filtered)
    paginated = filtered[skip : skip + limit]

    return QuestionListResponse(
        total=total,
        skip=skip,
        limit=limit,
        questions=paginated,
    )


@router.get("/{question_id}", response_model=QuestionDetailResponse, summary="Get normalized question with attached reports")
def get_question(question_id: str) -> QuestionDetailResponse:
    raw_question = data_loader.get_question_by_id(question_id)
    if not raw_question:
        raise HTTPException(status_code=404, detail=f"Question '{question_id}' not found in dataset")

    normalized = question_normalizer.normalize(raw_question)
    group = report_grouper.get_group_for_question(question_id)

    reports_data = [r.model_dump() for r in group.reports] if group else []

    return QuestionDetailResponse(
        raw=raw_question,
        normalized=normalized,
        report_count=len(reports_data),
        reports=reports_data,
    )
