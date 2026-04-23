# Basket 프로젝트 진행사항 & 인수인계 가이드

> 작성일: 2026-04-22
> 작성자: (이어받는 팀원을 위해)
> 관련 문서: `docs/PRD.md`, `docs/PRD_V2.md`, `docs/ERD.md`, `docs/BACKEND_DATA_IA.md`, `docs/DEVELOPMENT_ROADMAP.md`, `docs/NEXT_STEPS_GUIDE.md`

이 문서는 **"지금 즉시 개발을 이어받을 수 있도록"** 현재까지 완료된 내용, 다음에 해야 할 일, 주의사항을 한 페이지로 정리한 핸드오버 가이드입니다.

---

## 1. 현재 프로젝트 단계

로드맵(`DEVELOPMENT_ROADMAP.md`) 기준:

| Phase | 이름 | 상태 | 비고 |
|---|---|---|---|
| 0 | 환경 재정비 & 로컬 구동 | ✅ 완료 | Docker 기동, dev 서버, 로그인 동작 |
| 1 | 연동 ① 조회계 (Read) | ✅ 완료 | 홈·체육관·야외 상세 API 교체 |
| 2 | 연동 ② 인증/가입 | ✅ 완료 | 회원가입 연동, AuthGuard, Access Denied UX |
| 3 | 연동 ③ 트랜잭션 (Write) | ✅ 완료 | 예약 생성 → Success → 내 예약 |
| 4 | 연동 ④ 운영자/관리자 | ✅ 완료 | Owner 대시보드·예약·결제수단, Ops 리뷰 모더레이션 |
| 4+ | OwnerSchedule / OwnerPricingPolicy | ✅ 완료 | 시간표 편집, 가격 정책 CRUD |
| **5** | **보안 하드닝** | ✅ **방금 완료** | rate limit, 보안 헤더, refresh rotation, 패스워드 정책 |
| 6 | 테스트 작성 | ❌ 미착수 | pytest + E2E 체크리스트 필요 |
| 7 | 배포 (Vercel + Railway) | ❌ 미착수 | HTTPS + env 관리 + CI |
| (별도) | Organizer (픽업 모집) | ❌ 설계 대기 | 백엔드 도메인 신규 필요 |

**진행률: 8/11 (73%)** — 기능 개발의 대부분은 끝났고, 남은 것은 **테스트·배포**와 **Organizer 신규 도메인**입니다.

---

## 2. 오늘(2026-04-22) 변경 요약

### 2-1. 버그 픽스
- `src/pages/Owner.tsx` "운영팀에 체육관 등록 문의" 버튼이 `window.open('mailto:', '_blank')` 으로 인해 브라우저 라우팅이 튀던 이슈 해결.
  - 연락처 모달(UI) 안에서 이메일 주소·카카오톡 링크를 **복사·메일앱 실행** 2단으로 분리.
  - `navigator.clipboard` + `execCommand` 폴백 처리.

### 2-2. Phase 4+ : OWNER 스케줄/가격 풀 스택 연동
- **신규 라우트**
  - `/owner/schedule` → `src/pages/OwnerSchedule.tsx` (신규)
  - `/owner/pricing-policy` → `src/pages/OwnerPricingPolicy.tsx` (신규)
- **src/lib/api.ts**: `createRepeatRule`/`patchRepeatRule`/`deleteRepeatRule`, `createExceptionRule`/`patchExceptionRule`/`deleteExceptionRule` 추가
- **OwnerPricingPolicy**: 기본·주말 시간당 요금, 단체 할인(임계 인원·%·고정액·당일 한정), 클라이언트 검증, 미리보기 계산
- **OwnerSchedule**: 월 캘린더 → 일자 탭 → slot drawer (상태 토글 + 가격 override), 반복 규칙·예외 날짜 CRUD 탭
- **Owner.tsx**: Phase 5 준비 중 배너 제거 + 빠른 액션 4버튼 그리드 (예약/시간표/가격/결제)

### 2-3. Contract Drift 수정
- DB enum `repeat_rule_type` 은 `CLASS`/`REGULAR` 만 허용. 프론트 초안의 `CLOSED` 옵션을 제거. 휴관은 `exception_rules` 로만 관리하는 설계에 맞춰 UI 안내 보강.

### 2-4. Phase 5 : 보안 하드닝 (백엔드)
| 항목 | 파일 | 내용 |
|---|---|---|
| Rate limit | `backend/app/rate_limit.py`, `backend/app/routers/auth.py` | slowapi, `/auth/login` 10/min, `/auth/signup` 5/min, `/auth/refresh` 20/min |
| 보안 헤더 | `backend/app/middleware/security.py` | X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, prod-only HSTS |
| Refresh rotation | `backend/app/utils/security.py` + `routers/auth.py` | 모든 JWT 에 `jti` 부여, refresh 사용 즉시 `_revoked_jti` 등록, 재사용 시 401 `TOKEN_REUSED` |
| 패스워드 정책 | `backend/app/utils/security.py` `validate_password_policy()` | 8자+ & 영문 포함 & 숫자 포함 |
| Production 검증 | `backend/app/main.py` lifespan | `ENVIRONMENT=production` 에서 `JWT_SECRET_KEY` 가 기본값이면 기동 차단 |
| CORS | (기존) `backend/app/config.py` | 이미 `settings.cors_origins` 로 환경변수화됨 |

#### 검증 결과 (E2E)
- 보안 헤더 5종 모두 응답에 포함 ✅
- 패스워드 정책: 영문만 / 숫자만 → 422 차단 ✅
- 로그인 rate limit: 11회째 429 ✅
- Refresh rotation: 동일 토큰 재사용 시 401 ✅, 새 토큰은 정상 ✅

---

## 3. 라우터별 기능 현황 (코드 단위)

### 3-1. 프론트 라우트 (src/App.tsx)

| 라우트 | 컴포넌트 | 권한 | 상태 |
|---|---|---|---|
| `/` | Home | public | ✅ 실데이터 |
| `/login` | Login | public | ✅ 실데이터 |
| `/signup` | Signup | public | ✅ 실데이터 (`?as=OWNER` 지원) |
| `/access-denied` | AccessDenied | public | ✅ 실데이터 |
| `/gym/:id` | GymDetail | public | ✅ 실데이터 |
| `/outdoor/:id` | OutdoorSpotPage | public | ✅ 실데이터 |
| `/search` | Search | auth | ✅ 실데이터 |
| `/checkout` | Checkout | auth | ✅ 실데이터 |
| `/success` | Success | auth | ✅ 실데이터 |
| `/my-reservations` | MyReservations | auth | ✅ 실데이터 |
| `/mypage` | MyPage | auth | ✅ 실데이터 |
| `/owner` | Owner | OWNER/ADMIN | ✅ 실데이터 |
| `/owner/reservations` | OwnerReservations | OWNER/ADMIN | ✅ 실데이터 |
| `/owner/payment-methods` | OwnerPaymentMethods | OWNER/ADMIN | ✅ 실데이터 |
| `/owner/schedule` | **OwnerSchedule** | OWNER/ADMIN | ✅ **오늘 신규** |
| `/owner/pricing-policy` | **OwnerPricingPolicy** | OWNER/ADMIN | ✅ **오늘 신규** |
| `/ops` | Ops | ADMIN/OPS | ✅ 실데이터 + 모크 debug 콘솔 |
| `/ops/reviews` | OpsReviews | ADMIN/OPS | ✅ 실데이터 |
| `/organizer` | Organizer | (권한 미설정) | ❌ **목업 그대로** |

### 3-2. 백엔드 라우터 (backend/app/routers/)

| 파일 | prefix | 주요 endpoint | 상태 |
|---|---|---|---|
| `auth.py` | `/auth` | signup, login, refresh (rotation), me | ✅ 완료 + Phase 5 하드닝 |
| `places.py` | `/places` | home-map-summary | ✅ 완료 |
| `gyms.py` | `/gyms` | detail, gallery, pricing-policy, calendar, payment-methods, repeat-rules, exception-rules, slot PATCH | ✅ 완료 |
| `outdoors.py` | `/outdoors` | detail, gallery, review-summary, reviews, review-form-metadata, 리뷰 POST | ✅ 완료 |
| `reservations.py` | `/reservations` | create, get, timeline, transfer-done, my/list | ✅ 완료 |
| `owner.py` | `/owners` | me/dashboard, me/reservations, reservations/{id}/mark-* | ✅ 완료 |
| `admin.py` | `/admin` | reviews, review photos, hide/restore | ✅ 완료 |
| `organizer.py` | `/organizers` | (없음) | ❌ **설계 대기** |

---

## 4. 남은 개발 리스트 (우선순위)

### [우선순위 1] Phase 6 — 테스트 작성 (예상 1~2일)

**왜 지금?** 기능은 다 있지만 회귀 테스트가 전무해서 다음 리팩토링 시 무엇이 깨졌는지 확인 불가.

- [ ] **백엔드 pytest 세팅**
  - `backend/tests/conftest.py`: 테스트 전용 DB (sqlite 메모리 또는 별도 pg 스키마)
  - fixture: `client`, `owner_token`, `user_token`, `admin_token`
  - 인증 케이스: 정상/잘못된 비밀번호/rate limit/refresh rotation/패스워드 정책
  - 예약 플로우: AWAITING_TRANSFER → TRANSFER_SUBMITTED → OWNER_VERIFIED → CONFIRMED
  - 권한: USER 가 owner endpoint 접근 → 403
- [ ] **프론트 E2E 체크리스트** (Playwright 또는 수동 체크리스트 `docs/TEST_CHECKLIST.md`)
  - 회원가입 → 로그인 → 체육관 탐색 → 예약 → 입금확인 → 내 예약 확인
  - OWNER 로그인 → 대시보드 → 예약 관리 → 시간표 편집 → 가격 정책 저장
  - ADMIN 로그인 → 리뷰 모더레이션 hide/restore

### [우선순위 2] Phase 7 — 배포 (예상 0.5~1일)

- [ ] **Railway 백엔드 배포**
  - PostgreSQL 16 인스턴스 생성
  - 환경변수: `DATABASE_URL`, `JWT_SECRET_KEY` (랜덤 32바이트 hex), `ENVIRONMENT=production`, `CORS_ORIGINS`
  - Alembic migration 자동 실행: `alembic upgrade head`
  - `/health` 응답 확인
- [ ] **Vercel 프론트 배포**
  - `VITE_API_BASE_URL=https://<railway-host>`
  - `vercel.json` rewrite 규칙 (선택)
- [ ] **CI/CD** (선택)
  - GitHub Actions: PR 시 `npx tsc --noEmit` + pytest

### [우선순위 3] Organizer 도메인 (예상 2~3일)

**현 상태**: `src/pages/Organizer.tsx` 는 **목업**. 백엔드 라우터 없음. `user.role = ORGANIZER` enum 값만 존재.

**설계 작업 필요**:
1. **데이터 모델 (ERD 확장)**
   - `events` 테이블: id, organizer_user_id, place_ref (외부 장소 링크 or outdoor_spot_id), title, description, date, start_time, end_time, capacity, fee, status (OPEN/FULL/CLOSED/CANCELLED), created_at
   - `event_participants` 테이블: id, event_id, user_id, status (PENDING/ACCEPTED/REJECTED/CANCELLED), requested_at
   - Alembic migration 추가
2. **백엔드 라우터 `organizer.py`**
   - `POST /organizers/events` — 이벤트 생성 (ORGANIZER 만)
   - `GET /organizers/me/events` — 내 이벤트 리스트
   - `GET /events/{id}` — 이벤트 상세 (모두 조회 가능)
   - `POST /events/{id}/join` — 일반 USER 가 참가 신청
   - `GET /organizers/events/{id}/participants` — 주최자가 신청자 목록
   - `POST /organizers/events/{id}/participants/{user_id}/accept` / `reject`
3. **프론트 연동**
   - `Organizer.tsx` 실제 API 연동
   - (선택) `/events/:id` 참가 신청 화면
4. **ORGANIZER 역할 부여 플로우**
   - 현재 signup 은 USER/OWNER 만 선택 가능 → ADMIN 이 수동 승급하는 UI 필요 or 별도 승인

### [우선순위 4] 잔존 보안·하드닝 TODO

- [ ] **Refresh rotation blacklist → Redis/DB**: 현재 `_revoked_jti` 는 in-memory. 다중 인스턴스 확장 시 무효. Redis 연동 필수.
- [ ] **OWNER 가입 승인 플로우**: 지금은 signup 에서 role=OWNER 그대로 저장. PRD 의 "사장님 승인" 단계 구현 (PENDING_OWNER 상태 도입).
- [ ] **CSRF**: SPA + JWT 조합이라 상대적으로 우선순위 낮지만, 쿠키 기반으로 갈 경우 필요.
- [ ] **비밀번호 재설정 플로우**: 현재 없음. 이메일 발송·토큰·폼 필요.
- [ ] **감사 로그 (audit_log)**: 이미 테이블 존재. Owner/Admin 액션 기록 라우터 삽입 필요.

### [우선순위 5] UX 보강

- [ ] **MyPage**: 비밀번호 변경, 알림 설정, 회원 탈퇴 UI
- [ ] **이미지 업로드**: 체육관/야외 갤러리, 리뷰 사진 — 현재 URL 만 보이고 업로드 미구현. S3 presigned URL 사용 예정 (config.py 에 key 자리는 있음).
- [ ] **OWNER 온보딩**: NO_GYM 상태에서 주소·사진 등을 직접 입력해 파트너 신청 자료를 보낼 수 있게 (현재는 연락처 모달만 제공).

---

## 5. 로컬 개발 환경 재구동 체크리스트

```powershell
# 1) Docker (DB + API) 기동
cd backend
docker compose up -d
docker compose ps               # basket-db, basket-api 둘 다 Up 확인
docker compose exec api alembic current   # 최신 마이그레이션 적용되어 있는지

# 2) 프론트 dev 서버
cd ..
npm install                      # 처음이면
npm run dev                      # http://localhost:5173

# 3) 기본 계정
#   USER   user@basket.kr  / password123
#   OWNER  owner@basket.kr / password123
#   ADMIN  admin@basket.kr / password123
```

**주의**
- `.env` 파일은 커밋 금지 (`.gitignore` 적용 완료). 새 팀원은 `.env.example` 복사해서 시작.
- JWT secret 은 dev 에서 `change-me` 여도 무방하나, **프로덕션 배포 시 반드시 32바이트 hex 이상의 랜덤 값**으로 설정.
- 비밀번호 정책 변경(영문+숫자) 때문에 **기존 테스트 계정의 비밀번호가 정책을 만족하지 않는 경우** 새 signup 시 거절될 수 있으나, 기존 계정은 이미 해시 저장된 값으로 로그인 가능하므로 문제 없음.

---

## 6. 디버깅 & 운영 팁

### API 로그 보기
```powershell
docker compose logs api --tail 100 -f
docker compose logs api --tail 500 | Select-String -Pattern "ERROR|Traceback" -Context 0,10
```

### DB 직접 접속
```powershell
docker compose exec db psql -U basket_user -d basket
# \dt 로 테이블 목록, \d+ <table> 로 스키마 확인
```

### 자주 마주치는 에러
| 증상 | 원인 | 해결 |
|---|---|---|
| `ModuleNotFoundError: No module named 'psycopg2'` | dev extras 미설치 | `docker compose exec api pip install ".[dev]"` |
| `MultipleResultsFound` at owner endpoint | 소유 체육관 여러 개인데 `scalar_one_or_none()` 사용 | 이미 `scalars().all()` 로 수정됨 |
| `invalid input value for enum repeat_rule_type: "CLOSED"` | DB enum 은 CLASS/REGULAR 만 | CLOSED 는 exception-rules 로 관리 |
| `rate limit exceeded` | Phase 5 rate limit | 1분 기다리거나, 테스트에서는 slowapi storage 리셋 |

---

## 7. 파일별 간단 아키텍처 지도

```
backend/
├── app/
│   ├── main.py               ← 미들웨어 순서 중요: RateLimit → SecurityHeaders → CORS
│   ├── rate_limit.py         ← slowapi Limiter 싱글톤
│   ├── middleware/security.py ← 보안 헤더
│   ├── config.py             ← pydantic-settings, .env 로드
│   ├── database.py           ← async engine, get_db dependency
│   ├── dependencies/auth.py  ← JWT 검증 → User 주입, owner_required, admin_required
│   ├── utils/security.py     ← bcrypt, JWT encode/decode, jti blacklist, 패스워드 정책
│   ├── models/               ← SQLAlchemy ORM
│   ├── schemas/              ← Pydantic request/response
│   └── routers/              ← FastAPI 라우터 7개
└── alembic/                  ← DB 마이그레이션

src/
├── App.tsx                   ← RequireAuth / RequireRole 라우트 가드
├── context/
│   ├── AuthContext.tsx       ← 로그인 상태, 토큰 저장
│   └── ToastContext.tsx
├── lib/api.ts                ← Axios client + 모든 API 함수 + TypeScript 타입
├── components/
│   ├── RequireAuth.tsx       ← 인증 가드 (403 시 /access-denied 로 리다이렉트)
│   └── Header, BottomNav ...
└── pages/                    ← 라우트별 페이지
```

---

## 8. git push 전에 한 번 더 확인할 것

- [ ] `git status` 로 `.env`, `backend/.env`, `node_modules/`, `dist/`, `__pycache__/` 가 포함되지 않았는지 확인 (이미 `.gitignore` 처리됨)
- [ ] `npx tsc --noEmit` 에러 0 ✅
- [ ] `docker compose exec api python -c "from app.main import app; print('OK')"` 로 백엔드 import 에러 없는지 확인
- [ ] 이번 PR 범위 요약:
  - Phase 4+ (OwnerSchedule / OwnerPricingPolicy) 신규
  - Phase 5 보안 하드닝 (rate limit, 보안 헤더, refresh rotation, 패스워드 정책)
  - `Owner.tsx` 문의 버튼 라우팅 이슈 fix

### 추천 커밋 메시지 분할
```
1. fix(owner): mailto window.open으로 인한 SPA 라우팅 이슈 → 연락처 모달로 교체
2. feat(owner): OwnerSchedule/OwnerPricingPolicy 신규 페이지 + 관련 API 연동
3. feat(security): Phase 5 하드닝 (rate limit, 보안 헤더, refresh rotation, 패스워드 정책)
4. docs: PROGRESS_HANDOVER.md 인수인계 문서 추가
```

혹은 하나의 큰 PR 로 묶어 "Phase 4+ & Phase 5: OWNER schedule/pricing + security hardening" 로 올리고, 본문에 위 4 항목을 나열해도 됨.

---

## 9. 질문이 생기면

1. **기존 라우터 동작**: `docs/BACKEND_DATA_IA.md` + 코드 먼저 읽기 → 애매하면 Swagger UI (`http://localhost:8000/docs`) 에서 직접 호출
2. **프론트 상태 관리**: `AuthContext` / `MockProvider` (debug 용) / `ToastContext` 3축. 새 전역 상태 추가 전에 기존 3개로 해결 가능한지 확인
3. **Contract drift** 의심 시: 프론트 Axios 요청/응답을 Network 탭에서 실제로 확인 → 백엔드 모델·스키마와 1:1 매칭되는지 점검

행운을 빕니다.
