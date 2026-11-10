from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.schemas.solver import (
    BatchVerificationRequest,
    BatchVerificationResponse,
    SolverStatisticsResponse,
    VerificationResponse,
)
from app.services.solver.verification_engine import verification_engine

router = APIRouter()


@router.post("/verify/{question_id}", response_model=VerificationResponse, summary="Independently verify a specific question")
def verify_question(question_id: str) -> VerificationResponse:
    """Solves the question independently using SymPy / rule-based domain solvers and compares against stored key and solution."""
    try:
        return verification_engine.verify_question(question_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Solver error: {str(e)}")


@router.post("/verify-batch", response_model=BatchVerificationResponse, summary="Batch verify questions")
def verify_batch(request: BatchVerificationRequest = BatchVerificationRequest()) -> BatchVerificationResponse:
    """Executes verification across a batch of questions with concurrency control."""
    try:
        return verification_engine.verify_batch(
            question_ids=request.question_ids,
            limit=request.limit or 50,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch solver error: {str(e)}")


@router.get("/verification/{question_id}", response_model=VerificationResponse, summary="Get cached or computed verification for a question")
def get_verification(question_id: str) -> VerificationResponse:
    """Returns cached verification result if available, or computes it on demand."""
    cached = verification_engine.get_cached_verification(question_id)
    if cached:
        return cached
    try:
        return verification_engine.verify_question(question_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/statistics", response_model=SolverStatisticsResponse, summary="Solver verification statistics across dataset")
def get_solver_statistics() -> SolverStatisticsResponse:
    """Returns distributions of verification statuses, methods, average confidence, and human review requirements."""
    return verification_engine.get_statistics()
