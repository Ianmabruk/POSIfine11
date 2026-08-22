
// Updated API Service Layer - Connected to Deployed Backend

import { cacheGet, cacheSet, cacheClear } from '../utils/apiCache';
import { refreshAuthSession as sharedRefreshAuthSession } from '../utils/authRefresh';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }
  if (import.meta.env.VITE_API_URL) {
    const normalized = import.meta.env.VITE_API_URL.replace(/\/$/, '');
    return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api`;
  }
  return '/api';
};

const BASE_API_URL = getBaseUrl();

const getToken = () => localStorage.getItem('token') || localStorage.getItem('ownerToken') || localStorage.getItem('mainAdminToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');
const getCsrfToken = () => localStorage.getItem('csrfToken');

export { getToken, getRefreshToken, getCsrfToken };

const toQueryString = (params = {}) => {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (!entries.length) return '';
  const search = new URLSearchParams(entries);
  return `?${search.toString()}`;
};

const shouldRetryRequest = (options = {}) => {
  const method = String(options.method || 'GET').toUpperCase();
  return method === 'GET' || method === 'HEAD';
};

function buildCacheKey(endpoint, options = {}) {
  const token = getToken();
  const parts = [endpoint, options.method || 'GET', token || 'anon'];
  return parts.join('|');
}

const refreshAuthSession = sharedRefreshAuthSession;

const invalidateEndpointCache = (endpoint) => {
    try {
        const escaped = endpoint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        cacheClear(new RegExp(`^api_cache_${escaped}\\|(GET|HEAD)\\|`).source);
    } catch {
        cacheClear();
    }
};

const requestWithRetry = async (endpoint, options = {}, retryCount = 0, maxRetries = 2, didRefresh = false) => {
  const token = getToken();
  const csrfToken = getCsrfToken();

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const baseHasApi = BASE_API_URL.endsWith('/api');
  const normalizedEndpoint = baseHasApi && cleanEndpoint.startsWith('/api/')
    ? cleanEndpoint.replace(/^\/api/, '')
    : cleanEndpoint;

  const authEndpoints = ['/auth/login', '/auth/signup', '/auth/refresh', '/auth/change-password', '/auth/lock-screen', '/auth/unlock-screen', '/main-admin/auth/login'];
  const shouldSkipAuth = authEndpoints.some(ep => normalizedEndpoint === ep);

  const config = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token && !shouldSkipAuth && { Authorization: `Bearer ${token}` }),
      ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
      ...options.headers
    }
  };

  const method = String(options.method || 'GET').toUpperCase();
  const cacheKey = buildCacheKey(normalizedEndpoint, options);

  if (method === 'GET' || method === 'HEAD') {
    const cached = cacheGet(cacheKey);
    if (cached) {
      return cached;
    }
  }

  try {
    const response = await fetch(`${BASE_API_URL}${normalizedEndpoint}`, config);

    if (response.status === 401) {
      if (!didRefresh && !shouldSkipAuth) {
        const refreshed = await refreshAuthSession(csrfToken);
        if (refreshed?.token) {
          return requestWithRetry(endpoint, options, retryCount, maxRetries, true);
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('csrfToken');
      }
      if (normalizedEndpoint.includes('/auth/login') || normalizedEndpoint.includes('/main-admin/auth/login')) {
        const errorData = await response.json().catch(() => ({ error: 'Unauthorized' }));
        throw new Error(errorData.error || 'Invalid credentials');
      }
      const err = new Error('Authentication required. Please sign in.');
      err.status = 401;
      throw err;
    }

    if (response.status === 403) {
      const errorData = await response.json().catch(() => ({ error: 'Access denied' }));
      if (errorData.code === 'TRIAL_EXPIRED' || errorData.code === 'SUBSCRIPTION_EXPIRED' || errorData.error?.includes('expired')) {
        window.location.href = '/subscription-expired';
        const err = new Error(errorData.error || 'Subscription expired');
        err.status = 403;
        err.code = errorData.code;
        throw err;
      }
      const err = new Error(errorData.error || 'Access denied');
      err.status = 403;
      throw err;
    }

    if (response.status === 500) {
      throw new Error('Server error - please try again');
    }

const SNAKE_TO_CAMEL = {
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  payment_method: 'paymentMethod',
  cashier_name: 'cashierName',
  total_cost: 'totalCost',
  gross_profit: 'grossProfit',
  net_profit: 'netProfit',
  discount_amount: 'discountAmount',
  service_fee: 'serviceFee',
  tax_amount: 'taxAmount',
  payment_status: 'paymentStatus',
  transactionstatus: 'transactionStatus',
  business_type: 'businessType',
  business_role: 'businessRole',
  profile_picture: 'profilePicture',
  hourly_rate: 'hourlyRate',
  reorder_level: 'reorderLevel',
  max_stock_level: 'maxStockLevel',
  cost_per_unit: 'costPerUnit',
  is_composite: 'isComposite',
  visible_to_cashier: 'visibleToCashier',
  enable_weight_pricing: 'enableWeightPricing',
  screen_locked: 'screenLocked',
  is_locked: 'isLocked',
  is_active: 'isActive',
  last_login: 'lastLogin',
  created_by: 'createdBy',
  customer_name: 'customerName',
  valid_from: 'validFrom',
  valid_to: 'validTo',
  min_purchase_amount: 'minPurchaseAmount',
  active_only: 'activeOnly',
  package_size: 'packageSize',
  receipt_number: 'receiptNumber',
  amount_paid: 'amountPaid',
  stock_level: 'stockLevel',
  last_restocked: 'lastRestocked',
};

const CAMEL_TO_SNAKE = Object.fromEntries(
  Object.entries(SNAKE_TO_CAMEL).map(([k, v]) => [v, k])
);

function normalizeKeys(value, toCamel) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeKeys(item, toCamel));
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      const mapped = toCamel ? SNAKE_TO_CAMEL[key] : CAMEL_TO_SNAKE[key];
      const newKey = mapped || key;
      out[newKey] = normalizeKeys(val, toCamel);
    }
    return out;
  }
  return value;
}

function normalizeResponse(json, method) {
  if (Array.isArray(json)) {
    return json.map((item) => normalizeKeys(item, method === 'GET' || method === 'HEAD'));
  }
  if (!json || typeof json !== 'object') return json;
  if (method === 'GET' || method === 'HEAD') {
    return normalizeKeys(json, true);
  }
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    return normalizeKeys(json, false);
  }
  return json;
}

    if (response.ok) {
      if (response.status === 204) {
        return { success: true };
      }
      let json = await response.json();
      if ((method === 'GET' || method === 'HEAD') && json && typeof json === 'object' && !Array.isArray(json) && Array.isArray(json.items)) {
        json = json.items;
      }
      json = normalizeResponse(json, method);
      if (method === 'GET' || method === 'HEAD') {
        cacheSet(cacheKey, json, 30_000);
      } else {
        invalidateEndpointCache(normalizedEndpoint);
      }
      return json;
    }

    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);

  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error(`API Fetch Error (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);
      console.error("Attempted URL:", `${BASE_API_URL}${cleanEndpoint}`);
      
      if (shouldRetryRequest(options) && retryCount < maxRetries) {
        const delayMs = Math.min(250 * Math.pow(2, retryCount), 2000);
        console.log(`Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return requestWithRetry(endpoint, options, retryCount + 1, maxRetries);
      }
      throw new Error('Cannot connect to server. The server may be waking up. Please try again in a moment.');
    }
    throw error;
  }
};

const request = (endpoint, options = {}) => {
  return requestWithRetry(endpoint, options, 0, shouldRetryRequest(options) ? 2 : 0);
};

export { request, requestWithRetry };

export const auth = {
  login: (credentials) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  
  signup: (data) => request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  signupWithPayment: (data) => request('/signup-with-payment', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  me: () => request('/auth/me'),
  
  updatePin: (pin) => request('/auth/update-pin', {
    method: 'POST',
    body: JSON.stringify({ pin })
  }),

  changePassword: (currentPassword, newPassword) => request('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword })
  }),

  customPlanRequest: (data) => request('/custom-plan-request', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
};


// Users API
export const users = {
  getAll: () => request('/users'),
  
  create: (userData) => request('/users', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  
  update: (id, userData) => request(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData)
  }),
  
  delete: (id) => request(`/users/${id}`, {
    method: 'DELETE'
  }),
  
  setPin: (id, pin) => request(`/users/${id}/set-pin`, {
    method: 'POST',
    body: JSON.stringify({ pin })
  }),
  
  lock: (id, locked) => request(`/users/${id}/lock`, {
    method: 'POST',
    body: JSON.stringify({ locked })
  })
};

// Products API
export const products = {
  getAll: (params) => request(`/products${toQueryString(params)}`),
  
  create: (productData) => request('/products', {
    method: 'POST',
    body: JSON.stringify(productData)
  }),
  
  update: (id, productData) => request(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData)
  }),
  
  delete: (id) => request(`/products/${id}`, {
    method: 'DELETE'
  }),
  
  // Get low-stock warnings (products below threshold)
  getLowStockWarnings: () => request('/products/low-stock-warnings'),
  
  // Update product stock/inventory
  updateStock: (id, stockData) => request(`/products/${id}/stock`, {
    method: 'PUT',
    body: JSON.stringify(stockData)
  }),
  
  getMaxProducible: (id) => request(`/products/${id}/max-producible`),
  
  // Weight-based pricing management
  getWeightPricing: (id) => request(`/products/${id}/weight-pricing`),
  
  addWeightPrice: (id, weight, price) => request(`/products/${id}/weight-pricing`, {
    method: 'POST',
    body: JSON.stringify({ weight, price })
  }),
  
  updateWeightPrice: (id, weight, price) => request(`/products/${id}/weight-pricing`, {
    method: 'PUT',
    body: JSON.stringify({ weight, price })
  }),
  
  deleteWeightPrice: (id, weight) => request(`/products/${id}/weight-pricing`, {
    method: 'DELETE',
    body: JSON.stringify({ weight })
  })
};

// Sales API
export const sales = {
  getAll: (params) => request(`/sales${toQueryString(params)}`),
  
  create: (saleData) => request('/sales', {
    method: 'POST',
    body: JSON.stringify(saleData)
  }),
  
  delete: (id) => request(`/sales/${id}`, {
    method: 'DELETE'
  }),
  
  // Admin complete sale with immediate deduction
  adminComplete: (saleData) => request('/admin-complete-sale', {
    method: 'POST',
    body: JSON.stringify(saleData)
  })
};

// Payments API
export const payments = {
  getStatus: (paymentId) => request(`/payments/${paymentId}/status`),
};

// Expenses API
export const expenses = {
  getAll: () => request('/expenses'),
  
  create: (expenseData) => request('/expenses', {
    method: 'POST',
    body: JSON.stringify(expenseData)
  }),
  
  update: (id, expenseData) => request(`/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(expenseData)
  }),
  
  delete: (id) => request(`/expenses/${id}`, {
    method: 'DELETE'
  })
};

// Raw Materials API
export const rawMaterials = {
  getAll: () => request('/raw-materials')
};

// Statistics API
export const stats = {
  get: (params) => request(`/stats${toQueryString(params)}`)
};

// Reminders API
export const reminders = {
  getAll: () => request('/reminders'),
  getToday: () => request('/reminders/today'),
  create: (reminderData) => request('/reminders', {
    method: 'POST',
    body: JSON.stringify(reminderData)
  }),
  update: (id, reminderData) => request(`/reminders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(reminderData)
  }),
  delete: (id) => request(`/reminders/${id}`, {
    method: 'DELETE'
  })
};

// Price History API
export const priceHistory = {
  getAll: () => request('/price-history'),
  create: (priceData) => request('/price-history', {
    method: 'POST',
    body: JSON.stringify(priceData)
  })
};

// Service Fees API
export const serviceFees = {
  getAll: () => request('/service-fees'),
  create: (feeData) => request('/service-fees', {
    method: 'POST',
    body: JSON.stringify(feeData)
  }),
  update: (id, feeData) => request(`/service-fees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(feeData)
  }),
  delete: (id) => request(`/service-fees/${id}`, {
    method: 'DELETE'
  })
};

// Discounts API
export const discounts = {
  getAll: () => request('/discounts'),
  create: (discountData) => request('/discounts', {
    method: 'POST',
    body: JSON.stringify(discountData)
  }),
  update: (id, discountData) => request(`/discounts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(discountData)
  }),
  delete: (id) => request(`/discounts/${id}`, {
    method: 'DELETE'
  })
};

// Credit Requests API
export const creditRequests = {
  getAll: () => request('/credit-requests'),
  create: (requestData) => request('/credit-requests', {
    method: 'POST',
    body: JSON.stringify(requestData)
  }),
  update: (id, data) => request(`/credit-requests/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  approve: (id) => request(`/credit-requests/${id}/approve`, {
    method: 'POST'
  }),
  reject: (id) => request(`/credit-requests/${id}/reject`, {
    method: 'POST'
  })
};

// Settings API
export const settings = {
  get: () => request('/settings'),
  update: (settingsData) => request('/settings', {
    method: 'PUT',
    body: JSON.stringify(settingsData)
  })
};

// Time Entries API - for clock in/out tracking
export const timeEntries = {
  getAll: () => request('/time-entries'),
  
  getStatus: () => request('/clock-status'),
  
  create: (action) => request('/time-entries', {
    method: 'POST',
    body: JSON.stringify({ action })
  }),
  
  update: (id, data) => request(`/time-entries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  
  delete: (id) => request(`/time-entries/${id}`, {
    method: 'DELETE'
  })
};

// Batches API
export const batches = {
  getAll: (productId) => {
    const url = productId ? `/batches?productId=${productId}` : '/batches';
    return request(url);
  },
  create: (batchData) => request('/batches', {
    method: 'POST',
    body: JSON.stringify(batchData)
  })
};

// Production API
export const production = {
  getAll: () => request('/production'),
  create: (productionData) => request('/production', {
    method: 'POST',
    body: JSON.stringify(productionData)
  })
};

// Categories API
export const categories = {
  generateCode: (data) => request('/categories/generate-code', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};

// Image Upload API
export const uploadImage = (imageData) => request('/upload-image', {
  method: 'POST',
  body: JSON.stringify(imageData)
});

// Main Admin API (for owner dashboard)
export const mainAdmin = {
  login: (credentials) => {
    // Use owner token for main admin requests
    return request('/main-admin/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },
  getUsers: () => {
    const token = localStorage.getItem('token') || localStorage.getItem('ownerToken') || localStorage.getItem('mainAdminToken');
    return request('/main-admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },
  getStats: () => {
    const token = localStorage.getItem('token') || localStorage.getItem('ownerToken') || localStorage.getItem('mainAdminToken');
    return request('/main-admin/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },
  getActivities: () => {
    const token = localStorage.getItem('token') || localStorage.getItem('ownerToken') || localStorage.getItem('mainAdminToken');
    return request('/main-admin/activities', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },
  getSalesAll: () => {
    const token = localStorage.getItem('token') || localStorage.getItem('ownerToken') || localStorage.getItem('mainAdminToken');
    return request('/main-admin/sales-all', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },
  getTimeEntriesAll: () => {
    const token = localStorage.getItem('token') || localStorage.getItem('ownerToken') || localStorage.getItem('mainAdminToken');
    return request('/main-admin/time-entries-all', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },
  lockUser: (userId, locked) => {
    const token = localStorage.getItem('token') || localStorage.getItem('ownerToken') || localStorage.getItem('mainAdminToken');
    return request(`/main-admin/users/${userId}/lock`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ locked })
    });
  },
  changePlan: (userId, plan) => {
    const token = localStorage.getItem('token') || localStorage.getItem('ownerToken') || localStorage.getItem('mainAdminToken');
    return request(`/main-admin/users/${userId}/plan`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ plan })
    });
  },
  createUser: (userData) => {
    const token = localStorage.getItem('token') || localStorage.getItem('ownerToken') || localStorage.getItem('mainAdminToken');
    return request('/main-admin/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });
  },
  resetPassword: (userId, tempPassword) => {
    const token = localStorage.getItem('token') || localStorage.getItem('ownerToken') || localStorage.getItem('mainAdminToken');
    return request(`/main-admin/users/${userId}/reset-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ temp_password: tempPassword })
    });
  },
  sendEmail: (payload) => {
    const token = localStorage.getItem('token') || localStorage.getItem('ownerToken') || localStorage.getItem('mainAdminToken');
    return request('/main-admin/send-email', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  },
  getEmailTemplates: () => {
    const token = localStorage.getItem('token') || localStorage.getItem('ownerToken') || localStorage.getItem('mainAdminToken');
    return request('/main-admin/email-templates', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },
  createEmailTemplate: (payload) => {
    const token = localStorage.getItem('token') || localStorage.getItem('ownerToken') || localStorage.getItem('mainAdminToken');
    return request('/main-admin/email-templates', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  },
  updateEmailTemplate: (templateId, payload) => {
    const token = localStorage.getItem('token') || localStorage.getItem('ownerToken') || localStorage.getItem('mainAdminToken');
    return request(`/main-admin/email-templates/${templateId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  },
  deleteEmailTemplate: (templateId) => {
    const token = localStorage.getItem('token') || localStorage.getItem('ownerToken') || localStorage.getItem('mainAdminToken');
    return request(`/main-admin/email-templates/${templateId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },
  clearData: (type) => {
    const token = localStorage.getItem('token') || localStorage.getItem('ownerToken') || localStorage.getItem('mainAdminToken');
    return request('/main-admin/system/clear-data', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ type })
    });
  },
  getSubscribers: () => {
    const token = localStorage.getItem('token') || localStorage.getItem('ownerToken') || localStorage.getItem('mainAdminToken');
    return request('/main-admin/subscribers', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },
  getSubscribersAnalytics: () => {
    const token = localStorage.getItem('token') || localStorage.getItem('ownerToken') || localStorage.getItem('mainAdminToken');
    return request('/main-admin/subscribers/analytics', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },
  getSessions: () => {
    const token = localStorage.getItem('token') || localStorage.getItem('ownerToken') || localStorage.getItem('mainAdminToken');
    return request('/main-admin/sessions', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },
  revokeSession: (sessionId) => {
    const token = localStorage.getItem('token') || localStorage.getItem('ownerToken') || localStorage.getItem('mainAdminToken');
    return request(`/main-admin/sessions/${sessionId}/revoke`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },
  getUsersWithSubscriptions: () => {
    const token = localStorage.getItem('token') || localStorage.getItem('ownerToken') || localStorage.getItem('mainAdminToken');
    return request('/main-admin/users-with-subscriptions', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
};

// Admin Support Messaging API
export const adminSupport = {
  getMessages: () => request('/admin-support/messages'),
  sendMessage: (payload) => request('/admin-support/messages', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  closeMessage: (messageId) => request(`/admin-support/messages/${messageId}/close`, {
    method: 'POST'
  })
};

// Utility function to check if backend is available
export const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${BASE_API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${getToken() || 'invalid'}`
      }
    });
    // If we get 200 or 401, the backend is alive. 
    // If we get connection refused, it throws.
    return response.status < 500;
  } catch (error) {
    return false;
  }
};

// Export base URL for other components to use
export { BASE_API_URL };

// WebSocket-backed product subscription helper
let __ws = null;
let __wsCallbacks = new Set();

function _getWsUrl() {
  const wsBase = BASE_API_URL.replace(/\/api$/, '');
  const proto = wsBase.startsWith('https') ? 'wss' : 'ws';
  return `${proto}://${wsBase.replace(/^https?:\/\//, '')}/api/ws/products`;
}

function _ensureWs() {
  if (__ws && (__ws.readyState === WebSocket.OPEN || __ws.readyState === WebSocket.CONNECTING)) return;
  const token = getToken();
  const url = _getWsUrl() + (token ? `?token=${encodeURIComponent(token)}` : '');
  __ws = new WebSocket(url);
  __ws.onopen = () => {
    console.debug('Products WS connected');
  };
  __ws.onmessage = (ev) => {
    let data = null;
    try { data = JSON.parse(ev.data); } catch (e) { return; }
    __wsCallbacks.forEach(cb => {
      try { cb(data); } catch (e) { console.error('ws callback error', e); }
    });
  };
  __ws.onclose = () => {
    console.debug('Products WS closed');
    __ws = null;
  };
  __ws.onerror = (e) => {
    console.error('Products WS error', e);
  };
}

export function subscribeProducts(onMessage) {
  if (typeof onMessage !== 'function') throw new Error('subscribeProducts requires a callback');
  __wsCallbacks.add(onMessage);
  _ensureWs();
  // return unsubscribe
  return () => {
    __wsCallbacks.delete(onMessage);
    if (__ws && __wsCallbacks.size === 0) {
      try { __ws.close(); } catch (e) {}
      __ws = null;
    }
  };
}

export function unsubscribeAllProductSubscriptions() {
  __wsCallbacks.clear();
  if (__ws) {
    try { __ws.close(); } catch (e) {}
    __ws = null;
  }
}

// Recipes API
export const recipes = {
  getAll: () => request('/recipes'),
  create: (data) => request('/recipes', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => request(`/recipes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => request(`/recipes/${id}`, {
    method: 'DELETE'
  })
};

// Cashier Notes API
export const cashierNotes = {
  getAll: () => request('/cashier-notes'),
  create: (data) => request('/cashier-notes', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  markAsRead: (id) => request(`/cashier-notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ read: true })
  }),
  delete: (id) => request(`/cashier-notes/${id}`, {
    method: 'DELETE'
  })
};

// Default export - Generic API methods for custom endpoints
const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, data) => request(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  put: (endpoint, data) => request(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' })
};

export default api;
