"""
storage_service.py — Cloudinary audio upload.
"""

import logging
from typing import Optional

import cloudinary
import cloudinary.uploader

from app.config.settings import settings

logger = logging.getLogger(__name__)

# Configure Cloudinary
if settings.CLOUDINARY_CLOUD_NAME:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True
    )


async def upload_audio(
    file_bytes: bytes,
    content_type: str,
    session_id: str,
    response_id: str,
) -> Optional[str]:
    """Upload audio bytes to Cloudinary and return the secure URL."""
    if not settings.CLOUDINARY_CLOUD_NAME:
        logger.info("Cloudinary not configured — skipping audio upload")
        return None

    public_id = f"{settings.CLOUDINARY_FOLDER}/{session_id}/{response_id}"
    try:
        # Cloudinary uploader.upload is synchronous, but we can call it in a thread if needed.
        # For simplicity in this service, we'll call it directly.
        response = cloudinary.uploader.upload(
            file_bytes,
            public_id=public_id,
            resource_type="video",  # Audio is handled as 'video' in Cloudinary
            folder=settings.CLOUDINARY_FOLDER
        )
        return response.get("secure_url")
    except Exception as e:
        logger.error("Cloudinary upload failed: %s", e)
        return None


async def delete_audio(cloudinary_url: str) -> bool:
    """Delete an audio file by its URL (best-effort)."""
    try:
        # Extract public_id from URL if possible, or just skip if too complex.
        # Cloudinary usually needs the public_id to delete.
        # Simple approach: extract between folder and extension.
        if settings.CLOUDINARY_FOLDER in cloudinary_url:
            parts = cloudinary_url.split(f"{settings.CLOUDINARY_FOLDER}/")[-1]
            public_id = f"{settings.CLOUDINARY_FOLDER}/{parts.split('.')[0]}"
            cloudinary.uploader.destroy(public_id, resource_type="video")
            return True
        return False
    except Exception as e:
        logger.warning("Failed to delete audio: %s", e)
        return False
