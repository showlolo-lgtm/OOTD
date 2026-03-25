from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.inspiration import StyleInspiration
from app.schemas.inspiration import InspirationResponse
from app.services.image_service import delete_image, save_upload
from app.services.inspiration_analyzer import analyze_inspiration

router = APIRouter(prefix="/api/inspirations", tags=["inspirations"])


@router.get("", response_model=list[InspirationResponse])
async def list_inspirations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(StyleInspiration).order_by(StyleInspiration.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=InspirationResponse)
async def add_inspiration(
    file: UploadFile = File(...),
    source_url: str | None = Form(None),
    source_platform: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
):
    image_path = await save_upload(file, "inspirations")

    # AI analysis
    analysis = await analyze_inspiration(image_path)

    tags = []
    if analysis:
        tags = analysis.get("style_tags", [])

    inspiration = StyleInspiration(
        image_path=image_path,
        source_url=source_url,
        source_platform=source_platform,
        ai_analysis=analysis,
        tags=tags,
    )
    db.add(inspiration)
    await db.commit()
    await db.refresh(inspiration)
    return inspiration


@router.delete("/{inspiration_id}")
async def delete_inspiration(
    inspiration_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StyleInspiration).where(StyleInspiration.id == inspiration_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Inspiration not found")

    delete_image(item.image_path)
    await db.delete(item)
    await db.commit()
    return {"detail": "Deleted"}
