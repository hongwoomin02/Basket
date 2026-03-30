"""운영자 콘솔 API — Sprint 3"""
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import require_role
from app.models.place import Place
from app.models.reservation import Reservation, ReservationStatusTimeline
from app.models.schedule import (
    GymPaymentMethod,
    OwnerGym,
    ScheduleExceptionRule,
    SchedulePricingPolicy,
    ScheduleRepeatRule,
    SlotOverride,
)
from app.models.user import User
from app.schemas.common import Response

owner_required = require_role("OWNER", "ADMIN")

router = APIRouter(prefix="/owners", tags=["owner"])


@router.get("/me/dashboard")
async def get_dashboard(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(owner_required)],
):
    owner_gym = await db.execute(
        select(OwnerGym).where(OwnerGym.owner_user_id == current_user.id)
    )
    og = owner_gym.scalar_one_or_none()
    if not og:
        raise HTTPException(404, {"code": "NOT_FOUND", "message": "운영 체육관이 없습니다."})

    gym_id = og.gym_place_id
    place = await db.get(Place, gym_id)

    # KPI 집계
    from datetime import date
    today = date.today()

    def count_status(status: str):
        return select(func.count(Reservation.id)).where(
            Reservation.gym_place_id == gym_id,
            Reservation.status == status,
        )

    awaiting = (await db.execute(count_status("AWAITING_TRANSFER"))).scalar() or 0
    confirmed = (await db.execute(count_status("CONFIRMED"))).scalar() or 0
    discount_count = (await db.execute(
        select(func.count(Reservation.id)).where(
            Reservation.gym_place_id == gym_id,
            Reservation.discount_applied.is_(True),
        )
    )).scalar() or 0

    recent = await db.execute(
        select(Reservation).where(Reservation.gym_place_id == gym_id)
        .order_by(Reservation.requested_at.desc()).limit(10)
    )
    recent_reservations = recent.scalars().all()

    return Response(
        data={
            "ownerGymProfile": {
                "gymPlaceId": str(gym_id),
                "name": place.name if place else "",
                "district": place.district if place else "",
            },
            "kpis": [
                {"label": "송금 대기", "value": awaiting},
                {"label": "예약 확정", "value": confirmed},
                {"label": "할인 적용 예약", "value": discount_count},
            ],
            "recentReservations": [
                {
                    "id": str(r.id),
                    "bookerName": r.booker_name,
                    "time": r.time_label,
                    "status": r.status,
                }
                for r in recent_reservations
            ],
        }
    )


@router.get("/me/reservations")
async def list_owner_reservations(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(owner_required)],
    status: str | None = None,
):
    og = await db.execute(select(OwnerGym).where(OwnerGym.owner_user_id == current_user.id))
    owner_gym = og.scalar_one_or_none()
    if not owner_gym:
        raise HTTPException(404, {"code": "NOT_FOUND", "message": "운영 체육관이 없습니다."})

    conditions = [Reservation.gym_place_id == owner_gym.gym_place_id]
    if status:
        conditions.append(Reservation.status == status)

    result = await db.execute(
        select(Reservation).where(and_(*conditions)).order_by(Reservation.date.desc())
    )
    rows = result.scalars().all()
    return Response(
        data={"rows": [
            {
                "id": str(r.id),
                "bookerName": r.booker_name,
                "teamName": r.team_name,
                "date": r.date.isoformat(),
                "time": r.time_label,
                "headcount": r.headcount,
                "finalPrice": r.final_price,
                "discountApplied": r.discount_applied,
                "status": r.status,
            }
            for r in rows
        ]}
    )


async def _transition_reservation(
    reservation_id: uuid.UUID,
    required_current: str | None,
    new_status: str,
    timeline_key: str,
    timeline_label: str,
    db: AsyncSession,
):
    r = await db.get(Reservation, reservation_id)
    if not r:
        raise HTTPException(404, {"code": "NOT_FOUND", "message": "예약을 찾을 수 없습니다."})
    if required_current and r.status != required_current:
        raise HTTPException(409, {
            "code": "INVALID_RESERVATION_STATE",
            "message": f"현재 상태가 {required_current}이 아닙니다. (현재: {r.status})",
        })
    r.status = new_status
    if new_status == "CANCELLED":
        r.cancelled_at = datetime.now(timezone.utc)
    db.add(ReservationStatusTimeline(
        reservation_id=reservation_id,
        key=timeline_key,
        label=timeline_label,
        done_at=datetime.now(timezone.utc),
    ))
    await db.flush()
    return Response(data={"reservationId": str(r.id), "status": r.status})


@router.post("/reservations/{reservation_id}/mark-checked")
async def mark_checked(
    reservation_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(owner_required)],
):
    return await _transition_reservation(
        reservation_id, "TRANSFER_SUBMITTED", "OWNER_VERIFIED", "checked", "확인 완료", db
    )


@router.post("/reservations/{reservation_id}/mark-confirmed")
async def mark_confirmed(
    reservation_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(owner_required)],
):
    return await _transition_reservation(
        reservation_id, "OWNER_VERIFIED", "CONFIRMED", "confirmed", "예약 확정", db
    )


@router.post("/reservations/{reservation_id}/mark-cancelled")
async def mark_cancelled(
    reservation_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(owner_required)],
):
    return await _transition_reservation(
        reservation_id, None, "CANCELLED", "cancelled", "취소됨", db
    )
