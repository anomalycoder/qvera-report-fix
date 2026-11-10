import pytest
from app.services.taxonomy_service import taxonomy_service


def test_verdict_validation():
    verdicts = taxonomy_service.get_verdicts()
    assert "defect" in verdicts
    assert "no_error" in verdicts
    assert "display_issue" in verdicts
    assert "not_actionable" in verdicts

    assert taxonomy_service.is_valid_verdict("defect") is True
    assert taxonomy_service.is_valid_verdict("no_error") is True
    assert taxonomy_service.is_valid_verdict("non_existent_verdict") is False


def test_repair_validation():
    repairs = taxonomy_service.get_repairs()
    assert "spelling" in repairs
    assert "answer_key" in repairs
    assert "diagram" in repairs
    assert "unsound" in repairs

    assert taxonomy_service.is_valid_repair("answer_key") is True
    assert taxonomy_service.is_valid_repair("fake_repair") is False


def test_repair_auto_flags():
    # Safe fixes can be auto
    assert taxonomy_service.is_auto_applicable("spelling") is True
    assert taxonomy_service.is_auto_applicable("markup_leak") is True
    assert taxonomy_service.is_auto_applicable("answer_key") is True

    # High-risk / authoring repairs must NOT be auto
    assert taxonomy_service.is_auto_applicable("diagram") is False
    assert taxonomy_service.is_auto_applicable("identical_options") is False
    assert taxonomy_service.is_auto_applicable("unsound") is False
    assert taxonomy_service.is_auto_applicable("wrong_question") is False


def test_edit_scope_restrictions():
    # answer_key permitted fields: ["answer", "solution"]
    valid_edit = taxonomy_service.validate_edit_scope("answer_key", "answer")
    assert valid_edit.is_valid is True
    assert valid_edit.error is None

    valid_sol_edit = taxonomy_service.validate_edit_scope("answer_key", "solution")
    assert valid_sol_edit.is_valid is True

    # answer_key cannot edit question text
    invalid_edit = taxonomy_service.validate_edit_scope("answer_key", "question")
    assert invalid_edit.is_valid is False
    assert "Forbidden field edit" in invalid_edit.error

    # diagram has no permitted fields for automated text edits
    diagram_edit = taxonomy_service.validate_edit_scope("diagram", "question")
    assert diagram_edit.is_valid is False
