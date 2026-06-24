import { getToken } from './api';

const getMainAdminToken = () => {
  return localStorage.getItem('mainAdminToken') || localStorage.getItem('ownerToken');
};

const request = async (endpoint, options = {}) => {
  const token = getMainAdminToken();
  const baseUrl = (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api').replace(/\/$/, '');

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

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('mainAdminToken');
      localStorage.removeItem('ownerToken');
      localStorage.removeItem('mainAdminUser');
      localStorage.removeItem('ownerUser');
      window.location.href = '/windatawind';
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
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
  // Super Admin Auth
  login: (credentials) => request('/super-admin/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),

  // Dashboard Stats
  getStats: () => request('/super-admin/stats'),

  // Business Management
  getBusinesses: (params = {}) => request(`/super-admin/businesses?${new URLSearchParams(params).toString()}`),
  getBusinessDetails: (accountId) => request(`/super-admin/businesses/${accountId}`),

  // User Management
  getUsers: (params = {}) => request(`/super-admin/users?${new URLSearchParams(params).toString()}`),
  getUserDetails: (userId) => request(`/super-admin/users/${userId}`),

  // Subscription Management
  getSubscriptions: (params = {}) => request(`/super-admin/subscriptions?${new URLSearchParams(params).toString()}`),
  getSubscriptionDetails: (subId) => request(`/super-admin/subscriptions/${subId}`),

  // Revenue Reports
  getRevenue: () => request('/super-admin/revenue'),

  // System Health
  getSystemHealth: () => request('/super-admin/health'),

  // Support Tickets
  getSupportTickets: (params = {}) => request(`/super-admin/tickets?${new URLSearchParams(params).toString()}`),
  updateTicketStatus: (ticketId, status) => request(`/super-admin/tickets/${ticketId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  // Audit Logs
  getAuditLogs: (params = {}) => request(`/super-admin/logs?${new URLSearchParams(params).toString()}`),

  // Email Logs
  getEmailLogs: (params = {}) => request(`/super-admin/email-logs?${new URLSearchParams(params).toString()}`),

  // Feature Flags
  getFeatureFlags: () => request('/super-admin/feature-flags'),
  updateFeatureFlag: (flagId, enabled) => request(`/super-admin/feature-flags/${flagId}`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  }),

  // Notifications
  getNotifications: () => request('/super-admin/notifications'),
  markNotificationRead: (notificationId) => request(`/super-admin/notifications/${notificationId}/read`, {
    method: 'PATCH',
  }),

  // Analytics
  getAnalytics: () => request('/super-admin/analytics'),

  // Custom Package Requests
  getCustomRequests: () => request('/super-admin/custom-requests'),
  createCustomRequest: (data) => request('/super-admin/custom-requests', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateCustomRequest: (requestId, status) => request(`/super-admin/custom-requests/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
};

export default mainAdminApi;