from flask import Blueprint, request, jsonify
from backend.services.hotel_service import HotelService

stay_bp = Blueprint("stay_bp", __name__, url_prefix="/api/stays")
hotel_service = HotelService()


@stay_bp.route("", methods=["GET"])
def list_stays():
    """Discover accommodations with Airbnb-style visual cards and Hotelbeds test inventory."""
    dest = request.args.get("destination", "").strip()
    category = request.args.get("category", "").strip().lower()
    max_price = request.args.get("max_price", type=float)
    min_price = request.args.get("min_price", type=float)

    hotels = hotel_service.search_hotels(destination=dest, limit=16)

    # Filter by category if requested
    if category and category != "all":
        hotels = [h for h in hotels if category in h.get("category", "").lower()]

    # Filter by price
    if max_price:
        hotels = [h for h in hotels if h.get("nightly_rate", 0) <= max_price]
    if min_price:
        hotels = [h for h in hotels if h.get("nightly_rate", 0) >= min_price]

    return jsonify({
        "total": len(hotels),
        "destination": dest or "All Destinations",
        "provider_environment": "test" if hotel_service.is_configured else "curated_fallback",
        "stays": hotels,
    })


@stay_bp.route("/<stay_id>", methods=["GET"])
def get_stay_details(stay_id: str):
    """Retrieve details for an individual stay."""
    hotels = hotel_service.search_hotels(limit=25)
    matched = next((h for h in hotels if str(h.get("id")) == stay_id or str(h.get("provider_code")) == stay_id), None)
    if not matched:
        # Fallback to first stay
        matched = hotels[0] if hotels else None

    if not matched:
        return jsonify({"error": "Stay listing not found"}), 404

    return jsonify(matched)

