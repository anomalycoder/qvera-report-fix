from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Query
from app.api.v1.endpoints.auth import require_admin
from app.schemas.taxonomy import (
    AdvancedTaxonomyImportRequest,
    EditScopeValidationResult,
    FullTaxonomyResponse,
    RepairCreateRequest,
    RepairDetailResponse,
    RepairUpdateRequest,
    TaxonomyData,
    TriageConfigUpdateRequest,
    VerdictCreateRequest,
    VerdictUpdateRequest,
)
from app.services.taxonomy_service import TaxonomyError, taxonomy_service

router = APIRouter()


def _handle_taxonomy_call(fn):
    try:
        return fn()
    except TaxonomyError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.get("", response_model=TaxonomyData, summary="Get active taxonomy verdicts and repairs")
def get_taxonomy() -> TaxonomyData:
    """Returns the verdicts, repairs, permitted fields, and auto-apply flags from the central service."""
    return taxonomy_service.get_taxonomy_data()


@router.get("/full", response_model=FullTaxonomyResponse, summary="Get versioned taxonomy, metadata, AI config, and history")
def get_full_taxonomy() -> FullTaxonomyResponse:
    """Returns the complete versioned taxonomy structure for Settings UI and audit traceability."""
    return taxonomy_service.get_full_configuration()


@router.get("/repairs/{repair_key}", response_model=RepairDetailResponse, summary="Get details and rules for a specific repair")
def get_repair_detail(repair_key: str) -> RepairDetailResponse:
    detail = taxonomy_service.get_repair_detail(repair_key)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Repair key '{repair_key}' does not exist in taxonomy")
    return detail


@router.get("/validate-edit", response_model=EditScopeValidationResult, summary="Validate if a target field can be modified by a repair")
def validate_edit(
    repair_key: str = Query(..., description="Repair key, e.g. spelling, answer_key"),
    target_field: str = Query(..., description="Field to modify: question, solution, answer, questionType"),
) -> EditScopeValidationResult:
    return taxonomy_service.validate_edit_scope(repair_key, target_field)


@router.post("/verdicts", response_model=FullTaxonomyResponse, summary="Add a new verdict classification (Admin only)")
def add_verdict(
    payload: VerdictCreateRequest,
    admin_user: Dict[str, Any] = Depends(require_admin),
) -> FullTaxonomyResponse:
    return _handle_taxonomy_call(
        lambda: taxonomy_service.add_verdict(
            payload.id,
            payload.display_name,
            payload.description,
            payload.active,
            payload.default_route,
            admin_user,
            payload.expected_version,
            payload.reason,
        )
    )


@router.patch("/verdicts/{verdict_id}", response_model=FullTaxonomyResponse, summary="Update or enable/disable an existing verdict (Admin only)")
def update_verdict(
    verdict_id: str,
    payload: VerdictUpdateRequest,
    admin_user: Dict[str, Any] = Depends(require_admin),
) -> FullTaxonomyResponse:
    return _handle_taxonomy_call(
        lambda: taxonomy_service.update_verdict(
            verdict_id,
            payload.display_name,
            payload.description,
            payload.active,
            payload.default_route,
            admin_user,
            payload.expected_version,
            payload.reason,
        )
    )


@router.post("/repairs", response_model=FullTaxonomyResponse, summary="Add a new repair type (Admin only)")
def add_repair(
    payload: RepairCreateRequest,
    admin_user: Dict[str, Any] = Depends(require_admin),
) -> FullTaxonomyResponse:
    return _handle_taxonomy_call(
        lambda: taxonomy_service.add_repair(
            payload.id,
            payload.display_name,
            payload.label,
            payload.fields,
            payload.auto,
            payload.confirm_auto_promotion,
            payload.active,
            admin_user,
            payload.expected_version,
            payload.reason,
        )
    )


@router.patch("/repairs/{repair_id}", response_model=FullTaxonomyResponse, summary="Update repair fields, auto flag, or active status (Admin only)")
def update_repair(
    repair_id: str,
    payload: RepairUpdateRequest,
    admin_user: Dict[str, Any] = Depends(require_admin),
) -> FullTaxonomyResponse:
    return _handle_taxonomy_call(
        lambda: taxonomy_service.update_repair(
            repair_id,
            payload.display_name,
            payload.label,
            payload.fields,
            payload.auto,
            payload.confirm_auto_promotion,
            payload.active,
            admin_user,
            payload.expected_version,
            payload.reason,
        )
    )


@router.patch("/triage-config", response_model=FullTaxonomyResponse, summary="Update AI triage confidence floor & safety gates (Admin only)")
def update_triage_config(
    payload: TriageConfigUpdateRequest,
    admin_user: Dict[str, Any] = Depends(require_admin),
) -> FullTaxonomyResponse:
    return _handle_taxonomy_call(
        lambda: taxonomy_service.update_triage_config(
            payload.auto_apply_confidence_floor,
            payload.require_independent_verification,
            payload.block_prompt_injections,
            admin_user,
            payload.expected_version,
            payload.reason,
        )
    )


@router.put("/advanced", response_model=FullTaxonomyResponse, summary="Schema-validated raw JSON taxonomy update (Admin only)")
def import_advanced_taxonomy(
    payload: AdvancedTaxonomyImportRequest,
    admin_user: Dict[str, Any] = Depends(require_admin),
) -> FullTaxonomyResponse:
    return _handle_taxonomy_call(
        lambda: taxonomy_service.import_advanced_json(
            payload.raw_json,
            payload.confirm_auto_promotion,
            admin_user,
            payload.expected_version,
            payload.reason,
        )
    )


@router.post("/rollback/{target_version}", response_model=FullTaxonomyResponse, summary="Restore an earlier taxonomy version by creating a new version (Admin only)")
def rollback_taxonomy(
    target_version: int,
    expected_version: int | None = Query(None),
    reason: str | None = Query(None),
    admin_user: Dict[str, Any] = Depends(require_admin),
) -> FullTaxonomyResponse:
    return _handle_taxonomy_call(
        lambda: taxonomy_service.rollback_to_version(
            target_version,
            admin_user,
            expected_version,
            reason,
        )
    )
