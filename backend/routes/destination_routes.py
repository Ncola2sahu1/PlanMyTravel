from flask import Blueprint, request, jsonify
from backend.models.destination import Destination, Experience
from backend.services.hotel_service import HotelService
from backend.services.serp_service import SerpService
from backend.database import db

dest_bp = Blueprint("dest_bp", __name__, url_prefix="/api/destinations")
hotel_service = HotelService()
serp_service = SerpService()


@dest_bp.route("", methods=["GET"])
def list_destinations():
    """Browse destinations with keyword search, category, style, and budget filtering."""
    q = request.args.get("q", "").strip().lower()
    category = request.args.get("category", "").strip()
    style = request.args.get("style", "").strip()
    max_budget = request.args.get("max_budget", type=float)
    featured = request.args.get("featured", "").lower() in ("true", "1")
    sort_by = request.args.get("sort", "rating_desc")

    query = Destination.query.filter_by(is_published=1)

    if featured:
        query = query.filter_by(is_featured=1)

    if category:
        query = query.filter(Destination.category.ilike(f"%{category}%"))

    if q:
        search_filter = (
            Destination.name.ilike(f"%{q}%") |
            Destination.country.ilike(f"%{q}%") |
            Destination.city.ilike(f"%{q}%") |
            Destination.tagline.ilike(f"%{q}%") |
            Destination.description.ilike(f"%{q}%")
        )
        query = query.filter(search_filter)

    if max_budget:
        query = query.filter(Destination.estimated_cost_min <= max_budget)

    # Sorting
    if sort_by == "rating_desc":
        query = query.order_by(Destination.rating.desc())
    elif sort_by == "cost_asc":
        query = query.order_by(Destination.estimated_cost_min.asc())
    elif sort_by == "cost_desc":
        query = query.order_by(Destination.estimated_cost_min.desc())
    elif sort_by == "name_asc":
        query = query.order_by(Destination.name.asc())
    else:
        query = query.order_by(Destination.rating.desc())

    destinations = query.all()

    # Filter in memory for json list fields like travel_styles if specified
    if style:
        destinations = [d for d in destinations if any(style.lower() in s.lower() for s in d.travel_styles)]

    return jsonify({
        "total": len(destinations),
        "destinations": [d.to_dict(include_details=False) for d in destinations],
    })


@dest_bp.route("/<identifier>", methods=["GET"])
def get_destination_details(identifier: str):
    """Retrieve full destination details, high-res gallery, attractions, and related stays."""
    dest = None
    if identifier.isdigit():
        dest = db.session.get(Destination, int(identifier))
    if not dest:
        dest = Destination.query.filter_by(slug=identifier).first()
    if not dest:
        dest = Destination.query.filter(Destination.name.ilike(identifier)).first()

    if not dest:
        return jsonify({"error": "Destination not found"}), 404

    data = dest.to_dict(include_details=True)

    # Attach related stays from hotel service
    data["related_stays"] = hotel_service.search_hotels(destination=dest.name, limit=4)

    # Optionally enrich with Serp insights if available
    serp_notes = serp_service.search_destination_insights(dest.name)
    if serp_notes:
        data["insights"] = serp_notes

    return jsonify(data)


@dest_bp.route("/categories", methods=["GET"])
def get_categories():
    """Retrieve unique destination categories and popular travel styles."""
    categories = [
        {"id": "all", "label": "All Destinations", "icon": "compass"},
        {"id": "weekend", "label": "Weekend Escapes", "icon": "coffee"},
        {"id": "nature", "label": "Nature Retreats", "icon": "trees"},
        {"id": "coastal", "label": "Coastal Getaways", "icon": "waves"},
        {"id": "cultural", "label": "Cultural Gems", "icon": "landmark"},
        {"id": "adventure", "label": "Affordable Adventures", "icon": "mountain"},
    ]
    styles = [
        "Cultural & Heritage", "Nature & Wildlife", "Relaxation & Wellness",
        "Culinary & Wine", "Romantic", "Family Friendly", "Adventure", "Architecture"
    ]
    return jsonify({
        "categories": categories,
        "travel_styles": styles,
    })
