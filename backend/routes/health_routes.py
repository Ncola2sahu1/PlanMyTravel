from flask import Blueprint, jsonify
from backend.config import Config
from backend.services.hotel_service import HotelService
from backend.database import db
from sqlalchemy import text

health_bp = Blueprint("health_bp", __name__)


@health_bp.route("/api/health", methods=["GET"])
def health_check():
    """Application readiness and external integrations health check."""
    status = {
        "status": "healthy",
        "service": "PlanMyTravel API",
        "environment": Config.FLASK_ENV,
        "database": "unknown",
        "integrations": {
            "gemini_ai": bool(Config.GEMINI_API_KEY_1 or Config.GEMINI_API_KEY_2),
            "hotelbeds": bool(Config.HOTELBEDS_API_KEY and Config.HOTELBEDS_API_SECRET),
            "serpapi": bool(Config.SERPAPI_API_KEY),
            "cloudinary": bool(Config.CLOUDINARY_CLOUD_NAME and Config.CLOUDINARY_API_KEY),
            "razorpay": bool(Config.RAZORPAY_KEY_ID),
            "wallet_enabled": Config.WALLET_ENABLED,
        }
    }

    # Test database connectivity
    try:
        db.session.execute(text("SELECT 1")).scalar()
        status["database"] = "connected"
    except Exception as e:
        status["database"] = f"error: {str(e)[:100]}"
        status["status"] = "degraded"

    return jsonify(status)

