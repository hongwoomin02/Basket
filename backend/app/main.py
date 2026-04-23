import logging
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import settings
from app.middleware.security import SecurityHeadersMiddleware
from app.rate_limit import limiter
from app.routers import admin, auth, gyms, outdoors, owner, places, reservations

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Phase 5 보안: 프로덕션 기동 시 민감 설정 검증 ──────────────
    if settings.environment == "production":
        if settings.jwt_secret_key in ("change-me", "", "secret"):
            raise RuntimeError(
                "JWT_SECRET_KEY is not set for production. "
                "Refusing to start. Generate a strong random secret and set it via env."
            )
        if "*" in settings.cors_origins or any("localhost" in o for o in settings.cors_origins):
            logger.warning(
                "CORS origins include localhost/wildcard in production: %s",
                settings.cors_origins,
            )
    yield
    # 종료 시 정리 작업


app = FastAPI(
    title="Basket API",
    description="부산 농구 공간 플랫폼 API",
    version="0.1.0",
    lifespan=lifespan,
)

# ─── Rate Limiter ─────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# ─── 보안 헤더 ────────────────────────────────────────────────────────────
app.add_middleware(
    SecurityHeadersMiddleware,
    production=(settings.environment == "production"),
)

# ─── CORS ──────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── 공통 에러 핸들러 ────────────────────────────────────────────────────
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={"error": {"code": "NOT_FOUND", "message": "리소스를 찾을 수 없습니다."}},
    )


@app.exception_handler(422)
async def validation_error_handler(request: Request, exc):
    return JSONResponse(
        status_code=422,
        content={"error": {"code": "VALIDATION_ERROR", "message": str(exc)}},
    )


# Request ID 미들웨어
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# ─── 라우터 등록 ──────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(places.router)
app.include_router(gyms.router)
app.include_router(outdoors.router)
app.include_router(reservations.router)
app.include_router(owner.router)
app.include_router(admin.router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "0.1.0"}
