import { getToken } from './api';

const getMainAdminToken = () => {
  return getToken();
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

  const response = await fetch(`${baseUrl}${endpoint}`, config);
  
  if (response.status === 401) {
    window.location.href = '/windatawind';
    throw new Error('Unauthorized');
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
  
  if (response.status === 204) {
    return { success: true };
  }
  
  return response.json();
};

export const mainAdminApi = {
  getStats: () => request('/super-admin/stats'),
  getBusinesses: (params = {}) => request(`/super-admin/businesses?${new URLSearchParams(params).toString()}`),
  getBusinessDetails: (accountId) => request(`/super-admin/businesses/${accountId}`),
  getUsers: (params = {}) => request(`/super-admin/users?${new URLSearchParams(params).toString()}`),
  getUserDetails: (userId) => request(`/super-admin/users/${userId}`),
  getLogs: (params = {}) => request(`/super-admin/logs?${new URLSearchParams(params).toString()}`),
  getPayments: (params = {}) => request(`/super-admin/payments?${new URLSearchParams(params).toString()}`),
  getGrowth: () => request('/super-admin/growth'),
};

export default mainAdminApi;
