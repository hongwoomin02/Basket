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
    gym_id: uuid.UUID | None = None,
):
    """OWNER 대시보드.
    - 소유 체육관이 여러 개인 경우: gym_id 쿼리 파라미터로 선택, 생략 시 첫 번째.
    - 응답에 ownedGyms 리스트를 함께 반환해 프론트가 드롭다운으로 전환할 수 있게 한다.
    """
    owner_gyms_result = await db.execute(
        select(OwnerGym).where(OwnerGym.owner_user_id == current_user.id)
    )
    owner_gyms = owner_gyms_result.scalars().all()
    if not owner_gyms:
        raise HTTPException(404, {"code": "NO_GYM", "message": "아직 등록된 운영 체육관이 없습니다."})

    # gym_id 지정 시 해당 체육관이 내 소유인지 검증, 미지정 시 첫 번째
    if gym_id is not None:
        og = next((g for g in owner_gyms if g.gym_place_id == gym_id), None)
        if not og:
            raise HTTPException(403, {"code": "FORBIDDEN", "message": "해당 체육관의 운영자가 아닙니다."})
    else:
        og = owner_gyms[0]

    gym_id = og.gym_place_id
    place = await db.get(Place, gym_id)

    # 소유 체육관 목록 (드롭다운용) — 이름까지 포함
    owned_gyms_view = []
    for g in owner_gyms:
        p = await db.get(Place, g.gym_place_id)
        owned_gyms_view.append({
            "gymPlaceId": str(g.gym_place_id),
            "name": p.name if p else "",
            "district": p.district if p else "",
        })

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
            "ownedGyms": owned_gyms_view,
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
    gym_id: uuid.UUID | None = None,
):
    """OWNER 의 예약 목록.
    - gym_id 지정 시 해당 체육관만, 미지정 시 소유 체육관 전체 합산.
    - status: AWAITING_TRANSFER / TRANSFER_SUBMITTED / OWNER_VERIFIED / CONFIRMED / CANCELLED
    """
    og_result = await db.execute(select(OwnerGym).where(OwnerGym.owner_user_id == current_user.id))
    owner_gyms = og_result.scalars().all()
    if not owner_gyms:
        raise HTTPException(404, {"code": "NO_GYM", "message": "아직 등록된 운영 체육관이 없습니다."})

    if gym_id is not None:
        if not any(g.gym_place_id == gym_id for g in owner_gyms):
            raise HTTPException(403, {"code": "FORBIDDEN", "message": "해당 체육관의 운영자가 아닙니다."})
        gym_ids = [gym_id]
    else:
        gym_ids = [g.gym_place_id for g in owner_gyms]

    conditions = [Reservation.gym_place_id.in_(gym_ids)]
    if status:
        conditions.append(Reservation.status == status)

    result = await db.execute(
        select(Reservation).where(and_(*conditions))
        .order_by(Reservation.date.desc(), Reservation.requested_at.desc())
    )
    rows = result.scalars().all()

    # place 이름 매핑 (한번에 lookup)
    place_name_map: dict[uuid.UUID, str] = {}
    for g_id in gym_ids:
        p = await db.get(Place, g_id)
        if p:
            place_name_map[g_id] = p.name
    return Response(
        data={"rows": [
            {
                "id": str(r.id),
                "gymPlaceId": str(r.gym_place_id),
                "gymName": place_name_map.get(r.gym_place_id, ""),
                "bookerName": r.booker_name,
                "teamName": r.team_name,
                "phone": r.phone,
                "date": r.date.isoformat(),
                "time": r.time_label,
                "headcount": r.headcount,
                "finalPrice": r.final_price,
                "discountApplied": r.discount_applied,
                "status": r.status,
                "requestedAt": r.requested_at.isoformat() if r.requested_at else None,
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
