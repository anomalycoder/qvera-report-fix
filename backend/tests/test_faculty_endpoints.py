import pytest
from fastapi import HTTPException
from app.api.v1.endpoints.faculty import (
    approve_correction,
    defer_review,
    get_faculty_analytics,
    get_faculty_audit,
    get_faculty_overview,
    get_faculty_queue,
    get_faculty_review_item,
    reject_correction,
)
from app.schemas.faculty import FacultyActionRequest
from app.schemas.triage import ProposedEdit
from app.core.database import get_db_connection


def test_faculty_overview():
    overview = get_faculty_overview()
    assert overview.total_reports == 44
    assert overview.confirmed_defects == 27
    assert overview.automatically_applied_fixes == 17
    assert overview.no_error_reports == 12
    assert overview.unreported_defects_count >= 1
    assert "defect" in overview.verdict_distribution
    assert "auto_apply" in overview.routing_distribution
    assert len(overview.high_priority_issues) > 0


def test_faculty_queue_filtering_and_urgency():
    # Full queue
    queue = get_faculty_queue(skip=0, limit=50)
    assert queue.total == 44
    assert len(queue.items) == 44

    # Filter by urgency L1
    l1_queue = get_faculty_queue(skip=0, limit=50, urgency="L1")
    assert l1_queue.total > 0
    for item in l1_queue.items:
        assert item.urgency_level == "L1"
        assert item.urgency_label == "Critical"

    # Filter by subject Physics
    phys_queue = get_faculty_queue(skip=0, limit=50, subject="Physics")
    assert phys_queue.total > 0
    for item in phys_queue.items:
        assert item.subject.lower() == "physics"

    # Search filter
    search_queue = get_faculty_queue(skip=0, limit=50, search="R001")
    assert search_queue.total >= 1
    assert search_queue.items[0].report_id == "R001"


def test_faculty_review_item_workspace_data():
    item_data = get_faculty_review_item("R001")
    assert item_data["report"]["reportId"] == "R001"
    assert "question" in item_data
    assert "stem_text" in item_data["question"]["normalized"]
    assert "solver_verification" in item_data
    assert item_data["solver_verification"]["verification_status"] == "mismatch"
    assert "peer_reports" in item_data
    assert len(item_data["peer_reports"]) == 3  # R001, R002, R003 for 60f744b3f1b9bc7cc7b4a949
    assert item_data["review_status"] in ("pending", "approved", "rejected", "deferred")


def test_faculty_approval_and_duplicate_prevention():
    # Reset R003 status to pending for idempotent test runs
    with get_db_connection() as conn:
        conn.cursor().execute("UPDATE triage_records SET status = 'pending' WHERE report_id = 'R003';")
        conn.commit()

    # Clean test report approval
    req = FacultyActionRequest(
        faculty_id="faculty_test",
        faculty_name="Dr. Test Reviewer",
        notes="Verified SymPy phasor proof, approved.",
    )

    # First approval should succeed
    res = approve_correction("R003", req)
    assert res.status == "success"
    assert res.action == "approve"
    assert res.report_id == "R003"
    assert res.log_id is not None

    # Duplicate approval must raise 400 Bad Request
    with pytest.raises(HTTPException) as exc:
        approve_correction("R003", req)
    assert exc.value.status_code == 400
    assert "Duplicate application prevented" in exc.value.detail


def test_faculty_approval_taxonomy_scope_guard():
    # Propose an edit with a forbidden field (e.g. answer_key repair trying to modify 'question')
    bad_req = FacultyActionRequest(
        faculty_id="faculty_bad",
        faculty_name="Dr. Bad",
        notes="Attempting forbidden field edit",
        custom_edit=ProposedEdit(
            field="question",  # Forbidden for answer_key!
            find="foo",
            replace="bar",
        ),
    )

    with pytest.raises(HTTPException) as exc:
        approve_correction("R002", bad_req)
    assert exc.value.status_code == 422
    assert "Safety Violation" in exc.value.detail


def test_faculty_reject_and_defer_actions():
    # Test reject action
    rej_req = FacultyActionRequest(
        faculty_id="faculty_test",
        faculty_name="Dr. Test",
        notes="Student calculation flawed; stored answer is correct.",
    )
    rej_res = reject_correction("R033", rej_req)
    assert rej_res.status == "success"
    assert rej_res.action == "reject"

    # Test defer action
    def_req = FacultyActionRequest(
        faculty_id="faculty_test",
        faculty_name="Dr. Test",
        notes="Escalating to botany specialist for floral symmetry confirmation.",
    )
    def_res = defer_review("R018", def_req)
    assert def_res.status == "success"
    assert def_res.action == "defer"


def test_faculty_audit_and_analytics():
    audit_res = get_faculty_audit(skip=0, limit=10)
    assert audit_res["total"] > 0
    assert len(audit_res["logs"]) > 0

    analytics = get_faculty_analytics()
    assert "overview" in analytics
    assert "subject_distribution" in analytics
    assert analytics["audit_storage_mode"] == "SQLite WAL"
