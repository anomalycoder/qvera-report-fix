import pytest
from app.services.data_loader import data_loader
from app.services.report_grouper import report_grouper


def test_report_grouping_counts():
    groups = report_grouper.group_reports()
    assert len(groups) == 39, f"Expected 39 unique reported questions, got {len(groups)}"

    total_grouped_reports = sum(g.total_reports for g in groups)
    assert total_grouped_reports == 44, f"Expected 44 total reports across groups, got {total_grouped_reports}"


def test_multi_report_detection():
    groups = report_grouper.group_reports()
    multi_groups = [g for g in groups if g.is_duplicate_reported]
    assert len(multi_groups) == 4, f"Expected 4 multi-reported questions, got {len(multi_groups)}"

    # Check top question with 3 reports
    top_group = groups[0]
    assert top_group.total_reports == 3
    assert top_group.questionId == "60f744b3f1b9bc7cc7b4a949"
    assert len(top_group.reports) == 3
    assert top_group.is_multi_student is True


def test_individual_reports_preserved():
    all_reports = data_loader.load_reports()
    original_report_ids = set(r["reportId"] for r in all_reports)

    groups = report_grouper.group_reports()
    preserved_report_ids = set()
    for g in groups:
        for r in g.reports:
            preserved_report_ids.add(r.reportId)

    assert original_report_ids == preserved_report_ids, "All 44 report IDs must be preserved"
