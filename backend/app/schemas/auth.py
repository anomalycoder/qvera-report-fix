from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="User password")
    remember_me: Optional[bool] = Field(default=False, description="Persist session for extended duration")


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, description="User full name")
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="User password")
    role: Optional[str] = Field(default="faculty", description="User role")


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    avatar: Optional[str] = None


class ProfileUpdateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Updated faculty display name")
    avatar: Optional[str] = Field(default=None, description="Optional avatar identifier")


class LoginResponse(BaseModel):
    status: str = "success"
    message: str
    token: str
    user: UserResponse


class LogoutResponse(BaseModel):
    status: str = "success"
    message: str
