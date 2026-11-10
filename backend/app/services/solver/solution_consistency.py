import re
from typing import Any, Dict, List, Optional
from bs4 import BeautifulSoup
import sympy as sp
from app.schemas.question import NormalizedQuestion
from app.services.solver.answer_extractor import answer_extractor


class ConsistencyReport:
    def __init__(self):
        self.is_consistent: bool = True
        self.addresses_question: bool = True
        self.solution_concluded_answer: Optional[Any] = None
        self.agrees_with_stored_answer: bool = True
        self.calculations_consistent: bool = True
        self.contradictory_statements: List[str] = []
        self.unmatched_solution_values: List[str] = []
        self.evidence: List[str] = []


class SolutionConsistency:
    """Evaluates whether the stored solution is internally consistent,
    addresses the question, agrees with the stored answer key, and uses
    valid calculations without injecting unreferenced external values.
    """

    def analyze(self, question: NormalizedQuestion) -> ConsistencyReport:
        report = ConsistencyReport()

        raw_sol = question.raw_solution_html
        if not raw_sol or raw_sol.strip() in ["", "<h3></h3>"]:
            report.is_consistent = False
            report.evidence.append("Solution is empty or missing.")
            report.agrees_with_stored_answer = False
            return report

        q_soup = BeautifulSoup(question.raw_question_html, "html.parser")
        sol_soup = BeautifulSoup(raw_sol, "html.parser")

        q_text = q_soup.get_text()
        sol_text = sol_soup.get_text()

        # 1. Check if solution addresses actual question
        # Look for overlapping key domain keywords
        q_words = set(re.findall(r"\b[A-Za-z]{4,}\b", q_text.lower()))
        sol_words = set(re.findall(r"\b[A-Za-z]{4,}\b", sol_text.lower()))
        common_words = q_words.intersection(sol_words)

        # Ignore common filler words
        common_words.difference_update({"which", "following", "given", "value", "equal", "between", "total", "ratio"})
        if len(common_words) == 0 and len(q_words) > 5:
            report.addresses_question = False
            report.evidence.append("Solution vocabulary does not match question concepts (potential wrong solution attached).")

        # 2. Extract concluded answer from solution
        sol_ans = answer_extractor.extract_solution_answer(question)
        report.solution_concluded_answer = sol_ans

        stored_ans = str(question.stored_answer).strip().upper() if question.stored_answer is not None else ""

        # 3. Check agreement between solution conclusion and stored answer
        if sol_ans is not None:
            sol_ans_str = str(sol_ans).strip().upper()
            if sol_ans_str != stored_ans:
                report.agrees_with_stored_answer = False
                report.evidence.append(
                    f"Solution concludes answer '{sol_ans_str}', but question key says '{stored_ans}'."
                )
            else:
                report.evidence.append(
                    f"Solution conclusion '{sol_ans_str}' matches stored answer key '{stored_ans}'."
                )

        # 4. Check numerical calculation steps in solution
        self._check_numerical_steps(sol_text, report)

        # 5. Check if numbers in question exist in solution
        q_numbers = set(re.findall(r"\b\d+(?:\.\d+)?\b", q_text))
        sol_numbers = set(re.findall(r"\b\d+(?:\.\d+)?\b", sol_text))
        # If question has numbers but solution has none of them
        if len(q_numbers) >= 2 and len(q_numbers.intersection(sol_numbers)) == 0:
            report.evidence.append("None of the numerical values from the question appear in the solution.")

        # Determine overall consistency
        if not report.agrees_with_stored_answer or not report.calculations_consistent or not report.addresses_question:
            report.is_consistent = False

        return report

    def _check_numerical_steps(self, sol_text: str, report: ConsistencyReport):
        """Verifies simple explicit equations like '100 = ...' or '(40)^2 + (30)^2 = 50'."""
        # Check standard pythagorean pattern: e.g. sqrt(40^2 + 30^2) = 50
        pyth_match = re.search(r"\(?(\d+)\)?\^?2\s*\+\s*\(?(\d+)\)?\^?2\s*=\s*\(?(\d+)\)?(?:\^2)?", sol_text)
        if pyth_match:
            a, b, c = map(float, pyth_match.groups())
            if abs(a**2 + b**2 - c**2) > 1e-2 and abs((a**2 + b**2)**0.5 - c) > 1e-2:
                report.calculations_consistent = False
                report.evidence.append(f"Arithmetic mismatch in pythagorean step: ({a})^2 + ({b})^2 != {c}")


solution_consistency = SolutionConsistency()
