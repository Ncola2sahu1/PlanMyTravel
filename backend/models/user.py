import json
import uuid
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from backend.database import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False, default="")
    full_name = db.Column(db.String(150), nullable=False, default="")
    phone = db.Column(db.String(50), nullable=True)
    date_of_birth = db.Column(db.String(50), nullable=True)
    country = db.Column(db.String(100), nullable=True)
    preferred_currency = db.Column(db.String(10), nullable=False, default="USD")
    avatar_url = db.Column(db.Text, nullable=True)
    profile_image_url = db.Column(db.Text, nullable=True)
    bio = db.Column(db.Text, nullable=True)
    preferences_json = db.Column(db.Text, nullable=False, default="{}")
    emergency_contact_name = db.Column(db.String(100), nullable=True)
    emergency_contact_phone = db.Column(db.String(50), nullable=True)
    role = db.Column(db.String(50), nullable=False, default="traveler")
    is_active = db.Column(db.Integer, nullable=False, default=1)
    email_verified_at = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.String(50), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())
    updated_at = db.Column(db.String(50), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat(), onupdate=lambda: datetime.now(timezone.utc).isoformat())
    session_version = db.Column(db.Integer, nullable=False, default=1)

    # Relationships
    trips = db.relationship("Trip", backref="user", lazy="dynamic", cascade="all, delete-orphan")
    wallet = db.relationship("Wallet", backref="user", uselist=False, cascade="all, delete-orphan")
    bookings = db.relationship("Booking", backref="user", lazy="dynamic")

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    @property
    def preferences(self):
        try:
            return json.loads(self.preferences_json or "{}")
        except Exception:
            return {}

    @preferences.setter
    def preferences(self, value):
        self.preferences_json = json.dumps(value or {})

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name or self.full_name or self.email.split("@")[0],
            "full_name": self.full_name,
            "phone": self.phone,
            "country": self.country,
            "preferred_currency": self.preferred_currency,
            "avatar_url": self.avatar_url or self.profile_image_url,
            "bio": self.bio,
            "preferences": self.preferences,
            "role": self.role,
            "is_active": bool(self.is_active),
            "created_at": self.created_at,
        }


class AdminUser(db.Model):
    __tablename__ = "admin_users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), unique=True, nullable=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False, default="")
    role = db.Column(db.String(50), nullable=False, default="admin")
    is_active = db.Column(db.Integer, nullable=False, default=1)
    failed_attempts = db.Column(db.Integer, nullable=False, default=0)
    locked_until = db.Column(db.String(50), nullable=True)
    last_login_at = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.String(50), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())
    updated_at = db.Column(db.String(50), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat(), onupdate=lambda: datetime.now(timezone.utc).isoformat())

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name or self.email.split("@")[0],
            "role": self.role,
            "is_active": bool(self.is_active),
            "last_login_at": self.last_login_at,
            "created_at": self.created_at,
        }


class AdminAuditLog(db.Model):
    __tablename__ = "admin_audit_logs"

    id = db.Column(db.String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    admin_id = db.Column(db.Integer, db.ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True)
    admin_user_id = db.Column(db.Integer, db.ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    entity_type = db.Column(db.String(100), nullable=True)
    entity_id = db.Column(db.String(100), nullable=True)
    diff_json = db.Column(db.Text, nullable=True)
    details_json = db.Column(db.Text, nullable=False, default="{}")
    ip = db.Column(db.String(64), nullable=True)
    ip_address = db.Column(db.String(64), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.String(50), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self):
        details = {}
        try:
            details = json.loads(self.details_json or "{}")
        except Exception:
            pass
        return {
            "id": self.id,
            "admin_id": self.admin_id or self.admin_user_id,
            "action": self.action,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "details": details,
            "ip_address": self.ip_address or self.ip,
            "created_at": self.created_at,
        }

