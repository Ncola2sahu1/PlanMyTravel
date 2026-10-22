import json
from datetime import datetime, timezone
from backend.database import db


class MediaAsset(db.Model):
    __tablename__ = "media_assets"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    owner_user_id = db.Column(db.Integer, nullable=True)
    uploaded_by = db.Column(db.Integer, nullable=True)
    folder = db.Column(db.String(100), nullable=True)
    relative_path = db.Column(db.String(255), nullable=True)
    path = db.Column(db.String(255), nullable=True)
    url = db.Column(db.Text, nullable=False)
    filename = db.Column(db.String(255), nullable=True)
    original_filename = db.Column(db.String(255), nullable=True)
    mime_type = db.Column(db.String(100), nullable=True)
    size_bytes = db.Column(db.Integer, nullable=True)
    file_size = db.Column(db.Integer, nullable=True)
    width = db.Column(db.Integer, nullable=True)
    height = db.Column(db.Integer, nullable=True)
    alt_text = db.Column(db.String(255), nullable=True)
    metadata_json = db.Column(db.Text, nullable=False, default="{}")
    created_at = db.Column(db.String(50), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())
    updated_at = db.Column(db.String(50), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat(), onupdate=lambda: datetime.now(timezone.utc).isoformat())
    storage_provider = db.Column(db.String(50), nullable=True, default="cloudinary")
    cloudinary_public_id = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "url": self.url,
            "filename": self.filename or self.original_filename,
            "alt_text": self.alt_text,
            "width": self.width,
            "height": self.height,
            "storage_provider": self.storage_provider,
            "created_at": self.created_at,
        }

