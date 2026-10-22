from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, session, g
from backend.models.user import User, AdminUser
from backend.services.wallet_service import WalletService
from backend.utils.auth_helpers import generate_csrf_token, login_required, admin_required, log_admin_action
from backend.database import db

auth_bp = Blueprint("auth_bp", __name__, url_prefix="/api/auth")


@auth_bp.route("/csrf", methods=["GET"])
def get_csrf():
    """Retrieve per-session CSRF token."""
    token = generate_csrf_token()
    return jsonify({"csrf_token": token})


@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new traveler account and initialize their Trip Wallet."""
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()
    name = data.get("name", "").strip()

    if not email or "@" not in email:
        return jsonify({"error": "Please provide a valid email address"}), 400
    if not password or len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    existing = User.query.filter_by(email=email).first()
    if existing:
        return jsonify({"error": "An account with this email already exists"}), 409

    user = User(
        email=email,
        name=name or email.split("@")[0],
        full_name=name or email.split("@")[0],
        role="traveler",
        is_active=1,
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    # Automatically create user's initial wallet
    wallet = WalletService.get_or_create_wallet(user.id)

    # Establish session
    session["user_id"] = user.id
    session["user_email"] = user.email
    session["user_role"] = user.role
    session["user_login_time"] = datetime.now(timezone.utc).timestamp()
    session.permanent = True

    return jsonify({
        "message": "Account created successfully",
        "user": user.to_dict(),
        "wallet_balance": round(wallet.balance or 0.0, 2),
        "csrf_token": generate_csrf_token(),
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate traveler."""
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401
    if not user.is_active:
        return jsonify({"error": "This account is inactive. Please contact support."}), 403

    # Ensure wallet exists
    wallet = WalletService.get_or_create_wallet(user.id)

    session["user_id"] = user.id
    session["user_email"] = user.email
    session["user_role"] = user.role
    session["user_login_time"] = datetime.now(timezone.utc).timestamp()
    session.permanent = True

    return jsonify({
        "message": "Signed in successfully",
        "user": user.to_dict(),
        "wallet_balance": round(wallet.balance or 0.0, 2),
        "csrf_token": generate_csrf_token(),
    })


@auth_bp.route("/logout", methods=["POST"])
def logout():
    """Clear user session."""
    session.clear()
    token = generate_csrf_token()
    return jsonify({"message": "Signed out successfully", "csrf_token": token})


@auth_bp.route("/me", methods=["GET"])
def current_user_info():
    """Check active authentication status and return user profile."""
    user_id = session.get("user_id")
    admin_id = session.get("admin_id")

    res = {
        "authenticated": False,
        "user": None,
        "is_admin": False,
        "csrf_token": generate_csrf_token(),
    }

    if user_id:
        user = db.session.get(User, user_id)
        if user and user.is_active:
            wallet = WalletService.get_or_create_wallet(user.id)
            res["authenticated"] = True
            res["user"] = user.to_dict()
            res["wallet_balance"] = round(wallet.balance or 0.0, 2)

    if admin_id:
        admin = db.session.get(AdminUser, admin_id)
        if admin and admin.is_active:
            res["is_admin"] = True
            res["admin"] = admin.to_dict()

    return jsonify(res)


@auth_bp.route("/admin/login", methods=["POST"])
def admin_login():
    """Authenticate administrator."""
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    if not email or not password:
        return jsonify({"error": "Admin credentials required"}), 400

    admin = AdminUser.query.filter_by(email=email).first()
    if not admin or not admin.check_password(password):
        return jsonify({"error": "Invalid administrator credentials"}), 401
    if not admin.is_active:
        return jsonify({"error": "Administrator account is inactive"}), 403

    admin.last_login_at = datetime.now(timezone.utc).isoformat()
    db.session.commit()

    session["admin_id"] = admin.id
    session["admin_email"] = admin.email
    session["admin_role"] = admin.role
    session["admin_login_time"] = datetime.now(timezone.utc).timestamp()
    session.permanent = True

    log_admin_action("admin_login", entity_type="admin_users", entity_id=str(admin.id))

    return jsonify({
        "message": "Admin session established",
        "admin": admin.to_dict(),
        "csrf_token": generate_csrf_token(),
    })


@auth_bp.route("/admin/logout", methods=["POST"])
def admin_logout():
    """Clear administrator session."""
    session.pop("admin_id", None)
    session.pop("admin_email", None)
    session.pop("admin_role", None)
    session.pop("admin_login_time", None)
    token = generate_csrf_token()
    return jsonify({"message": "Admin session terminated", "csrf_token": token})
