# PlanMyTravel — AI Travel Discovery & Itinerary Concierge

PlanMyTravel is an AI-powered travel discovery and itinerary-planning platform inspired by the minimalist elegance, editorial photography, and browsing experience of Airbnb.

Rather than a generic chatbot or static mockup, PlanMyTravel is an end-to-end platform featuring:
- **Editorial Destination Discovery:** Curated regions, seasonal guides, and practical travel facts.
- **Boutique Accommodations:** Live integration with the official Hotelbeds Content & Booking test environment and architectural stay portfolios.
- **AI Travel Concierge:** Multi-preference intake generating structured, bookable itineraries covering flights, airport transfers, stays, and day-by-day schedules with transparent budget breakdowns.
- **Interactive Trip Customization:** Ability to regenerate individual days or swap single activity slots without discarding the rest of the plan.
- **Trip Wallet & Ledger:** Digital stored-value wallet built with Razorpay standard checkout, minor-unit (paise) financial arithmetic, and cryptographic signature verification.
- **Production Backend & Database:** Flask application factory with persistent relational data stored in Turso (libSQL).
- **Administrative Console:** Role-based access control, destination CRUD, Cloudinary media asset management, and tamper-evident audit logs.

---

## 1. System Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                    React + TypeScript SPA                     │
│    (Vite, Tailwind CSS, Lucide Icons, React Router v7)        │
└───────────────▲───────────────────────────────▲───────────────┘
                │ /api                          │ Static Assets
┌───────────────▼───────────────────────────────▼───────────────┐
│                      Flask REST Backend                       │
│        (Application Factory, Blueprint Architecture)          │
├───────────────┬───────────────────────────────┬───────────────┤
│ Auth & CSRF   │ Services Layer                │ Admin Engine  │
│ - SessionAuth │ - AITravelService (Gemini)    │ - Audit Logs  │
│ - Rate Limits │ - HotelService (Hotelbeds)    │ - Media Mgmt  │
│ - CSRF Tokens │ - FlightService (Schedules)   │ - Publishing  │
│ - PBKDF2 Hash │ - Payment & Wallet (Razorpay) │               │
└───────▲───────┴───────────────▲───────────────┴───────▲───────┘
        │                       │                       │
┌───────▼───────┐       ┌───────▼───────┐       ┌───────▼───────┐
│ Turso libSQL  │       │ Google Gemini │       │ Cloudinary &  │
│  (SQLAlchemy) │       │ 3.5/3.8 Flash │       │ Hotelbeds API │
└───────────────┘       └───────────────┘       └───────────────┘
```

---

## 2. Key Capabilities & User Journeys

### A. AI Travel Concierge
- Progressive preference intake: origin, destination, duration, travelers, budget, travel styles (Cultural, Romantic, Nature, Luxury, Adventure), pace, and accessibility requirements.
- Generates structured JSON itineraries covering:
  1. **Flights:** Outbound and return carrier schedules, flight numbers, timings, duration, luggage, and booking portal links.
  2. **Transfers:** Airport express links, metro IC passes, and pre-booked taxis with estimated rates.
  3. **Stays:** Verified boutique hotels and lofts with nightly rates, amenities, and photo galleries.
  4. **Daily Schedules:** Morning, afternoon, and evening slots with geographically sequenced landmarks and estimated admission costs.
  5. **Transparent Budget:** Complete itemized budget (flights, hotels, transit, activities, food, contingency fund) and remaining budget status.
- **Granular Controls:**
  - Regenerate single days independently without altering the rest of the trip.
  - Swap individual morning, afternoon, or evening activities.
  - Save and duplicate itineraries to user profile.

### B. Accommodation Discovery (Hotelbeds Integration)
- Connects directly to the official Hotelbeds Content API (`api.test.hotelbeds.com`).
- Generates dynamic SHA-256 cryptographic signatures (`apiKey + secret + timestamp`).
- Enriches properties with high-resolution imagery from the Hotelbeds Giata CDN (`photos.hotelbeds.com`).
- Clearly differentiates between live verified test inventory and curated editorial portfolios.

### C. Trip Wallet & Ledger
- Operates in developer test mode for Indian travel purchases.
- **Integer Minor-Unit Math:** All monetary balances and transactions are calculated in paise (integer minor units) to prevent floating-point drift.
- **Cryptographic Verification:** Server-side HMAC-SHA256 signature verification on Razorpay payment callbacks.
- **Idempotency:** Unique payment references prevent duplicate crediting from repeated webhooks or network retries.
- **Atomic Balance Deductions:** Direct payment for stay bookings from available wallet balance with transaction rollbacks.

### D. Administrative Dashboard
- Super administrator access with session expiration and CSRF defense.
- Destination management: Create, update, publish/draft toggle, and delete.
- Cloudinary media uploader with automated CDN optimization.
- Comprehensive audit trail logging every administrative mutation.

---

## 3. Technology Stack

- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS 3, React Router v7, Lucide Icons.
- **Backend:** Python 3.13, Flask 3.1, Flask-SQLAlchemy 3.1, Werkzeug.
- **Database:** Turso (libSQL) via `sqlalchemy-libsql` and `libsql-experimental`.
- **AI Engine:** Google Gemini (dual-key failover with `gemini-3.5-flash`, `gemini-3.5-flash-lite`, and `gemini-3.8-flash`).
- **Payments:** Razorpay Python SDK (Standard Checkout & Webhooks).
- **Stays Provider:** Hotelbeds API (Test Environment).
- **Image Infrastructure:** Cloudinary API.
- **Testing:** Pytest.

---

## 4. Environment Configuration

Copy `.env.example` to `.env` and populate your credentials. **Never commit `.env` to version control.**

```bash
cp .env.example .env
```

| Variable | Description |
| :--- | :--- |
| `TURSO_DATABASE_URL` | Turso database connection URL (`libsql://...`) |
| `TURSO_AUTH_TOKEN` | Turso JWT authentication token |
| `GEMINI_API_KEY_1` | Primary Google Gemini API key |
| `GEMINI_API_KEY_2` | Secondary fallback Google Gemini API key |
| `FLASK_SECRET_KEY` | 64-character secret key for secure session cookies |
| `FLASK_ENV` | `development` or `production` |
| `SESSION_COOKIE_SECURE`| `true` in production (HTTPS), `false` for local HTTP |
| `USER_SESSION_MINUTES` | Traveler session validity (default: 1440 mins / 24h) |
| `ADMIN_SESSION_MINUTES`| Administrator session validity (default: 120 mins) |
| `ADMIN_BOOTSTRAP_EMAIL`| Pre-configured administrator email |
| `ADMIN_BOOTSTRAP_PASSWORD`| Bootstrap administrator password |
| `HOTELBEDS_API_KEY` | Hotelbeds API key |
| `HOTELBEDS_API_SECRET` | Hotelbeds API secret |
| `HOTELBEDS_BASE_URL` | Hotelbeds base endpoint (default: `https://api.test.hotelbeds.com`) |
| `SERPAPI_API_KEY` | SerpAPI key for destination search insights |
| `CLOUDINARY_CLOUD_NAME`| Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET`| Cloudinary API secret |
| `RAZORPAY_KEY_ID` | Razorpay Key ID (`rzp_test_...`) |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay Webhook HMAC secret |
| `RAZORPAY_MODE` | `test` or `live` |
| `WALLET_ENABLED` | `true` or `false` |

---

## 5. Local Development Setup

### 1. Install Backend Dependencies
```bash
pip install -r requirements.txt
```

### 2. Install & Build Frontend
```bash
cd frontend
npm install
npm run build
cd ..
```

### 3. Start Application Server
```bash
# Serves both REST API on /api and React SPA on /*
python3 wsgi.py
```
Open [http://localhost:5000](http://localhost:5000) in your browser.

### 4. Running Frontend in Hot-Reload Dev Mode (Optional)
```bash
cd frontend
npm run dev
```
Vite runs on [http://localhost:5173](http://localhost:5173) and proxies `/api` requests to Flask on port 5000.

---

## 6. Automated Testing

Run the full pytest automated test suite:

```bash
python3 -m pytest tests/test_api.py -v
```

The test suite validates:
- Health and readiness endpoints.
- Destination discovery and query filtering.
- Hotelbeds and flight schedule provider adapters.
- CSRF validation blocking unsigned mutations.
- Traveler registration, login, session persistence, and logout.
- Razorpay order creation in minor units.
- Idempotent wallet crediting (rejecting duplicate transactions).
- Insufficient balance enforcement.
- Booking creation and atomic deduction from Trip Wallet.
- Strict ownership isolation (preventing User B from reading User A's trips).
- Administrator authorization defense and audit logging.

---

## 7. Serverless Deployment (Vercel)

The repository is configured for serverless deployment using `vercel.json` and `api/index.py`:

1. Import the repository into Vercel.
2. In Project Settings > Environment Variables, provide all required secrets matching `.env.example`.
3. Set the Framework Preset to **Vite** or **Other**.
4. Deploy! Vercel routes `/api/*` to the Python serverless function and static assets to the Vite build directory.

---

## 8. Security & Regulatory Disclosures

- **Credentials:** No secrets or private keys are bundled into frontend assets or source code.
- **Stored-Value Wallets:** The Trip Wallet operates in developer test mode. Operating a live stored-value wallet in India requires applicable regulatory compliance, prepaid payment instrument (PPI) approvals, and payment aggregator onboarding.
- **Provider Accuracy:** Hotel inventory from the Hotelbeds test environment is clearly designated as simulated test data.

