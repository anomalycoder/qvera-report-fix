"""Strict end-to-end validator for results.json against data/questions.json, data/reports.json, and data/taxonomy.json."""

import json
import re
from pathlib import Path
from typing import Any, Dict, List

ROOT = Path(__file__).resolve().parent.parent
REPORTS_PATH = ROOT / "data" / "reports.json"
QUESTIONS_PATH = ROOT / "data" / "questions.json"
TAXONOMY_PATH = ROOT / "data" / "taxonomy.json"
RESULTS_PATH = ROOT / "results.json"
VALIDATION_OUT = ROOT / "AUDIT_REPORTS" / "results_validation_data.json"


def main() -> int:
    reports: List[Dict[str, Any]] = json.loads(REPORTS_PATH.read_text(encoding="utf-8"))
    questions: List[Dict[str, Any]] = json.loads(QUESTIONS_PATH.read_text(encoding="utf-8"))
    taxonomy: Dict[str, Any] = json.loads(TAXONOMY_PATH.read_text(encoding="utf-8"))
    results: List[Dict[str, Any]] = json.loads(RESULTS_PATH.read_text(encoding="utf-8"))

    valid_verdicts = set(taxonomy["verdicts"].keys())
    valid_repairs = set(taxonomy["repairs"].keys())
    repair_defs = taxonomy["repairs"]
    report_map = {r["reportId"]: r for r in reports}
    question_map = {q["_id"]: q for q in questions}

    errors: List[str] = []
    warnings: List[str] = []
    seen_reports = set()

    verdict_dist: Dict[str, int] = {}
    routing_dist: Dict[str, int] = {}
    repair_dist: Dict[str, int] = {}
    checks = {
        "reportId_valid": 0,
        "questionId_matched": 0,
        "verdict_valid": 0,
        "repair_valid": 0,
        "confidence_valid": 0,
        "edits_permitted": 0,
        "routing_safety_valid": 0,
        "student_reply_present": 0,
        "evidence_present": 0,
    }

    for idx, item in enumerate(results):
        rid = item.get("reportId")
        qid = item.get("questionId")
        verdict = item.get("verdict")
        repair = item.get("repair")
        edit = item.get("edit")
        route = item.get("route")
        confidence = item.get("confidence")
        evidence = (item.get("evidence") or "").strip()
        student_reply = (item.get("student_reply") or "").strip()

        if not rid or rid not in report_map:
            errors.append(f"[{idx}] Unknown or missing reportId: {rid}")
            continue
        if rid in seen_reports:
            errors.append(f"[{idx}] Duplicate reportId: {rid}")
            continue
        seen_reports.add(rid)
        checks["reportId_valid"] += 1

        expected_qid = report_map[rid]["questionId"]
        if qid != expected_qid or qid not in question_map:
            errors.append(f"[{rid}] Invalid questionId mismatch: got {qid}, expected {expected_qid}")
        else:
            checks["questionId_matched"] += 1

        if verdict not in valid_verdicts:
            errors.append(f"[{rid}] Verdict '{verdict}' not in taxonomy verdicts")
        else:
            checks["verdict_valid"] += 1
            verdict_dist[verdict] = verdict_dist.get(verdict, 0) + 1

        if verdict == "defect":
            if not repair or repair not in valid_repairs:
                errors.append(f"[{rid}] Defect verdict missing valid taxonomy repair: {repair}")
            else:
                checks["repair_valid"] += 1
                repair_dist[repair] = repair_dist.get(repair, 0) + 1
        else:
            if repair is not None:
                errors.append(f"[{rid}] Non-defect verdict '{verdict}' must have repair=null, got '{repair}'")
            else:
                checks["repair_valid"] += 1

        if route not in ("auto_apply", "faculty_review", "no_change"):
            errors.append(f"[{rid}] Invalid route '{route}'")
        else:
            routing_dist[route] = routing_dist.get(route, 0) + 1
            if route == "auto_apply":
                rdef = repair_defs.get(repair or "", {})
                if not rdef.get("auto", False):
                    errors.append(f"[{rid}] SAFETY VIOLATION: auto:false repair '{repair}' routed to auto_apply")
                elif confidence is None or confidence < 0.80:
                    errors.append(f"[{rid}] SAFETY VIOLATION: low-confidence auto_apply ({confidence})")
                else:
                    checks["routing_safety_valid"] += 1
            elif route == "no_change" and edit is not None:
                errors.append(f"[{rid}] no_change route must not contain an edit payload")
            else:
                checks["routing_safety_valid"] += 1

        if confidence is None or not isinstance(confidence, (int, float)) or not (0.0 <= confidence <= 1.0):
            errors.append(f"[{rid}] Invalid confidence score: {confidence}")
        else:
            checks["confidence_valid"] += 1

        if edit is not None:
            field = edit.get("field")
            allowed_fields = repair_defs.get(repair or "", {}).get("fields", [])
            if field not in allowed_fields:
                errors.append(f"[{rid}] SCOPE VIOLATION: repair '{repair}' touched forbidden field '{field}' (allowed: {allowed_fields})")
            else:
                # Validate SCQ / Integer format if touching answer
                q_obj = question_map.get(qid, {})
                qtype = str(q_obj.get("questionType", "scq")).lower()
                new_val = str(edit.get("replace") or edit.get("new_value") or "").strip()
                if field == "answer":
                    if qtype == "scq" and not re.match(r"^[A-Da-d]$", new_val):
                        errors.append(f"[{rid}] Invalid SCQ answer format '{new_val}'")
                    elif qtype == "integer":
                        try:
                            float(new_val)
                        except ValueError:
                            errors.append(f"[{rid}] Invalid integer answer format '{new_val}'")
                checks["edits_permitted"] += 1
        else:
            checks["edits_permitted"] += 1

        if len(evidence) >= 10:
            checks["evidence_present"] += 1
        else:
            errors.append(f"[{rid}] Missing or insufficient evidence string")

        if len(student_reply) >= 10:
            checks["student_reply_present"] += 1
        else:
            errors.append(f"[{rid}] Missing or insufficient student_reply string")

    missing = sorted(set(report_map.keys()) - seen_reports)
    if missing:
        errors.append(f"Omitted reportIds from results.json: {missing}")

    summary = {
        "total_results": len(results),
        "total_expected_reports": len(reports),
        "errors": errors,
        "warnings": warnings,
        "verdict_distribution": verdict_dist,
        "routing_distribution": routing_dist,
        "repair_distribution": repair_dist,
        "ground_truth_accuracy": "Not evaluable locally (Acadza evaluates ground-truth labels externally during scoring)",
        "safety_violations_detected": sum(1 for e in errors if "VIOLATION" in e),
        "field_validations": checks,
    }
    VALIDATION_OUT.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    print(f"Total records validated: {len(results)} / {len(reports)}")
    print(f"Verdicts: {verdict_dist}")
    print(f"Routes: {routing_dist}")
    print(f"Repairs: {repair_dist}")
    print(f"Validation errors: {len(errors)}")
    for err in errors:
        print("ERROR:", err)
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
