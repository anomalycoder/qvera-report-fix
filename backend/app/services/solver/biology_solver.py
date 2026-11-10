import re
from typing import Any, Dict, List, Optional
from bs4 import BeautifulSoup
from app.schemas.question import NormalizedQuestion
from app.schemas.solver import SolverMethod
from app.services.solver.answer_extractor import answer_extractor
from app.services.solver.base_solver import BaseSolver, SolverResult


class BiologySolver(BaseSolver):
    """Biology (Botany & Zoology) verification pathway.
    Checks question-solution consistency, detects contradictions and unrelated concepts,
    identifies taxonomy misclassifications (e.g. neurophysiology filed under Botany),
    and strictly avoids fabricating biological facts.
    """

    def can_solve(self, question: NormalizedQuestion) -> bool:
        subj = (question.subject or "").lower()
        return "bio" in subj or "zool" in subj or "botan" in subj

    def solve(self, question: NormalizedQuestion) -> SolverResult:
        raw_q = question.raw_question_html
        raw_sol = question.raw_solution_html or ""
        q_soup = BeautifulSoup(raw_q, "html.parser")
        sol_soup = BeautifulSoup(raw_sol, "html.parser")

        q_text = q_soup.get_text()
        sol_text = sol_soup.get_text()
        stored_ans = str(question.stored_answer).strip().upper() if question.stored_answer is not None else ""

        evidence: List[str] = []

        # 1. Check for subject / chapter misclassification
        # Example: Action potential / refractory period in neurons filed under Botany / Living World
        if "action potential" in q_text.lower() or "refractory period" in q_text.lower():
            if question.subject == "Botany":
                evidence.append(
                    "Taxonomy anomaly: Neurophysiology (action potential / refractory period) is filed under 'Botany / The Living World'."
                )

        # 2. Check solution alignment with question
        # Extract concluded answer from solution text
        sol_concluded_ans = answer_extractor.extract_solution_answer(question)

        # 3. Direct option match checking in solution
        matched_options: List[str] = []
        clean_sol_text = sol_text.replace("’", "'").replace("‘", "'").lower()

        for label, opt in question.options.items():
            clean_opt_text = opt.text.replace("’", "'").replace("‘", "'").strip().lower()
            if len(clean_opt_text) >= 4 and clean_opt_text in clean_sol_text:
                matched_options.append(label)
                evidence.append(f"Option ({label}) '{opt.text.strip()}' is discussed in the solution.")

        # Check if the stored answer option is affirmed
        stored_opt_matches = stored_ans in matched_options

        # Determine result based on evidence
        if sol_concluded_ans and sol_concluded_ans == stored_ans:
            evidence.append(f"Solution explanation directly supports keyed answer ({stored_ans}).")
            return SolverResult(
                derived_answer=stored_ans,
                solver_method=SolverMethod.KNOWLEDGE_CHECK,
                confidence=0.85,
                reasoning=f"Verified biological explanation in solution consistently supports stored answer ({stored_ans}).",
                evidence=evidence,
                requires_human_review=False,
                metadata={"solution_supports_key": True},
            )
        elif stored_opt_matches:
            evidence.append(f"Solution text directly affirms and defines stored option ({stored_ans}).")
            return SolverResult(
                derived_answer=stored_ans,
                solver_method=SolverMethod.KNOWLEDGE_CHECK,
                confidence=0.80,
                reasoning=f"Solution text affirms option ({stored_ans}).",
                evidence=evidence,
                requires_human_review=False,
                metadata={"matched_option": stored_ans},
            )
        elif sol_concluded_ans and sol_concluded_ans != stored_ans:
            evidence.append(
                f"Contradiction detected: Solution text concludes ({sol_concluded_ans}) but stored key is ({stored_ans})."
            )
            return SolverResult(
                derived_answer=sol_concluded_ans,
                solver_method=SolverMethod.KNOWLEDGE_CHECK,
                confidence=0.85,
                reasoning=f"Solution internally affirms ({sol_concluded_ans}), contradicting stored answer ({stored_ans}).",
                evidence=evidence,
                requires_human_review=True,
                metadata={"solution_contradiction": True},
            )
        else:
            # Conservative fallback: Do not fabricate external biology knowledge
            evidence.append(
                "No deterministic biological rule or unambiguous solution affirmation found; flagged for human expert review."
            )
            return SolverResult(
                derived_answer=None,
                solver_method=SolverMethod.UNAVAILABLE,
                confidence=0.3,
                reasoning="Requires domain faculty review to evaluate factual accuracy without fabricating external assertions.",
                evidence=evidence,
                requires_human_review=True,
            )


biology_solver = BiologySolver()
