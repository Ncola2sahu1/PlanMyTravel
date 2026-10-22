import os
import secrets
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


class Config:
    """Application configuration with strict validation and safe defaults."""

    # Environment
    FLASK_ENV = os.environ.get("FLASK_ENV", "production")
    IS_PRODUCTION = FLASK_ENV == "production"

    # Secret Key
    SECRET_KEY = os.environ.get("FLASK_SECRET_KEY")
    if not SECRET_KEY:
        if IS_PRODUCTION:
            # Generate a secure ephemeral key if not provided, but log warning
            SECRET_KEY = secrets.token_hex(32)
        else:
            SECRET_KEY = "dev-insecure-secret-key-change-in-production"

    # Turso / LibSQL Database Configuration
    TURSO_DATABASE_URL = os.environ.get("TURSO_DATABASE_URL", "").strip()
    TURSO_AUTH_TOKEN = os.environ.get("TURSO_AUTH_TOKEN", "").strip()

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Session & Security Settings
    USER_SESSION_MINUTES = int(os.environ.get("USER_SESSION_MINUTES", "1440"))
    ADMIN_SESSION_MINUTES = int(os.environ.get("ADMIN_SESSION_MINUTES", "120"))

    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    # Respect SESSION_COOKIE_SECURE env var or auto-enable in production
    raw_cookie_secure = os.environ.get("SESSION_COOKIE_SECURE", "").lower()
    if raw_cookie_secure in ("true", "1", "yes"):
        SESSION_COOKIE_SECURE = True
    elif raw_cookie_secure in ("false", "0", "no"):
        SESSION_COOKIE_SECURE = False
    else:
        SESSION_COOKIE_SECURE = IS_PRODUCTION

    # Admin Bootstrap Credentials
    ADMIN_BOOTSTRAP_EMAIL = os.environ.get("ADMIN_BOOTSTRAP_EMAIL", "admin@planmytravel.com").strip().lower()
    ADMIN_BOOTSTRAP_PASSWORD = os.environ.get("ADMIN_BOOTSTRAP_PASSWORD", "")

    # AI Configuration (Gemini API keys 1 & 2)
    GEMINI_API_KEY_1 = os.environ.get("GEMINI_API_KEY_1", "").strip()
    GEMINI_API_KEY_2 = os.environ.get("GEMINI_API_KEY_2", "").strip()

    # External Discovery & Stays Integrations
    HOTELBEDS_API_KEY = os.environ.get("HOTELBEDS_API_KEY", "").strip()
    HOTELBEDS_API_SECRET = os.environ.get("HOTELBEDS_API_SECRET", "").strip()
    HOTELBEDS_BASE_URL = os.environ.get("HOTELBEDS_BASE_URL", "https://api.test.hotelbeds.com").strip().rstrip("/")
    SERPAPI_API_KEY = os.environ.get("SERPAPI_API_KEY", "").strip()
    GOOGLE_WEATHER_API_KEY = os.environ.get("GOOGLE_WEATHER_API_KEY", "").strip()
    GOOGLE_MAPS_DEMO_KEY = os.environ.get("GOOGLE_MAPS_DEMO_KEY", "").strip()

    # Image Infrastructure
    CLOUDINARY_CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME", "").strip()
    CLOUDINARY_API_KEY = os.environ.get("CLOUDINARY_API_KEY", "").strip()
    CLOUDINARY_API_SECRET = os.environ.get("CLOUDINARY_API_SECRET", "").strip()
    IMAGES_DIR = os.environ.get("IMAGES_DIR", str(BASE_DIR / "uploads"))

    # Payments & Wallet Configuration
    RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "").strip()
    RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "").strip()
    RAZORPAY_WEBHOOK_SECRET = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "").strip()
    RAZORPAY_MODE = os.environ.get("RAZORPAY_MODE", "test").strip().lower()
    PAYMENTS_PROVIDER = os.environ.get("PAYMENTS_PROVIDER", "razorpay").strip().lower()
    WALLET_ENABLED = os.environ.get("WALLET_ENABLED", "true").strip().lower() in ("true", "1", "yes")

    @classmethod
    def get_database_uri_and_connect_args(cls):
        """Build SQLAlchemy connection parameters for Turso / libSQL or fallback SQLite."""
        if cls.TURSO_DATABASE_URL and cls.TURSO_AUTH_TOKEN:
            clean_host = cls.TURSO_DATABASE_URL
            for prefix in ("libsql://", "sqlite+libsql://", "https://", "http://"):
                if clean_host.startswith(prefix):
                    clean_host = clean_host[len(prefix):]
            engine_url = f"sqlite+libsql://{clean_host}?secure=true"
            connect_args = {"auth_token": cls.TURSO_AUTH_TOKEN}
            return engine_url, connect_args

        # Local SQLite fallback
        fallback_path = BASE_DIR / "backend" / "planmytravel.db"
        fallback_path.parent.mkdir(parents=True, exist_ok=True)
        return f"sqlite:///{fallback_path}", {"check_same_thread": False}

