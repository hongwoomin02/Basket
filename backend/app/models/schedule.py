import uuid
from datetime import date, datetime, time

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    Integer,
    Numeric,
    String,
    Text,
    Time,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class OwnerGym(Base):
    __tablename__ = "owner_gyms"

    gym_place_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    owner_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="ACTIVE")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class SchedulePricingPolicy(Base):
    __tablename__ = "schedule_pricing_policies"

    gym_place_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    base_hourly_price: Mapped[int] = mapped_column(Integer, nullable=False)
    weekend_hourly_price: Mapped[int] = mapped_column(Integer, nullable=False)
    discount_person_threshold: Mapped[int | None] = mapped_column(Integer, nullable=True)
    discount_rate_percent: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True, default=0)
    discount_fixed_amount: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    same_day_only: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class GymPaymentMethod(Base):
    __tablename__ = "gym_payment_methods"

    gym_place_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    kakao_pay_link: Mapped[str | None] = mapped_column(Text, nullable=True)
    bank_name: Mapped[str | None] = mapped_column(String(50), nullable=True)
    account_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    account_holder: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # visible_methods는 PostgreSQL ARRAY - Alembic에서 처리
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class ScheduleRepeatRule(Base):
    __tablename__ = "schedule_repeat_rules"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    gym_place_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    type: Mapped[str] = mapped_column(
        Enum("CLASS", "REGULAR", name="repeat_rule_type"), nullable=False
    )
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    rrule_spec: Mapped[str] = mapped_column(Text, nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class ScheduleExceptionRule(Base):
    __tablename__ = "schedule_exception_rules"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    gym_place_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    exception_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    date_range_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    date_range_end: Mapped[date | None] = mapped_column(Date, nullable=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Slot(Base):
    __tablename__ = "slots"
    __table_args__ = (UniqueConstraint("gym_place_id", "date", "start_time", name="uq_slot"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    gym_place_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    status: Mapped[str] = mapped_column(
        Enum("AVAILABLE", "CLASS", "REGULAR", "CLOSED", name="slot_status"), nullable=False
    )
    price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class SlotOverride(Base):
    __tablename__ = "slot_overrides"
    __table_args__ = (UniqueConstraint("gym_place_id", "date", "start_time", name="uq_slot_override"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    gym_place_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    override_status: Mapped[str] = mapped_column(
        Enum("AVAILABLE", "CLASS", "REGULAR", "CLOSED", name="slot_status"),
        nullable=False,
    )
    override_price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source: Mapped[str] = mapped_column(
        Enum("OWNER_EDIT", "SYSTEM_GENERATED", name="slot_override_source"),
        nullable=False,
        default="OWNER_EDIT",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
