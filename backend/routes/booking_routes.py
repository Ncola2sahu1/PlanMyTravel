from flask import Blueprint, request, jsonify, g
from backend.models.booking import Booking
from backend.services.booking_service import BookingService
from backend.utils.auth_helpers import login_required

booking_bp = Blueprint("booking_bp", __name__, url_prefix="/api/bookings")


@booking_bp.route("", methods=["GET"])
@login_required
def list_user_bookings():
    """Retrieve bookings for authenticated traveler."""
    bookings = Booking.query.filter_by(user_id=g.current_user.id).order_by(Booking.created_at.desc()).all()
    return jsonify({
        "bookings": [b.to_dict() for b in bookings],
        "total": len(bookings),
    })


@booking_bp.route("", methods=["POST"])
@login_required
def create_booking():
    """Create a new travel booking or reservation request."""
    data = request.get_json() or {}
    total_amount = float(data.get("total_amount", 0.0))
    trip_id = data.get("trip_id")
    travelers_count = int(data.get("travelers_count", 1))
    contact_name = data.get("contact_name") or g.current_user.name
    contact_email = data.get("contact_email") or g.current_user.email
    contact_phone = data.get("contact_phone") or g.current_user.phone
    currency = data.get("currency", "INR")

    if total_amount <= 0:
        return jsonify({"error": "Booking amount must be greater than zero"}), 400

    booking = BookingService.create_booking(
        user_id=g.current_user.id,
        total_amount=total_amount,
        trip_id=trip_id,
        contact_name=contact_name,
        contact_email=contact_email,
        contact_phone=contact_phone,
        travelers_count=travelers_count,
        currency=currency,
    )

    return jsonify({
        "message": "Booking request created",
        "booking": booking.to_dict(),
    }), 201


@booking_bp.route("/<int:booking_id>/pay-wallet", methods=["POST"])
@login_required
def pay_with_wallet(booking_id: int):
    """Atomically deduct funds from user's Trip Wallet to confirm the booking."""
    try:
        result = BookingService.pay_booking_via_wallet(
            user_id=g.current_user.id,
            booking_id=booking_id
        )
        return jsonify(result)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Payment error: {e}"}), 500

