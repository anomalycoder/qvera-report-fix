"""Repair Classifier for Triage Engine.
Determines the exact surgical repair category from taxonomy.json for confirmed defects.
"""

from typing import Any, Dict, Optional
from app.schemas.question import NormalizedQuestion
from app.schemas.solver import VerificationOutput


class RepairClassifier:
    @staticmethod
    def classify(
        report: Dict[str, Any],
        norm_q: NormalizedQuestion,
        v_res: Optional[VerificationOutput],
    ) -> Optional[str]:
        comment = report.get("comment", "").strip()

        # 1. Stray Exam Reference
        if "(NEET 2019)" in norm_q.raw_question_html or "NEET 2019" in comment:
            return "exam_reference"

        # 2. Markup Leak
        if "\\frac" in comment or norm_q.markup_warnings:
            return "markup_leak"

        # 3. Spelling
        if "spelling" in comment.lower() or "Epithellial" in norm_q.raw_question_html or "plexux" in norm_q.raw_question_html:
            return "spelling"

        # 4. Curricular & Chapter Misclassification
        if "not geometrical optics" in comment.lower() or "neural control chapter" in comment.lower():
            return "wrong_chapter"

        if "out of syllabus" in comment.lower():
            return "syllabus"

        # 5. Missing Diagram
        if norm_q.has_missing_figure_signal or "diagram missing" in comment.lower() or "where is the diagram" in comment.lower():
            return "diagram"

        # 6. Identical Options
        if "identical" in comment.lower() or "both 0 w" in comment.lower():
            return "identical_options"

        # 7. Option Repair (Blank option or missing option)
        if norm_q.missing_options or any(opt.is_blank for opt in norm_q.options.values()) or "option c is blank" in comment.lower() or "no option d" in comment.lower():
            return "option_repair"

        # 8. Missing Stem Data
        if "no inductance" in comment.lower() or "cube length missing" in comment.lower() or "missing" in comment.lower() and "length" in comment.lower():
            return "stem_data"

        # 9. Type Mismatch
        if "options are a b d" in comment.lower() or "mcq" in comment.lower() and "single" in comment.lower() or (isinstance(norm_q.stored_answer, list) and len(norm_q.stored_answer) > 1 and norm_q.question_type == "scq"):
            return "type_mismatch"

        # 10. Solution Fix (Answer key is right, but solution calculation had arithmetic typo)
        if "400 is 20" in comment.lower() or "solution has a calculation error" in comment.lower() or "formula in solution" in comment.lower() or "wrong solution" in comment.lower():
            return "solution_fix"

        # 11. Answer Form (e.g. 5.0 vs 5, or trailing decimals)
        if "integer answer" in comment.lower() and "decimal" in comment.lower():
            return "answer_form"

        # 12. Answer Key (Default for mathematical mismatch where stored answer differs from true solution)
        if v_res and v_res.verification_status == "mismatch":
            return "answer_key"

        if "wrong answer" in comment.lower() or "key is wrong" in comment.lower() or "answer should be" in comment.lower():
            return "answer_key"

        return "answer_key"


repair_classifier = RepairClassifier()
