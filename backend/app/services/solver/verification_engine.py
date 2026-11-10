from typing import Any, Dict, List, Optional
from app.schemas.question import NormalizedQuestion
from app.schemas.solver import (
    BatchVerificationResponse,
    SolverMethod,
    SolverStatisticsResponse,
    VerificationResponse,
    VerificationStatus,
)
from app.services.data_loader import data_loader
from app.services.question_normalizer import question_normalizer
from app.services.solver.answer_extractor import answer_extractor
from app.services.solver.biology_solver import biology_solver
from app.services.solver.chemistry_solver import chemistry_solver
from app.services.solver.mathematics_solver import mathematics_solver
from app.services.solver.physics_solver import physics_solver
from app.services.solver.solution_consistency import solution_consistency


class VerificationEngine:
    """Master engine orchestrating independent question solving, answer extraction,
    solution consistency checking, and safety gatekeeping.
    """

    def __init__(self):
        self._cache: Dict[str, VerificationResponse] = {}

    def get_solver_for_question(self, question: NormalizedQuestion):
        if physics_solver.can_solve(question):
            return physics_solver
        elif biology_solver.can_solve(question):
            return biology_solver
        elif chemistry_solver.can_solve(question):
            return chemistry_solver
        elif mathematics_solver.can_solve(question):
            return mathematics_solver
        return None

    def verify_question(self, raw_or_normalized: Any) -> VerificationResponse:
        """Verifies a question independently and returns structured VerificationResponse."""
        if isinstance(raw_or_normalized, NormalizedQuestion):
            norm_q = raw_or_normalized
        elif isinstance(raw_or_normalized, dict):
            norm_q = question_normalizer.normalize(raw_or_normalized)
        elif isinstance(raw_or_normalized, str):
            raw = data_loader.get_question_by_id(raw_or_normalized)
            if not raw:
                raise ValueError(f"Question with ID '{raw_or_normalized}' not found in dataset")
            norm_q = question_normalizer.normalize(raw)
        else:
            raise TypeError("Expected question ID, raw dict, or NormalizedQuestion")

        qid = norm_q.question_id
        stored_ans = str(norm_q.stored_answer).strip().upper() if norm_q.stored_answer is not None else ""

        # Check solver
        solver = self.get_solver_for_question(norm_q)
        solver_res = solver.solve(norm_q) if solver else None

        # Check solution consistency
        consistency = solution_consistency.analyze(norm_q)

        # Answer concluded by solution
        sol_ans = consistency.solution_concluded_answer
        sol_ans_str = str(sol_ans).strip().upper() if sol_ans is not None else None

        derived_ans = solver_res.derived_answer if solver_res else None
        derived_ans_str = str(derived_ans).strip().upper() if derived_ans is not None else None

        evidence: List[str] = []
        if solver_res and solver_res.evidence:
            evidence.extend(solver_res.evidence)
        if consistency.evidence:
            evidence.extend(consistency.evidence)

        # Detect blank options or missing option defects
        blank_options = [label for label, opt in norm_q.options.items() if opt.is_blank]
        if blank_options:
            evidence.append(f"Defect detected: Option ({blank_options[0]}) is completely blank in question.")

        if norm_q.missing_options:
            evidence.append(f"Defect detected: Missing option(s) in question: {norm_q.missing_options}")

        # Determine VerificationStatus & Confidence
        status = VerificationStatus.UNSUPPORTED
        method = solver_res.solver_method if solver_res else SolverMethod.UNAVAILABLE
        confidence = solver_res.confidence if solver_res else 0.1
        requires_human = True
        reasoning = ""

        # Case 1: Independent solver derived a concrete answer
        if derived_ans_str is not None:
            if derived_ans_str == stored_ans:
                # Derived answer confirms stored answer!
                status = VerificationStatus.VERIFIED
                confidence = max(confidence, 0.90)
                requires_human = False
                reasoning = (
                    f"Independently derived answer '{derived_ans_str}' matches stored answer '{stored_ans}'. "
                    f"Verified via {method.value}."
                )
            else:
                # Derived answer contradicts stored answer!
                status = VerificationStatus.MISMATCH
                confidence = max(confidence, 0.90)
                requires_human = True
                reasoning = (
                    f"Defect detected: Independently derived answer '{derived_ans_str}' CONTRADICTS stored answer '{stored_ans}'! "
                    f"Verified via {method.value}."
                )

        # Case 2: Solver could not derive, but solution concluded an answer
        elif sol_ans_str is not None:
            if sol_ans_str == stored_ans:
                status = VerificationStatus.VERIFIED
                method = SolverMethod.RULE_BASED
                confidence = 0.75
                requires_human = False
                reasoning = f"Solution conclusion '{sol_ans_str}' confirms stored answer '{stored_ans}'."
            else:
                status = VerificationStatus.MISMATCH
                method = SolverMethod.RULE_BASED
                confidence = 0.85
                requires_human = True
                reasoning = (
                    f"Defect detected: Solution conclusion '{sol_ans_str}' CONTRADICTS stored answer '{stored_ans}'!"
                )

        # Case 3: Incomplete question / blank options / missing options
        elif blank_options or norm_q.missing_options:
            status = VerificationStatus.UNCERTAIN
            method = SolverMethod.RULE_BASED
            confidence = 0.80
            requires_human = True
            reasoning = "Question text has missing or blank options, preventing complete automated resolution."

        # Case 4: No automated resolution
        else:
            status = VerificationStatus.UNSUPPORTED
            method = SolverMethod.UNAVAILABLE
            confidence = 0.15
            requires_human = True
            reasoning = solver_res.reasoning if solver_res else "No deterministic domain solver available."

        # Safety override: if there's a blank option or missing options, always require human review
        if blank_options or norm_q.missing_options:
            requires_human = True

        resp = VerificationResponse(
            question_id=qid,
            question_type=norm_q.question_type,
            stored_answer=norm_q.stored_answer,
            independently_derived_answer=derived_ans,
            solution_answer=sol_ans,
            verification_status=status,
            solver_method=method,
            confidence=round(confidence, 3),
            reasoning_summary=reasoning,
            evidence=evidence,
            requires_human_review=requires_human,
            details={
                "blank_options": blank_options,
                "missing_options": norm_q.missing_options,
                "markup_warnings": norm_q.markup_warnings,
            },
        )

        self._cache[qid] = resp
        return resp

    def verify_batch(self, question_ids: Optional[List[str]] = None, limit: int = 50) -> BatchVerificationResponse:
        """Processes questions in batch with safety limit."""
        if question_ids is None:
            questions = data_loader.load_questions()
            target_ids = [q["_id"] for q in questions[:limit]]
        else:
            target_ids = question_ids[:limit]

        results = [self.verify_question(qid) for qid in target_ids]

        counts = {
            VerificationStatus.VERIFIED: 0,
            VerificationStatus.MISMATCH: 0,
            VerificationStatus.UNCERTAIN: 0,
            VerificationStatus.UNSUPPORTED: 0,
        }
        for r in results:
            counts[r.verification_status] += 1

        return BatchVerificationResponse(
            total_processed=len(results),
            verified_count=counts[VerificationStatus.VERIFIED],
            mismatch_count=counts[VerificationStatus.MISMATCH],
            uncertain_count=counts[VerificationStatus.UNCERTAIN],
            unsupported_count=counts[VerificationStatus.UNSUPPORTED],
            results=results,
        )

    def get_cached_verification(self, question_id: str) -> Optional[VerificationResponse]:
        return self._cache.get(question_id)

    def get_statistics(self) -> SolverStatisticsResponse:
        """Calculates statistics across all 43 questions."""
        batch = self.verify_batch(limit=100)
        by_status = {}
        by_method = {}
        human_req = 0
        total_conf = 0.0

        for r in batch.results:
            st = r.verification_status.value
            by_status[st] = by_status.get(st, 0) + 1

            m = r.solver_method.value
            by_method[m] = by_method.get(m, 0) + 1

            if r.requires_human_review:
                human_req += 1
            total_conf += r.confidence

        avg_conf = round(total_conf / len(batch.results), 3) if batch.results else 0.0

        return SolverStatisticsResponse(
            total_verified=batch.total_processed,
            by_status=by_status,
            by_method=by_method,
            human_review_required_count=human_req,
            average_confidence=avg_conf,
        )


verification_engine = VerificationEngine()
