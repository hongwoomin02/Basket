# 보안 잔존 작업 가이드

> 작성일: 2026-04-23
> 대상: 백엔드 보안 강화 잔존 항목  
> 관련 문서: `docs/PROGRESS_HANDOVER.md` §4.4

Phase 5에서 rate limit·보안 헤더·refresh rotation·패스워드 정책은 적용 완료. 본 문서는 **그 다음에 해야 할 보안 작업**을 우선순위 순으로 정리. 각 항목은 **왜 / 무엇을 / 어떻게 / 검증** 4단 구성.

---

## 1. [긴급] Refresh 토큰의 jti 누락 방어 (5분 작업)

### 왜
현재 `backend/app/routers/auth.py:94-101`은 다음과 같음:

```python
old_jti = payload.get("jti")
if old_jti and is_jti_revoked(old_jti):
    raise HTTPException(status_code=401, detail={"code": "TOKEN_REUSED", ...})
if old_jti:
    revoke_jti(old_jti)
```

**문제**: `jti`가 없는 refresh 토큰은 blacklist 검사·등록 모두 우회한다. 정상 발급 토큰은 항상 jti가 있지만, 만약 키 유출 후 공격자가 직접 서명한 토큰이라면 jti 없이도 통과.  
방어적 코딩 원칙으로 **jti 없으면 즉시 401**이어야 한다.

### 무엇을 / 어떻게
`backend/app/routers/auth.py`의 refresh 엔드포인트 수정:

```python
old_jti = payload.get("jti")
if not old_jti:
    raise HTTPException(
        status_code=401,
        detail={"code": "INVALID_TOKEN", "message": "토큰 형식이 올바르지 않습니다."},
    )
if is_jti_revoked(old_jti):
    raise HTTPException(
        status_code=401,
        detail={"code": "TOKEN_REUSED", "message": "이미 사용된 refresh 토큰입니다."},
    )
revoke_jti(old_jti)
```

### 검증
```bash
# 1) 정상 흐름은 그대로 동작해야 함
curl -X POST http://localhost:8000/auth/login -d '...'  # access/refresh 발급
curl -X POST http://localhost:8000/auth/refresh -d '{"refresh_token":"..."}'  # 200

# 2) jti 없는 가짜 토큰 거부 확인 (수동 JWT 생성)
python -c "import jwt; print(jwt.encode({'sub':'x','role':'USER','type':'refresh'}, 'change-me'))"
# 위 토큰으로 refresh 호출 → 401 INVALID_TOKEN
```

---

## 2. OWNER 가입 승인 플로우 (0.5일 작업)

### 왜
PRD에는 "사장님 회원가입 시 운영팀 승인 후 활성화" 명세 있으나, 현재 `auth.py:46`에서 `role=body.role` 그대로 저장 → 누구나 OWNER로 가입 가능. 운영자 화면 무단 접근 위험.

### 무엇을 / 어떻게

**1) DB 모델 변경** — `backend/app/models/user.py`
- `role` enum에 `PENDING_OWNER` 값 추가
- Alembic migration: `alembic revision -m "add_pending_owner_role"` → enum ALTER
  ```python
  op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'PENDING_OWNER'")
  ```

**2) 가입 라우터 변경** — `backend/app/routers/auth.py`
```python
role_to_save = "PENDING_OWNER" if body.role == "OWNER" else body.role
user = User(..., role=role_to_save)
```

**3) ADMIN 승인 라우터 신설** — `backend/app/routers/admin.py`
```python
@router.post("/users/{user_id}/approve-owner", dependencies=[Depends(admin_required)])
async def approve_owner(user_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    user = await db.get(User, user_id)
    if user.role != "PENDING_OWNER":
        raise HTTPException(400, detail={"code":"NOT_PENDING"})
    user.role = "OWNER"
    return Response(data=UserOut.model_validate(user))
```

**4) 프론트 변경**
- `src/pages/Signup.tsx`: 체육관 파트너 선택 시 "운영팀 승인 후 활성화" 안내 문구
- `src/components/RequireRole.tsx`: PENDING_OWNER인 경우 별도 안내 페이지 (`/owner/pending`) 라우팅
- 새 페이지 `src/pages/OwnerPending.tsx`: 승인 대기 안내 + 운영팀 연락처
- `src/pages/Ops.tsx`에 PENDING_OWNER 목록 + 승인 버튼 섹션 추가

### 검증
```bash
# 1) OWNER로 회원가입 → /auth/me 확인 시 role=PENDING_OWNER
# 2) /owner 진입 시 OwnerPending 페이지로 리다이렉트
# 3) ADMIN 로그인 → /ops에서 승인 버튼 클릭 → DB의 role이 OWNER로 변경
# 4) 사용자 재로그인 → /owner 정상 진입
```

---

## 3. 비밀번호 재설정 (1일 작업)

### 왜
현재 비밀번호 분실 시 ADMIN이 DB 수동 변경 외엔 방법 없음. 실 사용자 서비스에 필수.

### 무엇을 / 어떻게

**1) DB 테이블 신설** — `backend/app/models/password_reset.py`
```python
class PasswordReset(Base):
    __tablename__ = "password_resets"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(255), nullable=False)  # 평문 저장 X
    expires_at: Mapped[datetime] = mapped_column(nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
```
Alembic migration 추가.

**2) 라우터 신설** — `backend/app/routers/auth.py`
```python
@router.post("/password/forgot")
@limiter.limit("3/minute")  # 이메일 폭탄 방지
async def forgot_password(request: Request, body: ForgotRequest, db: ...):
    user = await db.execute(select(User).where(User.email == body.email))
    # 보안: 이메일 존재 여부 노출 금지 → 성공/실패 동일 응답
    if user_obj := user.scalar_one_or_none():
        token = secrets.token_urlsafe(32)
        token_hash = hash_password(token)  # bcrypt
        reset = PasswordReset(
            user_id=user_obj.id,
            token_hash=token_hash,
            expires_at=datetime.utcnow() + timedelta(hours=1),
        )
        db.add(reset)
        # TODO: 이메일 전송 (개발 단계는 콘솔 로그 / 나중 SES·SendGrid)
        print(f"[DEV] Password reset link: /reset-password/{reset.id}/{token}")
    return Response(data={"message": "이메일을 확인해주세요"})

@router.post("/password/reset")
async def reset_password(body: ResetRequest, db: ...):
    reset = await db.get(PasswordReset, body.reset_id)
    if not reset or reset.used_at or reset.expires_at < datetime.utcnow():
        raise HTTPException(400, detail={"code":"INVALID_OR_EXPIRED_TOKEN"})
    if not verify_password(body.token, reset.token_hash):
        raise HTTPException(400, detail={"code":"INVALID_TOKEN"})
    validate_password_policy(body.new_password)
    user = await db.get(User, reset.user_id)
    user.hashed_password = hash_password(body.new_password)
    reset.used_at = datetime.utcnow()
    return Response(data={"message": "비밀번호가 변경되었습니다"})
```

**3) 프론트**
- `src/pages/ForgotPassword.tsx`: 이메일 입력 → `authApi.forgotPassword(email)`
- `src/pages/ResetPassword.tsx`: URL params로 `reset_id`, `token` 받음 → 새 비밀번호 입력
- `src/lib/api.ts`에 `authApi.forgotPassword`, `authApi.resetPassword` 추가
- `src/pages/Login.tsx` 하단에 "비밀번호 찾기" 링크

**4) 이메일 발송**
- 개발: 콘솔 로그
- 프로덕션: SendGrid / AWS SES / Resend 중 택1
  - `pip install sendgrid` 또는 `boto3`
  - 환경변수 `SENDGRID_API_KEY` 또는 `AWS_*` 추가

### 검증
```bash
curl -X POST http://localhost:8000/auth/password/forgot -d '{"email":"user@basket.kr"}'
# Docker 로그에서 reset 링크 확인
docker compose logs api | grep "Password reset link"

curl -X POST http://localhost:8000/auth/password/reset -d '{"reset_id":"...","token":"...","new_password":"newpass1234"}'
# 새 비밀번호로 로그인 가능 확인
```

---

## 4. Refresh Blacklist를 Redis로 이전 (배포 시점)

### 왜
현재 `_revoked_jti: set[str]` (utils/security.py:86)는 **프로세스 메모리**. 다음 두 상황에서 무력화:
- Railway/Render는 컨테이너 재시작 빈번 → 재시작 시 blacklist 초기화 → 탈취된 refresh 토큰 무한 재사용 가능
- workers ≥ 2 또는 다중 인스턴스 → 각 워커가 독립적인 set → 한쪽에서만 차단

### 무엇을 / 어떻게
**1) 의존성 추가** — `backend/pyproject.toml`
```toml
dependencies = [..., "redis>=5.0.0"]
```

**2) `backend/app/utils/security.py` 수정**
```python
import redis.asyncio as redis
from app.config import settings

_redis = redis.from_url(settings.redis_url, decode_responses=True)

async def revoke_jti(jti: str, ttl_seconds: int = 60 * 60 * 24 * 30):
    # 30일 (refresh token 유효기간과 동일) 후 자동 만료
    await _redis.setex(f"jti:revoked:{jti}", ttl_seconds, "1")

async def is_jti_revoked(jti: str) -> bool:
    return await _redis.exists(f"jti:revoked:{jti}") > 0
```

**3) `backend/app/config.py`**
```python
redis_url: str = "redis://localhost:6379/0"
```

**4) `backend/app/routers/auth.py`**: `await revoke_jti(...)`로 변경 (지금은 동기)

**5) 인프라**: Railway "Add Service" → Redis. `REDIS_URL` 환경변수 자동 주입.

### 검증
- 컨테이너 재시작(`docker compose restart api`) 후에도 이전에 사용된 refresh 토큰이 401로 거부되어야 함
- `redis-cli KEYS "jti:revoked:*"` 로 키 확인

---

## 5. 감사 로그 자동 기록 (0.5일 작업)

### 왜
운영자/관리자가 어떤 예약을 언제 확정·취소했는지 추적 불가. 분쟁 시 입증 어려움. `audit_logs` 테이블은 이미 존재 (Phase 1에서 생성).

### 무엇을 / 어떻게

**1) 의존성 함수** — `backend/app/dependencies/audit.py` 신규
```python
async def write_audit_log(
    user: User, action: str, target_type: str, target_id: UUID, db: AsyncSession,
    metadata: dict | None = None,
):
    log = AuditLog(
        actor_user_id=user.id, action=action,
        target_type=target_type, target_id=target_id,
        metadata=metadata or {},
    )
    db.add(log)
```

**2) 적용 대상 라우터**
- `backend/app/routers/owner.py`: `mark_checked`, `mark_confirmed`, `mark_cancelled` 각각 끝에 호출
- `backend/app/routers/admin.py`: `hide_review`, `restore_review`, (신규) `approve_owner`
- `backend/app/routers/gyms.py`: `update_pricing_policy`, `update_payment_methods`, `patch_slot`

**3) 조회 라우터** (선택)
- `GET /admin/audit-logs?actor_id=&target_type=&from=&to=` — ADMIN 전용

### 검증
```sql
-- 운영자가 예약 확정 후
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5;
-- actor_user_id, action='RESERVATION_CONFIRMED', target_id 확인
```

---

## 6. CSRF (선택, 우선순위 낮음)

### 왜 / 안 해도 되는 이유
현재 인증은 **JWT를 Authorization 헤더로 전송**. 브라우저는 cross-origin 요청 시 자동으로 Authorization 헤더를 붙이지 않으므로 CSRF 위험 거의 없음.

### 언제 필요해지나
- 인증을 **HttpOnly 쿠키 기반**으로 변경 시 → fastapi-csrf-protect 같은 라이브러리 도입
- 지금 구조 유지하면 우선순위 가장 낮음

---

## 작업 우선순위 요약

| 순위 | 항목 | 소요 | 트리거 |
|---|---|---|---|
| 1 | Refresh jti 누락 방어 | 5분 | 즉시 |
| 2 | OWNER 가입 승인 플로우 | 0.5일 | 첫 OWNER 사용자 모집 전 |
| 3 | 감사 로그 자동 기록 | 0.5일 | 운영 시작 전 |
| 4 | 비밀번호 재설정 | 1일 | 베타 출시 전 |
| 5 | Redis blacklist | 0.5일 | Railway/Render 배포 시 |
| 6 | CSRF | (안 함) | 쿠키 인증 전환 시 |
