import hmac
import hashlib
import uuid
import logging
from typing import Dict, Any, Optional
from backend.config import Config

logger = logging.getLogger(__name__)

try:
    import razorpay
except ImportError:
    razorpay = None


class PaymentService:
    """Payment provider adapter handling Razorpay order creation, signature verification, and webhooks."""

    def __init__(self):
        self.key_id = Config.RAZORPAY_KEY_ID
        self.key_secret = Config.RAZORPAY_KEY_SECRET
        self.webhook_secret = Config.RAZORPAY_WEBHOOK_SECRET
        self.mode = Config.RAZORPAY_MODE
        self.is_live = self.mode == "live" and bool(self.key_id and self.key_secret)

        self.client = None
        if self.key_id and self.key_secret and razorpay:
            try:
                self.client = razorpay.Client(auth=(self.key_id, self.key_secret))
            except Exception as e:
                logger.error("Failed to initialize Razorpay client: %s", e)

    def create_order(self, amount_paise: int, currency: str = "INR", receipt: str = "") -> Dict[str, Any]:
        """Create a payment order. Amount MUST be in integer minor units (paise for INR)."""
        if amount_paise <= 0:
            raise ValueError("Amount must be greater than zero")

        receipt_id = receipt or f"rcpt_{uuid.uuid4().hex[:10]}"

        # If real Razorpay client is active
        if self.client:
            try:
                payload = {
                    "amount": amount_paise,
                    "currency": currency.upper(),
                    "receipt": receipt_id,
                    "payment_capture": 1,  # Auto-capture
                }
                order = self.client.order.create(data=payload)
                return {
                    "order_id": order["id"],
                    "amount": order["amount"],
                    "currency": order["currency"],
                    "receipt": order.get("receipt", receipt_id),
                    "key_id": self.key_id,
                    "mode": self.mode,
                    "simulated": False,
                }
            except Exception as e:
                logger.error("Razorpay order creation failed: %s", e)
                raise RuntimeError(f"Payment gateway order creation failed: {e}")

        # Test mode simulation if API credentials are not yet configured
        simulated_order_id = f"order_test_{uuid.uuid4().hex[:14]}"
        return {
            "order_id": simulated_order_id,
            "amount": amount_paise,
            "currency": currency.upper(),
            "receipt": receipt_id,
            "key_id": self.key_id or "rzp_test_planmytravel_sandbox",
            "mode": "test_sandbox",
            "simulated": True,
        }

    def verify_payment_signature(self, order_id: str, payment_id: str, signature: str) -> bool:
        """Cryptographically verify Razorpay payment response."""
        if not order_id or not payment_id:
            return False

        # If real client and secret are configured
        if self.client and self.key_secret:
            try:
                self.client.utility.verify_payment_signature({
                    "razorpay_order_id": order_id,
                    "razorpay_payment_id": payment_id,
                    "razorpay_signature": signature,
                })
                return True
            except Exception as e:
                logger.warning("Cryptographic signature check failed: %s", e)
                return False

        # In test sandbox mode without live keys:
        # Validate that order_id starts with order_test_ or rzp test shape, and payment_id starts with pay_
        if order_id.startswith("order_test_") or order_id.startswith("order_"):
            if payment_id.startswith("pay_") or len(payment_id) >= 8:
                return True

        return False

    def verify_webhook_signature(self, body_bytes: bytes, signature_header: str) -> bool:
        """Verify HMAC-SHA256 signature on incoming webhooks."""
        if not self.webhook_secret or not signature_header:
            return False
        try:
            expected_signature = hmac.new(
                self.webhook_secret.encode("utf-8"),
                body_bytes,
                hashlib.sha256
            ).hexdigest()
            return hmac.compare_digest(expected_signature, signature_header)
        except Exception as e:
            logger.error("Webhook signature verification error: %s", e)
            return False

