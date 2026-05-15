import io
import os
import uuid
import aiofiles
import httpx
import anyio
from functools import partial
from pathlib import Path
from typing import Optional
from app.config import get_settings
from app.utils.logger import logger

settings = get_settings()


class LocalStorage:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    async def save(self, file_bytes: bytes, filename: str, subfolder: str = "") -> str:
        folder = self.base_path / subfolder
        folder.mkdir(parents=True, exist_ok=True)
        unique_name = f"{uuid.uuid4()}_{filename}"
        file_path = folder / unique_name
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(file_bytes)
        return str(file_path)

    async def read(self, path: str) -> bytes:
        async with aiofiles.open(path, "rb") as f:
            return await f.read()

    async def delete(self, path: str) -> None:
        Path(path).unlink(missing_ok=True)

    def exists(self, path: str) -> bool:
        return Path(path).exists()


class CloudinaryStorage:
    """
    All PDFs are uploaded with resource_type='raw' so that Cloudinary
    preserves the .pdf extension and serves the file correctly.

    Correct URL format for raw uploads:
        https://res.cloudinary.com/{cloud_name}/raw/upload/{public_id}
    """

    def __init__(self):
        import cloudinary
        import cloudinary.uploader
        import cloudinary.api

        self.cloudinary = cloudinary
        self.uploader = cloudinary.uploader
        self.api = cloudinary.api
        self.cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True,
        )
        self.upload_folder = settings.CLOUDINARY_FOLDER.strip("/")

    async def save(self, file_bytes: bytes, filename: str, subfolder: str = "") -> str:
        """Upload file to Cloudinary. PDFs are always stored as 'raw'."""
        is_pdf = filename.lower().endswith(".pdf")
        resource_type = "raw" if is_pdf else "auto"

        # Build public_id: folder/subfolder/uuid_filename
        parts = [p for p in [self.upload_folder, subfolder, f"{uuid.uuid4()}_{filename}"] if p]
        public_id = "/".join(parts)

        file_obj = io.BytesIO(file_bytes)
        result = await anyio.to_thread.run_sync(
            partial(
                self.uploader.upload,
                file_obj,
                public_id=public_id,
                resource_type=resource_type,
                overwrite=True,
            )
        )
        stored_id = result["public_id"]
        logger.info("cloudinary_upload_ok", public_id=stored_id, resource_type=resource_type)
        return stored_id

    async def read(self, public_id: str) -> bytes:
        """
        Download a file from Cloudinary by its public_id.
        PDFs are stored as 'raw' — must fetch with resource_type='raw'.
        """
        is_pdf = public_id.lower().endswith(".pdf")
        resource_type = "raw" if is_pdf else "image"

        try:
            # Build URL directly for raw resources (PDFs) to avoid API call overhead and 401s
            if resource_type == "raw":
                url = self._build_raw_url(public_id)
            else:
                resource = await anyio.to_thread.run_sync(
                    partial(self.api.resource, public_id, resource_type=resource_type)
                )
                url = resource.get("secure_url") or resource.get("url")
        except Exception as e:
            logger.warning("cloudinary_metadata_fetch_failed", public_id=public_id, error=str(e))
            url = self._build_raw_url(public_id)

        if not url:
            raise FileNotFoundError(f"Cloudinary resource not found: {public_id}")

        logger.info("cloudinary_download_start", url=url)
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.content

    async def delete(self, public_id: str) -> None:
        is_pdf = public_id.lower().endswith(".pdf")
        resource_type = "raw" if is_pdf else "image"
        try:
            await anyio.to_thread.run_sync(
                partial(
                    self.uploader.destroy,
                    public_id,
                    resource_type=resource_type,
                    invalidate=True,
                )
            )
        except Exception as e:
            logger.warning("cloudinary_delete_failed", public_id=public_id, error=str(e))

    def _build_raw_url(self, public_id: str) -> str:
        """
        Construct the direct Cloudinary URL for a raw upload.

        Pattern: https://res.cloudinary.com/{cloud_name}/raw/upload/{public_id}

        NOTE: For raw resources, the public_id already contains the file extension
        (e.g. .pdf), so no suffix is appended.
        """
        cloud = settings.CLOUDINARY_CLOUD_NAME
        return f"https://res.cloudinary.com/{cloud}/raw/upload/{public_id}"

    def get_direct_url(self, public_id: str) -> str:
        """Return the direct Cloudinary URL (no signing needed for raw resources)."""
        return self._build_raw_url(public_id)


def get_storage():
    if settings.STORAGE_BACKEND == "cloudinary":
        return CloudinaryStorage()
    return LocalStorage(settings.LOCAL_STORAGE_PATH)
