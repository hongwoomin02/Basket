"""
Slot 자동 생성 엔진

repeat_rules + exception_rules + slot_overrides 를 합성해서
특정 체육관의 월간 슬롯을 DB에 upsert 한다.

사용:
    await generate_slots_for_month(gym_place_id, "2026-04", db)
"""
import uuid
from calendar import monthrange
from datetime import date, time, timedelta

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.place import GymProfile
from app.models.schedule import (
    ScheduleExceptionRule,
    SchedulePricingPolicy,
    ScheduleRepeatRule,
    Slot,
    SlotOverride,
)


async def generate_slots_for_month(
    gym_place_id: uuid.UUID,
    month: str,  # "YYYY-MM"
    db: AsyncSession,
) -> list[Slot]:
    """
    지정 체육관의 해당 월 슬롯을 생성/갱신한다.
    이미 존재하는 슬롯은 override만 반영하고 건너뜀.
    """
    year, mon = map(int, month.split("-"))
    _, days_in_month = monthrange(year, mon)

    # 기존 슬롯 로드 (덮어쓰기 대상)
    existing = await db.execute(
        select(Slot).where(
            Slot.gym_place_id == gym_place_id,
            Slot.date >= date(year, mon, 1),
            Slot.date <= date(year, mon, days_in_month),
        )
    )
    existing_slots: dict[tuple, Slot] = {
        (s.date, s.start_time): s for s in existing.scalars().all()
    }

    # 가격 정책
    policy = await db.get(SchedulePricingPolicy, gym_place_id)
    if not policy:
        return []

    # 반복 규칙 (CLASS/REGULAR 패턴 — weekday 기반 단순 파싱)
    repeat_result = await db.execute(
        select(ScheduleRepeatRule).where(
            ScheduleRepeatRule.gym_place_id == gym_place_id,
            ScheduleRepeatRule.enabled.is_(True),
        )
    )
    repeat_rules = repeat_result.scalars().all()

    # 예외 규칙 (휴관일)
    exc_result = await db.execute(
        select(ScheduleExceptionRule).where(
            ScheduleExceptionRule.gym_place_id == gym_place_id,
            ScheduleExceptionRule.enabled.is_(True),
        )
    )
    exception_rules = exc_result.scalars().all()
    exception_dates: set[date] = set()
    for ex in exception_rules:
        if ex.exception_date:
            exception_dates.add(ex.exception_date)
        if ex.date_range_start and ex.date_range_end:
            cur = ex.date_range_start
            while cur <= ex.date_range_end:
                exception_dates.add(cur)
                cur += timedelta(days=1)

    # 슬롯 오버라이드
    override_result = await db.execute(
        select(SlotOverride).where(
            SlotOverride.gym_place_id == gym_place_id,
            SlotOverride.date >= date(year, mon, 1),
            SlotOverride.date <= date(year, mon, days_in_month),
        )
    )
    overrides: dict[tuple, SlotOverride] = {
        (o.date, o.start_time): o for o in override_result.scalars().all()
    }

    # 운영시간 파싱 (예: "09:00 ~ 22:00")
    gym_profile = await db.get(GymProfile, gym_place_id)
    open_hour, close_hour = 9, 22
    if gym_profile and gym_profile.hours:
        try:
            parts = gym_profile.hours.replace(" ", "").split("~")
            open_hour = int(parts[0].split(":")[0])
            close_hour = int(parts[1].split(":")[0])
        except Exception:
            pass

    new_slots: list[Slot] = []

    for day in range(1, days_in_month + 1):
        slot_date = date(year, mon, day)
        is_weekend = slot_date.weekday() >= 5
        base_price = policy.weekend_hourly_price if is_weekend else policy.base_hourly_price

        for hour in range(open_hour, close_hour):
            start = time(hour, 0)
            end = time(hour + 1, 0) if hour < 23 else time(23, 59)
            key = (slot_date, start)

            # 오버라이드 우선 적용
            if key in overrides:
                ov = overrides[key]
                status = ov.override_status
                price = ov.override_price if status == "AVAILABLE" else None
            elif slot_date in exception_dates:
                status, price = "CLOSED", None
            else:
                status = _apply_repeat_rules(repeat_rules, slot_date, start)
                price = base_price if status == "AVAILABLE" else None

            if key in existing_slots:
                # 기존 슬롯 갱신
                s = existing_slots[key]
                s.status = status
                s.price = price
                new_slots.append(s)
            else:
                s = Slot(
                    gym_place_id=gym_place_id,
                    date=slot_date,
                    start_time=start,
                    end_time=end,
                    status=status,
                    price=price,
                )
                db.add(s)
                new_slots.append(s)

    await db.flush()
    return new_slots


def _apply_repeat_rules(
    rules: list[ScheduleRepeatRule],
    slot_date: date,
    start: time,
) -> str:
    """
    rrule_spec 형식: "MON-FRI:10:00-12:00:CLASS" 또는 "SAT:14:00-16:00:REGULAR"
    형식이 맞지 않으면 무시하고 AVAILABLE 반환.
    """
    for rule in rules:
        try:
            parts = rule.rrule_spec.split(":")
            if len(parts) < 4:
                continue
            days_part, start_h, start_m_end, rule_status = parts[0], parts[1], parts[2], parts[3]
            end_h, end_m = start_m_end.split("-")[1].split(":") if "-" in start_m_end else (parts[2], "0")
            start_time = time(int(start_h), 0)
            end_time = time(int(end_h), 0)

            weekday_map = {"MON": 0, "TUE": 1, "WED": 2, "THU": 3, "FRI": 4, "SAT": 5, "SUN": 6}
            day_range = days_part.split("-")
            if len(day_range) == 2:
                start_day = weekday_map.get(day_range[0], -1)
                end_day = weekday_map.get(day_range[1], -1)
                applies = start_day <= slot_date.weekday() <= end_day
            else:
                applies = slot_date.weekday() == weekday_map.get(days_part, -1)

            if applies and start_time <= start < end_time:
                return rule_status
        except Exception:
            continue
    return "AVAILABLE"
