from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response, status
from app.core.config import settings
from app.core.database import get_db_connection
from app.core.security import (
    create_user_session,
    delete_session,
    get_user_from_token,
    hash_password,
    seed_demo_user,
    verify_password,
)
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    LogoutResponse,
    ProfileUpdateRequest,
    RegisterRequest,
    UserResponse,
)

router = APIRouter()


def extract_token(request: Request, authorization: Optional[str] = None) -> Optional[str]:
    """Extract session token from either Authorization Bearer header or HTTP-only cookie."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ", 1)[1].strip()
        if token:
            return token
    # Fallback to HTTP-only cookie
    return request.cookies.get("qvera_session") or request.cookies.get("acadza_session")


def get_current_user_optional(
    request: Request,
    authorization: Optional[str] = Header(None),
) -> Optional[Dict[str, Any]]:
    """Resolve currently authenticated user if a valid session exists; otherwise return None."""
    token = extract_token(request, authorization)
    if not token:
        return None
    return get_user_from_token(token)


def get_current_user(
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
) -> Dict[str, Any]:
    """Dependency enforcing that an active authenticated session exists."""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in to access this resource.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user


def require_faculty(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """Dependency verifying that the user has faculty or administrator review permissions."""
    if current_user.get("role") not in ("faculty", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty privileges required to perform this action.",
        )
    return current_user


def require_admin(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """Dependency enforcing administrator role for taxonomy and configuration writes."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator role required to modify taxonomy or system configuration.",
        )
    return current_user


@router.post("/login", response_model=LoginResponse, summary="Sign in with email and password")
def login(payload: LoginRequest, response: Response) -> LoginResponse:
    """Authenticates faculty credentials, establishes session, and issues token and cookie."""
    # Ensure demo user is seeded
    seed_demo_user()

    email_clean = payload.email.strip().lower()
    if not email_clean or not payload.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required.",
        )

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, email, password_hash, name, role, avatar
            FROM users
            WHERE lower(email) = ?;
            """,
            (email_clean,),
        )
        row = cursor.fetchone()

    if not row or not verify_password(payload.password, row["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    user_dict = {
        "id": row["id"],
        "email": row["email"],
        "name": row["name"],
        "role": row["role"],
        "avatar": row["avatar"],
    }

    days = 30 if payload.remember_me else 7
    token = create_user_session(user_dict["id"], days=days)

    # Set secure HTTP-only cookie (Supports same-origin localhost and HTTPS cross-origin Vercel+Render)
    is_prod = settings.ENV.lower() == "production"
    response.set_cookie(
        key="qvera_session",
        value=token,
        max_age=days * 86400,
        httponly=True,
        samesite="none" if is_prod else "lax",
        secure=is_prod,
        path="/",
    )

    return LoginResponse(
        status="success",
        message="Authentication successful.",
        token=token,
        user=UserResponse(**user_dict),
    )


@router.post("/register", response_model=LoginResponse, summary="Register a new faculty account")
def register(payload: RegisterRequest, response: Response) -> LoginResponse:
    """Creates a new faculty account, hashes credentials, initializes session, and returns auth response."""
    email_clean = payload.email.strip().lower()
    name_clean = payload.name.strip()
    if not email_clean or not payload.password or not name_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name, email and password are required.",
        )

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE lower(email) = ?;", (email_clean,))
        if cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists.",
            )

        pw_hash = hash_password(payload.password)
        cursor.execute(
            """
            INSERT INTO users (email, password_hash, name, role)
            VALUES (?, ?, ?, ?);
            """,
            (email_clean, pw_hash, name_clean, payload.role or "faculty"),
        )
        user_id = cursor.lastrowid
        conn.commit()

    token = create_user_session(user_id, days=7)
    response.set_cookie(
        key="qvera_session",
        value=token,
        max_age=7 * 86400,
        httponly=True,
        samesite="lax",
        secure=False,
        path="/",
    )
    user_dict = {
        "id": user_id,
        "email": email_clean,
        "name": name_clean,
        "role": payload.role or "faculty",
        "avatar": None,
    }
    return LoginResponse(
        status="success",
        message="Registration successful.",
        token=token,
        user=UserResponse(**user_dict),
    )


@router.post("/logout", response_model=LogoutResponse, summary="Revoke current session and log out")
def logout(
    request: Request,
    response: Response,
    authorization: Optional[str] = Header(None),
) -> LogoutResponse:
    """Revokes the current user's session token and deletes the session cookie."""
    token = extract_token(request, authorization)
    if token:
        delete_session(token)

    response.delete_cookie(key="qvera_session", path="/")
    response.delete_cookie(key="acadza_session", path="/")
    return LogoutResponse(status="success", message="Session successfully terminated.")


@router.get("/me", response_model=UserResponse, summary="Get current authenticated user profile")
def get_me(current_user: Dict[str, Any] = Depends(get_current_user)) -> UserResponse:
    """Returns the profile of the currently signed-in user."""
    return UserResponse(**current_user)


@router.patch("/me", response_model=UserResponse, summary="Update current authenticated user profile")
def update_me(
    payload: ProfileUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> UserResponse:
    """Updates display name or avatar preference for the signed-in faculty user."""
    name_clean = payload.name.strip()
    if len(name_clean) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Display name must be at least 2 characters.",
        )

    new_avatar = payload.avatar if payload.avatar is not None else current_user.get("avatar")

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE users
            SET name = ?, avatar = ?
            WHERE id = ?;
            """,
            (name_clean, new_avatar, current_user["id"]),
        )
        conn.commit()
        cursor.execute(
            "SELECT id, email, name, role, avatar FROM users WHERE id = ?;",
            (current_user["id"],),
        )
        row = cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="User account not found.")

    return UserResponse(
        id=row["id"],
        email=row["email"],
        name=row["name"],
        role=row["role"],
        avatar=row["avatar"],
    )
