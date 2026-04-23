# Basket 남은 작업 목록 (TODO)

> 작성일: 2026-04-23
> 기준 문서: `docs/PROGRESS_HANDOVER.md`, `docs/SECURITY_TODO.md`, `docs/DEPLOYMENT_GUIDE.md`

이 문서는 **"지금 시점에서 남은 일만"** 우선순위·예상 시간·체크리스트 형태로 정리한 작업 가이드입니다.

---

## 🟢 최근 완료된 작업 (2026-04-23)

| 항목 | 파일 | 상태 |
|---|---|---|
| Refresh token `jti` 강제 검증 (보안 패치) | `backend/app/routers/auth.py:94-105` | ✅ |
| OWNER 가입 승인 플로우 (PENDING_OWNER) | `backend/app/models/user.py`, `backend/app/routers/auth.py`, `backend/app/routers/admin.py` | ✅ |
| Alembic migration: `PENDING_OWNER` enum 추가 | `backend/alembic/versions/9d39ba6afb52_add_pending_owner_role.py` | ✅ |
| Signup 에러 메시지 개선 (Pydantic 422 detail 파싱) | `src/pages/Signup.tsx` | ✅ |
| `OwnerPending.tsx` 신규 페이지 | `src/pages/OwnerPending.tsx`, `src/App.tsx` | ✅ |
| Ops 콘솔에 PENDING_OWNER 승인/반려 UI | `src/pages/Ops.tsx` | ✅ |
| Kakao Map 통합 (Busan 페이지 풀스크린) | `src/pages/Busan.tsx` | ✅ |
| Home 페이지 미니 Kakao Map 프리뷰 + 전체보기 라우팅 | `src/pages/Home.tsx` | ✅ |

---

## 📋 우선순위별 남은 작업

### 🔴 [우선순위 1] 배포 — Render + Vercel (예상 1일)

> 사용자 선택: Render (Railway 대신). 자세한 단계는 `docs/DEPLOYMENT_GUIDE.md` 참고.

#### 1-1. Git 원격 저장소 준비
- [ ] GitHub repo 생성 (private 추천 초기에는)
- [ ] `git remote add origin ...`
- [ ] `git push -u origin main`
- [ ] `.env`, `.env.production` 이 `.gitignore` 에 포함됐는지 확인

#### 1-2. Render — 백엔드 배포
- [ ] **PostgreSQL** 인스턴스 생성 (Free 플랜 90일 만료 주의)
  - 또는 Supabase free tier (영구) 권장
- [ ] **Web Service** 생성, GitHub 연동
  - Root Directory: `backend`
  - Build Command: `pip install -e .`
  - Start Command: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] **환경변수 등록** (Render 대시보드)
  ```
  DATABASE_URL=<Render Postgres internal url>
  JWT_SECRET_KEY=<python -c "import secrets; print(secrets.token_hex(32))" 결과>
  ENVIRONMENT=production
  CORS_ORIGINS=https://<vercel-host>.vercel.app
  ```
- [ ] 배포 후 `https://<render-host>/health` 응답 확인
- [ ] 첫 ADMIN 계정 생성: Render Shell 에서
  ```bash
  docker compose 없이 직접 python REPL
  python -c "
  from app.database import async_session
  from app.models.user import User
  from app.utils.security import hash_password
  import asyncio
  async def main():
      async with async_session() as db:
          u = User(email='admin@basket.kr', password_hash=hash_password('변경하세요!1'), role='ADMIN', display_name='Admin')
          db.add(u); await db.commit()
  asyncio.run(main())
  "
  ```

#### 1-3. Vercel — 프론트 배포
- [ ] GitHub repo 연결, Vite 자동 감지
- [ ] **환경변수**
  ```
  VITE_API_BASE_URL=https://<render-host>
  VITE_KAKAO_MAP_KEY=8fade4d9f3cbbf9db0a148aab08a8dc0
  ```
- [ ] `vercel.json` 추가 (SPA rewrite)
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
  ```
- [ ] 배포 도메인 확보 후 **Render 의 `CORS_ORIGINS` 업데이트** → 백엔드 재배포
- [ ] **Kakao 콘솔에 Vercel 도메인 등록** (도메인 제한 사용 시)

#### 1-4. 배포 검증 (smoke test)
- [ ] `curl -I https://<render>/health` → 보안 헤더 5종 포함
- [ ] 로그인 11회 → 429 (rate limit 동작)
- [ ] 회원가입 → 로그인 → JWT 발급
- [ ] Vercel 도메인에서 Home 지도 로드

---

### 🟠 [우선순위 2] 백엔드 테스트 작성 — Phase 6 (예상 1~2일)

회귀 방지. 배포 후에도 늦지 않으나 **CI 에 포함하면 자동 검증** 가능.

#### 2-1. pytest 환경 세팅
- [ ] `backend/tests/conftest.py`
  - 테스트 전용 sqlite 메모리 DB 또는 별도 pg 스키마
  - `client`, `db_session` fixture
  - `user_token`, `owner_token`, `admin_token`, `pending_owner_token` 토큰 fixture
- [ ] `backend/pyproject.toml` 에 `[tool.pytest.ini_options]` 추가

#### 2-2. 인증 테스트 (`tests/test_auth.py`)
- [ ] signup 정상 / 중복 이메일 409 / 패스워드 정책 위반 422
- [ ] login 정상 / 잘못된 비밀번호 401
- [ ] login rate limit (11회 → 429) — 단, slowapi storage 리셋 필요
- [ ] refresh 정상 / 재사용 시 401 / `jti` 없는 토큰 401
- [ ] OWNER 가입 시 role=PENDING_OWNER 저장 확인

#### 2-3. 권한 테스트 (`tests/test_authorization.py`)
- [ ] USER 가 owner endpoint 호출 → 403
- [ ] PENDING_OWNER 가 owner endpoint 호출 → 403
- [ ] ADMIN 의 approve-owner → role=OWNER 변경 확인

#### 2-4. 예약 플로우 (`tests/test_reservations.py`)
- [ ] 슬롯 예약 생성 → AWAITING_TRANSFER
- [ ] 사용자가 송금 완료 표시 → TRANSFER_SUBMITTED
- [ ] OWNER 가 mark-verified → OWNER_VERIFIED
- [ ] OWNER 가 mark-confirmed → CONFIRMED
- [ ] 동시 예약 충돌 (동일 슬롯, 두 유저) → 한 명만 성공

#### 2-5. 프론트 E2E 체크리스트 (`docs/TEST_CHECKLIST.md` 신규)
수동 체크리스트로 충분. Playwright 도입은 선택.

---

### 🟡 [우선순위 3] 추가 보안 강화 (배포 후)

#### 3-1. 비밀번호 재설정
- [ ] DB: `password_resets` 테이블 (token, user_id, expires_at) — Alembic migration
- [ ] `POST /auth/password/forgot` — 이메일 발송 (개발 단계는 console log)
- [ ] `POST /auth/password/reset` — 토큰 검증 후 비밀번호 변경
- [ ] 프론트 `/forgot-password`, `/reset-password/:token` 라우트
- [ ] (배포 시) SMTP 또는 SendGrid 연동

#### 3-2. Refresh blacklist Redis 이전
- [ ] Render Redis addon 또는 Upstash 무료 Redis 연결
- [ ] `backend/app/utils/security.py` 의 `_revoked_jti` set → `redis-py` async client
- [ ] TTL: refresh token 만료시간(7일)과 동일하게 설정

#### 3-3. 감사 로그 (audit_log) 자동 기록
- [ ] FastAPI 의존성으로 `record_audit(action, target_id, user)` 데코레이터/dependency 작성
- [ ] Owner mark-* 액션, Admin hide/restore 액션, approve-owner/reject-owner 에 적용

#### 3-4. CSRF (선택)
- 현재 JWT + Bearer 헤더 조합이라 CSRF 위험 낮음. 쿠키 기반 인증으로 전환 시에만 검토.

---

### 🔵 [우선순위 4] Organizer 도메인 신규 구현 (예상 2~3일)

`src/pages/Organizer.tsx` 는 **목업 그대로**. 백엔드 라우터 없음.

#### 4-1. ERD 확장
- [ ] `events` 테이블: id, organizer_user_id, place_ref(외부 링크 or outdoor_spot_id), title, description, date, start_time, end_time, capacity, fee, status (OPEN/FULL/CLOSED/CANCELLED)
- [ ] `event_participants` 테이블: id, event_id, user_id, status (PENDING/ACCEPTED/REJECTED/CANCELLED), requested_at
- [ ] Alembic migration

#### 4-2. 백엔드 라우터 `organizer.py`
- [ ] `POST /organizers/events` (ORGANIZER 만)
- [ ] `GET /organizers/me/events`
- [ ] `GET /events/{id}`
- [ ] `POST /events/{id}/join`
- [ ] `GET /organizers/events/{id}/participants`
- [ ] `POST /organizers/events/{id}/participants/{user_id}/accept|reject`

#### 4-3. 프론트
- [ ] `Organizer.tsx` 실제 API 연동
- [ ] `/events/:id` 참가 신청 화면 (선택)

#### 4-4. ORGANIZER 역할 부여
- [ ] ADMIN 이 Ops 콘솔에서 USER → ORGANIZER 승급 UI (현재 OWNER 승인과 유사)

---

### ⚪ [우선순위 5] UX 보강 (여유 있을 때)

- [ ] **MyPage**: 비밀번호 변경, 알림 설정, 회원 탈퇴 UI
- [ ] **이미지 업로드**: 체육관/야외 갤러리, 리뷰 사진
  - S3 presigned URL (config.py 에 key 자리는 이미 있음)
  - 또는 Cloudinary 무료 플랜
- [ ] **OWNER 온보딩**: 입점 신청 시 주소·사진·소개 직접 입력 → 운영진이 검토
- [ ] **알림**: 예약 상태 변경 시 이메일/Push (Phase 7 후)

---

## 🗓 추천 진행 순서

1. **이번 주**: Render + Vercel 배포 → 실제 도메인에서 동작 확인
2. **다음 주**: 백엔드 pytest + GitHub Actions CI
3. **그 다음**: 추가 보안 (비밀번호 재설정, Redis blacklist, audit log)
4. **여유 시**: Organizer 도메인, 이미지 업로드, MyPage 보강

## 📞 막혔을 때 참고

| 영역 | 문서 |
|---|---|
| 보안 항목 상세 | `docs/SECURITY_TODO.md` |
| 배포 단계별 가이드 | `docs/DEPLOYMENT_GUIDE.md` |
| 전체 아키텍처/현황 | `docs/PROGRESS_HANDOVER.md` |
| 다음 단계 가이드 | `docs/NEXT_STEPS_GUIDE.md` |
| 로드맵 | `docs/DEVELOPMENT_ROADMAP.md` |
