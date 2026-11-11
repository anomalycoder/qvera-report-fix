import pytest
from fastapi import HTTPException
from app.api.v1.endpoints.auth import require_admin
from app.api.v1.endpoints.taxonomy import (
    add_repair,
    add_verdict,
    get_full_taxonomy,
    get_taxonomy,
    import_advanced_taxonomy,
    rollback_taxonomy,
    update_repair,
    update_triage_config,
    update_verdict,
)
from app.core.security import ADMIN_EMAIL, ADMIN_NAME, DEMO_EMAIL, DEMO_NAME, seed_demo_user
from app.schemas.taxonomy import (
    AdvancedTaxonomyImportRequest,
    RepairCreateRequest,
    RepairUpdateRequest,
    TriageConfigUpdateRequest,
    VerdictCreateRequest,
    VerdictUpdateRequest,
)
from app.services.taxonomy_service import taxonomy_service
from app.services.triage.safety_validator import safety_validator


def test_taxonomy_loading_and_role_enforcement():
    # Ensure demo & admin accounts seeded cleanly
    faculty_user = seed_demo_user()
    admin_user = {"id": 999, "email": ADMIN_EMAIL, "name": ADMIN_NAME, "role": "admin"}

    # Faculty blocked by backend require_admin guard (HTTP 403)
    with pytest.raises(HTTPException) as exc:
        require_admin(current_user=faculty_user)
    assert exc.value.status_code == 403

    # Admin authorized cleanly
    assert require_admin(current_user=admin_user)["role"] == "admin"

    # Full taxonomy structure loads baseline seed verdicts (7) & repairs (18)
    full = get_full_taxonomy()
    assert len(full.verdicts) >= 7
    assert len(full.repairs) >= 18
    assert full.available_fields == ["question", "solution", "answer", "questionType"]

    diagram_item = next(r for r in full.repairs if r.id == "diagram")
    assert diagram_item.auto is False
    assert diagram_item.fields == []


def test_dynamic_taxonomy_crud_validation_versioning_and_rollback():
    admin_user = {"id": 999, "email": ADMIN_EMAIL, "name": ADMIN_NAME, "role": "admin"}
    initial = get_full_taxonomy()
    start_ver = initial.version

    # 1. Duplicate identifier rejected (409)
    with pytest.raises(HTTPException) as dup_exc:
        add_verdict(
            VerdictCreateRequest(
                id="defect",
                display_name="Duplicate",
                description="Attempting duplicate verdict key",
                expected_version=start_ver,
            ),
            admin_user=admin_user,
        )
    assert dup_exc.value.status_code == 409

    # 2. Promoting auto:false -> auto:true without explicit confirmation rejected (422)
    with pytest.raises(HTTPException) as promo_exc:
        update_repair(
            "diagram",
            RepairUpdateRequest(
                display_name="Diagram",
                label="Figure missing or wrong.",
                fields=["question"],
                auto=True,
                confirm_auto_promotion=False,
                active=True,
                expected_version=start_ver,
            ),
            admin_user=admin_user,
        )
    assert promo_exc.value.status_code == 422

    # 3. Invalid question field rejected (422)
    with pytest.raises(HTTPException) as fld_exc:
        add_repair(
            RepairCreateRequest(
                id="bad_field_repair",
                display_name="Bad Field",
                label="Trying unsupported question schema field",
                fields=["arbitrary_meta"],
                auto=False,
                expected_version=start_ver,
            ),
            admin_user=admin_user,
        )
    assert fld_exc.value.status_code == 422

    # 4. Concurrent version conflict rejected (409)
    with pytest.raises(HTTPException) as conf_exc:
        update_verdict(
            "defect",
            VerdictUpdateRequest(
                display_name="Defect",
                description="Stale conflict update",
                expected_version=start_ver + 50,
            ),
            admin_user=admin_user,
        )
    assert conf_exc.value.status_code == 409

    # 5. Disable spelling repair & verify SafetyValidator disables auto-apply + validate_edit_scope blocks it
    v2 = update_repair(
        "spelling",
        RepairUpdateRequest(
            display_name="Spelling",
            label="Spelling or grammar. Words only; no value, symbol or image moves.",
            fields=["question", "solution"],
            auto=True,
            active=False,
            expected_version=start_ver,
            reason="Temporarily disabling spelling for verification",
        ),
        admin_user=admin_user,
    )
    assert v2.version == start_ver + 1
    assert safety_validator.can_auto_apply("spelling", 0.99) is False
    assert taxonomy_service.validate_edit_scope("spelling", "question").is_valid is False

    # 6. Update triage confidence floor cleanly
    v3 = update_triage_config(
        TriageConfigUpdateRequest(
            auto_apply_confidence_floor=0.95,
            require_independent_verification=True,
            block_prompt_injections=True,
            expected_version=v2.version,
        ),
        admin_user=admin_user,
    )
    assert v3.version == v2.version + 1
    assert safety_validator.can_auto_apply("answer_key", 0.92) is False

    # 7. Safe rollback to start_ver creates NEW sequential version without erasing history
    restored = rollback_taxonomy(
        target_version=start_ver,
        expected_version=v3.version,
        reason="Restoring baseline validated taxonomy after test",
        admin_user=admin_user,
    )
    assert restored.version == v3.version + 1
    assert len(restored.versions) >= 4
    assert safety_validator.can_auto_apply("spelling", 0.95) is True
    assert taxonomy_service.validate_edit_scope("spelling", "question").is_valid is True
