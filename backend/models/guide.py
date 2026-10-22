import json
from datetime import datetime, timezone
from backend.database import db


class Guide(db.Model):
    __tablename__ = "guides"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    display_name = db.Column(db.String(150), nullable=False)
    bio = db.Column(db.Text, nullable=True)
    destination = db.Column(db.String(150), nullable=True)
    languages_json = db.Column(db.Text, nullable=False, default="[]")
    specialties_json = db.Column(db.Text, nullable=False, default="[]")
    daily_rate = db.Column(db.Float, nullable=False, default=4500.0)
    rating = db.Column(db.Float, nullable=False, default=4.9)
    review_count = db.Column(db.Integer, nullable=False, default=0)
    photo_url = db.Column(db.Text, nullable=True)
    id_document_url = db.Column(db.Text, nullable=True)
    approval_status = db.Column(db.String(50), nullable=False, default="pending")  # pending, approved, rejected
    is_verified = db.Column(db.Integer, nullable=False, default=0)
    is_active = db.Column(db.Integer, nullable=False, default=1)
    contact_email = db.Column(db.String(255), nullable=True)
    contact_phone = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.String(50), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())
    updated_at = db.Column(db.String(50), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat(), onupdate=lambda: datetime.now(timezone.utc).isoformat())

    @property
    def languages(self):
        try:
            return json.loads(self.languages_json or "[]")
        except Exception:
            return []

    @languages.setter
    def languages(self, val):
        self.languages_json = json.dumps(val or [])

    @property
    def specialties(self):
        try:
            return json.loads(self.specialties_json or "[]")
        except Exception:
            return []

    @specialties.setter
    def specialties(self, val):
        self.specialties_json = json.dumps(val or [])

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "display_name": self.display_name,
            "bio": self.bio,
            "destination": self.destination,
            "languages": self.languages,
            "specialties": self.specialties,
            "daily_rate": round(self.daily_rate or 4500.0, 2),
            "currency": "INR",
            "rating": round(self.rating or 4.9, 2),
            "review_count": self.review_count or 0,
            "photo_url": self.photo_url or "/images/guides/guide_1.jpg",
            "id_document_url": self.id_document_url,
            "approval_status": self.approval_status or ("approved" if self.is_verified else "pending"),
            "is_verified": bool(self.is_verified),
            "is_active": bool(self.is_active),
            "contact_email": self.contact_email,
            "contact_phone": self.contact_phone,
            "created_at": self.created_at,
        }
