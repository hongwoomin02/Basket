"""Admin 리뷰 검수 API"""
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import require_role
from app.models.place import Place, PlaceAsset
from app.models.review import OutdoorReview, ReviewModerationAudit, ReviewPhoto
from app.models.user import User
from app.schemas.common import Response

admin_required = require_role("ADMIN", "OPS")

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/reviews")
async def list_reviews(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(admin_required)],
    status: str | None = Query(None),
):
    conditions = []
    if status:
        conditions.append(OutdoorReview.status == status)

    from sqlalchemy import and_
    result = await db.execute(
        select(OutdoorReview).where(and_(*conditions) if conditions else True)
        .order_by(OutdoorReview.created_at.desc())
    )
    reviews = result.scalars().all()

    rows = []
    for r in reviews:
        place = await db.get(Place, r.place_id)
        photo_count = (await db.execute(
            select(ReviewPhoto).where(ReviewPhoto.review_id == r.id)
        )).scalars().all()
        rows.append({
            "id": str(r.id),
            "placeName": place.name if place else "",
            "nickname": r.nickname,
            "rating": float(r.rating),
            "tags": r.tags or [],
            "content": r.content,
            "hasPhoto": len(photo_count) > 0,
            "status": r.status,
            "createdAt": r.created_at.isoformat(),
        })
    return Response(data={"reviewRows": rows})


@router.get("/reviews/{review_id}/photos")
async def get_review_photos(
    review_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(admin_required)],
):
    photos_result = await db.execute(
        select(ReviewPhoto).where(ReviewPhoto.review_id == review_id).order_by(ReviewPhoto.sort_order)
    )
    photos = photos_result.scalars().all()
    photo_list = []
    for p in photos:
        asset = await db.get(PlaceAsset, p.asset_id)
        if asset:
            photo_list.append({"id": str(p.id), "url": asset.url})
    return Response(data={"photos": photo_list})


async def _moderate_review(
    review_id: uuid.UUID,
    action: str,
    new_status: str,
    admin_user_id: uuid.UUID,
    db: AsyncSession,
):
    review = await db.get(OutdoorReview, review_id)
    if not review:
        raise HTTPException(404, {"code": "NOT_FOUND", "message": "리뷰를 찾을 수 없습니다."})
    review.status = new_status
    db.add(ReviewModerationAudit(
        review_id=review_id,
        admin_user_id=admin_user_id,
        action=action,
        done_at=datetime.now(timezone.utc),
    ))
    await db.flush()
    return Response(data={"reviewId": str(review.id), "status": review.status})


@router.post("/reviews/{review_id}/hide")
async def hide_review(
    review_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(admin_required)],
):
    return await _moderate_review(review_id, "HIDE", "HIDDEN", current_user.id, db)


@router.post("/reviews/{review_id}/restore")
async def restore_review(
    review_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(admin_required)],
):
    return await _moderate_review(review_id, "RESTORE", "VISIBLE", current_user.id, db)
