from flask import Blueprint, request, jsonify
from backend.services.hotel_service import HotelService
from backend.services.weather_service import WeatherService
from backend.config import Config

stay_bp = Blueprint("stay_bp", __name__, url_prefix="/api/stays")
hotel_service = HotelService()
weather_service = WeatherService()


@stay_bp.route("", methods=["GET"])
def list_stays():
    """Discover accommodations filtered strictly by requested destination/region and category."""
    dest = request.args.get("destination", "").strip()
    category = request.args.get("category", "").strip().lower()
    max_price = request.args.get("max_price", type=float)
    min_price = request.args.get("min_price", type=float)

    hotels = hotel_service.search_hotels(destination=dest, limit=20)

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
        "destination": dest or "All Global Regions",
        "provider_environment": "verified_portfolio",
        "stays": hotels,
    })


@stay_bp.route("/<stay_id>", methods=["GET"])
def get_stay_details(stay_id: str):
    """Retrieve details for an individual stay including GPS coordinates, address, and amenities."""
    stay = hotel_service.get_hotel_by_id(stay_id)
    if not stay:
        return jsonify({"error": "Stay listing not found"}), 404
    return jsonify(stay)


@stay_bp.route("/weather", methods=["GET"])
def get_stay_weather():
    """Retrieve weather forecast for a stay on the selected check-in date."""
    destination = request.args.get("destination", "Singapore").strip()
    date_str = request.args.get("date", "").strip()
    lat = request.args.get("lat", type=float)
    lng = request.args.get("lng", type=float)

    weather_data = weather_service.get_weather_for_stay(
        lat=lat,
        lng=lng,
        destination=destination,
        date_str=date_str
    )
    return jsonify(weather_data)


@stay_bp.route("/config", methods=["GET"])
def get_stays_config():
    """Return map and weather client configuration keys."""
    return jsonify({
        "google_maps_key": Config.GOOGLE_MAPS_DEMO_KEY,
        "has_google_weather": bool(Config.GOOGLE_WEATHER_API_KEY),
    })
