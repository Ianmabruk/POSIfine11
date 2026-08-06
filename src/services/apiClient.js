const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export const api = {
  async request(endpoint, options = {}) {
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || error.error || `HTTP ${response.status}`);
      }

      if (response.status === 204) return null;
      return response.json();
    } catch (error) {
      throw error;
    }
  },

  createTrial(packageType) {
    return this.request('/trials/create', {
      method: 'POST',
      body: JSON.stringify({ packageType }),
    });
  },

  getTrialStatus() {
    return this.request('/trials/status');
  },

  createSubscription(packageType, amount) {
    return this.request('/subscriptions/create', {
      method: 'POST',
      body: JSON.stringify({ packageType, amount }),
    });
  },

  getSubscriptionStatus() {
    return this.request('/subscriptions/status');
  },

  registerBusiness(data) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  loginBusiness(data) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getBusinessProfile() {
    return this.request('/auth/profile');
  },
};

export default api;
