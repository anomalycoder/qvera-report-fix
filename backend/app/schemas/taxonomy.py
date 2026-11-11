from typing import Any, Dict, List, Optional
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


class VerdictConfigItem(BaseModel):
    id: str
    display_name: str
    description: str
    active: bool = True
    default_route: str = "no_change"
    usage_count: int = 0


class RepairConfigItem(BaseModel):
    id: str
    display_name: str
    label: str
    fields: List[str] = Field(default_factory=list)
    auto: bool = False
    active: bool = True
    usage_count: int = 0


class TriageConfigSettings(BaseModel):
    auto_apply_confidence_floor: float = Field(default=0.90, ge=0.50, le=1.00)
    require_independent_verification: bool = True
    block_prompt_injections: bool = True


class TaxonomyVersionEntry(BaseModel):
    version: int
    change_summary: str
    updated_by: str
    updated_by_role: str
    created_at: str
    verdict_count: int
    repair_count: int


class FullTaxonomyResponse(BaseModel):
    version: int
    updated_at: Optional[str] = None
    updated_by: Optional[str] = None
    available_fields: List[str]
    verdicts: List[VerdictConfigItem]
    repairs: List[RepairConfigItem]
    triage_config: TriageConfigSettings
    versions: List[TaxonomyVersionEntry]


class VerdictCreateRequest(BaseModel):
    id: str = Field(..., min_length=2, max_length=48)
    display_name: str = Field(..., min_length=2, max_length=80)
    description: str = Field(..., min_length=5, max_length=300)
    active: bool = True
    default_route: str = "no_change"
    expected_version: Optional[int] = None
    reason: Optional[str] = None


class VerdictUpdateRequest(BaseModel):
    display_name: str = Field(..., min_length=2, max_length=80)
    description: str = Field(..., min_length=5, max_length=300)
    active: bool = True
    default_route: str = "no_change"
    expected_version: Optional[int] = None
    reason: Optional[str] = None


class RepairCreateRequest(BaseModel):
    id: str = Field(..., min_length=2, max_length=48)
    display_name: str = Field(..., min_length=2, max_length=80)
    label: str = Field(..., min_length=5, max_length=300)
    fields: List[str] = Field(default_factory=list)
    auto: bool = False
    confirm_auto_promotion: bool = False
    active: bool = True
    expected_version: Optional[int] = None
    reason: Optional[str] = None


class RepairUpdateRequest(BaseModel):
    display_name: str = Field(..., min_length=2, max_length=80)
    label: str = Field(..., min_length=5, max_length=300)
    fields: List[str] = Field(default_factory=list)
    auto: bool = False
    confirm_auto_promotion: bool = False
    active: bool = True
    expected_version: Optional[int] = None
    reason: Optional[str] = None


class TriageConfigUpdateRequest(BaseModel):
    auto_apply_confidence_floor: float = Field(..., ge=0.50, le=1.00)
    require_independent_verification: bool = True
    block_prompt_injections: bool = True
    expected_version: Optional[int] = None
    reason: Optional[str] = None


class AdvancedTaxonomyImportRequest(BaseModel):
    raw_json: Dict[str, Any]
    expected_version: Optional[int] = None
    confirm_auto_promotion: bool = False
    reason: Optional[str] = "Advanced JSON configuration import"
