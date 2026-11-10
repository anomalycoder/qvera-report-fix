from typing import Any, Dict, List, Optional
from app.schemas.taxonomy import (
    EditScopeValidationResult,
    RepairDefinition,
    RepairDetailResponse,
    TaxonomyData,
)
from app.services.data_loader import data_loader


class TaxonomyService:
    """Dynamic Taxonomy validation and enforcement engine.
    Loads closed lists of verdicts and repairs directly from taxonomy.json.
    Ensures safe scoping and auto-apply gatekeeping.
    """

    def __init__(self):
        self._data: Optional[TaxonomyData] = None

    def _ensure_loaded(self) -> TaxonomyData:
        if self._data is None:
            raw = data_loader.load_taxonomy()
            raw_verdicts = raw.get("verdicts", {})
            raw_repairs = raw.get("repairs", {})

            repairs_dict = {}
            for k, v in raw_repairs.items():
                repairs_dict[k] = RepairDefinition(
                    fields=v.get("fields", []),
                    auto=v.get("auto", False),
                    label=v.get("label", ""),
                )

            self._data = TaxonomyData(
                verdicts=raw_verdicts,
                repairs=repairs_dict,
            )
        return self._data

    def get_taxonomy_data(self) -> TaxonomyData:
        return self._ensure_loaded()

    def get_verdicts(self) -> Dict[str, str]:
        return self._ensure_loaded().verdicts

    def get_repairs(self) -> Dict[str, RepairDefinition]:
        return self._ensure_loaded().repairs

    def is_valid_verdict(self, verdict_key: str) -> bool:
        """Returns True if verdict_key is in closed verdicts list."""
        return verdict_key in self.get_verdicts()

    def is_valid_repair(self, repair_key: Optional[str]) -> bool:
        """Returns True if repair_key is in closed repairs list."""
        if repair_key is None:
            return True
        return repair_key in self.get_repairs()

    def get_repair_detail(self, repair_key: str) -> Optional[RepairDetailResponse]:
        repairs = self.get_repairs()
        rep = repairs.get(repair_key)
        if not rep:
            return None
        return RepairDetailResponse(
            repair_key=repair_key,
            label=rep.label,
            fields=rep.fields,
            auto=rep.auto,
        )

    def get_permitted_fields(self, repair_key: str) -> List[str]:
        """Returns the closed list of fields a repair may modify."""
        rep = self.get_repairs().get(repair_key)
        if not rep:
            raise ValueError(f"Unknown repair key '{repair_key}'")
        return rep.fields

    def is_auto_applicable(self, repair_key: str) -> bool:
        """Returns True if repair allows auto: true without human sign-off."""
        rep = self.get_repairs().get(repair_key)
        if not rep:
            raise ValueError(f"Unknown repair key '{repair_key}'")
        return rep.auto

    def supports_auto_apply(self, repair_key: str) -> bool:
        """Alias for is_auto_applicable."""
        return self.is_auto_applicable(repair_key)

    def validate_edit_field(self, repair_key: str, target_field: str) -> bool:
        """Returns boolean True if field is permitted for repair_key."""
        res = self.validate_edit_scope(repair_key, target_field)
        return res.is_valid

    def validate_edit_scope(self, repair_key: str, target_field: str) -> EditScopeValidationResult:
        """Validates that a proposed edit only modifies fields within repair scope.
        Strictly prevents edits outside permitted repair scope.
        """
        repairs = self.get_repairs()
        if repair_key not in repairs:
            return EditScopeValidationResult(
                is_valid=False,
                repair_key=repair_key,
                target_field=target_field,
                permitted_fields=[],
                auto_allowed=False,
                error=f"Invalid repair key: '{repair_key}' does not exist in taxonomy.",
            )

        repair_def = repairs[repair_key]
        permitted = repair_def.fields

        # Check if field is allowed
        if target_field not in permitted:
            return EditScopeValidationResult(
                is_valid=False,
                repair_key=repair_key,
                target_field=target_field,
                permitted_fields=permitted,
                auto_allowed=repair_def.auto,
                error=(
                    f"Forbidden field edit: repair '{repair_key}' is restricted to "
                    f"fields {permitted}, but target field was '{target_field}'."
                ),
            )

        return EditScopeValidationResult(
            is_valid=True,
            repair_key=repair_key,
            target_field=target_field,
            permitted_fields=permitted,
            auto_allowed=repair_def.auto,
            error=None,
        )


taxonomy_service = TaxonomyService()
