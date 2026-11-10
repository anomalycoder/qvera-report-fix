from typing import Any, Dict
from fastapi import APIRouter, HTTPException, Query
from app.schemas.taxonomy import (
    EditScopeValidationResult,
    RepairDetailResponse,
    TaxonomyData,
)
from app.services.taxonomy_service import taxonomy_service

router = APIRouter()


@router.get("", response_model=TaxonomyData, summary="Get complete closed taxonomy of verdicts and repairs")
def get_taxonomy() -> TaxonomyData:
    """Returns the closed list of verdicts, repairs, their permitted fields, and auto-apply flags."""
    return taxonomy_service.get_taxonomy_data()


@router.get("/repairs/{repair_key}", response_model=RepairDetailResponse, summary="Get details and rules for a specific repair")
def get_repair_detail(repair_key: str) -> RepairDetailResponse:
    detail = taxonomy_service.get_repair_detail(repair_key)
    if not detail:
        raise HTTPException(
            status_code=404,
            detail=f"Repair key '{repair_key}' does not exist in taxonomy",
        )
    return detail


@router.get("/validate-edit", response_model=EditScopeValidationResult, summary="Validate if a target field can be modified by a repair")
def validate_edit(
    repair_key: str = Query(..., description="Repair key, e.g. spelling, answer_key"),
    target_field: str = Query(..., description="Field to modify: question, solution, answer, questionType"),
) -> EditScopeValidationResult:
    return taxonomy_service.validate_edit_scope(repair_key, target_field)
