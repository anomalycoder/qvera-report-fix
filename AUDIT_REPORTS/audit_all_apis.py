import sys
import json
sys.path.insert(0, "backend")

from app.api.v1.endpoints import (
    health,
    dataset,
    questions,
    reports,
    taxonomy,
    solver,
    triage,
    faculty,
    auth,
)
from app.schemas.faculty import FacultyActionRequest
from app.schemas.auth import LoginRequest
from app.core.security import DEMO_EMAIL, DEMO_PASSWORD
from fastapi import Response

api_audit_results = {}

# 1. Health
h = health.health_check()
api_audit_results["health"] = {"status": h.status, "database": h.database}

# 2. Dataset
ds_stats = dataset.get_dataset_statistics()
api_audit_results["dataset_stats"] = {
    "total_questions": ds_stats.total_questions,
    "total_reports": ds_stats.total_reports,
    "distinct_reported": ds_stats.distinct_reported_questions
}

# 3. Questions
q_list = questions.list_questions(skip=0, limit=5, subject=None, question_type=None, has_reports=None)
q_detail = questions.get_question(q_list.questions[0]["_id"])
api_audit_results["questions"] = {
    "list_total": q_list.total,
    "first_item_id": q_detail.normalized.question_id
}

# 4. Reports
r_list = reports.list_reports(skip=0, limit=5, source=None, question_id=None)
r_detail = reports.get_report(r_list.reports[0].reportId)
r_grouped = reports.get_grouped_reports()
api_audit_results["reports"] = {
    "list_total": r_list.total,
    "first_report_id": r_detail.reportId,
    "grouped_count": r_grouped.total_questions_reported
}

# 5. Taxonomy
tax = taxonomy.get_taxonomy()
api_audit_results["taxonomy"] = {
    "verdicts_count": len(tax.verdicts),
    "repairs_count": len(tax.repairs)
}

# 6. Solver
q_first_id = q_list.questions[0]["_id"]
solve_single = solver.verify_question(q_first_id)
api_audit_results["solver"] = {
    "single_qid": solve_single.question_id,
    "status": solve_single.verification_status
}

# 7. Triage
tri_stats = triage.get_triage_statistics()
tri_item = triage.get_report_triage("R001")
api_audit_results["triage"] = {
    "processed_count": tri_stats["total_reports"],
    "r001_verdict": tri_item.verdict,
    "r001_route": tri_item.route
}

# 8. Faculty
fac_ov = faculty.get_faculty_overview()
fac_q = faculty.get_faculty_queue(skip=0, limit=5)
fac_rev = faculty.get_faculty_review_item("R001")
api_audit_results["faculty"] = {
    "total_reports": fac_ov.total_reports,
    "queue_total": fac_q.total,
    "review_item_id": fac_rev["report"]["reportId"]
}

# 9. Auth
resp = Response()
login_res = auth.login(LoginRequest(email=DEMO_EMAIL, password=DEMO_PASSWORD), resp)
me_res = auth.get_me(current_user=login_res.user.model_dump())
api_audit_results["auth"] = {
    "login_status": login_res.status,
    "user_email": me_res.email,
    "user_role": me_res.role
}

print(json.dumps(api_audit_results, indent=2))

with open("AUDIT_REPORTS/api_audit_data.json", "w", encoding="utf-8") as f:
    json.dump(api_audit_results, f, indent=2)
