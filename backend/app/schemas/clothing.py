from datetime import datetime

from pydantic import BaseModel


class ClothingItemCreate(BaseModel):
    category: str | None = None
    subcategory: str | None = None
    color_primary: str | None = None
    color_secondary: str | None = None
    pattern: str | None = None
    seasons: list[str] | None = None
    occasions: list[str] | None = None
    warmth_level: int | None = None
    name: str | None = None
    brand: str | None = None


class ClothingItemUpdate(BaseModel):
    category: str | None = None
    subcategory: str | None = None
    color_primary: str | None = None
    color_secondary: str | None = None
    pattern: str | None = None
    seasons: list[str] | None = None
    occasions: list[str] | None = None
    warmth_level: int | None = None
    name: str | None = None
    ai_description: str | None = None
    brand: str | None = None
    is_favorite: bool | None = None


class ClothingItemResponse(BaseModel):
    id: int
    image_path: str
    category: str | None = None
    subcategory: str | None = None
    color_primary: str | None = None
    color_secondary: str | None = None
    pattern: str | None = None
    seasons: list[str] | None = None
    occasions: list[str] | None = None
    warmth_level: int | None = None
    name: str | None = None
    ai_description: str | None = None
    brand: str | None = None
    is_favorite: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}
