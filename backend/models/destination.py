import json
from datetime import datetime, timezone
from backend.database import db


class Destination(db.Model):
    __tablename__ = "destinations"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(150), nullable=False, index=True)
    slug = db.Column(db.String(150), unique=True, nullable=False, index=True)
    country = db.Column(db.String(100), nullable=True)
    region = db.Column(db.String(100), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    description = db.Column(db.Text, nullable=True)
    short_description = db.Column(db.Text, nullable=True)
    hero_image_url = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.Text, nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    is_published = db.Column(db.Integer, nullable=False, default=1)
    tagline = db.Column(db.String(255), nullable=True)
    category = db.Column(db.String(100), nullable=True)
    travel_styles_json = db.Column(db.Text, nullable=False, default="[]")
    attractions_json = db.Column(db.Text, nullable=False, default="[]")
    activities_json = db.Column(db.Text, nullable=False, default="[]")
    estimated_cost_min = db.Column(db.Float, nullable=True)
    estimated_cost_max = db.Column(db.Float, nullable=True)
    best_season = db.Column(db.String(100), nullable=True)
    cost_currency = db.Column(db.String(10), nullable=False, default="SGD")
    weather_info = db.Column(db.Text, nullable=True)
    ideal_stay = db.Column(db.String(100), nullable=True)
    rating = db.Column(db.Float, nullable=False, default=0.0)
    is_featured = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.String(50), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())
    updated_at = db.Column(db.String(50), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat(), onupdate=lambda: datetime.now(timezone.utc).isoformat())

    # Relationships
    images = db.relationship("DestinationImage", backref="destination", lazy="joined", cascade="all, delete-orphan", order_by="DestinationImage.sort_order")
    experiences = db.relationship("Experience", backref="destination", lazy="dynamic")
    trips = db.relationship("Trip", backref="destination", lazy="dynamic")

    @property
    def travel_styles(self):
        try:
            return json.loads(self.travel_styles_json or "[]")
        except Exception:
            return []

    @travel_styles.setter
    def travel_styles(self, val):
        self.travel_styles_json = json.dumps(val or [])

    @property
    def attractions(self):
        try:
            return json.loads(self.attractions_json or "[]")
        except Exception:
            return []

    @attractions.setter
    def attractions(self, val):
        self.attractions_json = json.dumps(val or [])

    @property
    def activities(self):
        try:
            return json.loads(self.activities_json or "[]")
        except Exception:
            return []

    @activities.setter
    def activities(self, val):
        self.activities_json = json.dumps(val or [])

    def to_dict(self, include_details=True):
        data = {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "country": self.country,
            "region": self.region,
            "city": self.city,
            "description": self.description,
            "short_description": self.short_description or (self.description[:140] + "..." if self.description else ""),
            "hero_image_url": self.hero_image_url or self.image_url or (self.images[0].image_url if self.images else None),
            "image_url": self.image_url or self.hero_image_url,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "is_published": bool(self.is_published),
            "tagline": self.tagline,
            "category": self.category or "Cultural & Nature",
            "travel_styles": self.travel_styles,
            "rating": round(self.rating or 4.8, 1),
            "is_featured": bool(self.is_featured),
            "estimated_cost_min": self.estimated_cost_min,
            "estimated_cost_max": self.estimated_cost_max,
            "best_season": self.best_season,
            "cost_currency": self.cost_currency,
            "ideal_stay": self.ideal_stay or "3-5 days",
        }
        if include_details:
            data.update({
                "attractions": self.attractions,
                "activities": self.activities,
                "weather_info": self.weather_info,
                "gallery": [img.to_dict() for img in self.images],
            })
        return data


class DestinationImage(db.Model):
    __tablename__ = "destination_images"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    destination_id = db.Column(db.Integer, db.ForeignKey("destinations.id", ondelete="CASCADE"), nullable=False, index=True)
    media_asset_id = db.Column(db.Integer, nullable=True)
    image_url = db.Column(db.Text, nullable=False)
    alt_text = db.Column(db.String(255), nullable=True)
    caption = db.Column(db.String(255), nullable=True)
    sort_order = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.String(50), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self):
        return {
            "id": self.id,
            "destination_id": self.destination_id,
            "image_url": self.image_url,
            "alt_text": self.alt_text or "",
            "caption": self.caption or "",
            "sort_order": self.sort_order,
        }


class Experience(db.Model):
    __tablename__ = "experiences"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    destination_id = db.Column(db.Integer, db.ForeignKey("destinations.id", ondelete="SET NULL"), nullable=True, index=True)
    title = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False, index=True)
    category = db.Column(db.String(100), nullable=False, default="experience")
    travel_style = db.Column(db.String(100), nullable=True)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Float, nullable=False, default=0.0)
    currency = db.Column(db.String(10), nullable=False, default="SGD")
    rating = db.Column(db.Float, nullable=False, default=0.0)
    review_count = db.Column(db.Integer, nullable=False, default=0)
    cover_image_url = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), nullable=False, default="published")
    is_published = db.Column(db.Integer, nullable=False, default=1)
    created_at = db.Column(db.String(50), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self):
        return {
            "id": self.id,
            "destination_id": self.destination_id,
            "title": self.title,
            "slug": self.slug,
            "category": self.category,
            "travel_style": self.travel_style,
            "description": self.description,
            "price": self.price,
            "currency": self.currency,
            "rating": round(self.rating or 4.9, 1),
            "review_count": self.review_count,
            "cover_image_url": self.cover_image_url,
            "is_published": bool(self.is_published),
        }

