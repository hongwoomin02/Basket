# 배포 가이드 (Vercel + Railway 기준)

> 작성일: 2026-04-23  
> 대상: Basket 프로젝트의 첫 프로덕션 배포  
> 기본 조합: **프론트 = Vercel / 백엔드 + DB = Railway**  
> 다른 플랫폼 부록은 §F 참조

---

## A. 사전 준비 체크리스트

배포 전에 다음을 모두 확보:

- [ ] **GitHub repo** — 현재 로컬만이라면 먼저 원격 push 필요
  ```bash
  git remote add origin https://github.com/<your-org>/basket.git
  git push -u origin main
  ```
- [ ] **Vercel 계정** — https://vercel.com (GitHub 로그인)
- [ ] **Railway 계정** — https://railway.app (GitHub 로그인, $5 크레딧 제공)
- [ ] **JWT_SECRET_KEY 생성**
  ```bash
  python -c "import secrets; print(secrets.token_hex(32))"
  # → 64자 hex 출력. 메모해두기.
  ```
- [ ] **이메일 도메인** (선택) — 비밀번호 재설정 등 발신용
- [ ] **커스텀 도메인** (선택) — 없으면 `.vercel.app` / `.railway.app` 사용

---

## B. 백엔드 — Railway 배포

### B-1. Railway 프로젝트 생성

1. https://railway.app/dashboard → **New Project** → **Deploy from GitHub repo**
2. Basket repo 선택 → "Add variables later" 옵션
3. 생성된 서비스 클릭 → **Settings** 탭
   - **Root Directory**: `backend`
   - **Builder**: `Dockerfile`
   - **Dockerfile Path**: `Dockerfile`
   - **Docker Build Target**: `production` (Dockerfile 17행의 `FROM base AS production`)
   - **Watch Paths**: `backend/**` (backend 변경 시만 재빌드)

### B-2. PostgreSQL 추가

1. 프로젝트 화면에서 **+ Create** → **Database** → **Add PostgreSQL**
2. 생성 후 PostgreSQL 서비스 클릭 → **Variables** 탭에서 `DATABASE_URL` 확인
   - 형식: `postgresql://postgres:<pwd>@<host>:<port>/railway`
   - **주의**: Basket 백엔드는 `postgresql+asyncpg://` 형식 필요 → 매핑 환경변수 사용

### B-3. 백엔드 환경변수 등록

백엔드 서비스 → **Variables** 탭:

| Key | Value |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` 후 `postgresql://`를 `postgresql+asyncpg://`로 치환 → 또는 별도 변수로 처리 |
| `JWT_SECRET_KEY` | 위에서 생성한 64자 hex 값 |
| `JWT_ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `30` |
| `ENVIRONMENT` | `production` |
| `CORS_ORIGINS` | `["https://your-app.vercel.app"]` (JSON 배열, Vercel 도메인 확정 후 업데이트) |

**asyncpg 변환 팁**: Railway는 변수 보간을 지원하므로
```
DATABASE_URL=${{Postgres.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")}}
```
은 직접 지원하지 않음 → 두 가지 해결책:
1. **간단**: Railway에 `DATABASE_URL=postgresql+asyncpg://...`를 직접 손으로 적기 (PG 비밀번호 노출 주의)
2. **권장**: `backend/app/config.py`에 변환 로직 추가
   ```python
   @field_validator("database_url")
   @classmethod
   def to_async(cls, v: str) -> str:
       if v.startswith("postgresql://"):
           return v.replace("postgresql://", "postgresql+asyncpg://", 1)
       return v
   ```

### B-4. Alembic 마이그레이션 자동 실행

두 방법 중 택1:

**방법 1 (권장): Railway Pre-Deploy Command**
- 백엔드 서비스 → **Settings** → **Deploy** 섹션 → **Pre-Deploy Command**
  ```
  alembic upgrade head
  ```

**방법 2: Dockerfile entrypoint**
- `backend/entrypoint.sh` 신규
  ```bash
  #!/bin/sh
  alembic upgrade head
  exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
  ```
- Dockerfile production stage 마지막 줄을
  ```dockerfile
  ENTRYPOINT ["sh", "/app/entrypoint.sh"]
  ```
  로 변경

### B-5. ADMIN 계정 생성

프로덕션은 시드 스크립트(`scripts/seed.py`)를 그대로 돌리면 안 됨 (테스트 데이터 삽입). 첫 ADMIN만 수동 생성:

`backend/scripts/create_admin.py` 신규 작성:
```python
import asyncio, sys
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.config import settings
from app.models.user import User
from app.utils.security import hash_password

async def main(email: str, password: str, name: str):
    engine = create_async_engine(settings.database_url)
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with Session() as s:
        s.add(User(email=email, hashed_password=hash_password(password),
                   role="ADMIN", display_name=name))
        await s.commit()
    print(f"Admin created: {email}")

if __name__ == "__main__":
    asyncio.run(main(*sys.argv[1:]))
```

Railway 백엔드 서비스 → **Settings** → **Service** → **Run a command**:
```bash
python -m scripts.create_admin admin@yourdomain.com Adm1nP@ss "관리자"
```

### B-6. 헬스체크 & 도메인

1. 자동 도메인 활성화: 백엔드 서비스 → **Settings** → **Networking** → **Generate Domain**
   - 예: `basket-api-production.up.railway.app`
2. 검증:
   ```bash
   curl https://<railway-domain>/health
   # → {"status":"ok"} (또는 백엔드 health 응답 형식)
   ```

---

## C. 프론트 — Vercel 배포

### C-1. Vercel 프로젝트 생성

1. https://vercel.com/new → GitHub repo 연결 → Basket 선택
2. **Configure Project**
   - **Framework Preset**: Vite (자동 감지)
   - **Root Directory**: `./` (변경 없음)
   - **Build Command**: `npm run build` (자동)
   - **Output Directory**: `dist` (자동)

### C-2. 환경변수

**Settings → Environment Variables**:

| Key | Value | Environments |
|---|---|---|
| `VITE_API_BASE_URL` | `https://<railway-domain>` | Production, Preview, Development |

> Vite는 빌드 타임에 `import.meta.env.VITE_*`를 정적 치환하므로, **환경변수 변경 후 반드시 재배포** 해야 적용됨.

### C-3. SPA 라우팅 (필수)

React Router의 BrowserRouter를 쓰면 `/login` 직접 새로고침 시 404 발생. 루트에 `vercel.json` 생성:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### C-4. CORS 마무리

Vercel 배포 완료 후 도메인이 확정됨 (예: `basket.vercel.app`).  
Railway 백엔드 → **Variables** → `CORS_ORIGINS`를 다음으로 업데이트:

```
["https://basket.vercel.app","https://basket-git-main-<your-org>.vercel.app"]
```
- 프로덕션 도메인 + Preview 도메인까지 포함하면 PR 미리보기에서도 동작
- 변경 후 백엔드 자동 재배포 트리거됨

---

## D. 배포 후 검증 체크리스트

### D-1. 기능 검증
- [ ] `https://<vercel>` 접속 → 홈 화면 정상 렌더링
- [ ] `/signup`에서 신규 계정 생성 → 자동 로그인 → JWT 토큰 발급 (DevTools → Application → Local Storage 확인)
- [ ] `/login` 후 새로고침 → 로그인 상태 유지
- [ ] ADMIN 계정으로 `/ops` 진입 → 일반 USER로 진입 시 `/access-denied`
- [ ] 체육관 탐색 → 예약 신청 → 입금 확인 전체 플로우

### D-2. 보안 검증
```bash
# 1. 보안 헤더 확인
curl -I https://<railway-domain>/health
# 응답에 다음 5개 모두 포함되어야 함:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# Referrer-Policy: ...
# Permissions-Policy: ...
# Strict-Transport-Security: max-age=...

# 2. Rate limit 확인
for i in {1..15}; do
  curl -X POST https://<railway-domain>/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"x@x.com","password":"x"}'
  echo
done
# 11번째 응답부터 HTTP 429

# 3. 프로덕션 시작 차단 검증 (의도적 실패 테스트)
# Railway에서 JWT_SECRET_KEY를 일시적으로 'change-me'로 바꾸고 재배포
# → 백엔드 컨테이너가 lifespan에서 RuntimeError로 죽어야 함
# 확인 후 원래 값으로 복원
```

### D-3. 성능 / 모니터링
- [ ] Vercel Analytics 활성화 (무료 플랜)
- [ ] Railway Metrics에서 CPU·메모리 정상 범위
- [ ] Sentry / LogRocket 연결 (선택)

---

## E. CI/CD (선택, 권장)

`.github/workflows/check.yml`:

```yaml
name: PR Checks
on:
  pull_request:
    branches: [main]
jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run build

  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: secret, POSTGRES_DB: basket }
        ports: ['5432:5432']
        options: --health-cmd "pg_isready" --health-interval 5s
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install -e "./backend[dev]"
        working-directory: ./backend
      - run: alembic upgrade head
        working-directory: ./backend
        env: { DATABASE_URL: postgresql+asyncpg://postgres:secret@localhost/basket }
      # - run: pytest  # Phase 6에서 활성화
```

배포 자동화는 필요 없음:
- **Vercel**: GitHub push 자동 감지 → 자동 배포 (Production은 main, PR은 Preview)
- **Railway**: 동일하게 GitHub 연동 시 main push 자동 배포

---

## F. 다른 플랫폼 부록

### F-1. Render (Railway 대안)
- 동일하게 GitHub 연동, Dockerfile 빌드
- **단점**: PostgreSQL 무료 플랜은 90일 후 자동 삭제 → 유료($7/월) 또는 마이그레이션 계획 필요
- **장점**: 백엔드 무료 플랜 있음 (단, 15분 idle 시 sleep)

### F-2. Fly.io
- `fly launch` → `fly.toml` 자동 생성
- Postgres는 별도 `fly postgres create`
- **장점**: Edge 분산, 비용 효율
- **단점**: 학습곡선 ↑, asyncpg 연결 풀 튜닝 필요

### F-3. AWS (ECS Fargate + RDS)
- Terraform / CDK 권장
- ALB → ECS Fargate (백엔드 컨테이너) → RDS PostgreSQL
- **장점**: 무한 확장, 기업 인프라
- **단점**: 비용·운영 부담 큼. 1인 개발팀에는 과함.

### F-4. Cloudflare Pages + Workers
- 프론트만 Cloudflare Pages, 백엔드는 다른 곳
- 백엔드를 Workers로 옮기려면 FastAPI → Hono 등 재작성 필요 → 비추

---

## G. 첫 배포 일정 권장 (반나절)

| 시간 | 작업 |
|---|---|
| 0:00 | GitHub push, JWT_SECRET_KEY 생성 |
| 0:15 | Railway 프로젝트 + PostgreSQL 생성 |
| 0:30 | 환경변수 등록, asyncpg 변환 적용 (config.py 수정) |
| 0:45 | 첫 배포 → 로그 확인, Pre-Deploy Command로 Alembic 적용 |
| 1:00 | ADMIN 계정 생성, /health 확인 |
| 1:15 | Vercel 프로젝트 생성, VITE_API_BASE_URL 등록 |
| 1:30 | 첫 배포 → 도메인 확보 |
| 1:45 | Railway CORS_ORIGINS 업데이트, 백엔드 재배포 |
| 2:00 | E2E 검증 (회원가입→예약→OWNER 확정) |
| 2:30 | 보안 검증 (헤더, rate limit) |
| 3:00 | 모니터링 / 도메인 연결 / 마무리 |

---

## H. 자주 마주치는 배포 실패

| 증상 | 원인 | 해결 |
|---|---|---|
| Railway 빌드 시 `setuptools.errors.PackageDiscoveryError` | `pyproject.toml`의 packages 설정 | `[tool.setuptools.packages.find]` `include = ["app*"]` 확인 |
| `RuntimeError: JWT_SECRET_KEY must be set in production` | ENVIRONMENT=production인데 secret이 기본값 | Railway Variables 재확인 |
| `JSONDecodeError: Expecting value: line 1 column 1` (CORS_ORIGINS) | pydantic-settings는 list를 JSON으로 파싱 | `["..."]` 형식인지 확인 (쉼표 X) |
| Vercel에서 새로고침 시 404 | SPA 라우팅 미설정 | `vercel.json` 추가 |
| 프론트에서 `Access-Control-Allow-Origin` 에러 | Railway CORS_ORIGINS에 Vercel 도메인 누락 | 백엔드 환경변수 업데이트 후 재배포 |
| Login은 되는데 다음 요청이 401 | refresh 토큰 받지 못함 또는 access 만료 | DevTools → Network에서 Authorization 헤더 확인, AuthContext의 토큰 저장 로직 확인 |
| `module 'bcrypt' has no attribute '__about__'` | passlib + bcrypt 4.x 충돌 | 이미 직접 bcrypt 사용으로 교체됨 (utils/security.py 확인) |

---

## I. 다음 단계

배포 후 진행할 작업:
1. `docs/SECURITY_TODO.md` §4 — Refresh blacklist Redis 이전 (Railway에 Redis 추가)
2. `docs/SECURITY_TODO.md` §3 — 비밀번호 재설정 (이메일 발송 인프라 필요)
3. `docs/PROGRESS_HANDOVER.md` Phase 6 — pytest 테스트 작성
4. 모니터링: Sentry, Vercel Analytics, Railway Metrics 연동
