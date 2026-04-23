"""예약 생성/조회/상태 전이 API — Sprint 2"""
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user, get_optional_user
from app.models.reservation import PaymentTransfer, Reservation, ReservationStatusTimeline
from app.models.schedule import GymPaymentMethod, SchedulePricingPolicy, Slot
from app.models.user import User
from app.schemas.common import Response
from app.utils.price import calculate_price

router = APIRouter(prefix="/reservations", tags=["reservations"])

# 유효한 상태 전이 맵
VALID_TRANSITIONS: dict[str, str] = {
    "mark-checked": ("TRANSFER_SUBMITTED", "OWNER_VERIFIED"),
    "mark-confirmed": ("OWNER_VERIFIED", "CONFIRMED"),
    "mark-cancelled": (None, "CANCELLED"),  # None = 어느 상태든 가능
}


@router.post("", status_code=201)
async def create_reservation(
    body: dict,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User | None, Depends(get_optional_user)],
):
    gym_place_id = uuid.UUID(body["gymId"])
    slot_id = uuid.UUID(body["slotId"]) if body.get("slotId") else None

    # 슬롯 유효성 검증
    if slot_id:
        slot = await db.get(Slot, slot_id)
        if not slot or slot.status != "AVAILABLE":
            raise HTTPException(409, {"code": "SLOT_NOT_RESERVABLE", "message": "예약 불가능한 슬롯입니다."})
        date_val, start_time_val, end_time_val = slot.date, slot.start_time, slot.end_time
        time_label = f"{slot.start_time.strftime('%H:%M')} ~ {slot.end_time.strftime('%H:%M')}"
    else:
        raise HTTPException(400, {"code": "VALIDATION_ERROR", "message": "slotId가 필요합니다."})

    # 중복 예약 방지
    dup = await db.execute(
        select(Reservation).where(
            and_(
                Reservation.gym_place_id == gym_place_id,
                Reservation.date == date_val,
                Reservation.start_time == start_time_val,
                Reservation.status != "CANCELLED",
            )
        )
    )
    if dup.scalar_one_or_none():
        raise HTTPException(409, {"code": "DUPLICATE_RESERVATION", "message": "이미 예약된 시간입니다."})

    # 가격 계산
    policy = await db.get(SchedulePricingPolicy, gym_place_id)
    pricing = calculate_price(body.get("peopleCount", 1), policy, date_val)

    reservation = Reservation(
        gym_place_id=gym_place_id,
        slot_id=slot_id,
        user_id=current_user.id if current_user else None,
        date=date_val,
        start_time=start_time_val,
        end_time=end_time_val,
        time_label=time_label,
        team_name=body["teamName"],
        booker_name=body["bookerName"],
        phone=body["phone"],
        headcount=body.get("peopleCount", 1),
        memo=body.get("memo"),
        status="AWAITING_TRANSFER",
        **pricing,
    )
    db.add(reservation)
    # 자식 타임라인이 reservation.id를 FK로 참조하므로 부모를 먼저 flush하여 PK 확정
    await db.flush()

    # 타임라인 초기 항목
    for key, label in [("requested", "신청됨"), ("waiting", "송금 대기")]:
        db.add(ReservationStatusTimeline(
            reservation_id=reservation.id,
            key=key,
            label=label,
            done_at=datetime.now(timezone.utc) if key == "requested" else None,
        ))
    await db.flush()

    return Response(
        data={
            "reservationId": str(reservation.id),
            "status": reservation.status,
            "pricingSnapshot": {
                "basePrice": pricing["base_price"],
                "discountApplied": pricing["discount_applied"],
                "discountAmount": pricing["discount_amount"],
                "finalPrice": pricing["final_price"],
            },
        }
    )


@router.get("/{reservation_id}")
async def get_reservation(reservation_id: uuid.UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    r = await db.get(Reservation, reservation_id)
    if not r:
        raise HTTPException(404, {"code": "NOT_FOUND", "message": "예약을 찾을 수 없습니다."})
    from app.models.place import Place
    place = await db.get(Place, r.gym_place_id)
    return Response(
        data={
            "reservationId": str(r.id),
            "gymName": place.name if place else "",
            "date": r.date.isoformat(),
            "time": r.time_label,
            "peopleCount": r.headcount,
            "finalPrice": r.final_price,
            "status": r.status,
            "payerName": None,
        }
    )


@router.get("/{reservation_id}/timeline")
async def get_timeline(reservation_id: uuid.UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(
        select(ReservationStatusTimeline)
        .where(ReservationStatusTimeline.reservation_id == reservation_id)
        .order_by(ReservationStatusTimeline.done_at)
    )
    timelines = result.scalars().all()
    return Response(
        data={
            "statusTimeline": [
                {"key": t.key, "label": t.label, "doneAt": t.done_at.isoformat() if t.done_at else None}
                for t in timelines
            ]
        }
    )


@router.post("/{reservation_id}/transfer-done")
async def transfer_done(
    reservation_id: uuid.UUID,
    body: dict,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    r = await db.get(Reservation, reservation_id)
    if not r:
        raise HTTPException(404, {"code": "NOT_FOUND", "message": "예약을 찾을 수 없습니다."})
    if r.status != "AWAITING_TRANSFER":
        raise HTTPException(409, {"code": "INVALID_RESERVATION_STATE", "message": "송금 대기 상태가 아닙니다."})

    r.status = "TRANSFER_SUBMITTED"
    transfer = PaymentTransfer(
        reservation_id=reservation_id,
        payer_name=body["payerName"],
        proof_enabled=bool(body.get("proofAsset")),
        submitted_at=datetime.now(timezone.utc),
    )
    db.add(transfer)

    db.add(ReservationStatusTimeline(
        reservation_id=reservation_id,
        key="transferred",
        label="송금 완료",
        done_at=datetime.now(timezone.utc),
    ))
    await db.flush()
    return Response(data={"reservationId": str(r.id), "status": r.status})


@router.get("/my/list")
async def my_reservations(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    from app.models.place import Place
    result = await db.execute(
        select(Reservation, Place.name)
        .join(Place, Place.id == Reservation.gym_place_id)
        .where(Reservation.user_id == current_user.id)
        .order_by(Reservation.requested_at.desc())
    )
    rows = result.all()
    return Response(
        data={
            "reservations": [
                {
                    "id": str(r.id),
                    "gymPlaceId": str(r.gym_place_id),
                    "gymName": gym_name,
                    "date": r.date.isoformat(),
                    "time": r.time_label,
                    "status": r.status,
                    "finalPrice": r.final_price,
                }
                for (r, gym_name) in rows
            ]
        }
    )
