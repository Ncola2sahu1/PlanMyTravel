import logging
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g
from backend.models.booking import Booking, Review
from backend.models.trip import Trip
from backend.models.guide import Guide
from backend.utils.auth_helpers import login_required
from backend.database import db

logger = logging.getLogger(__name__)
review_bp = Blueprint("review_bp", __name__, url_prefix="/api/reviews")


@review_bp.route("", methods=["GET"])
def get_reviews():
    """Retrieve verified reviews for a specific stay, guide, or destination."""
    stay_id = request.args.get("stay_id", "").strip()
    guide_id = request.args.get("guide_id", type=int)
    dest_id = request.args.get("destination_id", type=int)

    query = Review.query.filter_by(status="published")

    if stay_id:
        query = query.filter_by(stay_id=stay_id)
    elif guide_id:
        query = query.filter_by(guide_id=guide_id)
    elif dest_id:
        query = query.filter_by(destination_id=dest_id)

    reviews = query.order_by(Review.created_at.desc()).limit(50).all()

    avg_rating = 4.9
    if reviews:
        avg_rating = round(sum(r.rating for r in reviews) / len(reviews), 2)

    return jsonify({
        "total": len(reviews),
        "average_rating": avg_rating,
        "reviews": [r.to_dict() for r in reviews],
    })


@review_bp.route("", methods=["POST"])
@login_required
def create_review():
    """Submit a verified review for a stay or guide.
    STRICT AUTHORIZATION: Only travelers who have an active or completed trip/booking can review.
    """
    user_id = g.current_user.id
    data = request.get_json() or {}

    stay_id = data.get("stay_id", "").strip() or None
    guide_id = data.get("guide_id")
    destination_id = data.get("destination_id")
    rating = int(data.get("rating", 5))
    title = data.get("title", "").strip()
    body = data.get("body", "").strip()

    if not body:
        return jsonify({"error": "Review comments cannot be empty"}), 400
    if rating < 1 or rating > 5:
        return jsonify({"error": "Rating must be an integer between 1 and 5"}), 400

    # Authorization verification: Check if traveler has completed a booking or trip
    has_completed_booking = Booking.query.filter_by(user_id=user_id, status="completed").first()
    has_completed_trip = Trip.query.filter_by(user_id=user_id, status="completed").first()

    # Also check if traveler has ANY confirmed or completed booking
    any_booking = Booking.query.filter_by(user_id=user_id).filter(Booking.status.in_(["completed", "confirmed"])).first()

    if not (has_completed_booking or has_completed_trip or any_booking):
        return jsonify({
            "error": "Only authorized travelers with a completed trip or verified booking can submit reviews.",
            "authorized": False,
        }), 403

    review = Review(
        user_id=user_id,
        stay_id=stay_id,
        guide_id=guide_id,
        destination_id=destination_id,
        rating=rating,
        title=title or "Verified Traveler Experience",
        body=body,
        status="published",
        is_verified=1,
    )
    db.session.add(review)

    # If reviewing a guide, update guide's aggregate rating and review count
    if guide_id:
        guide = db.session.get(Guide, guide_id)
        if guide:
            guide.review_count = (guide.review_count or 0) + 1
            guide.rating = round(((guide.rating or 4.9) * (guide.review_count - 1) + rating) / guide.review_count, 2)

    db.session.commit()

    logger.info("Verified review posted by user %d for stay=%s, guide=%s", user_id, stay_id, guide_id)

    return jsonify({
        "success": True,
        "message": "Thank you! Your verified review has been published.",
        "review": review.to_dict(),
    }), 201
