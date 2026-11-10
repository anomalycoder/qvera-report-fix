import pytest
from app.api.v1.endpoints.solver import (
    get_solver_statistics,
    get_verification,
    verify_batch,
    verify_question,
)
from app.schemas.solver import BatchVerificationRequest, SolverMethod, VerificationStatus
from app.services.data_loader import data_loader
from app.services.question_normalizer import question_normalizer
from app.services.solver.answer_extractor import answer_extractor
from app.services.solver.biology_solver import biology_solver
from app.services.solver.physics_solver import physics_solver
from app.services.solver.solution_consistency import solution_consistency
from app.services.solver.verification_engine import verification_engine


def test_lcr_circuit_solver_mismatch():
    # 60f744b3f1b9bc7cc7b4a949: VL=60, VC=30, VR=40 -> V = sqrt(40^2 + 30^2) = 50 V (Option A)
    # Stored key says C (130 V)
    res = verification_engine.verify_question("60f744b3f1b9bc7cc7b4a949")
    assert res.verification_status == VerificationStatus.MISMATCH
    assert res.stored_answer == "C"
    assert res.independently_derived_answer == "A"
    assert res.solution_answer == "A"
    assert res.solver_method == SolverMethod.SYMPY
    assert res.confidence >= 0.90
    assert res.requires_human_review is True


def test_cube_electric_flux_solver_mismatch():
    # 68dea616d0cda73d07e93ae6: q/2 at face center + 2q at corner -> phi = q/(2 eps0) -> n = 1
    # Stored key says 2
    res = verification_engine.verify_question("68dea616d0cda73d07e93ae6")
    assert res.verification_status == VerificationStatus.MISMATCH
    assert res.stored_answer == "2"
    assert res.independently_derived_answer == "1"
    assert res.solution_answer == "1"
    assert res.solver_method == SolverMethod.SYMPY
    assert res.requires_human_review is True


def test_cube_surface_area_significant_figures():
    # 68dea715387eea3d0d95f790: side=7.203 m -> 4 sig figs -> 311.3 -> 10A = 3113
    res = verification_engine.verify_question("68dea715387eea3d0d95f790")
    assert res.verification_status == VerificationStatus.VERIFIED
    assert str(res.stored_answer) == "3113"
    assert str(res.independently_derived_answer) == "3113"
    assert res.solver_method == SolverMethod.SYMPY
    assert res.requires_human_review is False


def test_photoelectric_effect_solver():
    # 68c9ae5afb6b2f16e2d43b1c: lambda=4000 A, phi=2.0 eV -> E=3.1 eV -> Kmax=1.1 eV -> Vs=1.1 V (Option D)
    res = verification_engine.verify_question("68c9ae5afb6b2f16e2d43b1c")
    assert res.verification_status == VerificationStatus.VERIFIED
    assert res.stored_answer == "D"
    assert res.independently_derived_answer == "D"
    assert res.solver_method == SolverMethod.SYMPY
    assert res.requires_human_review is False


def test_coulomb_force_ratio_and_blank_option():
    # 68e872546e45ba37dcc16bc0: mutual forces always 1:1. Option C is blank.
    res = verification_engine.verify_question("68e872546e45ba37dcc16bc0")
    assert res.verification_status == VerificationStatus.MISMATCH
    assert res.independently_derived_answer == "1:1"
    assert res.requires_human_review is True
    assert "C" in res.details.get("blank_options", [])


def test_radioactive_decay_solver():
    # 63765a28f1d8416ae0408d89: half-life 60 days, 7/8 disintegrated -> 3 half lives = 180 days (Option C)
    res = verification_engine.verify_question("63765a28f1d8416ae0408d89")
    assert res.verification_status == VerificationStatus.VERIFIED
    assert res.stored_answer == "C"
    assert res.independently_derived_answer == "C"
    assert res.solver_method == SolverMethod.SYMPY


def test_force_percentage_change():
    # 60ca4feb6420652745f55522: 100 N -> 1.1 * 0.9 * 100 = 99 N (Option C)
    res = verification_engine.verify_question("60ca4feb6420652745f55522")
    assert res.verification_status == VerificationStatus.VERIFIED
    assert res.stored_answer == "C"
    assert res.independently_derived_answer == "C"
    assert res.solver_method == SolverMethod.SYMPY


def test_biology_solver_knowledge_check():
    # 61ee6c9d90a1a968a168686b: Peyer's patches -> Option B
    res = verification_engine.verify_question("61ee6c9d90a1a968a168686b")
    assert res.verification_status == VerificationStatus.VERIFIED
    assert res.stored_answer == "B"
    assert res.solver_method == SolverMethod.KNOWLEDGE_CHECK


def test_biology_chapter_misclassification():
    # 68ecbacb2ec87a18deba1ad7: Action potential filed under Botany / Living World
    raw = data_loader.get_question_by_id("68ecbacb2ec87a18deba1ad7")
    norm = question_normalizer.normalize(raw)
    sol_res = biology_solver.solve(norm)
    assert any("Taxonomy anomaly" in ev for ev in sol_res.evidence)


def test_solution_consistency_empty():
    # Test consistency on synthetic empty solution
    raw = data_loader.get_question_by_id("60ca4feb6420652745f55522").copy()
    raw_copy = dict(raw)
    raw_copy["scq"] = dict(raw["scq"])
    raw_copy["scq"]["solution"] = ""
    norm = question_normalizer.normalize(raw_copy)
    report = solution_consistency.analyze(norm)
    assert report.is_consistent is False
    assert any("empty" in ev.lower() for ev in report.evidence)


def test_solver_api_endpoints():
    # Test verify single
    single_res = verify_question("60f744b3f1b9bc7cc7b4a949")
    assert single_res.question_id == "60f744b3f1b9bc7cc7b4a949"

    # Test batch verification
    req = BatchVerificationRequest(limit=10)
    batch_res = verify_batch(req)
    assert batch_res.total_processed == 10
    assert len(batch_res.results) == 10

    # Test statistics
    stats = get_solver_statistics()
    assert stats.total_verified == 43
    assert stats.average_confidence > 0.0
    assert "verified" in stats.by_status
    assert "mismatch" in stats.by_status
