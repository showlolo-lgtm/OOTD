from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.clothing import ClothingItem
from app.schemas.clothing import ClothingItemResponse, ClothingItemUpdate
from app.services.clothing_classifier import classify_clothing
from app.services.image_service import delete_image, save_upload

router = APIRouter(prefix="/api/wardrobe", tags=["wardrobe"])


@router.get("", response_model=list[ClothingItemResponse])
async def list_wardrobe(
    category: str | None = None,
    season: str | None = None,
    occasion: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(ClothingItem).order_by(ClothingItem.created_at.desc())

    if category:
        query = query.where(ClothingItem.category == category)

    result = await db.execute(query)
    items = result.scalars().all()

    # Filter by season/occasion in Python since JSON filtering varies by DB
    if season:
        items = [i for i in items if i.seasons and season in i.seasons]
    if occasion:
        items = [i for i in items if i.occasions and occasion in i.occasions]

    return items


@router.post("", response_model=ClothingItemResponse)
async def add_clothing(
    file: UploadFile = File(...),
    category: str | None = Form(None),
    name: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
):
    image_path = await save_upload(file, "clothing")

    # AI classification
    classification = await classify_clothing(image_path)

    item = ClothingItem(
        image_path=image_path,
        category=category or classification["category"],
        subcategory=classification["subcategory"],
        color_primary=classification["color_primary"],
        color_secondary=classification["color_secondary"],
        pattern=classification["pattern"],
        seasons=classification["seasons"],
        occasions=classification["occasions"],
        warmth_level=classification["warmth_level"],
        name=name or classification["name"],
        ai_description=classification["description"],
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.get("/{item_id}", response_model=ClothingItemResponse)
async def get_clothing(item_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ClothingItem).where(ClothingItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Clothing item not found")
    return item


@router.patch("/{item_id}", response_model=ClothingItemResponse)
async def update_clothing(
    item_id: int,
    update: ClothingItemUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ClothingItem).where(ClothingItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Clothing item not found")

    update_data = update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/{item_id}")
async def delete_clothing(item_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ClothingItem).where(ClothingItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Clothing item not found")

    delete_image(item.image_path)
    await db.delete(item)
    await db.commit()
    return {"detail": "Deleted"}
