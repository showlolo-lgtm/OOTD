import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine
from app.routers import inspirations, outfits, profile, recommendations, tryon, wardrobe, weather
from app.services.image_service import ensure_upload_dirs

app = FastAPI(
    title="OOTD - AI Outfit Recommendation",
    description="Your AI-powered personal stylist",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(wardrobe.router)
app.include_router(profile.router)
app.include_router(inspirations.router)
app.include_router(recommendations.router)
app.include_router(outfits.router)
app.include_router(tryon.router)
app.include_router(weather.router)


@app.on_event("startup")
async def startup():
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Create upload directories
    ensure_upload_dirs()


# Mount uploads as static files
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/api/health")
async def health():
    return {"status": "ok", "message": "OOTD API is running"}
