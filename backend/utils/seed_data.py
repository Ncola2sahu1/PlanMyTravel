import logging
import json
from datetime import datetime, timezone
from backend.database import db
from backend.models.destination import Destination, DestinationImage, Experience

logger = logging.getLogger(__name__)

CURATED_DESTINATIONS = [
    {
        "name": "Singapore",
        "slug": "singapore",
        "country": "Singapore",
        "city": "Singapore",
        "region": "Southeast Asia",
        "tagline": "A futuristic city immersed in lush tropical rainforest.",
        "category": "Urban Sanctuary",
        "short_description": "Where visionary architecture meets century-old botanical gardens and Michelin-starred hawker fare.",
        "description": "Singapore is a masterclass in urban equilibrium. From the bio-domes of Gardens by the Bay to the conserved Peranakan shophouses of Katong, this island nation blends ultra-modern design with deep Southeast Asian heritage.",
        "hero_image_url": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1600&q=80",
        "rating": 4.9,
        "is_featured": 1,
        "is_published": 1,
        "best_season": "Year-round (Nov - Jan festive lights)",
        "cost_currency": "INR",
        "estimated_cost_min": 75000,
        "estimated_cost_max": 180000,
        "ideal_stay": "4-5 days",
        "weather_info": "Tropical climate with warm temperatures (26-32°C) and refreshing evening showers.",
        "travel_styles": ["Architecture", "Culinary", "Luxury", "Family"],
        "attractions": [
            {"name": "Gardens by the Bay & Cloud Forest", "category": "Nature & Design", "rating": 4.9},
            {"name": "Jewel Changi Rain Vortex", "category": "Architectural Icon", "rating": 4.8},
            {"name": "Marina Bay Sands SkyPark", "category": "Panoramic Views", "rating": 4.7},
            {"name": "National Gallery Singapore", "category": "Art & History", "rating": 4.8}
        ],
        "activities": [
            "Sunset cocktail walk along the Helix Bridge",
            "Midnight hawker feast at Lau Pa Sat",
            "Morning cycling trail across East Coast Park"
        ],
        "images": [
            "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1506351421178-63b52a2d2562?auto=format&fit=crop&w=1200&q=80"
        ]
    },
    {
        "name": "Kyoto",
        "slug": "kyoto",
        "country": "Japan",
        "city": "Kyoto",
        "region": "East Asia",
        "tagline": "Timeless Zen temples, cedar forests, and matcha culture.",
        "category": "Cultural Destination",
        "short_description": "Walk through meditative bamboo groves, historic geisha districts, and thousand-year-old shinto shrines.",
        "description": "Kyoto preserves the artistic soul of Japan. Once the imperial capital, it offers over a thousand Buddhist temples, tranquil stone gardens, and an unparalleled culinary heritage centered on seasonal kaiseki dining.",
        "hero_image_url": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1600&q=80",
        "rating": 4.95,
        "is_featured": 1,
        "is_published": 1,
        "best_season": "Spring (Cherry Blossoms) or Autumn (Foliage)",
        "cost_currency": "INR",
        "estimated_cost_min": 90000,
        "estimated_cost_max": 220000,
        "ideal_stay": "5-6 days",
        "weather_info": "Mild spring and autumn; warm summers and crisp, quiet winters.",
        "travel_styles": ["History & Heritage", "Zen & Relaxation", "Culinary", "Photography"],
        "attractions": [
            {"name": "Fushimi Inari Taisha", "category": "Torii Shrine", "rating": 4.9},
            {"name": "Arashiyama Bamboo Grove", "category": "Natural Forest", "rating": 4.8},
            {"name": "Kinkaku-ji (Golden Pavilion)", "category": "Zen Temple", "rating": 4.9},
            {"name": "Gion Historic District", "category": "Traditional District", "rating": 4.7}
        ],
        "activities": [
            "Private matcha tea ceremony with a master in Higashiyama",
            "Early morning dawn walk through the Torii gates of Fushimi",
            "Traditional Kaiseki dinner beside the Kamo River"
        ],
        "images": [
            "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=80"
        ]
    },
    {
        "name": "Amalfi Coast",
        "slug": "amalfi-coast",
        "country": "Italy",
        "city": "Positano",
        "region": "Southern Europe",
        "tagline": "Cliffside pastel villages and Mediterranean azure waters.",
        "category": "Coastal Getaway",
        "short_description": "Dramatic limestone cliffs cascading into shimmering waters, scented with wild rosemary and lemon orchards.",
        "description": "The Amalfi Coast is one of the world's most breathtaking coastal stretches. Winding cliffside roads connect pastel-hued villages, cliff-top villas, and hidden pebble coves.",
        "hero_image_url": "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1600&q=80",
        "rating": 4.92,
        "is_featured": 1,
        "is_published": 1,
        "best_season": "May to October",
        "cost_currency": "INR",
        "estimated_cost_min": 120000,
        "estimated_cost_max": 280000,
        "ideal_stay": "4-6 days",
        "weather_info": "Warm Mediterranean sunshine with pleasant sea breezes.",
        "travel_styles": ["Romantic", "Coastal", "Culinary", "Luxury"],
        "attractions": [
            {"name": "Path of the Gods (Sentiero degli Dei)", "category": "Scenic Trail", "rating": 4.9},
            {"name": "Positano Cliffside Beach", "category": "Coastal Village", "rating": 4.8},
            {"name": "Ravello Villa Rufolo Gardens", "category": "Botanical Heritage", "rating": 4.9}
        ],
        "activities": [
            "Private wooden gozzo boat cruise along hidden sea caves",
            "Limoncello tasting in a cliffside lemon grove",
            "Al fresco dining on handmade scialatielli pasta overlooking the Tyrrhenian Sea"
        ],
        "images": [
            "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80"
        ]
    },
    {
        "name": "Swiss Alps",
        "slug": "swiss-alps",
        "country": "Switzerland",
        "city": "Zermatt & Grindelwald",
        "region": "Central Europe",
        "tagline": "Glacial peaks, alpine meadows, and crisp mountain serenity.",
        "category": "Nature Retreat",
        "short_description": "Pure mountain air, crystal-clear alpine lakes, and panoramic cogwheel rail journeys.",
        "description": "Home to the iconic Matterhorn and Eiger peaks, the Swiss Alps offer unparalleled alpine splendor in every season. Experience world-class hiking, chalet living, and serene mountain vistas.",
        "hero_image_url": "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1600&q=80",
        "rating": 4.96,
        "is_featured": 1,
        "is_published": 1,
        "best_season": "June - September (Hiking) or Dec - March (Snow)",
        "cost_currency": "INR",
        "estimated_cost_min": 140000,
        "estimated_cost_max": 320000,
        "ideal_stay": "5-7 days",
        "weather_info": "Invigorating mountain climate with crisp sunny days and cool evenings.",
        "travel_styles": ["Nature & Wildlife", "Adventure", "Wellness & Spa", "Scenic Rail"],
        "attractions": [
            {"name": "Gornergrat Matterhorn Viewpoint", "category": "Alpine Peak", "rating": 4.9},
            {"name": "Lake Oeschinen", "category": "Glacial Lake", "rating": 4.9},
            {"name": "Jungfraujoch Top of Europe", "category": "Glacier Observatory", "rating": 4.8}
        ],
        "activities": [
            "Scenic glacier express train through towering mountain passes",
            "Hiking through wild edelweiss meadows to alpine dairy chalets",
            "Evening fondue and fireside thermal spa relaxation"
        ],
        "images": [
            "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
        ]
    },
    {
        "name": "Udaipur & Rajasthan",
        "slug": "udaipur-rajasthan",
        "country": "India",
        "city": "Udaipur",
        "region": "South Asia",
        "tagline": "Lakeside palaces, royal heritage, and romantic courtyards.",
        "category": "Cultural Destination",
        "short_description": "Known as the City of Lakes, with marble palaces shimmering against the Aravalli hills.",
        "description": "Udaipur is celebrated for its majestic Lake Pichola, intricate marble courtyards, and grand Mewar architecture. Enjoy royal hospitality, vibrant textile bazaars, and golden sunset boat rides.",
        "hero_image_url": "https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=1600&q=80",
        "rating": 4.88,
        "is_featured": 1,
        "is_published": 1,
        "best_season": "October to March",
        "cost_currency": "INR",
        "estimated_cost_min": 25000,
        "estimated_cost_max": 90000,
        "ideal_stay": "3-4 days",
        "weather_info": "Pleasant, sunny winter days with cool starry nights.",
        "travel_styles": ["Royal Heritage", "Romantic", "Architecture", "Art & Craft"],
        "attractions": [
            {"name": "City Palace of Udaipur", "category": "Palace Complex", "rating": 4.9},
            {"name": "Jag Mandir Island", "category": "Lake Heritage", "rating": 4.8},
            {"name": "Saheliyon-ki-Bari", "category": "Historic Gardens", "rating": 4.7}
        ],
        "activities": [
            "Private sunset boat cruise on Lake Pichola past illuminated palaces",
            "Artisan miniature painting workshop in an old city haveli",
            "Rooftop Rajasthani thali dining overlooking the lake"
        ],
        "images": [
            "https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80"
        ]
    }
]


def seed_database_if_needed():
    """Populate initial curated destinations and images if database is empty or sparse."""
    try:
        count = Destination.query.count()
        if count >= 4:
            return

        logger.info("Seeding curated destinations into database (current count: %d)...", count)
        for d in CURATED_DESTINATIONS:
            existing = Destination.query.filter_by(slug=d["slug"]).first()
            if existing:
                continue

            dest = Destination(
                name=d["name"],
                slug=d["slug"],
                country=d["country"],
                city=d["city"],
                region=d["region"],
                tagline=d["tagline"],
                category=d["category"],
                short_description=d["short_description"],
                description=d["description"],
                hero_image_url=d["hero_image_url"],
                image_url=d["hero_image_url"],
                rating=d["rating"],
                is_featured=d["is_featured"],
                is_published=d["is_published"],
                best_season=d["best_season"],
                cost_currency=d["cost_currency"],
                estimated_cost_min=d["estimated_cost_min"],
                estimated_cost_max=d["estimated_cost_max"],
                ideal_stay=d["ideal_stay"],
                weather_info=d["weather_info"],
            )
            dest.travel_styles = d["travel_styles"]
            dest.attractions = d["attractions"]
            dest.activities = d["activities"]
            db.session.add(dest)
            db.session.flush()

            for order, img_url in enumerate(d.get("images", [])):
                img = DestinationImage(
                    destination_id=dest.id,
                    image_url=img_url,
                    alt_text=f"{dest.name} scenic landscape",
                    sort_order=order,
                )
                db.session.add(img)

        db.session.commit()
        logger.info("Destination database seeded successfully.")
    except Exception as e:
        logger.error("Error during destination seeding: %s", e)
        db.session.rollback()

