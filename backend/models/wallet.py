from datetime import datetime, timezone
from backend.database import db


class Wallet(db.Model):
    __tablename__ = "wallets"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    balance = db.Column(db.Float, nullable=False, default=0.0)
    currency = db.Column(db.String(10), nullable=False, default="INR")
    created_at = db.Column(db.String(50), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())
    updated_at = db.Column(db.String(50), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat(), onupdate=lambda: datetime.now(timezone.utc).isoformat())

    # Relationships
    transactions = db.relationship("WalletTransaction", backref="wallet", lazy="dynamic", cascade="all, delete-orphan", order_by="WalletTransaction.created_at.desc()")

    @property
    def balance_paise(self) -> int:
        """Convert float balance to integer paise (minor units) to avoid floating-point drift."""
        return int(round((self.balance or 0.0) * 100))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "balance": round(self.balance or 0.0, 2),
            "currency": self.currency,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


class WalletTransaction(db.Model):
    __tablename__ = "wallet_transactions"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    wallet_id = db.Column(db.Integer, db.ForeignKey("wallets.id", ondelete="CASCADE"), nullable=False, index=True)
    trip_id = db.Column(db.String(64), db.ForeignKey("trips.id", ondelete="SET NULL"), nullable=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True)
    type = db.Column(db.String(50), nullable=False)  # credit, debit, topup, refund, payment
    transaction_type = db.Column(db.String(50), nullable=True)
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), nullable=False, default="completed")  # pending, completed, failed, refunded
    currency = db.Column(db.String(10), nullable=False, default="INR")
    description = db.Column(db.Text, nullable=True)
    reference = db.Column(db.String(150), nullable=True, unique=True, index=True)  # razorpay_payment_id or internal ref
    created_at = db.Column(db.String(50), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self):
        return {
            "id": self.id,
            "wallet_id": self.wallet_id,
            "trip_id": self.trip_id,
            "booking_id": self.booking_id,
            "type": self.type or self.transaction_type,
            "amount": round(self.amount or 0.0, 2),
            "status": self.status,
            "currency": self.currency,
            "description": self.description,
            "reference": self.reference,
            "created_at": self.created_at,
        }

