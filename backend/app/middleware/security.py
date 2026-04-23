"""보안 헤더 및 기타 보안 미들웨어.

OWASP 권고안과 MDN Mozilla Observatory 기준 중 프론트 SPA + API 조합에서
안전한 기본값만 설정. 프로덕션에서는 환경변수로 HSTS 를 활성화한다.
"""
from __future__ import annotations

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """OWASP Secure Headers Project 권장 기본값.

    - X-Content-Type-Options: nosniff        (MIME 스니핑 방지)
    - X-Frame-Options: DENY                  (clickjacking 방지)
    - Referrer-Policy: strict-origin-when-cross-origin
    - Permissions-Policy: camera=(), mic=()  (불필요 권한 차단)
    - Strict-Transport-Security:             (HTTPS 프로덕션 한정)
    """

    def __init__(self, app, production: bool = False) -> None:
        super().__init__(app)
        self.production = production

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault(
            "Permissions-Policy",
            "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
        )
        if self.production:
            # HTTPS 하에서만 의미 있음. dev 환경에서는 오히려 혼란을 유발하므로 비활성.
            response.headers.setdefault(
                "Strict-Transport-Security",
                "max-age=31536000; includeSubDomains",
            )
        return response
