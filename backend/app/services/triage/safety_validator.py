"""Safety Validator for Triage Engine.
Guards against prompt injection, verifies taxonomy closed lists, enforces edit scopes, and gatekeeps auto-apply.
"""

import re
from typing import Optional
from app.services.taxonomy_service import taxonomy_service

# Adversarial prompt injection signatures commonly attempted by malicious or playful users
INJECTION_PATTERNS = [
    re.compile(r"ignore\s+all\s+previous\s+instructions", re.IGNORECASE),
    re.compile(r"you\s+are\s+(?:the\s+)?admin(?:\s+bot)?", re.IGNORECASE),
    re.compile(r"system\s+prompt", re.IGNORECASE),
    re.compile(r"change\s+(?:the\s+)?answer\s+key\s+to", re.IGNORECASE),
    re.compile(r"grant\s+full\s+marks", re.IGNORECASE),
    re.compile(r"disregard\s+prior", re.IGNORECASE),
    re.compile(r"as\s+an\s+ai\s+language\s+model", re.IGNORECASE),
    re.compile(r"eval\(", re.IGNORECASE),
]


class SafetyValidator:
    @staticmethod
    def detect_prompt_injection(comment: str) -> bool:
        """Returns True if the comment contains hostile instructions or prompt injection attempts."""
        if not comment:
            return False
        for pattern in INJECTION_PATTERNS:
            if pattern.search(comment):
                return True
        return False

    @staticmethod
    def validate_verdict(verdict: str) -> bool:
        """Validates that verdict is in taxonomy closed list."""
        return taxonomy_service.is_valid_verdict(verdict)

    @staticmethod
    def validate_repair(repair: Optional[str]) -> bool:
        """Validates that repair key is in taxonomy closed list."""
        if repair is None:
            return True
        return taxonomy_service.is_valid_repair(repair)

    @staticmethod
    def validate_edit_scope(repair: Optional[str], target_field: Optional[str]) -> bool:
        """Validates that target_field is permitted for the given repair."""
        if not repair or not target_field:
            return True
        return taxonomy_service.validate_edit_field(repair, target_field)

    @staticmethod
    def can_auto_apply(repair: Optional[str], confidence: float) -> bool:
        """Enforces that auto-apply is ONLY permitted when:
        1. Repair exists and is active in taxonomy (active == true).
        2. Repair explicitly permits auto-apply (auto == true).
        3. Confidence score meets configured active taxonomy threshold.
        """
        if not repair:
            return False
        if not taxonomy_service.is_repair_active(repair):
            return False
        if not taxonomy_service.supports_auto_apply(repair):
            return False
        if confidence < taxonomy_service.get_confidence_floor():
            return False
        return True


safety_validator = SafetyValidator()
