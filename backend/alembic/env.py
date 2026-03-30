# Alembic 환경 설정
# (alembic init으로 생성되는 기본 파일을 대체)

from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from sqlalchemy.ext.asyncio import AsyncEngine

from alembic import context

# app 모델 임포트 (Alembic이 테이블 감지할 수 있도록)
from app.database import Base
import app.models  # noqa: F401 - 모든 모델 등록

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    from app.config import settings

    configuration = config.get_section(config.config_ini_section, {})
    # asyncpg → psycopg2 동기 URL로 변환 (Alembic은 sync 드라이버 사용)
    sync_url = settings.database_url.replace("+asyncpg", "")
    configuration["sqlalchemy.url"] = sync_url

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
