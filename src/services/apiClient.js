const API_BASE = (() => {
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE.replace(/\/$/, '');
  }
  if (import.meta.env.VITE_API_URL) {
    const normalized = import.meta.env.VITE_API_URL.replace(/\/$/, '');
    return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api`;
  }
  return '/api';
})();

const getToken = () => localStorage.getItem('token') || localStorage.getItem('ownerToken') || localStorage.getItem('mainAdminToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');
const getCsrfToken = () => localStorage.getItem('csrfToken');

const shouldRetryRequest = (options = {}) => {
  const method = String(options.method || 'GET').toUpperCase();
  return method === 'GET' || method === 'HEAD';
};

let refreshPromise = null;

async function refreshAuthSession(csrfToken) {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
    },
    body: JSON.stringify({ refreshToken }),
  })
    .then(async (refreshResp) => {
      if (!refreshResp.ok) {
        return null;
      }
      const refreshData = await refreshResp.json();
      if (refreshData.token) {
        localStorage.setItem('token', refreshData.token);
      }
      if (refreshData.refreshToken) {
        localStorage.setItem('refreshToken', refreshData.refreshToken);
      }
      if (refreshData.csrfToken) {
        localStorage.setItem('csrfToken', refreshData.csrfToken);
      }
      return refreshData;
    })
    .catch(() => null)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  async request(endpoint, options = {}) {
    const token = getToken();
    const csrfToken = getCsrfToken();

    const config = {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        ...options.headers,
      },
    };

    const method = String(options.method || 'GET').toUpperCase();
    const maxRetries = shouldRetryRequest(options) ? 2 : 0;
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);

        if (response.status === 401 && !options._skipRefresh) {
          const refreshed = await refreshAuthSession(csrfToken);
          if (refreshed?.token) {
            const retryConfig = {
              ...config,
              headers: {
                ...config.headers,
                Authorization: `Bearer ${refreshed.token}`,
              },
              _skipRefresh: true,
            };
            const retryResp = await fetch(`${API_BASE}${endpoint}`, retryConfig);
            if (retryResp.ok) {
              if (retryResp.status === 204) return null;
              return retryResp.json();
            }
            const errorData = await retryResp.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(errorData.message || errorData.error || `HTTP ${retryResp.status}`);
          }
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('csrfToken');
          const err = new Error('Authentication required. Please sign in.');
          err.status = 401;
          throw err;
        }

        if (response.status === 403) {
          const errorData = await response.json().catch(() => ({ error: 'Access denied' }));
          if (errorData.code === 'TRIAL_EXPIRED' || errorData.code === 'SUBSCRIPTION_EXPIRED' || errorData.error?.includes('expired')) {
            window.location.href = '/subscription-expired';
          }
          const err = new Error(errorData.error || errorData.message || 'Access denied');
          err.status = 403;
          err.code = errorData.code;
          throw err;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
          throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        if (response.status === 204) return null;
        return await response.json();
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries && shouldRetryRequest(options)) {
          const delayMs = Math.min(500 * Math.pow(2, attempt), 3000);
          await delay(delayMs);
          continue;
        }
        throw lastError;
      }
    }

    throw lastError;
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
