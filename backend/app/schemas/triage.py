from typing import Any, Dict, Optional, Union
from pydantic import BaseModel, Field


class ProposedEdit(BaseModel):
    field: str = Field(..., description="Target field: question, solution, answer, or questionType")
    find: Optional[Any] = Field(None, description="Original content/substring to be replaced")
    replace: Optional[Any] = Field(None, description="Replacement content or value")


class TriageResult(BaseModel):
    reportId: str = Field(..., description="Matching reportId from reports.json")
    questionId: str = Field(..., description="Matching questionId")
    verdict: str = Field(..., description="Key from taxonomy.verdicts")
    repair: Optional[str] = Field(None, description="Key from taxonomy.repairs if verdict is defect")
    edit: Optional[ProposedEdit] = Field(None, description="Surgical repair edit")
    route: str = Field(..., description="auto_apply | faculty_review | no_change")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    evidence: str = Field(..., description="Clear concise derivation or reason")
    student_reply: str = Field(..., description="Empathetic, polite 1-3 sentences for student")
