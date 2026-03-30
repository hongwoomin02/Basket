"""체육관 상세/캘린더/결제수단 API — Sprint 1"""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.place import GymProfile, Place, PlaceAsset
from app.models.schedule import GymPaymentMethod, SchedulePricingPolicy, Slot
from app.schemas.common import Response

router = APIRouter(prefix="/gyms", tags=["gyms"])


@router.get("/{gym_place_id}")
async def get_gym_detail(
    gym_place_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    place = await db.get(Place, gym_place_id)
    if not place or place.type != "GYM":
        raise HTTPException(404, {"code": "NOT_FOUND", "message": "체육관을 찾을 수 없습니다."})
    profile = await db.get(GymProfile, gym_place_id)
    return Response(
        data={
            "place": {"id": str(place.id), "name": place.name, "address": place.address, "district": place.district},
            "gymProfile": {
                "courtCount": profile.court_count if profile else 1,
                "hours": profile.hours if profile else None,
                "parking": profile.parking if profile else False,
                "amenities": [],  # TODO: ARRAY 처리
                "description": profile.description if profile else None,
            },
        }
    )


@router.get("/{gym_place_id}/gallery")
async def get_gym_gallery(gym_place_id: uuid.UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(
        select(PlaceAsset)
        .where(PlaceAsset.place_id == gym_place_id, PlaceAsset.type == "GALLERY")
        .order_by(PlaceAsset.sort_order)
    )
    assets = result.scalars().all()
    return Response(data={"gallery": [{"id": str(a.id), "url": a.url} for a in assets]})


@router.get("/{gym_place_id}/pricing-policy")
async def get_pricing_policy(gym_place_id: uuid.UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    policy = await db.get(SchedulePricingPolicy, gym_place_id)
    if not policy:
        raise HTTPException(404, {"code": "NOT_FOUND", "message": "가격 정책이 없습니다."})
    return Response(
        data={
            "baseHourlyPrice": policy.base_hourly_price,
            "weekendHourlyPrice": policy.weekend_hourly_price,
            "discountPersonThreshold": policy.discount_person_threshold,
            "discountRatePercent": float(policy.discount_rate_percent or 0),
            "discountFixedAmount": policy.discount_fixed_amount or 0,
            "sameDayOnly": policy.same_day_only,
        }
    )


@router.get("/{gym_place_id}/calendar")
async def get_gym_calendar(
    gym_place_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    month: str = Query(..., description="YYYY-MM"),
    selected_date: str | None = Query(None, alias="selectedDate"),
):
    """슬롯 목록 반환 — 슬롯 생성 엔진 미구현 시 빈 배열"""
    result = await db.execute(
        select(Slot)
        .where(
            Slot.gym_place_id == gym_place_id,
            Slot.date.cast(str).like(f"{month}%"),
        )
        .order_by(Slot.date, Slot.start_time)
    )
    slots = result.scalars().all()
    return Response(
        data={
            "monthLabel": month,
            "selectedDate": selected_date,
            "legend": [
                {"status": "AVAILABLE", "label": "예약 가능"},
                {"status": "CLASS", "label": "수업"},
                {"status": "REGULAR", "label": "정기대관"},
                {"status": "CLOSED", "label": "마감"},
            ],
            "slots": [
                {
                    "id": str(s.id),
                    "time": f"{s.start_time.strftime('%H:%M')} ~ {s.end_time.strftime('%H:%M')}",
                    "status": s.status,
                    "price": s.price if s.status == "AVAILABLE" else None,
                }
                for s in slots
            ],
        }
    )


@router.get("/{gym_place_id}/payment-methods")
async def get_payment_methods(gym_place_id: uuid.UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    pm = await db.get(GymPaymentMethod, gym_place_id)
    if not pm:
        raise HTTPException(404, {"code": "PAYMENT_METHOD_NOT_SET", "message": "결제 수단이 등록되지 않았습니다."})
    return Response(
        data={
            "kakaoPayLink": pm.kakao_pay_link,
            "bankName": pm.bank_name,
            "accountNumber": pm.account_number,
            "accountHolder": pm.account_holder,
        }
    )
