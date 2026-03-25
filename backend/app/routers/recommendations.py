from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.clothing import ClothingItem
from app.models.inspiration import StyleInspiration
from app.models.outfit import Outfit, OutfitItem
from app.models.profile import UserProfile
from app.schemas.outfit import OutfitResponse, RatingRequest, RecommendationRequest
from app.services.recommendation_engine import generate_recommendations
from app.services.weather_service import get_weather

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.post("/generate", response_model=list[OutfitResponse])
async def generate_outfit_recommendations(
    request: RecommendationRequest,
    db: AsyncSession = Depends(get_db),
):
    # Get user profile for location
    profile_result = await db.execute(select(UserProfile).where(UserProfile.id == 1))
    profile = profile_result.scalar_one_or_none()

    location = request.location or (profile.location if profile else None)

    # Get weather
    weather = None
    if location:
        weather = await get_weather(location)

    # Get wardrobe items
    wardrobe_result = await db.execute(select(ClothingItem))
    wardrobe_items = wardrobe_result.scalars().all()

    if not wardrobe_items:
        raise HTTPException(
            status_code=400,
            detail="Your wardrobe is empty. Add some clothes first!",
        )

    # Get inspiration tags
    inspo_result = await db.execute(select(StyleInspiration))
    inspirations = inspo_result.scalars().all()
    all_tags = []
    for inspo in inspirations:
        if inspo.tags:
            all_tags.extend(inspo.tags)
    unique_tags = list(set(all_tags))

    # Generate recommendations
    recommendations = await generate_recommendations(
        occasion=request.occasion,
        weather=weather,
        wardrobe_items=list(wardrobe_items),
        inspiration_tags=unique_tags if unique_tags else None,
    )

    if not recommendations:
        raise HTTPException(
            status_code=500,
            detail="Could not generate recommendations. Please check your API key or try again.",
        )

    # Create outfit records
    created_outfits = []
    for rec in recommendations:
        outfit = Outfit(
            name=rec["name"],
            occasion=request.occasion,
            source="ai_recommended",
            weather_data=weather,
        )
        db.add(outfit)
        await db.flush()

        for order, item_id in enumerate(rec["item_ids"]):
            outfit_item = OutfitItem(
                outfit_id=outfit.id,
                clothing_item_id=item_id,
                layer_order=order,
            )
            db.add(outfit_item)

        created_outfits.append(outfit)

    await db.commit()

    # Reload with relationships
    result_outfits = []
    for outfit in created_outfits:
        loaded = await db.execute(
            select(Outfit)
            .where(Outfit.id == outfit.id)
            .options(selectinload(Outfit.items).selectinload(OutfitItem.clothing_item))
        )
        result_outfits.append(loaded.scalar_one())

    return result_outfits


@router.get("/today", response_model=list[OutfitResponse])
async def get_today_recommendations(db: AsyncSession = Depends(get_db)):
    today = date.today()
    result = await db.execute(
        select(Outfit)
        .where(
            Outfit.source == "ai_recommended",
            Outfit.created_at >= today.isoformat(),
        )
        .options(selectinload(Outfit.items).selectinload(OutfitItem.clothing_item))
        .order_by(Outfit.created_at.desc())
    )
    return result.scalars().all()


@router.post("/{outfit_id}/rate", response_model=OutfitResponse)
async def rate_recommendation(
    outfit_id: int,
    request: RatingRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Outfit)
        .where(Outfit.id == outfit_id)
        .options(selectinload(Outfit.items).selectinload(OutfitItem.clothing_item))
    )
    outfit = result.scalar_one_or_none()
    if not outfit:
        raise HTTPException(status_code=404, detail="Outfit not found")

    outfit.rating = max(1, min(5, request.rating))
    await db.commit()
    await db.refresh(outfit)
    return outfit
