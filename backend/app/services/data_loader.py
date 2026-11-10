import json
from collections import Counter
from pathlib import Path
from typing import Any, Dict, List, Optional, Set
from app.core.config import settings
from app.schemas.dataset import (
    DatasetHealthResponse,
    DatasetIntegrity,
    DatasetStatisticsResponse,
)


class DataLoader:
    """Production-ready data loading service for Acadza Report -> Fix.
    Loads and validates questions.json, reports.json, and taxonomy.json.
    Ensures original datasets remain immutable.
    """

    def __init__(self, data_dir: Optional[Path] = None):
        self._data_dir = data_dir or settings.resolved_data_dir
        self._questions_cache: Optional[List[Dict[str, Any]]] = None
        self._reports_cache: Optional[List[Dict[str, Any]]] = None
        self._taxonomy_cache: Optional[Dict[str, Any]] = None

    @property
    def data_dir(self) -> Path:
        return self._data_dir

    def _read_json(self, filename: str) -> Any:
        path = self._data_dir / filename
        if not path.exists():
            raise FileNotFoundError(f"Required data file '{filename}' not found at: {path}")
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def load_taxonomy(self, force_reload: bool = False) -> Dict[str, Any]:
        """Loads and returns taxonomy.json."""
        if self._taxonomy_cache is None or force_reload:
            self._taxonomy_cache = self._read_json("taxonomy.json")
        return self._taxonomy_cache

    def load_reports(self, force_reload: bool = False) -> List[Dict[str, Any]]:
        """Loads and returns reports.json (44 student reports)."""
        if self._reports_cache is None or force_reload:
            self._reports_cache = self._read_json("reports.json")
        return self._reports_cache

    def load_questions(self, force_reload: bool = False) -> List[Dict[str, Any]]:
        """Loads and returns questions.json (43 JEE/NEET questions)."""
        if self._questions_cache is None or force_reload:
            self._questions_cache = self._read_json("questions.json")
        return self._questions_cache

    def get_question_map(self) -> Dict[str, Dict[str, Any]]:
        """Returns map of questionId -> question dict."""
        return {q["_id"]: q for q in self.load_questions() if "_id" in q}

    def get_question_by_id(self, question_id: str) -> Optional[Dict[str, Any]]:
        return self.get_question_map().get(question_id)

    def get_report_by_id(self, report_id: str) -> Optional[Dict[str, Any]]:
        for r in self.load_reports():
            if r.get("reportId") == report_id:
                return r
        return None

    def check_files_exist(self) -> Dict[str, bool]:
        return {
            "questions_json": (self._data_dir / "questions.json").exists(),
            "reports_json": (self._data_dir / "reports.json").exists(),
            "taxonomy_json": (self._data_dir / "taxonomy.json").exists(),
        }

    def get_dataset_integrity(self) -> DatasetIntegrity:
        """Performs deep relational integrity checks across questions and reports."""
        questions = self.load_questions()
        reports = self.load_reports()

        q_ids = [q.get("_id") for q in questions if q.get("_id")]
        rep_ids = [r.get("reportId") for r in reports if r.get("reportId")]
        rep_q_ids = [r.get("questionId") for r in reports if r.get("questionId")]

        q_id_counter = Counter(q_ids)
        rep_id_counter = Counter(rep_ids)
        rep_q_counter = Counter(rep_q_ids)

        duplicate_q_ids = [qid for qid, count in q_id_counter.items() if count > 1]
        duplicate_rep_ids = [rid for rid, count in rep_id_counter.items() if count > 1]

        q_id_set = set(q_ids)
        invalid_references = [qid for qid in set(rep_q_ids) if qid not in q_id_set]

        unreported_q_ids = list(q_id_set - set(rep_q_ids))
        questions_with_multi = {qid: count for qid, count in rep_q_counter.items() if count > 1}

        return DatasetIntegrity(
            questions_count=len(questions),
            reports_count=len(reports),
            distinct_questions_in_questions=len(q_id_set),
            distinct_reports_in_reports=len(set(rep_ids)),
            distinct_reported_questions=len(set(rep_q_ids)),
            duplicate_question_ids=duplicate_q_ids,
            duplicate_report_ids=duplicate_rep_ids,
            invalid_report_references=invalid_references,
            unreported_questions_count=len(unreported_q_ids),
            unreported_question_ids=sorted(unreported_q_ids),
            questions_with_multiple_reports_count=len(questions_with_multi),
            questions_with_multiple_reports=questions_with_multi,
        )

    def get_health_report(self) -> DatasetHealthResponse:
        """Produces a comprehensive health status of the dataset."""
        files = self.check_files_exist()
        integrity = self.get_dataset_integrity()

        anomalies = []
        if integrity.duplicate_question_ids:
            anomalies.append(f"Duplicate question IDs detected: {integrity.duplicate_question_ids}")
        if integrity.duplicate_report_ids:
            anomalies.append(f"Duplicate report IDs detected: {integrity.duplicate_report_ids}")
        if integrity.invalid_report_references:
            anomalies.append(f"Reports reference non-existent questions: {integrity.invalid_report_references}")

        status = "healthy"
        if not all(files.values()) or integrity.invalid_report_references:
            status = "unhealthy"
        elif anomalies:
            status = "degraded"

        return DatasetHealthResponse(
            status=status,
            dataset_integrity=integrity,
            files_present=files,
            anomalies_detected=anomalies,
        )

    def get_statistics(self, missing_options_count: int = 1) -> DatasetStatisticsResponse:
        """Calculates and returns core statistical distributions across the datasets."""
        questions = self.load_questions()
        reports = self.load_reports()
        integrity = self.get_dataset_integrity()

        q_type_dist = dict(Counter(q.get("questionType", "unknown") for q in questions))
        subj_dist = dict(Counter(q.get("subject", "unknown") for q in questions))
        source_dist = dict(Counter(r.get("source", "unknown") for r in reports))

        return DatasetStatisticsResponse(
            total_questions=len(questions),
            total_reports=len(reports),
            distinct_reported_questions=integrity.distinct_reported_questions,
            unreported_questions=integrity.unreported_questions_count,
            questions_with_duplicate_reports=integrity.questions_with_multiple_reports_count,
            question_type_distribution=q_type_dist,
            subject_distribution=subj_dist,
            report_source_distribution=source_dist,
            missing_option_counts=missing_options_count,
            invalid_report_references=len(integrity.invalid_report_references),
        )


data_loader = DataLoader()
