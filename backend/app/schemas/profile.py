from datetime import datetime

from pydantic import BaseModel


class ProfileUpdate(BaseModel):
    height_cm: float | None = None
    weight_kg: float | None = None
    body_type: str | None = None
    style_preferences: list[str] | None = None
    location: str | None = None


class ProfileResponse(BaseModel):
    id: int
    body_photo_path: str | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    body_type: str | None = None
    style_preferences: list[str] | None = None
    location: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
