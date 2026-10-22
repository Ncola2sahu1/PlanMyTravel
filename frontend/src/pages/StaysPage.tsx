import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, ShieldCheck, Star, X, Check, Bed, MapPin } from 'lucide-react';
import { Stay } from '../types';
import { api } from '../api/client';
import { StayCard } from '../components/StayCard';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const StaysPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuth();
  const [stays, setStays] = useState<Stay[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [destinationFilter, setDestinationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [maxPrice, setMaxPrice] = useState<number>(35000);

  // Modal Detail State
  const [selectedStay, setSelectedStay] = useState<Stay | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const fetchStays = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        max_price: maxPrice,
      };
      if (destinationFilter.trim()) params.destination = destinationFilter.trim();
      if (categoryFilter !== 'all') params.category = categoryFilter;

      const res = await api.getStays(params);
      if (res?.stays) setStays(res.stays);
    } catch (err) {
      console.error('Failed to fetch stays:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStays();
  }, [categoryFilter, maxPrice]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStays();
  };

  const handleReserveStay = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (!selectedStay) return;

    setBookingLoading(true);
    try {
      const res = await api.createBooking({
        total_amount: selectedStay.nightly_rate * 2, // 2 nights default
        travelers_count: 2,
        currency: 'INR',
      });
      setBookingSuccess(`Booking request #${res.booking.booking_reference} created! Redirecting to bookings...`);
      setTimeout(() => {
        setSelectedStay(null);
        navigate('/bookings');
      }, 1500);
    } catch (err: any) {
      alert(`Booking failed: ${err.message}`);
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-50 text-forest-800 text-xs font-semibold mb-2 border border-sage-200/50">
          <ShieldCheck className="w-3.5 h-3.5 text-sage-600" />
          <span>Integrated with Hotelbeds Test Environment</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-medium text-charcoal-900">
          Boutique Accommodations
        </h1>
        <p className="text-sm text-charcoal-500 mt-2 max-w-xl font-light">
          Browse verified stays, historic shophouse lofts, and architectural retreats with transparent pricing.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-charcoal-100 shadow-soft-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 relative w-full">
            <Search className="w-4 h-4 absolute left-4 top-3.5 text-charcoal-400" />
            <input
              type="text"
              value={destinationFilter}
              onChange={(e) => setDestinationFilter(e.target.value)}
              placeholder="Search by city or country (e.g. Singapore, Bangkok...)"
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
              <option value="villa">Villas & Pavilions</option>
              <option value="luxury">Luxury Resorts</option>
              <option value="loft">Lofts & Apartments</option>
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

      {/* Stay Details & Reservation Modal */}
      {selectedStay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-float border border-charcoal-100 p-6 sm:p-8 max-h-[90vh] overflow-y-auto">

            <button
              onClick={() => { setSelectedStay(null); setBookingSuccess(''); }}
              className="absolute top-6 right-6 p-2 rounded-full text-charcoal-400 hover:text-charcoal-800 hover:bg-ivory-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Photo Gallery inside Modal */}
            <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-ivory-200 mb-6">
              <img
                src={selectedStay.cover_image_url}
                alt={selectedStay.name}
                className="w-full h-full object-cover object-center"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-charcoal-400 uppercase tracking-widest">{selectedStay.category}</span>
                <span className="flex items-center gap-1 text-xs font-bold text-charcoal-900">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{selectedStay.rating.toFixed(1)}</span>
                </span>
              </div>

              <h3 className="font-serif text-2xl font-medium text-charcoal-900">
                {selectedStay.name}
              </h3>

              <div className="flex items-center gap-1.5 text-xs text-charcoal-500">
                <MapPin className="w-3.5 h-3.5 text-sage-600" />
                <span>{selectedStay.city}, {selectedStay.country || 'Global'}</span>
              </div>

              <p className="text-xs text-charcoal-600 leading-relaxed font-light">
                {selectedStay.description}
              </p>

              {/* Amenities */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-2">Amenities Included</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {selectedStay.amenities.map((a, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-charcoal-600">
                      <Check className="w-3.5 h-3.5 text-sage-600" />
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing & Booking Action */}
              <div className="pt-6 border-t border-charcoal-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-2xl font-bold text-charcoal-900">
                    ₹{selectedStay.nightly_rate.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-charcoal-400"> / night</span>
                  <p className="text-[10px] text-charcoal-400">Taxes and resort fees calculated at checkout.</p>
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
                      className="w-full sm:w-auto px-6 py-3 rounded-full bg-forest-800 hover:bg-forest-900 text-ivory-50 text-xs font-semibold transition-all shadow-soft disabled:opacity-50"
                    >
                      {bookingLoading ? 'Reserving...' : 'Reserve Stay (2 Nights)'}
                    </button>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

