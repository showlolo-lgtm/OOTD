from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.outfit import Outfit, OutfitItem
from app.models.profile import UserProfile
from app.schemas.outfit import OutfitResponse, TryOnRequest
from app.services.tryon_service import generate_tryon

router = APIRouter(prefix="/api/tryon", tags=["tryon"])


@router.post("", response_model=OutfitResponse)
async def create_tryon(
    request: TryOnRequest,
    db: AsyncSession = Depends(get_db),
):
    # Get user profile (need body photo)
    profile_result = await db.execute(select(UserProfile).where(UserProfile.id == 1))
    profile = profile_result.scalar_one_or_none()

    if not profile or not profile.body_photo_path:
        raise HTTPException(
            status_code=400,
            detail="Please upload a body photo in your profile first.",
        )

    # Get outfit with items
    outfit_result = await db.execute(
        select(Outfit)
        .where(Outfit.id == request.outfit_id)
        .options(selectinload(Outfit.items).selectinload(OutfitItem.clothing_item))
    )
    outfit = outfit_result.scalar_one_or_none()
    if not outfit:
        raise HTTPException(status_code=404, detail="Outfit not found")

    # Find the primary garment (prefer top/dress, then outerwear)
    primary_item = None
    priority_categories = ["dress", "top", "outerwear", "bottom"]
    for cat in priority_categories:
        for outfit_item in outfit.items:
            if outfit_item.clothing_item.category == cat:
                primary_item = outfit_item.clothing_item
                break
        if primary_item:
            break

    if not primary_item:
        # Use the first item if no category match
        if outfit.items:
            primary_item = outfit.items[0].clothing_item
        else:
            raise HTTPException(status_code=400, detail="Outfit has no items")

    # Generate try-on
    result_path = await generate_tryon(
        person_image_path=profile.body_photo_path,
        garment_image_path=primary_item.image_path,
        category=primary_item.category or "top",
    )

    if not result_path:
        raise HTTPException(
            status_code=500,
            detail="Virtual try-on failed. Please check your Replicate API token or try again.",
        )

    outfit.tryon_image_path = result_path
    await db.commit()
    await db.refresh(outfit)

    # Reload with relationships
    outfit_result = await db.execute(
        select(Outfit)
        .where(Outfit.id == outfit.id)
        .options(selectinload(Outfit.items).selectinload(OutfitItem.clothing_item))
    )
    return outfit_result.scalar_one()
