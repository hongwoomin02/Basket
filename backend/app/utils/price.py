"""가격 계산 유틸리티"""
from datetime import date, datetime, timezone


def calculate_price(headcount: int, policy, reservation_date: date) -> dict:
    """
    PRD/ERD 기반 할인 계산 로직
    반환: base_price, discount_applied, discount_amount, final_price
    """
    if policy is None:
        return {
            "base_price": 0,
            "discount_applied": False,
            "discount_amount": 0,
            "final_price": 0,
        }

    is_weekend = reservation_date.weekday() >= 5  # 토=5, 일=6
    base = policy.weekend_hourly_price if is_weekend else policy.base_hourly_price

    discount = 0
    discount_applied = False

    threshold = policy.discount_person_threshold
    if threshold and headcount <= threshold:
        # 당일 예약 조건 확인
        if policy.same_day_only:
            today = datetime.now(timezone.utc).date()
            if reservation_date != today:
                # 당일 아니면 할인 미적용
                return {
                    "base_price": base,
                    "discount_applied": False,
                    "discount_amount": 0,
                    "final_price": base,
                }

        rate_discount = int(base * float(policy.discount_rate_percent or 0) / 100)
        fixed_discount = int(policy.discount_fixed_amount or 0)
        discount = max(rate_discount, fixed_discount)
        discount_applied = True

    return {
        "base_price": base,
        "discount_applied": discount_applied,
        "discount_amount": discount,
        "final_price": base - discount,
    }
