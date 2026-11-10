from enum import Enum
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


class VerificationStatus(str, Enum):
    VERIFIED = "verified"
    MISMATCH = "mismatch"
    UNCERTAIN = "uncertain"
    UNSUPPORTED = "unsupported"


class SolverMethod(str, Enum):
    SYMPY = "sympy"
    RULE_BASED = "rule_based"
    KNOWLEDGE_CHECK = "knowledge_check"
    UNAVAILABLE = "unavailable"


class VerificationResponse(BaseModel):
    question_id: str
    question_type: str
    stored_answer: Any
    independently_derived_answer: Optional[Any] = None
    solution_answer: Optional[Any] = None
    verification_status: VerificationStatus
    solver_method: SolverMethod
    confidence: float = Field(..., ge=0.0, le=1.0)
    reasoning_summary: str
    evidence: List[str] = Field(default_factory=list)
    requires_human_review: bool
    details: Optional[Dict[str, Any]] = None


class BatchVerificationRequest(BaseModel):
    question_ids: Optional[List[str]] = Field(None, description="Optional subset of IDs. If omitted, all questions are verified.")
    limit: Optional[int] = Field(50, ge=1, le=100)


class BatchVerificationResponse(BaseModel):
    total_processed: int
    verified_count: int
    mismatch_count: int
    uncertain_count: int
    unsupported_count: int
    results: List[VerificationResponse]


class SolverStatisticsResponse(BaseModel):
    total_verified: int
    by_status: Dict[str, int]
    by_method: Dict[str, int]
    human_review_required_count: int
    average_confidence: float
