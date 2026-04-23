import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.rate_limit import limiter
from app.schemas.auth import LoginRequest, RefreshRequest, SignupRequest, TokenResponse, UserOut
from app.schemas.common import Response
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    is_jti_revoked,
    revoke_jti,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=Response[UserOut], status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")  # 동일 IP 에서 분당 5회까지만 회원가입 시도 허용
async def signup(
    request: Request,
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
        role=body.role,  # MVP: 클라이언트 요청 role 그대로 저장. 승인 플로우는 Phase 5에서 도입.
    )
    db.add(user)
    await db.flush()
    return Response(data=UserOut.model_validate(user))


@router.post("/login", response_model=Response[TokenResponse])
@limiter.limit("10/minute")  # 브루트포스 방지: 동일 IP 에서 분당 10회 로그인 시도 제한
async def login(
    request: Request,
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
@limiter.limit("20/minute")
async def refresh_token(request: Request, body: RefreshRequest):
    """Refresh token rotation.
    - 제시된 refresh 토큰의 jti 가 이미 blacklist 에 있으면 거절한다 (재사용 탐지).
    - 유효하면 즉시 해당 jti 를 blacklist 에 넣고 새 access/refresh 쌍을 발급한다.
    - 결과적으로 한 번 사용된 refresh 토큰은 다시 사용될 수 없다.
    """
    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise ValueError("Not a refresh token")
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail={"code": "INVALID_TOKEN", "message": "유효하지 않은 토큰입니다."},
        )

    old_jti = payload.get("jti")
    if old_jti and is_jti_revoked(old_jti):
        raise HTTPException(
            status_code=401,
            detail={"code": "TOKEN_REUSED", "message": "이미 사용된 refresh 토큰입니다. 다시 로그인해 주세요."},
        )
    if old_jti:
        revoke_jti(old_jti)

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
