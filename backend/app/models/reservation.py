import uuid
from datetime import date, datetime, time

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    Index,
    Integer,
    String,
    Text,
    Time,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Reservation(Base):
    __tablename__ = "reservations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    gym_place_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    slot_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)

    date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    time_label: Mapped[str] = mapped_column(String(50), nullable=False)

    team_name: Mapped[str] = mapped_column(String(100), nullable=False)
    booker_name: Mapped[str] = mapped_column(String(50), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    headcount: Mapped[int] = mapped_column(Integer, nullable=False)
    memo: Mapped[str | None] = mapped_column(Text, nullable=True)

    # 가격 스냅샷
    base_price: Mapped[int] = mapped_column(Integer, nullable=False)
    discount_applied: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    discount_amount: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    final_price: Mapped[int] = mapped_column(Integer, nullable=False)

    status: Mapped[str] = mapped_column(
        Enum(
            "REQUESTED",
            "AWAITING_TRANSFER",
            "TRANSFER_SUBMITTED",
            "OWNER_VERIFIED",
            "CONFIRMED",
            "CANCELLED",
            name="reservation_status",
        ),
        nullable=False,
        default="REQUESTED",
        index=True,
    )
    idempotency_key: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # 중복 예약 방지 인덱스 (CANCELLED가 아닌 상태에서 같은 슬롯 중복 불가)
    # Alembic에서 partial unique index로 처리
    __table_args__ = (
        Index("ix_reservation_gym_date_time", "gym_place_id", "date", "start_time"),
    )


class PaymentTransfer(Base):
    __tablename__ = "payment_transfers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reservation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), unique=True, nullable=False
    )
    payer_name: Mapped[str] = mapped_column(String(50), nullable=False)
    proof_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    proof_asset_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    proof_file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class ReservationStatusTimeline(Base):
    __tablename__ = "reservation_status_timelines"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reservation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True
    )
    key: Mapped[str] = mapped_column(String(30), nullable=False)
    label: Mapped[str] = mapped_column(String(50), nullable=False)
    done_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
