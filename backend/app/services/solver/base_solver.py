from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.question import NormalizedQuestion
from app.schemas.solver import SolverMethod, VerificationStatus


class SolverResult(BaseModel):
    derived_answer: Optional[Any] = None
    solver_method: SolverMethod = SolverMethod.UNAVAILABLE
    confidence: float = 0.0
    reasoning: str = ""
    evidence: List[str] = Field(default_factory=list)
    requires_human_review: bool = True
    metadata: Dict[str, Any] = Field(default_factory=dict)


class BaseSolver(ABC):
    """Abstract Base Class for Domain Question Solvers."""

    @abstractmethod
    def can_solve(self, question: NormalizedQuestion) -> bool:
        """Determines if this solver can process the given question."""
        pass

    @abstractmethod
    def solve(self, question: NormalizedQuestion) -> SolverResult:
        """Independently derives an answer from the question text without using stored answer."""
        pass
