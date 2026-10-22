import json
import uuid
from datetime import datetime, timezone
from backend.database import db


class Trip(db.Model):
    __tablename__ = "trips"

    id = db.Column(db.String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    destination_id = db.Column(db.Integer, db.ForeignKey("destinations.id", ondelete="SET NULL"), nullable=True)
    title = db.Column(db.String(200), nullable=False, default="")
    start_date = db.Column(db.String(50), nullable=True)
    end_date = db.Column(db.String(50), nullable=True)
    travelers = db.Column(db.Integer, nullable=False, default=1)
    travelers_count = db.Column(db.Integer, nullable=False, default=1)
    traveler_count = db.Column(db.Integer, nullable=False, default=1)
    total_budget = db.Column(db.Float, nullable=True)
    budget = db.Column(db.Float, nullable=True)
    budget_amount = db.Column(db.Float, nullable=True)
    currency = db.Column(db.String(10), nullable=False, default="USD")
    selected_tier = db.Column(db.String(50), nullable=True)
    travel_style = db.Column(db.String(50), nullable=True)
    style = db.Column(db.String(50), nullable=True)
    origin = db.Column(db.String(100), nullable=True)
    interests_json = db.Column(db.Text, nullable=False, default="[]")
    status = db.Column(db.String(50), nullable=False, default="planning")
    notes = db.Column(db.Text, nullable=True)
    preferences_json = db.Column(db.Text, nullable=False, default="{}")
    created_at = db.Column(db.String(50), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())
    updated_at = db.Column(db.String(50), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat(), onupdate=lambda: datetime.now(timezone.utc).isoformat())

    # Relationships
    plans = db.relationship("ItineraryPlan", backref="trip", lazy="dynamic", cascade="all, delete-orphan")
    inventory = db.relationship("TripInventory", backref="trip", uselist=False, cascade="all, delete-orphan")

    @property
    def interests(self):
        try:
            return json.loads(self.interests_json or "[]")
        except Exception:
            return []

    @interests.setter
    def interests(self, val):
        self.interests_json = json.dumps(val or [])

    @property
    def preferences(self):
        try:
            return json.loads(self.preferences_json or "{}")
        except Exception:
            return {}

    @preferences.setter
    def preferences(self, val):
        self.preferences_json = json.dumps(val or {})

    def to_dict(self, include_plan=True):
        active_plan = self.plans.order_by(ItineraryPlan.created_at.desc()).first()
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "destination_id": self.destination_id,
            "title": self.title,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "travelers": self.travelers or self.travelers_count or self.traveler_count,
            "total_budget": self.total_budget or self.budget or self.budget_amount,
            "currency": self.currency,
            "travel_style": self.travel_style or self.style,
            "origin": self.origin,
            "interests": self.interests,
            "status": self.status,
            "notes": self.notes,
            "preferences": self.preferences,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
        if self.destination:
            data["destination"] = {
                "id": self.destination.id,
                "name": self.destination.name,
                "country": self.destination.country,
                "hero_image_url": self.destination.hero_image_url,
            }
        if include_plan and active_plan:
            data["active_plan"] = active_plan.to_dict()
        if self.inventory:
            data["inventory"] = self.inventory.to_dict()
        return data


class ItineraryPlan(db.Model):
    __tablename__ = "itinerary_plans"

    id = db.Column(db.String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    trip_id = db.Column(db.String(64), db.ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=True)
    description = db.Column(db.Text, nullable=True)
    tier = db.Column(db.String(50), nullable=False, default="standard")
    summary = db.Column(db.Text, nullable=True)
    estimated_total = db.Column(db.Float, nullable=True)
    total_estimated_cost = db.Column(db.Float, nullable=True)
    currency = db.Column(db.String(10), nullable=False, default="USD")
    json_payload = db.Column(db.Text, nullable=False, default="{}")
    payload_json = db.Column(db.Text, nullable=False, default="{}")
    created_at = db.Column(db.String(50), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())
    updated_at = db.Column(db.String(50), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat(), onupdate=lambda: datetime.now(timezone.utc).isoformat())

    # Relationships
    days = db.relationship("ItineraryDay", backref="plan", lazy="joined", cascade="all, delete-orphan", order_by="ItineraryDay.day_number")

    @property
    def payload(self):
        try:
            raw = self.payload_json if self.payload_json != "{}" else self.json_payload
            return json.loads(raw or "{}")
        except Exception:
            return {}

    @payload.setter
    def payload(self, val):
        dumped = json.dumps(val or {})
        self.payload_json = dumped
        self.json_payload = dumped

    def to_dict(self):
        return {
            "id": self.id,
            "trip_id": self.trip_id,
            "title": self.title,
            "description": self.description,
            "summary": self.summary,
            "tier": self.tier,
            "estimated_total": self.estimated_total or self.total_estimated_cost,
            "currency": self.currency,
            "days": [day.to_dict() for day in self.days],
            "payload": self.payload,
            "created_at": self.created_at,
        }


class ItineraryDay(db.Model):
    __tablename__ = "itinerary_days"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    plan_id = db.Column(db.String(64), db.ForeignKey("itinerary_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    day_number = db.Column(db.Integer, nullable=False)
    date = db.Column(db.String(50), nullable=True)
    start_date = db.Column(db.String(50), nullable=True)
    end_date = db.Column(db.String(50), nullable=True)
    title = db.Column(db.String(200), nullable=True)
    summary = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    weather_json = db.Column(db.Text, nullable=True)
    metadata_json = db.Column(db.Text, nullable=False, default="{}")
    created_at = db.Column(db.String(50), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())

    # Relationships
    items = db.relationship("ItineraryItem", backref="day", lazy="joined", cascade="all, delete-orphan", order_by="ItineraryItem.sort_order")

    @property
    def metadata_dict(self):
        try:
            return json.loads(self.metadata_json or "{}")
        except Exception:
            return {}

    def to_dict(self):
        return {
            "id": self.id,
            "plan_id": self.plan_id,
            "day_number": self.day_number,
            "date": self.date,
            "title": self.title,
            "summary": self.summary,
            "notes": self.notes,
            "items": [item.to_dict() for item in self.items],
            "metadata": self.metadata_dict,
        }


class ItineraryItem(db.Model):
    __tablename__ = "itinerary_items"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    day_id = db.Column(db.Integer, db.ForeignKey("itinerary_days.id", ondelete="CASCADE"), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    location = db.Column(db.String(255), nullable=True)
    start_time = db.Column(db.String(50), nullable=True)
    end_time = db.Column(db.String(50), nullable=True)
    sort_order = db.Column(db.Integer, nullable=False, default=0)
    item_type = db.Column(db.String(50), nullable=False, default="activity")
    category = db.Column(db.String(50), nullable=True)
    duration_min = db.Column(db.Integer, nullable=True)
    lat = db.Column(db.Float, nullable=True)
    lng = db.Column(db.Float, nullable=True)
    estimated_cost = db.Column(db.Float, nullable=True)
    currency = db.Column(db.String(10), nullable=False, default="USD")
    metadata_json = db.Column(db.Text, nullable=False, default="{}")
    route_from_prev_json = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.String(50), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())
    updated_at = db.Column(db.String(50), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat(), onupdate=lambda: datetime.now(timezone.utc).isoformat())

    @property
    def metadata_dict(self):
        try:
            return json.loads(self.metadata_json or "{}")
        except Exception:
            return {}

    def to_dict(self):
        return {
            "id": self.id,
            "day_id": self.day_id,
            "title": self.title,
            "description": self.description,
            "location": self.location,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "sort_order": self.sort_order,
            "item_type": self.item_type,
            "category": self.category,
            "duration_min": self.duration_min,
            "estimated_cost": self.estimated_cost,
            "currency": self.currency,
            "metadata": self.metadata_dict,
        }


class TripInventory(db.Model):
    __tablename__ = "trip_inventory"

    trip_id = db.Column(db.String(64), db.ForeignKey("trips.id", ondelete="CASCADE"), primary_key=True)
    status = db.Column(db.String(50), nullable=False, default="available")
    provider = db.Column(db.String(100), nullable=True)
    origin_code = db.Column(db.String(10), nullable=True)
    destination_code = db.Column(db.String(10), nullable=True)
    flight_status = db.Column(db.String(50), nullable=False, default="unavailable")
    hotel_status = db.Column(db.String(50), nullable=False, default="unavailable")
    flights_json = db.Column(db.Text, nullable=False, default="[]")
    hotels_json = db.Column(db.Text, nullable=False, default="[]")
    flight_notice = db.Column(db.Text, nullable=True)
    hotel_notice = db.Column(db.Text, nullable=True)
    notice = db.Column(db.Text, nullable=True)
    searched_at = db.Column(db.String(50), nullable=True)
    updated_at = db.Column(db.String(50), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat(), onupdate=lambda: datetime.now(timezone.utc).isoformat())

    @property
    def flights(self):
        try:
            return json.loads(self.flights_json or "[]")
        except Exception:
            return []

    @property
    def hotels(self):
        try:
            return json.loads(self.hotels_json or "[]")
        except Exception:
            return []

    def to_dict(self):
        return {
            "trip_id": self.trip_id,
            "status": self.status,
            "provider": self.provider,
            "flight_status": self.flight_status,
            "hotel_status": self.hotel_status,
            "flights": self.flights,
            "hotels": self.hotels,
            "flight_notice": self.flight_notice,
            "hotel_notice": self.hotel_notice,
            "notice": self.notice,
            "searched_at": self.searched_at,
        }

