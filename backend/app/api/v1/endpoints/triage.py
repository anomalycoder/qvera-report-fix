from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.schemas.triage import TriageResult
from app.services.data_loader import data_loader
from app.services.triage_engine import triage_engine

router = APIRouter()


@router.post("/process-all", response_model=List[TriageResult], summary="Run triage engine across all student reports")
def process_all_reports() -> List[TriageResult]:
    """Processes all 44 student reports, generates surgical repair proposals, and assigns routes."""
    return triage_engine.process_all_reports()


@router.get("/results", response_model=List[TriageResult], summary="Get triage results (benchmark results.json)")
def get_triage_results() -> List[TriageResult]:
    """Returns the latest triage output matching results.json schema."""
    return triage_engine.process_all_reports()


@router.get("/report/{report_id}", response_model=TriageResult, summary="Get triage evaluation for a specific report")
def get_report_triage(report_id: str) -> TriageResult:
    report = data_loader.get_report_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found")
    return triage_engine.triage_report(report)


@router.get("/statistics", summary="Get triage decision statistics")
def get_triage_statistics() -> Dict[str, Any]:
    results = triage_engine.process_all_reports()
    verdicts: Dict[str, int] = {}
    repairs: Dict[str, int] = {}
    routes: Dict[str, int] = {}

    for r in results:
        verdicts[r.verdict] = verdicts.get(r.verdict, 0) + 1
        if r.repair:
            repairs[r.repair] = repairs.get(r.repair, 0) + 1
        routes[r.route] = routes.get(r.route, 0) + 1

    return {
        "total_reports": len(results),
        "verdicts": verdicts,
        "repairs": repairs,
        "routes": routes,
    }
