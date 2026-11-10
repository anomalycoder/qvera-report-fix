import pytest
from app.services.data_loader import data_loader


def test_json_loading_counts():
    questions = data_loader.load_questions()
    reports = data_loader.load_reports()
    taxonomy = data_loader.load_taxonomy()

    assert len(questions) == 43, f"Expected 43 questions, got {len(questions)}"
    assert len(reports) == 44, f"Expected 44 reports, got {len(reports)}"
    assert "verdicts" in taxonomy
    assert "repairs" in taxonomy


def test_dataset_integrity():
    integrity = data_loader.get_dataset_integrity()

    assert integrity.questions_count == 43
    assert integrity.reports_count == 44
    assert len(integrity.duplicate_question_ids) == 0, "No duplicate question IDs expected"
    assert len(integrity.duplicate_report_ids) == 0, "No duplicate report IDs expected"
    assert len(integrity.invalid_report_references) == 0, "All reports must reference valid questions"
    assert integrity.unreported_questions_count == 4, "Expected exactly 4 unreported questions"
    assert integrity.questions_with_multiple_reports_count == 4, "Expected 4 questions with multiple reports"


def test_dataset_health_report():
    health = data_loader.get_health_report()
    assert health.status in ["healthy", "degraded"]
    assert health.files_present["questions_json"] is True
    assert health.files_present["reports_json"] is True
    assert health.files_present["taxonomy_json"] is True
    assert len(health.dataset_integrity.invalid_report_references) == 0


def test_dataset_statistics():
    stats = data_loader.get_statistics()
    assert stats.total_questions == 43
    assert stats.total_reports == 44
    assert stats.distinct_reported_questions == 39
    assert stats.unreported_questions == 4
    assert stats.questions_with_duplicate_reports == 4
    assert "scq" in stats.question_type_distribution
    assert "integerQuestion" in stats.question_type_distribution
    assert "Physics" in stats.subject_distribution
    assert "android" in stats.report_source_distribution
