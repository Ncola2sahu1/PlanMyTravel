import React, { useState, useEffect } from 'react';
import { Bed, CheckCircle2, AlertCircle, Wallet as WalletIcon, Clock, ArrowRight } from 'lucide-react';
import { Booking } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export const BookingsPage: React.FC = () => {
  const { isAuthenticated, openAuthModal, walletBalance, refreshWallet } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchBookings = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await api.getBookings();
      if (res?.bookings) setBookings(res.bookings);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchBookings();
    else setLoading(false);
  }, [isAuthenticated]);

  const handlePayFromWallet = async (booking: Booking) => {
    setError('');
    setMessage('');
    setPayingId(booking.id);

    try {
      const res = await api.payBookingViaWallet(booking.id);
      setMessage(`Booking #${booking.booking_reference} confirmed and paid from Trip Wallet!`);
      await fetchBookings();
      await refreshWallet();
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please check wallet balance.');
    } finally {
      setPayingId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-ivory-100 text-charcoal-500 flex items-center justify-center mx-auto">
          <Bed className="w-6 h-6 stroke-[1.5]" />
        </div>
        <h2 className="font-serif text-2xl font-medium text-charcoal-900">Your Travel Bookings</h2>
        <p className="text-xs text-charcoal-500 leading-relaxed font-light">
          Sign in to review confirmed reservations and complete payment from your Trip Wallet.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-2.5 rounded-full bg-forest-800 text-ivory-50 text-xs font-semibold hover:bg-forest-900 transition-colors shadow-soft"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Title */}
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-forest-800 block mb-1">Reservations</span>
        <h1 className="font-serif text-3xl sm:text-5xl font-medium text-charcoal-900">
          My Bookings
        </h1>
        <p className="text-sm text-charcoal-500 mt-2 font-light">
          Track travel reservations, provider confirmations, and seamless wallet payment status.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-sage-50 border border-sage-200 text-forest-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-sage-600" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-terracotta-50 border border-terracotta-200 text-terracotta-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-terracotta-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Bookings List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-32 rounded-3xl bg-ivory-200 animate-pulse"></div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-charcoal-100 p-8 space-y-4 max-w-lg mx-auto shadow-soft-sm">
            <Bed className="w-10 h-10 text-charcoal-400 mx-auto stroke-[1.5]" />
            <h3 className="font-serif text-xl font-medium text-charcoal-900">No bookings yet</h3>
            <p className="text-xs text-charcoal-500 font-light">
              Explore boutique stays or build an AI concierge itinerary to initiate your first booking.
            </p>
            <Link
              to="/stays"
              className="inline-block px-5 py-2.5 rounded-full bg-forest-800 text-white text-xs font-semibold"
            >
              Browse Stays
            </Link>
          </div>
        ) : (
          bookings.map(booking => {
            const isPaid = booking.payment_status === 'paid';
            const isPaying = payingId === booking.id;
            const canAfford = walletBalance >= booking.total_amount;

            return (
              <div
                key={booking.id}
                className="bg-white rounded-3xl border border-charcoal-100 p-6 sm:p-8 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-6"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-charcoal-900 bg-ivory-100 px-2.5 py-0.5 rounded-md">
                      #{booking.booking_reference}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isPaid ? 'bg-sage-100 text-forest-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {booking.payment_status}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl font-medium text-charcoal-900">
                    Boutique Stay & Experience Reservation
                  </h3>

                  <div className="flex items-center gap-4 text-xs text-charcoal-400">
                    <span>{booking.travelers_count} Traveler(s)</span>
                    <span>•</span>
                    <span>Booked {new Date(booking.booked_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 border-t sm:border-t-0 border-charcoal-100/70 pt-4 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-charcoal-400 uppercase tracking-wider block">Total Amount</span>
                    <span className="font-serif text-2xl font-bold text-charcoal-900">
                      ₹{booking.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {!isPaid ? (
                    <button
                      onClick={() => handlePayFromWallet(booking)}
                      disabled={isPaying}
                      className="px-5 py-2.5 rounded-full bg-forest-800 hover:bg-forest-900 text-ivory-50 text-xs font-semibold flex items-center gap-2 shadow-soft transition-all disabled:opacity-50"
                    >
                      <WalletIcon className="w-3.5 h-3.5 text-sage-300" />
                      <span>{isPaying ? 'Processing...' : 'Pay from Wallet'}</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-50 text-forest-800 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sage-600" />
                      <span>Confirmed</span>
                    </span>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

