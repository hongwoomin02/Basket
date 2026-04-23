"""JWT / 패스워드 관련 보안 유틸.

Phase 5 하드닝:
- 모든 JWT 에 `jti` 를 부여해 개별 revoke 가능하도록 함.
- Refresh token rotation: 한 번 사용된 refresh 토큰의 jti 를 blacklist 에 넣고,
  같은 jti 가 다시 들어오면 거절한다. (간이 in-memory 저장소 — 단일 인스턴스 한정.
  다중 인스턴스 배포 시 Redis 로 교체할 것.)
- 패스워드 정책: 8자 이상 + 영문·숫자 모두 포함.
"""
from __future__ import annotations

import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from jose import JWTError, jwt

from app.config import settings


# ─── 비밀번호 해시 ───────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())


# ─── 패스워드 정책 ────────────────────────────────────────────────────────
_PW_HAS_LETTER = re.compile(r"[A-Za-z]")
_PW_HAS_DIGIT = re.compile(r"\d")


def validate_password_policy(password: str) -> None:
    """Phase 5 패스워드 정책. 위반 시 ValueError 를 던진다."""
    if len(password) < 8:
        raise ValueError("비밀번호는 8자 이상이어야 합니다.")
    if not _PW_HAS_LETTER.search(password):
        raise ValueError("비밀번호에는 영문 1자 이상이 포함되어야 합니다.")
    if not _PW_HAS_DIGIT.search(password):
        raise ValueError("비밀번호에는 숫자 1자 이상이 포함되어야 합니다.")


# ─── JWT ────────────────────────────────────────────────────────────────
def _encode(data: dict[str, Any], *, expires: timedelta, token_type: str) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    to_encode.update({
        "iat": now,
        "exp": now + expires,
        "type": token_type,
        "jti": uuid.uuid4().hex,
    })
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_access_token(data: dict[str, Any]) -> str:
    return _encode(
        data,
        expires=timedelta(minutes=settings.access_token_expire_minutes),
        token_type="access",
    )


def create_refresh_token(data: dict[str, Any]) -> str:
    return _encode(
        data,
        expires=timedelta(days=settings.refresh_token_expire_days),
        token_type="refresh",
    )


def decode_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError as e:
        raise ValueError("Invalid token") from e


# ─── Refresh Token Blacklist (간이 버전) ────────────────────────────────
# 단일 인스턴스 전제. 재시작 시 초기화됨.
# 프로덕션 다중 인스턴스 환경에서는 Redis/DB 저장소로 교체해야 한다.
_revoked_jti: set[str] = set()


def revoke_jti(jti: str) -> None:
    _revoked_jti.add(jti)


def is_jti_revoked(jti: str) -> bool:
    return jti in _revoked_jti
