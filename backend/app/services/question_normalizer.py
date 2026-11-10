import re
from typing import Any, Dict, List, Optional, Tuple
from bs4 import BeautifulSoup, Tag
from app.schemas.question import NormalizedQuestion, OptionItem


class QuestionNormalizer:
    """Service to safely normalize, parse, and extract intelligence from messy
    JEE/NEET question HTML without mutating or rewriting original content.
    """

    OPTION_LABELS = ["A", "B", "C", "D"]
    FIGURE_KEYWORDS = ["figure", "diagram", "shown below", "given figure", "graph", "circuit"]

    def normalize(self, raw_q: Dict[str, Any]) -> NormalizedQuestion:
        """Normalizes a raw question dict into a structured NormalizedQuestion."""
        qid = raw_q.get("_id", "")
        custom_qid = raw_q.get("qid")
        qtype = raw_q.get("questionType", "scq")
        subject = raw_q.get("subject")
        chapter = raw_q.get("chapter")
        concept = raw_q.get("concept")
        sub_concept = raw_q.get("subConcept")
        difficulty = raw_q.get("level")

        # Extract type-specific container
        type_data = raw_q.get(qtype, {})
        if not type_data and qtype not in raw_q:
            # Fallback check if stored under another key
            for candidate in ["scq", "mcq", "integerQuestion"]:
                if candidate in raw_q and isinstance(raw_q[candidate], dict):
                    type_data = raw_q[candidate]
                    break

        raw_q_html = type_data.get("question", "")
        raw_sol_html = type_data.get("solution", "")
        stored_ans = type_data.get("answer")

        declared_q_imgs = type_data.get("quesImages", []) or []
        declared_sol_imgs = type_data.get("solutionImages", []) or []

        # Parse HTML safely
        soup = BeautifulSoup(raw_q_html, "html.parser")

        # Extract inline images
        inline_imgs = [img.get("src") for img in soup.find_all("img") if img.get("src")]

        # Count MathML occurrences
        mathml_tags = soup.find_all("math")
        mathml_count = len(mathml_tags)

        # Detect markup warnings (raw LaTeX leak, unclosed tags, entity leaks)
        markup_warnings = self._detect_markup_warnings(raw_q_html, soup)

        # Detect missing figure signal
        has_fig_signal = self._detect_missing_figure_signal(
            raw_q_html, inline_imgs, declared_q_imgs
        )

        # Extract stem and options
        stem_text, options, missing_options = self._extract_stem_and_options(
            qtype, raw_q_html, soup
        )

        return NormalizedQuestion(
            question_id=qid,
            qid=custom_qid,
            question_type=qtype,
            subject=subject,
            chapter=chapter,
            concept=concept,
            sub_concept=sub_concept,
            difficulty=difficulty,
            raw_question_html=raw_q_html,
            raw_solution_html=raw_sol_html,
            stored_answer=stored_ans,
            stem_text=stem_text,
            options=options,
            missing_options=missing_options,
            declared_question_images=declared_q_imgs,
            declared_solution_images=declared_sol_imgs,
            inline_images=inline_imgs,
            has_missing_figure_signal=has_fig_signal,
            mathml_count=mathml_count,
            markup_warnings=markup_warnings,
        )

    def _extract_stem_and_options(
        self, qtype: str, raw_html: str, soup: BeautifulSoup
    ) -> Tuple[str, Dict[str, OptionItem], List[str]]:
        """Parses options and stem for SCQ / MCQ questions using HTML element boundaries."""
        if qtype == "integerQuestion":
            clean_text = " ".join(soup.get_text().split())
            return clean_text, {}, []

        options: Dict[str, OptionItem] = {}
        missing_options: List[str] = []

        # Find option boundary positions in text / html
        # Pattern matching (A), (B), (C), (D)
        text = soup.get_text()

        # Check which option markers exist
        found_markers = {}
        for label in self.OPTION_LABELS:
            # Check for (A) or (a) or A.
            match = re.search(rf"\({label}\)", raw_html, re.IGNORECASE)
            if match:
                found_markers[label] = match.start()

        # If not all 4 standard options found in SCQ/MCQ
        for label in self.OPTION_LABELS:
            if label not in found_markers:
                missing_options.append(label)

        # Extract text stem before the first option marker
        if found_markers:
            first_opt_pos = min(found_markers.values())
            stem_soup = BeautifulSoup(raw_html[:first_opt_pos], "html.parser")
            stem_text = " ".join(stem_soup.get_text().split())
        else:
            stem_text = " ".join(text.split())

        # Extract individual options content
        sorted_labels = sorted(found_markers.keys(), key=lambda l: found_markers[l])
        for i, label in enumerate(sorted_labels):
            start_pos = found_markers[label]
            end_pos = (
                found_markers[sorted_labels[i + 1]]
                if i + 1 < len(sorted_labels)
                else len(raw_html)
            )

            chunk = raw_html[start_pos:end_pos]
            # Strip the leading (A) / (B) marker from chunk
            cleaned_chunk = re.sub(rf"^\s*\(?{label}\)?[\s\:\.\-]*", "", chunk, flags=re.IGNORECASE)
            chunk_soup = BeautifulSoup(cleaned_chunk, "html.parser")
            chunk_text = " ".join(chunk_soup.get_text().split())

            is_blank = len(chunk_text.strip()) == 0 and len(chunk_soup.find_all(["img", "math"])) == 0

            options[label] = OptionItem(
                label=label,
                raw_html=cleaned_chunk.strip(),
                text=chunk_text,
                is_blank=is_blank,
            )

        return stem_text, options, missing_options

    def _detect_markup_warnings(self, html: str, soup: BeautifulSoup) -> List[str]:
        """Detects raw LaTeX leaks, malformed MathML tags, or entity problems."""
        warnings: List[str] = []

        # Check for unclosed math tags
        open_math = len(re.findall(r"<math\b", html, re.IGNORECASE))
        close_math = len(re.findall(r"</math>", html, re.IGNORECASE))
        if open_math != close_math:
            warnings.append(f"Mismatched MathML tags: {open_math} open vs {close_math} close")

        # Check for raw LaTeX command leaks outside math tags
        # Extract HTML with math tags removed to see if LaTeX commands remain visible
        soup_copy = BeautifulSoup(html, "html.parser")
        for m in soup_copy.find_all("math"):
            m.decompose()
        non_math_text = soup_copy.get_text()

        latex_patterns = [r"\\frac\b", r"\\sqrt\b", r"\\times\b", r"\\alpha\b", r"\\beta\b", r"\\theta\b"]
        for pat in latex_patterns:
            if re.search(pat, non_math_text):
                warnings.append(f"Raw LaTeX leak detected outside MathML: {pat}")

        return warnings

    def _detect_missing_figure_signal(
        self, html: str, inline_imgs: List[str], declared_imgs: List[str]
    ) -> bool:
        """Detects if question text references a figure/diagram but provides no image."""
        total_images = len(inline_imgs) + len(declared_imgs)
        if total_images > 0:
            return False

        lower_html = html.lower()
        for kw in self.FIGURE_KEYWORDS:
            if kw in lower_html:
                return True
        return False


question_normalizer = QuestionNormalizer()
