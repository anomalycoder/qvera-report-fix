import sqlite3
from pathlib import Path
from contextlib import contextmanager
from typing import Generator
from app.core.config import settings


def get_db_path() -> Path:
    return settings.SQLITE_DB_PATH


def init_db() -> None:
    """Initialize database tables for audit logging and triage storage."""
    db_path = get_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)

    with sqlite3.connect(db_path) as conn:
        conn.execute("PRAGMA journal_mode=WAL;")
        cursor = conn.cursor()

        # Audit logs table: record every faculty review action (approve, edit, reject)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id TEXT NOT NULL,
                question_id TEXT NOT NULL,
                action TEXT NOT NULL,
                faculty_id TEXT,
                faculty_name TEXT,
                notes TEXT,
                applied_edit TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # Triage results cache / store
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS triage_records (
                report_id TEXT PRIMARY KEY,
                question_id TEXT NOT NULL,
                verdict TEXT NOT NULL,
                repair TEXT,
                route TEXT NOT NULL,
                confidence REAL,
                evidence TEXT,
                student_reply TEXT,
                edit_payload TEXT,
                status TEXT DEFAULT 'pending',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        conn.commit()


_initialized = False


def ensure_db_initialized() -> None:
    global _initialized
    if not _initialized:
        init_db()
        _initialized = True


@contextmanager
def get_db_connection() -> Generator[sqlite3.Connection, None, None]:
    """Context manager for SQLite database connection."""
    ensure_db_initialized()
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def check_db_health() -> bool:
    """Check if SQLite database is responsive."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1;")
            result = cursor.fetchone()
            return result is not None and result[0] == 1
    except Exception:
        return False
