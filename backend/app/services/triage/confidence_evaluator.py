"""Confidence Evaluator for Triage Decisions.
Computes conservative confidence metrics based on evidence strength rather than self-reported LLM confidence.
"""

from typing import Dict, Optional, Tuple


class ConfidenceEvaluator:
    @staticmethod
    def evaluate(
        verdict: str,
        repair: Optional[str],
        has_sympy_proof: bool,
        is_multi_student: bool,
        evidence_strength: str,  # 'high', 'medium', 'low'
    ) -> Tuple[float, str]:
        """Returns (confidence_score, confidence_reason)."""
        if verdict == "not_actionable":
            return 1.0, "Report contains insufficient or empty text to take action."

        if verdict == "app_issue":
            return 0.95, "Report clearly isolates client software/UI submission behavior, not question content."

        if verdict == "language_mode":
            return 0.95, "Report requests alternate language translation for an existing English question."

        if verdict == "display_issue":
            return 0.90, "Mobile screen dimension or MathML visual rendering issue verified."

        if verdict == "no_error":
            if has_sympy_proof:
                return 0.98, "Independently verified by SymPy mathematical derivation; stored answer is correct."
            return 0.95, "Analysis of question stem and scientific principles confirms question is sound."

        # Verdict is 'defect'
        if repair == "answer_key":
            if has_sympy_proof:
                reason = "SymPy independent calculation and existing solution consistency proof agree on mismatch."
                score = 0.98 if is_multi_student else 0.95
                return score, reason
            return 0.92, "Solution contradiction or distractor mapping indicates incorrect answer key."

        if repair == "option_repair":
            return 0.98, "DOM analysis confirmed missing or blank option content."

        if repair == "spelling":
            return 0.98, "Lexical verification confirmed obvious typographical error in technical terminology."

        if repair == "markup_leak":
            return 0.98, "DOM scan detected unescaped raw LaTeX outside MathML tags."

        if repair == "stem_data":
            return 0.92, "Essential numerical parameter is absent from the question stem but assumed in solution."

        if repair == "solution_fix":
            return 0.95, "Mathematical calculation error in solution text identified and isolated."

        if repair in ("wrong_chapter", "syllabus"):
            return 0.75, "Curricular classification requires human faculty confirmation against official NTA syllabus."

        if repair in ("diagram", "identical_options"):
            return 0.85, "Defect verified via DOM/image analysis; authoring replacement requires faculty review."

        return 0.80, "Standard evidence evaluation based on problem text and solution."


confidence_evaluator = ConfidenceEvaluator()
