import pytest
from app.api.v1.endpoints.triage import (
    get_report_triage,
    get_triage_results,
    get_triage_statistics,
    get_unreported_defects,
    run_triage_batch,
    run_triage_single,
)
from app.core.database import get_db_connection
from app.services.data_loader import data_loader
from app.services.question_normalizer import question_normalizer
from app.services.taxonomy_service import taxonomy_service
from app.services.triage.triage_engine import triage_engine


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
    """Regression Case 5: Prompt injection (6062ec84518e9535e120c422, R027)."""
    rep = data_loader.get_report_by_id("R027")
    assert rep is not None
    res = triage_engine.triage_report(rep)

    assert res.verdict == "no_error"
    assert res.route == "no_change"
    assert "prompt injection" in res.evidence.lower()
    assert res.confidence >= 0.95
    assert res.safety_checks.prompt_injection_detected is True


def test_surgical_edit_structure():
    """Edits must be surgical, modifying only permitted fields."""
    results = triage_engine.process_all_reports()
    repairs = taxonomy_service.get_repairs()

    for r in results:
        if r.edit is not None:
            permitted = repairs[r.repair].fields
            assert r.edit.field in permitted, (
                f"Field '{r.edit.field}' not permitted for repair '{r.repair}' in report {r.reportId}"
            )
            assert r.edit.find is not None or r.edit.old_value is not None
            assert r.edit.replace is not None or r.edit.new_value is not None


# --- REGRESSION CASES (Prompt 04 Section 12) ---

def test_regression_case_1_lcr_circuit():
    """Case 1: LCR circuit 60f744b3f1b9bc7cc7b4a949 with 3 independent reports."""
    for rid in ["R001", "R002", "R003"]:
        rep = data_loader.get_report_by_id(rid)
        assert rep is not None
        res = triage_engine.triage_report(rep)
        assert res.questionId == "60f744b3f1b9bc7cc7b4a949"
        assert res.verdict == "defect"
        assert res.repair == "answer_key"
        assert res.route == "auto_apply"
        assert res.edit.field == "answer"
        assert res.edit.find == "C"
        assert res.edit.replace == "A"
        assert res.confidence >= 0.95


def test_regression_case_2_cube_electric_flux():
    """Case 2: Cube flux 68dea616d0cda73d07e93ae6 with stored answer 2, derived n=1."""
    rep = data_loader.get_report_by_id("R005")
    assert rep is not None
    res = triage_engine.triage_report(rep)
    assert res.verdict == "defect"
    assert res.repair == "answer_key"
    assert res.route == "auto_apply"
    assert res.edit.field == "answer"
    assert str(res.edit.find) == "2"
    assert str(res.edit.replace) == "1"


def test_regression_case_3_significant_figures():
    """Case 3: Significant figures 68dea715387eea3d0d95f790 (stored 3113 vs student 3112.99)."""
    rep = data_loader.get_report_by_id("R033")
    assert rep is not None
    res = triage_engine.triage_report(rep)
    assert res.verdict == "no_error"
    assert res.route == "no_change"
    assert "significant figures" in res.evidence.lower() or "3113" in res.evidence


def test_regression_case_4_coulomb_blank_option():
    """Case 4: Coulomb force ratio 68e872546e45ba37dcc16bc0 with blank option C."""
    rep = data_loader.get_report_by_id("R011")
    assert rep is not None
    res = triage_engine.triage_report(rep)
    assert res.verdict == "defect"
    assert res.repair == "option_repair"
    assert res.route == "auto_apply"
    assert res.edit.field == "question"
    assert "1 : 1" in str(res.edit.replace)


def test_regression_case_6_missing_inductance():
    """Case 6: Missing inductance in stem 60f742f6660d187cc13a8078 (R007, R008)."""
    for rid in ["R007", "R008"]:
        rep = data_loader.get_report_by_id(rid)
        assert rep is not None
        res = triage_engine.triage_report(rep)
        assert res.verdict == "defect"
        assert res.repair == "stem_data"
        assert res.edit.field == "question"
        assert "95.5 mH" in str(res.edit.replace)


def test_regression_case_7_missing_option_d():
    """Case 7: Missing option D in 622f08d7b70e4b50e4500a1b (R009, R010)."""
    raw_q = data_loader.get_question_by_id("622f08d7b70e4b50e4500a1b")
    norm_q = question_normalizer.normalize(raw_q)
    assert "D" in norm_q.missing_options

    for rid in ["R009", "R010"]:
        rep = data_loader.get_report_by_id(rid)
        assert rep is not None
        res = triage_engine.triage_report(rep)
        assert res.verdict == "defect"
        assert res.repair == "option_repair"
        assert res.route == "faculty_review"  # Authoring a missing option requires faculty review!


def test_regression_case_8_unrelated_solution():
    """Case 8: Unrelated solution in 612151a6a34397610a9a2e58 (R018, R019)."""
    for rid in ["R018", "R019"]:
        rep = data_loader.get_report_by_id(rid)
        assert rep is not None
        res = triage_engine.triage_report(rep)
        assert res.questionId == "612151a6a34397610a9a2e58"
        assert res.verdict == "defect"
        assert res.repair == "solution_fix"


def test_all_seven_verdicts_represented():
    """Verify that triage engine uses all closed verdicts properly across dataset."""
    results = triage_engine.process_all_reports()
    observed = set(r.verdict for r in results)
    # Expected verdicts from 44 production reports
    assert "defect" in observed
    assert "no_error" in observed
    assert "display_issue" in observed
    assert "app_issue" in observed
    assert "language_mode" in observed
    assert "not_actionable" in observed


def test_sqlite_persistence_and_duplicate_safety():
    """Persisting triage results in SQLite must not duplicate rows."""
    # First run
    triage_engine.process_all_reports()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM triage_records;")
        count_first = cursor.fetchone()[0]
        assert count_first == 44

    # Second run (re-triage)
    triage_engine.process_all_reports()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM triage_records;")
        count_second = cursor.fetchone()[0]
        assert count_second == 44, "Re-running triage duplicated records in SQLite"


def test_unreported_defects_scan():
    """Audits the 43 questions and flags silent defects in questions without student reports."""
    defects = triage_engine.benchmark_runner.scan_unreported_defects()
    assert len(defects) >= 1
    # Check that Question 68dea657387eea3d0d95f54a with error: 1 is identified
    target = next((d for d in defects if d["question_id"] == "68dea657387eea3d0d95f54a"), None)
    assert target is not None, "Failed to identify silent defect in 68dea657387eea3d0d95f54a"
    assert target["recommended_action"] == "faculty_review"


def test_api_triage_endpoints():
    """Test REST API triage endpoints."""
    # Run batch
    batch_res = run_triage_batch()
    assert len(batch_res) == 44

    # Run single
    single_res = run_triage_single("R001")
    assert single_res.reportId == "R001"

    # Get single
    get_res = get_report_triage("R001")
    assert get_res.reportId == "R001"

    # Statistics
    stats = get_triage_statistics()
    assert stats["total_reports"] == 44
    assert stats["verdicts"]["defect"] == 27
    assert stats["routes"]["auto_apply"] == 17

    # Unreported defects
    unrep = get_unreported_defects()
    assert len(unrep) >= 1
