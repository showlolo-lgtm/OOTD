import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


async def get_weather(city: str) -> dict | None:
    if not settings.OPENWEATHERMAP_API_KEY:
        logger.warning("OPENWEATHERMAP_API_KEY not set")
        return None

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params={
                    "q": city,
                    "appid": settings.OPENWEATHERMAP_API_KEY,
                    "units": "metric",
                },
                timeout=10.0,
            )
            response.raise_for_status()
            data = response.json()

            return {
                "temp_celsius": round(data["main"]["temp"]),
                "feels_like": round(data["main"]["feels_like"]),
                "description": data["weather"][0]["description"],
                "icon": data["weather"][0]["icon"],
                "humidity": data["main"]["humidity"],
                "wind_speed": round(data["wind"]["speed"], 1),
                "city": data["name"],
            }
    except Exception as e:
        logger.error(f"Weather API error: {e}")
        return None
