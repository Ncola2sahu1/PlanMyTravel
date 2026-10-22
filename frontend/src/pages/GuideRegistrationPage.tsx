import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Compass, ShieldCheck, Upload, CheckCircle2, AlertCircle, User,
  Mail, Phone, MapPin, DollarSign, Award, ArrowRight, FileText
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const GuideRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [displayName, setDisplayName] = useState(user?.name || '');
  const [destination, setDestination] = useState('Singapore');
  const [bio, setBio] = useState('');
  const [dailyRate, setDailyRate] = useState<number>(4500);
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');

  // Languages & Specialties
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English']);
  const [langInput, setLangInput] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(['Culinary & Foodie', 'Architectural Heritage']);

  // Photo & ID Document
  const [photoUrl, setPhotoUrl] = useState('/images/guides/guide_1.jpg');
  const [idDocumentUrl, setIdDocumentUrl] = useState('https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const availableDestinations = [
    'Singapore',
    'Kyoto',
    'Amalfi Coast',
    'Swiss Alps',
    'Udaipur & Rajasthan',
    'Thailand',
    'Paris',
    'Bali',
  ];

  const specialtyOptions = [
    'Culinary & Foodie',
    'Architectural Heritage',
    'Zen & Ancient Temples',
    'Mountain Trekking & Hiking',
    'Art & Photography',
    'Royal Lineages & Palaces',
    'Water Sports & Coastal Cruises',
    'Nightlife & Local Secrets',
  ];

  const handleAddLanguage = () => {
    if (langInput.trim() && !selectedLanguages.includes(langInput.trim())) {
      setSelectedLanguages([...selectedLanguages, langInput.trim()]);
      setLangInput('');
    }
  };

  const handleRemoveLanguage = (lang: string) => {
    setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
  };

  const handleToggleSpecialty = (spec: string) => {
    if (selectedSpecialties.includes(spec)) {
      setSelectedSpecialties(selectedSpecialties.filter(s => s !== spec));
    } else {
      setSelectedSpecialties([...selectedSpecialties, spec]);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setIdDocumentUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!displayName.trim()) {
      setError('Please provide your full name.');
      setLoading(false);
      return;
    }
    if (!idDocumentUrl) {
      setError('You must upload government ID proof or guide credential.');
      setLoading(false);
      return;
    }

    try {
      await api.registerGuide({
        display_name: displayName.trim(),
        destination,
        bio: bio.trim(),
        daily_rate: Number(dailyRate),
        languages: selectedLanguages,
        specialties: selectedSpecialties,
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim(),
        photo_url: photoUrl,
        id_document_url: idDocumentUrl,
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit guide registration.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-sage-100 text-forest-800 flex items-center justify-center mx-auto shadow-soft">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-3xl font-medium text-charcoal-900">Application Submitted!</h2>
        <p className="text-sm text-charcoal-600 leading-relaxed font-light">
          Thank you for applying to become a PlanMyTravel certified local guide. Our compliance staff will inspect your government ID proof and verify your destination expertise.
        </p>
        <div className="p-4 rounded-2xl bg-ivory-100 text-xs text-charcoal-700 text-left space-y-1">
          <p><strong>Applicant:</strong> {displayName}</p>
          <p><strong>Service Region:</strong> {destination}</p>
          <p><strong>Status:</strong> Pending Staff Review (Typically takes &lt; 24h)</p>
        </div>
        <div className="flex justify-center gap-4 pt-2">
          <Link
            to="/explore"
            className="px-6 py-2.5 rounded-full bg-forest-800 text-white text-xs font-semibold hover:bg-forest-900 transition-colors shadow-soft"
          >
            Explore Destinations
          </Link>
          <Link
            to="/admin"
            className="px-6 py-2.5 rounded-full bg-charcoal-100 text-charcoal-800 text-xs font-semibold hover:bg-ivory-200 transition-colors"
          >
            Staff Dashboard Review
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-50 text-forest-800 text-xs font-semibold mb-2 border border-sage-200/50">
          <Award className="w-3.5 h-3.5 text-sage-600" />
          <span>PlanMyTravel Concierge Guild</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-charcoal-900">
          Register as a Certified Personal Guide
        </h1>
        <p className="text-sm text-charcoal-500 mt-2 font-light leading-relaxed">
          Lead bespoke private journeys in your home region. Upload your government ID and photograph to undergo administrative verification.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-terracotta-50 border border-terracotta-200 text-terracotta-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-terracotta-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-charcoal-100 p-6 sm:p-10 shadow-soft space-y-6">

        {/* Section 1: Basic Information */}
        <div className="space-y-4">
          <h3 className="font-serif text-lg font-medium text-charcoal-900 border-b border-charcoal-100 pb-2">
            1. Professional Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-500 mb-1">
                Full Name / Display Name *
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Kenjiro Takahashi"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-charcoal-200 focus:border-forest-800 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-500 mb-1">
                Service Region / Destination *
              </label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-charcoal-200 focus:border-forest-800 outline-none bg-white cursor-pointer"
              >
                {availableDestinations.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-500 mb-1">
              Personal Bio & Guiding Credentials *
            </label>
            <textarea
              rows={3}
              required
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe your background, years of experience, unique local access, and why travelers will love exploring with you..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-charcoal-200 focus:border-forest-800 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-500 mb-1">
                Daily Rate (INR ₹) *
              </label>
              <input
                type="number"
                step="500"
                min="1000"
                required
                value={dailyRate}
                onChange={(e) => setDailyRate(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-charcoal-200 focus:border-forest-800 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-500 mb-1">
                Contact Email *
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-charcoal-200 focus:border-forest-800 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-500 mb-1">
                Contact Phone *
              </label>
              <input
                type="tel"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-charcoal-200 focus:border-forest-800 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Languages & Specialties */}
        <div className="space-y-4 pt-4 border-t border-charcoal-100">
          <h3 className="font-serif text-lg font-medium text-charcoal-900 border-b border-charcoal-100 pb-2">
            2. Languages & Guiding Specialties
          </h3>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-500 mb-1">
              Spoken Languages
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={langInput}
                onChange={(e) => setLangInput(e.target.value)}
                placeholder="e.g. French, Japanese, Hindi..."
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-charcoal-200 outline-none"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddLanguage(); } }}
              />
              <button
                type="button"
                onClick={handleAddLanguage}
                className="px-4 py-2 bg-charcoal-900 text-white rounded-xl text-xs font-semibold"
              >
                Add Language
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {selectedLanguages.map(lang => (
                <span
                  key={lang}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ivory-100 text-charcoal-800 text-xs font-medium border border-charcoal-200"
                >
                  <span>{lang}</span>
                  <button type="button" onClick={() => handleRemoveLanguage(lang)} className="text-charcoal-400 hover:text-charcoal-800">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-500 mb-1.5">
              Specialties & Experience Niches (Select all that apply)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {specialtyOptions.map(spec => {
                const isSelected = selectedSpecialties.includes(spec);
                return (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => handleToggleSpecialty(spec)}
                    className={`p-2.5 rounded-xl text-left text-xs transition-all border ${
                      isSelected
                        ? 'bg-sage-100 border-forest-800 text-forest-900 font-semibold'
                        : 'bg-ivory-50 border-charcoal-100 text-charcoal-600 hover:border-charcoal-300'
                    }`}
                  >
                    {spec}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 3: Identity Verification & Photographs */}
        <div className="space-y-4 pt-4 border-t border-charcoal-100">
          <div className="flex items-center justify-between border-b border-charcoal-100 pb-2">
            <h3 className="font-serif text-lg font-medium text-charcoal-900">
              3. Verification & Photography
            </h3>
            <span className="text-[10px] text-charcoal-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-sage-600" />
              <span>Admin / Staff Verification Required</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Guide Photo */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-500">
                Guide Profile Photo *
              </label>
              <div className="flex items-center gap-4">
                <img
                  src={photoUrl}
                  alt="Guide Preview"
                  className="w-16 h-16 rounded-2xl object-cover border border-charcoal-200"
                />
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="text-xs text-charcoal-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-forest-800 file:text-white cursor-pointer"
                  />
                  <p className="text-[10px] text-charcoal-400 mt-1">
                    Clear portrait photograph. Real AI face generated from thispersondoesnotexist used as demo default.
                  </p>
                </div>
              </div>
            </div>

            {/* Government ID Document */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-500">
                Government ID / Guide License *
              </label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-ivory-100 border border-charcoal-200 flex items-center justify-center text-charcoal-500 flex-shrink-0">
                  <FileText className="w-7 h-7 text-forest-800" />
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleIdUpload}
                    className="text-xs text-charcoal-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-charcoal-900 file:text-white cursor-pointer"
                  />
                  <p className="text-[10px] text-charcoal-400 mt-1">
                    Upload Passport, National ID card, or state guide license for staff audit.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-6 border-t border-charcoal-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-charcoal-400 max-w-sm">
            By submitting, you consent to background identity audit and agree to uphold PlanMyTravel luxury hospitality standards.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3 rounded-full bg-forest-800 hover:bg-forest-900 text-ivory-50 text-xs font-semibold shadow-soft transition-all disabled:opacity-50"
          >
            {loading ? 'Submitting Application...' : 'Submit for Staff Approval'}
          </button>
        </div>

      </form>
    </div>
  );
};
