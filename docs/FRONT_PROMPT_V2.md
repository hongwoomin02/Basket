# BusoCourt 프론트엔드 V2 개발 계획서 (FRONT_PROMPT_V2)

## 1. 문서 목적

본 문서는 BusoCourt 프론트엔드 V2 개선을 위한 **프롬프트/개발 계획서**이다.  
기존 레이아웃·폰트·색감·스포츠 톤을 유지하면서, 아래 요구사항(R1~R4)을 단계적으로 반영할 때 참고한다.

- **R1** 대관 문의할 수 있는 체육관을 눈에 띄게 노출
- **R2** 홈에 부산 대관 지도 요약(대관 가능/불가 핀)
- **R3** 본인 근처 N km 이내 장소 파악
- **R4** 부산 농구하기 좋은 야외 코트 순위 및 리뷰(목업)

---

## 2. 현재 프로젝트 상태 요약

### 2.1 구조

| 구분 | 경로/내용 |
|------|-----------|
| 진입 | `src/main.tsx` → `src/App.tsx` (React Router + MockProvider) |
| 홈 | `src/pages/Home.tsx` — 로고/역할 배지, 히어로("Dominate The Court"), 2개 CTA(단독 대관 / 픽업), "실시간 추천 코트" 리스트(quickActions 3개) |
| 데이터 | `src/data/routes/home.json`, `gyms.json`, `busan.json` — 주소는 텍스트만("부산 (미정 상세주소)"), 위·경도·거리·리뷰·야외 여부 없음 |
| 디자인 | `src/index.css` — `--brand-primary`, `--brand-energy`, `--brand-trust`, `--font`(Inter), `--max-w: 480px` 등 유지 대상 |

### 2.2 부족한 부분

- **지도**: 지도 컴포넌트/지도 요약 없음
- **위치·거리**: lat/lng, "근처 N km" 로직 없음
- **대관 문의 강조**: 홈에서 "대관 문의하기 좋은 체육관"을 눈에 띄게 노출하는 전용 블록 없음
- **야외·리뷰·순위**: 야외 코트 구분, 리뷰, 순위 데이터/UI 없음

---

## 3. 요구사항 정리 (FRONT_PROMPT_V2 반영 사항)

| ID | 요구사항 | 현재 | 목표 |
|----|----------|------|------|
| R1 | 대관 문의할 수 있는 체육관을 눈에 띄게 노출 | 홈에 "실시간 추천 코트"만 있음 | 홈 상단/눈에 띄는 위치에 "대관 문의 추천" 체육관 2~3곳 전용 섹션 |
| R2 | 게스트가 대관 장소를 모르는 문제 → 홈에 지도 요약 | 지도 없음 | 홈에 부산 전체 요약 지도, 대관 가능/불가 핀으로 한눈에 표시 |
| R3 | 본인 근처 N km 이내 장소 파악 | 없음 | "내 주변 O km" 필터/섹션 또는 거리 표시(목업: 고정 좌표·거리값) |
| R4 | 부산 농구하기 좋은 야외 코트 순위 + 실제 리뷰 느낌 | 없음 | 야외 코트 순위 블록 + 리뷰 목업(텍스트/평점) UI |

**제약**: 레이아웃 전면 변경 없이, 기존 **폰트·색감·스포츠 느낌 유지**.

---

## 4. 디자인 가이드라인 (유지)

개선 시 아래를 유지한다.

- **레이아웃**: 기존 홈/버튼/카드 구조 유지, `max-width: 480px`, 하단 네비 등
- **폰트**: Inter, 기존 굵기/자간 유지
- **색**: `--brand-primary`, `--brand-energy`, `--brand-trust`, gray 스케일
- **스포츠 느낌**: 대문자 타이틀, 강한 타입, CTA 명확성 유지

---

## 5. 데이터 확장 (목업)

체육관/장소 데이터에 아래 필드를 추가한다. (1단계는 목업 값으로 채움)

| 필드 | 타입 | 설명 |
|------|------|------|
| `lat` | number | 위도 (부산 범위) |
| `lng` | number | 경도 (부산 범위) |
| `available` | boolean | 대관 가능 여부 |
| `distanceKm` | number | 목업 거리(km), "내 주변" 표시용 |
| `isOutdoor` | boolean | 야외 코트 여부 |
| `rank` | number | 야외 코트 순위(1~5 등), 선택 |
| `reviews` | array | `{ text: string, rating: number }[]` 목업 |

### 5.1 홈/지도/근처/순위용 JSON 스키마 예시

**home.json 확장 예시**

```json
{
  "view": {
    "inquiryGyms": [
      {
        "gymId": "g1",
        "name": "에이치 스포츠 센터 반여점",
        "address": "부산 해운대구 반여동",
        "available": true,
        "distanceKm": 2.3,
        "to": "/gyms/g1"
      }
    ],
    "mapSummary": {
      "pins": [
        { "gymId": "g1", "lat": 35.17, "lng": 129.10, "available": true },
        { "gymId": "g2", "lat": 35.16, "lng": 129.12, "available": false }
      ]
    },
    "outdoorRanking": [
      {
        "placeId": "out1",
        "name": "○○ 공원 농구장",
        "rank": 1,
        "rating": 4.8,
        "reviews": [{ "text": "바닥 좋고 조명 밝음", "rating": 5 }]
      }
    ]
  }
}
```

**gyms.json list 항목 확장 예시**

```json
{
  "gymId": "g1",
  "name": "에이치 스포츠 센터 반여점",
  "address": "부산 해운대구 반여동",
  "lat": 35.17,
  "lng": 129.10,
  "available": true,
  "distanceKm": 2.3,
  "isOutdoor": false,
  "courts": 1,
  "badges": ["예약가능"],
  "priceHint": "시간당 120,000원~",
  "to": "/gyms/g1"
}
```

(선택) `src/data/routes/outdoorCourts.json` 또는 `reviews.json` 목업 파일을 새로 두어 R4 전용 데이터를 분리할 수 있다.

---

## 6. 기능별 개발 계획

### R1 – 대관 문의 추천

- 홈에 **"지금 문의하기 좋은 체육관"** 블록 추가.
- 카드 2~3개, 문의 CTA(클릭 시 상세 또는 문의 목업).
- 데이터: `home.json` 의 `view.inquiryGyms` 사용.

### R2 – 홈 지도 요약

- 홈에 **"부산 대관 지도"** 섹션 추가.
- 정적 지도 이미지 또는 간단 SVG/div 기반 맵 + 핀(가능/불가 색 구분).
- 핀 클릭 시 해당 구/리스트로 이동.
- 데이터: `view.mapSummary.pins`.

### R3 – 근처 N km

- 체육관 목록/홈에 **"내 주변 O km"** 필터 또는 거리 뱃지 표시.
- 1단계: 목업 좌표·고정 `distanceKm` 값으로 구현.
- 실제 "내 위치"는 이후 백엔드/권한 연동 시 반영.

### R4 – 야외 코트 순위·리뷰

- 부산 전용 **"야외 코트 순위"** 블록 추가(1~5위 등).
- 카드에 평점·리뷰 한 줄 목업.
- 실제 백엔드 연동은 이후 단계에서 진행.

---

## 7. 구현 우선순위

| Phase | 내용 |
|-------|------|
| Phase 1 | 데이터 스키마 확장 + R1(대관 문의 블록) |
| Phase 2 | R2(지도 요약) |
| Phase 3 | R3(거리 표시/필터) |
| Phase 4 | R4(야외 순위·리뷰) |

---

## 8. 파일 변경 목록

| 구분 | 파일 |
|------|------|
| 데이터 | `src/data/routes/home.json`, `gyms.json`, `busan.json` 확장 |
| 페이지 | `src/pages/Home.tsx` 수정(새 섹션들) |
| 컴포넌트 | 필요 시 `src/components/` 에 지도요약, 거리뱃지, 리뷰카드 등 재사용 컴포넌트 추가 |
| 선택 | `src/data/routes/outdoorCourts.json` 또는 `reviews.json` 목업 추가 |

---

## 9. 참고

- **지도**: 외부 지도 API 연동은 선택. 1단계는 정적/간이 맵으로 충분.
- **위치**: 실제 "내 위치"는 이후 백엔드/권한 연동; 1단계는 목업 좌표·고정 거리로 UI만 구현.
