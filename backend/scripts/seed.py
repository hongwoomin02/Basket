"""
시드 데이터 스크립트
실행: python -m scripts.seed  (backend/ 디렉토리에서)
"""
import asyncio
import uuid
from datetime import date, time, timedelta

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.models.place import GymProfile, OutdoorProfile, Place, PlaceAsset
from app.models.reservation import Reservation, ReservationStatusTimeline
from app.models.review import OutdoorReview
from app.models.schedule import (
    GymPaymentMethod,
    OwnerGym,
    SchedulePricingPolicy,
    Slot,
)
from app.models.user import User
from app.utils.security import hash_password

engine = create_async_engine(settings.database_url, echo=False)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# 고정 UUID (재실행 시 중복 방지)
USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
OWNER_ID = uuid.UUID("00000000-0000-0000-0000-000000000002")
ADMIN_ID = uuid.UUID("00000000-0000-0000-0000-000000000003")
GYM1_ID = uuid.UUID("10000000-0000-0000-0000-000000000001")
GYM2_ID = uuid.UUID("10000000-0000-0000-0000-000000000002")
OUTDOOR1_ID = uuid.UUID("20000000-0000-0000-0000-000000000001")
OUTDOOR2_ID = uuid.UUID("20000000-0000-0000-0000-000000000002")


async def seed(session: AsyncSession) -> None:
    # ── Users ──────────────────────────────────────────
    users = [
        User(
            id=USER_ID,
            email="user@basket.kr",
            hashed_password=hash_password("password123"),
            role="USER",
            display_name="일반 사용자",
            phone="010-1234-5678",
        ),
        User(
            id=OWNER_ID,
            email="owner@basket.kr",
            hashed_password=hash_password("password123"),
            role="OWNER",
            display_name="체육관 운영자",
            phone="010-9999-1111",
        ),
        User(
            id=ADMIN_ID,
            email="admin@basket.kr",
            hashed_password=hash_password("password123"),
            role="ADMIN",
            display_name="관리자",
        ),
    ]
    session.add_all(users)

    # ── Places (GYM) ───────────────────────────────────
    gyms = [
        Place(
            id=GYM1_ID,
            type="GYM",
            name="해운대 농구 체육관",
            district="해운대구",
            address="부산 해운대구 해운대로 123",
            lat=35.1628,
            lng=129.1603,
            short_description="해운대 최고의 농구 전용 체육관. 2코트 운영.",
            is_active=True,
        ),
        Place(
            id=GYM2_ID,
            type="GYM",
            name="서면 스포츠 체육관",
            district="부산진구",
            address="부산 부산진구 서면로 45",
            lat=35.1579,
            lng=129.0597,
            short_description="서면 중심가 위치. 주차 가능, 샤워실 완비.",
            is_active=True,
        ),
    ]
    session.add_all(gyms)

    # ── GymProfiles ────────────────────────────────────
    gym_profiles = [
        GymProfile(
            place_id=GYM1_ID,
            court_count=2,
            hours="09:00 ~ 22:00",
            parking=True,
            amenities=["주차", "샤워실", "음수대"],
            description="해운대 최고의 농구 전용 체육관입니다. 2개 코트, 조명 완비.",
        ),
        GymProfile(
            place_id=GYM2_ID,
            court_count=1,
            hours="10:00 ~ 21:00",
            parking=True,
            amenities=["주차", "샤워실", "대기공간"],
            description="서면 중심가에 위치한 체육관. 교통 편리.",
        ),
    ]
    session.add_all(gym_profiles)

    # ── OwnerGym ───────────────────────────────────────
    owner_gyms = [
        OwnerGym(gym_place_id=GYM1_ID, owner_user_id=OWNER_ID, status="ACTIVE"),
        OwnerGym(gym_place_id=GYM2_ID, owner_user_id=OWNER_ID, status="ACTIVE"),
    ]
    session.add_all(owner_gyms)

    # ── PricingPolicies ────────────────────────────────
    policies = [
        SchedulePricingPolicy(
            gym_place_id=GYM1_ID,
            base_hourly_price=50000,
            weekend_hourly_price=60000,
            discount_person_threshold=5,
            discount_rate_percent=10,
            discount_fixed_amount=0,
            same_day_only=False,
        ),
        SchedulePricingPolicy(
            gym_place_id=GYM2_ID,
            base_hourly_price=40000,
            weekend_hourly_price=50000,
            discount_person_threshold=4,
            discount_rate_percent=15,
            discount_fixed_amount=0,
            same_day_only=False,
        ),
    ]
    session.add_all(policies)

    # ── PaymentMethods ─────────────────────────────────
    payment_methods = [
        GymPaymentMethod(
            gym_place_id=GYM1_ID,
            kakao_pay_link="https://qr.kakaopay.com/example1",
            bank_name="카카오뱅크",
            account_number="3333-01-1234567",
            account_holder="김운영",
            visible_methods=["kakao", "bank"],
        ),
        GymPaymentMethod(
            gym_place_id=GYM2_ID,
            kakao_pay_link=None,
            bank_name="국민은행",
            account_number="123456-78-901234",
            account_holder="이사장",
            visible_methods=["bank"],
        ),
    ]
    session.add_all(payment_methods)

    # ── Gallery assets ─────────────────────────────────
    assets = [
        PlaceAsset(
            place_id=GYM1_ID,
            type="GALLERY",
            url="https://placehold.co/800x500?text=Gym1+Court1",
            sort_order=0,
        ),
        PlaceAsset(
            place_id=GYM1_ID,
            type="GALLERY",
            url="https://placehold.co/800x500?text=Gym1+Court2",
            sort_order=1,
        ),
        PlaceAsset(
            place_id=GYM2_ID,
            type="GALLERY",
            url="https://placehold.co/800x500?text=Gym2+Court",
            sort_order=0,
        ),
    ]

    # ── Outdoor Places ─────────────────────────────────
    outdoors = [
        Place(
            id=OUTDOOR1_ID,
            type="OUTDOOR",
            name="해운대 야외 농구장",
            district="해운대구",
            address="부산 해운대구 해운대해변로 264",
            lat=35.1584,
            lng=129.1599,
            short_description="해변 근처 무료 야외 농구장. 조명 있음.",
            is_active=True,
        ),
        Place(
            id=OUTDOOR2_ID,
            type="OUTDOOR",
            name="광안리 농구장",
            district="수영구",
            address="부산 수영구 광안해변로 219",
            lat=35.1530,
            lng=129.1182,
            short_description="광안리 해변 근처 야외 농구장.",
            is_active=True,
        ),
    ]
    session.add_all(outdoors)

    outdoor_profiles = [
        OutdoorProfile(
            place_id=OUTDOOR1_ID,
            fee_type="무료",
            floor_status="양호",
            light_status="있음",
            rim_status="양호",
            cleanliness="청결",
            crowd_level="보통",
            description="해운대 해변 근처에 위치한 야외 농구장입니다.",
        ),
        OutdoorProfile(
            place_id=OUTDOOR2_ID,
            fee_type="무료",
            floor_status="보통",
            light_status="없음",
            rim_status="양호",
            cleanliness="보통",
            crowd_level="혼잡",
            description="광안리 해변 가까이 위치한 인기 야외 농구장입니다.",
        ),
    ]
    session.add_all(outdoor_profiles)

    outdoor_assets = [
        PlaceAsset(
            place_id=OUTDOOR1_ID,
            type="GALLERY",
            url="https://placehold.co/800x500?text=Outdoor1",
            sort_order=0,
        ),
        PlaceAsset(
            place_id=OUTDOOR2_ID,
            type="GALLERY",
            url="https://placehold.co/800x500?text=Outdoor2",
            sort_order=0,
        ),
    ]
    session.add_all(assets + outdoor_assets)

    # ── Reviews ────────────────────────────────────────
    reviews = [
        OutdoorReview(
            place_id=OUTDOOR1_ID,
            user_id=USER_ID,
            nickname="농구짱",
            rating=4.5,
            tags=["바닥양호", "조명있음"],
            content="해변 옆이라 분위기 좋아요. 바닥 상태도 괜찮습니다.",
            visited_at=date.today() - timedelta(days=3),
            status="VISIBLE",
        ),
        OutdoorReview(
            place_id=OUTDOOR1_ID,
            user_id=None,
            nickname="부산농구인",
            rating=4.0,
            tags=["청결"],
            content="전반적으로 좋은 농구장입니다.",
            visited_at=date.today() - timedelta(days=7),
            status="VISIBLE",
        ),
        OutdoorReview(
            place_id=OUTDOOR2_ID,
            user_id=USER_ID,
            nickname="수영구사는사람",
            rating=3.5,
            tags=["혼잡", "조명없음"],
            content="주말에는 많이 붐빕니다. 조명이 없어서 저녁엔 못 써요.",
            visited_at=date.today() - timedelta(days=5),
            status="VISIBLE",
        ),
    ]
    session.add_all(reviews)

    # ── Slots (GYM1, 오늘 ~ +7일) ──────────────────────
    today = date.today()
    slots = []
    for day_offset in range(8):
        slot_date = today + timedelta(days=day_offset)
        is_weekend = slot_date.weekday() >= 5
        for hour in range(9, 22):
            # 11~12시는 수업, 14~15시는 정기대관
            if hour == 11:
                status = "CLASS"
                price = None
            elif hour == 14:
                status = "REGULAR"
                price = None
            else:
                status = "AVAILABLE"
                price = 60000 if is_weekend else 50000
            slots.append(
                Slot(
                    gym_place_id=GYM1_ID,
                    date=slot_date,
                    start_time=time(hour, 0),
                    end_time=time(hour + 1, 0),
                    status=status,
                    price=price,
                )
            )
    # GYM2 슬롯 (오늘 ~ +7일)
    for day_offset in range(8):
        slot_date = today + timedelta(days=day_offset)
        is_weekend = slot_date.weekday() >= 5
        for hour in range(10, 21):
            if hour == 13:
                status = "CLASS"
                price = None
            else:
                status = "AVAILABLE"
                price = 50000 if is_weekend else 40000
            slots.append(
                Slot(
                    gym_place_id=GYM2_ID,
                    date=slot_date,
                    start_time=time(hour, 0),
                    end_time=time(hour + 1, 0),
                    status=status,
                    price=price,
                )
            )
    session.add_all(slots)

    # ── Sample reservation (GYM1 today 18:00) ──────────
    await session.flush()  # get slot IDs

    sample_slot = next(
        (s for s in slots if s.gym_place_id == GYM1_ID and s.date == today and s.start_time == time(18, 0)),
        None,
    )
    if sample_slot:
        res_id = uuid.uuid4()
        reservation = Reservation(
            id=res_id,
            gym_place_id=GYM1_ID,
            slot_id=sample_slot.id,
            user_id=USER_ID,
            date=today,
            start_time=time(18, 0),
            end_time=time(19, 0),
            time_label="18:00 ~ 19:00",
            team_name="부산 발전팀",
            booker_name="홍길동",
            phone="010-1234-5678",
            headcount=4,
            base_price=50000,
            discount_applied=True,
            discount_amount=5000,
            final_price=45000,
            status="AWAITING_TRANSFER",
        )
        session.add(reservation)

        timelines = [
            ReservationStatusTimeline(
                reservation_id=res_id,
                key="requested",
                label="예약 신청됨",
                done_at=None,
            ),
            ReservationStatusTimeline(
                reservation_id=res_id,
                key="waiting",
                label="송금 대기",
                done_at=None,
            ),
        ]
        session.add_all(timelines)

    await session.commit()
    print("Seed complete!")
    print(f"  Users: user@basket.kr / owner@basket.kr / admin@basket.kr (password: password123)")
    print(f"  Gyms: {GYM1_ID} / {GYM2_ID}")
    print(f"  Outdoors: {OUTDOOR1_ID} / {OUTDOOR2_ID}")


async def main() -> None:
    async with SessionLocal() as session:
        await seed(session)


if __name__ == "__main__":
    asyncio.run(main())
