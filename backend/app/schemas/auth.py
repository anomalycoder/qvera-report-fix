from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="User password")
    remember_me: Optional[bool] = Field(default=False, description="Persist session for extended duration")


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    avatar: Optional[str] = None


class LoginResponse(BaseModel):
    status: str = "success"
    message: str
    token: str
    user: UserResponse


class LogoutResponse(BaseModel):
    status: str = "success"
    message: str
