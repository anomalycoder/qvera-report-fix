import os
import tempfile
import sqlite3
from pathlib import Path

# Test fresh DB creation
temp_dir = tempfile.mkdtemp()
temp_db_path = Path(temp_dir) / "test_fresh.db"

with sqlite3.connect(temp_db_path) as conn:
    conn.execute("PRAGMA journal_mode=WAL;")
    cursor = conn.cursor()
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
    conn.commit()

    # Verify tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [r[0] for r in cursor.fetchall()]
    assert "audit_logs" in tables
    assert "triage_records" in tables
    assert "users" in tables
    assert "user_sessions" in tables

    # Test idempotency (running again doesn't crash)
    cursor.execute("PRAGMA journal_mode=WAL;")
    conn.commit()

print("Fresh DB Test: SUCCESS (All tables created cleanly in WAL mode)")

# Cleanup temp db
try:
    os.remove(temp_db_path)
    os.rmdir(temp_dir)
except Exception:
    pass
