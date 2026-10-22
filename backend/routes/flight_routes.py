from flask import Blueprint, request, jsonify
from backend.services.flight_service import FlightService

flight_bp = Blueprint("flight_bp", __name__, url_prefix="/api/flights")
flight_service = FlightService()


@flight_bp.route("/search", methods=["GET"])
def search_flights():
    """Discover flight options and realistic schedules between origin and destination."""
    origin = request.args.get("origin", "New Delhi (DEL)")
    dest = request.args.get("destination", "Singapore (SIN)")
    date = request.args.get("date", "")
    travelers = request.args.get("travelers", default=1, type=int)

    results = flight_service.search_flights(origin=origin, destination=dest, date=date, travelers=travelers)
    return jsonify(results)

