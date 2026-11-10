from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class StudentReportBase(BaseModel):
    reportId: str = Field(..., description="Unique report ID, e.g. R005")
    questionId: str = Field(..., description="MongoDB ObjectID matching question _id")
    studentId: str = Field(..., description="Student identifier")
    source: str = Field(..., description="Platform reporting source: web, android, ios")
    reportedAt: str = Field(..., description="ISO timestamp of report")
    comment: str = Field(..., description="Raw student comment text")


class StudentReport(StudentReportBase):
    pass


class ReportCommentDetail(BaseModel):
    reportId: str
    studentId: str
    source: str
    reportedAt: str
    comment: str


class GroupedQuestionReports(BaseModel):
    questionId: str
    total_reports: int
    unique_students: int
    first_reported_at: str
    latest_reported_at: str
    source_distribution: Dict[str, int]
    is_multi_student: bool
    is_duplicate_reported: bool
    comments: List[str]
    reports: List[ReportCommentDetail]


class ReportListResponse(BaseModel):
    total: int
    skip: int
    limit: int
    reports: List[StudentReport]


class GroupedReportListResponse(BaseModel):
    total_questions_reported: int
    total_reports: int
    groups: List[GroupedQuestionReports]
