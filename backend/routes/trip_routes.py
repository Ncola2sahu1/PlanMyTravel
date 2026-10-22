import json
import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g
from backend.models.trip import Trip, ItineraryPlan, ItineraryDay, ItineraryItem
from backend.models.destination import Destination
from backend.utils.auth_helpers import login_required
from backend.database import db

trip_bp = Blueprint("trip_bp", __name__, url_prefix="/api/trips")


@trip_bp.route("", methods=["GET"])
@login_required
def list_user_trips():
    """Retrieve all trips owned by the authenticated user."""
    trips = Trip.query.filter_by(user_id=g.current_user.id).order_by(Trip.created_at.desc()).all()
    return jsonify({
        "trips": [t.to_dict(include_plan=True) for t in trips],
        "total": len(trips),
    })


@trip_bp.route("", methods=["POST"])
@login_required
def save_trip():
    """Save an AI-generated itinerary to the user's database records."""
    data = request.get_json() or {}
    itinerary = data.get("itinerary", {})
    preferences = data.get("preferences", {})

    title = data.get("title") or itinerary.get("title") or f"Trip to {itinerary.get('destination', 'Wonderland')}"
    destination_name = itinerary.get("destination") or preferences.get("destination", "")

    # Match destination record if available
    dest = Destination.query.filter(Destination.name.ilike(destination_name)).first() if destination_name else None

    trip = Trip(
        id=str(uuid.uuid4()),
        user_id=g.current_user.id,
        destination_id=dest.id if dest else None,
        title=title,
        origin=preferences.get("origin", itinerary.get("origin", "")),
        travelers=int(preferences.get("travelers", itinerary.get("travelers", 1))),
        travelers_count=int(preferences.get("travelers", itinerary.get("travelers", 1))),
        total_budget=float(preferences.get("budget", 100000)),
        currency=itinerary.get("currency", "INR"),
        travel_style=preferences.get("travel_style", ""),
        status="saved",
    )
    trip.interests = preferences.get("interests", [])
    trip.preferences = preferences

    db.session.add(trip)
    db.session.flush()

    # Create Itinerary Plan
    plan = ItineraryPlan(
        id=str(uuid.uuid4()),
        trip_id=trip.id,
        title=trip.title,
        summary=itinerary.get("summary", ""),
        estimated_total=itinerary.get("budget_breakdown", {}).get("estimated_grand_total"),
        currency=trip.currency,
    )
    plan.payload = itinerary
    db.session.add(plan)
    db.session.flush()

    # Save Days and Items
    for day_data in itinerary.get("days", []):
        day = ItineraryDay(
            plan_id=plan.id,
            day_number=day_data.get("day_number", 1),
            title=day_data.get("title", f"Day {day_data.get('day_number', 1)}"),
            summary=day_data.get("summary", ""),
        )
        db.session.add(day)
        db.session.flush()

        # Morning, Afternoon, Evening items
        for slot in ["morning", "afternoon", "evening"]:
            act = day_data.get(slot)
            if act and isinstance(act, dict):
                item = ItineraryItem(
                    day_id=day.id,
                    title=act.get("title", f"{slot.capitalize()} Activity"),
                    description=act.get("description", ""),
                    location=act.get("location", ""),
                    start_time=act.get("time", ""),
                    item_type=slot,
                    category=slot,
                    duration_min=act.get("duration_min", 120),
                    estimated_cost=act.get("estimated_cost", 0.0),
                    currency=trip.currency,
                )
                db.session.add(item)

    db.session.commit()

    return jsonify({
        "message": "Trip saved successfully",
        "trip": trip.to_dict(include_plan=True),
    }), 201


@trip_bp.route("/<trip_id>", methods=["GET"])
@login_required
def get_trip(trip_id: str):
    """Retrieve full details of a specific trip with ownership check."""
    trip = Trip.query.filter_by(id=trip_id, user_id=g.current_user.id).first()
    if not trip:
        return jsonify({"error": "Trip not found or unauthorized"}), 404
    return jsonify({"trip": trip.to_dict(include_plan=True)})


@trip_bp.route("/<trip_id>", methods=["PUT"])
@login_required
def update_trip(trip_id: str):
    """Update trip title, notes, or modified itinerary payload."""
    trip = Trip.query.filter_by(id=trip_id, user_id=g.current_user.id).first()
    if not trip:
        return jsonify({"error": "Trip not found or unauthorized"}), 404

    data = request.get_json() or {}
    if "title" in data:
        trip.title = data["title"].strip()
    if "notes" in data:
        trip.notes = data["notes"]
    if "total_budget" in data:
        trip.total_budget = float(data["total_budget"])

    # If updated itinerary payload is passed, update the plan
    if "itinerary" in data:
        plan = trip.plans.order_by(ItineraryPlan.created_at.desc()).first()
        if plan:
            plan.payload = data["itinerary"]
            plan.updated_at = datetime.now(timezone.utc).isoformat()

    trip.updated_at = datetime.now(timezone.utc).isoformat()
    db.session.commit()

    return jsonify({
        "message": "Trip updated successfully",
        "trip": trip.to_dict(include_plan=True),
    })


@trip_bp.route("/<trip_id>", methods=["DELETE"])
@login_required
def delete_trip(trip_id: str):
    """Delete a saved trip and associated plans."""
    trip = Trip.query.filter_by(id=trip_id, user_id=g.current_user.id).first()
    if not trip:
        return jsonify({"error": "Trip not found or unauthorized"}), 404

    db.session.delete(trip)
    db.session.commit()
    return jsonify({"message": "Trip deleted successfully", "trip_id": trip_id})


@trip_bp.route("/<trip_id>/duplicate", methods=["POST"])
@login_required
def duplicate_trip(trip_id: str):
    """Duplicate an existing trip as a new starting plan."""
    original = Trip.query.filter_by(id=trip_id, user_id=g.current_user.id).first()
    if not original:
        return jsonify({"error": "Trip not found or unauthorized"}), 404

    new_trip = Trip(
        id=str(uuid.uuid4()),
        user_id=g.current_user.id,
        destination_id=original.destination_id,
        title=f"Copy of {original.title}",
        origin=original.origin,
        travelers=original.travelers,
        travelers_count=original.travelers_count,
        total_budget=original.total_budget,
        currency=original.currency,
        travel_style=original.travel_style,
        status="saved",
        interests_json=original.interests_json,
        preferences_json=original.preferences_json,
    )
    db.session.add(new_trip)
    db.session.flush()

    # Clone active plan
    active_plan = original.plans.order_by(ItineraryPlan.created_at.desc()).first()
    if active_plan:
        cloned_plan = ItineraryPlan(
            id=str(uuid.uuid4()),
            trip_id=new_trip.id,
            title=new_trip.title,
            summary=active_plan.summary,
            estimated_total=active_plan.estimated_total,
            currency=active_plan.currency,
            payload_json=active_plan.payload_json,
            json_payload=active_plan.json_payload,
        )
        db.session.add(cloned_plan)

    db.session.commit()
    return jsonify({
        "message": "Trip duplicated successfully",
        "trip": new_trip.to_dict(include_plan=True),
    }), 201

