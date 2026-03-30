import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, RefreshRequest, SignupRequest, TokenResponse, UserOut
from app.schemas.common import Response
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=Response[UserOut], status_code=status.HTTP_201_CREATED)
async def signup(
    body: SignupRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail={"code": "DUPLICATE_EMAIL", "message": "이미 사용 중인 이메일입니다."},
        )
    user = User(
        id=uuid.uuid4(),
        email=body.email,
        hashed_password=hash_password(body.password),
        display_name=body.display_name,
        phone=body.phone,
        role="USER",
    )
    db.add(user)
    await db.flush()
    return Response(data=UserOut.model_validate(user))


@router.post("/login", response_model=Response[TokenResponse])
async def login(
    body: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail={"code": "INVALID_CREDENTIALS", "message": "이메일 또는 비밀번호가 틀렸습니다."},
        )
    payload = {"sub": str(user.id), "role": user.role}
    return Response(
        data=TokenResponse(
            access_token=create_access_token(payload),
            refresh_token=create_refresh_token(payload),
        )
    )


@router.post("/refresh", response_model=Response[TokenResponse])
async def refresh_token(body: RefreshRequest):
    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise ValueError("Not a refresh token")
    except ValueError:
        raise HTTPException(status_code=401, detail={"code": "INVALID_TOKEN", "message": "유효하지 않은 토큰입니다."})
    new_payload = {"sub": payload["sub"], "role": payload["role"]}
    return Response(
        data=TokenResponse(
            access_token=create_access_token(new_payload),
            refresh_token=create_refresh_token(new_payload),
        )
    )


@router.get("/me", response_model=Response[UserOut])
async def get_me(current_user: Annotated[User, Depends(get_current_user)]):
    return Response(data=UserOut.model_validate(current_user))
