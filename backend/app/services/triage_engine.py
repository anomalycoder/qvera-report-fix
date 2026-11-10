"""Compatibility re-export of TriageEngine from modular services package."""

from app.services.triage.triage_engine import TriageEngine, triage_engine

__all__ = ["TriageEngine", "triage_engine"]
