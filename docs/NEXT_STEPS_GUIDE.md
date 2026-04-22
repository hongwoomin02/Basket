# 다음 팀원을 위한 작업 가이드라인

> 작성일: 2026-04-22  
> 현재 브랜치: `backend`

---

## 1. 프로젝트 실행 방법

### 백엔드 (Docker)

```bash
cd backend
docker compose up --build
```

- API 서버: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- DB는 컨테이너 내부 PostgreSQL 16 (포트 5432)

### 프론트엔드 (Vite)

```bash
# 프로젝트 루트에서
npm install
npm run dev
```

- 프론트엔드: http://localhost:5173

### 시드 데이터 초기화 (필요 시)

```bash
cd backend
docker compose exec api python -m scripts.seed
```

---

## 2. 테스트 계정

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 일반 사용자 (USER) | user@basket.kr | password123 |
| 체육관 운영자 (OWNER) | owner@basket.kr | password123 |
| 관리자 (ADMIN) | admin@basket.kr | password123 |

---

## 3. 현재 연동 상태 요약

| 페이지 | 경로 | 상태 |
|--------|------|------|
| 로그인 | `/login` | ✅ **실제 API 연동 완료** |
| 장소 목록 훅 | `usePlaces.ts` | ✅ **완료** (Home.tsx에 아직 미적용) |
| 회원가입 | `/signup` | ❌ 목업 상태 |
| 홈 | `/` | ❌ 목업 상태 |
| 체육관 상세 | `/gyms/:gymId` | ❌ 목업 상태 |
| 야외 농구장 상세 | `/place/outdoor/:id` | ❌ 목업 상태 |
| 예약 흐름 | `/checkout` | ❌ 목업 상태 |
| 예약 완료 | `/success` | ❌ 목업 상태 |
| 내 예약 목록 | `/my/reservations` | ❌ 목업 상태 |
| 운영자 대시보드 | `/owner` | ❌ 목업 상태 |
| 운영자 예약 관리 | `/owner/reservations` | ❌ 목업 상태 |
| 운영자 결제 수단 | `/owner/payment-methods` | ❌ 목업 상태 |
| 관리자 리뷰 관리 | `/ops` | ❌ 목업 상태 |

---

## 4. 핵심 파일 구조

```
src/
├── lib/
│   └── api.ts              ← 모든 API 호출 함수 (axios 기반)
├── context/
│   └── AuthContext.tsx      ← JWT 인증 상태 관리 (useAuth 훅)
├── hooks/
│   └── usePlaces.ts         ← 장소 목록 훅 (완성, Home에 미연결)
├── store/
│   └── MockProvider.tsx     ← 레거시 목업 역할 관리 (점진적 제거 대상)
└── pages/
    └── *.tsx                ← 각 페이지 (대부분 목업 JSON import 상태)

backend/
├── app/
│   ├── routers/             ← 라우터 (places, gyms, outdoors, reservations, owner, admin, auth)
│   ├── models/              ← SQLAlchemy 모델
│   ├── services/
│   │   └── slot_engine.py   ← 슬롯 자동 생성 엔진
│   ├── utils/
│   │   └── security.py      ← bcrypt 해시/검증
│   └── config.py            ← 환경변수 (pydantic-settings)
├── alembic/versions/        ← DB 마이그레이션 (initial_schema 적용 완료)
└── scripts/seed.py          ← 시드 데이터
```

---

## 5. 프론트엔드 API 연동 방법 (페이지별)

모든 API 함수는 `src/lib/api.ts`에 정의되어 있음.  
인증이 필요한 API는 `localStorage`의 `access_token`이 자동으로 첨부됨.

---

### 5-1. 회원가입 (`src/pages/Signup.tsx`)

```tsx
import { authApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

// handleSignup 내부:
await authApi.signup(email, password, displayName, phone);
// 회원가입 후 자동 로그인이 필요하면 login()도 호출
const { login } = useAuth();
await login(email, password);
navigate('/');
```

---

### 5-2. 홈 (`src/pages/Home.tsx`)

`usePlaces` 훅이 이미 완성되어 있음. JSON import를 훅으로 교체하면 됨.

```tsx
import { usePlaces } from '../hooks/usePlaces';

// 컴포넌트 내부:
const { places, isLoading, error } = usePlaces({
  district: selectedDistrict,   // 예: "해운대구"
  placeType: selectedType,       // 예: "실내 체육관" | "야외 농구장"
  reservableOnly: filterReservable,
  discountableOnly: filterDiscount,
  q: searchQuery,
});
```

지도 요약 데이터:
```tsx
import { placesApi } from '../lib/api';

const summary = await placesApi.homeMapSummary();
// { totalGyms, totalOutdoors, openNowCount, districts }
```

---

### 5-3. 체육관 상세 (`src/pages/GymDetail.tsx`)

```tsx
import { gymsApi } from '../lib/api';

// useEffect 내부 (gymId는 useParams로 받음):
const [detail, setDetail] = useState(null);
const [policy, setPolicy] = useState(null);
const [calendarData, setCalendarData] = useState(null);

const [detailData, policyData] = await Promise.all([
  gymsApi.detail(gymId),
  gymsApi.pricingPolicy(gymId),
]);
setDetail(detailData);
setPolicy(policyData);

// 달력 데이터 (월 변경 시):
const cal = await gymsApi.calendar(gymId, "2026-04", selectedDate);
setCalendarData(cal);
// cal.weeks: 주간 배열, cal.slots: 해당 날짜 시간대 배열
```

---

### 5-4. 야외 농구장 상세 (`src/pages/OutdoorSpotPage.tsx`)

```tsx
import { outdoorsApi } from '../lib/api';

const [detail, reviewSummary, reviews] = await Promise.all([
  outdoorsApi.detail(placeId),
  outdoorsApi.reviewSummary(placeId),
  outdoorsApi.reviews(placeId, { sort: "recent" }),
]);
```

리뷰 작성:
```tsx
await outdoorsApi.createReview(placeId, {
  rating: 4,
  tags: ["코트 상태 좋음", "주차 편함"],
  text: "좋았습니다",
  visitedAt: "2026-04-20",
});
```

---

### 5-5. 예약 흐름 (`src/pages/Checkout.tsx`)

```tsx
import { reservationsApi } from '../lib/api';

const result = await reservationsApi.create({
  gymId: "...",
  slotId: "...",          // 또는 date + timeLabel
  teamName: "...",
  bookerName: "...",
  phone: "010-...",
  peopleCount: 10,
  memo: "...",
  idempotencyKey: crypto.randomUUID(), // 중복 방지
});
// result.reservationId → /success?id=... 로 이동
navigate(`/success?id=${result.reservationId}`);
```

---

### 5-6. 예약 완료 (`src/pages/Success.tsx`)

```tsx
import { reservationsApi } from '../lib/api';

const id = new URLSearchParams(location.search).get("id");
const [detail, timeline] = await Promise.all([
  reservationsApi.get(id),
  reservationsApi.timeline(id),
]);
```

---

### 5-7. 내 예약 목록 (`src/pages/MyReservations.tsx`)

```tsx
import { reservationsApi } from '../lib/api';

const { reservations } = await reservationsApi.myList();
```

---

### 5-8. 운영자 대시보드 (`src/pages/Owner.tsx`)

```tsx
import { ownerApi } from '../lib/api';

const dashboard = await ownerApi.dashboard();
// { gymName, kpis: { pendingCount, confirmedCount, totalRevenue }, recentReservations }
```

---

### 5-9. 운영자 예약 관리 (`src/pages/OwnerReservations.tsx`)

```tsx
import { ownerApi } from '../lib/api';

const { rows } = await ownerApi.reservations({ status: "PENDING" });

// 상태 전이:
await ownerApi.markChecked(reservationId);
await ownerApi.markConfirmed(reservationId);
await ownerApi.markCancelled(reservationId);
```

---

### 5-10. 운영자 결제 수단 (`src/pages/OwnerPaymentMethods.tsx`)

```tsx
import { gymsApi } from '../lib/api';

// 조회 (gymId는 운영자의 체육관 ID):
const methods = await gymsApi.paymentMethods(gymId);

// 수정:
await gymsApi.updatePaymentMethods(gymId, {
  bankTransfer: { enabled: true, accountNumber: "123-456", bankName: "국민" },
  kakaopay: { enabled: false },
});
```

> **gymId 얻는 방법**: `ownerApi.dashboard()` 응답에서 체육관 ID를 포함하거나, `/auth/me` 응답에 연결된 gym ID를 추가하는 백엔드 작업 필요.

---

### 5-11. 관리자 리뷰 관리 (`src/pages/Ops.tsx`)

```tsx
import { adminApi } from '../lib/api';

const { reviewRows } = await adminApi.reviews({ status: "VISIBLE" });
// reviewRows: [{ id, placeName, rating, text, tags, hasPhoto, status, createdAt }]

await adminApi.hideReview(reviewId);
await adminApi.restoreReview(reviewId);
```

---

## 6. 인증 상태 활용

`useAuth()` 훅으로 현재 사용자 정보 및 로그인 여부를 확인:

```tsx
import { useAuth } from '../context/AuthContext';

const { user, isLoggedIn, isLoading, login, logout } = useAuth();

// user.role: "USER" | "OWNER" | "ADMIN" | "ORGANIZER" | "OPS"
// 역할에 따라 다른 UI 렌더링:
if (user?.role === "OWNER") { /* 운영자 메뉴 표시 */ }
```

로그인이 필요한 페이지에서 리다이렉트:
```tsx
const { isLoggedIn, isLoading } = useAuth();
const navigate = useNavigate();

useEffect(() => {
  if (!isLoading && !isLoggedIn) navigate('/login');
}, [isLoggedIn, isLoading]);
```

---

## 7. 환경변수

| 파일 | 내용 |
|------|------|
| `.env` (프로젝트 루트) | `VITE_API_BASE_URL=http://localhost:8000` |
| `backend/.env` | DB URL, JWT 시크릿, CORS origins 등 |

---

## 8. 주요 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트 | React 18, Vite, TypeScript, React Router v6, axios |
| 백엔드 | FastAPI, SQLAlchemy 2.0 async, PostgreSQL 16 |
| 인증 | JWT (access_token + refresh_token), python-jose, bcrypt |
| 인프라 | Docker Compose (basket-db + basket-api) |

---

## 9. 주의사항

1. **MockProvider 레거시**: `src/store/MockProvider.tsx`의 `role` 수동 변경 방식은 레거시임. 새 페이지는 `useAuth()`를 사용할 것.

2. **목업 JSON 파일**: `src/` 하위에 `*.json` import가 남아있는 페이지들은 모두 목업 상태. API 훅으로 교체하면서 JSON import를 제거할 것.

3. **백엔드 응답 형식**: 모든 API 응답은 `{ data: ... }` 래퍼로 감싸져 있음. `api.ts`의 `unwrap()` 헬퍼가 자동으로 벗겨줌.

4. **gymId 관리**: 운영자 관련 페이지에서 체육관 ID가 필요함. 현재 `ownerApi.dashboard()`에 gymId를 포함시키거나, 별도 `GET /owners/me/gym` 엔드포인트 추가를 고려.

5. **ARRAY 필드 (PostgreSQL)**: `amenities`, `tags`, `visible_methods` 컬럼은 PostgreSQL의 `ARRAY(String)` 타입. SQLite에서는 동작하지 않음. 반드시 Docker Compose로 실행할 것.
