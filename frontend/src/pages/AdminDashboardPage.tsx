import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Trash2, Edit3, Image as ImageIcon, FileText, CheckCircle2, AlertCircle, Upload, Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import { Destination, AdminAuditLog } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const AdminDashboardPage: React.FC = () => {
  const { admin, isAdmin, isLoading, refreshAuth, openAuthModal } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'destinations' | 'media' | 'logs'>('destinations');
  const [loading, setLoading] = useState(true);

  // Inline staff login state
  const [inlineEmail, setInlineEmail] = useState('');
  const [inlinePassword, setInlinePassword] = useState('');
  const [inlineLoading, setInlineLoading] = useState(false);
  const [inlineError, setInlineError] = useState('');

  // Create / Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDest, setEditingDest] = useState<Destination | null>(null);
  const [formName, setFormName] = useState('');
  const [formCountry, setFormCountry] = useState('');
  const [formCategory, setFormCategory] = useState('Cultural & Nature');
  const [formTagline, setFormTagline] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formHeroImage, setFormHeroImage] = useState('');
  const [formCostMin, setFormCostMin] = useState(45000);
  const [formCostMax, setFormCostMax] = useState(120000);
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formIsPublished, setFormIsPublished] = useState(true);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccessUrl, setUploadSuccessUrl] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadAdminData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const [statsRes, destRes, logsRes] = await Promise.all([
        api.getAdminStats(),
        api.adminListDestinations(),
        api.adminGetAuditLogs(),
      ]);
      setStats(statsRes);
      if (destRes?.destinations) setDestinations(destRes.destinations);
      if (logsRes?.audit_logs) setAuditLogs(logsRes.audit_logs);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadAdminData();
    else setLoading(false);
  }, [isAdmin]);

  const openCreateModal = () => {
    setEditingDest(null);
    setFormName('');
    setFormCountry('');
    setFormCategory('Cultural & Nature');
    setFormTagline('');
    setFormDesc('');
    setFormHeroImage('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80');
    setFormCostMin(45000);
    setFormCostMax(120000);
    setFormIsFeatured(false);
    setFormIsPublished(true);
    setModalOpen(true);
  };

  const openEditModal = (d: Destination) => {
    setEditingDest(d);
    setFormName(d.name);
    setFormCountry(d.country || '');
    setFormCategory(d.category || 'Cultural & Nature');
    setFormTagline(d.tagline || '');
    setFormDesc(d.description || '');
    setFormHeroImage(d.hero_image_url || d.image_url || '');
    setFormCostMin(d.estimated_cost_min || 45000);
    setFormCostMax(d.estimated_cost_max || 120000);
    setFormIsFeatured(d.is_featured);
    setFormIsPublished(d.is_published);
    setModalOpen(true);
  };

  const handleSaveDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const payload = {
        name: formName,
        country: formCountry,
        category: formCategory,
        tagline: formTagline,
        description: formDesc,
        hero_image_url: formHeroImage,
        estimated_cost_min: formCostMin,
        estimated_cost_max: formCostMax,
        is_featured: formIsFeatured,
        is_published: formIsPublished,
      };

      if (editingDest) {
        await api.adminUpdateDestination(editingDest.id, payload);
        setMessage(`Destination '${formName}' updated.`);
      } else {
        await api.adminCreateDestination(payload);
        setMessage(`Destination '${formName}' created.`);
      }

      setModalOpen(false);
      await loadAdminData();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    }
  };

  const handleDeleteDestination = async (id: number, name: string) => {
    if (!window.confirm(`Delete destination '${name}'? This cannot be undone.`)) return;
    try {
      await api.adminDeleteDestination(id);
      setMessage(`Destination '${name}' deleted.`);
      await loadAdminData();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploadLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await api.adminUploadMedia(formData);
      setUploadSuccessUrl(res.asset?.url || '');
      setMessage('Image uploaded to Cloudinary successfully!');
      setSelectedFile(null);
    } catch (err: any) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError('');
    setInlineLoading(true);
    try {
      await api.adminLogin({ email: inlineEmail, password: inlinePassword });
      await refreshAuth();
    } catch (err: any) {
      setInlineError(err.message || 'Administrator sign in failed. Please check your credentials.');
    } finally {
      setInlineLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-forest-800 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-charcoal-400">Verifying administrator clearance...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-float border border-charcoal-100 p-8 space-y-6 animate-in fade-in duration-200">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-forest-800 text-ivory-100 flex items-center justify-center mx-auto shadow-soft">
              <ShieldCheck className="w-6 h-6 text-sage-300" />
            </div>
            <h2 className="font-serif text-2xl font-medium text-charcoal-900">Administrator Portal</h2>
            <p className="text-xs text-charcoal-500">
              Sign in with your staff account to access administrative tooling and analytics.
            </p>
          </div>

          {inlineError && (
            <div className="p-3.5 rounded-xl bg-terracotta-50 border border-terracotta-200 text-terracotta-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-terracotta-600" />
              <span>{inlineError}</span>
            </div>
          )}

          <form onSubmit={handleInlineLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-charcoal-700 mb-1">Staff Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-charcoal-400" />
                <input
                  type="email"
                  required
                  value={inlineEmail}
                  onChange={(e) => setInlineEmail(e.target.value)}
                  placeholder="foolking@gmail.com"
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
                  value={inlinePassword}
                  onChange={(e) => setInlinePassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-charcoal-200 focus:border-forest-800 focus:ring-1 focus:ring-forest-800 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={inlineLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-forest-800 text-ivory-50 text-sm font-semibold hover:bg-forest-900 disabled:opacity-60 transition-all shadow-soft"
            >
              {inlineLoading ? (
                <span>Authenticating staff credentials...</span>
              ) : (
                <>
                  <span>Sign In to Admin Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="p-3 bg-ivory-100 rounded-xl text-center">
            <p className="text-[11px] text-charcoal-500 font-light">
              Default administrator: <span className="font-mono font-medium text-charcoal-700">foolking@gmail.com</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-800 text-ivory-100 text-xs font-semibold mb-2 shadow-soft-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-sage-300" />
            <span>Super Admin Portal</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-charcoal-900">
            Administrative Console
          </h1>
          <p className="text-sm text-charcoal-500 mt-1 font-light">
            Manage published travel destinations, media assets via Cloudinary, and review audit records.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-forest-800 hover:bg-forest-900 text-ivory-50 text-xs font-semibold shadow-soft transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Destination</span>
        </button>
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

      {/* KPI Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white border border-charcoal-100 shadow-soft-sm">
            <span className="text-xs text-charcoal-400 font-medium uppercase tracking-wider block">Destinations</span>
            <span className="font-serif text-3xl font-bold text-charcoal-900 mt-1 block">{stats.destinations_count}</span>
          </div>
          <div className="p-5 rounded-3xl bg-white border border-charcoal-100 shadow-soft-sm">
            <span className="text-xs text-charcoal-400 font-medium uppercase tracking-wider block">Registered Users</span>
            <span className="font-serif text-3xl font-bold text-charcoal-900 mt-1 block">{stats.users_count}</span>
          </div>
          <div className="p-5 rounded-3xl bg-white border border-charcoal-100 shadow-soft-sm">
            <span className="text-xs text-charcoal-400 font-medium uppercase tracking-wider block">Created Trips</span>
            <span className="font-serif text-3xl font-bold text-charcoal-900 mt-1 block">{stats.trips_count}</span>
          </div>
          <div className="p-5 rounded-3xl bg-white border border-charcoal-100 shadow-soft-sm">
            <span className="text-xs text-charcoal-400 font-medium uppercase tracking-wider block">Audit Events</span>
            <span className="font-serif text-3xl font-bold text-charcoal-900 mt-1 block">{stats.audit_logs_count}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-charcoal-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('destinations')}
          className={`pb-3 transition-colors ${
            activeTab === 'destinations' ? 'border-b-2 border-forest-800 text-forest-800' : 'text-charcoal-400 hover:text-charcoal-800'
          }`}
        >
          Destinations Management ({destinations.length})
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`pb-3 transition-colors ${
            activeTab === 'media' ? 'border-b-2 border-forest-800 text-forest-800' : 'text-charcoal-400 hover:text-charcoal-800'
          }`}
        >
          Media & Cloudinary Upload
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 transition-colors ${
            activeTab === 'logs' ? 'border-b-2 border-forest-800 text-forest-800' : 'text-charcoal-400 hover:text-charcoal-800'
          }`}
        >
          Audit Trail Logs ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Destinations Table */}
      {activeTab === 'destinations' && (
        <div className="bg-white rounded-3xl border border-charcoal-100 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory-50 text-charcoal-400 uppercase tracking-wider font-semibold border-b border-charcoal-100">
                <tr>
                  <th className="py-4 px-6">Destination</th>
                  <th className="py-4 px-6">Country / Region</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Est. Budget (₹)</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100/70 text-charcoal-700">
                {destinations.map(d => (
                  <tr key={d.id} className="hover:bg-ivory-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-charcoal-900 flex items-center gap-3">
                      <img
                        src={d.hero_image_url || d.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=100&q=80'}
                        alt={d.name}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                      <span>{d.name}</span>
                    </td>
                    <td className="py-4 px-6">{d.country || d.region || '—'}</td>
                    <td className="py-4 px-6">{d.category || 'Curated'}</td>
                    <td className="py-4 px-6 font-medium">₹{(d.estimated_cost_min || 0).toLocaleString('en-IN')}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        d.is_published ? 'bg-sage-100 text-forest-800' : 'bg-charcoal-200 text-charcoal-700'
                      }`}>
                        {d.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(d)}
                        className="p-1.5 rounded-lg text-charcoal-500 hover:text-charcoal-900 hover:bg-ivory-200 transition-colors"
                        title="Edit Destination"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDestination(d.id, d.name)}
                        className="p-1.5 rounded-lg text-terracotta-500 hover:text-terracotta-700 hover:bg-terracotta-50 transition-colors"
                        title="Delete Destination"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Cloudinary Media Upload */}
      {activeTab === 'media' && (
        <div className="bg-white rounded-3xl border border-charcoal-100 p-8 shadow-soft max-w-xl mx-auto space-y-6">
          <div>
            <h3 className="font-serif text-2xl font-medium text-charcoal-900">Upload Media Asset</h3>
            <p className="text-xs text-charcoal-500 mt-1">
              Direct upload to configured Cloudinary bucket with automatic responsive optimization.
            </p>
          </div>

          <form onSubmit={handleFileUpload} className="space-y-4">
            <div className="border-2 border-dashed border-charcoal-200 rounded-2xl p-6 text-center hover:border-forest-800 transition-colors">
              <Upload className="w-8 h-8 text-charcoal-400 mx-auto mb-2" />
              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="text-xs text-charcoal-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-forest-800 file:text-white hover:file:bg-forest-900 cursor-pointer"
              />
            </div>

            {uploadSuccessUrl && (
              <div className="p-3 rounded-xl bg-sage-50 text-xs space-y-2">
                <span className="font-semibold text-forest-800">Uploaded URL:</span>
                <input
                  type="text"
                  readOnly
                  value={uploadSuccessUrl}
                  className="w-full text-[11px] p-2 bg-white rounded-lg border border-sage-200 font-mono"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={uploadLoading || !selectedFile}
              className="w-full py-3 rounded-xl bg-forest-800 hover:bg-forest-900 text-white text-xs font-semibold shadow-soft disabled:opacity-50"
            >
              {uploadLoading ? 'Uploading to Cloudinary...' : 'Upload Image'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-charcoal-100 p-6 shadow-soft space-y-3">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-charcoal-400 text-center py-8">No audit events recorded.</p>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 rounded-xl bg-ivory-50 text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold text-charcoal-900 font-mono uppercase">{log.action}</span>
                  <span className="text-charcoal-500 ml-2">Entity: {log.entity_type} #{log.entity_id}</span>
                </div>
                <div className="text-charcoal-400 text-[11px]">
                  <span>IP: {log.ip_address || '127.0.0.1'}</span>
                  <span className="mx-2">•</span>
                  <span>{new Date(log.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal: Create/Edit Destination */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-float border border-charcoal-100 p-8 max-h-[90vh] overflow-y-auto space-y-6">
            <h3 className="font-serif text-2xl font-medium text-charcoal-900">
              {editingDest ? `Edit Destination: ${editingDest.name}` : 'Create Curated Destination'}
            </h3>

            <form onSubmit={handleSaveDestination} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">Destination Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-charcoal-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">Country / Region</label>
                  <input
                    type="text"
                    required
                    value={formCountry}
                    onChange={(e) => setFormCountry(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-charcoal-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">Tagline</label>
                <input
                  type="text"
                  value={formTagline}
                  onChange={(e) => setFormTagline(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-charcoal-200 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">Hero Image URL</label>
                <input
                  type="url"
                  required
                  value={formHeroImage}
                  onChange={(e) => setFormHeroImage(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-charcoal-200 outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">Editorial Description</label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-charcoal-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">Est. Min Cost (₹)</label>
                  <input
                    type="number"
                    value={formCostMin}
                    onChange={(e) => setFormCostMin(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-charcoal-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">Est. Max Cost (₹)</label>
                  <input
                    type="number"
                    value={formCostMax}
                    onChange={(e) => setFormCostMax(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-charcoal-200 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-charcoal-700">
                  <input
                    type="checkbox"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="rounded text-forest-800"
                  />
                  <span>Feature on Homepage</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-charcoal-700">
                  <input
                    type="checkbox"
                    checked={formIsPublished}
                    onChange={(e) => setFormIsPublished(e.target.checked)}
                    className="rounded text-forest-800"
                  />
                  <span>Published</span>
                </label>
              </div>

              <div className="pt-4 flex gap-3 border-t border-charcoal-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-charcoal-200 text-charcoal-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-forest-800 text-white font-semibold"
                >
                  Save Destination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

