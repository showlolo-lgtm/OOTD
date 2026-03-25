import logging
import os
import uuid

import httpx
import replicate

from app.config import settings
from app.services.image_service import get_full_path

logger = logging.getLogger(__name__)


async def generate_tryon(
    person_image_path: str,
    garment_image_path: str,
    category: str = "upper_body",
) -> str | None:
    if not settings.REPLICATE_API_TOKEN:
        logger.warning("REPLICATE_API_TOKEN not set")
        return None

    try:
        os.environ["REPLICATE_API_TOKEN"] = settings.REPLICATE_API_TOKEN

        person_full = get_full_path(person_image_path)
        garment_full = get_full_path(garment_image_path)

        if not os.path.exists(person_full) or not os.path.exists(garment_full):
            logger.error("Person or garment image not found")
            return None

        # Map category to model input
        category_map = {
            "top": "upper_body",
            "bottom": "lower_body",
            "dress": "dresses",
            "outerwear": "upper_body",
        }
        model_category = category_map.get(category, "upper_body")

        output = replicate.run(
            "cuuupid/idm-vton:c871bb9b046c1462f19662e6d4e61944105e3596c12040670fd4e0c6fd460fab",
            input={
                "human_img": open(person_full, "rb"),
                "garm_img": open(garment_full, "rb"),
                "category": model_category,
                "n_steps": 30,
                "seed": 42,
            },
        )

        # Output is typically a URL to the generated image
        if output:
            image_url = str(output)
            return await _download_result(image_url)

        return None

    except Exception as e:
        logger.error(f"Virtual try-on failed: {e}")
        return None


async def _download_result(image_url: str) -> str | None:
    try:
        os.makedirs(os.path.join(settings.UPLOAD_DIR, "generated"), exist_ok=True)
        filename = f"{uuid.uuid4().hex}.png"
        rel_path = os.path.join("generated", filename)
        full_path = os.path.join(settings.UPLOAD_DIR, rel_path)

        async with httpx.AsyncClient() as client:
            response = await client.get(image_url, timeout=60.0)
            response.raise_for_status()
            with open(full_path, "wb") as f:
                f.write(response.content)

        return rel_path
    except Exception as e:
        logger.error(f"Failed to download try-on result: {e}")
        return None
