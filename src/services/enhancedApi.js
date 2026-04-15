import { monitoredFetch } from './performanceMonitor';
import { requestWithSWR } from './requestCache';

const BASE_URL =
  import.meta?.env?.VITE_API_URL ||
  import.meta?.env?.VITE_API_BASE ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

class ApiClient {
  constructor() {
    this.baseURL = BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  // Get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Enhanced request with retry logic and monitoring
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...this.getAuthHeaders(),
        ...options.headers
      }
    };

    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await monitoredFetch(url, config);
        
        // Handle different response types
        if (!response.ok) {
          const errorData = await this.parseErrorResponse(response);
          throw new ApiError(errorData.message || 'Request failed', response.status, errorData);
        }

        // Parse response
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        }
        
        return await response.text();
        
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (error.status >= 400 && error.status < 500 && error.status !== 429) {
          break;
        }
        
        // Don't retry on last attempt
        if (attempt === this.retryAttempts) {
          break;
        }
        
        // Wait before retry with exponential backoff
        await this.delay(this.retryDelay * Math.pow(2, attempt - 1));
      }
    }
    
    throw lastError;
  }

  async parseErrorResponse(response) {
    try {
      return await response.json();
    } catch {
      return { message: `HTTP ${response.status}: ${response.statusText}` };
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // HTTP methods
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // File upload
  async upload(endpoint, formData) {
    return this.request(endpoint, {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    });
  }
}

// Custom error class
class ApiError extends Error {
  constructor(message, status, data = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Enhanced API methods with error handling
export const api = {
  // Auth
  auth: {
    login: (credentials) => apiClient.post('/api/auth/login', credentials),
    signup: (userData) => apiClient.post('/api/auth/signup', userData),
    logout: () => apiClient.post('/api/auth/logout'),
    me: () => apiClient.get('/api/auth/me'),
    refresh: (refreshToken) => apiClient.post('/api/auth/refresh', { refreshToken })
  },

  // Products
  products: {
    getAll: (params) => apiClient.get('/api/products', params),
    getById: (id) => apiClient.get(`/api/products/${id}`),
    create: (product) => apiClient.post('/api/products', product),
    update: (id, product) => apiClient.put(`/api/products/${id}`, product),
    delete: (id) => apiClient.delete(`/api/products/${id}`),
    updateStock: (id, quantity) => apiClient.put(`/api/products/${id}/stock`, { quantity }),
    getLowStock: () => apiClient.get('/api/products/low-stock-warnings')
  },

  // Sales
  sales: {
    getAll: (params) => apiClient.get('/api/sales', params),
    create: (sale) => apiClient.post('/api/sales', sale),
    createV2: (sale) => apiClient.post('/api/v2/sales/complete', sale),
    getById: (id) => apiClient.get(`/api/sales/${id}`),
    delete: (id) => apiClient.delete(`/api/sales/${id}`)
  },

  // Stats
  stats: {
    getDashboard: (params) => requestWithSWR(
      `stats:${JSON.stringify(params || {})}`,
      () => apiClient.get('/api/stats', params),
      { ttlMs: 5000, swrMs: 30000 }
    ),
    getAnalytics: () => apiClient.get('/api/stats/analytics'),
    getMonitor: () => requestWithSWR(
      'monitor:stats',
      () => apiClient.get('/api/v2/monitor/stats'),
      { ttlMs: 3000, swrMs: 15000 }
    )
  },

  // Users
  users: {
    getAll: () => apiClient.get('/api/users'),
    create: (user) => apiClient.post('/api/users', user),
    getById: (id) => apiClient.get(`/api/users/${id}`),
    update: (id, user) => apiClient.put(`/api/users/${id}`, user),
    delete: (id) => apiClient.delete(`/api/users/${id}`)
  },

  // Time tracking
  time: {
    clockIn: () => apiClient.post('/api/clock-in'),
    clockOut: () => apiClient.post('/api/clock-out'),
    getStatus: () => apiClient.get('/api/clock-status'),
    getEntries: (params) => apiClient.get('/api/time-entries', params)
  },

  // Expenses
  expenses: {
    getAll: (params) => apiClient.get('/api/expenses', params),
    create: (expense) => apiClient.post('/api/expenses', expense),
    update: (id, expense) => apiClient.put(`/api/expenses/${id}`, expense),
    delete: (id) => apiClient.delete(`/api/expenses/${id}`)
  },

  // Credit requests
  credit: {
    getAll: () => apiClient.get('/api/credit-requests'),
    create: (request) => apiClient.post('/api/credit-requests', request),
    update: (id, data) => apiClient.put(`/api/credit-requests/${id}`, data),
    delete: (id) => apiClient.delete(`/api/credit-requests/${id}`)
  },

  // Reminders
  reminders: {
    getAll: (params) => apiClient.get('/api/reminders', params),
    create: (reminder) => apiClient.post('/api/reminders', reminder),
    getToday: () => apiClient.get('/api/reminders/today'),
    markSeen: (id) => apiClient.put(`/api/reminders/${id}`, { seen: true }),
    delete: (id) => apiClient.delete(`/api/reminders/${id}`)
  }
};

// Error handling utilities
export const handleApiError = (error) => {
  if (error instanceof ApiError) {
    // Handle specific API errors
    switch (error.status) {
      case 401:
        // Unauthorized - redirect to login
        localStorage.removeItem('token');
        window.location.href = '/auth/login';
        break;
      case 403:
        // Forbidden
        return 'You do not have permission to perform this action';
      case 404:
        return 'The requested resource was not found';
      case 429:
        return 'Too many requests. Please try again later';
      case 500:
        return 'Server error. Please try again later';
      default:
        return error.message || 'An unexpected error occurred';
    }
  }
  
  // Network or other errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return 'Network error. Please check your connection';
  }
  
  return error.message || 'An unexpected error occurred';
};

// React hook for API calls with error handling
export const useApiCall = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callApi = async (apiCall, onSuccess, onError) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      if (onError) onError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, callApi, setError };
};

export { ApiError };
export default apiClient;