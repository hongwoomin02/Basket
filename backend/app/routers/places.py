"""장소 목록/홈 맵 API — Sprint 1"""
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.place import Place
from app.schemas.common import Response

router = APIRouter(prefix="/places", tags=["places"])


@router.get("")
async def list_places(
    db: Annotated[AsyncSession, Depends(get_db)],
    district: str | None = Query(None),
    place_type: str | None = Query(None, alias="placeType"),
    q: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    GET /places
    홈 화면 + 체육관 목록 필터 공용 엔드포인트
    """
    conditions = [Place.is_active.is_(True)]
    if district:
        conditions.append(Place.district == district)
    if place_type:
        conditions.append(Place.type == place_type.upper())
    if q:
        conditions.append(Place.name.ilike(f"%{q}%"))

    result = await db.execute(
        select(Place).where(and_(*conditions)).limit(limit).offset(offset)
    )
    places = result.scalars().all()

    data = [
        {
            "id": str(p.id),
            "type": p.type,
            "name": p.name,
            "district": p.district,
            "address": p.address,
            "shortDescription": p.short_description,
            "lat": p.lat,
            "lng": p.lng,
        }
        for p in places
    ]
    return Response(data=data)


@router.get("/home-map-summary")
async def home_map_summary(db: Annotated[AsyncSession, Depends(get_db)]):
    """
    GET /places/home-map-summary
    홈 지도 프리뷰용 요약 (핀 목록)
    """
    result = await db.execute(
        select(Place.id, Place.type, Place.lat, Place.lng, Place.name)
        .where(Place.is_active.is_(True))
    )
    rows = result.all()
    pins = [
        {"placeId": str(r.id), "kind": r.type, "lat": r.lat, "lng": r.lng, "name": r.name}
        for r in rows
        if r.lat and r.lng
    ]
    return Response(
        data={
            "centerLabel": "부산",
            "markerCount": len(pins),
            "legend": [
                {"type": "GYM", "label": "실내 체육관"},
                {"type": "OUTDOOR", "label": "야외 농구장"},
            ],
            "pins": pins,
        }
    )
