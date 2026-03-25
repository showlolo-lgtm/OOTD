from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Outfit(Base):
    __tablename__ = "outfits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    occasion: Mapped[str | None] = mapped_column(String(50), nullable=True)
    source: Mapped[str] = mapped_column(String(20), default="user_created")
    tryon_image_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    weather_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    items: Mapped[list["OutfitItem"]] = relationship(
        "OutfitItem", back_populates="outfit", cascade="all, delete-orphan"
    )


class OutfitItem(Base):
    __tablename__ = "outfit_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    outfit_id: Mapped[int] = mapped_column(Integer, ForeignKey("outfits.id", ondelete="CASCADE"))
    clothing_item_id: Mapped[int] = mapped_column(Integer, ForeignKey("clothing_items.id", ondelete="CASCADE"))
    layer_order: Mapped[int] = mapped_column(Integer, default=0)

    outfit: Mapped["Outfit"] = relationship("Outfit", back_populates="items")
    clothing_item: Mapped["ClothingItem"] = relationship("ClothingItem", lazy="joined")
