from datetime import datetime

from pydantic import BaseModel

from app.schemas.clothing import ClothingItemResponse


class OutfitItemResponse(BaseModel):
    id: int
    clothing_item_id: int
    layer_order: int
    clothing_item: ClothingItemResponse

    model_config = {"from_attributes": True}


class OutfitResponse(BaseModel):
    id: int
    name: str
    occasion: str | None = None
    source: str
    tryon_image_path: str | None = None
    weather_data: dict | None = None
    rating: int | None = None
    created_at: datetime
    items: list[OutfitItemResponse] = []

    model_config = {"from_attributes": True}


class OutfitCreate(BaseModel):
    name: str
    occasion: str | None = None
    clothing_item_ids: list[int]


class RecommendationRequest(BaseModel):
    occasion: str
    location: str | None = None


class TryOnRequest(BaseModel):
    outfit_id: int


class RatingRequest(BaseModel):
    rating: int
