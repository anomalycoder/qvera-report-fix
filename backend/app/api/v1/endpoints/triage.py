from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.schemas.triage import BenchmarkSummary, TriageResult
from app.services.data_loader import data_loader
from app.services.triage.triage_engine import triage_engine

router = APIRouter()


@router.post("/run/{report_id}", response_model=TriageResult, summary="Run triage on a specific student report")
def run_triage_single(report_id: str) -> TriageResult:
    report = data_loader.get_report_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found in dataset")
    return triage_engine.triage_report(report)


@router.post("/run-batch", response_model=List[TriageResult], summary="Run triage engine across all reports")
@router.post("/process-all", response_model=List[TriageResult], summary="Alias for run-batch")
def run_triage_batch() -> List[TriageResult]:
    """Processes all 44 student reports, generates surgical repair proposals, and assigns routes."""
    return triage_engine.process_all_reports()


@router.get("/results", response_model=List[TriageResult], summary="Get triage results (benchmark results.json)")
def get_triage_results() -> List[TriageResult]:
    """Returns the latest triage output matching results.json schema."""
    return triage_engine.process_all_reports()


@router.get("/results/{report_id}", response_model=TriageResult, summary="Get triage evaluation for a specific report")
@router.get("/report/{report_id}", response_model=TriageResult, summary="Alias for results/{report_id}")
def get_report_triage(report_id: str) -> TriageResult:
    report = data_loader.get_report_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found")
    return triage_engine.triage_report(report)


@router.get("/statistics", summary="Get triage decision statistics and distributions")
def get_triage_statistics() -> Dict[str, Any]:
    results = triage_engine.process_all_reports()
    verdicts: Dict[str, int] = {}
    repairs: Dict[str, int] = {}
    routes: Dict[str, int] = {}
    total_conf = 0.0

    for r in results:
        verdicts[r.verdict] = verdicts.get(r.verdict, 0) + 1
        if r.repair:
            repairs[r.repair] = repairs.get(r.repair, 0) + 1
        routes[r.route] = routes.get(r.route, 0) + 1
        total_conf += r.confidence

    avg_conf = round(total_conf / len(results), 4) if results else 0.0

    return {
        "total_reports": len(results),
        "verdicts": verdicts,
        "repairs": repairs,
        "routes": routes,
        "average_confidence": avg_conf,
    }


@router.get("/unreported-defects", summary="Scan unreported questions for silent defects")
def get_unreported_defects() -> List[Dict[str, Any]]:
    """Identifies possible defects in questions that received zero student reports."""
    return triage_engine.benchmark_runner.scan_unreported_defects()
