from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class AuditActionCreate(BaseModel):
    report_id: str
    question_id: str
    action: str = Field(..., description="approve | edit | reject")
    faculty_id: Optional[str] = "faculty_1"
    faculty_name: Optional[str] = "Reviewing Faculty"
    notes: Optional[str] = None
    applied_edit: Optional[Dict[str, Any]] = None


class AuditAction(AuditActionCreate):
    id: int
    created_at: str
