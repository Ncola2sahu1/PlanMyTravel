import json
from datetime import datetime, timezone
from backend.database import db


class Stay(db.Model):
    """Accommodations and verified regional boutique stays stored in Turso."""
    __tablename__ = "stays"

    id = db.Column(db.String(64), primary_key=True)
    provider_code = db.Column(db.String(64), nullable=True)
    name = db.Column(db.String(255), nullable=False, index=True)
    city = db.Column(db.String(128), nullable=False, index=True)
    country = db.Column(db.String(128), nullable=False, index=True)
    region = db.Column(db.String(128), nullable=True, index=True)
    category = db.Column(db.String(128), nullable=True)
    description = db.Column(db.Text, nullable=True)
    cover_image_url = db.Column(db.String(512), nullable=True)
    images_json = db.Column(db.Text, nullable=True, default="[]")
    nightly_rate = db.Column(db.Float, nullable=False, default=15000.0)
    currency = db.Column(db.String(8), nullable=False, default="INR")
    rating = db.Column(db.Float, nullable=False, default=4.8)
    review_count = db.Column(db.Integer, nullable=False, default=0)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    address = db.Column(db.String(512), nullable=True)
    amenities_json = db.Column(db.Text, nullable=True, default="[]")
    is_verified_provider = db.Column(db.Integer, nullable=False, default=1)
    source = db.Column(db.String(64), nullable=False, default="PlanMyTravel Verified Portfolio")
    requires_partner_checkout = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    @property
    def images(self):
        if not self.images_json:
            return []
        try:
            return json.loads(self.images_json)
        except Exception:
            return [self.cover_image_url] if self.cover_image_url else []

    @images.setter
    def images(self, val):
        self.images_json = json.dumps(val or [])

    @property
    def amenities(self):
        if not self.amenities_json:
            return []
        try:
            return json.loads(self.amenities_json)
        except Exception:
            return []

    @amenities.setter
    def amenities(self, val):
        self.amenities_json = json.dumps(val or [])

    def to_dict(self):
        return {
            "id": self.id,
            "provider_code": self.provider_code,
            "name": self.name,
            "city": self.city,
            "country": self.country,
            "region": self.region,
            "category": self.category,
            "description": self.description,
            "cover_image_url": self.cover_image_url,
            "images": self.images,
            "nightly_rate": round(self.nightly_rate, 2),
            "currency": self.currency,
            "rating": round(self.rating, 2),
            "review_count": self.review_count,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "address": self.address,
            "amenities": self.amenities,
            "is_verified_provider": bool(self.is_verified_provider),
            "source": self.source,
            "requires_partner_checkout": bool(self.requires_partner_checkout),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

