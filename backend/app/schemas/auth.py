from typing import Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr, field_validator

from app.utils.security import validate_password_policy


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: str
    phone: str | None = None
    # OWNER 선택 시 백엔드에서 PENDING_OWNER 로 저장하고, 어드민이 /admin/users/{id}/approve-owner 로 승격.
    role: Literal["USER", "OWNER"] = "USER"

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        validate_password_policy(v)
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    id: UUID
    email: str
    role: str
    display_name: str
    phone: str | None = None
    notification_enabled: bool

    model_config = {"from_attributes": True}
