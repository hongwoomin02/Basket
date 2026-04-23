"""add_pending_owner_role

Revision ID: 9d39ba6afb52
Revises: 6b503e01b485
Create Date: 2026-04-23 13:34:18.333680

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "9d39ba6afb52"
down_revision: Union[str, None] = "6b503e01b485"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # PostgreSQL native enum 타입에 새 값 추가 (트랜잭션 외부에서 실행되어야 함).
    # SQLAlchemy 의 op.execute 는 자동 트랜잭션이지만,
    # ALTER TYPE ... ADD VALUE 는 PG 12+ 에서 트랜잭션 안에서도 허용됨.
    op.execute("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'PENDING_OWNER'")


def downgrade() -> None:
    # PostgreSQL 은 enum 값 제거를 직접 지원하지 않음.
    # 실제 다운그레이드가 필요하면 임시 타입 생성 → 컬럼 변환 → 드롭 패턴 필요.
    # 이 마이그레이션은 실질적으로 비가역.
    pass
