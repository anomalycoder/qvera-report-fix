import json
from typing import Annotated, Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.core.database import get_db_connection
from app.schemas.audit import AuditAction, AuditActionCreate

router = APIRouter()


@router.post("/action", response_model=Dict[str, Any], summary="Record a faculty audit action (approve, edit, reject)")
def record_audit_action(action: AuditActionCreate) -> Dict[str, Any]:
    """Records an audit log entry when a faculty member reviews, approves, edits, or rejects a proposal."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO audit_logs (report_id, question_id, action, faculty_id, faculty_name, notes, applied_edit)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                action.report_id,
                action.question_id,
                action.action,
                action.faculty_id or "faculty_1",
                action.faculty_name or "Reviewing Faculty",
                action.notes,
                json.dumps(action.applied_edit) if action.applied_edit else None,
            ),
        )
        conn.commit()
        log_id = cursor.lastrowid

    return {
        "status": "success",
        "log_id": log_id,
        "action": action.action,
        "report_id": action.report_id,
        "question_id": action.question_id,
        "message": f"Action '{action.action}' logged successfully.",
    }


@router.get("/logs", response_model=List[Dict[str, Any]], summary="List recorded faculty audit actions")
def list_audit_logs(
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    question_id: Annotated[Optional[str], Query()] = None,
) -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if question_id:
            cursor.execute(
                """
                SELECT id, report_id, question_id, action, faculty_id, faculty_name, notes, applied_edit, created_at
                FROM audit_logs
                WHERE question_id = ?
                ORDER BY id DESC
                LIMIT ? OFFSET ?
                """,
                (question_id, limit, skip),
            )
        else:
            cursor.execute(
                """
                SELECT id, report_id, question_id, action, faculty_id, faculty_name, notes, applied_edit, created_at
                FROM audit_logs
                ORDER BY id DESC
                LIMIT ? OFFSET ?
                """,
                (limit, skip),
            )
        rows = cursor.fetchall()

    return [
        {
            "id": r["id"],
            "report_id": r["report_id"],
            "question_id": r["question_id"],
            "action": r["action"],
            "faculty_id": r["faculty_id"],
            "faculty_name": r["faculty_name"],
            "notes": r["notes"],
            "applied_edit": json.loads(r["applied_edit"]) if r["applied_edit"] else None,
            "created_at": r["created_at"],
        }
        for r in rows
    ]
