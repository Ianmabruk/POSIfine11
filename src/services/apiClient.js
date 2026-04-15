/**
 * API Client - Standardized HTTP Communication
 * ============================================
 * Centralized API client with interceptors, error handling, and retry logic.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');
const API_VERSION = 'v1';
const API_URL = `${API_BASE_URL}/api/${API_VERSION}`;

/**
 * Standard API Response Format
 * {
 *   status: 'success' | 'error' | 'warning',
 *   message?: string,
 *   data?: any,
 *   errors?: Array<{field: string, message: string}>,
 *   meta?: {pagination?: {...}},
 *   timestamp: string
 * }
 */

class APIClient {
  constructor() {
    this.baseURL = API_URL;
    this.interceptors = {
      request: [],
      response: []
    };
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor) {
    this.interceptors.response.push(interceptor);
  }

  /**
   * Get auth token
   */
  getToken() {
    return localStorage.getItem('token');
  }

  /**
   * Build headers
   */
  buildHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Process request through interceptors
   */
  async processRequest(config) {
    let processedConfig = { ...config };
    
    for (const interceptor of this.interceptors.request) {
      processedConfig = await interceptor(processedConfig);
    }
    
    return processedConfig;
  }

  /**
   * Process response through interceptors
   */
  async processResponse(response) {
    let processedResponse = response;
    
    for (const interceptor of this.interceptors.response) {
      processedResponse = await interceptor(processedResponse);
    }
    
    return processedResponse;
  }

  /**
   * Make HTTP request with retry logic
   */
  async request(endpoint, options = {}, retryCount = 0, maxRetries = 3) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    
    // Process request config
    const config = await this.processRequest({
      url,
      method: options.method || 'GET',
      headers: this.buildHeaders(options.headers),
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    try {
      const response = await fetch(config.url, {
        method: config.method,
        headers: config.headers,
        body: config.body
      });

      // Handle HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          status: 'error',
          message: `HTTP ${response.status}: ${response.statusText}`
        }));

        // 401 - Unauthorized
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.dispatchEvent(new CustomEvent('unauthorized'));
          throw new Error(errorData.message || 'Unauthorized');
        }

        // 429 - Rate limit
        if (response.status === 429) {
          throw new Error('Too many requests. Please try again later.');
        }

        throw new Error(errorData.message || 'Request failed');
      }

      // Parse response
      const data = await response.json();

      // Process through interceptors
      const processedData = await this.processResponse(data);

      // Check standardized response format
      if (processedData.status === 'error') {
        throw new Error(processedData.message || 'Request failed');
      }

      return processedData;

    } catch (error) {
      // Network error - retry
      if (error.name === 'TypeError' && error.message.includes('fetch') && retryCount < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        console.log(`🔄 Retrying request (${retryCount + 1}/${maxRetries}) in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.request(endpoint, options, retryCount + 1, maxRetries);
      }

      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: data
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  /**
   * Upload file
   */
  async upload(endpoint, file, additionalData = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    const token = this.getToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  }
}

// Create singleton instance
const apiClient = new APIClient();

// Add default request interceptor - logging
apiClient.addRequestInterceptor((config) => {
  console.log(`➡️  ${config.method} ${config.url}`);
  return config;
});

// Add default response interceptor - logging
apiClient.addResponseInterceptor((response) => {
  if (response.status === 'success') {
    console.log(`✅ Success: ${response.message || 'Request completed'}`);
  } else if (response.status === 'error') {
    console.error(`❌ Error: ${response.message}`);
    if (response.errors) {
      console.error('Validation errors:', response.errors);
    }
  }
  return response;
});

// Add performance monitoring interceptor
apiClient.addResponseInterceptor((response) => {
  if (response.meta?.response_time) {
    const time = parseFloat(response.meta.response_time);
    if (time > 1000) {
      console.warn(`⚠️  Slow request: ${time.toFixed(0)}ms`);
    }
  }
  return response;
});

export default apiClient;

/**
 * API Service Classes
 */

export class AuthAPI {
  async signup(email, password, name, plan = 'free') {
    const response = await apiClient.post('/auth/signup', {
      email,
      password,
      name,
      plan
    });
    return response.data;
  }

  async login(email, password) {
    const response = await apiClient.post('/auth/login', {
      email,
      password
    });
    return response.data;
  }

  async pinLogin(pin) {
    const response = await apiClient.post('/auth/pin-login', { pin });
    return response.data;
  }

  async logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth/login';
  }
}

export class ProductsAPI {
  async getAll(page = 1, perPage = 50) {
    const response = await apiClient.get('/products', { page, per_page: perPage });
    return {
      products: response.data,
      pagination: response.meta?.pagination
    };
  }

  async getById(id) {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  }

  async create(productData) {
    const response = await apiClient.post('/products', productData);
    return response.data;
  }

  async update(id, productData) {
    const response = await apiClient.put(`/products/${id}`, productData);
    return response.data;
  }

  async delete(id) {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  }

  async updateStock(id, quantity) {
    const response = await apiClient.put(`/products/${id}/stock`, { quantity });
    return response.data;
  }
}

export class SalesAPI {
  async complete(saleData) {
    const response = await apiClient.post('/sales', saleData);
    return response.data;
  }

  async getAll(page = 1, perPage = 50) {
    const response = await apiClient.get('/sales', { page, per_page: perPage });
    return {
      sales: response.data,
      pagination: response.meta?.pagination
    };
  }

  async getById(id) {
    const response = await apiClient.get(`/sales/${id}`);
    return response.data;
  }
}

// Export instances
export const auth = new AuthAPI();
export const products = new ProductsAPI();
export const sales = new SalesAPI();
