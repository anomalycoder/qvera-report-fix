import sys
import json
sys.path.insert(0, "backend")

from app.services.data_loader import data_loader
from app.services.question_normalizer import question_normalizer
from app.services.solver.verification_engine import verification_engine
from app.services.triage.triage_engine import triage_engine

results = json.load(open("results.json", encoding="utf-8"))
result_by_id = {r["reportId"]: r for r in results}

regression_cases = {}

# Case 1: LCR Circuit (60f744b3f1b9bc7cc7b4a949)
q_lcr = data_loader.get_question_by_id("60f744b3f1b9bc7cc7b4a949")
r_lcr = result_by_id["R001"]
norm_lcr = question_normalizer.normalize(q_lcr)
solve_lcr = verification_engine.verify_question(norm_lcr)
regression_cases["case_1_lcr"] = {
    "question_id": "60f744b3f1b9bc7cc7b4a949",
    "report_id": "R001",
    "stored_answer": norm_lcr.stored_answer,
    "derived_answer": solve_lcr.independently_derived_answer,
    "verification_status": solve_lcr.verification_status,
    "verdict": r_lcr["verdict"],
    "repair": r_lcr["repair"],
    "route": r_lcr["route"],
    "proposed_edit": r_lcr["edit"],
    "confirmed": solve_lcr.independently_derived_answer == "A" and r_lcr["verdict"] == "defect" and r_lcr["repair"] == "answer_key"
}

# Case 2: Cube Flux (68dea616d0cda73d07e93ae6 / 68dea616d0cda73d0d95f790)
q_cube = data_loader.get_question_by_id("68dea616d0cda73d07e93ae6") or data_loader.get_question_by_id("68dea616d0cda73d0d95f790")
r_cube = result_by_id.get("R005") or result_by_id.get("R002")
norm_cube = question_normalizer.normalize(q_cube)
solve_cube = verification_engine.verify_question(norm_cube)
regression_cases["case_2_cube_flux"] = {
    "question_id": norm_cube.question_id,
    "stored_answer": norm_cube.stored_answer,
    "derived_answer": solve_cube.independently_derived_answer,
    "verdict": r_cube["verdict"],
    "repair": r_cube["repair"],
    "route": r_cube["route"],
    "confirmed": solve_cube.independently_derived_answer == "1" and r_cube["edit"]["new_value"] == "1"
}

# Case 3: Significant Figures (68dea715387eea3d0d95f790)
q_sig = data_loader.get_question_by_id("68dea715387eea3d0d95f790")
r_sig = result_by_id.get("R006")
norm_sig = question_normalizer.normalize(q_sig)
solve_sig = verification_engine.verify_question(norm_sig)
regression_cases["case_3_sig_figs"] = {
    "question_id": norm_sig.question_id,
    "stored_answer": norm_sig.stored_answer,
    "derived_answer": solve_sig.independently_derived_answer,
    "verdict": r_sig["verdict"],
    "repair": r_sig["repair"],
    "route": r_sig["route"],
    "student_comment": data_loader.get_report_by_id("R006")["comment"],
    "confirmed": r_sig["verdict"] == "defect" and r_sig["repair"] == "answer_key"
}

# Case 4: Photoelectric (68c9ae5afb6b2f16e2d43b1c)
q_pe = data_loader.get_question_by_id("68c9ae5afb6b2f16e2d43b1c")
r_pe = [r for r in results if r["questionId"] == "68c9ae5afb6b2f16e2d43b1c"][0]
norm_pe = question_normalizer.normalize(q_pe)
solve_pe = verification_engine.verify_question(norm_pe)
regression_cases["case_4_photoelectric"] = {
    "question_id": norm_pe.question_id,
    "report_id": r_pe["reportId"],
    "stored_answer": norm_pe.stored_answer,
    "derived_answer": solve_pe.independently_derived_answer,
    "verdict": r_pe["verdict"],
    "route": r_pe["route"],
    "confirmed": r_pe["verdict"] == "no_error" and r_pe["route"] == "no_change"
}

# Case 5: Coulomb Blank Option (68e872546e45ba37dcc16bc0)
q_coulomb = data_loader.get_question_by_id("68e872546e45ba37dcc16bc0")
r_coulomb = [r for r in results if r["questionId"] == "68e872546e45ba37dcc16bc0"][0]
norm_coulomb = question_normalizer.normalize(q_coulomb)
regression_cases["case_5_coulomb_blank_option"] = {
    "question_id": norm_coulomb.question_id,
    "report_id": r_coulomb["reportId"],
    "verdict": r_coulomb["verdict"],
    "repair": r_coulomb["repair"],
    "route": r_coulomb["route"],
    "edit_field": r_coulomb["edit"]["field"] if r_coulomb["edit"] else None,
    "confirmed": r_coulomb["verdict"] == "defect" and r_coulomb["repair"] == "option_repair"
}

# Case 6: Missing Inductance (60f742f6660d187cc13a8078)
q_ind = data_loader.get_question_by_id("60f742f6660d187cc13a8078")
r_inds = [r for r in results if r["questionId"] == "60f742f6660d187cc13a8078"]
regression_cases["case_6_missing_inductance"] = {
    "question_id": "60f742f6660d187cc13a8078",
    "reports": [r["reportId"] for r in r_inds],
    "verdicts": [r["verdict"] for r in r_inds],
    "repairs": [r["repair"] for r in r_inds],
    "routes": [r["route"] for r in r_inds],
    "confirmed": all(r["verdict"] == "defect" and r["repair"] == "stem_data" and r["route"] == "faculty_review" for r in r_inds)
}

# Case 7: Missing Option D (622f08d7b70e4b50e4500a1b)
q_opt_d = data_loader.get_question_by_id("622f08d7b70e4b50e4500a1b")
r_opt_ds = [r for r in results if r["questionId"] == "622f08d7b70e4b50e4500a1b"]
regression_cases["case_7_missing_option_d"] = {
    "question_id": "622f08d7b70e4b50e4500a1b",
    "reports": [r["reportId"] for r in r_opt_ds],
    "verdicts": [r["verdict"] for r in r_opt_ds],
    "repairs": [r["repair"] for r in r_opt_ds],
    "routes": [r["route"] for r in r_opt_ds],
    "confirmed": all(r["verdict"] == "defect" and r["repair"] == "option_repair" and r["route"] == "faculty_review" for r in r_opt_ds)
}

# Case 8: Unrelated Solution (612151a6a34397610a9a2e58)
q_sol = data_loader.get_question_by_id("612151a6a34397610a9a2e58")
r_sols = [r for r in results if r["questionId"] == "612151a6a34397610a9a2e58"]
regression_cases["case_8_unrelated_solution"] = {
    "question_id": "612151a6a34397610a9a2e58",
    "reports": [r["reportId"] for r in r_sols],
    "verdicts": [r["verdict"] for r in r_sols],
    "repairs": [r["repair"] for r in r_sols],
    "routes": [r["route"] for r in r_sols],
    "confirmed": all(r["verdict"] == "defect" and r["repair"] == "solution_fix" and r["route"] == "faculty_review" for r in r_sols)
}

# Case 9: Prompt Injection (R027)
r_inj = result_by_id["R027"]
report_inj_obj = data_loader.get_report_by_id("R027")
regression_cases["case_9_prompt_injection"] = {
    "report_id": "R027",
    "student_comment": report_inj_obj["comment"],
    "verdict": r_inj["verdict"],
    "repair": r_inj["repair"],
    "route": r_inj["route"],
    "safety_checks": r_inj.get("safety_checks", {}),
    "confirmed": r_inj["verdict"] == "not_actionable" and r_inj["route"] == "no_change"
}

# Case 10: Unreported Defect (68dea657387eea3d0d95f54a)
unrep = triage_engine.benchmark_runner.scan_unreported_defects()
unrep_target = [u for u in unrep if u["question_id"] == "68dea657387eea3d0d95f54a"]
regression_cases["case_10_unreported_defect"] = {
    "question_id": "68dea657387eea3d0d95f54a",
    "findings": unrep_target[0]["findings"] if unrep_target else [],
    "recommended_action": unrep_target[0]["recommended_action"] if unrep_target else None,
    "confirmed": len(unrep_target) > 0 and "Typographical corruption" in unrep_target[0]["findings"][1]
}

print(json.dumps(regression_cases, indent=2))

with open("AUDIT_REPORTS/regression_audit_data.json", "w", encoding="utf-8") as f:
    json.dump(regression_cases, f, indent=2)
