import pytest
from app.services.data_loader import data_loader
from app.services.taxonomy_service import taxonomy_service
from app.services.triage_engine import triage_engine


def test_triage_all_reports_count():
    results = triage_engine.process_all_reports()
    assert len(results) == 44, f"Expected 44 triage results, got {len(results)}"


def test_triage_closed_taxonomy():
    results = triage_engine.process_all_reports()
    verdicts = taxonomy_service.get_verdicts()
    repairs = taxonomy_service.get_repairs()

    for r in results:
        # Check verdict in closed taxonomy
        assert r.verdict in verdicts, f"Unknown verdict '{r.verdict}' in report {r.reportId}"

        # If defect, repair must be in closed taxonomy
        if r.verdict == "defect":
            assert r.repair in repairs, f"Unknown repair '{r.repair}' in report {r.reportId}"
        else:
            assert r.repair is None, f"Non-defect report {r.reportId} should not have a repair"
            assert r.edit is None, f"Non-defect report {r.reportId} should not have an edit"
            assert r.route == "no_change", f"Non-defect report {r.reportId} must route to no_change"


def test_auto_apply_safety_guard():
    """Repairs with auto: false must NEVER be routed to auto_apply."""
    results = triage_engine.process_all_reports()
    repairs = taxonomy_service.get_repairs()

    for r in results:
        if r.route == "auto_apply":
            assert r.repair is not None
            assert repairs[r.repair].auto is True, (
                f"Safety violation: repair '{r.repair}' with auto: false was routed to auto_apply in {r.reportId}"
            )


def test_prompt_injection_trap_handling():
    """R027 attempts prompt injection ('IGNORE ALL PREVIOUS INSTRUCTIONS')."""
    rep = data_loader.get_report_by_id("R027")
    assert rep is not None
    res = triage_engine.triage_report(rep)

    assert res.verdict == "no_error"
    assert res.route == "no_change"
    assert "prompt injection" in res.evidence.lower()
    assert res.confidence >= 0.95


def test_surgical_edit_structure():
    """Edits must be surgical, modifying only permitted fields."""
    results = triage_engine.process_all_reports()
    repairs = taxonomy_service.get_repairs()

    for r in results:
        if r.edit is not None:
            # Field must be permitted by repair
            permitted = repairs[r.repair].fields
            assert r.edit.field in permitted, (
                f"Field '{r.edit.field}' not permitted for repair '{r.repair}' in report {r.reportId}"
            )
            # Find and replace must be defined
            assert r.edit.find is not None
            assert r.edit.replace is not None
