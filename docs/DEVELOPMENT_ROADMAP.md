# Basket 개발 로드맵 & 학습 가이드

> 작성일: 2026-04-22
> 대상: 3주 만에 프로젝트에 복귀한 본인(그리고 다음 팀원)
> 목적: **"지금 어디에 와 있고, 다음에 뭘 해야 하며, 왜 그 순서인지"** 를 10년차 엔지니어 관점으로 정리

---

## 0. 이 문서를 읽는 법

- 각 Phase 앞에 **학습 노트(Why)** 를 두고, 뒤에 **실행 체크리스트(What/How)** 를 둡니다.
- 처음 읽을 때는 Phase 0~2까지만 정독, 이후는 필요할 때 레퍼런스로 다시 펼쳐보세요.
- 체크박스(`- [ ]`)는 진행하면서 `- [x]`로 바꿔가세요. 이 문서 자체가 진행률 트래커입니다.

---

## 1. 지금 이 프로젝트가 서 있는 지점 (Mental Map)

소프트웨어 제품 개발의 표준 단계는 대략 아래와 같습니다.

```
① Discovery  →  ② PRD / Spec  →  ③ IA / ERD  →  ④ UI 목업  →  ⑤ API 계약(Contract)
    ↓
⑥ 백엔드 구현  →  ⑦ 프론트-백 연동  →  ⑧ 보안 하드닝  →  ⑨ 테스트
    ↓
⑩ 배포(CI/CD)  →  ⑪ 관측(Observability) / 운영
```

**현재 Basket 프로젝트의 위치:**

| 단계 | 상태 | 산출물 |
|---|---|---|
| ② PRD | ✅ 완료 | `docs/PRD.md`, `docs/PRD_V2.md` |
| ③ IA / ERD | ✅ 완료 | `docs/ERD.md`, `docs/BACKEND_DATA_IA.md` |
| ④ UI 목업 | ✅ 완료 | `src/pages/*.tsx` (JSON import 상태) |
| ⑤ API 계약 | ✅ 완료 | `src/lib/api.ts` + FastAPI Swagger |
| ⑥ 백엔드 구현 | ✅ 완료 | `backend/app/routers/*` 7개 라우터 |
| **⑦ 프론트-백 연동** | 🔶 **진행 중 (1/13 완료, 로그인만)** | — |
| ⑧ 보안 하드닝 | 🟡 베이스라인 있음, 프로덕션 보강 필요 | §4 참조 |
| ⑨ 테스트 | ❌ 미착수 | — |
| ⑩ 배포 | ❌ 미착수 (Vercel/Railway 둘 다 미연결) | — |
| ⑪ 관측 | ❌ 미착수 | — |

즉, **"⑦ 연동 페이즈의 초반"** 입니다. 그래서 이 로드맵은 ⑦을 쪼개서 설명하는 데 가장 많은 지면을 씁니다.

---

## 2. "보안 먼저 vs 기능 먼저" — 10년차의 대답

### 학습 노트

주니어가 흔히 빠지는 두 함정이 있어요.

- **함정 A: "보안 먼저 다 끝내고 기능 개발"** → 실제로는 어떤 위협이 현실화되는지 모른 채 오버엔지니어링만 함. 완벽한 보안을 구축하려다 2달이 녹고 기능은 0.
- **함정 B: "일단 기능 다 만들고 나중에 보안"** → 나중에 보안을 끼워넣으려 하면 인증/권한/데이터 모델 전제가 뒤집히며 대규모 리팩토링. "나중"은 오지 않음.

**정답은 2단계로 나누는 것입니다:**

1. **Secure by Default (Day 1부터)** — 깨지면 안 되는 최소 베이스라인. 인증·권한·시크릿 관리·입력 검증·HTTPS·ORM. 이건 "보안 기능"이 아니라 **아키텍처 결정**이라 나중에 바꾸기 매우 비쌈.
2. **Hardening (기능 완성 후)** — rate limiting, 보안 헤더, 패스워드 정책, refresh rotation, 감사 로그, WAF 등. 이건 **설정·미들웨어 레벨**이라 기능과 분리해서 막판에 얹을 수 있음.

> 우리 프로젝트는 이미 **1번(베이스라인)은 깔려 있음**. 따라서 지금 의사결정은 *"계속 기능 연동을 이어가고 하드닝은 배포 직전에"* 가 교과서적 정답.

---

## 3. 로드맵 전체 개요 (Phase 0 ~ 7)

각 Phase는 독립적으로 "끝났다"고 말할 수 있는 단위(= PR 단위)로 쪼갰습니다.

| Phase | 이름 | 예상 시간 | 목표 |
|---|---|---|---|
| 0 | 환경 재정비 & 로컬 구동 | 1~2h | 백엔드 Docker + 프론트 dev 서버 기동, 로그인 실동작 확인 |
| 1 | 프론트-백 연동 ① — 조회계(Read) | 1~2일 | 홈·체육관·야외 상세 페이지 API 교체 |
| 2 | 프론트-백 연동 ② — 인증/가입 | 0.5일 | 회원가입 API 연동 + AuthGuard 추가 |
| 3 | 프론트-백 연동 ③ — 트랜잭션(Write) | 1~2일 | 예약 생성 → Success → 내 예약 흐름 완성 |
| 4 | 프론트-백 연동 ④ — 운영자/관리자 | 1~2일 | Owner 대시보드, 예약 관리, 결제 수단, Ops |
| 5 | 보안 하드닝 | 1일 | 프로덕션 배포 전 보안 보강 (rate limit, 헤더, 정책) |
| 6 | 테스트 작성 | 1~2일 | 백엔드 pytest + 프론트 수동 E2E 체크리스트 |
| 7 | 배포 (Vercel + Railway) | 0.5~1일 | HTTPS 기반 프로덕션 환경 |

**총 예상 7~11일** (풀타임 기준). 수업 병행이면 2~3주로 여유 잡는 걸 권장.

---

## 4. 보안 베이스라인 — 실측 결과

실제 코드를 감사한 결과입니다. "이미 있다/없다"를 정확히 알고 시작해야 로드맵이 꼬이지 않습니다.

### 4-1. ✅ 이미 구현된 것 (건들 필요 없음)

| 항목 | 위치 | 설명 |
|---|---|---|
| JWT 액세스/리프레시 발급 | `backend/app/utils/security.py` | HS256, 만료시간 환경변수화 |
| bcrypt 비밀번호 해시 | `backend/app/utils/security.py` | `gensalt()`로 매번 새 salt |
| RBAC (역할 기반 접근 제어) | `backend/app/dependencies/auth.py` | `require_role("OWNER")` 팩토리 패턴 |
| 인증 의존성 주입 | `backend/app/dependencies/auth.py` | `get_current_user`, `get_optional_user` |
| CORS 화이트리스트 | `backend/app/main.py` | `settings.cors_origins` |
| SQL 인젝션 방어 | SQLAlchemy ORM 전역 | 파라미터 바인딩 자동 |
| 입력 검증 | FastAPI + Pydantic | 라우터 파라미터 자동 |
| Request ID 추적 | `backend/app/main.py` | `X-Request-ID` 헤더 |
| 공통 에러 포맷 | `backend/app/main.py` | 내부 스택 트레이스 노출 X |
| 시크릿 격리 | `backend/.env` | `.gitignore` 등록, pydantic-settings 로드 |
| HTTPBearer 스킴 | `backend/app/dependencies/auth.py` | Swagger에서 Authorize 버튼 동작 |

### 4-2. 🟡 Phase 5에서 추가할 것 (하드닝)

| 항목 | 우선순위 | 메모 |
|---|---|---|
| `JWT_SECRET_KEY` 프로덕션 값 교체 | 🔴 必 | 배포 전 랜덤 32바이트+ 생성. 지금 디폴트 `"change-me"`. |
| Rate limiting | 🔴 必 | `slowapi` 추가. 로그인/회원가입/리뷰 작성에 IP 기준 제한 |
| 비밀번호 정책 | 🟠 권장 | 8자↑, 영숫자 혼합 — pydantic validator |
| 로그인 실패 제한 | 🟠 권장 | 동일 이메일 5회/15분 초과 시 잠금 |
| Refresh token 회전 & 블랙리스트 | 🟠 권장 | 탈취 대응. DB 또는 Redis에 jti 저장 |
| 보안 헤더 | 🟠 권장 | `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security` |
| 에러 응답 환경별 분기 | 🟡 선택 | prod에서는 detail 숨김, dev에서는 노출 |
| 감사 로그 | 🟡 선택 | 예약 생성/취소, 권한 변경 같은 민감 액션 |
| localStorage 토큰 → httpOnly 쿠키 이관 | 🟡 선택 | XSS 대응으로 더 안전하나 구현 비용 큼. MVP 단계에선 유지 가능 |

### 4-3. 프론트엔드 보안 주의사항

- React는 기본 JSX 렌더링에서 **자동 escape** 하므로 XSS 안전. 단 `dangerouslySetInnerHTML`은 절대 금지.
- `VITE_*` 환경변수는 **번들에 그대로 박힘** = 공개 정보. 시크릿은 절대 넣지 말 것(API URL은 OK).
- 현재 `localStorage` 토큰 저장은 MVP로는 OK. XSS 하나만 나면 세션 탈취되므로 "XSS 취약점이 없다" 를 품질로 보장해야 함 → 사용자 입력이 HTML로 렌더되는 곳이 없는지 감사.

---

## 5. Phase 0 — 환경 재정비 & 로컬 구동 확인

### 학습 노트: 왜 이걸 먼저 해야 하나

3주 만에 돌아와서 가장 위험한 실수는 **"기억에 의존해 코드를 먼저 고치는 것"** 입니다. 10년차의 제1 원칙은 **"수정 전에 현재 상태를 재현(reproduce)하라"**. 로컬에서 목업이 정상 동작하는 걸 눈으로 먼저 확인해야, 이후 어떤 변경이 무엇을 깨뜨렸는지 판단할 수 있어요. 이걸 건너뛰면 버그의 인과관계를 영영 잃습니다.

### 체크리스트

- [ ] Docker Desktop 실행 중인지 확인
- [ ] `backend/.env` 파일 존재 확인 (없으면 `backend/.env.example`을 복사)
- [ ] `backend/` 에서 `docker compose up --build` 실행 → `http://localhost:8000/docs` 가 떠야 함
- [ ] 시드 데이터 주입: `docker compose exec api python -m scripts.seed`
- [ ] 프로젝트 루트에서 `npm install` → `npm run dev` → `http://localhost:5173`
- [ ] 브라우저에서 `/login` 이동 → `user@basket.kr` / `password123` 로그인
- [ ] 로그인 후 DevTools → Application → Local Storage 에 `access_token`이 저장되었는지 확인
- [ ] DevTools → Network 탭에서 `/auth/login` 과 `/auth/me` 호출이 200으로 떴는지 확인
- [ ] 각 페이지(`/`, `/gyms/:id`, `/checkout` 등)를 열어보고 **어떤 페이지가 목업 JSON으로 보이고 어떤 게 비어 보이는지 눈으로 메모**

### 예상되는 장애물

- Docker가 Windows에서 WSL2 백엔드로 돌지 않으면 `docker compose` 실패 → Docker Desktop 재시작 또는 WSL2 기본값 재설정
- 포트 충돌(5432, 8000, 5173) → `netstat -ano | findstr :5432` 로 점유 프로세스 확인 후 종료
- 마이그레이션이 안 되어 있으면 `/places` 가 500 → `docker compose exec api alembic upgrade head`

---

## 6. Phase 1 — 조회계(Read) 연동

### 학습 노트: 왜 Read 부터인가

**CRUD 중 Read가 가장 리스크가 낮습니다.** 실패해도 사용자 데이터가 망가지지 않고, 화면이 빈 채로 뜰 뿐입니다. 반대로 Write(생성/수정/삭제)는 중복 생성, 권한 우회, 롤백 불가 같은 실제 사고로 이어져요. 그래서 연동 작업은 **Read → Write → Admin Write** 순서로 진행하는 게 정석입니다.

또한 이 Phase에서 **"목업 JSON import 제거 → 훅으로 치환"** 이라는 리팩토링 패턴을 한 번 정립하면, 이후 모든 페이지에 같은 패턴을 복사해 쓸 수 있어서 속도가 급가속됩니다.

### 1-1. `src/pages/Home.tsx` 연동

**왜 첫 번째인가**: `src/hooks/usePlaces.ts`가 이미 완성되어 있어서 "훅 연결 + JSON import 제거"만 하면 됩니다. 워밍업용으로 최적.

- [ ] `import homeData from '../data/routes/home.json'` 제거
- [ ] `import { usePlaces } from '../hooks/usePlaces'` 추가
- [ ] 필터 state(구/장소유형/예약가능/할인)를 `usePlaces` 파라미터로 전달
- [ ] `isLoading` 시 스켈레톤/스피너 렌더링 처리
- [ ] `error` 시 빈 상태 UI (그리고 재시도 버튼) 처리
- [ ] 지도 요약은 `placesApi.homeMapSummary()` 로 별도 `useEffect`
- [ ] `useMock` 호출이 남아있으면 필요한 최소한만 유지 (역할 전환 등)
- [ ] 브라우저에서 구 필터를 바꿔가며 네트워크 탭에서 `/places?district=...` 호출이 실제로 달라지는지 확인

### 1-2. `src/pages/GymDetail.tsx` 연동

- [ ] `gymDetailData` JSON import 제거
- [ ] `useParams<{ gymId: string }>()` 로 gymId 획득
- [ ] `gymsApi.detail`, `gymsApi.pricingPolicy` 병렬 호출 (`Promise.all`)
- [ ] 달력 컴포넌트 월 변경 핸들러에서 `gymsApi.calendar(gymId, month, selectedDate)` 재호출
- [ ] 슬롯 클릭 → `navigate('/checkout', { state: { gymId, slotId, ... } })` 로 상태 전달
- [ ] 로딩/에러 처리

### 1-3. `src/pages/OutdoorSpotPage.tsx` 연동

- [ ] `outdoorData` JSON import 제거
- [ ] `outdoorsApi.detail`, `outdoorsApi.reviewSummary`, `outdoorsApi.reviews` 병렬 호출
- [ ] 정렬 옵션 변경 시 `outdoorsApi.reviews(id, { sort })` 재호출
- [ ] (선택) 리뷰 작성은 Phase 3에서 — 지금은 Read만

### 학습 포인트

- **`useEffect` 정리(cleanup)**: 컴포넌트가 언마운트되면 요청이 늦게 도착해도 `setState`하지 않도록 `ignore` 플래그 또는 `AbortController` 패턴을 쓰면 메모리 누수/경고 방지 가능.
- **병렬 호출 vs 순차 호출**: 서로 의존하지 않는 호출은 `Promise.all`로 묶어라. 네트워크 RTT 절약.
- **React key**: 리스트 렌더에서 `key={index}` 쓰지 말고 서버에서 온 `id` 써라. 정렬/필터 시 리렌더 오동작 방지.

---

## 7. Phase 2 — 회원가입 & 인증 가드

### 학습 노트

로그인 후에 접근해야 할 페이지들(내 예약, 운영자 등)이 로그인 안 해도 열리면 UX가 깨지고, 나중에 Phase 3에서 예약 생성하려 할 때 401이 튀어나오면서 사용자가 길을 잃습니다. **"인증이 필요한 페이지는 항상 같은 방식으로 보호"** 하는 패턴을 일찍 정립해두는 게 중요.

### 2-1. 회원가입

- [ ] `src/pages/Signup.tsx` 에 `useAuth`, `authApi` import
- [ ] 이름/이메일/비밀번호 controlled input으로 state 바인딩
- [ ] `handleSubmit`에서 `authApi.signup(email, password, displayName, phone)` 호출
- [ ] 성공 시 `login(email, password)` 로 자동 로그인
- [ ] 실패 시 에러 메시지 표시 (중복 이메일 등)
- [ ] OWNER 가입 플로우는 현재 프론트 폼이 bizNo만 받는데 백엔드 스키마가 수용 가능한지 확인 필요 → 안 되면 일단 USER만 연동하고 OWNER는 시드로만 테스트

### 2-2. 인증 가드 컴포넌트

- [ ] `src/components/RequireAuth.tsx` 신규 작성
  ```tsx
  const { isLoggedIn, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <Outlet />;
  ```
- [ ] `src/components/RequireRole.tsx` (역할 체크 래퍼)
- [ ] `App.tsx` 에서 보호 대상 라우트 감싸기 (`/my/*`, `/owner/*`, `/ops`, `/checkout`)

### 학습 포인트

- **인증 상태의 "로딩" 분기**: `isLoading`을 안 보고 `!isLoggedIn`만 체크하면 새로고침 직후 1프레임 동안 로그인 페이지로 튕기는 버그가 생김.
- **Redirect 시 `replace`**: 히스토리 오염 방지 (뒤로가기로 보호 페이지 복귀 시도 시 루프 방지).
- **민감 라우트는 프론트 가드만으로 보호 안 됨**: 백엔드가 항상 JWT를 검증해야 함. 프론트 가드는 UX 용.

---

## 8. Phase 3 — 예약 트랜잭션 연동

### 학습 노트: 왜 여기가 기술적으로 가장 중요한가

예약 생성은 **동시성(concurrency)** 이 걸리는 지점입니다. 같은 슬롯을 두 사람이 동시에 누르면 한 명만 성공해야 합니다. 이런 걸 처리하는 패턴이 **멱등성(idempotency)** 과 **낙관적/비관적 락**입니다.

가이드에 `idempotencyKey: crypto.randomUUID()` 를 넘기라고 쓰여 있는 이유가 이거예요. 같은 키로 두 번 요청하면 서버가 두 번째를 무시하고 첫 결과를 돌려줘야 합니다(= 네트워크 재시도 안전). 백엔드가 실제로 이걸 존중하는지 확인해야 합니다.

### 3-1. Checkout

- [ ] `Checkout.tsx` 에서 `location.state` 로부터 `gymId`, `slotId`, `date`, `timeLabel` 수신
- [ ] 입력 폼(팀명, 예약자명, 전화번호, 인원, 메모) 검증
- [ ] 제출 시점에 `idempotencyKey` 생성하여 state에 저장 (리렌더 시 재생성 방지)
- [ ] `reservationsApi.create(...)` 호출
- [ ] 성공 시 `navigate(\`/success?id=\${result.reservationId}\`, { replace: true })` — replace 로 뒤로가기 시 재결제 방지
- [ ] 에러 분기: 409(슬롯 점유) / 400(검증 실패) / 401(미인증) 별 다른 메시지

### 3-2. Success

- [ ] `URLSearchParams` 로 id 추출
- [ ] `reservationsApi.get(id)`, `reservationsApi.timeline(id)` 병렬 호출
- [ ] 타임라인 시각화 (PENDING → CHECKED → CONFIRMED)

### 3-3. MyReservations

- [ ] `reservationsApi.myList()` 호출 (인증 필요)
- [ ] 상태별 탭(대기/확정/완료/취소) 필터링

### 3-4. 야외 리뷰 작성 (OutdoorSpotPage 보강)

- [ ] `outdoorsApi.createReview(...)` 연결
- [ ] 작성 성공 시 목록 자동 갱신 (re-fetch 또는 옵티미스틱 업데이트)

### 학습 포인트

- **Idempotency key 패턴**: 결제·예약처럼 사고 나면 안 되는 API의 사실상 표준. Stripe 등 주요 결제 API도 이 패턴 사용.
- **낙관적 UI 업데이트 vs 서버 응답 대기**: MVP는 서버 응답 기다리는 쪽이 안전. 트래픽 많아지면 그때 옵티미스틱 검토.
- **에러 경계(Error Boundary)**: API 에러 시 흰 화면 방지를 위해 React의 ErrorBoundary 또는 각 페이지의 try-catch 설계.

---

## 9. Phase 4 — 운영자/관리자

### 학습 노트

Admin UI는 사용자보다 **데이터 밀도가 훨씬 높고(테이블, KPI 카드) 위험한 액션(취소, 숨김)** 이 많습니다. 설계 원칙:

- 위험한 액션은 **Confirm 모달 또는 2차 확인**
- 상태 전이는 **명시적 버튼** ("취소하기" 같은 동사)
- 서버 응답 전까지 버튼 비활성화 (이중 클릭 방지)

### 4-1. Owner 대시보드

- [ ] `ownerApi.dashboard()` 로 KPI, 최근 예약 표시
- [ ] `gymPlaceId` 를 state에 저장 → 이후 결제수단 페이지에서 사용

### 4-2. OwnerReservations

- [ ] 상태 탭(PENDING/CHECKED/CONFIRMED/CANCELLED)별 `ownerApi.reservations({ status })`
- [ ] 각 행 액션 버튼: `markChecked` / `markConfirmed` / `markCancelled`
- [ ] 액션 후 해당 탭 자동 재조회

### 4-3. OwnerPaymentMethods

- [ ] `gymsApi.paymentMethods(gymId)` 로 현재 값 로드
- [ ] 폼 수정 → `gymsApi.updatePaymentMethods(gymId, body)` 로 저장
- [ ] 성공 토스트 + 폼 dirty 상태 관리

### 4-4. Ops (관리자 리뷰 관리)

- [ ] `adminApi.reviews({ status })` 로 리뷰 목록
- [ ] 숨김/복구 액션 → `hideReview`, `restoreReview`
- [ ] 역할이 ADMIN이 아니면 접근 불가 (프론트 가드 + 백엔드가 403 응답)

### 학습 포인트

- **상태 전이 설계**: 예약 상태는 상태 머신(State Machine). `PENDING → CHECKED → CONFIRMED`, `ANY → CANCELLED`. 클라이언트는 허용된 전이만 버튼 노출.
- **리스트 갱신 전략**: 액션 후 전체 재조회가 가장 단순. 더 빠르게 하려면 해당 row만 업데이트(로컬 setState) — 단 서버 상태와 불일치 가능성.

---

## 10. Phase 5 — 보안 하드닝 (Production Ready)

### 학습 노트

이 단계는 **기능이 다 돌아가는 상태에서** 시작합니다. 기능이 덜 끝났을 때 하드닝에 들어가면, 추가 기능이 하드닝 장벽에 막혀 테스트도 안 되고 원인 파악도 어려워집니다.

### 5-1. Critical (배포 전 반드시)

- [ ] **`JWT_SECRET_KEY` 교체**: `python -c "import secrets; print(secrets.token_urlsafe(64))"` 결과로 Railway 환경변수 설정
- [ ] **CORS 화이트리스트 정리**: 배포 도메인만 허용 (`backend/.env` 의 `CORS_ORIGINS`)
- [ ] **Rate limiting 도입**: `slowapi` 설치, `/auth/login`, `/auth/signup`, `/outdoors/*/reviews` 에 IP 기준 제한
  ```python
  from slowapi import Limiter
  from slowapi.util import get_remote_address
  limiter = Limiter(key_func=get_remote_address)
  @limiter.limit("5/minute")
  ```
- [ ] **비밀번호 최소 요구사항**: pydantic validator로 8자↑
- [ ] **HTTPS 강제**: Railway는 기본 HTTPS, Vercel도 기본 HTTPS → OK. 백엔드에서 `Strict-Transport-Security` 헤더 추가

### 5-2. Recommended (여유 되면)

- [ ] 보안 헤더 미들웨어
  ```python
  @app.middleware("http")
  async def security_headers(request, call_next):
      response = await call_next(request)
      response.headers["X-Content-Type-Options"] = "nosniff"
      response.headers["X-Frame-Options"] = "DENY"
      response.headers["Strict-Transport-Security"] = "max-age=31536000"
      return response
  ```
- [ ] 로그인 실패 카운팅 (간단히 user 테이블에 `failed_login_count`, `locked_until` 컬럼)
- [ ] Refresh token 회전: 사용된 refresh는 블랙리스트 (DB or Redis)
- [ ] 환경별 에러 응답: `settings.environment == "production"` 이면 detail 숨김

### 5-3. 프론트 점검

- [ ] `console.log` 에 토큰/사용자 데이터 출력하는 곳 제거
- [ ] `.env` 가 `.gitignore` 에 들어가 있는지 재확인
- [ ] Build 전에 `npm run build` 한 번 돌려 번들 크기와 소스맵 확인 (소스맵은 prod에선 비공개 권장)

### 학습 포인트

- **OWASP Top 10**: 웹 보안의 표준 체크리스트. 1회는 꼭 읽어보세요. (A01: Broken Access Control, A03: Injection, A07: Auth Failures 등)
- **Defense in Depth**: 한 레이어가 뚫려도 다음 레이어가 막아야 함. 프론트 가드 + 백엔드 JWT + DB 제약조건. 한 군데만 믿지 말 것.

---

## 11. Phase 6 — 테스트

### 학습 노트

"테스트를 Phase 6까지 미뤘다"는 건 교과서적으론 나쁘지만, **MVP·학습 프로젝트에선 합리적 트레이드오프**입니다. TDD는 요구사항이 흔들리지 않을 때 유효하고, 지금처럼 목업이 계속 바뀌는 단계에선 테스트가 오히려 족쇄가 됩니다. 단 **핵심 비즈니스 로직(가격 계산, 슬롯 엔진, 권한 체크)은 예외**로 초기부터 테스트가 있어야 합니다.

### 6-1. 백엔드 테스트 (pytest)

- [ ] `backend/tests/` 디렉토리 생성
- [ ] `conftest.py` — 테스트용 DB fixture (별도 schema 또는 SQLite in-memory)
- [ ] `test_auth.py` — 회원가입/로그인/토큰 만료
- [ ] `test_reservations.py` — 예약 생성(성공/중복/권한), idempotency
- [ ] `test_owner.py` — 상태 전이 허용 매트릭스
- [ ] 실행: `docker compose exec api pytest`

### 6-2. 프론트 E2E 체크리스트 (수동)

- [ ] 비로그인 상태에서 `/my/reservations` → 로그인 페이지로 리다이렉트
- [ ] 로그인 후 홈에서 체육관 선택 → 슬롯 선택 → 예약 → 성공 → 내 예약에 표시
- [ ] OWNER 로그인 → 대시보드 → 예약 상태 전이
- [ ] ADMIN 로그인 → 리뷰 숨김/복구

(Playwright/Cypress 도입은 MVP 이후 검토.)

---

## 12. Phase 7 — 배포

### 학습 노트

현재 프로젝트 구조는 **"프론트 SPA + 백엔드 API + 관계형 DB"** 입니다. 이런 구성은 Vercel 단독으론 안 되고(특히 FastAPI + PostgreSQL + Alembic), 2~3 서비스로 쪼개는 게 표준:

- **프론트(Vite SPA)** → Vercel (무료, CDN, 자동 HTTPS)
- **백엔드(FastAPI)** → Railway / Fly.io / Render (Dockerfile 빌드 지원)
- **DB(PostgreSQL)** → Railway 관리형 또는 Supabase/Neon

### 7-1. 백엔드 Railway 배포

- [ ] Railway 프로젝트 생성 → PostgreSQL 서비스 추가 → `DATABASE_URL` 자동 주입 확인
- [ ] GitHub 레포 연결 (`backend/` 폴더 루트로 설정)
- [ ] 환경변수 설정: `JWT_SECRET_KEY`, `CORS_ORIGINS`, `ENVIRONMENT=production`
- [ ] 배포 후 `https://basket-xxx.up.railway.app/health` 가 200인지 확인
- [ ] 마이그레이션: Railway Shell 또는 start command에 `alembic upgrade head && uvicorn ...`
- [ ] 시드: `python -m scripts.seed` 최초 1회

### 7-2. 프론트 Vercel 배포

- [ ] `vercel.json` 작성 (SPA fallback)
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
- [ ] Vercel 프로젝트 생성 → GitHub 연결 → Root Directory: 프로젝트 루트
- [ ] 환경변수: `VITE_API_BASE_URL=https://basket-xxx.up.railway.app`
- [ ] 배포 후 프론트에서 로그인 → 토큰 발급 → 기능 동작 확인

### 7-3. 배포 후 검증

- [ ] HTTPS 강제 (두 서비스 모두 기본 적용됨)
- [ ] CORS가 Vercel 도메인만 허용하도록 좁혀졌는지 확인
- [ ] Railway 로그에서 500 에러 주기적으로 확인
- [ ] Vercel Analytics 활성화 (선택)

### 학습 포인트

- **12-Factor App**: 환경변수 기반 설정, stateless 프로세스, 로그를 stdout으로 — 현재 구조가 이미 준수 중.
- **Cold start**: Railway 무료 플랜은 유휴 시 슬립. 테스트 시 첫 요청 몇 초 걸릴 수 있음.
- **Preview 배포**: Vercel은 PR마다 자동 프리뷰 URL 생성. 리뷰 워크플로에 유용.

---

## 13. 진행률 대시보드

Phase 별로 이 체크박스를 업데이트해서 한눈에 진행률을 관리하세요.

- [ ] Phase 0 — 환경 재정비 & 로컬 구동
- [ ] Phase 1 — 조회계 연동 (Home, GymDetail, OutdoorSpot)
- [ ] Phase 2 — 회원가입 + 인증 가드
- [ ] Phase 3 — 예약 트랜잭션 (Checkout, Success, MyReservations, 리뷰 작성)
- [ ] Phase 4 — 운영자/관리자 (Owner, OwnerReservations, OwnerPaymentMethods, Ops)
- [ ] Phase 5 — 보안 하드닝
- [ ] Phase 6 — 테스트 작성
- [ ] Phase 7 — 배포 (Railway + Vercel)

---

## 14. 도움이 되는 외부 레퍼런스

- FastAPI 보안: https://fastapi.tiangolo.com/tutorial/security/
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- React Router v6 (Outlet / Protected Routes): https://reactrouter.com/en/main
- Stripe Idempotency: https://stripe.com/docs/api/idempotent_requests
- 12-Factor App: https://12factor.net/

---

## 15. 변경 이력

| 날짜 | 변경 | 작성자 |
|---|---|---|
| 2026-04-22 | 최초 작성. 현 상태 실측 반영. | — |
