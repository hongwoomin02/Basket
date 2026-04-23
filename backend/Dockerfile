FROM python:3.12-slim AS base

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .

# ─── Development ────────────────────────────────────
# dev extras include pytest, ruff, psycopg2-binary (Alembic 동기 드라이버)
FROM base AS development
RUN pip install --no-cache-dir -e ".[dev]"
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# ─── Production ─────────────────────────────────────
FROM base AS production
RUN pip install --no-cache-dir -e .
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
