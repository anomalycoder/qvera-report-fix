from fastapi import APIRouter
from app.api.v1.endpoints import audit, dataset, health, questions, reports, solver, taxonomy, triage

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(dataset.router, prefix="/dataset", tags=["Dataset"])
api_router.include_router(questions.router, prefix="/questions", tags=["Questions"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(taxonomy.router, prefix="/taxonomy", tags=["Taxonomy"])
api_router.include_router(solver.router, prefix="/solver", tags=["Solver"])
api_router.include_router(triage.router, prefix="/triage", tags=["Triage"])
api_router.include_router(audit.router, prefix="/audit", tags=["Audit"])
