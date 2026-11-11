import pytest
from fastapi import HTTPException
from app.api.v1.endpoints.faculty import (
    approve_correction,
    defer_review,
    get_faculty_audit,
    get_faculty_audit_detail,
    get_faculty_review_item,
    get_grouped_faculty_queue,
    get_grouped_question_case,
    get_live_analytics,
    get_workflow_overview,
    mark_no_change,
    reject_correction,
)
from app.api.v1.endpoints.reports import CreateReportRequest, create_live_report
from app.core.database import get_db_connection
from app.schemas.faculty import FacultyActionRequest
from app.schemas.triage import ProposedEdit


def test_grouped_queue_uniqueness_and_counts():
    overview = get_workflow_overview()
    grouped = get_grouped_faculty_queue(skip=0, limit=100)

    # Zero duplicate questionIds across queue & overview
    qids = [item["question_id"] for item in grouped["items"]]
    assert len(qids) == len(set(qids))
    assert overview["kpis"]["unique_questions"] == len(qids)
    assert overview["kpis"]["total_reports"] >= len(qids)

    # Known multi-report question (60f744b3f1b9bc7cc7b4a949 -> R001, R002, R003) appears ONCE with 3 reports
    case_resp = get_grouped_question_case("60f744b3f1b9bc7cc7b4a949")
    assert case_resp["case"]["report_count"] == 3
    report_ids = {r["report_id"] for r in case_resp["case"]["associated_reports"]}
    assert {"R001", "R002", "R003"}.issubset(report_ids)


def test_lifecycle_cases_and_safety_rules():
    grouped = get_grouped_faculty_queue(skip=0, limit=100)["items"]
    by_qid = {c["question_id"]: c for c in grouped}

    # 1. Genuine answer-key defect (60f744b3f1b9bc7cc7b4a949)
    assert by_qid["60f744b3f1b9bc7cc7b4a949"]["ai_verdict"] == "defect"
    assert by_qid["60f744b3f1b9bc7cc7b4a949"]["repair_type"] == "answer_key"

    # 2. Option content defect (622f08d7b70e4b50e4500a1b grouped R009/R010)
    assert by_qid["622f08d7b70e4b50e4500a1b"]["repair_type"] == "option_repair"

    # 4. Application bug (R038 -> 68f21df0941cda588bc0470b)
    assert by_qid["68f21df0941cda588bc0470b"]["ai_verdict"] == "app_issue"
    assert by_qid["68f21df0941cda588bc0470b"]["route"] == "no_change"

    # 5. Suspicious / prompt injection neutralized (R027 -> 6062ec84518e9535e120c422)
    assert by_qid["6062ec84518e9535e120c422"]["prompt_injection_detected"] is True
    assert by_qid["6062ec84518e9535e120c422"]["route"] == "no_change"

    # 6. Human-only repair (auto: false) NEVER routed to auto_apply
    for item in grouped:
        if item["repair_type"] and not item["repair_auto_allowed"]:
            assert item["route"] != "auto_apply"

    # 7. Auto-fix eligible repair passes taxonomy auto=true and confidence>=0.90
    auto_items = get_grouped_faculty_queue(skip=0, limit=100, view="auto_fix")["items"]
    assert len(auto_items) > 0
    for item in auto_items:
        assert item["repair_auto_allowed"] is True
        assert item["confidence"] >= 0.90
        assert item["prompt_injection_detected"] is False


def test_out_of_scope_edit_blocked_and_tracked():
    with get_db_connection() as conn:
        conn.cursor().execute("DELETE FROM triage_records WHERE report_id = 'R005';")
        conn.commit()

    before = get_workflow_overview()["ai_performance_and_safety"]["repair_safety"]["out_of_scope_edits_rejected"]
    bad_req = FacultyActionRequest(
        faculty_name="Dr. Security Check",
        notes="Forbidden field test",
        custom_edit=ProposedEdit(
            field="question",
            operation="replace",
            find="old",
            replace="new",
        ),
    )
    with pytest.raises(HTTPException) as exc:
        approve_correction("R005", bad_req)
    assert exc.value.status_code == 422

    after = get_workflow_overview()["ai_performance_and_safety"]["repair_safety"]["out_of_scope_edits_rejected"]
    assert after == before + 1


def test_rejected_cannot_be_applied_and_no_change_works():
    # Prepare isolated reset for R012 and R011
    with get_db_connection() as conn:
        conn.cursor().execute("DELETE FROM triage_records WHERE report_id IN ('R012', 'R011');")
        conn.commit()

    # Reject R012 -> subsequent approve without custom override must fail!
    rej_res = reject_correction(
        "R012",
        FacultyActionRequest(faculty_name="Dr. Reviewer", notes="Rejecting inaccurate edit"),
    )
    assert rej_res.action == "reject"

    with pytest.raises(HTTPException) as exc:
        approve_correction("R012", FacultyActionRequest(faculty_name="Dr. Reviewer"))
    assert exc.value.status_code == 400
    assert "rejected" in exc.value.detail.lower()

    # No-Change workflow commits audit record & updates grouped status cleanly
    nc_res = mark_no_change(
        "R011",
        FacultyActionRequest(faculty_name="Dr. Reviewer", notes="Question verified valid"),
    )
    assert nc_res.action == "no_change"
    assert nc_res.log_id is not None

    # Clean up test mutations on R011/R012 so baseline dataset state remains untouched
    with get_db_connection() as conn:
        conn.cursor().execute("DELETE FROM triage_records WHERE report_id IN ('R012', 'R011');")
        conn.commit()


def test_live_report_ingestion_and_grouping_cleanup():
    # Submit live report against existing question, verify grouping increments cleanly, then roll back
    target_qid = "60f744b3f1b9bc7cc7b4a949"
    before_case = get_grouped_question_case(target_qid)
    before_count = before_case["case"]["report_count"]

    created = create_live_report(
        CreateReportRequest(
            questionId=target_qid,
            comment="Live test check: phasor sum should be 50V",
            studentId="stu_pytest_live",
            source="web",
        )
    )
    new_rid = created["report"]["reportId"]

    try:
        after_case = get_grouped_question_case(target_qid)
        assert after_case["case"]["report_count"] == before_count + 1
    finally:
        with get_db_connection() as conn:
            conn.cursor().execute("DELETE FROM submitted_reports WHERE report_id = ?;", (new_rid,))
            conn.cursor().execute("DELETE FROM triage_records WHERE report_id = ?;", (new_rid,))
            conn.cursor().execute("DELETE FROM notifications WHERE report_id = ?;", (new_rid,))
            conn.commit()


def test_investigation_conflict_versioning_analytics_and_append_only_audit():
    import sqlite3

    # 1. Verify Investigation endpoint returns recoverable original + current version & provenance
    rev = get_faculty_review_item("R005")
    assert "original" in rev["question"]
    assert "version" in rev["question"]
    assert "provenance" in rev or "analysis_provenance" in rev
    cur_v = rev["question"]["version"]

    # 2. Stale expected_version triggers HTTP 409 Conflict Prevention
    with get_db_connection() as conn:
        conn.cursor().execute("DELETE FROM triage_records WHERE report_id = 'R005';")
        conn.commit()

    stale_req = FacultyActionRequest(
        faculty_name="Dr. Concurrency Test",
        notes="Stale version test",
        expected_version=cur_v + 99,
    )
    with pytest.raises(HTTPException) as exc:
        approve_correction("R005", stale_req)
    assert exc.value.status_code == 409

    # 3. Verify SQLite triggers enforce append-only immutability on audit_logs
    audit_page = get_faculty_audit(skip=0, limit=5)
    assert audit_page["total"] > 0
    latest_id = audit_page["logs"][0]["id"]
    detail = get_faculty_audit_detail(latest_id)
    assert detail["id"] == latest_id

    with get_db_connection() as conn:
        with pytest.raises(sqlite3.DatabaseError) as upd_exc:
            conn.cursor().execute("UPDATE audit_logs SET notes = 'tampered' WHERE id = ?;", (latest_id,))
        assert "append-only" in str(upd_exc.value).lower()

        with pytest.raises(sqlite3.DatabaseError) as del_exc:
            conn.cursor().execute("DELETE FROM audit_logs WHERE id = ?;", (latest_id,))
        assert "append-only" in str(del_exc.value).lower()

    # 4. Verify live filtered Analytics distinguishes unique questions vs reports & honest accuracy
    an_all = get_live_analytics(date_range="all")
    assert an_all["metrics"]["questions_reported"] == 39
    assert an_all["metrics"]["total_reports"] >= 44
    assert an_all["ai_quality_and_safety"]["ground_truth_accuracy_available"] is False

    an_phys_scq = get_live_analytics(date_range="all", verdict="defect", question_type="scq")
    assert an_phys_scq["metrics"]["questions_reported"] <= an_all["metrics"]["questions_reported"]
