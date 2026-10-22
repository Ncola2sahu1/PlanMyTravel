let csrfTokenCache: string | null = null;

export async function fetchCsrfToken(): Promise<string> {
  if (csrfTokenCache) return csrfTokenCache;
  try {
    const res = await fetch('/api/auth/csrf', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      csrfTokenCache = data.csrf_token;
      return data.csrf_token;
    }
  } catch (err) {
    console.error('Failed to fetch CSRF token:', err);
  }
  return '';
}

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // If payload is JSON and not FormData
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Inject CSRF token for state-changing requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const token = await fetchCsrfToken();
    if (token) {
      headers['X-CSRF-Token'] = token;
    }
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type') || '';
  let data: any = null;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

// API methods
export const api = {
  // Auth
  csrf: () => apiRequest<{ csrf_token: string }>('/api/auth/csrf'),
  me: () => apiRequest('/api/auth/me'),
  register: (payload: { email: string; password: string; name: string }) =>
    apiRequest('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: { email: string; password: string }) =>
    apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => apiRequest('/api/auth/logout', { method: 'POST' }),
  adminLogin: (payload: { email: string; password: string }) =>
    apiRequest('/api/auth/admin/login', { method: 'POST', body: JSON.stringify(payload) }),
  adminLogout: () => apiRequest('/api/auth/admin/logout', { method: 'POST' }),

  // Destinations
  getDestinations: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
    });
    return apiRequest(`/api/destinations?${query.toString()}`);
  },
  getDestination: (slugOrId: string) => apiRequest(`/api/destinations/${slugOrId}`),
  getCategories: () => apiRequest('/api/destinations/categories'),

  // Stays
  getStays: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
    });
    return apiRequest(`/api/stays?${query.toString()}`);
  },
  getStay: (id: string) => apiRequest(`/api/stays/${id}`),

  // Flights
  searchFlights: (params: { origin?: string; destination?: string; date?: string; travelers?: number }) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) query.append(k, String(v));
    });
    return apiRequest(`/api/flights/search?${query.toString()}`);
  },

  // AI Concierge
  planTrip: (payload: Record<string, any>) =>
    apiRequest('/api/ai/plan', { method: 'POST', body: JSON.stringify(payload) }),
  regenerateDay: (payload: { day: any; destination: string; travel_style?: string; notes?: string }) =>
    apiRequest('/api/ai/regenerate-day', { method: 'POST', body: JSON.stringify(payload) }),
  replaceActivity: (payload: { slot: string; current_activity: any; destination: string; notes?: string }) =>
    apiRequest('/api/ai/replace-activity', { method: 'POST', body: JSON.stringify(payload) }),

  // Saved Trips
  getTrips: () => apiRequest('/api/trips'),
  saveTrip: (payload: { title?: string; itinerary: any; preferences: any }) =>
    apiRequest('/api/trips', { method: 'POST', body: JSON.stringify(payload) }),
  getTrip: (id: string) => apiRequest(`/api/trips/${id}`),
  updateTrip: (id: string, payload: Record<string, any>) =>
    apiRequest(`/api/trips/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteTrip: (id: string) => apiRequest(`/api/trips/${id}`, { method: 'DELETE' }),
  duplicateTrip: (id: string) => apiRequest(`/api/trips/${id}/duplicate`, { method: 'POST' }),

  // Trip Wallet
  getWallet: () => apiRequest('/api/wallet'),
  createWalletOrder: (amount: number) =>
    apiRequest('/api/wallet/create-order', { method: 'POST', body: JSON.stringify({ amount }) }),
  verifyPayment: (payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; amount: number }) =>
    apiRequest('/api/wallet/verify-payment', { method: 'POST', body: JSON.stringify(payload) }),

  // Bookings
  getBookings: () => apiRequest('/api/bookings'),
  createBooking: (payload: Record<string, any>) =>
    apiRequest('/api/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  payBookingViaWallet: (bookingId: number) =>
    apiRequest(`/api/bookings/${bookingId}/pay-wallet`, { method: 'POST' }),

  // Admin
  getAdminStats: () => apiRequest('/api/admin/stats'),
  adminListDestinations: () => apiRequest('/api/admin/destinations'),
  adminCreateDestination: (payload: Record<string, any>) =>
    apiRequest('/api/admin/destinations', { method: 'POST', body: JSON.stringify(payload) }),
  adminUpdateDestination: (id: number, payload: Record<string, any>) =>
    apiRequest(`/api/admin/destinations/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  adminDeleteDestination: (id: number) =>
    apiRequest(`/api/admin/destinations/${id}`, { method: 'DELETE' }),
  adminGetAuditLogs: () => apiRequest('/api/admin/audit-logs'),
  adminUploadMedia: (formData: FormData) =>
    apiRequest('/api/admin/media/upload', { method: 'POST', body: formData }),
};

