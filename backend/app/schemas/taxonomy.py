from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class RepairDefinition(BaseModel):
    fields: List[str] = Field(default_factory=list, description="Fields this repair is allowed to touch")
    auto: bool = Field(..., description="Whether this repair can be auto-applied without human review")
    label: str = Field(..., description="Human-readable rule and scope description")


class TaxonomyData(BaseModel):
    verdicts: Dict[str, str] = Field(..., description="Mapping of verdict code to description")
    repairs: Dict[str, RepairDefinition] = Field(..., description="Mapping of repair code to its rules")


class RepairDetailResponse(BaseModel):
    repair_key: str
    label: str
    fields: List[str]
    auto: bool


class EditScopeValidationResult(BaseModel):
    is_valid: bool
    repair_key: str
    target_field: str
    permitted_fields: List[str]
    auto_allowed: bool
    error: Optional[str] = None
