import json
import re
from pathlib import Path
from collections import Counter, defaultdict

data_dir = Path("data")
questions_file = data_dir / "questions.json"
reports_file = data_dir / "reports.json"
taxonomy_file = data_dir / "taxonomy.json"

results = {
    "questions": {},
    "reports": {},
    "taxonomy": {},
    "relationships": {}
}

# 1. Questions Audit
with open(questions_file, "r", encoding="utf-8") as f:
    questions = json.load(f)

q_ids = [q.get("_id") for q in questions]
q_id_counts = Counter(q_ids)
duplicates_q = [qid for qid, count in q_id_counts.items() if count > 1]

q_types = Counter(q.get("questionType") for q in questions)
subjects = Counter(q.get("subject") for q in questions)

missing_options = []
missing_solutions = []
missing_answers = []
markup_warnings = []
referenced_images = []

for q in questions:
    qid = q.get("_id")
    qtype = q.get("questionType")
    opts = q.get("options")
    ans = q.get("answer")
    sol = q.get("solution")
    content = q.get("question", "")

    # Check content
    if not content or len(content.strip()) == 0:
        markup_warnings.append({"id": qid, "issue": "Empty question content"})

    # Check images
    imgs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', content + (sol or ""))
    if imgs:
        referenced_images.append({"id": qid, "images": imgs})

    # Check options
    if qtype in ("scq", "mcq"):
        if not opts:
            missing_options.append({"id": qid, "issue": "Options field missing/null"})
        elif isinstance(opts, list):
            if len(opts) < 4:
                missing_options.append({"id": qid, "issue": f"Only {len(opts)} options present"})
            for idx, opt in enumerate(opts):
                opt_content = opt if isinstance(opt, str) else opt.get("text", "")
                if not opt_content or opt_content.strip() in ("", "<p></p>", "<p><br></p>"):
                    missing_options.append({"id": qid, "issue": f"Option index {idx} is blank"})
        elif isinstance(opts, dict):
            if len(opts) < 4:
                missing_options.append({"id": qid, "issue": f"Only {len(opts)} options in dict"})

    # Check answer
    if ans is None or ans == "":
        missing_answers.append({"id": qid, "issue": "Answer missing"})

    # Check solution
    if not sol or sol.strip() in ("", "<p></p>"):
        missing_solutions.append({"id": qid, "issue": "Solution empty or null"})

    # MathML check
    if "<math" in content and "</math>" not in content:
        markup_warnings.append({"id": qid, "issue": "Unclosed <math> tag in question"})
    if sol and "<math" in sol and "</math>" not in sol:
        markup_warnings.append({"id": qid, "issue": "Unclosed <math> tag in solution"})

results["questions"] = {
    "total": len(questions),
    "unique_ids": len(set(q_ids)),
    "duplicate_ids": duplicates_q,
    "question_types": dict(q_types),
    "subjects": dict(subjects),
    "missing_options": missing_options,
    "missing_solutions": missing_solutions,
    "missing_answers": missing_answers,
    "markup_warnings": markup_warnings,
    "referenced_images_count": len(referenced_images),
    "referenced_images": referenced_images,
}

# 2. Reports Audit
with open(reports_file, "r", encoding="utf-8") as f:
    reports = json.load(f)

r_ids = [r.get("reportId") for r in reports]
r_id_counts = Counter(r_ids)
duplicates_r = [rid for rid, count in r_id_counts.items() if count > 1]

sources = Counter(r.get("source") for r in reports)
question_id_set = set(q_ids)

orphaned_reports = []
missing_fields = []
suspicious_reports = []

for r in reports:
    rid = r.get("reportId")
    qid = r.get("questionId")
    comment = r.get("comment", "")
    ts = r.get("reportedAt")
    student_id = r.get("studentId")

    if not rid or not qid:
        missing_fields.append({"id": rid, "issue": "Missing reportId or questionId"})
    if qid not in question_id_set:
        orphaned_reports.append({"id": rid, "questionId": qid})
    if not ts:
        missing_fields.append({"id": rid, "issue": "Missing timestamp"})
    if not student_id:
        missing_fields.append({"id": rid, "issue": "Missing studentId"})

    # Check suspicious / prompt injection comments
    if any(kw in comment.lower() for kw in ("ignore previous", "system prompt", "drop table", "override", "grant admin")):
        suspicious_reports.append({"id": rid, "comment": comment})

results["reports"] = {
    "total": len(reports),
    "unique_ids": len(set(r_ids)),
    "duplicate_ids": duplicates_r,
    "sources": dict(sources),
    "orphaned_reports": orphaned_reports,
    "missing_fields": missing_fields,
    "suspicious_reports": suspicious_reports,
}

# 3. Taxonomy Audit
with open(taxonomy_file, "r", encoding="utf-8") as f:
    taxonomy = json.load(f)

verdicts = taxonomy.get("verdicts", [])
repairs = taxonomy.get("repairs", {})

auto_apply_repairs = [k for k, v in repairs.items() if v.get("auto") is True]
faculty_review_repairs = [k for k, v in repairs.items() if v.get("auto") is False]

results["taxonomy"] = {
    "verdicts_count": len(verdicts),
    "verdicts": verdicts,
    "repairs_count": len(repairs),
    "auto_apply_repairs": auto_apply_repairs,
    "faculty_review_repairs": faculty_review_repairs,
    "repairs_detail": {k: {"auto": v.get("auto"), "fields": v.get("fields")} for k, v in repairs.items()}
}

# 4. Relationships Audit
report_by_qid = defaultdict(list)
for r in reports:
    report_by_qid[r.get("questionId")].append(r.get("reportId"))

reported_qids = set(report_by_qid.keys())
unreported_qids = set(q_ids) - reported_qids

single_report_qids = [qid for qid, rlist in report_by_qid.items() if len(rlist) == 1]
multi_report_qids = {qid: rlist for qid, rlist in report_by_qid.items() if len(rlist) > 1}

results["relationships"] = {
    "total_questions": len(questions),
    "total_reports": len(reports),
    "distinct_reported_questions": len(reported_qids),
    "questions_with_single_report": len(single_report_qids),
    "questions_with_multiple_reports": len(multi_report_qids),
    "multi_report_details": multi_report_qids,
    "unreported_questions_count": len(unreported_qids),
    "unreported_questions": sorted(list(unreported_qids)),
}

print(json.dumps(results, indent=2))

with open("AUDIT_REPORTS/phase1_2_data.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)
