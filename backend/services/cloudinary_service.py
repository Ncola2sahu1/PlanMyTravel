import logging
from typing import Dict, Any, Optional
import cloudinary
import cloudinary.uploader
from backend.config import Config

logger = logging.getLogger(__name__)


class CloudinaryService:
    """Managed image infrastructure with Cloudinary and graceful local fallbacks."""

    def __init__(self):
        self.is_configured = bool(
            Config.CLOUDINARY_CLOUD_NAME and Config.CLOUDINARY_API_KEY and Config.CLOUDINARY_API_SECRET
        )
        if self.is_configured:
            cloudinary.config(
                cloud_name=Config.CLOUDINARY_CLOUD_NAME,
                api_key=Config.CLOUDINARY_API_KEY,
                api_secret=Config.CLOUDINARY_API_SECRET,
                secure=True,
            )

    def upload_image(self, file_storage_or_bytes, folder: str = "planmytravel/destinations", public_id: Optional[str] = None) -> Dict[str, Any]:
        """Upload image to Cloudinary with automatic optimization."""
        if not self.is_configured:
            logger.warning("Cloudinary not configured. Returning fallback placeholder.")
            return {
                "url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
                "public_id": "fallback_placeholder",
                "provider": "fallback",
            }
        try:
            options = {
                "folder": folder,
                "resource_type": "image",
                "transformation": [
                    {"quality": "auto", "fetch_format": "auto"},
                    {"width": 1600, "crop": "limit"}
                ]
            }
            if public_id:
                options["public_id"] = public_id

            result = cloudinary.uploader.upload(file_storage_or_bytes, **options)
            return {
                "url": result.get("secure_url") or result.get("url"),
                "public_id": result.get("public_id"),
                "width": result.get("width"),
                "height": result.get("height"),
                "format": result.get("format"),
                "bytes": result.get("bytes"),
                "provider": "cloudinary",
            }
        except Exception as e:
            logger.error("Cloudinary upload failed: %s", e)
            raise RuntimeError(f"Cloudinary upload failed: {e}")

