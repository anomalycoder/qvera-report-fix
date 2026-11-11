import pytest
from fastapi import HTTPException, Response
from app.api.v1.endpoints.auth import (
    get_me,
    login,
    logout,
    require_faculty,
    extract_token,
    update_me,
)
from app.core.security import (
    DEMO_EMAIL,
    DEMO_PASSWORD,
    hash_password,
    seed_demo_user,
    verify_password,
    get_user_from_token,
    delete_session,
)
from app.schemas.auth import LoginRequest, ProfileUpdateRequest


def test_seed_demo_user():
    user = seed_demo_user()
    assert user["email"] == DEMO_EMAIL
    assert user["role"] == "faculty"
    assert user["name"] == "Dr. A. Sharma"


def test_password_hashing_and_verification():
    raw_pw = "SecretTestingPass123!"
    hashed = hash_password(raw_pw)
    assert hashed != raw_pw
    assert "$" in hashed
    assert verify_password(raw_pw, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_login_demo_success():
    req = LoginRequest(email=DEMO_EMAIL, password=DEMO_PASSWORD, remember_me=True)
    resp = Response()
    res = login(req, resp)
    assert res.status == "success"
    assert res.token is not None
    assert len(res.token) > 20
    assert res.user.email == DEMO_EMAIL
    assert res.user.role == "faculty"
    assert res.user.name == "Dr. A. Sharma"

    # Token can be verified
    retrieved = get_user_from_token(res.token)
    assert retrieved is not None
    assert retrieved["email"] == DEMO_EMAIL


def test_login_invalid_password():
    req = LoginRequest(email=DEMO_EMAIL, password="WrongPassword2026!")
    resp = Response()
    with pytest.raises(HTTPException) as exc_info:
        login(req, resp)
    assert exc_info.value.status_code == 401
    assert "Invalid email or password" in exc_info.value.detail


def test_login_nonexistent_user():
    req = LoginRequest(email="nobody@nowhere.com", password="AnyPassword!")
    resp = Response()
    with pytest.raises(HTTPException) as exc_info:
        login(req, resp)
    assert exc_info.value.status_code == 401


def test_login_empty_fields():
    req = LoginRequest(email="", password="")
    resp = Response()
    with pytest.raises(HTTPException) as exc_info:
        login(req, resp)
    assert exc_info.value.status_code == 400


def test_auth_me_and_role_protection():
    # Valid faculty user
    user_dict = {
        "id": 1,
        "email": DEMO_EMAIL,
        "name": "Dr. A. Sharma",
        "role": "faculty",
        "avatar": None,
    }
    me_resp = get_me(current_user=user_dict)
    assert me_resp.email == DEMO_EMAIL
    assert me_resp.name == "Dr. A. Sharma"

    # Require faculty passes
    fac = require_faculty(current_user=user_dict)
    assert fac["role"] == "faculty"

    # Require faculty blocks non-faculty
    student_dict = {
        "id": 2,
        "email": "student@qvera.local",
        "name": "Student",
        "role": "student",
        "avatar": None,
    }
    with pytest.raises(HTTPException) as exc_info:
        require_faculty(current_user=student_dict)
    assert exc_info.value.status_code == 403


def test_session_deletion_on_logout():
    req = LoginRequest(email=DEMO_EMAIL, password=DEMO_PASSWORD)
    resp = Response()
    login_res = login(req, resp)
    token = login_res.token

    assert get_user_from_token(token) is not None
    deleted = delete_session(token)
    assert deleted is True
    assert get_user_from_token(token) is None


def test_update_profile_name():
    user = seed_demo_user()
    original_name = user["name"]
    updated = update_me(
        ProfileUpdateRequest(name="Dr. QVERA Faculty"),
        current_user=user,
    )
    assert updated.name == "Dr. QVERA Faculty"

    restored = update_me(
        ProfileUpdateRequest(name=original_name),
        current_user=user,
    )
    assert restored.name == original_name
