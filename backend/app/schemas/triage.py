from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, ConfigDict, Field, model_validator


class SafetyChecks(BaseModel):
    prompt_injection_detected: bool = False
    taxonomy_valid: bool = True
    permitted_fields_only: bool = True
    independent_verification_considered: bool = True


class ProposedEdit(BaseModel):
    field: str = Field(..., description="Target field: question, solution, answer, or questionType")
    operation: str = Field("replace", description="Operation type: replace, insert, delete")
    old_value: Optional[Any] = Field(None, description="Original content/substring to be replaced")
    new_value: Optional[Any] = Field(None, description="Replacement content or value")
    find: Optional[Any] = Field(None, description="Original content/substring alias")
    replace: Optional[Any] = Field(None, description="Replacement content alias")
    reason: Optional[str] = None
    evidence: List[str] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)

    @model_validator(mode="before")
    @classmethod
    def sync_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Sync find/old_value
            if "find" in data and "old_value" not in data:
                data["old_value"] = data["find"]
            elif "old_value" in data and "find" not in data:
                data["find"] = data["old_value"]

            # Sync replace/new_value
            if "replace" in data and "new_value" not in data:
                data["new_value"] = data["replace"]
            elif "new_value" in data and "replace" not in data:
                data["replace"] = data["new_value"]
        return data


class TriageResult(BaseModel):
    # Primary ground-truth keys
    reportId: str = Field(..., description="Matching reportId from reports.json")
    questionId: str = Field(..., description="Matching questionId")
    verdict: str = Field(..., description="Key from taxonomy.verdicts")
    repair: Optional[str] = Field(None, description="Key from taxonomy.repairs if verdict is defect")
    edit: Optional[ProposedEdit] = Field(None, description="Surgical repair edit")
    route: str = Field(..., description="auto_apply | faculty_review | no_change")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    evidence: str = Field(..., description="Clear concise derivation or reason")
    student_reply: str = Field(..., description="Empathetic, polite 1-3 sentences for student")

    # Extended Prompt 04 attributes for multi-spec interoperability
    report_id: Optional[str] = None
    question_id: Optional[str] = None
    repair_type: Optional[str] = None
    routing: Optional[str] = None
    confidence_reason: Optional[str] = None
    reasoning_summary: Optional[str] = None
    proposed_edits: List[ProposedEdit] = Field(default_factory=list)
    requires_human_review: bool = False
    safety_checks: SafetyChecks = Field(default_factory=SafetyChecks)

    model_config = ConfigDict(populate_by_name=True)

    @model_validator(mode="before")
    @classmethod
    def populate_extended_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            rid = data.get("reportId") or data.get("report_id")
            qid = data.get("questionId") or data.get("question_id")
            rep = data.get("repair") or data.get("repair_type")
            route_val = data.get("route") or data.get("routing")

            if rid:
                data["reportId"] = rid
                data["report_id"] = rid
            if qid:
                data["questionId"] = qid
                data["question_id"] = qid
            if rep:
                data["repair"] = rep
                data["repair_type"] = rep
            if route_val:
                data["route"] = route_val
                data["routing"] = route_val

            # If edit is present, add to proposed_edits
            if "edit" in data and data["edit"]:
                if "proposed_edits" not in data or not data["proposed_edits"]:
                    data["proposed_edits"] = [data["edit"]]
            elif "proposed_edits" in data and data["proposed_edits"] and "edit" not in data:
                data["edit"] = data["proposed_edits"][0]

            evidence_text = str(data.get("evidence", "")).lower()
            injection = "prompt injection" in evidence_text

            if "safety_checks" not in data or not data["safety_checks"]:
                data["safety_checks"] = SafetyChecks(
                    prompt_injection_detected=injection,
                    taxonomy_valid=True,
                    permitted_fields_only=True,
                    independent_verification_considered=True,
                )
            elif isinstance(data["safety_checks"], dict) and injection:
                data["safety_checks"]["prompt_injection_detected"] = True
            if "confidence_reason" not in data and "evidence" in data:
                data["confidence_reason"] = data["evidence"]
            if "requires_human_review" not in data:
                data["requires_human_review"] = route_val == "faculty_review"

        return data


class BenchmarkSummary(BaseModel):
    total_reports: int
    total_questions: int
    distinct_reported_questions: int
    verdict_distribution: Dict[str, int]
    repair_distribution: Dict[str, int]
    routing_distribution: Dict[str, int]
    average_confidence: float
    safety_summary: Dict[str, Any]
    unreported_defects: List[Dict[str, Any]]
