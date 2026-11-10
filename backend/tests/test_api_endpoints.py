import pytest
from app.api.v1.endpoints.dataset import get_dataset_health, get_dataset_statistics
from app.api.v1.endpoints.questions import list_questions, get_question
from app.api.v1.endpoints.reports import list_reports, get_grouped_reports, get_report
from app.api.v1.endpoints.taxonomy import get_taxonomy, get_repair_detail, validate_edit


def test_api_dataset_endpoints():
    health = get_dataset_health()
    assert health.status in ["healthy", "degraded"]
    assert health.dataset_integrity.questions_count == 43

    stats = get_dataset_statistics()
    assert stats.total_questions == 43
    assert stats.total_reports == 44
    assert stats.distinct_reported_questions == 39


def test_api_questions_endpoints():
    # Test list questions
    resp = list_questions(skip=0, limit=10, subject=None, question_type=None, has_reports=None)
    assert resp.total == 43
    assert len(resp.questions) == 10

    # Test filter by subject
    phys_resp = list_questions(skip=0, limit=50, subject="Physics", question_type=None, has_reports=None)
    assert phys_resp.total == 33

    # Test single question detail
    first_id = resp.questions[0]["_id"]
    detail = get_question(first_id)
    assert detail.normalized.question_id == first_id
    assert detail.raw["_id"] == first_id


def test_api_reports_endpoints():
    # Test list reports
    resp = list_reports(skip=0, limit=20, source=None, question_id=None)
    assert resp.total == 44
    assert len(resp.reports) == 20

    # Test filter by source
    android_resp = list_reports(skip=0, limit=50, source="android", question_id=None)
    assert android_resp.total == 26

    # Test grouped reports
    grouped_resp = get_grouped_reports()
    assert grouped_resp.total_questions_reported == 39
    assert grouped_resp.total_reports == 44

    # Test single report
    first_report_id = resp.reports[0].reportId
    single_rep = get_report(first_report_id)
    assert single_rep.reportId == first_report_id


from app.api.v1.endpoints.audit import record_audit_action, list_audit_logs
from app.schemas.audit import AuditActionCreate


def test_api_taxonomy_endpoints():
    tax = get_taxonomy()
    assert len(tax.verdicts) > 0
    assert len(tax.repairs) > 0

    detail = get_repair_detail("answer_key")
    assert detail.repair_key == "answer_key"
    assert "answer" in detail.fields

    val_res = validate_edit(repair_key="answer_key", target_field="answer")
    assert val_res.is_valid is True

    val_invalid = validate_edit(repair_key="answer_key", target_field="question")
    assert val_invalid.is_valid is False


def test_api_audit_endpoints():
    action_in = AuditActionCreate(
        report_id="test_rep_1",
        question_id="test_ques_1",
        action="approve",
        faculty_id="faculty_test",
        faculty_name="Dr. Test",
        notes="Approved patch for test",
        applied_edit={"field": "answer", "find": "A", "replace": "B"},
    )
    res = record_audit_action(action_in)
    assert res["status"] == "success"
    assert res["action"] == "approve"

    logs = list_audit_logs(skip=0, limit=10, question_id="test_ques_1")
    assert len(logs) >= 1
    assert logs[0]["report_id"] == "test_rep_1"
    assert logs[0]["action"] == "approve"
    assert logs[0]["applied_edit"]["replace"] == "B"
