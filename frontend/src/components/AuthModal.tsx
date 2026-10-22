import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Mail, Lock, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export const AuthModal: React.FC = () => {
  const navigate = useNavigate();
  const { authModalOpen, authModalTab, closeAuthModal, refreshAuth } = useAuth();
  const [tab, setTab] = useState<'login' | 'register' | 'admin'>(authModalTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setTab(authModalTab);
    setError('');
  }, [authModalTab, authModalOpen]);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'register') {
        await api.register({ email, password, name });
      } else if (tab === 'login') {
        await api.login({ email, password });
      } else if (tab === 'admin') {
        await api.adminLogin({ email, password });
      }
      await refreshAuth();
      closeAuthModal();
      setEmail('');
      setPassword('');
      setName('');

      // If logged in as staff, navigate directly to Admin Console
      if (tab === 'admin') {
        navigate('/admin');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-float border border-charcoal-100 p-8 overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-6 right-6 p-2 rounded-full text-charcoal-400 hover:text-charcoal-800 hover:bg-ivory-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <h3 className="font-serif text-2xl font-medium text-charcoal-900">
            {tab === 'register' && 'Create your account'}
            {tab === 'login' && 'Welcome back'}
            {tab === 'admin' && 'Administrator sign in'}
          </h3>
          <p className="text-xs text-charcoal-500 mt-1">
            {tab === 'register' && 'Save personalized itineraries and manage your Trip Wallet.'}
            {tab === 'login' && 'Sign in to access your saved trips, bookings, and wallet.'}
            {tab === 'admin' && 'Access the administrative control center.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-ivory-100 rounded-full mb-6">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all ${
              tab === 'login' ? 'bg-white text-charcoal-900 shadow-soft-sm' : 'text-charcoal-500 hover:text-charcoal-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all ${
              tab === 'register' ? 'bg-white text-charcoal-900 shadow-soft-sm' : 'text-charcoal-500 hover:text-charcoal-800'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => { setTab('admin'); setError(''); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all ${
              tab === 'admin' ? 'bg-forest-800 text-white shadow-soft-sm' : 'text-charcoal-500 hover:text-charcoal-800'
            }`}
          >
            Staff
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-terracotta-50 border border-terracotta-200 text-terracotta-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-terracotta-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-medium text-charcoal-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-charcoal-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Taylor Traveler"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-charcoal-200 focus:border-forest-800 focus:ring-1 focus:ring-forest-800 outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-charcoal-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-charcoal-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={tab === 'admin' ? 'admin@planmytravel.com' : 'you@example.com'}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-charcoal-200 focus:border-forest-800 focus:ring-1 focus:ring-forest-800 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-charcoal-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-charcoal-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-charcoal-200 focus:border-forest-800 focus:ring-1 focus:ring-forest-800 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-forest-800 hover:bg-forest-900 text-ivory-50 font-medium text-sm flex items-center justify-center gap-2 shadow-soft hover:shadow-soft-lg transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <span>{tab === 'register' ? 'Create Account' : tab === 'admin' ? 'Access Admin Console' : 'Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-charcoal-100 text-center text-xs text-charcoal-400">
          <p className="flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-sage-600" />
            <span>Secure session with HttpOnly credentials</span>
          </p>
        </div>

      </div>
    </div>
  );
};
