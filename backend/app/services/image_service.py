import base64
import os
import uuid

from fastapi import UploadFile
from PIL import Image

from app.config import settings

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_IMAGE_SIZE = (1024, 1024)


def ensure_upload_dirs():
    for subdir in ["clothing", "profiles", "inspirations", "generated"]:
        os.makedirs(os.path.join(settings.UPLOAD_DIR, subdir), exist_ok=True)


async def save_upload(file: UploadFile, category: str) -> str:
    ensure_upload_dirs()

    ext = os.path.splitext(file.filename or ".jpg")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".jpg"

    filename = f"{uuid.uuid4().hex}{ext}"
    rel_path = os.path.join(category, filename)
    full_path = os.path.join(settings.UPLOAD_DIR, rel_path)

    content = await file.read()
    with open(full_path, "wb") as f:
        f.write(content)

    # Create a resized version for AI processing
    try:
        img = Image.open(full_path)
        img.thumbnail(MAX_IMAGE_SIZE, Image.Resampling.LANCZOS)
        img.save(full_path)
    except Exception:
        pass

    return rel_path


def get_image_base64(rel_path: str) -> str:
    full_path = os.path.join(settings.UPLOAD_DIR, rel_path)
    with open(full_path, "rb") as f:
        return base64.standard_b64encode(f.read()).decode("utf-8")


def get_image_media_type(rel_path: str) -> str:
    ext = os.path.splitext(rel_path)[1].lower()
    media_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif",
    }
    return media_types.get(ext, "image/jpeg")


def delete_image(rel_path: str):
    full_path = os.path.join(settings.UPLOAD_DIR, rel_path)
    if os.path.exists(full_path):
        os.remove(full_path)


def get_full_path(rel_path: str) -> str:
    return os.path.join(settings.UPLOAD_DIR, rel_path)
