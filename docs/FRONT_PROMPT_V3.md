프로젝트명:
부산 농구 공간 플랫폼 — 프론트엔드 목업 완결 싱글턴 프롬프트

목적:
부산 지역의 실내 농구 체육관과 야외 농구장을 한곳에서 탐색하고,
체육관의 월간 시간표를 기반으로 예약 신청, 운영자 직접 송금, 예약 확정까지 이어지는
핵심 사용자 흐름을 실제 서비스처럼 테스트할 수 있는 프론트엔드 목업을 완성한다.

서비스 유형:
모바일 반응형 웹 기반 농구 장소 탐색 및 체육관 대관 예약 플랫폼

MVP 범위:
- 부산 지역 실내 체육관 + 야외 농구장 통합 탐색
- 지도 + 목록 기반 장소 탐색
- 장소 유형별 상세 화면 분기
  - 실내 체육관 상세
  - 야외 농구장 상세
- 체육관 월간 시간표 기반 예약
- 운영자 직접 설정 가격/할인 정책 반영
- 운영자 직접 송금 결제 UI
- 예약 상태값 전이 UI
- 운영자용 시간표/가격/결제수단/예약 관리 콘솔
- 관리자용 리뷰/사진 검수 화면

이 문서는 프론트엔드 목업 완결 전용이다.
데이터 모델 정규화, API 설계, DB 설계, 재사용 아키텍처 설계는 하지 않는다.
오직 라우터 단위 페이지 완결, 상태 전이, 더미 기반 인터랙션, 실제 시연 가능한 UX 완성만 목표로 한다.

중요 선언:
이 프로젝트는 UI/UX 테스트용 프론트엔드 목업이다.

- 어떤 서버도 생성하지 않는다.
- 어떤 데이터베이스도 생성하지 않는다.
- 어떤 API route도 생성하지 않는다.
- 어떤 외부 요청도 하지 않는다.
- fetch/axios 같은 네트워크 코드를 만들지 않는다.
- 환경변수를 요구하지 않는다.
- 인증 시스템을 자동 생성하지 않는다.
- 결제 SDK를 설치하지 않는다.
- 실제 지도 SDK 연동을 하지 않는다.
- 실제 카카오페이 연동을 하지 않는다.
- 실제 은행 송금 연동을 하지 않는다.
- 실제 파일 업로드 서버를 만들지 않는다.

모든 데이터는 로컬 JSON 더미 파일에서만 가져온다.
모든 인터랙션은 로컬 상태 변화로만 시뮬레이션한다.
모든 상태 전이는 페이지 내부 상태 또는 라우터 이동으로만 처리한다.
각 라우터는 자기 전용 JSON 파일 1개만 읽는다.
다른 라우터의 JSON을 참조하지 않는다.
중복 데이터는 허용한다.
실제 인증/권한은 구현하지 않고 화면상 mock role 접근만 표현한다.

────────────────────────────────────────────────────────
1) 프로젝트 메타
────────────────────────────────────────────────────────

- 프로젝트명:
  부산 농구 공간 플랫폼

- 목적:
  부산 지역의 실내 체육관과 야외 농구장을 탐색하고,
  체육관 시간표 기반 예약과 운영자 직접 송금 기반 예약 확정 흐름을
  UI/UX 수준에서 완결된 형태로 구현한다.

- 서비스 유형:
  모바일 우선 웹 플랫폼
  장소 탐색 + 체육관 예약 + 운영자 관리 콘솔

- MVP 범위:
  1. 홈에서 장소 탐색
  2. 지도/목록 통합 탐색
  3. 실내 체육관 상세
  4. 야외 농구장 상세
  5. 체육관 시간표 기반 예약
  6. 인원 기반 할인 자동 계산
  7. 직접 송금 결제 화면
  8. 예약 완료 및 상태 확인
  9. 운영자 대시보드
  10. 운영자 시간표/가격/할인 관리
  11. 운영자 결제수단 관리
  12. 운영자 예약/입금 확인 콘솔
  13. 관리자 리뷰/사진 관리

- 이 문서는 프론트엔드 목업 완결 전용임:
  맞다. 이 문서는 실제 백엔드 연결 없이, 라우터 단위의 페이지 완결과 목업 시연을 위한 단일 프롬프트이다.

────────────────────────────────────────────────────────
2) PRD 요약 (UI 기준)
────────────────────────────────────────────────────────

1. What
- 부산 지역 농구 장소를 지도와 목록으로 탐색한다.
- 실내 체육관은 시간표를 기반으로 예약 신청할 수 있다.
- 사용자는 운영자에게 직접 송금하는 방식으로 예약을 진행한다.
- 운영자는 시간표, 가격, 할인, 결제수단, 예약 상태를 직접 관리한다.
- 야외 농구장은 리뷰, 별점, 시설 상태 중심으로 탐색한다.

2. Value
- 흩어진 장소 정보를 하나로 모은다.
- 체육관 빈 시간을 한눈에 확인할 수 있다.
- 가격과 할인 조건을 예약 전에 명확히 보여준다.
- 운영자의 수동 안내를 줄인다.
- 야외 농구장 상태를 후기 중심으로 파악할 수 있다.

3. JTBD
- 팀 대표 사용자:
  - “부산에서 팀 연습용 체육관을 빨리 찾고 싶다.”
  - “빈 시간과 가격을 바로 보고 예약 신청하고 싶다.”
  - “사장님에게 어떻게 송금하면 되는지 명확히 알고 싶다.”
- 체육관 운영자:
  - “가능한 시간, 수업 시간, 정기대관 시간을 한 화면에서 관리하고 싶다.”
  - “가격과 할인 정책을 직접 설정하고 사용자에게 그대로 보여주고 싶다.”
  - “누가 송금했고 누가 아직 입금 대기인지 쉽게 확인하고 싶다.”
- 개인 사용자:
  - “야외 농구장의 바닥, 조명, 혼잡도 같은 실제 상태를 미리 알고 싶다.”
  - “사진과 후기 기반으로 갈 만한 코트를 찾고 싶다.”

4. Primary Personas
- 팀 대표 사용자
- 체육관 운영자
- 개인 사용자(야외 코트 탐색/리뷰 중심)

5. Non-Goals
- 픽업게임 게스트 모집
- 사용자 간 금전 거래
- 채팅
- 커뮤니티
- 점수판
- 실시간 매칭
- 자동 정산
- 부산 외 지역 확장
- 플랫폼 중개 결제

6. MVP Metrics
- 사용자가 부산 내 장소를 필터링하여 탐색할 수 있다.
- 사용자가 체육관 시간표에서 예약 가능한 시간만 선택할 수 있다.
- 인원 입력 시 할인과 최종 금액이 즉시 계산된다.
- 사용자가 직접 송금 결제 흐름을 완료할 수 있다.
- 운영자가 시간표, 가격, 할인, 결제수단을 수정할 수 있다.
- 운영자가 예약 상태와 입금 상태를 변경할 수 있다.
- 야외 농구장 리뷰 조회 및 작성 흐름이 동작한다.

────────────────────────────────────────────────────────
3) 라우터 확정 (IA 고정)
────────────────────────────────────────────────────────

다음 라우터로 고정한다. 이후 변경하지 않는다.

1. public
- "/"
  - 홈 / 장소 탐색
- "/place/gym/:id"
  - 실내 체육관 상세
- "/place/outdoor/:id"
  - 야외 농구장 상세
- "/booking/:gymId"
  - 예약 정보 입력 및 가격 계산
- "/payment/:reservationId"
  - 직접 송금 결제 진행
- "/reservation/:reservationId"
  - 예약 완료 및 예약 상태 확인

2. owner (protected-mock)
- "/owner/dashboard"
  - 운영자 대시보드
- "/owner/schedule"
  - 시간표 / 가격 / 할인 관리
- "/owner/payment-methods"
  - 결제수단 관리
- "/owner/reservations"
  - 예약 / 입금 확인 콘솔

3. admin (protected-mock)
- "/admin/reviews"
  - 리뷰/사진 검수 관리

설명:
- public / owner / admin 여부만 표시한다.
- 실제 인증은 구현하지 않는다.
- protected-mock은 로컬 상태 기반 화면 접근만 의미한다.

────────────────────────────────────────────────────────
4) 공통 UI 규칙
────────────────────────────────────────────────────────

1. 전체 디자인 방향
- 모바일 퍼스트
- 농구/체육관 서비스 느낌이 나는 카드 중심 UI
- 정보 밀도는 높되 섹션 구분이 명확해야 한다
- 실사용 시연이 가능할 정도로 실제적인 더미 콘텐츠를 넣는다
- 전체 톤은 깔끔하고 선명하게 구성한다
- CTA는 명확하고 크다
- 상태 색상은 직관적이어야 한다

2. Header 규칙
- 모든 페이지 상단에 고정 Header 사용 가능
- 좌측:
  - 뒤로가기 또는 서비스명 “BASKET BUSAN”
- 중앙:
  - 페이지 제목
- 우측:
  - public: 검색, 필터, 지도/목록 전환
  - owner/admin: 역할 배지, 더보기 메뉴
- 헤더 높이는 모바일 기준 compact
- 스크롤 시 정보 손실이 없도록 sticky 가능

3. Footer / Bottom Navigation 규칙
- public 페이지에만 Bottom Navigation 사용
- 탭 구성 예시:
  - 홈
  - 탐색
  - 예약현황(실제 별도 페이지 없이 예약 상태 페이지 또는 더미 이동 가능)
  - 더보기(토스트 또는 drawer)
- owner/admin는 bottom nav 대신 상단 탭 또는 카드식 진입 사용

4. 공통 카드 디자인 규칙
- 카드 radius 크고 그림자 약하게
- 카드 내부 여백 충분히 확보
- 장소 카드 기본 구조:
  - 대표 이미지
  - 장소명
  - 지역
  - 실내/야외 배지
  - 예약 가능 여부 배지
  - 할인 가능 여부 배지
  - 짧은 설명
  - 평점(있으면)
- 운영자 카드 구조:
  - KPI 제목
  - 수치
  - 서브 설명
  - 액션 버튼

5. 버튼 스타일 규칙
- Primary:
  - 예약 신청
  - 결제 진행
  - 송금 완료
  - 저장
  - 예약 확정
- Secondary:
  - 필터 적용
  - 상세 보기
  - 수정
  - 복사
- Danger:
  - 취소
  - 숨김 처리
- Ghost:
  - 닫기
  - 뒤로
- Disabled:
  - 예약 불가 슬롯
  - 마감
  - 수업
  - 정기대관

6. 입력창 규칙
- 검색창 placeholder:
  - “부산 농구장, 체육관, 구/군 검색”
- 필터 입력:
  - 구/군
  - 장소 유형
  - 예약 가능 여부
  - 할인 가능 여부
- 예약 입력:
  - 인원 수
  - 팀명 또는 그룹명(선택 가능)
  - 예약자명
  - 연락처
  - 요청사항
- 결제 입력:
  - 입금자명
  - 증빙 이미지 첨부(선택)
- 운영자 입력:
  - 시간당 가격
  - 할인 기준 인원
  - 정률 할인 %
  - 정액 할인 금액
  - 당일 예약 적용 여부
  - 카카오페이 송금 링크
  - 은행명
  - 계좌번호
  - 예금주명

7. Loading UI
- 모든 라우터는 loading 상태를 가져야 한다
- 장소 카드 스켈레톤
- 상세 페이지 스켈레톤
- 시간표 그리드 스켈레톤
- 예약 요약 카드 스켈레톤
- 운영자 테이블 스켈레톤

8. Empty UI
- 홈 결과 없음:
  - “조건에 맞는 장소가 없습니다.”
  - “필터를 초기화해 보세요.”
- 시간표 없음:
  - “등록된 시간표가 없습니다.”
- 예약 없음:
  - “현재 예약이 없습니다.”
- 리뷰 없음:
  - “첫 리뷰를 남겨보세요.”
- 관리자 검수 대상 없음:
  - “처리할 리뷰가 없습니다.”

9. Error UI
- 섹션 상단 인라인 에러 배너
- 전체 페이지 에러는 최소화
- 재시도 버튼 포함
- 예시 문구:
  - “장소 정보를 표시할 수 없습니다.”
  - “시간표를 불러오지 못했습니다.”
  - “결제 화면을 준비하지 못했습니다.”
  - “예약 목록을 불러오지 못했습니다.”

10. 상태 배지 규칙
- 예약 가능: 초록
- 수업: 주황
- 정기대관: 보라
- 마감: 회색 또는 빨강
- 할인 가능: 파랑
- 실내: 중립 단색
- 야외: 중립 단색
- 송금 대기: 노랑
- 송금 완료: 파랑
- 확인 완료: 보라
- 예약 확정: 초록
- 취소: 빨강

11. 시간표 UI 규칙
- 월 단위 캘린더 + 선택 날짜 상세 슬롯 패널 조합
- 날짜 선택 시 하단 슬롯 리스트 갱신
- 각 슬롯은 상태별 색상과 라벨을 가져야 한다
- 예약 가능 슬롯만 선택 가능
- 선택 불가 슬롯 클릭 시 토스트:
  - “이 시간은 예약할 수 없습니다.”
- 운영자 시간표 관리 화면에서는 슬롯 상태를 직접 바꿀 수 있어야 한다

12. 장소 타입 분기 규칙
- 실내 체육관 상세와 야외 농구장 상세는 서로 다른 페이지 구조를 사용한다
- 실내 체육관 상세:
  - 시간표
  - 가격
  - 할인 정책
  - 예약 CTA
- 야외 농구장 상세:
  - 시설 상태
  - 평균 별점
  - 사진
  - 리뷰
  - 리뷰 작성 CTA

13. 결제 UI 규칙
- 실제 결제 연동 없음
- 운영자 결제수단만 보여준다
- 카카오페이 송금 링크 버튼은 외부로 나가지 않고 mock toast 또는 새 탭 시뮬레이션 표시 가능
- 계좌번호 복사 버튼 제공
- 입금자명 입력 후 “송금 완료” 버튼 클릭 시 상태 전이
- 기본 success 흐름 외에 error/empty도 JSON 모드로 시뮬레이션 가능해야 한다

14. 마이크로 인터랙션
- 토스트 적극 사용
- 복사 완료 토스트
- 슬롯 선택 토스트
- 저장 완료 토스트
- 예약 확정 토스트
- 리뷰 숨김 토스트
- 드로어/모달:
  - 사진 확대
  - 리뷰 이미지 미리보기
  - 예약 세부정보 보기
  - 할인 정책 도움말

────────────────────────────────────────────────────────
5) 라우터별 JSON 더미 규격
────────────────────────────────────────────────────────

파일 경로:
- /data/routes/home.json
- /data/routes/gymDetail.json
- /data/routes/outdoorDetail.json
- /data/routes/booking.json
- /data/routes/payment.json
- /data/routes/reservationStatus.json
- /data/routes/ownerDashboard.json
- /data/routes/ownerSchedule.json
- /data/routes/ownerPaymentMethods.json
- /data/routes/ownerReservations.json
- /data/routes/adminReviews.json

공통 구조:
{
  "__mock": {
    "mode": "success",
    "latencyMs": 400
  },
  "page": { ... },
  "view": { ... },
  "actions": { ... }
}

규칙:
- 각 라우터는 자기 JSON 1개만 읽는다.
- 모든 UI에 필요한 필드는 그 JSON에만 넣는다.
- 라우터 간 구조 통일은 필요 없다.
- 중복 데이터 허용.
- mode는 최소 아래를 지원한다:
  - success
  - empty
  - error
- loading은 latencyMs 동안 보여준다.

각 JSON 권장 예시 구조:

1) /data/routes/home.json
{
  "__mock": { "mode": "success", "latencyMs": 300 },
  "page": {
    "title": "부산 농구 공간 찾기",
    "subtitle": "실내 체육관과 야외 농구장을 한 번에 탐색하세요"
  },
  "view": {
    "searchBar": {
      "placeholder": "부산 농구장, 체육관, 구/군 검색",
      "value": ""
    },
    "quickFilters": [
      { "key": "district", "label": "구/군", "selected": "전체", "options": ["전체", "해운대구", "수영구", "부산진구", "동래구"] },
      { "key": "placeType", "label": "장소 유형", "selected": "전체", "options": ["전체", "실내 체육관", "야외 농구장"] },
      { "key": "reservable", "label": "예약 가능", "selected": "전체", "options": ["전체", "예약 가능만"] },
      { "key": "discountable", "label": "할인 가능", "selected": "전체", "options": ["전체", "할인 가능만"] }
    ],
    "mapSummary": {
      "centerLabel": "부산광역시",
      "markerCount": 24,
      "legend": [
        { "type": "gym", "label": "실내 체육관" },
        { "type": "outdoor", "label": "야외 농구장" }
      ]
    },
    "sections": {
      "featured": [
        {
          "id": "banner-1",
          "title": "오늘 바로 빌릴 수 있는 체육관",
          "description": "할인 적용 가능 시간대 포함"
        }
      ]
    },
    "places": [
      {
        "id": "gym-101",
        "routeType": "gym",
        "name": "센텀 실내농구장",
        "district": "해운대구",
        "placeType": "실내 체육관",
        "reservable": true,
        "discountable": true,
        "thumbnail": "/mock/gym-101.jpg",
        "shortDescription": "코트 2면, 주차 가능, 샤워실 보유",
        "rating": 4.7,
        "badges": ["예약 가능", "할인 가능"]
      },
      {
        "id": "outdoor-201",
        "routeType": "outdoor",
        "name": "광안리 해변 농구코트",
        "district": "수영구",
        "placeType": "야외 농구장",
        "reservable": false,
        "discountable": false,
        "thumbnail": "/mock/outdoor-201.jpg",
        "shortDescription": "바다 근처, 조명 있음, 저녁 이용 많음",
        "rating": 4.3,
        "badges": ["야외", "리뷰 128개"]
      }
    ]
  },
  "actions": {
    "searchSubmit": "HOME_SEARCH_SUBMIT",
    "applyFilters": "HOME_APPLY_FILTERS",
    "toggleMapMode": "HOME_TOGGLE_MAP_MODE",
    "selectPlaceCard": "HOME_SELECT_PLACE_CARD"
  }
}

2) /data/routes/gymDetail.json
{
  "__mock": { "mode": "success", "latencyMs": 350 },
  "page": {
    "title": "체육관 상세"
  },
  "view": {
    "place": {
      "id": "gym-101",
      "name": "센텀 실내농구장",
      "address": "부산 해운대구 센텀동로 00",
      "district": "해운대구",
      "courtCount": 2,
      "hours": "09:00 ~ 24:00",
      "parking": true,
      "amenities": ["주차", "샤워실", "음수대", "대기공간"],
      "description": "팀 연습과 동호회 대관이 많은 실내 체육관"
    },
    "gallery": [
      { "id": "g1", "src": "/mock/g1.jpg" },
      { "id": "g2", "src": "/mock/g2.jpg" }
    ],
    "pricing": {
      "baseHourlyPrice": 60000,
      "weekdayRuleLabel": "평일 기본 60,000원 / 시간",
      "weekendRuleLabel": "주말 기본 70,000원 / 시간",
      "discountRules": [
        { "id": "dr1", "label": "4명 이하 20% 할인", "type": "rate" },
        { "id": "dr2", "label": "당일 예약만 적용", "type": "condition" }
      ]
    },
    "calendar": {
      "monthLabel": "2026년 4월",
      "selectedDate": "2026-04-15",
      "legend": [
        { "status": "available", "label": "예약 가능" },
        { "status": "class", "label": "수업" },
        { "status": "regular", "label": "정기대관" },
        { "status": "closed", "label": "마감" }
      ],
      "days": [],
      "slots": [
        { "id": "slot-1", "time": "18:00 ~ 19:00", "status": "available", "price": 60000 },
        { "id": "slot-2", "time": "19:00 ~ 20:00", "status": "class", "price": null },
        { "id": "slot-3", "time": "20:00 ~ 21:00", "status": "regular", "price": null },
        { "id": "slot-4", "time": "21:00 ~ 22:00", "status": "available", "price": 60000 }
      ]
    },
    "ownerPaymentPreview": {
      "availableMethods": ["카카오페이 송금 링크", "은행 계좌 송금"],
      "notice": "예약 신청 후 운영자에게 직접 송금하는 구조입니다."
    }
  },
  "actions": {
    "selectDate": "GYM_SELECT_DATE",
    "selectSlot": "GYM_SELECT_SLOT",
    "bookSlot": "GYM_BOOK_SLOT",
    "openGallery": "GYM_OPEN_GALLERY"
  }
}

3) /data/routes/outdoorDetail.json
{
  "__mock": { "mode": "success", "latencyMs": 350 },
  "page": {
    "title": "야외 농구장 상세"
  },
  "view": {
    "place": {
      "id": "outdoor-201",
      "name": "광안리 해변 농구코트",
      "address": "부산 수영구 광안해변로 00",
      "district": "수영구",
      "feeType": "무료",
      "floorStatus": "보통",
      "lightStatus": "좋음",
      "rimStatus": "보통",
      "cleanliness": "좋음",
      "crowdLevel": "저녁 혼잡",
      "description": "바다 근처 야외 코트. 저녁 시간 이용자 많음."
    },
    "gallery": [
      { "id": "o1", "src": "/mock/o1.jpg" },
      { "id": "o2", "src": "/mock/o2.jpg" }
    ],
    "ratingSummary": {
      "averageRating": 4.3,
      "reviewCount": 128,
      "tagSummary": [
        { "tag": "조명 좋음", "count": 82 },
        { "tag": "바닥 보통", "count": 64 },
        { "tag": "저녁 혼잡", "count": 91 }
      ]
    },
    "reviews": [
      {
        "id": "rv-1",
        "nickname": "농구좋아",
        "rating": 5,
        "tags": ["조명 좋음", "청결도 좋음"],
        "content": "저녁에 공 차기 좋고 조명이 밝은 편",
        "photos": ["/mock/review-1.jpg"],
        "visitedAt": "2026-04-10"
      }
    ],
    "reviewForm": {
      "rating": 0,
      "availableTags": ["바닥 좋음", "바닥 나쁨", "조명 좋음", "조명 나쁨", "골대 상태 좋음", "청결도 좋음", "혼잡도 높음", "혼잡도 낮음"],
      "text": "",
      "photoLimit": 3
    }
  },
  "actions": {
    "openPhotoViewer": "OUTDOOR_OPEN_PHOTO_VIEWER",
    "submitReview": "OUTDOOR_SUBMIT_REVIEW",
    "toggleTag": "OUTDOOR_TOGGLE_TAG",
    "changeRating": "OUTDOOR_CHANGE_RATING"
  }
}

4) /data/routes/booking.json
{
  "__mock": { "mode": "success", "latencyMs": 300 },
  "page": {
    "title": "예약 신청"
  },
  "view": {
    "bookingTarget": {
      "gymId": "gym-101",
      "gymName": "센텀 실내농구장",
      "date": "2026-04-15",
      "time": "18:00 ~ 19:00"
    },
    "form": {
      "teamName": "",
      "bookerName": "",
      "phone": "",
      "peopleCount": 4,
      "memo": ""
    },
    "priceCalculator": {
      "basePrice": 60000,
      "availableRules": [
        { "label": "4명 이하 20% 할인", "type": "rate", "value": 20 },
        { "label": "당일 예약 적용", "type": "condition", "value": true }
      ],
      "appliedDiscountLabel": "4명 이하 20% 할인",
      "discountAmount": 12000,
      "finalPrice": 48000
    }
  },
  "actions": {
    "changePeopleCount": "BOOKING_CHANGE_PEOPLE_COUNT",
    "changeFormValue": "BOOKING_CHANGE_FORM_VALUE",
    "submitBookingRequest": "BOOKING_SUBMIT_REQUEST"
  }
}

5) /data/routes/payment.json
{
  "__mock": { "mode": "success", "latencyMs": 300 },
  "page": {
    "title": "직접 송금 결제"
  },
  "view": {
    "reservationSummary": {
      "reservationId": "resv-101",
      "gymName": "센텀 실내농구장",
      "date": "2026-04-15",
      "time": "18:00 ~ 19:00",
      "peopleCount": 4,
      "finalPrice": 48000,
      "status": "송금 대기"
    },
    "paymentMethods": {
      "kakaoPayLink": "https://example.com/mock-kakaopay-link",
      "bankName": "국민은행",
      "accountNumber": "123-456-789012",
      "accountHolder": "홍길동"
    },
    "paymentForm": {
      "payerName": "",
      "proofImageEnabled": true,
      "proofImageName": ""
    },
    "guideMessages": [
      "플랫폼은 결제를 중개하지 않습니다.",
      "운영자에게 직접 송금한 뒤 송금 완료를 눌러주세요."
    ]
  },
  "actions": {
    "copyAccountNumber": "PAYMENT_COPY_ACCOUNT_NUMBER",
    "openKakaoPayLink": "PAYMENT_OPEN_KAKAOPAY_LINK",
    "changePayerName": "PAYMENT_CHANGE_PAYER_NAME",
    "attachProofImage": "PAYMENT_ATTACH_PROOF_IMAGE",
    "submitTransferDone": "PAYMENT_SUBMIT_TRANSFER_DONE"
  }
}

6) /data/routes/reservationStatus.json
{
  "__mock": { "mode": "success", "latencyMs": 250 },
  "page": {
    "title": "예약 상태"
  },
  "view": {
    "reservation": {
      "reservationId": "resv-101",
      "gymName": "센텀 실내농구장",
      "date": "2026-04-15",
      "time": "18:00 ~ 19:00",
      "peopleCount": 4,
      "price": 48000,
      "payerName": "김민수",
      "currentStatus": "송금 완료"
    },
    "statusTimeline": [
      { "key": "requested", "label": "신청됨", "done": true },
      { "key": "waiting", "label": "송금 대기", "done": true },
      { "key": "transferred", "label": "송금 완료", "done": true },
      { "key": "checked", "label": "확인 완료", "done": false },
      { "key": "confirmed", "label": "예약 확정", "done": false }
    ],
    "nextActions": [
      { "label": "체육관 상세 다시 보기", "target": "/place/gym/gym-101" },
      { "label": "홈으로 가기", "target": "/" }
    ]
  },
  "actions": {
    "goGymDetail": "RESERVATION_GO_GYM_DETAIL",
    "goHome": "RESERVATION_GO_HOME"
  }
}

7) /data/routes/ownerDashboard.json
{
  "__mock": { "mode": "success", "latencyMs": 250 },
  "page": {
    "title": "운영자 대시보드"
  },
  "view": {
    "ownerGymProfile": {
      "name": "센텀 실내농구장",
      "district": "해운대구",
      "courtCount": 2,
      "status": "운영 중"
    },
    "kpis": [
      { "label": "오늘 예약", "value": 5 },
      { "label": "송금 대기", "value": 2 },
      { "label": "예약 확정", "value": 8 },
      { "label": "할인 적용 예약", "value": 3 }
    ],
    "recentReservations": [
      { "id": "resv-101", "name": "김민수", "time": "18:00 ~ 19:00", "status": "송금 완료" },
      { "id": "resv-102", "name": "부산대 농구팀", "time": "20:00 ~ 22:00", "status": "예약 확정" }
    ],
    "quickActions": [
      { "label": "시간표 관리", "target": "/owner/schedule" },
      { "label": "결제수단 관리", "target": "/owner/payment-methods" },
      { "label": "예약 확인", "target": "/owner/reservations" }
    ]
  },
  "actions": {
    "goSchedule": "OWNER_DASHBOARD_GO_SCHEDULE",
    "goPaymentMethods": "OWNER_DASHBOARD_GO_PAYMENT_METHODS",
    "goReservations": "OWNER_DASHBOARD_GO_RESERVATIONS"
  }
}

8) /data/routes/ownerSchedule.json
{
  "__mock": { "mode": "success", "latencyMs": 350 },
  "page": {
    "title": "시간표 및 가격 관리"
  },
  "view": {
    "calendar": {
      "monthLabel": "2026년 4월",
      "selectedDate": "2026-04-15",
      "days": [],
      "slots": [
        { "id": "s1", "time": "18:00 ~ 19:00", "status": "available", "price": 60000 },
        { "id": "s2", "time": "19:00 ~ 20:00", "status": "class", "price": null },
        { "id": "s3", "time": "20:00 ~ 21:00", "status": "regular", "price": null }
      ]
    },
    "repeatRules": [
      { "id": "rr1", "label": "매주 화/목 19:00~20:00 수업", "type": "class" }
    ],
    "exceptionRules": [
      { "id": "ex1", "label": "4/20 임시 휴관" }
    ],
    "pricingForm": {
      "baseHourlyPrice": 60000,
      "weekendHourlyPrice": 70000,
      "discountPersonThreshold": 4,
      "discountRatePercent": 20,
      "discountFixedAmount": 0,
      "sameDayOnly": true
    }
  },
  "actions": {
    "selectScheduleDate": "OWNER_SCHEDULE_SELECT_DATE",
    "changeSlotStatus": "OWNER_SCHEDULE_CHANGE_SLOT_STATUS",
    "addRepeatRule": "OWNER_SCHEDULE_ADD_REPEAT_RULE",
    "addExceptionRule": "OWNER_SCHEDULE_ADD_EXCEPTION_RULE",
    "changePricingValue": "OWNER_SCHEDULE_CHANGE_PRICING_VALUE",
    "saveScheduleSettings": "OWNER_SCHEDULE_SAVE_SETTINGS"
  }
}

9) /data/routes/ownerPaymentMethods.json
{
  "__mock": { "mode": "success", "latencyMs": 250 },
  "page": {
    "title": "결제수단 관리"
  },
  "view": {
    "form": {
      "kakaoPayLink": "https://example.com/mock-kakaopay-link",
      "bankName": "국민은행",
      "accountNumber": "123-456-789012",
      "accountHolder": "홍길동",
      "visibleMethods": ["kakao", "bank"]
    },
    "preview": {
      "title": "사용자에게 이렇게 보입니다",
      "labels": ["카카오페이 송금 링크", "은행 계좌 송금"]
    }
  },
  "actions": {
    "changePaymentMethodValue": "OWNER_PAYMENT_METHODS_CHANGE_VALUE",
    "toggleVisibleMethod": "OWNER_PAYMENT_METHODS_TOGGLE_VISIBLE",
    "savePaymentMethods": "OWNER_PAYMENT_METHODS_SAVE"
  }
}

10) /data/routes/ownerReservations.json
{
  "__mock": { "mode": "success", "latencyMs": 300 },
  "page": {
    "title": "예약 및 입금 확인"
  },
  "view": {
    "filters": {
      "status": "전체",
      "dateRange": "이번 주"
    },
    "rows": [
      {
        "id": "resv-101",
        "bookerName": "김민수",
        "teamName": "부산대 농구동아리",
        "payerName": "김민수",
        "date": "2026-04-15",
        "time": "18:00 ~ 19:00",
        "peopleCount": 4,
        "price": 48000,
        "discountApplied": true,
        "status": "송금 완료",
        "hasProof": true
      },
      {
        "id": "resv-102",
        "bookerName": "이정훈",
        "teamName": "센텀 직장인 농구팀",
        "payerName": "",
        "date": "2026-04-16",
        "time": "20:00 ~ 22:00",
        "peopleCount": 8,
        "price": 120000,
        "discountApplied": false,
        "status": "송금 대기",
        "hasProof": false
      }
    ]
  },
  "actions": {
    "changeReservationFilter": "OWNER_RESERVATIONS_CHANGE_FILTER",
    "openReservationDetail": "OWNER_RESERVATIONS_OPEN_DETAIL",
    "markChecked": "OWNER_RESERVATIONS_MARK_CHECKED",
    "markConfirmed": "OWNER_RESERVATIONS_MARK_CONFIRMED",
    "markCancelled": "OWNER_RESERVATIONS_MARK_CANCELLED"
  }
}

11) /data/routes/adminReviews.json
{
  "__mock": { "mode": "success", "latencyMs": 250 },
  "page": {
    "title": "리뷰 및 사진 검수"
  },
  "view": {
    "filters": {
      "status": "전체",
      "placeType": "야외 농구장"
    },
    "reviewRows": [
      {
        "id": "rv-1",
        "placeName": "광안리 해변 농구코트",
        "nickname": "농구좋아",
        "rating": 5,
        "tags": ["조명 좋음", "청결도 좋음"],
        "content": "저녁에 공 차기 좋고 조명이 밝음",
        "hasPhoto": true,
        "status": "노출 중"
      },
      {
        "id": "rv-2",
        "placeName": "광안리 해변 농구코트",
        "nickname": "슛감좋음",
        "rating": 2,
        "tags": ["혼잡도 높음"],
        "content": "주말엔 사람이 많음",
        "hasPhoto": false,
        "status": "숨김"
      }
    ]
  },
  "actions": {
    "changeAdminReviewFilter": "ADMIN_REVIEWS_CHANGE_FILTER",
    "previewReviewPhoto": "ADMIN_REVIEWS_PREVIEW_PHOTO",
    "hideReview": "ADMIN_REVIEWS_HIDE",
    "restoreReview": "ADMIN_REVIEWS_RESTORE"
  }
}

────────────────────────────────────────────────────────
6) 라우터별 상세 명세
────────────────────────────────────────────────────────

[Route: "/"]

- 목적
  - 부산 지역 실내 체육관과 야외 농구장을 한 번에 탐색한다.
  - 지도/목록/필터를 중심으로 사용자의 첫 진입 경험을 구성한다.
  - 상세 페이지로 이동하는 허브 역할을 한다.

- 진입 조건
  - 앱 최초 진입
  - 홈 이동 버튼 클릭
  - public 접근 가능

- 레이아웃 (위→아래)
  1. Header
  2. 검색창
  3. 퀵 필터 칩
  4. 추천/프로모션 배너
  5. 지도 프리뷰 박스
  6. 지도/목록 전환 탭
  7. 장소 카드 리스트
  8. Empty / Error / Loading 대체 UI
  9. Bottom Navigation

- 표시 데이터(JSON 경로)
  - page.title
  - page.subtitle
  - view.searchBar
  - view.quickFilters
  - view.mapSummary
  - view.sections.featured
  - view.places

- 버튼 목록
  - 검색 실행
  - 필터 적용
  - 지도 보기
  - 목록 보기
  - 장소 카드 클릭
  - 필터 초기화

- 이벤트명
  - HOME_SEARCH_SUBMIT
  - HOME_APPLY_FILTERS
  - HOME_TOGGLE_MAP_MODE
  - HOME_SELECT_PLACE_CARD

- 클릭 시 UI 변화
  - 검색/필터 적용 시 리스트 재정렬 또는 필터링
  - 지도 보기 선택 시 지도 영역 확대
  - 목록 보기 선택 시 리스트 중심 전환
  - 장소 카드 클릭 시 routeType에 따라 다른 상세 페이지 이동
    - gym → "/place/gym/:id"
    - outdoor → "/place/outdoor/:id"
  - 결과가 없으면 Empty UI
  - error 모드면 에러 배너와 재시도 버튼 표시

- 상태 머신
  - initial
    - 최초 진입 직후
  - loading
    - 검색창/지도/카드 스켈레톤 표시
  - success
    - 장소 목록과 지도 프리뷰 정상 표시
  - empty
    - 필터 결과 0개
  - error
    - 데이터 표시 실패

- ASCII Layout
  ┌──────────────────────────────────────────────┐
  │ BASKET BUSAN                       [검색][필터] │
  ├──────────────────────────────────────────────┤
  │ 부산 농구 공간 찾기                           │
  │ 실내 체육관과 야외 농구장을 한 번에 탐색하세요 │
  ├──────────────────────────────────────────────┤
  │ [ 부산 농구장, 체육관, 구/군 검색            ] │
  ├──────────────────────────────────────────────┤
  │ [구/군] [장소 유형] [예약 가능] [할인 가능]   │
  ├──────────────────────────────────────────────┤
  │ [ 추천 배너 ]                                │
  │ 오늘 바로 빌릴 수 있는 체육관                 │
  ├──────────────────────────────────────────────┤
  │ ┌──────────── 부산 지도 프리뷰 ────────────┐ │
  │ │  ● 실내   ● 야외   ● 실내                │ │
  │ │       ● 야외       ● 실내                │ │
  │ └────────────────────────────────────────┘ │
  │ [목록 보기] [지도 보기]                      │
  ├──────────────────────────────────────────────┤
  │ [장소 카드] 센텀 실내농구장                   │
  │ 해운대구 · 실내 체육관                        │
  │ 예약 가능 · 할인 가능 · 평점 4.7              │
  │ 코트 2면, 주차 가능, 샤워실 보유             │
  ├──────────────────────────────────────────────┤
  │ [장소 카드] 광안리 해변 농구코트              │
  │ 수영구 · 야외 농구장                          │
  │ 리뷰 128개 · 평점 4.3                        │
  │ 바다 근처, 조명 있음, 저녁 이용 많음         │
  ├──────────────────────────────────────────────┤
  │ 홈      탐색      예약상태      더보기         │
  └──────────────────────────────────────────────┘

[Route: "/place/gym/:id"]

- 목적
  - 실내 체육관의 상세 정보, 가격, 시간표, 예약 가능 슬롯을 보여준다.
  - 사용자가 예약 가능한 시간 슬롯을 선택하고 예약 화면으로 진입하도록 한다.

- 진입 조건
  - 홈에서 실내 체육관 카드 클릭
  - 예약 상태 페이지에서 체육관 상세 다시 보기 클릭

- 레이아웃 (위→아래)
  1. Header + 뒤로가기
  2. 이미지 갤러리
  3. 체육관 핵심 정보 카드
  4. 가격 및 할인 정책 카드
  5. 월간 시간표 캘린더
  6. 선택 날짜 슬롯 리스트
  7. 결제 구조 안내 카드
  8. 하단 고정 예약 CTA

- 표시 데이터(JSON 경로)
  - view.place
  - view.gallery
  - view.pricing
  - view.calendar
  - view.ownerPaymentPreview

- 버튼 목록
  - 뒤로가기
  - 갤러리 확대
  - 날짜 선택
  - 시간 슬롯 선택
  - 예약 신청
  - 가격/할인 상세 보기

- 이벤트명
  - GYM_OPEN_GALLERY
  - GYM_SELECT_DATE
  - GYM_SELECT_SLOT
  - GYM_BOOK_SLOT

- 클릭 시 UI 변화
  - 날짜 선택 시 슬롯 리스트 갱신
  - available 슬롯 클릭 시 active 상태
  - class / regular / closed 클릭 시 토스트
  - 예약 가능한 슬롯 선택 후 CTA 활성화
  - 예약 신청 클릭 시 "/booking/:gymId" 이동

- 상태 머신
  - initial
  - loading
  - success
  - empty
    - 시간표 없음
  - error
    - 상세 정보 오류 또는 시간표 오류

- ASCII Layout
  ┌──────────────────────────────────────────────┐
  │ ← 체육관 상세                                 │
  ├──────────────────────────────────────────────┤
  │ [ 메인 이미지 크게 ]                          │
  │ [썸네일1] [썸네일2] [더보기]                  │
  ├──────────────────────────────────────────────┤
  │ 센텀 실내농구장                               │
  │ 해운대구 · 코트 2면                           │
  │ 운영시간 09:00 ~ 24:00                        │
  │ 주차 가능 · 샤워실 · 음수대 · 대기공간        │
  ├──────────────────────────────────────────────┤
  │ 가격 및 할인                                  │
  │ 평일 기본 60,000원 / 시간                     │
  │ 주말 기본 70,000원 / 시간                     │
  │ 4명 이하 20% 할인                             │
  │ 당일 예약만 적용                              │
  ├──────────────────────────────────────────────┤
  │ 2026년 4월                                    │
  │ [캘린더 그리드]                               │
  │ 범례: 예약 가능 / 수업 / 정기대관 / 마감      │
  ├──────────────────────────────────────────────┤
  │ 선택 날짜: 4/15                               │
  │ [18:00 ~ 19:00] 예약 가능 / 60,000원          │
  │ [19:00 ~ 20:00] 수업                          │
  │ [20:00 ~ 21:00] 정기대관                      │
  │ [21:00 ~ 22:00] 예약 가능 / 60,000원          │
  ├──────────────────────────────────────────────┤
  │ 결제 안내                                      │
  │ 예약 신청 후 운영자에게 직접 송금합니다.      │
  │ 카카오페이 송금 링크 / 은행 계좌 송금 지원    │
  ├──────────────────────────────────────────────┤
  │ [ 예약 신청하기 ]                              │
  └──────────────────────────────────────────────┘

[Route: "/place/outdoor/:id"]

- 목적
  - 야외 농구장의 실제 상태를 별점, 태그, 사진, 댓글 중심으로 보여준다.
  - 사용자가 리뷰를 작성할 수 있게 한다.

- 진입 조건
  - 홈에서 야외 농구장 카드 클릭

- 레이아웃 (위→아래)
  1. Header + 뒤로가기
  2. 이미지 갤러리
  3. 장소 핵심 정보 카드
  4. 상태 요약 카드
  5. 평균 별점/태그 요약
  6. 리뷰 리스트
  7. 리뷰 작성 영역

- 표시 데이터(JSON 경로)
  - view.place
  - view.gallery
  - view.ratingSummary
  - view.reviews
  - view.reviewForm

- 버튼 목록
  - 사진 확대
  - 리뷰 작성
  - 태그 선택
  - 별점 선택
  - 사진 첨부

- 이벤트명
  - OUTDOOR_OPEN_PHOTO_VIEWER
  - OUTDOOR_SUBMIT_REVIEW
  - OUTDOOR_TOGGLE_TAG
  - OUTDOOR_CHANGE_RATING

- 클릭 시 UI 변화
  - 갤러리 확대 모달
  - 별점 클릭 시 선택 반영
  - 태그 선택 시 chip active
  - 리뷰 제출 시 리스트 상단에 즉시 반영
  - empty 모드면 “첫 리뷰를 남겨보세요”

- 상태 머신
  - initial
  - loading
  - success
  - empty
  - error

- ASCII Layout
  ┌──────────────────────────────────────────────┐
  │ ← 야외 농구장 상세                             │
  ├──────────────────────────────────────────────┤
  │ [ 메인 이미지 크게 ]                          │
  │ [썸네일1] [썸네일2]                           │
  ├──────────────────────────────────────────────┤
  │ 광안리 해변 농구코트                           │
  │ 수영구 · 무료                                 │
  │ 바다 근처 야외 코트. 저녁 시간 이용 많음      │
  ├──────────────────────────────────────────────┤
  │ 시설 상태                                      │
  │ 바닥: 보통   조명: 좋음                        │
  │ 골대: 보통   청결도: 좋음                      │
  │ 혼잡도: 저녁 혼잡                              │
  ├──────────────────────────────────────────────┤
  │ 평균 별점 4.3                                 │
  │ 리뷰 128개                                    │
  │ [조명 좋음] [바닥 보통] [저녁 혼잡]           │
  ├──────────────────────────────────────────────┤
  │ 리뷰                                           │
  │ ★★★★★ 농구좋아                                │
  │ 조명 좋음 · 청결도 좋음                        │
  │ 저녁에 공 차기 좋고 조명이 밝은 편            │
  │ [사진 1장]                                     │
  ├──────────────────────────────────────────────┤
  │ 리뷰 작성                                      │
  │ 별점: ☆☆☆☆☆                                   │
  │ [바닥 좋음] [조명 좋음] [혼잡도 낮음]         │
  │ [한줄 리뷰 입력창                              ]│
  │ [사진 첨부]                                    │
  │ [ 리뷰 등록 ]                                  │
  └──────────────────────────────────────────────┘

[Route: "/booking/:gymId"]

- 목적
  - 예약에 필요한 사용자 정보를 입력받고
  - 인원 기반 할인 적용 결과와 최종 금액을 보여준다.

- 진입 조건
  - 체육관 상세에서 예약 신청 클릭
  - 예약 가능한 시간 슬롯 선택 완료

- 레이아웃 (위→아래)
  1. Header + 뒤로가기
  2. 예약 대상 요약 카드
  3. 예약자 정보 입력 폼
  4. 인원 수 입력
  5. 가격 계산 카드
  6. 안내 문구
  7. 하단 CTA

- 표시 데이터(JSON 경로)
  - view.bookingTarget
  - view.form
  - view.priceCalculator

- 버튼 목록
  - 인원 수 감소
  - 인원 수 증가
  - 입력 변경
  - 예약 신청 계속하기

- 이벤트명
  - BOOKING_CHANGE_PEOPLE_COUNT
  - BOOKING_CHANGE_FORM_VALUE
  - BOOKING_SUBMIT_REQUEST

- 클릭 시 UI 변화
  - 인원 수 변경 시 할인 재계산
  - 할인 적용 라벨/금액/최종 금액 즉시 갱신
  - 필수값 부족 시 CTA 비활성화
  - CTA 클릭 시 "/payment/:reservationId" 이동

- 상태 머신
  - initial
  - loading
  - success
  - empty
    - 예약 대상 누락이면 비정상
  - error

- ASCII Layout
  ┌──────────────────────────────────────────────┐
  │ ← 예약 신청                                    │
  ├──────────────────────────────────────────────┤
  │ 예약 대상                                      │
  │ 센텀 실내농구장                                │
  │ 2026-04-15 / 18:00 ~ 19:00                     │
  ├──────────────────────────────────────────────┤
  │ 팀명 또는 그룹명                               │
  │ [ 입력                                         ]│
  │ 예약자명                                       │
  │ [ 입력                                         ]│
  │ 연락처                                         │
  │ [ 입력                                         ]│
  ├──────────────────────────────────────────────┤
  │ 인원 수                                         │
  │ [ - ]        4명        [ + ]                  │
  ├──────────────────────────────────────────────┤
  │ 가격 계산                                       │
  │ 기본 금액: 60,000원                            │
  │ 적용 할인: 4명 이하 20% 할인                   │
  │ 할인 금액: -12,000원                           │
  │ 최종 금액: 48,000원                            │
  ├──────────────────────────────────────────────┤
  │ 예약 신청 후 운영자 결제수단이 표시됩니다.     │
  ├──────────────────────────────────────────────┤
  │ [ 결제 단계로 이동 ]                           │
  └──────────────────────────────────────────────┘

[Route: "/payment/:reservationId"]

- 목적
  - 운영자의 송금 수단을 보여주고
  - 사용자가 직접 송금 후 송금 완료 처리하게 한다.

- 진입 조건
  - 예약 신청 완료 후 결제 단계 진입

- 레이아웃 (위→아래)
  1. Header + 뒤로가기
  2. 예약 요약 카드
  3. 카카오페이 송금 카드
  4. 은행 계좌 송금 카드
  5. 입금자명 입력
  6. 증빙 이미지 선택
  7. 안내 문구
  8. 송금 완료 버튼

- 표시 데이터(JSON 경로)
  - view.reservationSummary
  - view.paymentMethods
  - view.paymentForm
  - view.guideMessages

- 버튼 목록
  - 카카오페이 링크 열기
  - 계좌번호 복사
  - 입금자명 입력
  - 증빙 이미지 첨부
  - 송금 완료

- 이벤트명
  - PAYMENT_COPY_ACCOUNT_NUMBER
  - PAYMENT_OPEN_KAKAOPAY_LINK
  - PAYMENT_CHANGE_PAYER_NAME
  - PAYMENT_ATTACH_PROOF_IMAGE
  - PAYMENT_SUBMIT_TRANSFER_DONE

- 클릭 시 UI 변화
  - 계좌번호 복사 시 토스트
  - 카카오페이 링크 버튼 시 mock 이동 안내
  - 입금자명 입력 상태 반영
  - 증빙 이미지 파일명 미리보기
  - 송금 완료 클릭 시 상태값 “송금 완료”로 전이 후 "/reservation/:reservationId" 이동

- 상태 머신
  - initial
  - loading
  - success
  - empty
    - 결제수단 없음
  - error
    - 결제 정보 표시 오류

- ASCII Layout
  ┌──────────────────────────────────────────────┐
  │ ← 직접 송금 결제                               │
  ├──────────────────────────────────────────────┤
  │ 예약 요약                                      │
  │ 센텀 실내농구장                                │
  │ 2026-04-15 / 18:00 ~ 19:00                     │
  │ 인원 4명 / 최종 금액 48,000원                  │
  │ 상태: 송금 대기                                │
  ├──────────────────────────────────────────────┤
  │ 카카오페이 송금                                │
  │ [ 카카오페이 송금 링크 열기 ]                  │
  ├──────────────────────────────────────────────┤
  │ 은행 계좌 송금                                 │
  │ 국민은행                                       │
  │ 123-456-789012                                 │
  │ 예금주: 홍길동                                 │
  │ [ 계좌번호 복사 ]                              │
  ├──────────────────────────────────────────────┤
  │ 입금자명                                       │
  │ [ 입력                                         ]│
  ├──────────────────────────────────────────────┤
  │ 증빙 이미지 (선택)                             │
  │ [ 파일 선택 ]                                  │
  ├──────────────────────────────────────────────┤
  │ 플랫폼은 결제를 중개하지 않습니다.             │
  │ 운영자에게 직접 송금 후 완료 버튼을 눌러주세요 │
  ├──────────────────────────────────────────────┤
  │ [ 송금 완료 ]                                  │
  └──────────────────────────────────────────────┘

[Route: "/reservation/:reservationId"]

- 목적
  - 예약 상태를 단계별로 보여준다.
  - 사용자가 현재 예약 진행 상황을 확인하게 한다.
  - 홈 또는 체육관 상세로 이동하게 한다.

- 진입 조건
  - 송금 완료 처리 후 이동
  - 예약상태 확인 진입

- 레이아웃 (위→아래)
  1. Header
  2. 예약 요약 카드
  3. 상태 타임라인
  4. 상태 설명 카드
  5. 다음 행동 버튼

- 표시 데이터(JSON 경로)
  - view.reservation
  - view.statusTimeline
  - view.nextActions

- 버튼 목록
  - 체육관 상세 다시 보기
  - 홈으로 가기

- 이벤트명
  - RESERVATION_GO_GYM_DETAIL
  - RESERVATION_GO_HOME

- 클릭 시 UI 변화
  - 타임라인 단계 강조
  - 버튼 클릭 시 해당 경로 이동

- 상태 머신
  - initial
  - loading
  - success
  - empty
  - error

- ASCII Layout
  ┌──────────────────────────────────────────────┐
  │ 예약 상태                                      │
  ├──────────────────────────────────────────────┤
  │ 센텀 실내농구장                                │
  │ 2026-04-15 / 18:00 ~ 19:00                     │
  │ 인원 4명 / 48,000원                            │
  │ 입금자명: 김민수                               │
  │ 현재 상태: 송금 완료                           │
  ├──────────────────────────────────────────────┤
  │ 상태 타임라인                                  │
  │ [신청됨]──[송금 대기]──[송금 완료]──[확인 완료]──[예약 확정] │
  │    완료        완료         현재         대기          대기   │
  ├──────────────────────────────────────────────┤
  │ 운영자가 입금을 확인하면 예약이 확정됩니다.    │
  ├──────────────────────────────────────────────┤
  │ [ 체육관 상세 다시 보기 ]                      │
  │ [ 홈으로 가기 ]                                │
  └──────────────────────────────────────────────┘

[Route: "/owner/dashboard"]

- 목적
  - 운영자가 현재 운영 상태를 한눈에 파악한다.
  - 주요 관리 화면으로 이동하는 시작점이다.

- 진입 조건
  - owner mock 접근

- 레이아웃 (위→아래)
  1. Header + OWNER 배지
  2. 운영 체육관 프로필
  3. KPI 카드 그리드
  4. 최근 예약 리스트
  5. 빠른 작업 카드

- 표시 데이터(JSON 경로)
  - view.ownerGymProfile
  - view.kpis
  - view.recentReservations
  - view.quickActions

- 버튼 목록
  - 시간표 관리
  - 결제수단 관리
  - 예약 확인

- 이벤트명
  - OWNER_DASHBOARD_GO_SCHEDULE
  - OWNER_DASHBOARD_GO_PAYMENT_METHODS
  - OWNER_DASHBOARD_GO_RESERVATIONS

- 클릭 시 UI 변화
  - 각 관리 화면으로 이동
  - 최근 예약 클릭 시 예약 상세 drawer 가능

- 상태 머신
  - initial
  - loading
  - success
  - empty
    - 최근 예약 없음
  - error

- ASCII Layout
  ┌──────────────────────────────────────────────┐
  │ 운영자 대시보드                         [OWNER] │
  ├──────────────────────────────────────────────┤
  │ 센텀 실내농구장 / 해운대구 / 코트 2면          │
  │ 상태: 운영 중                                 │
  ├──────────────────────────────────────────────┤
  │ [오늘 예약 5] [송금 대기 2]                   │
  │ [예약 확정 8] [할인 적용 3]                   │
  ├──────────────────────────────────────────────┤
  │ 최근 예약                                      │
  │ 김민수 / 18:00 ~ 19:00 / 송금 완료            │
  │ 부산대 농구동아리 / 20:00 ~ 22:00 / 예약 확정 │
  ├──────────────────────────────────────────────┤
  │ [ 시간표 관리 ]                                │
  │ [ 결제수단 관리 ]                              │
  │ [ 예약 및 입금 확인 ]                          │
  └──────────────────────────────────────────────┘

[Route: "/owner/schedule"]

- 목적
  - 운영자가 시간표, 가격, 할인 정책을 함께 관리한다.

- 진입 조건
  - 운영자 대시보드에서 진입

- 레이아웃 (위→아래)
  1. Header + 뒤로가기
  2. 월간 캘린더
  3. 선택 날짜 슬롯 편집 패널
  4. 반복 일정 카드
  5. 예외 일정 카드
  6. 가격/할인 정책 폼
  7. 저장 버튼

- 표시 데이터(JSON 경로)
  - view.calendar
  - view.repeatRules
  - view.exceptionRules
  - view.pricingForm

- 버튼 목록
  - 날짜 선택
  - 슬롯 상태 변경
  - 반복 일정 추가
  - 예외 일정 추가
  - 가격 수정
  - 저장

- 이벤트명
  - OWNER_SCHEDULE_SELECT_DATE
  - OWNER_SCHEDULE_CHANGE_SLOT_STATUS
  - OWNER_SCHEDULE_ADD_REPEAT_RULE
  - OWNER_SCHEDULE_ADD_EXCEPTION_RULE
  - OWNER_SCHEDULE_CHANGE_PRICING_VALUE
  - OWNER_SCHEDULE_SAVE_SETTINGS

- 클릭 시 UI 변화
  - 날짜 선택 시 슬롯 리스트 갱신
  - 슬롯 상태 변경 시 즉시 색상 반영
  - 가격/할인 입력 변경 즉시 폼 반영
  - 저장 시 toast

- 상태 머신
  - initial
  - loading
  - success
  - empty
    - 규칙 없음
  - error

- ASCII Layout
  ┌──────────────────────────────────────────────┐
  │ ← 시간표 및 가격 관리                          │
  ├──────────────────────────────────────────────┤
  │ 2026년 4월                                    │
  │ [캘린더 그리드]                               │
  ├──────────────────────────────────────────────┤
  │ 선택 날짜: 4/15                               │
  │ 18:00 ~ 19:00 [예약 가능 ▼]                   │
  │ 19:00 ~ 20:00 [수업 ▼]                        │
  │ 20:00 ~ 21:00 [정기대관 ▼]                    │
  ├──────────────────────────────────────────────┤
  │ 반복 일정                                      │
  │ 매주 화/목 19:00 ~ 20:00 수업                 │
  │ [ 반복 일정 추가 ]                            │
  ├──────────────────────────────────────────────┤
  │ 예외 일정                                      │
  │ 4/20 임시 휴관                                │
  │ [ 예외 일정 추가 ]                            │
  ├──────────────────────────────────────────────┤
  │ 가격 및 할인                                   │
  │ 기본 시간당 가격 [ 60000 ]                    │
  │ 주말 시간당 가격 [ 70000 ]                    │
  │ 할인 기준 인원 [ 4 ]                          │
  │ 정률 할인 %   [ 20 ]                          │
  │ 정액 할인 금액 [ 0 ]                          │
  │ 당일 예약만 적용 [ ON ]                       │
  ├──────────────────────────────────────────────┤
  │ [ 저장 ]                                       │
  └──────────────────────────────────────────────┘

[Route: "/owner/payment-methods"]

- 목적
  - 운영자가 사용자에게 노출할 결제수단을 직접 설정한다.

- 진입 조건
  - 운영자 대시보드에서 진입

- 레이아웃 (위→아래)
  1. Header + 뒤로가기
  2. 결제수단 입력 폼
  3. 노출 여부 토글
  4. 사용자 화면 미리보기
  5. 저장 버튼

- 표시 데이터(JSON 경로)
  - view.form
  - view.preview

- 버튼 목록
  - 입력 변경
  - 노출 토글
  - 저장

- 이벤트명
  - OWNER_PAYMENT_METHODS_CHANGE_VALUE
  - OWNER_PAYMENT_METHODS_TOGGLE_VISIBLE
  - OWNER_PAYMENT_METHODS_SAVE

- 클릭 시 UI 변화
  - 폼 값 즉시 반영
  - visibleMethods 토글 시 미리보기 변경
  - 저장 시 성공 토스트

- 상태 머신
  - initial
  - loading
  - success
  - empty
  - error

- ASCII Layout
  ┌──────────────────────────────────────────────┐
  │ ← 결제수단 관리                                │
  ├──────────────────────────────────────────────┤
  │ 카카오페이 송금 링크                           │
  │ [ https://example.com/...                    ]│
  ├──────────────────────────────────────────────┤
  │ 은행명                                         │
  │ [ 국민은행                                     ]│
  │ 계좌번호                                       │
  │ [ 123-456-789012                              ]│
  │ 예금주명                                       │
  │ [ 홍길동                                       ]│
  ├──────────────────────────────────────────────┤
  │ 사용자에게 노출                                │
  │ [x] 카카오페이                                 │
  │ [x] 은행 계좌                                  │
  ├──────────────────────────────────────────────┤
  │ 사용자 미리보기                                │
  │ - 카카오페이 송금 링크                         │
  │ - 은행 계좌 송금                               │
  ├──────────────────────────────────────────────┤
  │ [ 저장 ]                                       │
  └──────────────────────────────────────────────┘

[Route: "/owner/reservations"]

- 목적
  - 운영자가 예약 상태와 입금 상태를 확인하고 변경한다.

- 진입 조건
  - 운영자 대시보드에서 진입

- 레이아웃 (위→아래)
  1. Header + 뒤로가기
  2. 필터 바
  3. 예약 리스트/테이블
  4. 상세 drawer 또는 modal
  5. 상태 변경 액션

- 표시 데이터(JSON 경로)
  - view.filters
  - view.rows

- 버튼 목록
  - 필터 변경
  - 상세 보기
  - 확인 완료
  - 예약 확정
  - 취소 처리

- 이벤트명
  - OWNER_RESERVATIONS_CHANGE_FILTER
  - OWNER_RESERVATIONS_OPEN_DETAIL
  - OWNER_RESERVATIONS_MARK_CHECKED
  - OWNER_RESERVATIONS_MARK_CONFIRMED
  - OWNER_RESERVATIONS_MARK_CANCELLED

- 클릭 시 UI 변화
  - 상태 필터링
  - 상세 drawer 열기
  - 확인 완료 클릭 시 status 변경
  - 예약 확정 클릭 시 status 변경
  - 취소 클릭 시 status 변경 및 danger 스타일 반영

- 상태 머신
  - initial
  - loading
  - success
  - empty
    - 예약 없음
  - error

- ASCII Layout
  ┌──────────────────────────────────────────────┐
  │ ← 예약 및 입금 확인                            │
  ├──────────────────────────────────────────────┤
  │ [상태 필터] [기간 필터]                        │
  ├──────────────────────────────────────────────┤
  │ 김민수 / 부산대 농구동아리                     │
  │ 4/15 18:00 ~ 19:00 / 4명 / 48,000원           │
  │ 입금자명: 김민수 / 할인 적용 / 송금 완료       │
  │ [ 상세 ] [ 확인 완료 ] [ 예약 확정 ] [ 취소 ]  │
  ├──────────────────────────────────────────────┤
  │ 이정훈 / 센텀 직장인 농구팀                    │
  │ 4/16 20:00 ~ 22:00 / 8명 / 120,000원          │
  │ 입금자명 없음 / 할인 미적용 / 송금 대기        │
  │ [ 상세 ] [ 확인 완료 ] [ 예약 확정 ] [ 취소 ]  │
  └──────────────────────────────────────────────┘

[Route: "/admin/reviews"]

- 목적
  - 관리자가 야외 농구장 리뷰와 사진을 검수하고 숨김/복구 처리한다.

- 진입 조건
  - admin mock 접근

- 레이아웃 (위→아래)
  1. Header + ADMIN 배지
  2. 필터 바
  3. 리뷰 리스트
  4. 사진 미리보기 모달
  5. 숨김/복구 액션

- 표시 데이터(JSON 경로)
  - view.filters
  - view.reviewRows

- 버튼 목록
  - 필터 변경
  - 사진 미리보기
  - 숨김 처리
  - 복구

- 이벤트명
  - ADMIN_REVIEWS_CHANGE_FILTER
  - ADMIN_REVIEWS_PREVIEW_PHOTO
  - ADMIN_REVIEWS_HIDE
  - ADMIN_REVIEWS_RESTORE

- 클릭 시 UI 변화
  - 필터 적용
  - 사진 모달 오픈
  - 상태 배지 변경
  - 숨김/복구 토스트

- 상태 머신
  - initial
  - loading
  - success
  - empty
  - error

- ASCII Layout
  ┌──────────────────────────────────────────────┐
  │ 리뷰 및 사진 검수                       [ADMIN] │
  ├──────────────────────────────────────────────┤
  │ [상태 필터] [장소 유형 필터]                    │
  ├──────────────────────────────────────────────┤
  │ 광안리 해변 농구코트                           │
  │ 농구좋아 / ★5 / 조명 좋음, 청결도 좋음         │
  │ 저녁에 공 차기 좋고 조명이 밝음               │
  │ 사진 있음 / 상태: 노출 중                      │
  │ [ 사진 보기 ] [ 숨김 처리 ]                    │
  ├──────────────────────────────────────────────┤
  │ 광안리 해변 농구코트                           │
  │ 슛감좋음 / ★2 / 혼잡도 높음                    │
  │ 주말엔 사람이 많음                             │
  │ 사진 없음 / 상태: 숨김                         │
  │ [ 복구 ]                                       │
  └──────────────────────────────────────────────┘

────────────────────────────────────────────────────────
7) 핵심 사용자 플로우
────────────────────────────────────────────────────────

1. 팀 대표 예약 완료 플로우
"/"
→ HOME_SELECT_PLACE_CARD
→ "/place/gym/:id"
→ GYM_SELECT_DATE
→ GYM_SELECT_SLOT
→ GYM_BOOK_SLOT
→ "/booking/:gymId"
→ BOOKING_CHANGE_PEOPLE_COUNT
→ BOOKING_CHANGE_FORM_VALUE
→ BOOKING_SUBMIT_REQUEST
→ "/payment/:reservationId"
→ PAYMENT_COPY_ACCOUNT_NUMBER
→ PAYMENT_CHANGE_PAYER_NAME
→ PAYMENT_SUBMIT_TRANSFER_DONE
→ "/reservation/:reservationId"

2. 팀 대표 체육관 재확인 플로우
"/"
→ HOME_APPLY_FILTERS
→ HOME_SELECT_PLACE_CARD
→ "/place/gym/:id"
→ GYM_OPEN_GALLERY
→ GYM_SELECT_DATE
→ GYM_SELECT_SLOT
→ GYM_BOOK_SLOT
→ "/booking/:gymId"
→ BOOKING_SUBMIT_REQUEST
→ "/payment/:reservationId"
→ PAYMENT_OPEN_KAKAOPAY_LINK
→ PAYMENT_SUBMIT_TRANSFER_DONE
→ "/reservation/:reservationId"
→ RESERVATION_GO_GYM_DETAIL
→ "/place/gym/:id"

3. 야외 농구장 리뷰 작성 플로우
"/"
→ HOME_SELECT_PLACE_CARD
→ "/place/outdoor/:id"
→ OUTDOOR_CHANGE_RATING
→ OUTDOOR_TOGGLE_TAG
→ OUTDOOR_SUBMIT_REVIEW
→ "/place/outdoor/:id"

4. 운영자 시간표/가격 관리 플로우
"/owner/dashboard"
→ OWNER_DASHBOARD_GO_SCHEDULE
→ "/owner/schedule"
→ OWNER_SCHEDULE_SELECT_DATE
→ OWNER_SCHEDULE_CHANGE_SLOT_STATUS
→ OWNER_SCHEDULE_CHANGE_PRICING_VALUE
→ OWNER_SCHEDULE_SAVE_SETTINGS
→ "/owner/schedule"

5. 운영자 결제수단 관리 플로우
"/owner/dashboard"
→ OWNER_DASHBOARD_GO_PAYMENT_METHODS
→ "/owner/payment-methods"
→ OWNER_PAYMENT_METHODS_CHANGE_VALUE
→ OWNER_PAYMENT_METHODS_TOGGLE_VISIBLE
→ OWNER_PAYMENT_METHODS_SAVE
→ "/owner/payment-methods"

6. 운영자 입금 확인 플로우
"/owner/dashboard"
→ OWNER_DASHBOARD_GO_RESERVATIONS
→ "/owner/reservations"
→ OWNER_RESERVATIONS_OPEN_DETAIL
→ OWNER_RESERVATIONS_MARK_CHECKED
→ OWNER_RESERVATIONS_MARK_CONFIRMED
→ "/owner/reservations"

7. 관리자 리뷰 검수 플로우
"/admin/reviews"
→ ADMIN_REVIEWS_PREVIEW_PHOTO
→ ADMIN_REVIEWS_HIDE
→ "/admin/reviews"
→ ADMIN_REVIEWS_RESTORE
→ "/admin/reviews"

────────────────────────────────────────────────────────
8) QA 체크리스트
────────────────────────────────────────────────────────

□ 모든 라우터에 직접 진입 가능하다.
□ 각 라우터는 자기 JSON 파일 1개만 읽는다.
□ fetch/axios/network 코드가 없다.
□ 서버/API/DB 생성 코드가 없다.
□ 홈에서 실내 체육관과 야외 농구장을 함께 탐색할 수 있다.
□ 홈에서 지도/목록/필터가 모두 동작한다.
□ 실내 체육관 상세와 야외 농구장 상세 UI가 분리되어 있다.
□ 체육관 상세에서 시간표 상태가 명확히 구분된다.
□ 예약 가능한 슬롯만 선택 가능하다.
□ 수업/정기대관/마감 슬롯 클릭 시 예약 불가 토스트가 뜬다.
□ 예약 화면에서 인원 수 변경 시 할인 금액과 최종 금액이 즉시 변한다.
□ 결제 화면에서 카카오페이 링크/계좌 송금 UI가 모두 보인다.
□ 계좌번호 복사 UI가 있다.
□ 입금자명 입력 후 송금 완료 상태 전이가 가능하다.
□ 예약 상태 페이지에서 상태 타임라인이 보인다.
□ 운영자 대시보드에서 KPI와 빠른 작업이 보인다.
□ 운영자 시간표 관리 화면에서 슬롯 상태 변경이 가능하다.
□ 운영자 시간표 관리 화면에서 가격/할인 정책 수정이 가능하다.
□ 운영자 결제수단 관리 화면에서 링크/계좌/예금주 수정이 가능하다.
□ 운영자 예약 콘솔에서 확인 완료 / 예약 확정 / 취소 처리가 가능하다.
□ 관리자 리뷰 화면에서 숨김/복구가 가능하다.
□ 모든 라우터에 loading / success / empty / error 상태가 존재한다.
□ 라우터별 ASCII Layout 의도와 실제 렌더 구조가 유사하다.
□ 모바일 UI가 우선이며 데스크톱에서도 자연스럽게 확장된다.
□ 페이지 완결을 우선하며 과도한 컴포넌트 추상화가 없다.

이 문서를 그대로 입력하면,
부산 농구 공간 플랫폼의 프론트엔드 목업이
라우터 단위로 완결된 형태로 생성되어야 한다.