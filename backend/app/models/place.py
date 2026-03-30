import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Float, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Place(Base):
    __tablename__ = "places"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type: Mapped[str] = mapped_column(
        Enum("GYM", "OUTDOOR", name="place_type"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    district: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    short_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class GymProfile(Base):
    __tablename__ = "gym_profiles"

    place_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    court_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    hours: Mapped[str | None] = mapped_column(String(100), nullable=True)
    parking: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # amenities는 PostgreSQL ARRAY - Alembic에서 처리
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class OutdoorProfile(Base):
    __tablename__ = "outdoor_profiles"

    place_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    fee_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    floor_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    light_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    rim_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    cleanliness: Mapped[str | None] = mapped_column(String(50), nullable=True)
    crowd_level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class PlaceAsset(Base):
    __tablename__ = "place_assets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    place_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    type: Mapped[str] = mapped_column(
        Enum("GALLERY", "THUMBNAIL", "REVIEW_PHOTO", "PROOF", name="asset_type"), nullable=False
    )
    url: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
