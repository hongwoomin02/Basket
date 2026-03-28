프로젝트명: BusoCourt (가칭) — 부산 농구 체육관 대관 & 픽업게임 목업
목적: 부산 지역 체육관 시간표 기반 “대관 예약”과 “픽업게임 게스트 신청/결제” 흐름을 실제 서비스처럼 UI/UX 테스트할 수 있는 프론트엔드 목업을 만든다.
서비스 유형: Web (모바일 반응형) 프론트엔드 목업
MVP 범위:
- 부산 지역 체육관 목록/상세/시간표 확인
- 대관 예약(시간 슬롯 선택 → 인원 입력 → 결제 시뮬레이션 → 확정)
- 픽업게임 목록/상세/신청(결제 시뮬레이션 → 확정, 인원 카운트 변화)
- 사장용: 체육관/시간표/가격(인원 기반 할인) 설정 화면 (UI로만)
- 운영자용: 픽업게임 생성 화면 (UI로만)
- 운영자(내부)용: 더미 데이터 모드 전환(성공/빈/에러) 및 간단 로그 확인

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
모든 데이터는 로컬 JSON 더미 파일에서만 가져온다.
모든 인터랙션은 로컬 상태 변화로만 시뮬레이션한다.

────────────────────────────────────────────────────────
[PRD 요약] (UI 기준)
────────────────────────────────────────────────────────
1) What
- 체육관 시간표를 “예약 가능/정기대관/마감” 상태로 보여주고, 대관 예약과 픽업게임 게스트 모집을 한 서비스에서 진행한다.
- 연락처 노출 없이 “신청 → 결제(시뮬) → 확정” 흐름을 제공한다.

2) Value
- 사용자: 시간표 확인/신청/확정까지 한 번에 진행.
- 사장/운영자: 문의/입금 확인/인원 관리의 수동 작업을 UI로 대체(시뮬)하여 효율 확인.

3) JTBD
- “이번 주에 부산에서 농구할 시간과 장소를 빠르게 찾고, 확정까지 끝내고 싶다.”
- “체육관 대관 문의를 줄이고, 시간표/가격 정책을 한 화면에서 안내하고 싶다.”
- “픽업게임 게스트 모집에서 인원/입금 확인을 수동으로 하지 않고 싶다.”

4) Primary Personas (2~3)
- 일반 참가자(게스트): 부산에서 픽업/대관을 찾고 신청/결제를 마치고 싶음.
- 체육관 사장: 시간표/정기대관/가격(인원 할인) 정책을 관리하고 예약을 받음.
- 픽업게임 운영자: 게임을 만들고 모집 인원/참가비를 관리함.

5) Non-Goals
- 서울/경기 확장
- 커뮤니티 게시판 대체(게시판/피드 중심)
- 실시간 채팅
- 랭킹/리그/영상분석
- 실제 PG 연동/정산 로직

6) MVP Metrics (UI 테스트용 가정)
- 예약/신청 완료 전환율(리스트→상세→결제→완료) 확인
- 사용자 설문: “문자/계좌이체보다 편하다” 반응 수집
- 사장/운영자 설문: “시간표/모집 관리가 쉬워졌다” 반응 수집

────────────────────────────────────────────────────────
[라우터 목록] (IA 고정)
────────────────────────────────────────────────────────
Public
1) "/"                               홈(탐색 시작)
2) "/busan"                          부산 탐색 허브(대관/픽업 탭)
3) "/gyms"                           체육관 목록
4) "/gyms/:gymId"                    체육관 상세(시간표/대관 예약 진입)
5) "/pickup"                         픽업게임 목록
6) "/pickup/:gameId"                 픽업게임 상세(신청/결제 진입)
7) "/checkout"                       결제 시뮬레이션(공통)  ※ query: type=rent|pickup&refId=...
8) "/success"                        완료 화면(공통)          ※ query: type=rent|pickup&refId=...

Owner/Organizer (Auth 아님, “역할 토글”로 진입)
9) "/owner"                          사장 콘솔(체육관/시간표/가격 정책)
10) "/organizer"                     운영자 콘솔(픽업게임 생성/관리)

Ops (운영자)
11) "/ops"                           목업 모드/시나리오 전환 + 이벤트 로그

라우터 변경 금지.

────────────────────────────────────────────────────────
[공통 UI 규칙]
────────────────────────────────────────────────────────
1) 레이아웃
- 모바일 우선(상단 Header, 하단 Bottom Nav)
- 데스크탑에서는 중앙 720~960px 카드형 컨테이너 + 양옆 여백

2) Header
- 좌측: Back(가능 시)
- 중앙: 페이지 타이틀
- 우측: 역할 토글(게스트/사장/운영자) + 알림 아이콘(미정 기능, UI만)

3) Bottom Nav (Public에서만 기본 노출)
- [홈] [체육관] [픽업] [내 신청] (내 신청은 MVP에선 “로컬 목록”만)
- Owner/Organizer/OPS 화면에서는 Bottom Nav 대신 콘솔 사이드 메뉴(모바일은 탭)

4) 카드 디자인
- 리스트: 카드(썸네일/제목/메타/상태 뱃지)
- 상태 뱃지: 예약가능/정기대관/마감, 모집중/마감/완료
- 인원 표기: "현재 x/y"

5) 버튼 스타일
- Primary: “신청/결제/확정”
- Secondary: “취소/뒤로”
- Destructive: “모집 마감”, “슬롯 잠금”(콘솔에서만)

6) 입력창 규칙
- 인원 입력: stepper(+/-) + 직접 입력
- 필수값 누락 시: 인라인 에러 + 버튼 비활성화

7) Loading / Empty / Error UI
- Loading: 스켈레톤 + “로컬 데이터 로딩 중…” 텍스트
- Empty: “항목이 없습니다” + CTA(필터 해제/새로고침 시뮬)
- Error: “더미 데이터 오류” + 재시도 버튼(상태를 loading→success로 되돌리는 시뮬)

8) 결제 시뮬레이션 공통
- 결제수단: “카드/간편결제/계좌이체(시뮬)” 라디오
- 결제 버튼 클릭 시: loading 1~2초 시뮬 → success로 라우팅
- 실패 시나리오(ops 모드에서): error로 전환

9) 로컬 상태 저장
- 예약/신청 결과는 localStorage에 저장(“내 신청”에서 확인)
- 네트워크 호출 금지

────────────────────────────────────────────────────────
[라우터별 JSON 더미]
────────────────────────────────────────────────────────
파일 위치:
- /data/routes/home.json
- /data/routes/busan.json
- /data/routes/gyms.json
- /data/routes/gymDetail.json
- /data/routes/pickup.json
- /data/routes/pickupDetail.json
- /data/routes/checkout.json
- /data/routes/success.json
- /data/routes/owner.json
- /data/routes/organizer.json
- /data/routes/ops.json

규격:
{
  "__mock": { "mode": "success" | "empty" | "error" },
  "page": { ... },
  "view": { ... },
  "actions": { ... }
}

※ 라우터 간 구조 일치 불필요. 중복 허용.

────────────────────────────────────────────────────────
[JSON: /data/routes/home.json]
{
  "__mock": { "mode": "success" },
  "page": {
    "title": "홈",
    "subtitle": "부산 농구 일정 찾기"
  },
  "view": {
    "hero": {
      "headline": "오늘 농구, 여기서 확정까지",
      "desc": "문자/계좌이체 대신 신청→결제(시뮬)→확정"
    },
    "quickActions": [
      { "id": "QA_BUSAN", "label": "부산에서 찾기", "to": "/busan" },
      { "id": "QA_GYMS", "label": "체육관 보기", "to": "/gyms" },
      { "id": "QA_PICKUP", "label": "픽업게임 보기", "to": "/pickup" }
    ],
    "highlights": [
      { "id": "H1", "title": "시간표 기반 예약", "desc": "예약가능/정기대관/마감 표시" },
      { "id": "H2", "title": "인원 할인", "desc": "소수 인원 연습 할인 정책 반영" },
      { "id": "H3", "title": "연락처 비공개", "desc": "신청/결제/확정을 앱에서" }
    ]
  },
  "actions": {
    "events": [
      { "name": "CLICK_QUICK_ACTION", "log": true },
      { "name": "TOGGLE_ROLE", "log": true }
    ]
  }
}

────────────────────────────────────────────────────────
[JSON: /data/routes/busan.json]
{
  "__mock": { "mode": "success" },
  "page": { "title": "부산" },
  "view": {
    "tabs": [
      { "id": "TAB_RENT", "label": "대관" },
      { "id": "TAB_PICKUP", "label": "픽업" }
    ],
    "rentPreview": {
      "count": 12,
      "items": [
        { "gymId": "g1", "name": "에이치 스포츠 센터 반여점", "badge": "예약가능", "nextSlot": "오늘 12:00" },
        { "gymId": "g2", "name": "○○ 체육관", "badge": "일부마감", "nextSlot": "내일 18:00" }
      ],
      "to": "/gyms"
    },
    "pickupPreview": {
      "count": 7,
      "items": [
        { "gameId": "p10", "title": "[부산] 수요일 픽업게임", "badge": "모집중", "people": "1/18", "time": "22:00~00:30" },
        { "gameId": "p11", "title": "[부산] 금요일 야간", "badge": "마감", "people": "18/18", "time": "21:00~23:00" }
      ],
      "to": "/pickup"
    }
  },
  "actions": {
    "events": [
      { "name": "SWITCH_TAB", "log": true },
      { "name": "CLICK_CARD", "log": true }
    ]
  }
}

────────────────────────────────────────────────────────
[JSON: /data/routes/gyms.json]
{
  "__mock": { "mode": "success" },
  "page": { "title": "체육관" },
  "view": {
    "filters": {
      "district": { "label": "구/군", "options": ["전체", "해운대구", "수영구", "동래구", "연제구"] },
      "availability": { "label": "상태", "options": ["전체", "예약가능", "일부마감", "정기대관많음"] }
    },
    "list": [
      {
        "gymId": "g1",
        "name": "에이치 스포츠 센터 반여점",
        "address": "부산 (미정 상세주소)",
        "courts": 1,
        "badges": ["예약가능"],
        "thumbnail": "placeholder",
        "priceHint": "시간당 120,000원~",
        "to": "/gyms/g1"
      },
      {
        "gymId": "g2",
        "name": "○○ 체육관",
        "address": "부산 (미정 상세주소)",
        "courts": 1,
        "badges": ["일부마감"],
        "thumbnail": "placeholder",
        "priceHint": "시간당 90,000원~",
        "to": "/gyms/g2"
      }
    ]
  },
  "actions": {
    "events": [
      { "name": "APPLY_FILTER", "log": true },
      { "name": "OPEN_GYM_DETAIL", "log": true }
    ]
  }
}

────────────────────────────────────────────────────────
[JSON: /data/routes/gymDetail.json]
{
  "__mock": { "mode": "success" },
  "page": { "title": "체육관 상세" },
  "view": {
    "gym": {
      "gymId": "g1",
      "name": "에이치 스포츠 센터 반여점",
      "address": "부산 (미정)",
      "courts": 1,
      "rules": [
        "정기대관 슬롯은 예약 불가",
        "예약은 결제(시뮬) 완료 시 확정"
      ]
    },
    "pricingPolicy": {
      "base": "시간당 120,000원",
      "headcountDiscount": [
        { "maxPeople": 4, "label": "소수 연습 할인", "rate": "-20%" },
        { "maxPeople": 6, "label": "중간 인원", "rate": "-10%" },
        { "maxPeople": 10, "label": "기본", "rate": "0%" }
      ],
      "assumption": "실제 할인 기준/금액은 사장 설정(콘솔)로 조정 가능"
    },
    "schedule": {
      "weekOf": "2026-02-23",
      "legend": [
        { "status": "AVAILABLE", "label": "예약가능" },
        { "status": "REGULAR", "label": "정기대관" },
        { "status": "CLOSED", "label": "마감" }
      ],
      "slots": [
        { "slotId": "s1", "day": "월", "time": "12:00-15:00", "status": "AVAILABLE", "price": 120000 },
        { "slotId": "s2", "day": "월", "time": "18:00-21:00", "status": "REGULAR", "price": null },
        { "slotId": "s3", "day": "화", "time": "12:00-15:00", "status": "AVAILABLE", "price": 120000 },
        { "slotId": "s4", "day": "수", "time": "21:00-24:00", "status": "CLOSED", "price": null }
      ]
    },
    "cta": {
      "primary": { "label": "대관 예약하기", "enabledWhen": "slotSelected" }
    }
  },
  "actions": {
    "events": [
      { "name": "SELECT_SLOT", "log": true },
      { "name": "CHANGE_HEADCOUNT", "log": true },
      { "name": "GO_CHECKOUT_RENT", "log": true }
    ]
  }
}

────────────────────────────────────────────────────────
[JSON: /data/routes/pickup.json]
{
  "__mock": { "mode": "success" },
  "page": { "title": "픽업게임" },
  "view": {
    "filters": {
      "status": { "label": "모집 상태", "options": ["전체", "모집중", "마감", "완료"] },
      "day": { "label": "요일", "options": ["전체", "월", "화", "수", "목", "금", "토", "일"] }
    },
    "list": [
      {
        "gameId": "p10",
        "title": "[부산] 수요일 픽업게임",
        "gymName": "에이치 스포츠 센터 반여점",
        "time": "22:00~00:30",
        "badge": "모집중",
        "people": { "current": 1, "max": 18 },
        "pricePerPerson": 8000,
        "to": "/pickup/p10"
      },
      {
        "gameId": "p11",
        "title": "[부산] 금요일 야간",
        "gymName": "○○ 체육관",
        "time": "21:00~23:00",
        "badge": "마감",
        "people": { "current": 18, "max": 18 },
        "pricePerPerson": 7000,
        "to": "/pickup/p11"
      }
    ]
  },
  "actions": {
    "events": [
      { "name": "APPLY_FILTER", "log": true },
      { "name": "OPEN_PICKUP_DETAIL", "log": true }
    ]
  }
}

────────────────────────────────────────────────────────
[JSON: /data/routes/pickupDetail.json]
{
  "__mock": { "mode": "success" },
  "page": { "title": "픽업게임 상세" },
  "view": {
    "game": {
      "gameId": "p10",
      "title": "[부산] 수요일 픽업게임",
      "gym": { "gymId": "g1", "name": "에이치 스포츠 센터 반여점", "address": "부산 (미정)" },
      "time": { "start": "22:00", "end": "00:30" },
      "status": "모집중",
      "people": { "current": 1, "max": 18 },
      "pricePerPerson": 8000,
      "notes": [
        "연락처 공유 없이 신청/결제(시뮬)로 확정",
        "마감 시 신청 불가"
      ]
    },
    "cta": {
      "primary": { "label": "게스트 신청하기", "enabledWhen": "status=모집중 AND seatsLeft>0" }
    }
  },
  "actions": {
    "events": [
      { "name": "GO_CHECKOUT_PICKUP", "log": true },
      { "name": "ADD_TO_MY_APPLICATIONS", "log": true }
    ]
  }
}

────────────────────────────────────────────────────────
[JSON: /data/routes/checkout.json]
{
  "__mock": { "mode": "success" },
  "page": { "title": "결제" },
  "view": {
    "summary": {
      "type": "rent_or_pickup",
      "title": "항목명 (query 기반으로 로컬 상태에서 주입)",
      "meta": ["일시/시간", "장소", "인원/가격"]
    },
    "payer": {
      "name": { "label": "이름", "required": true },
      "phone": { "label": "연락처(본인)", "required": true, "desc": "체육관/운영자에게 노출되지 않음(목업 정책)" }
    },
    "paymentMethods": [
      { "id": "CARD", "label": "카드(시뮬)" },
      { "id": "EASY", "label": "간편결제(시뮬)" },
      { "id": "BANK", "label": "계좌이체(시뮬)" }
    ],
    "cta": {
      "primary": { "label": "결제하기", "enabledWhen": "formValid" },
      "secondary": { "label": "취소", "to": "back" }
    }
  },
  "actions": {
    "events": [
      { "name": "SUBMIT_PAYMENT", "log": true },
      { "name": "PAYMENT_SUCCESS_NAVIGATE", "log": true },
      { "name": "PAYMENT_FAIL", "log": true }
    ]
  }
}

────────────────────────────────────────────────────────
[JSON: /data/routes/success.json]
{
  "__mock": { "mode": "success" },
  "page": { "title": "완료" },
  "view": {
    "result": {
      "headline": "확정되었습니다",
      "desc": "내 신청에서 확인할 수 있습니다",
      "details": [
        { "k": "유형", "v": "대관/픽업" },
        { "k": "일시", "v": "로컬 상태에서 주입" },
        { "k": "장소", "v": "로컬 상태에서 주입" },
        { "k": "금액", "v": "로컬 상태에서 주입" }
      ]
    },
    "cta": {
      "primary": { "label": "내 신청 보기", "to": "/?open=myApplications" },
      "secondary": { "label": "다른 일정 찾기", "to": "/busan" }
    }
  },
  "actions": {
    "events": [
      { "name": "VIEW_MY_APPLICATIONS", "log": true }
    ]
  }
}

────────────────────────────────────────────────────────
[JSON: /data/routes/owner.json]
{
  "__mock": { "mode": "success" },
  "page": { "title": "사장 콘솔" },
  "view": {
    "gymProfile": {
      "gymId": "g1",
      "name": "에이치 스포츠 센터 반여점",
      "address": "부산 (미정)",
      "courts": 1
    },
    "sections": [
      { "id": "SEC_SCHEDULE", "label": "시간표 관리" },
      { "id": "SEC_PRICING", "label": "가격/할인 정책" },
      { "id": "SEC_RESERVATIONS", "label": "예약 현황(목업)" }
    ],
    "scheduleEditor": {
      "weekOf": "2026-02-23",
      "slots": [
        { "slotId": "s1", "day": "월", "time": "12:00-15:00", "status": "AVAILABLE" },
        { "slotId": "s2", "day": "월", "time": "18:00-21:00", "status": "REGULAR" }
      ],
      "statusOptions": ["AVAILABLE", "REGULAR", "CLOSED"]
    },
    "pricingEditor": {
      "basePrice": 120000,
      "rules": [
        { "ruleId": "r1", "maxPeople": 4, "discountRate": 20 },
        { "ruleId": "r2", "maxPeople": 6, "discountRate": 10 }
      ]
    },
    "reservationsMock": [
      { "id": "rm1", "slotId": "s1", "status": "PAID_CONFIRMED", "headcount": 6, "price": 108000 }
    ]
  },
  "actions": {
    "events": [
      { "name": "OWNER_UPDATE_SLOT_STATUS", "log": true },
      { "name": "OWNER_UPDATE_PRICING_RULE", "log": true },
      { "name": "OWNER_SAVE_LOCAL", "log": true }
    ]
  }
}

────────────────────────────────────────────────────────
[JSON: /data/routes/organizer.json]
{
  "__mock": { "mode": "success" },
  "page": { "title": "운영자 콘솔" },
  "view": {
    "sections": [
      { "id": "SEC_CREATE", "label": "픽업게임 생성" },
      { "id": "SEC_MANAGE", "label": "내 게임 관리(목업)" }
    ],
    "createForm": {
      "fields": {
        "title": { "label": "게임 제목", "required": true },
        "gymSelect": { "label": "체육관 선택", "required": true, "options": [{ "gymId": "g1", "name": "에이치 스포츠 센터 반여점" }] },
        "date": { "label": "날짜", "required": true },
        "startTime": { "label": "시작", "required": true },
        "endTime": { "label": "종료", "required": true },
        "maxPeople": { "label": "최대 인원", "required": true, "default": 18 },
        "pricePerPerson": { "label": "1인 참가비", "required": true, "default": 8000 }
      },
      "cta": { "primary": { "label": "게임 생성(로컬)", "enabledWhen": "formValid" } }
    },
    "myGamesMock": [
      { "gameId": "p10", "title": "[부산] 수요일 픽업게임", "people": "1/18", "status": "모집중" }
    ]
  },
  "actions": {
    "events": [
      { "name": "ORGANIZER_CREATE_GAME_LOCAL", "log": true },
      { "name": "ORGANIZER_CLOSE_RECRUITMENT", "log": true }
    ]
  }
}

────────────────────────────────────────────────────────
[JSON: /data/routes/ops.json]
{
  "__mock": { "mode": "success" },
  "page": { "title": "OPS" },
  "view": {
    "mockModes": ["success", "empty", "error"],
    "routeTargets": ["home", "busan", "gyms", "gymDetail", "pickup", "pickupDetail", "checkout", "success", "owner", "organizer"],
    "eventLog": {
      "enabled": true,
      "items": [
        { "ts": "local", "event": "OPEN_APP", "meta": {} }
      ]
    }
  },
  "actions": {
    "events": [
      { "name": "OPS_SET_ROUTE_MODE", "log": true },
      { "name": "OPS_CLEAR_LOG", "log": true }
    ]
  }
}

────────────────────────────────────────────────────────
[라우터별 상세 명세 + ASCII Layout]
────────────────────────────────────────────────────────

[Route: "/"]
- 목적: 첫 진입에서 서비스 가치와 부산 탐색 진입 제공
- 진입 조건: 없음
- 레이아웃(위→아래):
  1) Header(타이틀/역할 토글)
  2) Hero(헤드라인/설명)
  3) Quick Actions(3개 버튼)
  4) Highlights(3개 카드)
  5) Footer(간단 문구)
- 표시 데이터(JSON 경로):
  - hero: view.hero
  - quickActions: view.quickActions
  - highlights: view.highlights
- 버튼 목록/이벤트/상태 변화:
  - 부산에서 찾기: CLICK_QUICK_ACTION → /busan
  - 체육관 보기: CLICK_QUICK_ACTION → /gyms
  - 픽업게임 보기: CLICK_QUICK_ACTION → /pickup
  - 역할 토글: TOGGLE_ROLE → UI 뱃지/콘솔 메뉴 노출 변화(로컬 상태)
- 상태 머신:
  - initial → loading → (success|empty|error)
- ASCII Layout:
+--------------------------------------------------+
| <Header>   홈                         [Role v]   |
+--------------------------------------------------+
| [Hero Headline]                                  |
| [Hero Desc]                                      |
+--------------------------------------------------+
| [부산에서 찾기] [체육관 보기] [픽업게임 보기]     |
+--------------------------------------------------+
| (Card) 시간표 기반 예약                          |
| (Card) 인원 할인                                 |
| (Card) 연락처 비공개                             |
+--------------------------------------------------+
| Footer                                            |
+--------------------------------------------------+

[Route: "/busan"]
- 목적: 부산에서 대관/픽업을 탭으로 빠르게 탐색
- 진입 조건: 없음
- 레이아웃:
  1) Header
  2) 탭(대관/픽업)
  3) 선택 탭 프리뷰 리스트(최대 3개) + “전체 보기”
- 표시 데이터:
  - tabs: view.tabs
  - rentPreview: view.rentPreview
  - pickupPreview: view.pickupPreview
- 버튼/이벤트:
  - SWITCH_TAB: 탭 전환(리스트 전환)
  - 카드 클릭: CLICK_CARD → /gyms/:id 또는 /pickup/:id
  - 전체 보기: /gyms 또는 /pickup
- 상태 머신: initial/loading/success/empty/error
- ASCII Layout:
+--------------------------------------------------+
| <Header>   부산                        [Role v]  |
+--------------------------------------------------+
| [대관 탭] [픽업 탭]                              |
+--------------------------------------------------+
| (대관) Card: 체육관명 / 상태 / 다음 가능 슬롯      |
| (대관) Card: ...                                 |
| [체육관 전체 보기 >]                              |
+--------------------------------------------------+
| (픽업) Card: 제목 / 모집상태 / 1/18 / 시간         |
| (픽업) Card: ...                                  |
| [픽업 전체 보기 >]                                |
+--------------------------------------------------+

[Route: "/gyms"]
- 목적: 체육관 목록 탐색 및 상세 진입
- 진입 조건: 없음
- 레이아웃:
  1) Header
  2) 필터(구/군, 상태)
  3) 리스트 카드
- 표시 데이터:
  - filters: view.filters
  - list: view.list
- 버튼/이벤트:
  - APPLY_FILTER: 필터 변경 → 리스트 필터링(로컬)
  - OPEN_GYM_DETAIL: 카드 클릭 → /gyms/:gymId
- 상태 머신: initial/loading/success/empty/error
- ASCII Layout:
+--------------------------------------------------+
| <Header>   체육관                      [Role v]   |
+--------------------------------------------------+
| [구/군 v]   [상태 v]                              |
+--------------------------------------------------+
| (Card) 체육관명  [예약가능]                        |
|       주소 / 코트수 / 가격 힌트                   |
+--------------------------------------------------+
| (Card) ...                                        |
+--------------------------------------------------+

[Route: "/gyms/:gymId"]
- 목적: 체육관 시간표 확인 후 대관 예약 진입
- 진입 조건: gymId 존재
- 레이아웃:
  1) Header(Back)
  2) 체육관 정보 카드(이름/주소/코트수)
  3) 가격 정책(인원 할인 안내)
  4) 주간 시간표 그리드(슬롯 상태)
  5) 인원 입력(스테퍼)
  6) 예상 금액 표시
  7) CTA(대관 예약하기)
- 표시 데이터:
  - gym: view.gym
  - pricingPolicy: view.pricingPolicy
  - schedule: view.schedule
- 버튼/이벤트/상태 변화:
  - SELECT_SLOT: AVAILABLE 슬롯 선택 → 선택 강조 + CTA 활성화
  - CHANGE_HEADCOUNT: 인원 변경 → 할인 적용된 예상 금액 재계산(로컬)
  - GO_CHECKOUT_RENT: CTA → /checkout?type=rent&refId={slotId}
- 상태 머신: initial/loading/success/empty/error
- ASCII Layout:
+--------------------------------------------------+
| <Back  체육관 상세                [Role v]        |
+--------------------------------------------------+
| [체육관명]                                        |
| 주소 / 코트:1                                     |
+--------------------------------------------------+
| 가격/할인 정책                                    |
| - 4명 이하 -20%                                   |
| - 6명 이하 -10%                                   |
+--------------------------------------------------+
| 주간 시간표(그리드)                               |
| 월 12-15 [예약가능]  월 18-21 [정기대관]          |
| 화 12-15 [예약가능]  수 21-24 [마감]              |
+--------------------------------------------------+
| 인원:  [ - ]  6  [ + ]                            |
| 예상금액: 108,000원                               |
+--------------------------------------------------+
| [대관 예약하기] (enabled when slotSelected)        |
+--------------------------------------------------+

[Route: "/pickup"]
- 목적: 픽업게임 목록 탐색 및 상세 진입
- 진입 조건: 없음
- 레이아웃:
  1) Header
  2) 필터(모집상태, 요일)
  3) 리스트 카드(인원/가격/상태)
- 표시 데이터:
  - filters: view.filters
  - list: view.list
- 버튼/이벤트:
  - APPLY_FILTER: 필터링
  - OPEN_PICKUP_DETAIL: 카드 클릭 → /pickup/:gameId
- 상태 머신: initial/loading/success/empty/error
- ASCII Layout:
+--------------------------------------------------+
| <Header>   픽업게임                    [Role v]    |
+--------------------------------------------------+
| [상태 v]   [요일 v]                                |
+--------------------------------------------------+
| (Card) 제목 [모집중]                               |
|       체육관 / 시간 / 1/18  / 8,000원             |
+--------------------------------------------------+
| (Card) ...                                        |
+--------------------------------------------------+

[Route: "/pickup/:gameId"]
- 목적: 픽업게임 상세 확인 후 게스트 신청(결제) 진입
- 진입 조건: gameId 존재
- 레이아웃:
  1) Header(Back)
  2) 게임 정보 카드(제목/장소/시간/상태)
  3) 인원 현황(현재/최대, 남은 자리)
  4) 안내(연락처 비공개, 마감 규칙)
  5) CTA(게스트 신청하기)
- 표시 데이터:
  - game: view.game
- 버튼/이벤트/상태 변화:
  - GO_CHECKOUT_PICKUP: CTA → /checkout?type=pickup&refId={gameId}
  - seatsLeft=0 또는 status=마감/완료면 CTA 비활성
- 상태 머신: initial/loading/success/empty/error
- ASCII Layout:
+--------------------------------------------------+
| <Back  픽업게임 상세              [Role v]         |
+--------------------------------------------------+
| [제목] [모집중]                                    |
| 체육관명 / 주소                                   |
| 22:00 ~ 00:30                                     |
+--------------------------------------------------+
| 인원: 1 / 18   (남은 자리 17)                     |
| 1인 참가비: 8,000원                               |
+--------------------------------------------------+
| 안내                                               |
| - 신청/결제(시뮬)로 확정                            |
| - 마감 시 신청 불가                                 |
+--------------------------------------------------+
| [게스트 신청하기]                                  |
+--------------------------------------------------+

[Route: "/checkout"]
- 목적: 대관/픽업 공통 결제 시뮬레이션
- 진입 조건: query type, refId 존재
- 레이아웃:
  1) Header(Back)
  2) 결제 요약 카드(항목/일시/장소/금액)
  3) 결제자 정보 입력(이름/연락처)
  4) 결제수단 선택
  5) CTA(결제하기/취소)
- 표시 데이터:
  - summary: view.summary (실제 표시는 query+로컬상태로 주입)
  - payer: view.payer
  - paymentMethods: view.paymentMethods
- 버튼/이벤트/상태 변화:
  - SUBMIT_PAYMENT: 클릭 → loading(1~2초) → 성공이면 /success?type=...&refId=...
  - OPS에서 fail 모드면 error로 전환(재시도 가능)
- 상태 머신: initial/loading/success/empty/error
- ASCII Layout:
+--------------------------------------------------+
| <Back  결제                        [Role v]        |
+--------------------------------------------------+
| [요약 카드]                                        |
| - 유형: 대관/픽업                                  |
| - 일시/장소/인원                                   |
| - 금액                                              |
+--------------------------------------------------+
| 결제자 정보                                         |
| 이름 [________]                                     |
| 연락처 [________]                                   |
+--------------------------------------------------+
| 결제수단                                            |
| ( ) 카드(시뮬)  ( ) 간편(시뮬)  ( ) 계좌(시뮬)       |
+--------------------------------------------------+
| [결제하기]   [취소]                                 |
+--------------------------------------------------+

[Route: "/success"]
- 목적: 결제 완료 후 확정 안내 + 다음 행동 유도
- 진입 조건: query type, refId 존재
- 레이아웃:
  1) Header
  2) 완료 메시지/상세
  3) CTA(내 신청/다른 일정)
- 표시 데이터:
  - result: view.result (표시는 로컬 상태 주입)
- 버튼/이벤트:
  - VIEW_MY_APPLICATIONS: 내 신청 오픈(홈에서 오버레이 형태)
- 상태 머신: initial/loading/success/empty/error
- ASCII Layout:
+--------------------------------------------------+
| <Header>   완료                        [Role v]    |
+--------------------------------------------------+
| ✅ 확정되었습니다                                    |
| 내 신청에서 확인할 수 있습니다                       |
+--------------------------------------------------+
| 상세                                                |
| 유형: 대관/픽업                                      |
| 일시: ...                                           |
| 장소: ...                                           |
| 금액: ...                                           |
+--------------------------------------------------+
| [내 신청 보기]   [다른 일정 찾기]                    |
+--------------------------------------------------+

[Route: "/owner"]
- 목적: 사장용 시간표/가격정책 편집 UI 제공(로컬 저장)
- 진입 조건: 역할 토글이 “사장”일 때만 진입 가능(목업 규칙)
- 레이아웃:
  1) Header
  2) 체육관 프로필 요약
  3) 섹션 탭(시간표/가격/예약현황)
  4) 편집 폼(선택 섹션)
  5) 저장 버튼(로컬)
- 표시 데이터:
  - gymProfile: view.gymProfile
  - scheduleEditor / pricingEditor / reservationsMock
- 버튼/이벤트/상태 변화:
  - OWNER_UPDATE_SLOT_STATUS: 슬롯 상태 변경(드롭다운)
  - OWNER_UPDATE_PRICING_RULE: 할인 규칙 수정/추가/삭제(로컬)
  - OWNER_SAVE_LOCAL: 저장 → 토스트 “저장됨” + localStorage 반영
- 상태 머신: initial/loading/success/empty/error
- ASCII Layout:
+--------------------------------------------------+
| <Header>   사장 콘솔                  [Role v]     |
+--------------------------------------------------+
| [체육관명] 주소 / 코트수                             |
+--------------------------------------------------+
| [시간표] [가격/할인] [예약현황]                      |
+--------------------------------------------------+
| (시간표 편집)                                       |
| 슬롯 리스트:                                        |
| - 월 12-15  상태 [AVAILABLE v]                      |
| - 월 18-21  상태 [REGULAR v]                        |
| [저장]                                             |
+--------------------------------------------------+

[Route: "/organizer"]
- 목적: 운영자용 픽업게임 생성/관리 UI 제공(로컬 저장)
- 진입 조건: 역할 토글이 “운영자”일 때만 진입 가능(목업 규칙)
- 레이아웃:
  1) Header
  2) 섹션 탭(생성/내 게임)
  3) 생성 폼 또는 관리 리스트
- 표시 데이터:
  - createForm: view.createForm
  - myGamesMock: view.myGamesMock
- 버튼/이벤트:
  - ORGANIZER_CREATE_GAME_LOCAL: 생성 → /pickup 목록에 즉시 반영(로컬)
  - ORGANIZER_CLOSE_RECRUITMENT: 모집 마감 → 상태 변경(로컬)
- 상태 머신: initial/loading/success/empty/error
- ASCII Layout:
+--------------------------------------------------+
| <Header>   운영자 콘솔                [Role v]     |
+--------------------------------------------------+
| [게임 생성] [내 게임 관리]                          |
+--------------------------------------------------+
| (게임 생성 폼)                                     |
| 제목 [________]                                    |
| 체육관 [v]                                         |
| 날짜 [____]  시작[__] 종료[__]                     |
| 최대인원 [18]  참가비[8000]                        |
| [게임 생성(로컬)]                                  |
+--------------------------------------------------+

[Route: "/ops"]
- 목적: 라우터별 더미 모드(success/empty/error) 전환 및 이벤트 로그 확인
- 진입 조건: 없음(목업용)
- 레이아웃:
  1) Header
  2) 라우터 선택 드롭다운
  3) 모드 선택 라디오
  4) 적용 버튼
  5) 이벤트 로그 리스트 + Clear
- 표시 데이터:
  - mockModes: view.mockModes
  - routeTargets: view.routeTargets
  - eventLog: view.eventLog
- 버튼/이벤트:
  - OPS_SET_ROUTE_MODE: 특정 라우터 JSON의 __mock.mode를 “로컬 오버라이드”로 적용
  - OPS_CLEAR_LOG: 로그 비움
- 상태 머신: initial/loading/success/empty/error
- ASCII Layout:
+--------------------------------------------------+
| <Header>   OPS                                     |
+--------------------------------------------------+
| 대상 라우터 [home v]                               |
| 모드 ( )success ( )empty ( )error                  |
| [적용]                                             |
+--------------------------------------------------+
| 이벤트 로그                                         |
| - ts  event  meta                                  |
| - ...                                              |
| [Clear]                                            |
+--------------------------------------------------+

────────────────────────────────────────────────────────
[사용자 플로우] (최소 3개)
────────────────────────────────────────────────────────
Flow A (대관 예약):
"/"
→ CLICK_QUICK_ACTION
→ "/busan"
→ CLICK_CARD (대관 프리뷰)
→ "/gyms/:gymId"
→ SELECT_SLOT + CHANGE_HEADCOUNT
→ GO_CHECKOUT_RENT
→ "/checkout?type=rent&refId=s1"
→ SUBMIT_PAYMENT
→ "/success?type=rent&refId=s1"

Flow B (픽업 신청):
"/busan"
→ SWITCH_TAB (픽업)
→ CLICK_CARD
→ "/pickup/:gameId"
→ GO_CHECKOUT_PICKUP
→ "/checkout?type=pickup&refId=p10"
→ SUBMIT_PAYMENT
→ "/success?type=pickup&refId=p10"

Flow C (사장 정책 편집 후 사용자 화면 반영):
"/"
→ TOGGLE_ROLE (사장)
→ "/owner"
→ OWNER_UPDATE_PRICING_RULE + OWNER_SAVE_LOCAL
→ TOGGLE_ROLE (게스트)
→ "/gyms/:gymId"
→ CHANGE_HEADCOUNT
→ (할인/예상금액 변경이 반영되는지 확인)

Flow D (운영자 게임 생성 후 목록 반영):
"/"
→ TOGGLE_ROLE (운영자)
→ "/organizer"
→ ORGANIZER_CREATE_GAME_LOCAL
→ "/pickup"
→ (방금 만든 게임 카드가 보이는지 확인)

────────────────────────────────────────────────────────
[QA 체크리스트]
────────────────────────────────────────────────────────
□ 라우터 단위 진입 가능 (직접 URL 접근 포함)
□ JSON 기반 렌더링 (각 라우터는 해당 JSON만 사용)
□ 네트워크 코드 없음(fetch/axios 없음)
□ 버튼 이벤트 정상 (로그 기록 포함)
□ 상태 전이 확인 (success/empty/error를 ops에서 전환)
□ 네비게이션 정상 (Back/Bottom Nav/콘솔 탭)
□ 결제 시뮬레이션 동작 (loading→success, fail 시 error)
□ 로컬 저장 정상 (내 신청/인원 카운트/콘솔 설정 반영)
□ 각 라우터 독립 수정 가능 (JSON만 바꿔도 화면 반영)