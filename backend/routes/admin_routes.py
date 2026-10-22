import json
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g
from backend.models.destination import Destination, DestinationImage
from backend.models.user import User, AdminUser, AdminAuditLog
from backend.models.trip import Trip
from backend.models.booking import Booking
from backend.models.media import MediaAsset
from backend.services.cloudinary_service import CloudinaryService
from backend.utils.auth_helpers import admin_required, log_admin_action
from backend.database import db

admin_bp = Blueprint("admin_bp", __name__, url_prefix="/api/admin")
cloudinary_service = CloudinaryService()


@admin_bp.route("/stats", methods=["GET"])
@admin_required
def get_stats():
    """Retrieve platform analytics overview for administrators."""
    return jsonify({
        "destinations_count": Destination.query.count(),
        "users_count": User.query.count(),
        "trips_count": Trip.query.count(),
        "bookings_count": Booking.query.count(),
        "audit_logs_count": AdminAuditLog.query.count(),
    })


@admin_bp.route("/destinations", methods=["GET"])
@admin_required
def admin_list_destinations():
    """List all destinations including unpublished ones."""
    dests = Destination.query.order_by(Destination.created_at.desc()).all()
    return jsonify({
        "destinations": [d.to_dict(include_details=True) for d in dests],
        "total": len(dests),
    })


@admin_bp.route("/destinations", methods=["POST"])
@admin_required
def admin_create_destination():
    """Create a new destination."""
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    slug = data.get("slug", "").strip() or name.lower().replace(" ", "-")

    if not name:
        return jsonify({"error": "Destination name is required"}), 400

    existing = Destination.query.filter_by(slug=slug).first()
    if existing:
        return jsonify({"error": f"A destination with slug '{slug}' already exists"}), 409

    dest = Destination(
        name=name,
        slug=slug,
        country=data.get("country", ""),
        city=data.get("city", ""),
        region=data.get("region", ""),
        tagline=data.get("tagline", ""),
        category=data.get("category", "Cultural"),
        short_description=data.get("short_description", ""),
        description=data.get("description", ""),
        hero_image_url=data.get("hero_image_url", ""),
        image_url=data.get("hero_image_url", ""),
        rating=float(data.get("rating", 4.8)),
        is_featured=1 if data.get("is_featured") else 0,
        is_published=1 if data.get("is_published", True) else 0,
        best_season=data.get("best_season", ""),
        cost_currency=data.get("cost_currency", "INR"),
        estimated_cost_min=float(data.get("estimated_cost_min", 30000)),
        estimated_cost_max=float(data.get("estimated_cost_max", 120000)),
        ideal_stay=data.get("ideal_stay", "3-5 days"),
        weather_info=data.get("weather_info", ""),
    )
    dest.travel_styles = data.get("travel_styles", [])
    dest.attractions = data.get("attractions", [])
    dest.activities = data.get("activities", [])

    db.session.add(dest)
    db.session.commit()

    log_admin_action("create_destination", entity_type="destinations", entity_id=str(dest.id), details={"name": dest.name})
    return jsonify({"message": "Destination created", "destination": dest.to_dict(include_details=True)}), 201


@admin_bp.route("/destinations/<int:dest_id>", methods=["PUT"])
@admin_required
def admin_update_destination(dest_id: int):
    """Update destination content, publishing state, or imagery."""
    dest = db.session.get(Destination, dest_id)
    if not dest:
        return jsonify({"error": "Destination not found"}), 404

    data = request.get_json() or {}
    if "name" in data:
        dest.name = data["name"].strip()
    if "country" in data:
        dest.country = data["country"].strip()
    if "city" in data:
        dest.city = data["city"].strip()
    if "tagline" in data:
        dest.tagline = data["tagline"]
    if "category" in data:
        dest.category = data["category"]
    if "description" in data:
        dest.description = data["description"]
    if "hero_image_url" in data:
        dest.hero_image_url = data["hero_image_url"]
        dest.image_url = data["hero_image_url"]
    if "is_featured" in data:
        dest.is_featured = 1 if data["is_featured"] else 0
    if "is_published" in data:
        dest.is_published = 1 if data["is_published"] else 0
    if "rating" in data:
        dest.rating = float(data["rating"])
    if "travel_styles" in data:
        dest.travel_styles = data["travel_styles"]
    if "attractions" in data:
        dest.attractions = data["attractions"]
    if "activities" in data:
        dest.activities = data["activities"]

    dest.updated_at = datetime.now(timezone.utc).isoformat()
    db.session.commit()

    log_admin_action("update_destination", entity_type="destinations", entity_id=str(dest.id))
    return jsonify({"message": "Destination updated", "destination": dest.to_dict(include_details=True)})


@admin_bp.route("/destinations/<int:dest_id>", methods=["DELETE"])
@admin_required
def admin_delete_destination(dest_id: int):
    """Delete a destination and cascading images."""
    dest = db.session.get(Destination, dest_id)
    if not dest:
        return jsonify({"error": "Destination not found"}), 404

    name = dest.name
    db.session.delete(dest)
    db.session.commit()

    log_admin_action("delete_destination", entity_type="destinations", entity_id=str(dest_id), details={"name": name})
    return jsonify({"message": f"Destination '{name}' deleted successfully"})


@admin_bp.route("/audit-logs", methods=["GET"])
@admin_required
def get_audit_logs():
    """Retrieve administrative action audit logs."""
    logs = AdminAuditLog.query.order_by(AdminAuditLog.created_at.desc()).limit(100).all()
    return jsonify({
        "audit_logs": [log.to_dict() for log in logs],
        "total": len(logs),
    })


@admin_bp.route("/media/upload", methods=["POST"])
@admin_required
def upload_media():
    """Upload media file to Cloudinary and persist MediaAsset."""
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "Empty filename"}), 400

    try:
        upload_result = cloudinary_service.upload_image(file)
        asset = MediaAsset(
            uploaded_by=g.current_admin.id,
            url=upload_result["url"],
            filename=file.filename,
            original_filename=file.filename,
            storage_provider=upload_result.get("provider", "cloudinary"),
            cloudinary_public_id=upload_result.get("public_id"),
        )
        db.session.add(asset)
        db.session.commit()

        log_admin_action("upload_media", entity_type="media_assets", entity_id=str(asset.id))
        return jsonify({"message": "Media uploaded", "asset": asset.to_dict()}), 201
    except Exception as e:
        return jsonify({"error": f"Upload failed: {e}"}), 500
