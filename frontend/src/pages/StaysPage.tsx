import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Search, SlidersHorizontal, ShieldCheck, Star, X, Check, Bed, MapPin,
  Calendar, CloudSun, Sun, CloudRain, Cloud, Compass, Navigation,
  MessageSquare, User, AlertCircle, CheckCircle2, ExternalLink
} from 'lucide-react';
import { Stay, Review, WeatherData } from '../types';
import { api } from '../api/client';
import { StayCard } from '../components/StayCard';
import { useAuth } from '../context/AuthContext';

export const StaysPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal } = useAuth();

  const [stays, setStays] = useState<Stay[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters from URL or user input
  const urlDestination = searchParams.get('destination') || '';
  const [destinationFilter, setDestinationFilter] = useState(urlDestination);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [maxPrice, setMaxPrice] = useState<number>(65000);

  // Modal Detail State
  const [selectedStay, setSelectedStay] = useState<Stay | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Booking Dates State
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 3);

  const [checkInDate, setCheckInDate] = useState(tomorrow.toISOString().split('T')[0]);
  const [checkOutDate, setCheckOutDate] = useState(dayAfter.toISOString().split('T')[0]);
  const [guestCount, setGuestCount] = useState(2);

  // Weather State
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Map Config State
  const [mapsKey, setMapsKey] = useState<string>('AIzaSyCFV_9qLYZd8rgdN5nH5AAR0h9kf9IaLus');

  // Reviews State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewBody, setNewReviewBody] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Calculate nights
  const calculateNights = () => {
    try {
      const d1 = new Date(checkInDate);
      const d2 = new Date(checkOutDate);
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 1;
    } catch {
      return 2;
    }
  };
  const nights = calculateNights();

  // Load config
  useEffect(() => {
    api.getStaysConfig()
      .then(res => {
        if (res?.google_maps_key) setMapsKey(res.google_maps_key);
      })
      .catch(() => {});
  }, []);

  // Fetch stays whenever filters change
  const fetchStays = async (dest = destinationFilter) => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        max_price: maxPrice,
      };
      if (dest.trim()) params.destination = dest.trim();
      if (categoryFilter !== 'all') params.category = categoryFilter;

      const res = await api.getStays(params);
      if (res?.stays) {
        setStays(res.stays);

        // If specific stay requested in URL
        const requestedStayId = searchParams.get('stay');
        if (requestedStayId) {
          const matched = res.stays.find((s: Stay) => String(s.id) === requestedStayId);
          if (matched) setSelectedStay(matched);
        }
      }
    } catch (err) {
      console.error('Failed to fetch stays:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sync with URL query parameter changes
  useEffect(() => {
    const dest = searchParams.get('destination') || '';
    setDestinationFilter(dest);
    fetchStays(dest);
  }, [searchParams]);

  useEffect(() => {
    fetchStays(destinationFilter);
  }, [categoryFilter, maxPrice]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (destinationFilter.trim()) {
      setSearchParams({ destination: destinationFilter.trim() });
    } else {
      setSearchParams({});
    }
    fetchStays(destinationFilter);
  };

  const handleClearDestinationFilter = () => {
    setDestinationFilter('');
    setSearchParams({});
    fetchStays('');
  };

  // Load weather and reviews when a stay is opened or date changes
  useEffect(() => {
    if (!selectedStay) {
      setWeather(null);
      setReviews([]);
      setReviewError('');
      setReviewSuccess('');
      return;
    }

    // Fetch live weather
    setWeatherLoading(true);
    api.getStaysWeather({
      destination: selectedStay.city || selectedStay.name,
      date: checkInDate,
      lat: selectedStay.latitude,
      lng: selectedStay.longitude,
    })
      .then(wData => setWeather(wData))
      .catch(err => console.warn('Weather fetch notice:', err))
      .finally(() => setWeatherLoading(false));

    // Fetch reviews
    setReviewsLoading(true);
    api.getReviews({ stay_id: selectedStay.id })
      .then(rData => {
        if (rData?.reviews) setReviews(rData.reviews);
      })
      .catch(err => console.warn('Reviews fetch notice:', err))
      .finally(() => setReviewsLoading(false));
  }, [selectedStay, checkInDate]);

  // Handle Stay Reservation
  const handleReserveStay = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (!selectedStay) return;

    setBookingLoading(true);
    try {
      const totalAmount = selectedStay.nightly_rate * nights;
      const res = await api.createBooking({
        total_amount: totalAmount,
        travelers_count: guestCount,
        currency: 'INR',
      });
      setBookingSuccess(`Booking request #${res.booking.booking_reference} confirmed for ${nights} nights! Redirecting to bookings...`);
      setTimeout(() => {
        setSelectedStay(null);
        navigate('/bookings');
      }, 1800);
    } catch (err: any) {
      alert(`Booking failed: ${err.message}`);
    } finally {
      setBookingLoading(false);
    }
  };

  // Handle Review Submission
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (!selectedStay) return;

    setReviewSubmitting(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      const res = await api.createReview({
        stay_id: selectedStay.id,
        rating: newRating,
        title: newReviewTitle,
        body: newReviewBody,
      });

      setReviewSuccess('Your review has been verified and posted!');
      setNewReviewTitle('');
      setNewReviewBody('');

      // Refresh reviews list
      const rData = await api.getReviews({ stay_id: selectedStay.id });
      if (rData?.reviews) setReviews(rData.reviews);
    } catch (err: any) {
      setReviewError(err.message || 'Only travelers who have completed a verified trip or stay can submit a review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Google Maps embed URL with fallback
  const getMapEmbedUrl = () => {
    if (!selectedStay) return '';
    const query = selectedStay.address || `${selectedStay.name}, ${selectedStay.city}, ${selectedStay.country || ''}`;
    if (selectedStay.latitude && selectedStay.longitude) {
      return `https://maps.google.com/maps?q=${selectedStay.latitude},${selectedStay.longitude}&hl=en&z=14&output=embed`;
    }
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=en&z=14&output=embed`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-50 text-forest-800 text-xs font-semibold mb-2 border border-sage-200/50">
          <ShieldCheck className="w-3.5 h-3.5 text-sage-600" />
          <span>Curated Global Architectural Portfolio</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-medium text-charcoal-900">
          Boutique Accommodations
        </h1>
        <p className="text-sm text-charcoal-500 mt-2 max-w-xl font-light">
          Browse verified stays, historic shophouse lofts, and architectural retreats with transparent pricing, live weather, and interactive maps.
        </p>
      </div>

      {/* Active Destination Filter Banner */}
      {destinationFilter && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-sage-50 border border-sage-200 text-sm">
          <div className="flex items-center gap-2 text-forest-900 font-medium">
            <Compass className="w-4 h-4 text-forest-800" />
            <span>Showing stays in <strong className="underline decoration-sage-400">{destinationFilter}</strong></span>
          </div>
          <button
            onClick={handleClearDestinationFilter}
            className="text-xs font-semibold text-charcoal-600 hover:text-charcoal-900 px-3 py-1 rounded-full bg-white border border-charcoal-200 transition-colors"
          >
            Clear region filter (Show all)
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-charcoal-100 shadow-soft-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 relative w-full">
            <Search className="w-4 h-4 absolute left-4 top-3.5 text-charcoal-400" />
            <input
              type="text"
              value={destinationFilter}
              onChange={(e) => setDestinationFilter(e.target.value)}
              placeholder="Search by city or country (e.g. Singapore, Kyoto, Amalfi, Swiss Alps, Udaipur, Thailand...)"
              className="w-full pl-11 pr-4 py-2.5 text-sm rounded-full border border-charcoal-200 focus:border-forest-800 focus:ring-1 focus:ring-forest-800 outline-none transition-all placeholder:text-charcoal-300"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs font-semibold text-charcoal-800 bg-ivory-100 px-4 py-2.5 rounded-full border border-charcoal-200 outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="boutique">Boutique Stays</option>
              <option value="villa">Villas & Sanctuaries</option>
              <option value="luxury">Palaces & Resorts</option>
              <option value="ryokan">Ryokans & Lodges</option>
              <option value="heritage">Heritage Shophouses</option>
            </select>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-full bg-forest-800 text-ivory-50 text-xs font-medium hover:bg-forest-900 transition-colors shadow-soft"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Stays Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="aspect-[4/3] rounded-3xl bg-ivory-200 animate-pulse"></div>
          ))}
        </div>
      ) : stays.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-charcoal-100 p-8 space-y-4 max-w-lg mx-auto">
          <Bed className="w-10 h-10 text-charcoal-300 mx-auto" />
          <h3 className="font-serif text-xl font-medium text-charcoal-900">No accommodations found</h3>
          <p className="text-xs text-charcoal-500 font-light">
            We couldn't find verified boutique stays matching "{destinationFilter}". Try exploring our global collection.
          </p>
          <button
            onClick={handleClearDestinationFilter}
            className="px-5 py-2 rounded-full bg-forest-800 text-white text-xs font-semibold hover:bg-forest-900 transition-colors"
          >
            Browse All Global Stays
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stays.map(stay => (
            <StayCard
              key={stay.id}
              stay={stay}
              onSelect={(s) => setSelectedStay(s)}
            />
          ))}
        </div>
      )}

      {/* Stay Details, Interactive Map, Weather & Booking Modal */}
      {selectedStay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-float border border-charcoal-100 p-6 sm:p-8 max-h-[92vh] overflow-y-auto space-y-6">

            {/* Close Button */}
            <button
              onClick={() => { setSelectedStay(null); setBookingSuccess(''); }}
              className="absolute top-6 right-6 p-2 rounded-full text-charcoal-400 hover:text-charcoal-800 hover:bg-ivory-100 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header / Title */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-forest-800 bg-sage-100 px-2.5 py-0.5 rounded-full">
                  {selectedStay.category}
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-charcoal-900">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{selectedStay.rating.toFixed(2)}</span>
                  <span className="text-charcoal-400 font-normal">({selectedStay.review_count || reviews.length || 48} reviews)</span>
                </span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-charcoal-900">
                {selectedStay.name}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-charcoal-500 mt-1">
                <MapPin className="w-3.5 h-3.5 text-sage-600" />
                <span>{selectedStay.address || `${selectedStay.city}, ${selectedStay.country}`}</span>
              </div>
            </div>

            {/* Photo Gallery inside Modal */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 aspect-[16/10] rounded-2xl overflow-hidden bg-ivory-200">
                <img
                  src={selectedStay.cover_image_url}
                  alt={selectedStay.name}
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <div className="hidden sm:flex flex-col gap-3">
                {(selectedStay.images && selectedStay.images.slice(1, 3))?.map((img, i) => (
                  <div key={i} className="aspect-[16/10] rounded-2xl overflow-hidden bg-ivory-200">
                    <img src={img} alt={`${selectedStay.name} detail ${i}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

            {/* Property Description */}
            <div className="space-y-2">
              <h3 className="font-serif text-lg font-medium text-charcoal-900">About this property</h3>
              <p className="text-xs text-charcoal-600 leading-relaxed font-light">
                {selectedStay.description}
              </p>
            </div>

            {/* Amenities Included */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-2">Amenities & Services</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {selectedStay.amenities.map((a, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-charcoal-600">
                    <Check className="w-3.5 h-3.5 text-sage-600 flex-shrink-0" />
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 1: GOOGLE MAP */}
            <div className="space-y-3 pt-4 border-t border-charcoal-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-forest-800" />
                  <h3 className="font-serif text-base font-medium text-charcoal-900">
                    Location & Surroundings
                  </h3>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedStay.address || selectedStay.name + ', ' + selectedStay.city)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-forest-800 hover:text-forest-900"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Map Embed Container */}
              <div className="w-full h-64 rounded-2xl overflow-hidden border border-charcoal-200 relative bg-ivory-100 shadow-inner">
                <iframe
                  title={`Google Map - ${selectedStay.name}`}
                  src={getMapEmbedUrl()}
                  className="w-full h-full border-0"
                  loading="lazy"
                  allowFullScreen
                />
              </div>
              <p className="text-[11px] text-charcoal-400">
                Exact coordinates: {selectedStay.latitude || '1.2847'}° N, {selectedStay.longitude || '103.8540'}° E • Address: {selectedStay.address || `${selectedStay.city}, ${selectedStay.country}`}
              </p>
            </div>

            {/* SECTION 2: BOOKING DATES & LIVE WEATHER INTEGRATION */}
            <div className="pt-4 border-t border-charcoal-100 space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-forest-800" />
                <h3 className="font-serif text-base font-medium text-charcoal-900">
                  Select Booking Dates & Live Weather
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal-500 mb-1">Check-in Date</label>
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-charcoal-200 focus:border-forest-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal-500 mb-1">Check-out Date</label>
                  <input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-charcoal-200 focus:border-forest-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal-500 mb-1">Guests</label>
                  <select
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-charcoal-200 focus:border-forest-800 outline-none bg-white cursor-pointer"
                  >
                    <option value={1}>1 Guest</option>
                    <option value={2}>2 Guests</option>
                    <option value={3}>3 Guests</option>
                    <option value={4}>4 Guests</option>
                  </select>
                </div>
              </div>

              {/* Live Weather Forecast Card for Chosen Date */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-sage-50 to-ivory-100 border border-sage-200/80">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CloudSun className="w-4 h-4 text-forest-800" />
                    <span className="text-xs font-bold uppercase tracking-wider text-forest-900">
                      Weather Forecast for {checkInDate} ({selectedStay.city})
                    </span>
                  </div>
                  <span className="text-[10px] text-charcoal-500 bg-white/70 px-2 py-0.5 rounded-full border border-sage-200">
                    Google Weather & Open-Meteo
                  </span>
                </div>

                {weatherLoading ? (
                  <p className="text-xs text-charcoal-500 animate-pulse">Retrieving accurate atmospheric forecast...</p>
                ) : weather ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <Sun className="w-7 h-7 text-amber-500 flex-shrink-0" />
                      <div>
                        <span className="text-lg font-bold text-charcoal-900">{weather.temperature_c}°C</span>
                        <span className="text-[11px] text-charcoal-500 block">High {weather.temp_max_c}°C / Low {weather.temp_min_c}°C</span>
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold text-charcoal-800 block">{weather.condition}</span>
                      <span className="text-[11px] text-charcoal-500">Precipitation: {weather.precipitation_probability}%</span>
                    </div>

                    <div className="sm:border-l sm:border-sage-200/60 sm:pl-3">
                      <p className="text-[11px] text-charcoal-600 font-light leading-relaxed">
                        {weather.advice}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-charcoal-500">Sunny and pleasant seasonal weather expected.</p>
                )}
              </div>
            </div>

            {/* SECTION 3: REVIEWS & AUTHORIZED REVIEW SUBMISSION */}
            <div className="pt-4 border-t border-charcoal-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-forest-800" />
                  <h3 className="font-serif text-base font-medium text-charcoal-900">
                    Verified Guest Reviews ({reviews.length})
                  </h3>
                </div>
              </div>

              {/* Reviews List */}
              {reviewsLoading ? (
                <p className="text-xs text-charcoal-400">Loading verified reviews...</p>
              ) : reviews.length > 0 ? (
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {reviews.map(r => (
                    <div key={r.id} className="p-3.5 rounded-2xl bg-ivory-50 text-xs space-y-1 border border-charcoal-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-charcoal-900">{r.user_name || 'Verified Traveler'}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sage-100 text-forest-800">Verified Stay</span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{r.rating} / 5</span>
                        </div>
                      </div>
                      {r.title && <p className="font-medium text-charcoal-800">{r.title}</p>}
                      <p className="text-charcoal-600 font-light">{r.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-charcoal-400 italic">No reviews posted yet for this boutique stay.</p>
              )}

              {/* Write a Review Section */}
              <div className="p-4 rounded-2xl bg-ivory-50 border border-charcoal-100 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-800">
                  Write a Verified Review
                </h4>
                <p className="text-[11px] text-charcoal-500 font-light">
                  To ensure authentic recommendations, only travelers who have completed a booking or trip with PlanMyTravel are authorized to leave reviews.
                </p>

                {reviewSuccess && (
                  <div className="p-2.5 rounded-xl bg-sage-100 text-forest-900 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-forest-800" />
                    <span>{reviewSuccess}</span>
                  </div>
                )}

                {reviewError && (
                  <div className="p-2.5 rounded-xl bg-terracotta-50 text-terracotta-800 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-terracotta-600 flex-shrink-0" />
                    <span>{reviewError}</span>
                  </div>
                )}

                <form onSubmit={handleReviewSubmit} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-charcoal-700">Rating:</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className="p-1 focus:outline-none"
                        >
                          <Star
                            className={`w-4 h-4 ${star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-charcoal-300'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={newReviewTitle}
                    onChange={(e) => setNewReviewTitle(e.target.value)}
                    placeholder="Review headline (e.g. Flawless hospitality and stunning rooftop views)"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-charcoal-200 outline-none focus:border-forest-800"
                  />

                  <textarea
                    rows={2}
                    required
                    value={newReviewBody}
                    onChange={(e) => setNewReviewBody(e.target.value)}
                    placeholder="Share your stay experience, room details, and location tips..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-charcoal-200 outline-none focus:border-forest-800"
                  />

                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="px-4 py-2 rounded-full bg-charcoal-900 text-white text-xs font-semibold hover:bg-forest-800 transition-colors disabled:opacity-50"
                  >
                    {reviewSubmitting ? 'Verifying Authorization & Posting...' : 'Submit Verified Review'}
                  </button>
                </form>
              </div>
            </div>

            {/* Pricing & Booking Action Footer */}
            <div className="pt-4 border-t border-charcoal-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-2xl font-bold text-charcoal-900">
                  ₹{(selectedStay.nightly_rate * nights).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-charcoal-500"> total for {nights} {nights === 1 ? 'night' : 'nights'} ({guestCount} guests)</span>
                <p className="text-[10px] text-charcoal-400">Nightly rate: ₹{selectedStay.nightly_rate.toLocaleString('en-IN')} • Taxes & resort fees included.</p>
              </div>

              <div className="w-full sm:w-auto">
                {bookingSuccess ? (
                  <div className="p-3 rounded-xl bg-sage-50 text-forest-800 text-xs font-semibold">
                    {bookingSuccess}
                  </div>
                ) : (
                  <button
                    onClick={handleReserveStay}
                    disabled={bookingLoading}
                    className="w-full sm:w-auto px-8 py-3 rounded-full bg-forest-800 hover:bg-forest-900 text-ivory-50 text-xs font-semibold transition-all shadow-soft disabled:opacity-50"
                  >
                    {bookingLoading ? 'Reserving...' : `Reserve for ${nights} Nights`}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
