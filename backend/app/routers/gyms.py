"""체육관 상세/캘린더/결제수단/운영자 일정 API"""
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy import String, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import require_role
from app.models.place import GymProfile, Place, PlaceAsset
from app.services.slot_engine import generate_slots_for_month
from app.models.schedule import (
    GymPaymentMethod,
    OwnerGym,
    ScheduleExceptionRule,
    SchedulePricingPolicy,
    ScheduleRepeatRule,
    Slot,
    SlotOverride,
)
from app.models.user import User
from app.schemas.common import Response

router = APIRouter(prefix="/gyms", tags=["gyms"])
owner_required = require_role("OWNER", "ADMIN")


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
                "amenities": profile.amenities if profile else [],
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
    """슬롯 목록 반환 — DB에 슬롯이 없으면 자동 생성"""
    result = await db.execute(
        select(Slot)
        .where(
            Slot.gym_place_id == gym_place_id,
            Slot.date.cast(String).like(f"{month}%"),
        )
        .order_by(Slot.date, Slot.start_time)
    )
    slots = result.scalars().all()
    if not slots:
        slots = await generate_slots_for_month(gym_place_id, month, db)
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
                    "date": s.date.isoformat(),
                    "startTime": s.start_time.strftime("%H:%M"),
                    "endTime": s.end_time.strftime("%H:%M"),
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
            "visibleMethods": pm.visible_methods or [],
        }
    )


@router.put("/{gym_place_id}/payment-methods")
async def update_payment_methods(
    gym_place_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(owner_required)],
    body: dict = Body(...),
):
    pm = await db.get(GymPaymentMethod, gym_place_id)
    if not pm:
        pm = GymPaymentMethod(gym_place_id=gym_place_id)
        db.add(pm)
    pm.kakao_pay_link = body.get("kakaoPayLink")
    pm.bank_name = body.get("bankName")
    pm.account_number = body.get("accountNumber")
    pm.account_holder = body.get("accountHolder")
    pm.visible_methods = body.get("visibleMethods", [])
    await db.flush()
    return Response(data={"kakaoPayLink": pm.kakao_pay_link, "bankName": pm.bank_name,
                          "accountNumber": pm.account_number, "accountHolder": pm.account_holder,
                          "visibleMethods": pm.visible_methods})


@router.put("/{gym_place_id}/pricing-policy")
async def update_pricing_policy(
    gym_place_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(owner_required)],
    body: dict = Body(...),
):
    policy = await db.get(SchedulePricingPolicy, gym_place_id)
    if not policy:
        policy = SchedulePricingPolicy(gym_place_id=gym_place_id,
                                       base_hourly_price=0, weekend_hourly_price=0)
        db.add(policy)
    policy.base_hourly_price = body.get("baseHourlyPrice", policy.base_hourly_price)
    policy.weekend_hourly_price = body.get("weekendHourlyPrice", policy.weekend_hourly_price)
    policy.discount_person_threshold = body.get("discountPersonThreshold")
    policy.discount_rate_percent = body.get("discountRatePercent", 0)
    policy.discount_fixed_amount = body.get("discountFixedAmount", 0)
    policy.same_day_only = body.get("sameDayOnly", False)
    await db.flush()
    return Response(data={"baseHourlyPrice": policy.base_hourly_price,
                          "weekendHourlyPrice": policy.weekend_hourly_price})


@router.get("/{gym_place_id}/repeat-rules")
async def get_repeat_rules(gym_place_id: uuid.UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(
        select(ScheduleRepeatRule).where(ScheduleRepeatRule.gym_place_id == gym_place_id)
    )
    rules = result.scalars().all()
    return Response(data={"repeatRules": [
        {"id": str(r.id), "label": r.label, "type": r.type, "rruleSpec": r.rrule_spec, "enabled": r.enabled}
        for r in rules
    ]})


@router.post("/{gym_place_id}/repeat-rules")
async def create_repeat_rule(
    gym_place_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(owner_required)],
    body: dict = Body(...),
):
    rule = ScheduleRepeatRule(
        gym_place_id=gym_place_id,
        type=body["type"],
        label=body["label"],
        rrule_spec=body.get("rruleSpec", ""),
        enabled=body.get("enabled", True),
    )
    db.add(rule)
    await db.flush()
    return Response(data={"id": str(rule.id), "label": rule.label, "type": rule.type})


@router.patch("/{gym_place_id}/repeat-rules/{rule_id}")
async def update_repeat_rule(
    gym_place_id: uuid.UUID,
    rule_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(owner_required)],
    body: dict = Body(...),
):
    rule = await db.get(ScheduleRepeatRule, rule_id)
    if not rule or rule.gym_place_id != gym_place_id:
        raise HTTPException(404, {"code": "NOT_FOUND", "message": "규칙을 찾을 수 없습니다."})
    if "label" in body:
        rule.label = body["label"]
    if "enabled" in body:
        rule.enabled = body["enabled"]
    if "rruleSpec" in body:
        rule.rrule_spec = body["rruleSpec"]
    await db.flush()
    return Response(data={"id": str(rule.id), "enabled": rule.enabled})


@router.delete("/{gym_place_id}/repeat-rules/{rule_id}")
async def delete_repeat_rule(
    gym_place_id: uuid.UUID,
    rule_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(owner_required)],
):
    rule = await db.get(ScheduleRepeatRule, rule_id)
    if not rule or rule.gym_place_id != gym_place_id:
        raise HTTPException(404, {"code": "NOT_FOUND", "message": "규칙을 찾을 수 없습니다."})
    await db.delete(rule)
    return Response(data={"deleted": True})


@router.get("/{gym_place_id}/exception-rules")
async def get_exception_rules(gym_place_id: uuid.UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(
        select(ScheduleExceptionRule).where(ScheduleExceptionRule.gym_place_id == gym_place_id)
    )
    rules = result.scalars().all()
    return Response(data={"exceptionRules": [
        {"id": str(r.id), "label": r.label, "exceptionDate": r.exception_date.isoformat() if r.exception_date else None, "enabled": r.enabled}
        for r in rules
    ]})


@router.post("/{gym_place_id}/exception-rules")
async def create_exception_rule(
    gym_place_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(owner_required)],
    body: dict = Body(...),
):
    from datetime import date as date_type
    exception_date = date_type.fromisoformat(body["exceptionDate"]) if body.get("exceptionDate") else None
    rule = ScheduleExceptionRule(
        gym_place_id=gym_place_id,
        label=body["label"],
        exception_date=exception_date,
        enabled=body.get("enabled", True),
    )
    db.add(rule)
    await db.flush()
    return Response(data={"id": str(rule.id), "label": rule.label})


@router.patch("/{gym_place_id}/exception-rules/{rule_id}")
async def update_exception_rule(
    gym_place_id: uuid.UUID,
    rule_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(owner_required)],
    body: dict = Body(...),
):
    rule = await db.get(ScheduleExceptionRule, rule_id)
    if not rule or rule.gym_place_id != gym_place_id:
        raise HTTPException(404, {"code": "NOT_FOUND", "message": "규칙을 찾을 수 없습니다."})
    if "label" in body:
        rule.label = body["label"]
    if "enabled" in body:
        rule.enabled = body["enabled"]
    await db.flush()
    return Response(data={"id": str(rule.id), "enabled": rule.enabled})


@router.delete("/{gym_place_id}/exception-rules/{rule_id}")
async def delete_exception_rule(
    gym_place_id: uuid.UUID,
    rule_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(owner_required)],
):
    rule = await db.get(ScheduleExceptionRule, rule_id)
    if not rule or rule.gym_place_id != gym_place_id:
        raise HTTPException(404, {"code": "NOT_FOUND", "message": "규칙을 찾을 수 없습니다."})
    await db.delete(rule)
    return Response(data={"deleted": True})


@router.patch("/{gym_place_id}/slots/{slot_date}/{start_time}")
async def update_slot(
    gym_place_id: uuid.UUID,
    slot_date: str,
    start_time: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(owner_required)],
    body: dict = Body(...),
):
    from datetime import date as date_type, time as time_type
    d = date_type.fromisoformat(slot_date)
    t = time_type.fromisoformat(start_time)

    result = await db.execute(
        select(Slot).where(Slot.gym_place_id == gym_place_id, Slot.date == d, Slot.start_time == t)
    )
    slot = result.scalar_one_or_none()
    if slot:
        slot.status = body.get("status", slot.status)
        if "price" in body:
            slot.price = body["price"]
    override_result = await db.execute(
        select(SlotOverride).where(
            SlotOverride.gym_place_id == gym_place_id,
            SlotOverride.date == d,
            SlotOverride.start_time == t,
        )
    )
    override = override_result.scalar_one_or_none()
    if not override:
        override = SlotOverride(
            gym_place_id=gym_place_id, date=d, start_time=t,
            override_status=body.get("status", "AVAILABLE"),
            override_price=body.get("price"),
            source="OWNER_EDIT",
        )
        db.add(override)
    else:
        override.override_status = body.get("status", override.override_status)
        override.override_price = body.get("price", override.override_price)
    await db.flush()
    return Response(data={"date": slot_date, "startTime": start_time,
                          "status": body.get("status"), "price": body.get("price")})
