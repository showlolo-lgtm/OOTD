import json
import logging

import anthropic

from app.config import settings
from app.services.image_service import get_image_base64, get_image_media_type

logger = logging.getLogger(__name__)

CLASSIFICATION_PROMPT = """You are a fashion expert. Analyze this clothing item image and return a JSON object with these fields:
- category: one of ["top", "bottom", "dress", "outerwear", "shoes", "accessory"]
- subcategory: specific type (e.g., "crew-neck t-shirt", "slim jeans", "ankle boots", "crossbody bag")
- color_primary: main color name (e.g., "navy blue", "black", "cream")
- color_secondary: secondary color or null if solid
- pattern: one of ["solid", "striped", "plaid", "floral", "graphic", "abstract", "animal", "other"]
- seasons: array from ["spring", "summer", "fall", "winter"] indicating when this item is suitable
- occasions: array from ["casual", "work", "formal", "sport", "date", "holiday", "party"]
- warmth_level: integer 1 (very light, e.g. tank top) to 5 (very warm, e.g. puffer jacket)
- name: short descriptive name for this item (e.g., "Navy Striped Oxford Shirt")
- description: one-sentence description of the item including style and material if visible

Return ONLY valid JSON, no other text."""


async def classify_clothing(image_path: str) -> dict:
    if not settings.ANTHROPIC_API_KEY:
        logger.warning("ANTHROPIC_API_KEY not set, returning default classification")
        return _default_classification()

    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        image_data = get_image_base64(image_path)
        media_type = get_image_media_type(image_path)

        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": media_type,
                                "data": image_data,
                            },
                        },
                        {"type": "text", "text": CLASSIFICATION_PROMPT},
                    ],
                }
            ],
        )

        response_text = message.content[0].text.strip()
        # Extract JSON from response (handle markdown code blocks)
        if "```" in response_text:
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
            response_text = response_text.strip()

        result = json.loads(response_text)
        return _validate_classification(result)

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI response as JSON: {e}")
        return _default_classification()
    except Exception as e:
        logger.error(f"Clothing classification failed: {e}")
        return _default_classification()


def _validate_classification(data: dict) -> dict:
    valid_categories = {"top", "bottom", "dress", "outerwear", "shoes", "accessory"}
    valid_patterns = {"solid", "striped", "plaid", "floral", "graphic", "abstract", "animal", "other"}
    valid_seasons = {"spring", "summer", "fall", "winter"}
    valid_occasions = {"casual", "work", "formal", "sport", "date", "holiday", "party"}

    category = data.get("category", "top")
    if category not in valid_categories:
        category = "top"

    pattern = data.get("pattern", "solid")
    if pattern not in valid_patterns:
        pattern = "other"

    seasons = data.get("seasons", [])
    seasons = [s for s in seasons if s in valid_seasons] or ["spring", "summer", "fall", "winter"]

    occasions = data.get("occasions", [])
    occasions = [o for o in occasions if o in valid_occasions] or ["casual"]

    warmth = data.get("warmth_level", 3)
    if not isinstance(warmth, int) or warmth < 1 or warmth > 5:
        warmth = 3

    return {
        "category": category,
        "subcategory": data.get("subcategory", ""),
        "color_primary": data.get("color_primary", ""),
        "color_secondary": data.get("color_secondary"),
        "pattern": pattern,
        "seasons": seasons,
        "occasions": occasions,
        "warmth_level": warmth,
        "name": data.get("name", "Clothing Item"),
        "description": data.get("description", ""),
    }


def _default_classification() -> dict:
    return {
        "category": "top",
        "subcategory": "",
        "color_primary": "",
        "color_secondary": None,
        "pattern": "solid",
        "seasons": ["spring", "summer", "fall", "winter"],
        "occasions": ["casual"],
        "warmth_level": 3,
        "name": "Clothing Item",
        "description": "AI classification unavailable. Please edit details manually.",
    }
