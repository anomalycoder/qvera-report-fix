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

        # Audit logs table: append-only immutable log of investigation decisions
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id TEXT NOT NULL,
                question_id TEXT NOT NULL,
                action TEXT NOT NULL,
                faculty_id TEXT,
                faculty_name TEXT,
                actor_type TEXT DEFAULT 'faculty',
                status TEXT DEFAULT 'success',
                previous_value TEXT,
                new_value TEXT,
                notes TEXT,
                applied_edit TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # Non-destructive column migrations for existing audit_logs tables
        cursor.execute("PRAGMA table_info(audit_logs);")
        existing_audit_cols = {row[1] for row in cursor.fetchall()}
        for col_name, col_def in [
            ("actor_type", "TEXT DEFAULT 'faculty'"),
            ("status", "TEXT DEFAULT 'success'"),
            ("previous_value", "TEXT"),
            ("new_value", "TEXT"),
        ]:
            if col_name not in existing_audit_cols:
                cursor.execute(f"ALTER TABLE audit_logs ADD COLUMN {col_name} {col_def};")

        # Database-enforced append-only protections on audit_logs
        cursor.execute("""
            CREATE TRIGGER IF NOT EXISTS audit_logs_prevent_update
            BEFORE UPDATE ON audit_logs
            BEGIN
                SELECT RAISE(ABORT, 'Audit logs are append-only and cannot be modified');
            END;
        """)
        cursor.execute("""
            CREATE TRIGGER IF NOT EXISTS audit_logs_prevent_delete
            BEFORE DELETE ON audit_logs
            BEGIN
                SELECT RAISE(ABORT, 'Audit logs are append-only and cannot be deleted');
            END;
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS question_versions (
                question_id TEXT PRIMARY KEY,
                version INTEGER NOT NULL DEFAULT 1,
                original_json TEXT NOT NULL,
                current_json TEXT NOT NULL,
                last_edit_json TEXT,
                updated_by TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_qid ON audit_logs(question_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);")

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
                taxonomy_version INTEGER DEFAULT 1,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        cursor.execute("PRAGMA table_info(triage_records);")
        existing_triage_cols = {row[1] for row in cursor.fetchall()}
        if "taxonomy_version" not in existing_triage_cols:
            cursor.execute("ALTER TABLE triage_records ADD COLUMN taxonomy_version INTEGER DEFAULT 1;")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS taxonomy_versions (
                version INTEGER PRIMARY KEY AUTOINCREMENT,
                verdicts_json TEXT NOT NULL,
                repairs_json TEXT NOT NULL,
                verdicts_meta_json TEXT NOT NULL,
                repairs_meta_json TEXT NOT NULL,
                triage_config_json TEXT NOT NULL,
                change_summary TEXT NOT NULL,
                updated_by TEXT NOT NULL,
                updated_by_role TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # Users and active sessions
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'faculty',
                avatar TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            );
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id TEXT,
                question_id TEXT,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT 'defect_alert',
                urgency TEXT DEFAULT 'L2',
                target_tab TEXT NOT NULL DEFAULT 'workspace',
                is_read INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS submitted_reports (
                report_id TEXT PRIMARY KEY,
                question_id TEXT NOT NULL,
                student_id TEXT NOT NULL,
                source TEXT NOT NULL DEFAULT 'web',
                comment TEXT NOT NULL,
                reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS safety_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT NOT NULL,
                report_id TEXT,
                question_id TEXT,
                repair_key TEXT,
                target_field TEXT,
                detail TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read, id DESC);")

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
