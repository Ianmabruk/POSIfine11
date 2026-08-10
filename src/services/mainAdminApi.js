import { getToken } from './api';

const getMainAdminToken = () => {
  return localStorage.getItem('mainAdminToken') || localStorage.getItem('ownerToken') || localStorage.getItem('token');
};

const getRefreshToken = () => localStorage.getItem('refreshToken');
const getCsrfToken = () => localStorage.getItem('csrfToken');

const refreshAuth = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const baseUrl = (import.meta.env.VITE_API_BASE || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000') + '/api').replace(/\/$/, '');

  const resp = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(getCsrfToken() ? { 'X-CSRF-Token': getCsrfToken() } : {}),
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!resp.ok) return false;

  const data = await resp.json();
  if (data.token) {
    localStorage.setItem('mainAdminToken', data.token);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    if (data.csrfToken) localStorage.setItem('csrfToken', data.csrfToken);
    if (data.user) localStorage.setItem('mainAdminUser', JSON.stringify(data.user));
    return true;
  }

  return false;
};

const request = async (endpoint, options = {}) => {
  const token = getMainAdminToken();
  const baseUrl = (import.meta.env.VITE_API_BASE || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000') + '/api').replace(/\/$/, '');

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && !endpoint.includes('/auth/login') ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, config);

    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      const refreshed = await refreshAuth();
      if (refreshed) {
        const newToken = getMainAdminToken();
        const retryConfig = {
          ...config,
          headers: {
            ...config.headers,
            ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
          },
        };
        const retryResp = await fetch(`${baseUrl}${endpoint}`, retryConfig);
        if (retryResp.ok) {
          if (retryResp.status === 204) return { success: true };
          return retryResp.json();
        }
      }

      localStorage.removeItem('mainAdminToken');
      localStorage.removeItem('ownerToken');
      localStorage.removeItem('mainAdminUser');
      localStorage.removeItem('ownerUser');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('csrfToken');
      window.location.href = '/windatawind';
      throw new Error('Authentication required');
    }

    if (response.status === 403) {
      const errorData = await response.json().catch(() => ({ error: 'Access denied' }));
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
      return { success: true };
    }

    return response.json();
  } catch (err) {
    if (err.message === 'Authentication required') {
      throw err;
    }
    throw err;
  }
};

export const mainAdminApi = {
  login: (credentials) => request('/main-admin/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),

  getDashboardMetrics: () => request('/main-admin/metrics'),

  getBusinesses: (params = {}) => request(`/main-admin/businesses?${new URLSearchParams(params).toString()}`),
  getBusinessDetails: (id) => request(`/main-admin/businesses/${id}`),
  suspendBusiness: (id) => request(`/main-admin/users/${id}/lock`, { method: 'POST', body: JSON.stringify({ locked: true }) }),
  activateBusiness: (id) => request(`/main-admin/users/${id}/lock`, { method: 'POST', body: JSON.stringify({ locked: false }) }),

  getActiveTrials: () => request('/main-admin/trials/active'),
  getExpiredTrials: () => request('/main-admin/trials/expired'),

  getAllSubscriptions: () => request('/main-admin/subscriptions/all'),

  getPaymentHistory: () => request('/main-admin/payments'),
  getRevenueAnalytics: () => request('/main-admin/revenue'),
  requestPayment: (id) => request(`/main-admin/businesses/${id}/request-payment`, { method: 'POST' }),
  clearPayment: (id) => request(`/main-admin/businesses/${id}/clear-payment`, { method: 'POST' }),
};

export default mainAdminApi;
