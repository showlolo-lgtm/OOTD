from fastapi import APIRouter, HTTPException

from app.services.weather_service import get_weather as fetch_weather

router = APIRouter(prefix="/api/weather", tags=["weather"])


@router.get("")
async def get_weather(city: str):
    if not city:
        raise HTTPException(status_code=400, detail="City parameter is required")

    weather = await fetch_weather(city)
    if not weather:
        raise HTTPException(
            status_code=503,
            detail="Weather service unavailable. Check your API key or try again.",
        )
    return weather
