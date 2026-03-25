import json
import logging

import anthropic

from app.config import settings

logger = logging.getLogger(__name__)


def _warmth_range_for_temp(temp_celsius: int) -> tuple[int, int]:
    if temp_celsius < 0:
        return (4, 5)
    elif temp_celsius < 10:
        return (3, 5)
    elif temp_celsius < 20:
        return (2, 4)
    elif temp_celsius < 30:
        return (1, 2)
    else:
        return (1, 1)


def _current_season_from_temp(temp_celsius: int) -> str:
    if temp_celsius < 5:
        return "winter"
    elif temp_celsius < 15:
        return "fall"
    elif temp_celsius < 25:
        return "spring"
    else:
        return "summer"


async def generate_recommendations(
    occasion: str,
    weather: dict | None,
    wardrobe_items: list,
    inspiration_tags: list[str] | None = None,
) -> list[dict]:
    if not settings.ANTHROPIC_API_KEY:
        logger.warning("ANTHROPIC_API_KEY not set, returning empty recommendations")
        return []

    if not wardrobe_items:
        return []

    # Build wardrobe description
    items_desc = []
    for item in wardrobe_items:
        desc = (
            f"ID:{item.id} | {item.category}/{item.subcategory or 'unknown'} | "
            f"Color: {item.color_primary or 'unknown'} | "
            f"Pattern: {item.pattern or 'unknown'} | "
            f"Warmth: {item.warmth_level or 3}/5 | "
            f"Name: {item.name or 'unnamed'}"
        )
        items_desc.append(desc)

    wardrobe_text = "\n".join(items_desc)

    # Weather context
    weather_text = "Weather unknown"
    if weather:
        weather_text = (
            f"Temperature: {weather['temp_celsius']}°C (feels like {weather['feels_like']}°C), "
            f"Conditions: {weather['description']}, "
            f"Humidity: {weather['humidity']}%, Wind: {weather['wind_speed']} m/s"
        )

    # Style inspiration context
    inspo_text = ""
    if inspiration_tags:
        inspo_text = f"\nUser's style preferences/inspirations include: {', '.join(inspiration_tags)}"

    prompt = f"""You are a personal fashion stylist. Based on the user's wardrobe, weather, and occasion, suggest 1-3 complete outfit combinations.

WARDROBE ITEMS:
{wardrobe_text}

WEATHER: {weather_text}
OCCASION: {occasion}
{inspo_text}

Rules:
1. Each outfit MUST include at least a top (or dress) and bottom (unless dress) and shoes
2. Add outerwear if weather requires it (below 15°C)
3. Consider color coordination and style coherence
4. Match warmth levels to the temperature
5. Each outfit should have a creative, descriptive name

Return a JSON array of 1-3 outfits. Each outfit should have:
- "name": a creative outfit name
- "item_ids": array of clothing item IDs (integers) from the wardrobe
- "styling_notes": one sentence about why this outfit works

Return ONLY valid JSON array, no other text."""

    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
        )

        response_text = message.content[0].text.strip()
        if "```" in response_text:
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
            response_text = response_text.strip()

        outfits = json.loads(response_text)

        if not isinstance(outfits, list):
            outfits = [outfits]

        # Validate item IDs exist in wardrobe
        valid_ids = {item.id for item in wardrobe_items}
        validated = []
        for outfit in outfits[:3]:
            item_ids = [id for id in outfit.get("item_ids", []) if id in valid_ids]
            if item_ids:
                validated.append({
                    "name": outfit.get("name", "Outfit"),
                    "item_ids": item_ids,
                    "styling_notes": outfit.get("styling_notes", ""),
                })

        return validated

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse recommendation response: {e}")
        return []
    except Exception as e:
        logger.error(f"Recommendation generation failed: {e}")
        return []
