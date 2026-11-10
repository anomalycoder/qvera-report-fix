"""Surgical Edit Generator for Triage Engine.
Constructs precision JSON patches rather than rewriting full question models.
"""

from typing import Any, List, Optional
from app.schemas.triage import ProposedEdit
from app.services.triage.safety_validator import safety_validator


class EditGenerator:
    @staticmethod
    def create_edit(
        repair: str,
        field: str,
        old_value: Any,
        new_value: Any,
        reason: str,
        evidence: Optional[List[str]] = None,
    ) -> Optional[ProposedEdit]:
        """Constructs a validated surgical ProposedEdit."""
        # Validate that field is permitted for the given repair
        if not safety_validator.validate_edit_scope(repair, field):
            return None

        ev_list = evidence or []
        if reason and reason not in ev_list:
            ev_list = [reason] + ev_list

        return ProposedEdit(
            field=field,
            operation="replace",
            old_value=old_value,
            new_value=new_value,
            find=old_value,
            replace=new_value,
            reason=reason,
            evidence=ev_list,
        )


edit_generator = EditGenerator()
