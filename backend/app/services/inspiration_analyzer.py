import json
import logging

import anthropic

from app.config import settings
from app.services.image_service import get_image_base64, get_image_media_type

logger = logging.getLogger(__name__)

ANALYSIS_PROMPT = """You are a fashion expert. Analyze this outfit/style inspiration image and return a JSON object with:
- style_tags: array of style descriptors (e.g., ["minimalist", "streetwear", "casual chic", "layered"])
- color_palette: array of main colors seen (e.g., ["black", "white", "beige"])
- occasion: most suitable occasion from ["casual", "work", "formal", "sport", "date", "holiday", "party"]
- mood: one-word mood descriptor (e.g., "relaxed", "edgy", "elegant", "playful")
- items_detected: array of clothing items visible (e.g., ["oversized blazer", "white t-shirt", "straight-leg jeans", "white sneakers"])
- season: most suitable season from ["spring", "summer", "fall", "winter"]

Return ONLY valid JSON, no other text."""


async def analyze_inspiration(image_path: str) -> dict | None:
    if not settings.ANTHROPIC_API_KEY:
        logger.warning("ANTHROPIC_API_KEY not set, skipping inspiration analysis")
        return None

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
                        {"type": "text", "text": ANALYSIS_PROMPT},
                    ],
                }
            ],
        )

        response_text = message.content[0].text.strip()
        if "```" in response_text:
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
            response_text = response_text.strip()

        return json.loads(response_text)

    except Exception as e:
        logger.error(f"Inspiration analysis failed: {e}")
        return None
