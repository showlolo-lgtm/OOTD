from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.clothing import ClothingItem
from app.models.outfit import Outfit, OutfitItem
from app.schemas.outfit import OutfitCreate, OutfitResponse

router = APIRouter(prefix="/api/outfits", tags=["outfits"])


@router.get("", response_model=list[OutfitResponse])
async def list_outfits(
    source: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Outfit)
        .options(selectinload(Outfit.items).selectinload(OutfitItem.clothing_item))
        .order_by(Outfit.created_at.desc())
    )
    if source:
        query = query.where(Outfit.source == source)

    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=OutfitResponse)
async def create_outfit(
    data: OutfitCreate,
    db: AsyncSession = Depends(get_db),
):
    # Validate clothing items exist
    for item_id in data.clothing_item_ids:
        result = await db.execute(
            select(ClothingItem).where(ClothingItem.id == item_id)
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=400, detail=f"Clothing item {item_id} not found"
            )

    outfit = Outfit(
        name=data.name,
        occasion=data.occasion,
        source="user_created",
    )
    db.add(outfit)
    await db.flush()

    for order, item_id in enumerate(data.clothing_item_ids):
        outfit_item = OutfitItem(
            outfit_id=outfit.id,
            clothing_item_id=item_id,
            layer_order=order,
        )
        db.add(outfit_item)

    await db.commit()

    # Reload with relationships
    result = await db.execute(
        select(Outfit)
        .where(Outfit.id == outfit.id)
        .options(selectinload(Outfit.items).selectinload(OutfitItem.clothing_item))
    )
    return result.scalar_one()


@router.get("/{outfit_id}", response_model=OutfitResponse)
async def get_outfit(outfit_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Outfit)
        .where(Outfit.id == outfit_id)
        .options(selectinload(Outfit.items).selectinload(OutfitItem.clothing_item))
    )
    outfit = result.scalar_one_or_none()
    if not outfit:
        raise HTTPException(status_code=404, detail="Outfit not found")
    return outfit


@router.delete("/{outfit_id}")
async def delete_outfit(outfit_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Outfit).where(Outfit.id == outfit_id))
    outfit = result.scalar_one_or_none()
    if not outfit:
        raise HTTPException(status_code=404, detail="Outfit not found")

    await db.delete(outfit)
    await db.commit()
    return {"detail": "Deleted"}
