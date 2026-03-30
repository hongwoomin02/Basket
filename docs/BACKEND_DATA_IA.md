# BACKEND_DATA_IA.md

## 기준 문서

- [`docs/FRONT_PROMPT_V3.md`](FRONT_PROMPT_V3.md): 라우터별 `view`/표시 데이터(필드)와 요청/상태 전이를 “화면 관점”에서 정의
- [`docs/PRD_V2.md`](PRD_V2.md): 예약/결제 제약(중복 예약 방지, 예약 불가 슬롯, 상태 전이, 취소 정책 등)

## 문서 사용 규칙

- 이 문서는 **백엔드가 실제로 붙는다고 가정**했을 때, 각 라우터 화면을 구성하기 위해 필요한 **데이터(엔티티/필드)**와 **CRUD 요구사항**을 라우터별로 리스트업한 문서다.
- “정규화”는 제안 수준이며, MVP에서는 라우터별로 중복 데이터 캐싱/스냅샷을 허용할 수 있다.

---

## 공통 도메인 엔티티(정규화 제안)

아래 엔티티들은 `FRONT_PROMPT_V3.md`의 JSON 더미에서 반복적으로 등장하는 필드들을 커버하기 위해 묶은 공통 모델이다.

### 1) 엔티티/열거형(Enums)

- `PlaceType`
  - `GYM`(실내 체육관)
  - `OUTDOOR`(야외 농구장)
- `SlotStatus`(시간슬롯 상태)
  - `AVAILABLE`(예약 가능)
  - `CLASS`(수업)
  - `REGULAR`(정기대관)
  - `CLOSED`(마감)
- `ReservationStatus`(예약 상태)
  - `REQUESTED`(신청됨)
  - `AWAITING_TRANSFER`(송금 대기)
  - `TRANSFER_SUBMITTED`(송금 완료)
  - `OWNER_VERIFIED`(확인 완료)
  - `CONFIRMED`(예약 확정)
  - `CANCELLED`(취소)
- `ReviewStatus`(리뷰 노출/검수)
  - `VISIBLE`(노출 중)
  - `HIDDEN`(숨김)

### 2) 사용자/역할

> 이 문서는 “인증 시스템”을 설계하지 않는다. 다만 백엔드가 붙으면 역할 기반 라우팅/권한 검증이 필요하므로 최소 필드를 둔다.

- `User`
  - `id` (PK)
  - `role` : `USER | OWNER | ADMIN`
  - `displayName`
  - `createdAt`

### 3) 장소/기본 프로필

- `Place`
  - `id` (PK)
  - `type` : `GYM | OUTDOOR`
  - `name`
  - `district` (구/군)
  - `address`(상세주소는 MVP에서 생략 가능하지만, JSON 예시에는 존재)
  - `shortDescription`(홈 리스트용)
  - `isActive`

- `GymProfile`(실내 체육관 확장)
  - `placeId` (FK -> Place.id)
  - `courtCount`
  - `hours`(운영시간)
  - `parking` (주차 가능 여부)
  - `amenities[]`(주차/샤워실/음수대/대기공간 등)
  - `description`

- `OutdoorProfile`(야외 농구장 확장)
  - `placeId` (FK -> Place.id)
  - `feeType` (예: 무료/유료)
  - `floorStatus`(바닥 상태)
  - `lightStatus`
  - `rimStatus`(골대 상태)
  - `cleanliness`
  - `crowdLevel`(혼잡도)
  - `description`

### 4) 이미지/갤러리

- `PlaceAsset`
  - `id` (PK)
  - `placeId` (FK)
  - `type` : `GALLERY | THUMBNAIL | REVIEW_PHOTO`
  - `url`(또는 objectKey)
  - `sortOrder`

### 5) 일정/시간슬롯(실내 체육관)

- `OwnerGym`(소유/운영 매핑)
  - `gymPlaceId` (FK -> Place.id)
  - `ownerUserId` (FK -> User.id)
  - `status`(운영중/중지 등)

- `SchedulePricingPolicy`(시간당 가격 + 할인 정책)
  - `gymPlaceId` (PK 또는 FK)
  - `baseHourlyPrice`(평일 기본)
  - `weekendHourlyPrice`
  - `discountPersonThreshold`(N명 이하)
  - `discountRatePercent`(정률)
  - `discountFixedAmount`(정액, MVP에서는 0 허용)
  - `sameDayOnly`(당일 예약 적용 여부)
  - `updatedAt`

- `ScheduleRepeatRule`(정기 패턴)
  - `id` (PK)
  - `gymPlaceId` (FK)
  - `type` : `CLASS | REGULAR`(문서 예시에서 type으로 쓰임)
  - `label`(UI 표시용)
  - `rruleSpec`(실제 구현: cron/rrule 저장 권장)
  - `enabled`

- `ScheduleExceptionRule`(예외/휴관)
  - `id` (PK)
  - `gymPlaceId` (FK)
  - `label`
  - `exceptionDate` 또는 `dateRange`
  - `enabled`

- `MonthlyCalendar`(월간 뷰를 위한 캐시 스냅샷)
  - `id` (PK)
  - `gymPlaceId` (FK)
  - `month`(예: `2026-04`)
  - `generatedAt`

- `Slot`(월간/일간 시간슬롯)
  - `id`(PK, slot-1 같은 식별자)
  - `gymPlaceId` (FK)
  - `date`(예: `2026-04-15`)
  - `startTime`(예: `18:00`)
  - `endTime`(예: `19:00`)
  - `timeLabel`(표시용: `18:00 ~ 19:00` 혹은 UI가 조합)
  - `status` : `AVAILABLE | CLASS | REGULAR | CLOSED`
  - `price` (nullable; 문서에서는 class/regular/cLOSED price null 허용)
  - `updatedAt`

- `SlotOverride`(운영자 화면에서 변경된 상태/가격 오버라이드)
  - `id` (PK)
  - `gymPlaceId`
  - `date`
  - `startTime`
  - `overrideStatus`
  - `overridePrice`(nullable)
  - `source` : `OWNER_EDIT | SYSTEM_GENERATED`
  - `updatedAt`

### 6) 예약/결제(실내 체육관 예약)

- `Reservation`
  - `id` (PK; reservationId)
  - `gymPlaceId` (FK -> Place.id)
  - `slotId` (FK -> Slot.id)
  - `date`
  - `timeLabel`
  - `teamName`(form.teamName)
  - `bookerName`(form.bookerName)
  - `phone`(form.phone)
  - `headcount`(form.peopleCount)
  - `memo`(form.memo)
  - `basePrice`(priceCalculator.basePrice 스냅샷)
  - `discountApplied`(boolean 스냅샷)
  - `discountAmount`(스냅샷)
  - `finalPrice`(스냅샷)
  - `status` : `REQUESTED | AWAITING_TRANSFER | TRANSFER_SUBMITTED | OWNER_VERIFIED | CONFIRMED | CANCELLED`
  - `requestedAt`
  - `cancelledAt`(optional)

- `PaymentTransfer`(송금 정보/증빙 메타)
  - `id` (PK)
  - `reservationId` (FK -> Reservation.id, 1:1 권장)
  - `payerName`(입금자명)
  - `proofEnabled`(선택)
  - `proofAssetId`(FK -> PlaceAsset 또는 별도 Asset 테이블)
  - `proofFileName`
  - `submittedAt`
  - `updatedAt`

- `ReservationStatusTimeline`(타임라인 기록)
  - `id` (PK)
  - `reservationId` (FK)
  - `key` : `requested | waiting | transferred | checked | confirmed | cancelled`
  - `label`(표시용)
  - `doneAt`(timestamp; done 여부는 doneAt 유무로 결정 가능)

### 7) 야외 리뷰/검수

- `OutdoorReview`
  - `id` (PK)
  - `placeId` (FK -> Place.id, OUTDOOR)
  - `reservationId`(옵션: “방문/경험 기반” 증빙이 있으면 연결)
  - `nickname`
  - `rating`(별점)
  - `tags[]`(시설 상태/혼잡도 태그)
  - `content`
  - `visitedAt`(예시 필드)
  - `status` : `VISIBLE | HIDDEN | PENDING`
  - `createdAt`, `updatedAt`

- `ReviewPhoto`(리뷰 사진)
  - `id` (PK)
  - `reviewId` (FK)
  - `assetId`(FK -> PlaceAsset)
  - `sortOrder`

- `ReviewModerationAudit`(검수 이력)
  - `id` (PK)
  - `reviewId`
  - `adminUserId`
  - `action` : `HIDE | RESTORE | APPROVE`
  - `doneAt`
  - `reason`(optional)

---

## 라우터별 백엔드 데이터/CRUD IA

> 아래 라우터는 `docs/FRONT_PROMPT_V3.md`에 있는 “실제 경로/화면”을 기준으로 작성한다.

---

### Route: `"/"` (home.json)

#### 표시 데이터가 요구하는 엔티티/필드

- `Place`(리스트)
  - `id`, `type(routeType)`, `name`, `district`
  - `shortDescription`, `thumbnail(url)`, `rating(average)`, `badges[]`
- `GymAvailabilitySummary`(reservable 배지용)
  - “향후 예약 가능 슬롯이 존재하는지”를 판정하기 위한 집계값
  - 필요 필드 예: `gymPlaceId`, `availableSlotExists`(boolean), `nextAvailableAt`(optional)
- `PricingPolicySummary`(discountable 배지용)
  - 할인 정책 존재 여부 판정: `discountPersonThreshold`, `discountRatePercent` 등
- `MapSummary`(지도 프리뷰)
  - 문서 예시에서는 `markerCount`, `legend`만 요구하므로,
  - 실제 구현에서는 `Place` 위치정보(`lat`,`lng`)가 있으면 핀 배치 가능

#### CRUD 요구사항

- Read-only(기본 화면)
  - `GET /places?district=&placeType=&reservableOnly=&discountableOnly=&q=`
  - `GET /places/home-map-summary`
- Owner/Admin의 변경은 다른 라우터(`/owner/*`, `/admin/reviews`)에서 수행되며, home은 이를 반영해 “조회”한다.

#### 검증/제약

- `reservable`은 단순 플래그가 아니라 “스케줄 생성 규칙 + 예외 + 기존 예약 상태”를 반영해 계산되어야 한다.
- 할인 가능한 배지(`discountable`)는 “할인 정책이 존재/활성”이면 true로 둘지, “해당 시점에 적용 가능”이면 true로 둘지 정책을 고정해야 한다.

---

### Route: `"/place/gym/:id"` (gymDetail.json)

#### 표시 데이터가 요구하는 엔티티/필드

- `GymProfile` / `Place`
  - `place.id`, `name`, `address`, `district`
  - `courtCount`, `hours`, `parking`, `amenities[]`, `description`
- `PlaceAsset`(갤러리)
  - `gallery[]` : `{id, src(url)}`
- `SchedulePricingPolicy`
  - `baseHourlyPrice`, `weekdayRuleLabel`, `weekendRuleLabel`
  - `discountRules[]`(문서 예시)
    - 예: `{id, label, type: rate|condition, value}`
- `Slot` / `MonthlyCalendar`(월간 시간표)
  - `calendar.monthLabel`
  - `calendar.legend[]`(예약 가능/수업/정기/마감 라벨)
  - `calendar.days[]`(문서 예시에서는 빈 배열 가능)
  - `calendar.slots[]`
    - `{id, time, status, price}` (status에 따라 price null 허용)
- `OwnerPaymentPreview`
  - `availableMethods[]`(카카오 링크/은행 계좌)
  - `notice`

#### CRUD 요구사항

- Read
  - `GET /gyms/:gymPlaceId`
  - `GET /gyms/:gymPlaceId/gallery`
  - `GET /gyms/:gymPlaceId/pricing-policy`
  - `GET /gyms/:gymPlaceId/calendar?month=YYYY-MM&selectedDate=YYYY-MM-DD`
    - 응답에 `slots[]`(status/price 포함), legend 포함
  - `GET /gyms/:gymPlaceId/payment-preview`

#### 검증/제약

- `Slot.status`는 UI 선택/예약 가능 여부를 직접 결정하므로,
  - `AVAILABLE`만 booking으로 넘어가며
  - `CLASS | REGULAR | CLOSED`는 예약 불가로 처리해야 한다. (PRD 제약)

---

### Route: `"/place/outdoor/:id"` (outdoorDetail.json)

#### 표시 데이터가 요구하는 엔티티/필드

- `OutdoorProfile` / `Place`
  - `place.id`, `name`, `address`, `district`
  - `feeType`
  - `floorStatus`, `lightStatus`, `rimStatus`, `cleanliness`, `crowdLevel`
  - `description`
- `PlaceAsset`(갤러리)
  - `gallery[]`: `{id, src}`
- `OutdoorReview` 집계
  - `ratingSummary.averageRating`
  - `ratingSummary.reviewCount`
  - `ratingSummary.tagSummary[]`: `{tag, count}`
- `OutdoorReview` 목록
  - `reviews[]` : `{id, nickname, rating, tags[], content, photos[](url), visitedAt}`
- `reviewForm`
  - `availableTags[]`, `photoLimit`

#### CRUD 요구사항

- Read
  - `GET /outdoors/:placeId`
  - `GET /outdoors/:placeId/gallery`
  - `GET /outdoors/:placeId/reviews?sort=&status=VISIBLE`
  - `GET /outdoors/:placeId/review-summary`
  - `GET /outdoors/:placeId/review-form-metadata`(가능 태그/제한치)
- Create(리뷰 작성 CTA)
  - `POST /outdoors/:placeId/reviews`
    - body: `rating`, `tags[]`, `text`, `photoFiles(optional)`
  - 결과: `reviews` 리스트 상단 즉시 반영(프론트 정책에 맞춰 응답 스키마 제공)

#### 검증/제약

- 리뷰는 admin 검수 대상이므로 다음 정책을 명확히 해야 한다.
  - 예시상 admin이 `hide/restore`를 수행하므로, 최소 `Review.status`를 두고
  - 기본 생성 시 `PENDING` 또는 즉시 `VISIBLE` 중 하나를 선택.
- 태그 토글/별점 변경은 프론트-only이지만,
  - 백엔드는 `availableTags[]`에 포함된 태그만 저장/검증해야 한다.

---

### Route: `"/booking/:gymId"` (booking.json)

#### 표시 데이터가 요구하는 엔티티/필드

- `bookingTarget`
  - `gymId`, `gymName`, `date`, `time`
- `form`
  - `teamName`, `bookerName`, `phone`, `peopleCount`, `memo`
- `priceCalculator`
  - `basePrice`
  - `availableRules[]`(문서 예시: label/type/value)
  - `appliedDiscountLabel`
  - `discountAmount`
  - `finalPrice`

#### CRUD 요구사항

1) 가격/할인 계산을 위한 Read
   - `GET /gyms/:gymId/pricing-policy`
   - `GET /gyms/:gymId/slots/:date/:time` 또는 `GET /gyms/:gymId/calendar-slot?date=&time=`
     - 응답에 `slot.status`와 기본 요율/가격 정보 제공
2) 예약 요청 생성(Create)
   - `POST /reservations`
     - body: `gymId`, `slotId or date/time`, `teamName`, `bookerName`, `phone`, `peopleCount`, `memo`, `requestedAt`
   - 서버는 저장 시점에 아래를 “스냅샷”으로 남겨야 프론트의 priceCalculator와 일치한다.
     - `basePrice`, `discountAmount`, `finalPrice`, `discountApplied`

3) 예약 생성 후 결제 단계로 이동
   - 예약 상태 전이: `REQUESTED` -> `AWAITING_TRANSFER`(문서/PRD 기준)

#### 검증/제약(중요)

- PRD 제약을 강제
  - `Slot.status != AVAILABLE`이면 예약 생성 거부
  - “동일 시간 중복 예약 방지”: 같은 `gymId + date + time`에 대해 예약 생성이 1건만 허용(또는 capacity 정책에 따른 제한)
- `sameDayOnly` 정책에 따라 할인/예약 가능 조건을 계산
- 할인 금액/라벨은 `peopleCount` 기준으로 일관되게 산출되어야 한다.

---

### Route: `"/payment/:reservationId"` (payment.json)

#### 표시 데이터가 요구하는 엔티티/필드

- `reservationSummary`
  - `reservationId`, `gymName`, `date`, `time`, `peopleCount`, `finalPrice`, `status(송금 대기)`
- `paymentMethods`
  - `kakaoPayLink`
  - `bankName`, `accountNumber`, `accountHolder`
- `paymentForm`
  - `payerName`(입력값)
  - `proofImageEnabled`, `proofImageName`(선택 증빙)
- `guideMessages`(문구는 고정값으로 제공 가능)

#### CRUD 요구사항

1) 결제 화면 데이터 Read
   - `GET /reservations/:reservationId`
   - `GET /owners/:ownerId/payment-methods?gymId=...` 또는 `GET /gyms/:gymId/payment-methods`
2) 송금 완료 처리(Update)
   - `POST /reservations/:reservationId/transfer-done`
     - body: `payerName`, `proofAsset(optional)`, `submittedAt`
   - 예약 상태 전이:
     - `AWAITING_TRANSFER` -> `TRANSFER_SUBMITTED`
3) 상태 타임라인 기록
   - `ReservationStatusTimeline`에 `transferred` doneAt 저장

#### 검증/제약

- proof는 선택이므로 파일 업로드가 없더라도 통과 가능.
- reservationId의 존재/상태가 `AWAITING_TRANSFER`일 때만 transfer-done 처리 허용.
- 이미 transfer-done 처리된 예약에 대해 멱등성(idempotency) 정책을 둔다(중복 클릭 방지).

---

### Route: `"/reservation/:reservationId"` (reservationStatus.json)

#### 표시 데이터가 요구하는 엔티티/필드

- `reservation`
  - `reservationId`, `gymName`, `date`, `time`, `peopleCount`, `price(finalPrice)`, `payerName`, `currentStatus`
- `statusTimeline`
  - `requested`, `waiting`, `transferred`, `checked`, `confirmed` 각각의 done 여부
- `nextActions`
  - `target` 경로는 프론트가 구성(백엔드 반환 필요 없음)

#### CRUD 요구사항

- Read
  - `GET /reservations/:reservationId` + `GET /reservations/:reservationId/timeline`

#### 검증/제약

- 타임라인 done 여부는 `doneAt` 기반으로 계산 가능해야 한다.

---

### Route: `"/owner/dashboard"` (ownerDashboard.json)

#### 표시 데이터가 요구하는 엔티티/필드

- `ownerGymProfile`
  - `name`, `district`, `courtCount`, `status`
- `kpis[]`
  - `today 예약 수`
  - `송금 대기`
  - `예약 확정`
  - `할인 적용 예약`
- `recentReservations[]`
  - `id`, `name(bookerName)`, `time`, `status`

#### CRUD 요구사항

- Read(통계/목록)
  - `GET /owners/me/dashboard?gymId=...`
    - 내부적으로 아래를 집계
      - `reservations.status == AWAITING_TRANSFER` count
      - `reservations.status == CONFIRMED` count
      - `reservations.discountApplied == true` count

#### 검증/제약

- “오늘 예약”의 기준 시각은 백엔드에서 고정(예: KST 기준 자정).

---

### Route: `"/owner/schedule"` (ownerSchedule.json)

#### 표시 데이터가 요구하는 엔티티/필드

- `calendar`
  - `monthLabel`, `selectedDate`
  - `days[]`
  - `slots[]`: `{id, time, status, price}` (price는 available만 유효)
- `repeatRules[]`
  - `{id, label, type}`
- `exceptionRules[]`
  - `{id, label}`
- `pricingForm`
  - `baseHourlyPrice`, `weekendHourlyPrice`
  - `discountPersonThreshold`, `discountRatePercent`, `discountFixedAmount`
  - `sameDayOnly`

#### CRUD 요구사항

1) Read
   - `GET /gyms/:gymId/schedule?month=...&selectedDate=...`
     - 내부적으로 `ScheduleRepeatRule + ExceptionRule + Override`를 합성해 `slots[]`를 산출
   - `GET /gyms/:gymId/pricing-policy`
   - `GET /gyms/:gymId/repeat-rules`
   - `GET /gyms/:gymId/exception-rules`

2) Update / Create / Delete
   - 슬롯 상태 변경(부분 업데이트)
     - `POST/PATCH /gyms/:gymId/slots/:date/:startTime`
       - body: `status`, `price(optional)`
     - 저장: `SlotOverride` 생성/업데이트
   - 반복 규칙 관리
     - `POST /gyms/:gymId/repeat-rules`
     - `PATCH /gyms/:gymId/repeat-rules/:id`
     - `DELETE /gyms/:gymId/repeat-rules/:id`
   - 예외 규칙 관리
     - `POST /gyms/:gymId/exception-rules`
     - `PATCH /gyms/:gymId/exception-rules/:id`
     - `DELETE /gyms/:gymId/exception-rules/:id`
   - 가격/할인 정책 저장
     - `PUT/PATCH /gyms/:gymId/pricing-policy`
       - body: `baseHourlyPrice`, `weekendHourlyPrice`, `discountPersonThreshold`, `discountRatePercent`, `discountFixedAmount`, `sameDayOnly`

#### 검증/제약(중요)

- 슬롯 상태는 UI에서 바로 예약가능성에 영향을 주므로, `AVAILABLE`/`CLASS`/`REGULAR`/`CLOSED` enum을 엄격 검증.
- 가격 정책 변경 시 이미 생성된 Reservation 스냅샷(`basePrice/discountAmount/finalPrice`)은 변경하지 않는 정책이 필요(가격은 신청 시점 기준 스냅샷 고정 권장).

---

### Route: `"/owner/payment-methods"` (ownerPaymentMethods.json)

#### 표시 데이터가 요구하는 엔티티/필드

- `paymentMethods`
  - `kakaoPayLink`
  - `bankName`
  - `accountNumber`
  - `accountHolder`
  - `visibleMethods[]` (문서 예시에서는 kakao/bank)
- preview
  - labels는 고정 문구로 제공 가능

#### CRUD 요구사항

- Read
  - `GET /gyms/:gymId/payment-methods`
- Update
  - `PUT /gyms/:gymId/payment-methods`
    - body: kakaoPayLink, bankName, accountNumber, accountHolder, visibleMethods[]

#### 검증/제약

- 계좌번호/예금주명 형식 검증(기본).
- visibleMethods에서 비활성화된 수단은 payment 화면에서 버튼이 숨겨지도록 응답 제공.

---

### Route: `"/owner/reservations"` (ownerReservations.json)

#### 표시 데이터가 요구하는 엔티티/필드

- `filters`
  - `status`(전체/송금 대기/송금 완료/확인 완료/확정 등)
  - `dateRange`(이번 주 등)
- `rows[]`(예약 리스트)
  - `id`
  - `bookerName`(예약자명)
  - `teamName`
  - `payerName`
  - `date`, `time`
  - `peopleCount`
  - `price(finalPrice)`
  - `discountApplied`
  - `status`(송금 대기/송금 완료/예약 확정 등)
  - `hasProof`(증빙 여부)

#### CRUD 요구사항

1) Read
   - `GET /owners/me/reservations?gymId=...&status=...&dateRange=...`
     - includes: 예약/슬롯/결제증빙 메타를 join해 rows를 구성
2) Update(상태 전이)
   - `POST /reservations/:reservationId/mark-checked`
     - 전이: `TRANSFER_SUBMITTED` -> `OWNER_VERIFIED`
     - timeline: `checked` doneAt 기록
   - `POST /reservations/:reservationId/mark-confirmed`
     - 전이: `OWNER_VERIFIED` -> `CONFIRMED`
     - timeline: `confirmed` doneAt 기록
   - `POST /reservations/:reservationId/mark-cancelled`
     - 전이: 어느 상태든 `CANCELLED`(정책에 따라 제한)
     - 취소 시점 기록: `cancelledAt`

#### 검증/제약(중요)

- `mark-checked`는 현재 상태가 `TRANSFER_SUBMITTED`일 때만 허용.
- `mark-confirmed`는 현재 상태가 `OWNER_VERIFIED`일 때만 허용.
- `hasProof`는 PaymentTransfer.proofEnabled/proofAssetId 유무로 계산.

---

### Route: `"/admin/reviews"` (adminReviews.json)

#### 표시 데이터가 요구하는 엔티티/필드

- `filters`
  - `status`(전체/노출 중/숨김 등)
  - `placeType`(야외 농구장)
- `reviewRows[]`
  - `id`
  - `placeName`(리뷰 대상)
  - `nickname`
  - `rating`
  - `tags[]`
  - `content`
  - `hasPhoto`
  - `status`(노출 중/숨김)

#### CRUD 요구사항

1) Read
   - `GET /admin/reviews?status=...&placeType=OUTDOOR`
     - 리스트 구성에 필요한 최소 필드 반환
   - `GET /admin/reviews/:reviewId/photos`(previewReviewPhoto)
2) Update(검수)
   - `POST /admin/reviews/:reviewId/hide`
     - 전이: `VISIBLE` -> `HIDDEN` (또는 `PENDING` 처리 정책에 따라 별도 상태)
     - audit: `ReviewModerationAudit` 기록
   - `POST /admin/reviews/:reviewId/restore`
     - 전이: `HIDDEN` -> `VISIBLE`

#### 검증/제약

- 숨김 처리된 리뷰는 사용자 공개 API에서 제외되거나 `status != VISIBLE`로 필터링.
- photo preview는 “숨김 처리 여부와 무관하게 조회 권한이 있는 admin”에게만 제공.

## API 엔드포인트 확장(요청/응답 필드)

> 아래는 “백엔드가 붙었을 때 프론트 목업이 그대로 동작”하도록, 각 라우터 화면에 필요한 데이터가 어떤 엔드포인트에서 CRUD/조회되어야 하는지에 대한 **요청/응답 필드 리스트(스펙 확장)**다.

---

### 공통 규약

- 성공 응답(권장): `{ "data": <payload>, "meta": { "requestId": "..." } }`
- 실패 응답(권장): `{ "error": { "code": "...", "message": "...", "details": {} } }`
- ID
  - `placeId`, `gymId`, `reservationId`, `reviewId`, `assetId`는 모두 `string`
- 날짜/시간
  - 날짜: `YYYY-MM-DD`
  - 시간: UI가 쓰는 `timeLabel`(예: `18:00 ~ 19:00`)을 서버가 일관된 형태로 제공하거나, `startTime/endTime`를 제공해 프론트가 조합
- 금액: KRW 정수(예: `48000`)

에러 코드(예시)
- `NOT_FOUND`
- `FORBIDDEN`
- `VALIDATION_ERROR`
- `SLOT_NOT_RESERVABLE`
- `DUPLICATE_RESERVATION`
- `INVALID_RESERVATION_STATE`
- `PAYMENT_METHOD_NOT_SET`
- `REVIEW_DISABLED`

---

### Route `"/"` (home.json)

#### 1) `GET /places`
- Query
  - `district?` : string
  - `placeType?` : `GYM|OUTDOOR`
  - `reservableOnly?` : boolean
  - `discountableOnly?` : boolean
  - `q?` : string
  - `limit?` / `offset?`
- Response
  - `places[]`
    - `id`, `type`, `name`, `district`
    - `shortDescription`
    - `thumbnailUrl`
    - `ratingAvg?`
    - `badges[]`
    - `reservableHint?` / `discountableHint?`

#### 2) `GET /places/home-map-summary`
- Response
  - `centerLabel`, `markerCount`
  - `legend[]`: `{ type, label }`
  - `pins[]`(선택)
    - `placeId`, `lat/lng` 또는 `x/y`
    - `kind`(INDOOR/OUTDOOR)

---

### Route `"/place/gym/:id"` (gymDetail.json)

#### 1) `GET /gyms/:gymPlaceId`
- Response
  - `place`: `id`, `name`, `address`, `district`
  - `gymProfile`: `courtCount`, `hours`, `parking`, `amenities[]`, `description`
  - `pricingPolicyPreview`: `baseHourlyPrice`, `weekdayRuleLabel`, `weekendRuleLabel`

#### 2) `GET /gyms/:gymPlaceId/gallery`
- Response
  - `gallery[]`: `{ id, url }`

#### 3) `GET /gyms/:gymPlaceId/pricing-policy`
- Response
  - `baseHourlyPrice`(평일)
  - `weekendHourlyPrice`(주말)
  - `discountRules[]`
    - `id`, `label`, `type`, `value`
  - `sameDayOnly?`, `discountFixedAmount?`

#### 4) `GET /gyms/:gymPlaceId/calendar?month=YYYY-MM&selectedDate=YYYY-MM-DD`
- Response
  - `monthLabel`, `selectedDate`
  - `legend[]`: `{ status, label }`
  - `slots[]`
    - `id`
    - `time` 또는 `timeLabel`
    - `status`
    - `price`(available일 때만 number, 그 외 null)

#### 5) `GET /gyms/:gymPlaceId/payment-preview`
- Response
  - `availableMethods[]`
  - `notice`

---

### Route `"/place/outdoor/:id"` (outdoorDetail.json)

#### 1) `GET /outdoors/:placeId`
- Response: `place`
  - `id`, `name`, `address`, `district`
  - `feeType`
  - `floorStatus`, `lightStatus`, `rimStatus`, `cleanliness`, `crowdLevel`
  - `description`

#### 2) `GET /outdoors/:placeId/gallery`
- Response
  - `gallery[]`: `{ id, url }`

#### 3) `GET /outdoors/:placeId/review-summary`
- Response
  - `averageRating`, `reviewCount`
  - `tagSummary[]`: `{ tag, count }`

#### 4) `GET /outdoors/:placeId/reviews`
- Response
  - `reviews[]`
    - `id`, `nickname`, `rating`, `tags[]`, `content`
    - `photos[]` 또는 `photoUrls[]`
    - `visitedAt?`

#### 5) `GET /outdoors/:placeId/review-form-metadata`
- Response
  - `availableTags[]`, `photoLimit`

#### 6) `POST /outdoors/:placeId/reviews`
- Request
  - `rating`, `tags[]`, `text`, `photoFiles?`, `visitedAt?`
- Response
  - 생성된 `review`(프론트가 즉시 리스트 상단 반영 가능한 형태)

---

### Route `"/booking/:gymId"` (booking.json)

#### 1) `GET /gyms/:gymId/pricing-policy`
- Response
  - `basePrice`, `availableRules[]`

#### 2) `GET /gyms/:gymId/slots/:date/:time`
- Response
  - `slot`: `id`, `status`, `price`

#### 3) `POST /reservations`
- Request
  - `gymId`
  - `slotId` 또는 `date`+`timeLabel`
  - `teamName`, `bookerName`, `phone`, `peopleCount`, `memo?`
  - `idempotencyKey?`
- Response
  - `reservationId`
  - `status`(= `AWAITING_TRANSFER`)
  - `pricingSnapshot`: `basePrice`, `discountAmount`, `finalPrice`, `discountApplied`

---

### Route `"/payment/:reservationId"` (payment.json)

#### 1) `GET /reservations/:reservationId`
- Response: `reservationSummary`
  - `reservationId`, `gymName`, `date`, `time`
  - `peopleCount`, `finalPrice`, `status`

#### 2) `GET /gyms/:gymId/payment-methods`
- Response: `paymentMethods`
  - `kakaoPayLink?`, `bankName`, `accountNumber`, `accountHolder`, `visibleMethods[]`

#### 3) `POST /reservations/:reservationId/transfer-done`
- Request: `payerName`, `proofAsset?`, `submittedAt?`, `idempotencyKey?`
- Response
  - `reservationId`, `status`(= `TRANSFER_SUBMITTED`)

---

### Route `"/reservation/:reservationId"` (reservationStatus.json)

#### 1) `GET /reservations/:reservationId`
- Response: `reservation`(요약 카드)

#### 2) `GET /reservations/:reservationId/timeline`
- Response: `statusTimeline[]`(각 단계 key/label/doneAt)

---

### Route `"/owner/dashboard"` (ownerDashboard.json)

#### `GET /owners/me/dashboard?gymId=optional`
- Response: `ownerGymProfile`, `kpis[]`, `recentReservations[]`

---

### Route `"/owner/schedule"` (ownerSchedule.json)

#### 1) `GET /gyms/:gymId/schedule?month=YYYY-MM&selectedDate=YYYY-MM-DD`
- Response: `calendar.monthLabel`, `selectedDate`, `slots[]`

#### 2) `GET /gyms/:gymId/pricing-policy`
- Response: `baseHourlyPrice`, `weekendHourlyPrice`, `discount*`, `sameDayOnly`

#### 3) `GET /gyms/:gymId/repeat-rules`
- Response: `repeatRules[]`

#### 4) `GET /gyms/:gymId/exception-rules`
- Response: `exceptionRules[]`

#### 5) `PATCH /gyms/:gymId/slots/:date/:startTime`
- Request: `status`, `price?`
- Response: 적용된 `slotOverride`

#### 6) Repeat/Exception 규칙 CRUD
- `POST/PATCH/DELETE`를 각각 규칙 ID 단위로 제공

---

### Route `"/owner/payment-methods"` (ownerPaymentMethods.json)

#### 1) `GET /gyms/:gymId/payment-methods`
#### 2) `PUT /gyms/:gymId/payment-methods`
- Response: `paymentMethods`(최종 반영 값)

---

### Route `"/owner/reservations"` (ownerReservations.json)

#### 1) `GET /owners/me/reservations?gymId&status&dateRange`
- Response: `rows[]`(booker/payer/date/time/price/status/hasProof 등)

#### 2) `POST /reservations/:reservationId/mark-checked`
- Response: `reservation.status`(= `OWNER_VERIFIED`)

#### 3) `POST /reservations/:reservationId/mark-confirmed`
- Response: `reservation.status`(= `CONFIRMED`)

#### 4) `POST /reservations/:reservationId/mark-cancelled`
- Request: `reason?`, `idempotencyKey?`
- Response: `reservation.status`(= `CANCELLED`), `cancelledAt?`

---

### Route `"/admin/reviews"` (adminReviews.json)

#### 1) `GET /admin/reviews?status&placeType`
- Response: `reviewRows[]`(hasPhoto/status 포함)

#### 2) `GET /admin/reviews/:reviewId/photos`
- Response: `photos[]`: `{ id, url }`

#### 3) `POST /admin/reviews/:reviewId/hide`
- Response: `review.status`(= `HIDDEN`)

#### 4) `POST /admin/reviews/:reviewId/restore`
- Response: `review.status`(= `VISIBLE`)
