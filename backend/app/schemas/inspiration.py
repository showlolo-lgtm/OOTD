from datetime import datetime

from pydantic import BaseModel


class InspirationCreate(BaseModel):
    source_url: str | None = None
    source_platform: str | None = None


class InspirationResponse(BaseModel):
    id: int
    image_path: str
    source_url: str | None = None
    source_platform: str | None = None
    ai_analysis: dict | None = None
    tags: list[str] | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
