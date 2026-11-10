import json
from pathlib import Path
from collections import Counter

reports = json.load(open("data/reports.json", encoding="utf-8"))
questions = json.load(open("data/questions.json", encoding="utf-8"))
taxonomy = json.load(open("data/taxonomy.json", encoding="utf-8"))
results = json.load(open("results.json", encoding="utf-8"))

valid_verdicts = set(taxonomy["verdicts"].keys())
valid_repairs = set(taxonomy["repairs"].keys())
repair_defs = taxonomy["repairs"]

report_map = {r["reportId"]: r for r in reports}
question_ids = set(q["_id"] for q in questions)

audit = {
    "total_results": len(results),
    "total_expected_reports": len(reports),
    "errors": [],
    "warnings": [],
    "verdict_distribution": {},
    "routing_distribution": {},
    "repair_distribution": {},
    "field_validations": {
        "reportId_valid": 0,
        "questionId_matched": 0,
        "verdict_valid": 0,
        "repair_valid": 0,
        "confidence_valid": 0,
        "edits_permitted": 0,
        "safety_checks_passed": 0
    }
}

seen_reports = set()

for idx, item in enumerate(results):
    rid = item.get("reportId") or item.get("report_id")
    qid = item.get("questionId") or item.get("question_id")
    verdict = item.get("verdict")
    repair = item.get("repair") or item.get("repair_type")
    route = item.get("route") or item.get("routing")
    confidence = item.get("confidence")
    edit = item.get("edit")

    # 1. Check report exists
    if not rid:
        audit["errors"].append(f"Item #{idx} missing reportId")
        continue
    if rid in seen_reports:
        audit["errors"].append(f"Duplicate reportId in results: {rid}")
    seen_reports.add(rid)

    if rid not in report_map:
        audit["errors"].append(f"Report ID {rid} not found in data/reports.json")
    else:
        audit["field_validations"]["reportId_valid"] += 1
        # 2. Check question ID matches original report
        expected_qid = report_map[rid]["questionId"]
        if qid != expected_qid:
            audit["errors"].append(f"Report {rid} questionId mismatch: got {qid}, expected {expected_qid}")
        else:
            audit["field_validations"]["questionId_matched"] += 1

    # 3. Check verdict
    if verdict not in valid_verdicts:
        audit["errors"].append(f"Report {rid} has invalid verdict: '{verdict}'")
    else:
        audit["field_validations"]["verdict_valid"] += 1
        audit["verdict_distribution"][verdict] = audit["verdict_distribution"].get(verdict, 0) + 1

    # 4. Check repair
    if repair is not None:
        if repair not in valid_repairs:
            audit["errors"].append(f"Report {rid} has invalid repair: '{repair}'")
        else:
            audit["field_validations"]["repair_valid"] += 1
            audit["repair_distribution"][repair] = audit["repair_distribution"].get(repair, 0) + 1
    else:
        audit["field_validations"]["repair_valid"] += 1

    # 5. Check route & auto_apply safety
    audit["routing_distribution"][route] = audit["routing_distribution"].get(route, 0) + 1
    if route == "auto_apply":
        if not repair or not repair_defs.get(repair, {}).get("auto"):
            audit["errors"].append(f"Safety violation: Report {rid} with repair '{repair}' was auto_applied but auto_apply is False")
        if confidence is not None and confidence < 0.80:
            audit["warnings"].append(f"Low confidence auto_apply on {rid}: {confidence}")

    # 6. Check confidence
    if confidence is None or not (0.0 <= confidence <= 1.0):
        audit["errors"].append(f"Report {rid} has invalid confidence: {confidence}")
    else:
        audit["field_validations"]["confidence_valid"] += 1

    # 7. Check edit permitted fields
    if edit:
        field = edit.get("field")
        if repair in repair_defs:
            permitted = repair_defs[repair].get("fields", [])
            if field not in permitted:
                audit["errors"].append(f"Safety violation: Report {rid} repair '{repair}' modified forbidden field '{field}'. Permitted: {permitted}")
            else:
                audit["field_validations"]["edits_permitted"] += 1
    else:
        audit["field_validations"]["edits_permitted"] += 1

# Check for omitted reports
missing_reports = set(report_map.keys()) - seen_reports
if missing_reports:
    audit["errors"].append(f"Reports omitted from results.json: {list(missing_reports)}")

print("Validation Results:")
print("Total records:", audit["total_results"])
print("Errors found:", len(audit["errors"]))
print("Warnings found:", len(audit["warnings"]))
print("Verdict distribution:", audit["verdict_distribution"])
print("Routing distribution:", audit["routing_distribution"])
print("Field validations:", audit["field_validations"])

if audit["errors"]:
    print("\nErrors detail:")
    for e in audit["errors"][:10]:
        print(" -", e)

with open("AUDIT_REPORTS/results_validation_data.json", "w", encoding="utf-8") as f:
    json.dump(audit, f, indent=2)
