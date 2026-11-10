import hashlib
import hmac
import os
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from app.core.database import get_db_connection

# Session duration in days
SESSION_EXPIRE_DAYS = 7
DEMO_EMAIL = "demo@acadza.local"
DEMO_PASSWORD = "AcadzaDemo2026!"
DEMO_NAME = "Dr. A. Sharma"
DEMO_ROLE = "faculty"


def hash_password(password: str) -> str:
    """Hash a password using PBKDF2-HMAC-SHA256 with a secure random salt."""
    salt = secrets.token_bytes(16)
    pw_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
    return f"{salt.hex()}${pw_hash.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against the stored salt$hash representation."""
    try:
        salt_hex, hash_hex = hashed_password.split("$", 1)
        salt = bytes.fromhex(salt_hex)
        expected_hash = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, 100_000)
        return hmac.compare_digest(expected_hash.hex(), hash_hex)
    except Exception:
        return False


def generate_session_token() -> str:
    """Generate a high-entropy cryptographically secure session token."""
    return secrets.token_urlsafe(32)


def init_auth_tables() -> None:
    """Ensure user accounts and session tables are present in the SQLite database."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
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
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")
        conn.commit()


def seed_demo_user() -> Dict[str, Any]:
    """Seed the standard demo faculty user if it does not already exist."""
    init_auth_tables()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, name, role FROM users WHERE email = ?;", (DEMO_EMAIL,))
        existing = cursor.fetchone()
        if existing:
            return dict(existing)

        pw_hash = hash_password(DEMO_PASSWORD)
        cursor.execute(
            """
            INSERT INTO users (email, password_hash, name, role, avatar)
            VALUES (?, ?, ?, ?, ?);
            """,
            (
                DEMO_EMAIL,
                pw_hash,
                DEMO_NAME,
                DEMO_ROLE,
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
            ),
        )
        conn.commit()
        user_id = cursor.lastrowid
        return {
            "id": user_id,
            "email": DEMO_EMAIL,
            "name": DEMO_NAME,
            "role": DEMO_ROLE,
        }


def create_user_session(user_id: int, days: int = SESSION_EXPIRE_DAYS) -> str:
    """Create a persistent user session in SQLite."""
    token = generate_session_token()
    expires_at = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO user_sessions (token, user_id, expires_at)
            VALUES (?, ?, ?);
            """,
            (token, user_id, expires_at),
        )
        conn.commit()
    return token


def get_user_from_token(token: str) -> Optional[Dict[str, Any]]:
    """Validate a session token and return the associated user dictionary if valid and not expired."""
    if not token:
        return None

    init_auth_tables()
    now_iso = datetime.now(timezone.utc).isoformat()

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT u.id, u.email, u.name, u.role, u.avatar, s.expires_at
            FROM user_sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.token = ?;
            """,
            (token,),
        )
        row = cursor.fetchone()
        if not row:
            return None

        # Check expiration
        expires_at_str = row["expires_at"]
        if expires_at_str and expires_at_str < now_iso:
            # Token expired, remove it
            cursor.execute("DELETE FROM user_sessions WHERE token = ?;", (token,))
            conn.commit()
            return None

        return {
            "id": row["id"],
            "email": row["email"],
            "name": row["name"],
            "role": row["role"],
            "avatar": row["avatar"],
        }


def delete_session(token: str) -> bool:
    """Revoke and delete a session token."""
    if not token:
        return False
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM user_sessions WHERE token = ?;", (token,))
        conn.commit()
        return cursor.rowcount > 0
