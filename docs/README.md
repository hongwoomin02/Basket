# basket-backend

부산 농구 공간 플랫폼 백엔드 API

## 기술 스택

- **FastAPI** + **SQLAlchemy 2.0 (async)** + **PostgreSQL 16**
- **Alembic** 마이그레이션 | **JWT** 인증 | **Docker Compose**

## 로컬 개발 시작

### 1. 사전 준비
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 설치
- Python 3.12 이상

### 2. 환경변수 설정
```bash
cp .env.example .env
# .env 파일에서 JWT_SECRET_KEY 등 수정
```

### 3. Docker Compose로 DB + API 실행
```bash
docker compose up --build
```

API: http://localhost:8000  
Swagger 문서: http://localhost:8000/docs

### 4. 마이그레이션 (처음 실행 시)
```bash
# Docker 안에서 실행
docker compose exec api alembic upgrade head

# 로컬에서 직접 실행 (venv 활성화 후)
pip install -e ".[dev]"
alembic upgrade head
```

### 5. 새 마이그레이션 생성
```bash
alembic revision --autogenerate -m "add_새기능"
alembic upgrade head
```

## 프로젝트 구조

```
app/
├── main.py           # FastAPI 앱 진입점
├── config.py         # 환경변수
├── database.py       # DB 엔진/세션
├── models/           # ORM 모델 (18개 테이블)
├── schemas/          # Pydantic 요청/응답 스키마
├── routers/          # API 라우터 (도메인별)
│   ├── auth.py       # POST /auth/signup, /login, /refresh, /me
│   ├── places.py     # GET /places, /places/home-map-summary
│   ├── gyms.py       # GET /gyms/:id, /gallery, /calendar, /pricing-policy
│   ├── outdoors.py   # GET/POST /outdoors/:id, /reviews
│   ├── reservations.py # POST /reservations, 상태 전이
│   ├── owner.py      # GET/POST /owners/me/dashboard, reservations
│   └── admin.py      # GET/POST /admin/reviews (hide/restore)
├── services/         # 비즈니스 로직 (슬롯 생성 엔진 등)
├── dependencies/     # FastAPI Depends (auth.py)
└── utils/
    ├── security.py   # JWT 생성/검증, bcrypt
    └── price.py      # 가격 계산 엔진
```

## API 문서

FastAPI 자동 생성: http://localhost:8000/docs (Swagger UI)

## 배포 (Railway)

```bash
# Railway CLI
railway login
railway up
```

환경변수를 Railway 대시보드에서 설정 후 배포.
