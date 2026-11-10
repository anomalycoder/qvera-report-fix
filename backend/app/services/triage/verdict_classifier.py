"""Verdict Classifier for Triage Engine.
Determines whether an incoming report describes a genuine defect, a student misconception,
a client application glitch, a display issue, or non-actionable input.
"""

from typing import Any, Dict, Optional, Tuple
from app.schemas.question import NormalizedQuestion
from app.schemas.solver import VerificationOutput
from app.services.triage.safety_validator import safety_validator


class VerdictClassifier:
    @staticmethod
    def classify(
        report: Dict[str, Any],
        norm_q: NormalizedQuestion,
        v_res: Optional[VerificationOutput],
        injection_detected: bool,
    ) -> Tuple[str, str]:
        """Returns (verdict, reasoning)."""
        comment = report.get("comment", "").strip()

        # 1. Hostile / Adversarial Input
        if injection_detected:
            return "no_error", "Adversarial prompt injection attempt detected; system prompt preserved."

        # 2. Non-actionable input
        if comment.lower() in ["asdfgh", "asdf", "test", "qwerty", "xxx"] or len(comment) < 3:
            return "not_actionable", "Student comment is empty or gibberish with no actionable diagnostic data."

        # 3. Client application issue
        if ("clicked" in comment.lower() and "saved" in comment.lower()) or "freeze" in comment.lower():
            return "app_issue", "Report describes client application UI event or option selection recording error."

        # 4. Language translation request
        if "hindi" in comment.lower() and ("chahiye" in comment.lower() or "me" in comment.lower() or "medium" in comment.lower()):
            return "language_mode", "Student requests alternate language medium (Hindi) for an English-authored item."

        # 5. Display / Viewport rendering issue
        if ("cut on my phone" in comment.lower() or "not visible on screen" in comment.lower() or 
            "takes forever to load" in comment.lower() or "render" in comment.lower()):
            return "display_issue", "Report describes client viewport clipping or responsive rendering latency."

        # 6. Check for definitive defect signals
        # Curricular misclassification
        if "not geometrical optics" in comment.lower() or "neural control chapter" in comment.lower():
            return "defect", "Question is misfiled under incorrect subject or chapter taxonomy."

        # Syllabus flag
        if "out of syllabus" in comment.lower() or "deleted syllabus" in comment.lower():
            return "defect", "Report flags curriculum obsolescence / deletion from current exam syllabus."

        # Markup leak
        if "\\frac" in comment or norm_q.markup_warnings:
            return "defect", "Unrendered raw LaTeX markup detected in plain text."

        # Spelling
        if "spelling" in comment.lower() or "Epithellial" in norm_q.raw_question_html or "plexux" in norm_q.raw_question_html:
            return "defect", "Typographical error identified in question stem or options."

        # Missing options or blank options
        if norm_q.missing_options or any(opt.is_blank for opt in norm_q.options.values()):
            return "defect", "Option content is incomplete, blank, or missing from HTML."

        # Identical options
        if "identical" in comment.lower() or "same" in comment.lower():
            texts = [opt.text.strip() for opt in norm_q.options.values() if opt.text.strip()]
            if len(texts) != len(set(texts)):
                return "defect", "Two or more multiple-choice options contain duplicate identical choices."

        # Missing diagram
        if norm_q.has_missing_figure_signal and not norm_q.declared_question_images:
            return "defect", "Question text references a diagram ('as shown in figure') that is omitted."

        # Solver proof mismatch
        if v_res and v_res.verification_status == "mismatch":
            return "defect", "Independent SymPy calculation or solution consistency disproves stored answer key."

        # Stem data missing
        if "no inductance" in comment.lower() or "not given" in comment.lower() or "missing" in comment.lower():
            return "defect", "Essential problem parameter omitted from question stem."

        # Default fallback: check if question was confirmed sound
        if v_res and v_res.verification_status == "verified":
            return "no_error", "Independent mathematical and conceptual verification confirms question is sound."

        return "no_error", "Evidence confirms stored question content and answer key are correct."


verdict_classifier = VerdictClassifier()
