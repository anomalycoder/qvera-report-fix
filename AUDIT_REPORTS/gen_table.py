import json

res = json.load(open("results.json", encoding="utf-8"))
lines = [
    "| # | Report ID | Question ID | Verdict | Repair Type | Route | Conf. | Edit Field |",
    "|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|"
]
for idx, r in enumerate(res, 1):
    rid = r.get("reportId") or r.get("report_id")
    qid = (r.get("questionId") or r.get("question_id"))[:8] + "..."
    verd = r.get("verdict")
    rep = r.get("repair") or r.get("repair_type") or "-"
    route = r.get("route") or r.get("routing")
    conf = f"{r.get('confidence', 0):.2f}"
    field = (r.get("edit") or {}).get("field", "-")
    lines.append(f"| {idx} | `{rid}` | `{qid}` | `{verd}` | `{rep}` | `{route}` | {conf} | `{field}` |")

with open("AUDIT_REPORTS/table_44.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print("Generated table with 44 rows")
