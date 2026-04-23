from typing import Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr, field_validator

from app.utils.security import validate_password_policy


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: str
    phone: str | None = None
    # MVP: 공개 가입에서 OWNER 역할을 선택할 수 있게 허용.
    # TODO(security): Phase 5-후속 에서 OWNER 가입을 "승인 대기(PENDING_OWNER)" 상태로 저장하고
    #   어드민 승인 이후에만 role=OWNER 로 승격하는 플로우로 교체할 것.
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
