import logging
import json
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g, session
from backend.models.guide import Guide
from backend.models.user import User
from backend.database import db

logger = logging.getLogger(__name__)
guide_bp = Blueprint("guide_bp", __name__, url_prefix="/api/guides")


@guide_bp.route("", methods=["GET"])
def list_guides():
    """Retrieve approved and verified personal local guides, optionally filtered by destination."""
    dest = request.args.get("destination", "").strip()

    query = Guide.query.filter(
        (Guide.approval_status == "approved") | (Guide.is_verified == 1)
    )

    if dest:
        # Match against destination or general
        query = query.filter(Guide.destination.ilike(f"%{dest}%"))

    guides = query.order_by(Guide.rating.desc(), Guide.review_count.desc()).all()

    # If no specific destination matched or query was empty, return all approved guides
    if not guides and dest:
        # Return fallback approved guides
        guides = Guide.query.filter(
            (Guide.approval_status == "approved") | (Guide.is_verified == 1)
        ).limit(6).all()

    return jsonify({
        "total": len(guides),
        "destination": dest or "All Destinations",
        "guides": [g.to_dict() for g in guides],
    })


@guide_bp.route("/<int:guide_id>", methods=["GET"])
def get_guide_details(guide_id: int):
    """Retrieve individual guide profile."""
    guide = db.session.get(Guide, guide_id)
    if not guide:
        return jsonify({"error": "Guide not found"}), 404

    return jsonify({
        "guide": guide.to_dict()
    })


@guide_bp.route("/register", methods=["POST"])
def register_guide():
    """Register a new candidate to become a personal local guide.
    Submissions enter 'pending' state awaiting administrator / staff verification of ID proof.
    """
    data = request.get_json() or {}

    display_name = data.get("display_name", "").strip()
    destination = data.get("destination", "").strip()
    bio = data.get("bio", "").strip()
    languages = data.get("languages", ["English"])
    specialties = data.get("specialties", ["Culture & Sightseeing"])
    daily_rate = float(data.get("daily_rate", 4500.0))
    contact_email = data.get("contact_email", "").strip().lower()
    contact_phone = data.get("contact_phone", "").strip()
    photo_url = data.get("photo_url", "").strip()
    id_document_url = data.get("id_document_url", "").strip()

    if not display_name:
        return jsonify({"error": "Full name is required"}), 400
    if not destination:
        return jsonify({"error": "Destination / service region is required"}), 400
    if not contact_email or "@" not in contact_email:
        return jsonify({"error": "Valid email address is required"}), 400
    if not id_document_url:
        return jsonify({"error": "Government ID or professional guide license proof is required for verification"}), 400

    # Fallback photo if none provided
    if not photo_url:
        photo_url = "/images/guides/guide_1.jpg"

    # Link with logged in user if available
    user_id = session.get("user_id")

    guide = Guide(
        user_id=user_id,
        display_name=display_name,
        destination=destination,
        bio=bio or f"Professional local guide dedicated to curated private experiences in {destination}.",
        daily_rate=daily_rate,
        photo_url=photo_url,
        id_document_url=id_document_url,
        approval_status="pending",
        is_verified=0,
        is_active=1,
        contact_email=contact_email,
        contact_phone=contact_phone,
        rating=5.0,
        review_count=0,
    )
    guide.languages = languages if isinstance(languages, list) else [languages]
    guide.specialties = specialties if isinstance(specialties, list) else [specialties]

    db.session.add(guide)
    db.session.commit()

    logger.info("New guide registration submitted: %s for destination %s", display_name, destination)

    return jsonify({
        "success": True,
        "message": "Your guide application has been successfully submitted! Our staff will verify your ID document and activate your profile.",
        "guide": guide.to_dict(),
    }), 201
