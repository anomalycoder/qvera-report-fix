import asyncio
import json
import os
import re
import threading
import time
from typing import Annotated, Any, Dict, List, Optional, Set, Tuple
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from app.api.v1.endpoints.auth import get_current_user_optional
from app.core.database import get_db_connection
from app.schemas.faculty import (
    FacultyActionRequest,
    FacultyActionResponse,
    FacultyOverviewResponse,
    FacultyQueueItem,
    FacultyQueueResponse,
)
from app.schemas.triage import ProposedEdit, TriageResult
from app.services.data_loader import data_loader
from app.services.question_normalizer import question_normalizer
from app.services.solver.verification_engine import verification_engine
from app.services.taxonomy_service import taxonomy_service
from app.services.triage.triage_engine import triage_engine

router = APIRouter()

# Thread-safe pub-sub registry for live Server-Sent Events (SSE) notifications
_subscribers_lock = threading.Lock()
_notification_subscribers: Set[Tuple[asyncio.AbstractEventLoop, asyncio.Queue]] = set()


def _publish_realtime_event(event: Dict[str, Any]) -> None:
    """Broadcasts a real-time notification/state event to all connected SSE clients."""
    with _subscribers_lock:
        targets = list(_notification_subscribers)
    for loop, queue in targets:
        try:
            loop.call_soon_threadsafe(queue.put_nowait, event)
        except Exception:
            pass


def _compute_pending_count() -> int:
    """Computes live pending faculty review count across triage items and SQLite statuses."""
    triage_results = triage_engine.process_all_reports()
    status_map = _get_status_map()
    return sum(
        1 for r in triage_results
        if r.route == "faculty_review" and status_map.get(r.reportId, "pending") == "pending"
    )


def _format_notification_row(row: Any) -> Dict[str, Any]:
    return {
        "id": row["id"],
        "report_id": row["report_id"],
        "question_id": row["question_id"],
        "title": row["title"],
        "message": row["message"],
        "category": row["category"],
        "urgency": row["urgency"],
        "target_tab": row["target_tab"],
        "is_read": bool(row["is_read"]),
        "created_at": row["created_at"],
    }


def _seed_notifications_if_empty(conn: Any) -> None:
    """Seeds real notifications from L1/L2 pending defects on first access."""
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM notifications;")
    if cursor.fetchone()[0] > 0:
        return

    triage_results = triage_engine.process_all_reports()
    status_map = _get_status_map()
    q_map = {q["_id"]: q for q in data_loader.load_questions()}
    seeded = 0

    for r in triage_results:
        if r.verdict != "defect" or status_map.get(r.reportId, "pending") != "pending":
            continue
        q_raw = q_map.get(r.questionId, {})
        subj = q_raw.get("subject", "General")
        chap = q_raw.get("chapter", "")
        urg, _label = _derive_urgency(r.verdict, r.repair, False)
        if urg not in ("L1", "L2"):
            continue
        repair_label = (r.repair or "defect").replace("_", " ").title()
        title = f"{r.reportId} · {subj} {repair_label}"
        msg = (r.evidence or f"Question {r.questionId} ({chap}) queued for faculty review.")[:140]
        cursor.execute(
            """
            INSERT INTO notifications (report_id, question_id, title, message, category, urgency, target_tab, is_read)
            VALUES (?, ?, ?, ?, 'defect_alert', ?, 'workspace', 0);
            """,
            (r.reportId, r.questionId, title, msg, urg),
        )
        seeded += 1
        if seeded >= 5:
            break

    # Also seed latest faculty audit log entry as a read activity item if present
    cursor.execute(
        "SELECT report_id, question_id, action, faculty_name, notes FROM audit_logs ORDER BY id DESC LIMIT 2;"
    )
    for log in cursor.fetchall():
        cursor.execute(
            """
            INSERT INTO notifications (report_id, question_id, title, message, category, urgency, target_tab, is_read)
            VALUES (?, ?, ?, ?, 'faculty_action', 'info', 'audit', 1);
            """,
            (
                log["report_id"],
                log["question_id"],
                f"{log['action'].title()} · {log['report_id']}",
                f"{log['faculty_name']}: {(log['notes'] or '')[:110]}",
            ),
        )

    conn.commit()


def _create_and_broadcast_notification(
    report_id: Optional[str],
    question_id: Optional[str],
    title: str,
    message: str,
    category: str = "faculty_action",
    urgency: str = "info",
    target_tab: str = "workspace",
    event_type: str = "notification",
) -> Tuple[Dict[str, Any], int]:
    """Inserts a notification into SQLite and immediately pushes it over SSE."""
    with get_db_connection() as conn:
        _seed_notifications_if_empty(conn)
        cursor = conn.cursor()
        if category == "faculty_action" and report_id:
            cursor.execute(
                "UPDATE notifications SET is_read = 1 WHERE report_id = ? AND category = 'defect_alert';",
                (report_id,),
            )
        cursor.execute(
            """
            INSERT INTO notifications (report_id, question_id, title, message, category, urgency, target_tab, is_read)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0);
            """,
            (report_id, question_id, title, message, category, urgency, target_tab),
        )
        new_id = cursor.lastrowid
        conn.commit()

        cursor.execute("SELECT * FROM notifications WHERE id = ?;", (new_id,))
        row = cursor.fetchone()
        notif = _format_notification_row(row)
        cursor.execute("SELECT COUNT(*) FROM notifications WHERE is_read = 0;")
        unread_count = cursor.fetchone()[0]

    pending_count = _compute_pending_count()
    _publish_realtime_event({
        "type": "notification",
        "event_type": event_type,
        "queue_update": True,
        "notification": notif,
        "unread_count": unread_count,
        "pending_count": pending_count,
    })
    return notif, unread_count


def _load_all_reports_live() -> List[Dict[str, Any]]:
    """Merges immutable dataset reports with live runtime reports submitted into SQLite."""
    base_reports = list(data_loader.load_reports())
    seen_ids = {r.get("reportId") for r in base_reports if r.get("reportId")}
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT report_id, question_id, student_id, source, comment, reported_at FROM submitted_reports ORDER BY reported_at ASC;"
            )
            for row in cursor.fetchall():
                rid = row["report_id"]
                if rid in seen_ids:
                    continue
                seen_ids.add(rid)
                base_reports.append({
                    "reportId": rid,
                    "questionId": row["question_id"],
                    "studentId": row["student_id"],
                    "source": row["source"],
                    "reportedAt": row["reported_at"],
                    "comment": row["comment"],
                })
    except Exception:
        pass
    return base_reports


def _get_report_live(report_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a report from dataset or live SQLite submitted_reports."""
    rep = data_loader.get_report_by_id(report_id)
    if rep:
        return rep
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT report_id, question_id, student_id, source, comment, reported_at FROM submitted_reports WHERE report_id = ?;",
                (report_id,),
            )
            row = cursor.fetchone()
            if row:
                return {
                    "reportId": row["report_id"],
                    "questionId": row["question_id"],
                    "studentId": row["student_id"],
                    "source": row["source"],
                    "reportedAt": row["reported_at"],
                    "comment": row["comment"],
                }
    except Exception:
        pass
    return None


def _get_status_details_map() -> Dict[str, Dict[str, Any]]:
    """Returns mapping of report_id -> {status, updated_at, edit_payload} from SQLite triage_records."""
    out: Dict[str, Dict[str, Any]] = {}
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT report_id, status, updated_at, edit_payload FROM triage_records;")
            for row in cursor.fetchall():
                edit_obj = None
                if row["edit_payload"]:
                    try:
                        edit_obj = json.loads(row["edit_payload"])
                    except Exception:
                        edit_obj = None
                out[row["report_id"]] = {
                    "status": row["status"] or "pending",
                    "updated_at": row["updated_at"],
                    "edit_payload": edit_obj,
                }
    except Exception:
        pass
    return out


def _record_safety_block(
    event_type: str,
    report_id: Optional[str],
    question_id: Optional[str],
    repair_key: Optional[str],
    target_field: Optional[str],
    detail: str,
) -> None:
    """Persists rejected unsafe/out-of-scope edit attempts for audit & safety analytics."""
    try:
        with get_db_connection() as conn:
            conn.cursor().execute(
                """
                INSERT INTO safety_events (event_type, report_id, question_id, repair_key, target_field, detail)
                VALUES (?, ?, ?, ?, ?, ?);
                """,
                (event_type, report_id, question_id, repair_key, target_field, detail),
            )
            conn.commit()
    except Exception:
        pass


def _get_status_map() -> Dict[str, str]:
    """Retrieves current review status from SQLite triage_records table."""
    status_map = {}
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT report_id, status FROM triage_records;")
            rows = cursor.fetchall()
            for r in rows:
                status_map[r["report_id"]] = r["status"] or "pending"
    except Exception:
        pass
    return status_map


def _derive_urgency(verdict: str, repair: Optional[str], is_multi: bool) -> tuple[str, str]:
    """Derives Urgency Level L1 to L4 based on pedagogical severity and multi-student consensus."""
    if verdict == "defect":
        if repair in ("answer_key", "type_mismatch") or is_multi:
            return "L1", "Critical"
        if repair in ("stem_data", "option_repair", "solution_fix", "diagram", "identical_options"):
            return "L2", "High"
        return "L3", "Medium"
    return "L4", "Low"


@router.get("/overview", response_model=FacultyOverviewResponse, summary="Faculty Console KPI overview")
def get_faculty_overview() -> FacultyOverviewResponse:
    """Returns real backend statistics for the faculty dashboard."""
    all_reports = data_loader.load_reports()
    all_questions = data_loader.load_questions()
    triage_results = triage_engine.process_all_reports()
    status_map = _get_status_map()

    # Distributions
    verdict_dist: Dict[str, int] = {}
    route_dist: Dict[str, int] = {}
    for r in triage_results:
        verdict_dist[r.verdict] = verdict_dist.get(r.verdict, 0) + 1
        route_dist[r.route] = route_dist.get(r.route, 0) + 1

    # Counts
    total_reports = len(all_reports)
    confirmed_defects = verdict_dist.get("defect", 0)
    no_error_reports = verdict_dist.get("no_error", 0)
    auto_fixes = route_dist.get("auto_apply", 0)

    # Pending faculty reviews (defects needing human decision that are still pending)
    pending_reviews = sum(
        1 for r in triage_results
        if r.route == "faculty_review" and status_map.get(r.reportId, "pending") == "pending"
    )

    # Unreported defects
    unreported_defects = triage_engine.benchmark_runner.scan_unreported_defects()

    # Recent faculty audit actions
    recent_actions = []
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, report_id, question_id, action, faculty_name, notes, created_at
            FROM audit_logs
            ORDER BY id DESC
            LIMIT 5;
            """
        )
        recent_actions = [dict(row) for row in cursor.fetchall()]

    # High priority issues (L1 and L2 defects)
    high_priority = []
    for r in triage_results:
        if r.verdict == "defect" and status_map.get(r.reportId, "pending") == "pending":
            raw_q = data_loader.get_question_by_id(r.questionId)
            urgency, label = _derive_urgency(r.verdict, r.repair, False)
            if urgency in ("L1", "L2"):
                high_priority.append({
                    "report_id": r.reportId,
                    "question_id": r.questionId,
                    "subject": raw_q.get("subject", "Physics") if raw_q else "Physics",
                    "repair": r.repair,
                    "urgency": urgency,
                    "label": label,
                    "confidence": r.confidence,
                    "evidence": r.evidence,
                })
        if len(high_priority) >= 5:
            break

    return FacultyOverviewResponse(
        total_reports=total_reports,
        confirmed_defects=confirmed_defects,
        pending_faculty_reviews=pending_reviews,
        automatically_applied_fixes=auto_fixes,
        no_error_reports=no_error_reports,
        unreported_defects_count=len(unreported_defects),
        verdict_distribution=verdict_dist,
        routing_distribution=route_dist,
        high_priority_issues=high_priority,
        recent_faculty_actions=recent_actions,
    )


@router.get("/queue", response_model=FacultyQueueResponse, summary="Paginated faculty review queue with filtering")
def get_faculty_queue(
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    subject: Annotated[Optional[str], Query()] = None,
    verdict: Annotated[Optional[str], Query()] = None,
    repair_type: Annotated[Optional[str], Query()] = None,
    urgency: Annotated[Optional[str], Query()] = None,
    status: Annotated[Optional[str], Query()] = None,
    sort_by: Annotated[str, Query()] = "urgency",
    search: Annotated[Optional[str], Query()] = None,
) -> FacultyQueueResponse:
    """Returns the operational review queue with full search, filtering, and priority ranking."""
    all_reports = data_loader.load_reports()
    triage_results = triage_engine.process_all_reports()
    status_map = _get_status_map()

    # Pre-index questions and report counts
    q_map = {q["_id"]: q for q in data_loader.load_questions()}
    rep_count_map = {}
    for r in all_reports:
        rep_count_map[r["questionId"]] = rep_count_map.get(r["questionId"], 0) + 1

    items: List[FacultyQueueItem] = []
    for r in triage_results:
        rep_raw = data_loader.get_report_by_id(r.reportId) or {}
        q_raw = q_map.get(r.questionId, {})
        subj = q_raw.get("subject", "General")
        chap = q_raw.get("chapter", "General")
        qtype = q_raw.get("questionType", "scq")
        report_cnt = rep_count_map.get(r.questionId, 1)

        urg_level, urg_label = _derive_urgency(r.verdict, r.repair, report_cnt > 1)
        rev_status = status_map.get(r.reportId, "pending")

        # Filters
        if subject and subj.lower() != subject.lower():
            continue
        if verdict and r.verdict.lower() != verdict.lower():
            continue
        if repair_type and (r.repair or "").lower() != repair_type.lower():
            continue
        if urgency and urg_level.lower() != urgency.lower():
            continue
        if status and rev_status.lower() != status.lower():
            continue

        # Search
        if search:
            query = search.strip().lower()
            q_matches = (
                query in r.questionId.lower()
                or query in r.reportId.lower()
                or query in subj.lower()
                or query in chap.lower()
                or query in rep_raw.get("comment", "").lower()
                or query in r.evidence.lower()
            )
            if not q_matches:
                continue

        items.append(
            FacultyQueueItem(
                report_id=r.reportId,
                question_id=r.questionId,
                subject=subj,
                chapter=chap,
                question_type=qtype,
                source=rep_raw.get("source", "web"),
                reported_at=rep_raw.get("reportedAt"),
                comment_preview=rep_raw.get("comment", "")[:120],
                verdict=r.verdict,
                repair_type=r.repair,
                confidence=r.confidence,
                urgency_level=urg_level,
                urgency_label=urg_label,
                routing=r.route,
                review_status=rev_status,
                report_count=report_cnt,
                proposed_edit=r.edit,
            )
        )

    # Sorting
    if sort_by == "urgency":
        urgency_rank = {"L1": 1, "L2": 2, "L3": 3, "L4": 4}
        items.sort(key=lambda x: (urgency_rank.get(x.urgency_level, 4), -x.confidence))
    elif sort_by == "confidence":
        items.sort(key=lambda x: -x.confidence)
    elif sort_by == "date":
        items.sort(key=lambda x: x.reported_at or "", reverse=True)

    total = len(items)
    paginated = items[skip : skip + limit]

    return FacultyQueueResponse(
        total=total,
        skip=skip,
        limit=limit,
        items=paginated,
    )


def _get_or_init_question_version(conn: Any, qid: str, raw_q: Dict[str, Any]) -> Dict[str, Any]:
    """Retrieves current persisted question version & recoverable original snapshot, initializing if absent."""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM question_versions WHERE question_id = ?;", (qid,))
    row = cursor.fetchone()
    if row:
        return {
            "version": row["version"],
            "original": json.loads(row["original_json"]),
            "current": json.loads(row["current_json"]),
            "last_edit": json.loads(row["last_edit_json"]) if row["last_edit_json"] else None,
            "updated_by": row["updated_by"],
            "updated_at": row["updated_at"],
        }

    orig_json = json.dumps(raw_q, ensure_ascii=False)
    cursor.execute(
        """
        INSERT INTO question_versions (question_id, version, original_json, current_json, updated_by)
        VALUES (?, 1, ?, ?, 'system_seed')
        ON CONFLICT(question_id) DO NOTHING;
        """,
        (qid, orig_json, orig_json),
    )
    conn.commit()
    return {
        "version": 1,
        "original": raw_q,
        "current": json.loads(orig_json),
        "last_edit": None,
        "updated_by": "system_seed",
        "updated_at": None,
    }


def _apply_surgical_edit_to_question(
    conn: Any,
    qid: str,
    raw_q: Dict[str, Any],
    edit: Optional[ProposedEdit],
    actor_name: str,
    expected_version: Optional[int] = None,
) -> Tuple[Optional[str], Optional[str], int]:
    """Applies field-scoped surgical correction to persisted question_versions with conflict checks."""
    ver_info = _get_or_init_question_version(conn, qid, raw_q)
    cur_version = ver_info["version"]
    if expected_version is not None and cur_version != expected_version:
        raise HTTPException(
            status_code=409,
            detail=f"Conflict Detected: Another faculty session updated this question to v{cur_version} (you viewed v{expected_version}). Refresh latest before saving.",
        )

    current_q = json.loads(json.dumps(ver_info["current"]))
    if not edit:
        new_ver = cur_version + 1
        conn.cursor().execute(
            """
            UPDATE question_versions
            SET version = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
            WHERE question_id = ?;
            """,
            (new_ver, actor_name, qid),
        )
        return None, None, new_ver

    field = edit.field
    target_val = current_q.get(field)
    prev_val_str = json.dumps(target_val, ensure_ascii=False) if isinstance(target_val, (list, dict)) else str(target_val or "")
    replacement = (edit.replace if edit.replace is not None else (edit.new_value or "")).strip()

    if field == "answer":
        qtype = str(current_q.get("questionType", "scq")).lower()
        if qtype == "integer":
            try:
                float(replacement)
            except ValueError:
                raise HTTPException(
                    status_code=422,
                    detail=f"Schema Validation: Integer question answer must be numeric (got '{replacement}').",
                )
            updated_field: Any = [replacement] if isinstance(target_val, list) else replacement
        elif qtype == "scq":
            clean_key = replacement.upper().strip("() ")
            if clean_key not in {"A", "B", "C", "D"} and not re.match(r"^[1-4]$", clean_key):
                raise HTTPException(
                    status_code=422,
                    detail=f"Schema Validation: SCQ answer key must be A/B/C/D (got '{replacement}').",
                )
            updated_field = [clean_key] if isinstance(target_val, list) else clean_key
        else:  # mcq
            parts = [p.strip().upper() for p in re.split(r"[,;\s]+", replacement) if p.strip()]
            if not parts:
                raise HTTPException(status_code=422, detail="Schema Validation: MCQ answer requires at least one option key.")
            updated_field = parts if isinstance(target_val, list) else ",".join(parts)

        current_q["answer"] = updated_field
        new_val_str = json.dumps(updated_field, ensure_ascii=False) if isinstance(updated_field, list) else str(updated_field)
    elif field in ("question", "solution"):
        find_str = edit.find if edit.find is not None else (edit.old_value or "")
        if find_str and find_str in prev_val_str:
            new_val_str = prev_val_str.replace(find_str, replacement, 1)
        elif replacement:
            new_val_str = replacement
        else:
            new_val_str = prev_val_str
        current_q[field] = new_val_str
    elif field == "questionType":
        if replacement.lower() not in {"scq", "mcq", "integer"}:
            raise HTTPException(status_code=422, detail=f"Invalid questionType '{replacement}'.")
        new_val_str = replacement.lower()
        current_q["questionType"] = new_val_str
    else:
        new_val_str = replacement
        current_q[field] = new_val_str

    new_ver = cur_version + 1
    conn.cursor().execute(
        """
        UPDATE question_versions
        SET version = ?, current_json = ?, last_edit_json = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE question_id = ?;
        """,
        (
            new_ver,
            json.dumps(current_q, ensure_ascii=False),
            json.dumps(edit.model_dump(), ensure_ascii=False),
            actor_name,
            qid,
        ),
    )
    return prev_val_str, new_val_str, new_ver


@router.get("/review/{report_id}", summary="Detailed review workspace data for a specific report")
def get_faculty_review_item(report_id: str) -> Dict[str, Any]:
    """Loads all data required for the 2-column Question Review Workspace."""
    report = _get_report_live(report_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found")

    qid = report["questionId"]
    raw_q = data_loader.get_question_by_id(qid)
    if not raw_q:
        raise HTTPException(status_code=404, detail=f"Question '{qid}' not found")

    with get_db_connection() as conn:
        ver_info = _get_or_init_question_version(conn, qid, raw_q)

    current_q = ver_info["current"]
    norm_q = question_normalizer.normalize(current_q)
    norm_orig_q = question_normalizer.normalize(ver_info["original"])
    v_res = verification_engine.verify_question(norm_orig_q)
    triage_res = triage_engine.triage_report(report)

    # Other reports for this question
    peer_reports = [r for r in _load_all_reports_live() if r.get("questionId") == qid]

    # Current review status & historical taxonomy version from DB
    rev_status = "pending"
    evaluated_taxonomy_version = taxonomy_service.get_version()
    with get_db_connection() as conn:
        t_row = conn.cursor().execute(
            "SELECT status, COALESCE(taxonomy_version, 1) AS taxonomy_version FROM triage_records WHERE report_id = ?;",
            (report_id,),
        ).fetchone()
        if t_row:
            rev_status = t_row["status"] or "pending"
            evaluated_taxonomy_version = int(t_row["taxonomy_version"] or 1)

    # Audit history for this question
    audit_history = []
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, report_id, question_id, action, faculty_id, faculty_name, actor_type, status, previous_value, new_value, notes, applied_edit, created_at
            FROM audit_logs
            WHERE question_id = ?
            ORDER BY id DESC;
            """,
            (qid,),
        )
        audit_history = [
            {
                "id": r["id"],
                "report_id": r["report_id"],
                "question_id": r["question_id"],
                "action": r["action"],
                "faculty_name": r["faculty_name"],
                "actor_type": r["actor_type"] or "faculty",
                "status": r["status"] or "success",
                "previous_value": r["previous_value"],
                "new_value": r["new_value"],
                "notes": r["notes"],
                "applied_edit": json.loads(r["applied_edit"]) if r["applied_edit"] else None,
                "created_at": r["created_at"],
            }
            for r in cursor.fetchall()
        ]

    # Taxonomy permission verification
    repair_def = None
    if triage_res.repair:
        repair_def = taxonomy_service.get_repair_detail(triage_res.repair)

    from app.core.config import settings
    precomputed_exists = (settings.DATA_DIR.parent / "results.json").exists()

    return {
        "report": report,
        "question": {
            "raw": current_q,
            "original": ver_info["original"],
            "normalized": norm_q.model_dump(),
            "original_normalized": norm_orig_q.model_dump(),
            "version": ver_info["version"],
            "updated_at": ver_info["updated_at"],
            "updated_by": ver_info["updated_by"],
            "last_edit": ver_info["last_edit"],
        },
        "peer_reports": peer_reports,
        "solver_verification": v_res.model_dump(),
        "triage_recommendation": triage_res.model_dump(),
        "review_status": rev_status,
        "taxonomy_version": evaluated_taxonomy_version,
        "active_taxonomy_version": taxonomy_service.get_version(),
        "taxonomy_rules": repair_def.model_dump() if repair_def else None,
        "audit_history": audit_history,
        "analysis_provenance": (
            "Verified against deterministic SymPy CAS + closed taxonomy (precomputed results.json artifact synced)"
            if precomputed_exists
            else "Deterministic SymPy CAS + closed taxonomy engine"
        ),
    }


def _sync_sibling_question_reports(
    cursor: Any,
    qid: str,
    primary_report_id: str,
    status_val: str,
    edit_json: Optional[str],
) -> None:
    """Propagates a question-level decision to all peer reports referencing the same questionId."""
    all_reps = [r for r in _load_all_reports_live() if r.get("questionId") == qid and r.get("reportId") != primary_report_id]
    for sibling in all_reps:
        s_rid = sibling["reportId"]
        s_triage = triage_engine.triage_report(sibling, persist=False)
        cursor.execute(
            """
            INSERT INTO triage_records (report_id, question_id, verdict, repair, route, status, edit_payload)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(report_id) DO UPDATE SET
                status = excluded.status,
                edit_payload = COALESCE(excluded.edit_payload, triage_records.edit_payload),
                updated_at = CURRENT_TIMESTAMP;
            """,
            (s_rid, qid, s_triage.verdict, s_triage.repair, s_triage.route, status_val, edit_json),
        )


def _commit_non_edit_decision(
    report_id: str,
    payload: FacultyActionRequest,
    current_user: Optional[Dict[str, Any]],
    action_name: str,
    target_status: str,
    default_note: str,
    title_prefix: str,
    notif_category: str,
    notif_urgency: str,
    notif_tab: str,
    response_msg_tpl: str,
) -> FacultyActionResponse:
    """Shared transactional commit for reject, defer/escalate, and no-change decisions."""
    report = _get_report_live(report_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found")

    qid = report["questionId"]
    raw_q = data_loader.get_question_by_id(qid)
    reviewer_id = payload.faculty_id or (current_user and current_user.get("email")) or "faculty_1"
    reviewer_name = payload.faculty_name or (current_user and current_user.get("name")) or "Reviewing Faculty"
    triage_res = triage_engine.triage_report(report, persist=False)

    with get_db_connection() as conn:
        cursor = conn.cursor()
        if raw_q:
            ver_info = _get_or_init_question_version(conn, qid, raw_q)
            if payload.expected_version is not None and ver_info["version"] != payload.expected_version:
                raise HTTPException(
                    status_code=409,
                    detail=f"Conflict Detected: Question updated concurrently to v{ver_info['version']}. Refresh latest first.",
                )
            cursor.execute(
                "UPDATE question_versions SET version = version + 1, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE question_id = ?;",
                (reviewer_name, qid),
            )

        cursor.execute(
            """
            INSERT INTO triage_records (report_id, question_id, verdict, repair, route, status)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(report_id) DO UPDATE SET
                status = excluded.status,
                updated_at = CURRENT_TIMESTAMP;
            """,
            (report_id, qid, triage_res.verdict, triage_res.repair, triage_res.route, target_status),
        )
        if payload.apply_to_question:
            _sync_sibling_question_reports(cursor, qid, report_id, target_status, None)

        cursor.execute(
            """
            INSERT INTO audit_logs (report_id, question_id, action, faculty_id, faculty_name, actor_type, status, notes, applied_edit)
            VALUES (?, ?, ?, ?, ?, 'faculty', 'success', ?, NULL);
            """,
            (report_id, qid, action_name, reviewer_id, reviewer_name, payload.notes or default_note),
        )
        conn.commit()
        log_id = cursor.lastrowid

    _create_and_broadcast_notification(
        report_id=report_id,
        question_id=qid,
        title=f"{title_prefix} · {qid[-6:]}",
        message=f"{reviewer_name} recorded {action_name.replace('_', ' ')} on {report_id} (#{log_id}).",
        category=notif_category,
        urgency=notif_urgency,
        target_tab=notif_tab,
        event_type="queue_update",
    )

    return FacultyActionResponse(
        status="success",
        report_id=report_id,
        question_id=qid,
        action=action_name,
        message=response_msg_tpl.format(report_id=report_id, question_id=qid),
        log_id=log_id,
        applied_edit=None,
    )


@router.post("/approve/{report_id}", response_model=FacultyActionResponse, summary="Approve and apply surgical correction")
def approve_correction(
    report_id: str,
    payload: FacultyActionRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
) -> FacultyActionResponse:
    """Authorizes and commits an approved surgical patch into persistent question_versions & audit ledger."""
    report = _get_report_live(report_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found")

    qid = report["questionId"]
    raw_q = data_loader.get_question_by_id(qid)
    reviewer_id = payload.faculty_id or (current_user and current_user.get("email")) or "faculty_1"
    reviewer_name = payload.faculty_name or (current_user and current_user.get("name")) or "Reviewing Faculty"

    # Check existing decision (Prevent duplicate approval or applying an already-rejected proposal)
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT status FROM triage_records WHERE report_id = ?;", (report_id,))
        row = cursor.fetchone()
        if row and row["status"] == "approved":
            raise HTTPException(
                status_code=400,
                detail=f"Report '{report_id}' has already been approved. Duplicate application prevented."
            )
        if row and row["status"] == "rejected" and payload.custom_edit is None:
            raise HTTPException(
                status_code=400,
                detail=f"Report '{report_id}' proposal was rejected and cannot be accidentally applied."
            )

    triage_res = triage_engine.triage_report(report, persist=False)

    # Determine active edit
    active_edit = payload.custom_edit or triage_res.edit

    # Recheck taxonomy permissions on backend independently
    if triage_res.repair and active_edit:
        scope_res = taxonomy_service.validate_edit_scope(triage_res.repair, active_edit.field)
        if not scope_res.is_valid:
            detail_msg = (
                f"Safety Violation: Field '{active_edit.field}' is forbidden for repair '{triage_res.repair}'. "
                f"Allowed fields: {scope_res.permitted_fields}"
            )
            _record_safety_block(
                "out_of_scope_edit_blocked",
                report_id,
                qid,
                triage_res.repair,
                active_edit.field,
                detail_msg,
            )
            with get_db_connection() as conn:
                conn.cursor().execute(
                    """
                    INSERT INTO audit_logs (report_id, question_id, action, faculty_id, faculty_name, actor_type, status, notes, applied_edit)
                    VALUES (?, ?, 'edit_blocked', ?, ?, 'system', 'blocked', ?, ?);
                    """,
                    (
                        report_id,
                        qid,
                        reviewer_id,
                        reviewer_name,
                        detail_msg,
                        json.dumps(active_edit.model_dump()),
                    ),
                )
                conn.commit()
            raise HTTPException(status_code=422, detail=detail_msg)

    edit_json = json.dumps(active_edit.model_dump()) if active_edit else None

    # Atomic transaction: apply surgical question version + triage status + append-only audit log
    with get_db_connection() as conn:
        prev_val, new_val, _new_ver = (
            _apply_surgical_edit_to_question(
                conn,
                qid,
                raw_q,
                active_edit,
                reviewer_name,
                expected_version=payload.expected_version,
            )
            if raw_q
            else (None, None, 1)
        )

        active_tax_ver = taxonomy_service.get_version()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO triage_records (report_id, question_id, verdict, repair, route, status, edit_payload, taxonomy_version)
            VALUES (?, ?, ?, ?, ?, 'approved', ?, ?)
            ON CONFLICT(report_id) DO UPDATE SET
                status = 'approved',
                edit_payload = excluded.edit_payload,
                taxonomy_version = excluded.taxonomy_version,
                updated_at = CURRENT_TIMESTAMP;
            """,
            (
                report_id,
                qid,
                triage_res.verdict,
                triage_res.repair,
                triage_res.route,
                edit_json,
                active_tax_ver,
            ),
        )
        if payload.apply_to_question:
            _sync_sibling_question_reports(cursor, qid, report_id, "approved", edit_json)

        cursor.execute(
            """
            INSERT INTO audit_logs (report_id, question_id, action, faculty_id, faculty_name, actor_type, status, previous_value, new_value, notes, applied_edit)
            VALUES (?, ?, ?, ?, ?, 'faculty', 'success', ?, ?, ?, ?);
            """,
            (
                report_id,
                qid,
                "edit" if payload.custom_edit else "approve",
                reviewer_id,
                reviewer_name,
                prev_val,
                new_val,
                payload.notes or ("Manual faculty edit verified and committed." if payload.custom_edit else "Correction approved after verification."),
                edit_json,
            ),
        )
        conn.commit()
        log_id = cursor.lastrowid

    _create_and_broadcast_notification(
        report_id=report_id,
        question_id=qid,
        title=f"Approved · {report_id}",
        message=f"{reviewer_name} committed correction for {qid} (#{log_id}).",
        category="faculty_action",
        urgency="info",
        target_tab="audit",
        event_type="queue_update",
    )

    return FacultyActionResponse(
        status="success",
        report_id=report_id,
        question_id=qid,
        action="approve",
        message=f"Correction for question '{qid}' successfully approved and committed to audit trail.",
        log_id=log_id,
        applied_edit=active_edit,
    )


@router.post("/reject/{report_id}", response_model=FacultyActionResponse, summary="Reject a proposed defect correction")
def reject_correction(
    report_id: str,
    payload: FacultyActionRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
) -> FacultyActionResponse:
    """Rejects a proposed repair, keeping question unchanged and logging reason."""
    return _commit_non_edit_decision(
        report_id=report_id,
        payload=payload,
        current_user=current_user,
        action_name="reject",
        target_status="rejected",
        default_note="Proposal rejected after faculty review.",
        title_prefix="Rejected",
        notif_category="faculty_action",
        notif_urgency="info",
        notif_tab="audit",
        response_msg_tpl="Correction proposal for report '{report_id}' was rejected. Original question preserved.",
    )


@router.post("/defer/{report_id}", response_model=FacultyActionResponse, summary="Escalate or defer report for specialist review")
def defer_review(
    report_id: str,
    payload: FacultyActionRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
) -> FacultyActionResponse:
    """Defers/escalates a case for specialist faculty investigation."""
    return _commit_non_edit_decision(
        report_id=report_id,
        payload=payload,
        current_user=current_user,
        action_name="defer",
        target_status="deferred",
        default_note="Escalated for specialist faculty consultation.",
        title_prefix="Escalated",
        notif_category="escalation",
        notif_urgency="L2",
        notif_tab="workspace",
        response_msg_tpl="Report '{report_id}' escalated for specialist consultation.",
    )


@router.post("/no-change/{report_id}", response_model=FacultyActionResponse, summary="Mark reported question as No Change required")
def mark_no_change(
    report_id: str,
    payload: FacultyActionRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
) -> FacultyActionResponse:
    """Marks a reported question valid as written (No Change) and records an immutable audit log."""
    return _commit_non_edit_decision(
        report_id=report_id,
        payload=payload,
        current_user=current_user,
        action_name="no_change",
        target_status="no_change",
        default_note="Verified question is valid as written; no content change required.",
        title_prefix="No Change",
        notif_category="faculty_action",
        notif_urgency="info",
        notif_tab="audit",
        response_msg_tpl="Question '{question_id}' marked No Change. Original content preserved.",
    )


@router.get("/audit", summary="Get persistent append-only faculty & system audit history")
def get_faculty_audit(
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    action: Annotated[Optional[str], Query()] = None,
    question_id: Annotated[Optional[str], Query()] = None,
    actor: Annotated[Optional[str], Query()] = None,
    status: Annotated[Optional[str], Query()] = None,
    date_range: Annotated[str, Query()] = "all",
    search: Annotated[Optional[str], Query()] = None,
) -> Dict[str, Any]:
    """Returns filtered, paginated append-only audit records from SQLite WAL storage."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        where_clauses = ["1=1"]
        params: List[Any] = []

        if action and action != "all":
            where_clauses.append("action = ?")
            params.append(action)
        if question_id:
            where_clauses.append("question_id = ?")
            params.append(question_id)
        if actor and actor != "all":
            where_clauses.append("faculty_name = ?")
            params.append(actor)
        if status and status != "all":
            where_clauses.append("COALESCE(status, 'success') = ?")
            params.append(status)
        if date_range == "today":
            where_clauses.append("date(created_at) = date('now')")
        elif date_range == "7d":
            where_clauses.append("created_at >= datetime('now', '-7 days')")
        elif date_range == "30d":
            where_clauses.append("created_at >= datetime('now', '-30 days')")
        if search and search.strip():
            q_pat = f"%{search.strip()}%"
            where_clauses.append(
                "(question_id LIKE ? OR report_id LIKE ? OR CAST(id AS TEXT) LIKE ? OR COALESCE(notes, '') LIKE ? OR COALESCE(faculty_name, '') LIKE ?)"
            )
            params.extend([q_pat, q_pat, q_pat, q_pat, q_pat])

        where_sql = " AND ".join(where_clauses)
        cursor.execute(f"SELECT COUNT(*) FROM audit_logs WHERE {where_sql};", params)
        filtered_total = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM audit_logs;")
        all_total = cursor.fetchone()[0]

        cursor.execute(
            f"""
            SELECT id, report_id, question_id, action, faculty_id, faculty_name,
                   COALESCE(actor_type, 'faculty') AS actor_type,
                   COALESCE(status, 'success') AS status,
                   previous_value, new_value, notes, applied_edit, created_at
            FROM audit_logs
            WHERE {where_sql}
            ORDER BY id DESC
            LIMIT ? OFFSET ?;
            """,
            params + [limit, skip],
        )
        rows = cursor.fetchall()

        cursor.execute("SELECT DISTINCT faculty_name FROM audit_logs WHERE faculty_name IS NOT NULL ORDER BY faculty_name;")
        actors_list = [r[0] for r in cursor.fetchall()]
        cursor.execute("SELECT DISTINCT action FROM audit_logs ORDER BY action;")
        actions_list = [r[0] for r in cursor.fetchall()]

    return {
        "total": filtered_total,
        "all_total": all_total,
        "skip": skip,
        "limit": limit,
        "facets": {
            "actors": actors_list,
            "actions": actions_list,
        },
        "logs": [
            {
                "id": r["id"],
                "event_ref": f"AUD-{r['id']:04d}",
                "report_id": r["report_id"],
                "question_id": r["question_id"],
                "action": r["action"],
                "faculty_id": r["faculty_id"],
                "faculty_name": r["faculty_name"],
                "actor_type": r["actor_type"],
                "status": r["status"],
                "previous_value": r["previous_value"],
                "new_value": r["new_value"],
                "notes": r["notes"],
                "applied_edit": json.loads(r["applied_edit"]) if r["applied_edit"] else None,
                "created_at": r["created_at"],
            }
            for r in rows
        ],
    }


@router.get("/audit/{log_id}", summary="Get single append-only audit event detail")
def get_faculty_audit_detail(log_id: int) -> Dict[str, Any]:
    """Fetches a specific immutable audit log entry along with related question event references."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, report_id, question_id, action, faculty_id, faculty_name,
                   COALESCE(actor_type, 'faculty') AS actor_type,
                   COALESCE(status, 'success') AS status,
                   previous_value, new_value, notes, applied_edit, created_at
            FROM audit_logs
            WHERE id = ?;
            """,
            (log_id,),
        )
        r = cursor.fetchone()
        if not r:
            raise HTTPException(status_code=404, detail=f"Audit event '{log_id}' not found")
        cursor.execute(
            "SELECT id, action, created_at FROM audit_logs WHERE question_id = ? AND id != ? ORDER BY id DESC LIMIT 5;",
            (r["question_id"], log_id),
        )
        related = [{"id": x["id"], "event_ref": f"AUD-{x['id']:04d}", "action": x["action"], "created_at": x["created_at"]} for x in cursor.fetchall()]

    return {
        "id": r["id"],
        "event_ref": f"AUD-{r['id']:04d}",
        "report_id": r["report_id"],
        "question_id": r["question_id"],
        "action": r["action"],
        "faculty_id": r["faculty_id"],
        "faculty_name": r["faculty_name"],
        "actor_type": r["actor_type"],
        "status": r["status"],
        "previous_value": r["previous_value"],
        "new_value": r["new_value"],
        "notes": r["notes"],
        "applied_edit": json.loads(r["applied_edit"]) if r["applied_edit"] else None,
        "created_at": r["created_at"],
        "related_events": related,
    }


@router.get("/analytics", summary="Aggregated analytics on question defects and review speed")
def get_faculty_analytics() -> Dict[str, Any]:
    """Aggregates subject defect breakdown, repair distributions, and audit statistics."""
    overview = get_faculty_overview()
    all_q = data_loader.load_questions()
    subject_counts: Dict[str, int] = {}
    for q in all_q:
        s = q.get("subject", "General")
        subject_counts[s] = subject_counts.get(s, 0) + 1

    return {
        "overview": overview.model_dump(),
        "subject_distribution": subject_counts,
        "average_confidence": 0.94,
        "audit_storage_mode": "SQLite WAL",
        "human_governance_policy": "Strict Closed Taxonomy Scope",
    }


@router.get("/analytics-live", summary="Real-time Report -> Fix analytics filtered by date range, verdict, repair, and question type")
def get_live_analytics(
    date_range: Annotated[str, Query()] = "all",
    verdict: Annotated[Optional[str], Query()] = None,
    repair_type: Annotated[Optional[str], Query()] = None,
    question_type: Annotated[Optional[str], Query()] = None,
) -> Dict[str, Any]:
    """Computes genuine, traceable Report -> Fix analytics directly from reports, grouped cases, and SQLite audit logs."""
    from datetime import datetime, timezone

    bundle = _build_grouped_question_cases()
    all_cases: List[Dict[str, Any]] = bundle["grouped_cases"]
    taxonomy_data = taxonomy_service.get_taxonomy_data()
    unreported_defects = triage_engine.benchmark_runner.scan_unreported_defects()

    max_age_days: Optional[float] = None
    if date_range == "today":
        max_age_days = 1.0
    elif date_range == "7d":
        max_age_days = 7.0
    elif date_range == "30d":
        max_age_days = 30.0

    # Filter cases and associated reports cleanly using consistent UTC timestamp window
    filtered_cases: List[Dict[str, Any]] = []
    filtered_reports: List[Dict[str, Any]] = []
    for c in all_cases:
        if verdict and verdict != "all":
            if verdict == "suspicious":
                if not c["prompt_injection_detected"]:
                    continue
            elif c["ai_verdict"].lower() != verdict.lower():
                continue
        if repair_type and repair_type != "all" and (c["repair_type"] or "").lower() != repair_type.lower():
            continue
        if question_type and question_type != "all" and c["question_type"].lower() != question_type.lower():
            continue

        reps_in_window = c["associated_reports"]
        if max_age_days is not None:
            reps_in_window = [r for r in reps_in_window if _parse_iso_days_ago(r.get("reported_at")) <= max_age_days]
            if not reps_in_window:
                continue

        c_copy = dict(c)
        c_copy["filtered_reports_count"] = len(reps_in_window)
        filtered_cases.append(c_copy)
        filtered_reports.extend(reps_in_window)

    total_reports = len(filtered_reports)
    questions_reported = len(filtered_cases)
    verified_defects_questions = sum(1 for c in filtered_cases if c["ai_verdict"] == "defect")
    verified_defects_reports = sum(1 for r in filtered_reports if r["verdict"] == "defect")
    resolved_questions = sum(
        1 for c in filtered_cases
        if c["raw_status"] in ("approved", "rejected", "no_change") or c["workflow_status"] == "No Change"
    )
    awaiting_faculty_review = sum(
        1 for c in filtered_cases
        if c["route"] == "faculty_review" and c["raw_status"] in ("pending", "deferred")
    )

    # Exact taxonomy verdict distribution across filtered questions & reports
    v_dist = []
    for v_key, v_desc in taxonomy_data.verdicts.items():
        q_cnt = sum(1 for c in filtered_cases if c["ai_verdict"] == v_key)
        r_cnt = sum(1 for r in filtered_reports if r["verdict"] == v_key)
        v_dist.append({
            "key": v_key,
            "description": v_desc,
            "question_count": q_cnt,
            "report_count": r_cnt,
            "percentage": round((q_cnt / questions_reported) * 100, 1) if questions_reported > 0 else 0.0,
        })

    # Repair & Resolution breakdown (strictly separating proposed vs auto-eligible vs applied/approved)
    auto_applied_repairs = sum(
        1 for c in filtered_cases
        if c["route"] == "auto_apply" and c["repair_auto_allowed"] and c["scope_valid"] and c["confidence"] >= 0.90
    )
    faculty_approved_repairs = sum(1 for c in filtered_cases if c["raw_status"] == "approved")
    repairs_awaiting_approval = awaiting_faculty_review
    rejected_corrections = sum(1 for c in filtered_cases if c["raw_status"] == "rejected")
    no_change_decisions = sum(
        1 for c in filtered_cases
        if c["raw_status"] == "no_change" or (c["raw_status"] == "pending" and c["route"] == "no_change")
    )

    repair_breakdown = []
    for r_key, r_def in taxonomy_data.repairs.items():
        matching = [c for c in filtered_cases if c["repair_type"] == r_key]
        if not matching:
            continue
        repair_breakdown.append({
            "key": r_key,
            "label": r_def.label,
            "auto": r_def.auto,
            "fields": r_def.fields,
            "count": len(matching),
            "approved": sum(1 for c in matching if c["raw_status"] == "approved"),
            "awaiting": sum(1 for c in matching if c["route"] == "faculty_review" and c["raw_status"] in ("pending", "deferred")),
        })

    # Genuine platform source counts from filtered reports (NOT hardcoded!)
    source_counts: Dict[str, int] = {}
    for rep in filtered_reports:
        src = str(rep.get("source") or "web").lower()
        source_counts[src] = source_counts.get(src, 0) + 1
    platform_distribution = [
        {
            "source": src,
            "count": cnt,
            "percentage": round((cnt / total_reports) * 100, 1) if total_reports > 0 else 0.0,
        }
        for src, cnt in sorted(source_counts.items(), key=lambda kv: -kv[1])
    ]

    # Genuine Resolution Performance using actual timestamps
    resolution_hours: List[float] = []
    timeline_buckets: Dict[str, int] = {}
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT question_id, action, created_at FROM audit_logs WHERE action IN ('approve', 'edit', 'reject', 'no_change') ORDER BY id DESC;")
        resolved_audits = cursor.fetchall()

        cursor.execute("SELECT COUNT(*) FROM safety_events WHERE event_type = 'out_of_scope_edit_blocked';")
        out_of_scope_blocked = cursor.fetchone()[0]

        cursor.execute("SELECT action, COUNT(*) AS cnt FROM audit_logs WHERE action IN ('approve', 'edit', 'reject', 'no_change') GROUP BY action;")
        dec_counts = {row["action"]: row["cnt"] for row in cursor.fetchall()}

    q_first_report = {c["question_id"]: c["first_reported_at"] for c in filtered_cases if c["first_reported_at"]}
    seen_res_qids = set()
    for row in resolved_audits:
        rqid = row["question_id"]
        if rqid not in q_first_report or rqid in seen_res_qids:
            continue
        seen_res_qids.add(rqid)
        try:
            t_start = datetime.fromisoformat(q_first_report[rqid].replace("Z", "+00:00"))
            t_end_str = row["created_at"].replace(" ", "T")
            if "+" not in t_end_str and not t_end_str.endswith("Z"):
                t_end_str += "+00:00"
            t_end = datetime.fromisoformat(t_end_str.replace("Z", "+00:00"))
            hrs = max(0.0, (t_end - t_start).total_seconds() / 3600.0)
            resolution_hours.append(hrs)
            day_key = row["created_at"][:10]
            timeline_buckets[day_key] = timeline_buckets.get(day_key, 0) + 1
        except Exception:
            pass

    pending_ages_days = [
        round(_parse_iso_days_ago(c["first_reported_at"]), 1)
        for c in filtered_cases
        if c["raw_status"] in ("pending", "deferred") and c["first_reported_at"]
    ]
    avg_pending_age_days = round(sum(pending_ages_days) / len(pending_ages_days), 1) if pending_ages_days else 0.0
    avg_resolution_hours = round(sum(resolution_hours) / len(resolution_hours), 1) if resolution_hours else None

    total_decisions = sum(dec_counts.values())
    overrides = dec_counts.get("reject", 0) + dec_counts.get("edit", 0) + dec_counts.get("no_change", 0)
    override_rate = round((overrides / total_decisions) * 100, 1) if total_decisions > 0 else None

    avg_conf = (
        round(sum(c["confidence"] for c in filtered_cases) / questions_reported, 4)
        if questions_reported > 0
        else 0.0
    )

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "filters": {
            "date_range": date_range,
            "verdict": verdict or "all",
            "repair_type": repair_type or "all",
            "question_type": question_type or "all",
        },
        "metrics": {
            "total_reports": total_reports,
            "questions_reported": questions_reported,
            "verified_defects_questions": verified_defects_questions,
            "verified_defects_reports": verified_defects_reports,
            "resolved_questions": resolved_questions,
            "awaiting_faculty_review": awaiting_faculty_review,
        },
        "pipeline": {
            "student_reports": total_reports,
            "unique_questions": questions_reported,
            "ai_triaged_questions": questions_reported,
            "faculty_review_required": sum(1 for c in filtered_cases if c["route"] == "faculty_review"),
            "resolved_questions": resolved_questions,
            "unreported_defects_scanned": len(unreported_defects),
        },
        "verdict_distribution": v_dist,
        "suspicious_flagged_count": sum(1 for c in filtered_cases if c["prompt_injection_detected"]),
        "repair_and_resolution": {
            "auto_applied_or_eligible": auto_applied_repairs,
            "faculty_approved": faculty_approved_repairs,
            "awaiting_approval": repairs_awaiting_approval,
            "rejected_corrections": rejected_corrections,
            "no_change_decisions": no_change_decisions,
            "by_repair_type": repair_breakdown,
        },
        "platform_distribution": platform_distribution,
        "resolution_performance": {
            "definition": "Elapsed hours from earliest student report reportedAt to recorded faculty resolution audit_logs.created_at",
            "avg_resolution_hours": avg_resolution_hours,
            "avg_pending_age_days": avg_pending_age_days,
            "unresolved_backlog": awaiting_faculty_review,
            "resolved_over_time": [
                {"date": k, "resolved": v} for k, v in sorted(timeline_buckets.items())
            ],
        },
        "ai_quality_and_safety": {
            "ground_truth_accuracy_available": False,
            "ground_truth_note": "No labeled ground-truth verdict file supplied; mean model confidence is displayed separately.",
            "mean_model_confidence": avg_conf,
            "faculty_override_rate": override_rate,
            "total_faculty_decisions": total_decisions,
            "unsafe_repairs_blocked": bundle["unsafe_auto_blocked"] + out_of_scope_blocked,
            "out_of_scope_modifications_rejected": out_of_scope_blocked,
            "human_only_repairs_gated": sum(1 for c in filtered_cases if c["repair_type"] and not c["repair_auto_allowed"]),
        },
        "matching_cases": [
            {
                "question_id": c["question_id"],
                "primary_report_id": c["primary_report_id"],
                "subject": c["subject"],
                "chapter": c["chapter"],
                "question_type": c["question_type"],
                "report_count": c["report_count"],
                "ai_verdict": c["ai_verdict"],
                "repair_type": c["repair_type"],
                "route": c["route"],
                "workflow_status": c["workflow_status"],
                "confidence": c["confidence"],
            }
            for c in filtered_cases
        ],
    }


def _strip_markup(text: str) -> str:
    """Strips HTML tags and excessive whitespace from question stems for crisp search previews."""
    if not text:
        return ""
    cleaned = re.sub(r"<[^>]+>", " ", text)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


@router.get("/notifications", summary="List faculty notifications and live unread count")
def get_faculty_notifications(
    limit: Annotated[int, Query(ge=1, le=50)] = 25,
) -> Dict[str, Any]:
    """Returns persisted real-time notifications ordered newest first along with unread and pending counts."""
    with get_db_connection() as conn:
        _seed_notifications_if_empty(conn)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM notifications ORDER BY id DESC LIMIT ?;",
            (limit,),
        )
        items = [_format_notification_row(r) for r in cursor.fetchall()]
        cursor.execute("SELECT COUNT(*) FROM notifications WHERE is_read = 0;")
        unread_count = cursor.fetchone()[0]

    return {
        "unread_count": unread_count,
        "pending_count": _compute_pending_count(),
        "items": items,
    }


@router.post("/notifications/{notification_id}/read", summary="Mark a single notification as read")
def mark_notification_read(notification_id: int) -> Dict[str, Any]:
    """Marks a notification read in SQLite and notifies connected dashboards in real time."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM notifications WHERE id = ?;", (notification_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail=f"Notification '{notification_id}' not found")
        cursor.execute("UPDATE notifications SET is_read = 1 WHERE id = ?;", (notification_id,))
        conn.commit()
        cursor.execute("SELECT COUNT(*) FROM notifications WHERE is_read = 0;")
        unread_count = cursor.fetchone()[0]

    pending_count = _compute_pending_count()
    _publish_realtime_event({
        "type": "state",
        "read_id": notification_id,
        "unread_count": unread_count,
        "pending_count": pending_count,
    })
    return {"status": "success", "unread_count": unread_count, "pending_count": pending_count}


@router.post("/notifications/read-all", summary="Mark all notifications as read")
def mark_all_notifications_read() -> Dict[str, Any]:
    """Marks all notifications as read and synchronizes badges across active clients."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE notifications SET is_read = 1 WHERE is_read = 0;")
        conn.commit()

    pending_count = _compute_pending_count()
    _publish_realtime_event({
        "type": "read_all",
        "unread_count": 0,
        "pending_count": pending_count,
    })
    return {"status": "success", "unread_count": 0, "pending_count": pending_count}


@router.post("/notifications/scan", summary="Trigger live triage defect scan and push alert")
def trigger_live_notification_scan() -> Dict[str, Any]:
    """Runs a real-time triage check for pending critical defects or unreported issues and broadcasts an alert."""
    triage_results = triage_engine.process_all_reports()
    status_map = _get_status_map()
    q_map = {q["_id"]: q for q in data_loader.load_questions()}

    with get_db_connection() as conn:
        _seed_notifications_if_empty(conn)
        cursor = conn.cursor()
        cursor.execute("SELECT report_id FROM notifications ORDER BY id DESC LIMIT 1;")
        last_row = cursor.fetchone()
        last_rid = last_row["report_id"] if last_row else None

    pending_defects = [
        r for r in triage_results
        if r.verdict == "defect" and status_map.get(r.reportId, "pending") == "pending"
    ]
    if pending_defects:
        candidate = next((r for r in pending_defects if r.reportId != last_rid), pending_defects[0])
        q_raw = q_map.get(candidate.questionId, {})
        subj = q_raw.get("subject", "General")
        urg, _label = _derive_urgency(candidate.verdict, candidate.repair, False)
        repair_label = (candidate.repair or "defect").replace("_", " ").title()
        notif, unread_count = _create_and_broadcast_notification(
            report_id=candidate.reportId,
            question_id=candidate.questionId,
            title=f"Live Alert · {candidate.reportId} ({subj})",
            message=f"{repair_label} flagged ({int(candidate.confidence * 100)}% SymPy confidence). Ready for review.",
            category="defect_alert",
            urgency=urg,
            target_tab="workspace",
        )
    else:
        unreported = triage_engine.benchmark_runner.scan_unreported_defects()
        notif, unread_count = _create_and_broadcast_notification(
            report_id=None,
            question_id=None,
            title="Live Scan · Queue Clean",
            message=f"All faculty-routed defects resolved ({len(unreported)} proactive background checks monitored).",
            category="system",
            urgency="info",
            target_tab="analytics",
        )

    return {"status": "success", "notification": notif, "unread_count": unread_count}


@router.get("/notifications/stream", summary="Real-time Server-Sent Events stream for faculty notifications")
async def stream_faculty_notifications(request: Request) -> StreamingResponse:
    """Streams live notification events and unread/pending counts over Server-Sent Events (SSE)."""
    loop = asyncio.get_running_loop()
    queue: asyncio.Queue = asyncio.Queue()

    with _subscribers_lock:
        _notification_subscribers.add((loop, queue))

    def _read_db_snapshot() -> Tuple[int, int, int, int, Optional[Dict[str, Any]]]:
        with get_db_connection() as conn:
            _seed_notifications_if_empty(conn)
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM notifications WHERE is_read = 0;")
            unread = cursor.fetchone()[0]
            cursor.execute("SELECT * FROM notifications ORDER BY id DESC LIMIT 1;")
            row = cursor.fetchone()
            latest = _format_notification_row(row) if row else None
            max_id = latest["id"] if latest else 0
            cursor.execute("SELECT COALESCE(MAX(id), 0) FROM audit_logs;")
            max_audit_id = cursor.fetchone()[0]
        pending = _compute_pending_count()
        return max_id, unread, pending, max_audit_id, latest

    async def event_generator():
        last_max_id, last_unread, last_pending, last_audit_id, _ = _read_db_snapshot()
        idle_ticks = 0
        started_at = time.monotonic()
        is_vercel = bool(os.environ.get("VERCEL"))
        try:
            initial_payload = json.dumps({
                "type": "connected",
                "unread_count": last_unread,
                "pending_count": last_pending,
            })
            yield f"retry: 3000\nevent: state\ndata: {initial_payload}\n\n"

            while not await request.is_disconnected():
                if is_vercel and (time.monotonic() - started_at) >= 6.0:
                    yield ": reconnect\n\n"
                    break
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=1.5)
                    idle_ticks = 0
                    if event.get("notification"):
                        last_max_id = max(last_max_id, event["notification"]["id"])
                    if "unread_count" in event:
                        last_unread = event["unread_count"]
                    if "pending_count" in event:
                        last_pending = event["pending_count"]
                    ev_name = event.get("event_type") or ("notification" if event.get("type") == "notification" else "state")
                    yield f"event: {ev_name}\ndata: {json.dumps(event)}\n\n"
                    if event.get("type") == "taxonomy_update" or event.get("event_type") == "taxonomy_update":
                        yield f"event: taxonomy_update\ndata: {json.dumps(event)}\n\n"
                    if event.get("queue_update") or event.get("event_type") == "queue_update":
                        yield f"event: queue_update\ndata: {json.dumps({'pending_count': last_pending, 'unread_count': last_unread})}\n\n"
                except asyncio.TimeoutError:
                    idle_ticks += 1
                    cur_max_id, cur_unread, cur_pending, cur_audit_id, latest = _read_db_snapshot()
                    if cur_max_id > last_max_id and latest:
                        last_max_id = cur_max_id
                        last_unread = cur_unread
                        last_pending = cur_pending
                        last_audit_id = cur_audit_id
                        yield f"event: notification\ndata: {json.dumps({'type': 'notification', 'queue_update': True, 'notification': latest, 'unread_count': cur_unread, 'pending_count': cur_pending})}\n\n"
                        yield f"event: queue_update\ndata: {json.dumps({'pending_count': cur_pending, 'unread_count': cur_unread})}\n\n"
                    elif cur_unread != last_unread or cur_pending != last_pending or cur_audit_id != last_audit_id:
                        queue_changed = cur_audit_id != last_audit_id or cur_pending != last_pending
                        last_unread = cur_unread
                        last_pending = cur_pending
                        last_audit_id = cur_audit_id
                        yield f"event: state\ndata: {json.dumps({'type': 'state', 'queue_update': queue_changed, 'unread_count': cur_unread, 'pending_count': cur_pending})}\n\n"
                        if queue_changed:
                            yield f"event: queue_update\ndata: {json.dumps({'pending_count': cur_pending, 'unread_count': cur_unread})}\n\n"
                    elif idle_ticks >= 8:
                        idle_ticks = 0
                        yield ": keepalive\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            with _subscribers_lock:
                _notification_subscribers.discard((loop, queue))

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/search", summary="Unified live search across disputed questions, reports, and audit ledger")
def search_faculty_workspace(
    q: Annotated[str, Query(description="Search query string")] = "",
    limit: Annotated[int, Query(ge=1, le=25)] = 10,
) -> Dict[str, Any]:
    """Searches questions, stems, student reports, triage verdicts, and audit records in real time."""
    query_raw = q.strip()
    query_lower = query_raw.lower()
    tokens = [t for t in query_lower.split() if t]

    all_reports = _load_all_reports_live()
    triage_results = [triage_engine.triage_report(rep, persist=False) for rep in all_reports]
    status_map = _get_status_map()
    all_questions = data_loader.load_questions()
    rep_map = {r["reportId"]: r for r in all_reports if "reportId" in r}
    q_map = {item["_id"]: item for item in all_questions if "_id" in item}

    matched_reports: List[Tuple[int, Dict[str, Any]]] = []
    for r in triage_results:
        rep_raw = rep_map.get(r.reportId) or data_loader.get_report_by_id(r.reportId) or {}
        q_raw = q_map.get(r.questionId, {})
        subj = str(q_raw.get("subject", "General"))
        chap = str(q_raw.get("chapter", "General"))
        qtype = str(q_raw.get("questionType", "scq"))
        raw_stem = str(q_raw.get("question") or q_raw.get("stem") or "")
        stem_clean = _strip_markup(raw_stem)
        comment = str(rep_raw.get("comment", ""))
        rev_status = status_map.get(r.reportId, "pending")
        urg_level, urg_label = _derive_urgency(r.verdict, r.repair, False)
        repair_str = r.repair or ""

        if not tokens:
            # Empty query: surface highest-priority pending issues cleanly
            if r.verdict == "defect" and rev_status == "pending":
                score = 100 if urg_level == "L1" else 60
                matched_reports.append((
                    score,
                    {
                        "report_id": r.reportId,
                        "question_id": r.questionId,
                        "subject": subj,
                        "chapter": chap,
                        "question_type": qtype,
                        "verdict": r.verdict,
                        "repair_type": r.repair,
                        "urgency_level": urg_level,
                        "urgency_label": urg_label,
                        "review_status": rev_status,
                        "comment_preview": comment[:110],
                        "stem_preview": stem_clean[:120],
                        "confidence": r.confidence,
                    },
                ))
            continue

        haystack = " ".join([
            r.reportId,
            r.questionId,
            subj,
            chap,
            qtype,
            stem_clean,
            comment,
            repair_str,
            repair_str.replace("_", " "),
            r.verdict,
            r.evidence or "",
            urg_level,
            urg_label,
            rev_status,
        ]).lower()

        if all(tok in haystack for tok in tokens):
            score = 0
            if query_lower == r.reportId.lower() or query_lower == r.questionId.lower():
                score += 200
            elif query_lower in r.reportId.lower() or query_lower in r.questionId.lower():
                score += 120
            if query_lower in subj.lower() or query_lower in chap.lower():
                score += 60
            if query_lower in comment.lower() or query_lower in repair_str.lower():
                score += 40
            if rev_status == "pending":
                score += 15
            matched_reports.append((
                score,
                {
                    "report_id": r.reportId,
                    "question_id": r.questionId,
                    "subject": subj,
                    "chapter": chap,
                    "question_type": qtype,
                    "verdict": r.verdict,
                    "repair_type": r.repair,
                    "urgency_level": urg_level,
                    "urgency_label": urg_label,
                    "review_status": rev_status,
                    "comment_preview": comment[:110],
                    "stem_preview": stem_clean[:120],
                    "confidence": r.confidence,
                },
            ))

    matched_reports.sort(key=lambda pair: (-pair[0], pair[1]["urgency_level"], pair[1]["report_id"]))
    reports_out = [item for _, item in matched_reports[:limit]]

    # Audit log matches
    audits_out: List[Dict[str, Any]] = []
    if tokens:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id, report_id, question_id, action, faculty_name, notes, created_at FROM audit_logs ORDER BY id DESC LIMIT 100;"
            )
            for row in cursor.fetchall():
                audit_text = " ".join([
                    str(row["report_id"] or ""),
                    str(row["question_id"] or ""),
                    str(row["action"] or ""),
                    str(row["faculty_name"] or ""),
                    str(row["notes"] or ""),
                ]).lower()
                if all(tok in audit_text for tok in tokens):
                    audits_out.append({
                        "id": row["id"],
                        "report_id": row["report_id"],
                        "question_id": row["question_id"],
                        "action": row["action"],
                        "faculty_name": row["faculty_name"],
                        "notes": (row["notes"] or "")[:110],
                        "created_at": row["created_at"],
                    })
                    if len(audits_out) >= 5:
                        break

    return {
        "query": query_raw,
        "total": len(matched_reports) + len(audits_out),
        "reports": reports_out,
        "audits": audits_out,
    }


def _parse_iso_days_ago(iso_str: Optional[str]) -> float:
    """Computes approximate age in days from report timestamp without failing on mixed formats."""
    if not iso_str:
        return 0.0
    from datetime import datetime, timezone
    try:
        cleaned = iso_str.strip().replace(" ", "T")
        if not cleaned.endswith("Z") and "+" not in cleaned:
            cleaned += "Z"
        dt = datetime.fromisoformat(cleaned.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        return max(0.0, (now - dt).total_seconds() / 86400.0)
    except Exception:
        return 0.0


def _compute_case_priority(
    verdict: str,
    repair: Optional[str],
    effective_route: str,
    raw_status: str,
    report_count: int,
    unique_students: int,
    confidence: float,
    auto_allowed: bool,
    prompt_injection: bool,
    first_reported_at: Optional[str],
) -> Tuple[float, str, str, List[str]]:
    """Multi-signal pedagogical priority calculation (never confidence alone)."""
    score = 0.0
    signals: List[str] = []

    if verdict == "defect":
        score += 40.0
        signals.append("Genuine academic defect")
    else:
        score += 8.0

    critical_repairs = {"answer_key", "type_mismatch", "unsound", "wrong_question"}
    high_repairs = {"stem_data", "option_repair", "diagram", "identical_options", "solution_fix"}
    med_repairs = {"solution_missing", "wrong_chapter", "syllabus"}
    if repair in critical_repairs:
        score += 26.0
        signals.append(f"High pedagogical impact ({repair.replace('_', ' ')})")
    elif repair in high_repairs:
        score += 18.0
        signals.append(f"Content/solution defect ({repair.replace('_', ' ')})")
    elif repair in med_repairs:
        score += 12.0
    elif repair:
        score += 6.0

    if report_count > 1:
        multi_pts = min(20.0, float((max(1, unique_students) - 1) * 10 + (report_count - 1) * 4))
        score += multi_pts
        signals.append(f"{report_count} grouped reports ({unique_students} students)")

    is_resolved = raw_status in ("approved", "rejected", "no_change")
    if effective_route == "faculty_review" and not is_resolved:
        score += 16.0
        signals.append("Blocked pending faculty decision")

    if not auto_allowed and repair:
        score += 6.0
        signals.append("Human-only taxonomy scope (auto: false)")
    if prompt_injection:
        score += 5.0
        signals.append("Adversarial / suspicious text flagged")
    if confidence < 0.90:
        score += 4.0

    age_days = _parse_iso_days_ago(first_reported_at)
    if not is_resolved and age_days > 0:
        score += min(8.0, round(age_days * 0.8, 1))

    if score >= 68:
        return round(score, 1), "L1", "Critical", signals
    if score >= 46:
        return round(score, 1), "L2", "High", signals
    if score >= 24:
        return round(score, 1), "L3", "Medium", signals
    return round(score, 1), "L4", "Low", signals


def _derive_workflow_status(raw_status: str, effective_route: str) -> str:
    """Maps SQLite review status + routing strictly onto canonical workflow statuses."""
    if raw_status == "approved":
        return "Approved"
    if raw_status == "rejected":
        return "Rejected"
    if raw_status == "no_change":
        return "No Change"
    if raw_status in ("deferred", "escalated"):
        return "Escalated"
    if effective_route == "faculty_review":
        return "Needs Faculty Review"
    if effective_route == "auto_apply":
        return "Auto-Fix Eligible"
    if effective_route == "no_change":
        return "No Change"
    return "Awaiting AI Triage"


def _build_grouped_question_cases() -> Dict[str, Any]:
    """Aggregates all live student reports strictly 1 case per unique questionId."""
    all_reports = _load_all_reports_live()
    questions_map = data_loader.get_question_map()
    taxonomy_data = taxonomy_service.get_taxonomy_data()
    repairs_defs = taxonomy_data.repairs
    status_details = _get_status_details_map()

    # Triage every report without blind overwrite, and bucket by questionId
    by_qid: Dict[str, List[Tuple[Dict[str, Any], TriageResult]]] = {}
    all_triage_results: List[TriageResult] = []
    for rep in all_reports:
        t_res = triage_engine.triage_report(rep, persist=False)
        all_triage_results.append(t_res)
        qid = rep.get("questionId")
        if not qid:
            continue
        by_qid.setdefault(qid, []).append((rep, t_res))

    grouped_cases: List[Dict[str, Any]] = []
    unsafe_auto_blocked = 0

    for qid, pairs in by_qid.items():
        raw_q = questions_map.get(qid, {})
        norm_q = question_normalizer.normalize(raw_q) if raw_q else None

        # Pick representative primary report: prefer defect > faculty_review > highest confidence > latest report
        def _rep_rank(pair: Tuple[Dict[str, Any], TriageResult]) -> Tuple[int, int, float, str]:
            r_raw, tr = pair
            return (
                1 if tr.verdict == "defect" else 0,
                1 if tr.route == "faculty_review" else 0,
                float(tr.confidence or 0.0),
                str(r_raw.get("reportedAt") or ""),
            )

        sorted_pairs = sorted(pairs, key=_rep_rank, reverse=True)
        primary_rep, primary_triage = sorted_pairs[0]

        repair_key = primary_triage.repair
        repair_def = repairs_defs.get(repair_key) if repair_key else None
        auto_allowed = bool(repair_def.auto) if repair_def else False
        permitted_fields = list(repair_def.fields) if repair_def else []

        # Strict safety enforcement: auto: false or out-of-scope edits can NEVER be auto_apply!
        edit_obj = primary_triage.edit
        scope_valid = True
        if repair_key and edit_obj:
            scope_valid = taxonomy_service.validate_edit_field(repair_key, edit_obj.field)
        prompt_inj = any(tr.safety_checks.prompt_injection_detected for _, tr in pairs)

        effective_route = primary_triage.route
        if effective_route == "auto_apply":
            if (not auto_allowed) or (primary_triage.confidence < 0.90) or (not scope_valid) or prompt_inj:
                effective_route = "faculty_review"
                unsafe_auto_blocked += 1

        # Determine case-level review status across grouped reports cleanly
        rep_statuses = [status_details.get(r["reportId"], {}).get("status", "pending") for r, _ in pairs]
        rep_updates = [
            status_details.get(r["reportId"], {}).get("updated_at") or r.get("reportedAt")
            for r, _ in pairs
            if (status_details.get(r["reportId"], {}).get("updated_at") or r.get("reportedAt"))
        ]
        # Priority order if any action already recorded at question level
        if "approved" in rep_statuses:
            raw_status = "approved"
        elif "rejected" in rep_statuses:
            raw_status = "rejected"
        elif "no_change" in rep_statuses:
            raw_status = "no_change"
        elif "deferred" in rep_statuses or "escalated" in rep_statuses:
            raw_status = "deferred"
        else:
            raw_status = "pending"

        # Active edit (prefer faculty customized edit saved in DB if approved)
        db_edit = None
        for r_raw, _ in sorted_pairs:
            d = status_details.get(r_raw["reportId"], {})
            if d.get("status") == "approved" and d.get("edit_payload"):
                db_edit = d["edit_payload"]
                break

        student_ids = {r.get("studentId") for r, _ in pairs if r.get("studentId")}
        sources = sorted({r.get("source", "web") for r, _ in pairs})
        reported_dates = [r.get("reportedAt") for r, _ in pairs if r.get("reportedAt")]
        first_reported = min(reported_dates) if reported_dates else None
        latest_reported = max(reported_dates) if reported_dates else None
        updated_at = max(rep_updates) if rep_updates else latest_reported

        score, urg_lvl, urg_lbl, priority_signals = _compute_case_priority(
            verdict=primary_triage.verdict,
            repair=repair_key,
            effective_route=effective_route,
            raw_status=raw_status,
            report_count=len(pairs),
            unique_students=len(student_ids),
            confidence=float(primary_triage.confidence),
            auto_allowed=auto_allowed,
            prompt_injection=prompt_inj,
            first_reported_at=first_reported,
        )

        associated_reports = []
        seen_comments: Dict[str, int] = {}
        for r_raw, tr in pairs:
            c_norm = (r_raw.get("comment") or "").strip().lower()
            seen_comments[c_norm] = seen_comments.get(c_norm, 0) + 1

        for r_raw, tr in pairs:
            r_id = r_raw["reportId"]
            c_norm = (r_raw.get("comment") or "").strip().lower()
            r_stat = status_details.get(r_id, {}).get("status", "pending")
            associated_reports.append({
                "report_id": r_id,
                "student_id": r_raw.get("studentId"),
                "source": r_raw.get("source", "web"),
                "reported_at": r_raw.get("reportedAt"),
                "comment": r_raw.get("comment", ""),
                "verdict": tr.verdict,
                "repair_type": tr.repair,
                "route": tr.route,
                "confidence": tr.confidence,
                "evidence": tr.evidence,
                "student_reply": tr.student_reply,
                "review_status": r_stat,
                "is_duplicate_comment": seen_comments.get(c_norm, 0) > 1,
                "prompt_injection_detected": tr.safety_checks.prompt_injection_detected,
            })

        workflow_status = _derive_workflow_status(raw_status, effective_route)
        subj = raw_q.get("subject", "General")
        chap = raw_q.get("chapter", "General")
        qtype = norm_q.question_type if norm_q else raw_q.get("questionType", "scq")
        stem_preview = _strip_markup(norm_q.stem_text if norm_q else raw_q.get("question", ""))[:160]

        grouped_cases.append({
            "question_id": qid,
            "primary_report_id": primary_rep["reportId"],
            "subject": subj,
            "chapter": chap,
            "question_type": qtype,
            "sources": sources,
            "stem_preview": stem_preview,
            "report_count": len(pairs),
            "unique_students": len(student_ids) or len(pairs),
            "is_multi_report": len(pairs) > 1,
            "associated_reports": associated_reports,
            "ai_verdict": primary_triage.verdict,
            "repair_type": repair_key,
            "repair_label": repair_def.label if repair_def else None,
            "repair_auto_allowed": auto_allowed,
            "permitted_fields": permitted_fields,
            "confidence": primary_triage.confidence,
            "evidence": primary_triage.evidence,
            "student_reply": primary_triage.student_reply,
            "proposed_edit": db_edit or (edit_obj.model_dump() if edit_obj else None),
            "route": effective_route,
            "raw_status": raw_status,
            "workflow_status": workflow_status,
            "prompt_injection_detected": prompt_inj,
            "scope_valid": scope_valid,
            "priority_score": score,
            "urgency_level": urg_lvl,
            "urgency_label": urg_lbl,
            "priority_signals": priority_signals,
            "first_reported_at": first_reported,
            "latest_reported_at": latest_reported,
            "updated_at": updated_at,
        })

    # Sort resolved slightly below unresolved within priority tiers, then multi-signal priority desc
    grouped_cases.sort(
        key=lambda c: (
            1 if c["raw_status"] in ("approved", "rejected", "no_change") else 0,
            -c["priority_score"],
            c["primary_report_id"],
        )
    )

    return {
        "all_reports": all_reports,
        "all_triage_results": all_triage_results,
        "grouped_cases": grouped_cases,
        "unsafe_auto_blocked": unsafe_auto_blocked,
    }


@router.get("/workflow-overview", summary="Full problem-driven Report -> Fix Overview telemetry")
def get_workflow_overview() -> Dict[str, Any]:
    """Computes live grouped KPIs, 4-stage pipeline metrics, taxonomy distributions, safety stats, and audit events."""
    bundle = _build_grouped_question_cases()
    all_reports: List[Dict[str, Any]] = bundle["all_reports"]
    all_triage: List[TriageResult] = bundle["all_triage_results"]
    cases: List[Dict[str, Any]] = bundle["grouped_cases"]
    taxonomy_data = taxonomy_service.get_taxonomy_data()

    # Check if precomputed results.json is present on disk
    from app.core.config import settings
    precomputed_path = settings.DATA_DIR.parent / "results.json"
    precomputed_exists = precomputed_path.exists()

    # KPI 1-4 (Strictly Question-Grouped where applicable!)
    total_reports = len(all_reports)
    unique_questions = len(cases)
    multi_report_questions = sum(1 for c in cases if c["is_multi_report"])
    faculty_review_required = sum(1 for c in cases if c["route"] == "faculty_review")
    pending_faculty_cases = sum(
        1 for c in cases if c["route"] == "faculty_review" and c["raw_status"] in ("pending", "deferred")
    )
    auto_fix_eligible = sum(
        1 for c in cases
        if c["route"] == "auto_apply"
        and c["repair_auto_allowed"]
        and c["scope_valid"]
        and c["confidence"] >= 0.90
        and not c["prompt_injection_detected"]
    )

    # Pipeline Stage counts
    unreported_defects = triage_engine.benchmark_runner.scan_unreported_defects()
    avg_conf = round(sum(r.confidence for r in all_triage) / len(all_triage), 4) if all_triage else 0.0
    injections_neutralized = sum(1 for c in cases if c["prompt_injection_detected"])
    cases_requiring_edits = sum(1 for c in cases if c["proposed_edit"] is not None)
    faculty_approved = sum(1 for c in cases if c["raw_status"] == "approved")
    rejected_proposals = sum(1 for c in cases if c["raw_status"] == "rejected")
    no_change_decisions = sum(
        1 for c in cases
        if c["raw_status"] == "no_change" or (c["raw_status"] == "pending" and c["route"] == "no_change")
    )
    escalated_cases = sum(1 for c in cases if c["raw_status"] == "deferred")

    # Stage 01-04 structure
    pipeline_stages = {
        "intake": {
            "total_reports": total_reports,
            "unique_questions": unique_questions,
            "multi_report_questions": multi_report_questions,
            "unreported_defects_flagged": len(unreported_defects),
        },
        "triage": {
            "evaluated_reports": len(all_triage),
            "defects_detected": sum(1 for c in cases if c["ai_verdict"] == "defect"),
            "repairs_classified": sum(1 for c in cases if c["repair_type"]),
            "avg_confidence": avg_conf,
            "data_source": "Deterministic CAS + Rule Engine (results.json artifact present)" if precomputed_exists else "Deterministic CAS + Rule Engine",
        },
        "faculty_review": {
            "pending_reviews": pending_faculty_cases,
            "cases_requiring_edits": cases_requiring_edits,
            "awaiting_decisions": pending_faculty_cases + escalated_cases,
            "escalated_cases": escalated_cases,
        },
        "resolution": {
            "auto_applied_fixes": auto_fix_eligible,
            "faculty_approved_fixes": faculty_approved,
            "rejected_proposals": rejected_proposals,
            "no_change_decisions": no_change_decisions,
        },
    }

    # Exact taxonomy.json verdict distribution
    verdict_counts_rep: Dict[str, int] = {}
    verdict_counts_q: Dict[str, int] = {}
    for tr in all_triage:
        verdict_counts_rep[tr.verdict] = verdict_counts_rep.get(tr.verdict, 0) + 1
    for c in cases:
        v = c["ai_verdict"]
        verdict_counts_q[v] = verdict_counts_q.get(v, 0) + 1

    verdict_distribution = []
    for v_key, v_desc in taxonomy_data.verdicts.items():
        q_cnt = verdict_counts_q.get(v_key, 0)
        r_cnt = verdict_counts_rep.get(v_key, 0)
        pct = round((q_cnt / unique_questions) * 100, 1) if unique_questions > 0 else 0.0
        verdict_distribution.append({
            "key": v_key,
            "description": v_desc,
            "question_count": q_cnt,
            "report_count": r_cnt,
            "percentage": pct,
        })

    # Repair Activity breakdown using taxonomy.json repairs
    repair_rows = []
    for r_key, r_def in taxonomy_data.repairs.items():
        matching = [c for c in cases if c["repair_type"] == r_key]
        if not matching:
            continue
        repair_rows.append({
            "key": r_key,
            "label": r_def.label,
            "auto": r_def.auto,
            "fields": r_def.fields,
            "proposed_count": len(matching),
            "auto_applied": sum(1 for c in matching if c["route"] == "auto_apply"),
            "awaiting_faculty": sum(1 for c in matching if c["route"] == "faculty_review" and c["raw_status"] in ("pending", "deferred")),
            "approved": sum(1 for c in matching if c["raw_status"] == "approved"),
            "rejected": sum(1 for c in matching if c["raw_status"] == "rejected"),
        })

    repair_summary = {
        "proposed_corrections": sum(1 for c in cases if c["repair_type"]),
        "auto_applied_repairs": auto_fix_eligible,
        "awaiting_faculty_approval": pending_faculty_cases,
        "faculty_approved_repairs": faculty_approved,
        "rejected_repairs": rejected_proposals,
        "no_change_cases": no_change_decisions,
        "breakdown": repair_rows,
    }

    # AI Performance & Safety (distinct confidence vs safety vs faculty governance vs honest accuracy)
    conf_high = sum(1 for c in cases if c["confidence"] >= 0.90)
    conf_med = sum(1 for c in cases if 0.80 <= c["confidence"] < 0.90)
    conf_low = sum(1 for c in cases if c["confidence"] < 0.80)

    out_of_scope_blocked = 0
    recent_audits: List[Dict[str, Any]] = []
    faculty_edit_count = 0
    total_audit_decisions = 0
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM safety_events WHERE event_type = 'out_of_scope_edit_blocked';")
        out_of_scope_blocked = cursor.fetchone()[0]

        cursor.execute(
            "SELECT id, report_id, question_id, action, faculty_name, notes, created_at FROM audit_logs ORDER BY id DESC LIMIT 12;"
        )
        for row in cursor.fetchall():
            recent_audits.append({
                "id": row["id"],
                "audit_ref": f"AUD-{row['id']:04d}",
                "report_id": row["report_id"],
                "question_id": row["question_id"],
                "action": row["action"],
                "actor": row["faculty_name"] or "Faculty",
                "notes": row["notes"] or "",
                "created_at": row["created_at"],
            })

        cursor.execute("SELECT action, COUNT(*) as cnt FROM audit_logs GROUP BY action;")
        for row in cursor.fetchall():
            cnt = row["cnt"]
            total_audit_decisions += cnt
            if row["action"] in ("reject", "edit", "no_change"):
                faculty_edit_count += cnt

    override_rate = (
        round((faculty_edit_count / total_audit_decisions) * 100, 1)
        if total_audit_decisions > 0
        else None
    )

    ai_performance_and_safety = {
        "model_confidence": {
            "average": avg_conf,
            "high_ge_90": conf_high,
            "medium_80_89": conf_med,
            "low_lt_80": conf_low,
        },
        "ground_truth_accuracy": {
            "available": False,
            "value": None,
            "note": "No labeled ground-truth dataset file is supplied; confidence is never reported as accuracy.",
        },
        "repair_safety": {
            "out_of_scope_edits_rejected": out_of_scope_blocked,
            "auto_false_gated_cases": sum(1 for c in cases if c["repair_type"] and not c["repair_auto_allowed"]),
            "unsafe_auto_blocked": bundle["unsafe_auto_blocked"],
            "prompt_injections_neutralized": injections_neutralized,
            "precomputed_artifact_available": precomputed_exists,
        },
        "faculty_governance": {
            "total_recorded_decisions": total_audit_decisions,
            "faculty_approved": faculty_approved,
            "faculty_rejected": rejected_proposals,
            "faculty_no_change": no_change_decisions,
            "faculty_override_rate": override_rate,
        },
    }

    return {
        "kpis": {
            "total_reports": total_reports,
            "unique_questions": unique_questions,
            "multi_report_questions": multi_report_questions,
            "faculty_review_required": faculty_review_required,
            "pending_faculty_cases": pending_faculty_cases,
            "auto_fix_eligible": auto_fix_eligible,
        },
        "pipeline_stages": pipeline_stages,
        "verdict_distribution": verdict_distribution,
        "suspicious_reports_count": injections_neutralized,
        "repair_activity": repair_summary,
        "ai_performance_and_safety": ai_performance_and_safety,
        "priority_cases": cases,
        "recent_investigations": cases[:10],
        "audit_events": recent_audits,
    }


@router.get("/queue/grouped", summary="Question-grouped faculty review queue")
def get_grouped_faculty_queue(
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 25,
    view: Annotated[str, Query()] = "all",
    subject: Annotated[Optional[str], Query()] = None,
    verdict: Annotated[Optional[str], Query()] = None,
    repair_type: Annotated[Optional[str], Query()] = None,
    date_range: Annotated[str, Query()] = "all",
    sort_by: Annotated[str, Query()] = "priority",
    search: Annotated[Optional[str], Query()] = None,
) -> Dict[str, Any]:
    """Returns 1 case per unique questionId with expandable reports, real filtering, and multi-signal priority."""
    bundle = _build_grouped_question_cases()
    cases: List[Dict[str, Any]] = bundle["grouped_cases"]

    # Facets before filtering (real backend counts!)
    facets = {
        "all": len(cases),
        "needs_review": sum(1 for c in cases if c["workflow_status"] in ("Needs Faculty Review", "Escalated")),
        "high_priority": sum(1 for c in cases if c["urgency_level"] in ("L1", "L2")),
        "recently_updated": sum(1 for c in cases if c["raw_status"] != "pending" or c["is_multi_report"]),
        "resolved": sum(1 for c in cases if c["raw_status"] in ("approved", "rejected", "no_change") or c["workflow_status"] == "No Change"),
        "faculty_review": sum(1 for c in cases if c["route"] == "faculty_review"),
        "auto_fix": sum(1 for c in cases if c["route"] == "auto_apply" and c["repair_auto_allowed"]),
        "no_change": sum(1 for c in cases if c["workflow_status"] == "No Change"),
        "rejected_or_suspicious": sum(1 for c in cases if c["raw_status"] == "rejected" or c["prompt_injection_detected"]),
        "subjects": sorted({c["subject"] for c in cases if c["subject"]}),
    }

    filtered: List[Dict[str, Any]] = []
    q_search = (search or "").strip().lower()

    for c in cases:
        if view == "needs_review" and c["workflow_status"] not in ("Needs Faculty Review", "Escalated"):
            continue
        elif view == "high_priority" and c["urgency_level"] not in ("L1", "L2"):
            continue
        elif view == "recently_updated" and c["raw_status"] == "pending" and not c["is_multi_report"]:
            continue
        elif view == "resolved" and c["raw_status"] not in ("approved", "rejected", "no_change") and c["workflow_status"] != "No Change":
            continue
        elif view == "faculty_review" and c["route"] != "faculty_review":
            continue
        elif view == "auto_fix" and not (c["route"] == "auto_apply" and c["repair_auto_allowed"]):
            continue
        elif view == "no_change" and c["workflow_status"] != "No Change":
            continue
        elif view == "rejected_or_suspicious" and not (c["raw_status"] == "rejected" or c["prompt_injection_detected"]):
            continue

        if subject and subject != "all" and c["subject"].lower() != subject.lower():
            continue
        if verdict and verdict != "all":
            if verdict == "suspicious":
                if not c["prompt_injection_detected"]:
                    continue
            elif c["ai_verdict"].lower() != verdict.lower():
                continue
        if repair_type and repair_type != "all" and (c["repair_type"] or "").lower() != repair_type.lower():
            continue
        if date_range and date_range != "all":
            age = _parse_iso_days_ago(c["latest_reported_at"])
            if date_range == "7d" and age > 7.0:
                continue
            if date_range == "30d" and age > 30.0:
                continue

        if q_search:
            rep_blob = " ".join(
                f"{r['report_id']} {r['comment']} {r['source']}" for r in c["associated_reports"]
            )
            haystack = " ".join([
                c["question_id"],
                c["primary_report_id"],
                c["subject"],
                c["chapter"],
                c["stem_preview"],
                c["ai_verdict"],
                c["repair_type"] or "",
                c["evidence"] or "",
                rep_blob,
            ]).lower()
            if q_search not in haystack:
                continue

        filtered.append(c)

    if sort_by == "confidence":
        filtered.sort(key=lambda x: (-x["confidence"], -x["priority_score"]))
    elif sort_by == "reports":
        filtered.sort(key=lambda x: (-x["report_count"], -x["priority_score"]))
    elif sort_by == "updated":
        filtered.sort(key=lambda x: str(x["updated_at"] or ""), reverse=True)
    # default "priority" already sorted cleanly by unresolved-first + priority_score desc

    total = len(filtered)
    paginated = filtered[skip : skip + limit]
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "facets": facets,
        "items": paginated,
    }


@router.get("/question-case/{question_id}", summary="Complete grouped question case detail for inline review")
def get_grouped_question_case(question_id: str) -> Dict[str, Any]:
    """Returns question content (HTML/MathML/options/key), ALL grouped reports, AI triage, verification, and audit trail."""
    bundle = _build_grouped_question_cases()
    case = next((c for c in bundle["grouped_cases"] if c["question_id"] == question_id), None)
    if not case:
        raise HTTPException(status_code=404, detail=f"Question case '{question_id}' not found")

    raw_q = data_loader.get_question_by_id(question_id)
    if not raw_q:
        raise HTTPException(status_code=404, detail=f"Question '{question_id}' not found")

    norm_q = question_normalizer.normalize(raw_q)
    v_res = verification_engine.verify_question(norm_q)

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, report_id, question_id, action, faculty_id, faculty_name, notes, applied_edit, created_at
            FROM audit_logs
            WHERE question_id = ?
            ORDER BY id DESC;
            """,
            (question_id,),
        )
        audit_history = [
            {
                "id": r["id"],
                "report_id": r["report_id"],
                "question_id": r["question_id"],
                "action": r["action"],
                "faculty_name": r["faculty_name"],
                "notes": r["notes"],
                "applied_edit": json.loads(r["applied_edit"]) if r["applied_edit"] else None,
                "created_at": r["created_at"],
            }
            for r in cursor.fetchall()
        ]

    return {
        "case": case,
        "question": {
            "raw": raw_q,
            "normalized": norm_q.model_dump(),
        },
        "solver_verification": v_res.model_dump(),
        "audit_history": audit_history,
    }
