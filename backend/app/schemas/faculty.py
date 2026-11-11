from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.triage import ProposedEdit


class FacultyActionRequest(BaseModel):
    faculty_id: Optional[str] = Field("faculty_1", description="Reviewer employee/faculty ID")
    faculty_name: Optional[str] = Field("Dr. A. Sharma", description="Reviewer display name")
    notes: Optional[str] = Field(None, description="Faculty review rationale or escalation reason")
    custom_edit: Optional[ProposedEdit] = Field(None, description="Adjusted surgical edit if modified by faculty")
    apply_to_question: bool = Field(False, description="Apply status update across all grouped reports for the same question")
    expected_version: Optional[int] = Field(None, description="Optimistic concurrency version check for question record")


class FacultyActionResponse(BaseModel):
    status: str
    report_id: str
    question_id: str
    action: str
    message: str
    log_id: Optional[int] = None
    applied_edit: Optional[ProposedEdit] = None


class FacultyOverviewResponse(BaseModel):
    total_reports: int
    confirmed_defects: int
    pending_faculty_reviews: int
    automatically_applied_fixes: int
    no_error_reports: int
    unreported_defects_count: int
    verdict_distribution: Dict[str, int]
    routing_distribution: Dict[str, int]
    high_priority_issues: List[Dict[str, Any]] = Field(default_factory=list)
    recent_faculty_actions: List[Dict[str, Any]] = Field(default_factory=list)


class FacultyQueueItem(BaseModel):
    report_id: str
    question_id: str
    subject: str
    chapter: str
    question_type: str
    source: str
    reported_at: Optional[str] = None
    comment_preview: str
    verdict: str
    repair_type: Optional[str] = None
    confidence: float
    urgency_level: str  # 'L1', 'L2', 'L3', 'L4'
    urgency_label: str  # 'Critical', 'High', 'Medium', 'Low'
    routing: str
    review_status: str  # 'pending', 'approved', 'rejected', 'deferred'
    report_count: int
    proposed_edit: Optional[ProposedEdit] = None

    model_config = ConfigDict(populate_by_name=True)


class FacultyQueueResponse(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[FacultyQueueItem]
