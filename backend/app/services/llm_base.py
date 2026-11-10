from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from app.schemas.triage import TriageResult


class LLMProviderInterface(ABC):
    """Abstract Base Class for Provider-Independent LLM Integration.
    Can be backed by Google Gemini, OpenAI, Anthropic Claude, or local Ollama.
    """

    @abstractmethod
    async def analyze_report(
        self,
        report: Dict[str, Any],
        question: Dict[str, Any],
        taxonomy: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze a student report against a question and return triage fields."""
        pass


class MockProvider(LLMProviderInterface):
    """Baseline stub provider for architectural setup before active AI wiring."""

    async def analyze_report(
        self,
        report: Dict[str, Any],
        question: Dict[str, Any],
        taxonomy: Dict[str, Any]
    ) -> Dict[str, Any]:
        return {
            "reportId": report.get("reportId", ""),
            "questionId": report.get("questionId", ""),
            "verdict": "no_error",
            "repair": None,
            "edit": None,
            "route": "no_change",
            "confidence": 0.5,
            "evidence": "Baseline placeholder pending active LLM orchestration.",
            "student_reply": "Thank you for flagging this question. Our team is currently reviewing your report."
        }


def get_llm_provider() -> LLMProviderInterface:
    """Factory method for provider-independent LLM instantiation."""
    # Future prompts will wire live Gemini / OpenAI / Anthropic providers
    return MockProvider()
