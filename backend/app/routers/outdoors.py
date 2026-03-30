"""야외 농구장 상세/리뷰 API — Sprint 1"""
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_optional_user
from app.models.place import OutdoorProfile, Place, PlaceAsset
from app.models.review import OutdoorReview
from app.models.user import User
from app.schemas.common import Response

router = APIRouter(prefix="/outdoors", tags=["outdoors"])


@router.get("/{place_id}")
async def get_outdoor_detail(place_id: uuid.UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    place = await db.get(Place, place_id)
    if not place or place.type != "OUTDOOR":
        raise HTTPException(404, {"code": "NOT_FOUND", "message": "야외 농구장을 찾을 수 없습니다."})
    profile = await db.get(OutdoorProfile, place_id)
    return Response(
        data={
            "place": {"id": str(place.id), "name": place.name, "address": place.address, "district": place.district},
            "outdoorProfile": {
                "feeType": profile.fee_type if profile else None,
                "floorStatus": profile.floor_status if profile else None,
                "lightStatus": profile.light_status if profile else None,
                "rimStatus": profile.rim_status if profile else None,
                "cleanliness": profile.cleanliness if profile else None,
                "crowdLevel": profile.crowd_level if profile else None,
                "description": profile.description if profile else None,
            },
        }
    )


@router.get("/{place_id}/gallery")
async def get_outdoor_gallery(place_id: uuid.UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(
        select(PlaceAsset)
        .where(PlaceAsset.place_id == place_id, PlaceAsset.type == "GALLERY")
        .order_by(PlaceAsset.sort_order)
    )
    assets = result.scalars().all()
    return Response(data={"gallery": [{"id": str(a.id), "url": a.url} for a in assets]})


@router.get("/{place_id}/review-summary")
async def get_review_summary(place_id: uuid.UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(
        select(func.avg(OutdoorReview.rating), func.count(OutdoorReview.id))
        .where(OutdoorReview.place_id == place_id, OutdoorReview.status == "VISIBLE")
    )
    avg_rating, count = result.one()
    return Response(
        data={
            "averageRating": round(float(avg_rating or 0), 1),
            "reviewCount": count,
            "tagSummary": [],  # TODO: tags ARRAY 집계
        }
    )


@router.get("/{place_id}/reviews")
async def list_reviews(
    place_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    sort: str = Query("latest"),
):
    result = await db.execute(
        select(OutdoorReview)
        .where(OutdoorReview.place_id == place_id, OutdoorReview.status == "VISIBLE")
        .order_by(OutdoorReview.created_at.desc())
    )
    reviews = result.scalars().all()
    return Response(
        data={
            "reviews": [
                {
                    "id": str(r.id),
                    "nickname": r.nickname,
                    "rating": float(r.rating),
                    "tags": [],  # TODO: ARRAY 필드
                    "content": r.content,
                    "visitedAt": r.visited_at.isoformat() if r.visited_at else None,
                    "photos": [],
                }
                for r in reviews
            ]
        }
    )


@router.get("/{place_id}/review-form-metadata")
async def review_form_metadata(place_id: uuid.UUID):
    return Response(
        data={
            "availableTags": ["바닥 상태 좋음", "조명 밝음", "골대 양호", "청결함", "한적함", "혼잡함"],
            "photoLimit": 3,
        }
    )


@router.post("/{place_id}/reviews", status_code=201)
async def create_review(
    place_id: uuid.UUID,
    body: dict,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User | None, Depends(get_optional_user)],
):
    review = OutdoorReview(
        place_id=place_id,
        user_id=current_user.id if current_user else None,
        nickname=body.get("nickname", current_user.display_name if current_user else "익명"),
        rating=body["rating"],
        content=body.get("text"),
        status="PENDING",
    )
    db.add(review)
    await db.flush()
    return Response(
        data={
            "id": str(review.id),
            "nickname": review.nickname,
            "rating": float(review.rating),
            "content": review.content,
            "status": review.status,
        }
    )
