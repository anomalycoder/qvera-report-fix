import sympy as sp
from typing import Any, Dict, Optional, Tuple, Union


class SympyMathVerifier:
    """Mathematical verification service using SymPy.
    Used for verifying numeric equations, algebraic equivalence, and calculations
    flagged in student reports (e.g. root(40^2+30^2) == 50).
    """

    @staticmethod
    def evaluate_expression(expr_str: str) -> Optional[float]:
        """Safely parse and evaluate numeric expression."""
        try:
            expr = sp.sympify(expr_str)
            return float(expr.evalf())
        except Exception:
            return None

    @staticmethod
    def are_expressions_equivalent(expr1_str: str, expr2_str: str) -> bool:
        """Check if two algebraic expressions are mathematically equivalent."""
        try:
            e1 = sp.sympify(expr1_str)
            e2 = sp.sympify(expr2_str)
            diff = sp.simplify(e1 - e2)
            return diff == 0
        except Exception:
            return False

    @staticmethod
    def verify_numeric_equality(val1: Union[int, float, str], val2: Union[int, float, str], tolerance: float = 1e-4) -> bool:
        """Check numeric equality within tolerance."""
        try:
            v1 = float(sp.sympify(str(val1)).evalf())
            v2 = float(sp.sympify(str(val2)).evalf())
            return abs(v1 - v2) <= tolerance
        except Exception:
            return False


math_verifier = SympyMathVerifier()
