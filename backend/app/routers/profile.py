from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.profile import UserProfile
from app.schemas.profile import ProfileResponse, ProfileUpdate
from app.services.image_service import save_upload

router = APIRouter(prefix="/api/profile", tags=["profile"])


async def _get_or_create_profile(db: AsyncSession) -> UserProfile:
    result = await db.execute(select(UserProfile).where(UserProfile.id == 1))
    profile = result.scalar_one_or_none()
    if not profile:
        profile = UserProfile(id=1)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
    return profile


@router.get("", response_model=ProfileResponse)
async def get_profile(db: AsyncSession = Depends(get_db)):
    return await _get_or_create_profile(db)


@router.put("", response_model=ProfileResponse)
async def update_profile(
    update: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
):
    profile = await _get_or_create_profile(db)
    update_data = update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    await db.commit()
    await db.refresh(profile)
    return profile


@router.post("/photo", response_model=ProfileResponse)
async def upload_body_photo(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    profile = await _get_or_create_profile(db)
    image_path = await save_upload(file, "profiles")
    profile.body_photo_path = image_path
    await db.commit()
    await db.refresh(profile)
    return profile
