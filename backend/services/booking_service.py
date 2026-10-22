import uuid
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from backend.database import db
from backend.models.booking import Booking, Expense
from backend.services.wallet_service import WalletService

logger = logging.getLogger(__name__)


class BookingService:
    """Manages booking lifecycle, payments, and provider confirmation states."""

    @staticmethod
    def create_booking(user_id: int, total_amount: float, trip_id: Optional[str] = None, contact_name: str = "", contact_email: str = "", contact_phone: str = "", travelers_count: int = 1, currency: str = "INR") -> Booking:
        """Initialize a new booking in pending state."""
        ref = f"PMT-{uuid.uuid4().hex[:8].upper()}"
        booking = Booking(
            booking_reference=ref,
            user_id=user_id,
            trip_id=trip_id,
            status="pending",
            travelers_count=max(1, travelers_count),
            total_amount=round(total_amount, 2),
            currency=currency,
            contact_name=contact_name,
            contact_email=contact_email,
            contact_phone=contact_phone,
            payment_status="unpaid",
        )
        db.session.add(booking)
        db.session.commit()
        return booking

    @classmethod
    def pay_booking_via_wallet(cls, user_id: int, booking_id: int) -> Dict[str, Any]:
        """Pay for an existing booking using available wallet balance."""
        booking = Booking.query.filter_by(id=booking_id, user_id=user_id).first()
        if not booking:
            raise ValueError("Booking not found or access denied")

        if booking.payment_status == "paid":
            return {"success": True, "message": "Booking is already paid", "booking": booking.to_dict()}

        desc = f"Payment for Booking #{booking.booking_reference}"
        debit_result = WalletService.debit_wallet(
            user_id=user_id,
            amount_rupees=booking.total_amount,
            description=desc,
            booking_id=booking.id,
            trip_id=booking.trip_id,
            reference=f"pay_bk_{booking.id}_{int(datetime.now(timezone.utc).timestamp())}",
        )

        booking.payment_status = "paid"
        booking.status = "confirmed"
        booking.updated_at = datetime.now(timezone.utc).isoformat()

        # Log expense record
        expense = Expense(
            user_id=user_id,
            trip_id=booking.trip_id,
            booking_id=booking.id,
            title=f"Booking {booking.booking_reference}",
            amount=booking.total_amount,
            currency=booking.currency,
            category="Booking",
            spent_at=datetime.now(timezone.utc).isoformat(),
        )
        db.session.add(expense)
        db.session.commit()

        return {
            "success": True,
            "message": "Payment successful and booking confirmed",
            "booking": booking.to_dict(),
            "wallet_balance": debit_result["balance"],
        }

