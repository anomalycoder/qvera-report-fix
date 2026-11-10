from collections import Counter, defaultdict
from typing import Any, Dict, List, Optional
from app.schemas.report import GroupedQuestionReports, ReportCommentDetail, StudentReport
from app.services.data_loader import data_loader


class ReportGrouper:
    """Service to group and aggregate student reports by questionId while
    preserving all individual report records and audit metadata.
    """

    def group_reports(self, reports: Optional[List[Dict[str, Any]]] = None) -> List[GroupedQuestionReports]:
        """Groups raw reports by questionId and computes group analytics."""
        if reports is None:
            reports = data_loader.load_reports()

        by_question: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        for r in reports:
            by_question[r["questionId"]].append(r)

        grouped_results: List[GroupedQuestionReports] = []

        for qid, q_reports in by_question.items():
            # Sort reports chronologically
            sorted_reps = sorted(q_reports, key=lambda x: x.get("reportedAt", ""))

            report_details = [
                ReportCommentDetail(
                    reportId=r.get("reportId", ""),
                    studentId=r.get("studentId", ""),
                    source=r.get("source", ""),
                    reportedAt=r.get("reportedAt", ""),
                    comment=r.get("comment", ""),
                )
                for r in sorted_reps
            ]

            unique_students = set(r.get("studentId") for r in q_reports if r.get("studentId"))
            sources = Counter(r.get("source", "unknown") for r in q_reports)
            comments = [r.get("comment", "") for r in sorted_reps if r.get("comment")]

            first_reported = sorted_reps[0].get("reportedAt", "")
            latest_reported = sorted_reps[-1].get("reportedAt", "")

            grouped = GroupedQuestionReports(
                questionId=qid,
                total_reports=len(q_reports),
                unique_students=len(unique_students),
                first_reported_at=first_reported,
                latest_reported_at=latest_reported,
                source_distribution=dict(sources),
                is_multi_student=len(unique_students) > 1,
                is_duplicate_reported=len(q_reports) > 1,
                comments=comments,
                reports=report_details,
            )
            grouped_results.append(grouped)

        # Sort grouped results by urgency (multi-reports first, then most recent)
        grouped_results.sort(
            key=lambda g: (g.total_reports, g.unique_students, g.latest_reported_at),
            reverse=True,
        )

        return grouped_results

    def get_group_for_question(self, question_id: str) -> Optional[GroupedQuestionReports]:
        """Returns the grouped reports for a specific question."""
        all_groups = self.group_reports()
        for g in all_groups:
            if g.questionId == question_id:
                return g
        return None


report_grouper = ReportGrouper()
