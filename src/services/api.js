
// Updated API Service Layer - Connected to Deployed Backend

const getBaseUrl = () => {
  // Return empty string to use mock responses only
  return '';
};

const BASE_API_URL = getBaseUrl();

const getToken = () => localStorage.getItem('token');

const request = async (endpoint, options = {}) => {
  const token = getToken();
  
  // Ensure endpoint starts with / to avoid double slash or missing slash issues when combining
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // Avoid attaching Authorization header to auth endpoints like /auth/login and /auth/signup
      // This prevents stale/invalid tokens from causing 401s on public auth routes.
      // Also skip for main-admin auth endpoint
      ...(token && !(cleanEndpoint.startsWith('/auth') && cleanEndpoint !== '/auth/me') && !cleanEndpoint.includes('/main-admin/auth/login') && { Authorization: `Bearer ${token}` }),
      ...options.headers
    }
  };

  try {
    const response = await fetch(`${BASE_API_URL}${cleanEndpoint}`, config);

    // Handle authentication errors
    if (response.status === 401) {
      // Clear stale token and local user information
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Avoid redirect loops: allow auth routes (/login, /signup, /auth) to handle UI
      const path = window.location.pathname || '';
      if (!path.includes('/login') && !path.includes('/signup') && !path.includes('/auth') && !path.includes('/main.admin')) {
        try {
          window.location.href = '/login';
        } catch (e) {
          // ignore navigation errors in non-browser contexts
        }
      }

      // Throw a clear, specific Unauthorized error for callers to handle
      const err = new Error('Unauthorized');
      err.status = 401;
      throw err;
    }

    // Handle 500 errors - throw specific error for demo mode
    if (response.status === 500) {
      throw new Error('Server error 500 - Backend unavailable');
    }

    // Handle successful responses
    if (response.ok) {
      // Handle empty responses (like DELETE operations)
      if (response.status === 204) {
        return { success: true };
      }
      return await response.json();
    }

    // Handle HTTP errors
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);

  } catch (error) {
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error("API Fetch Error:", error);
      console.error("Attempted URL:", `${BASE_API_URL}${cleanEndpoint}`);
      throw new Error('Cannot connect to server. Please check your internet connection.');
    }
    throw error;
  }
};


// Authentication API
export const auth = {
  login: async (credentials) => {
    // Mock successful login
    return {
      token: 'demo_token_' + Date.now(),
      user: {
        id: 1,
        email: credentials.email,
        name: 'Demo User',
        role: 'admin',
        plan: 'ultra',
        accountId: 1,
        active: true
      }
    };
  },
  
  pinLogin: async (credentials) => {
    // Mock successful PIN login
    return {
      token: 'demo_token_' + Date.now(),
      user: {
        id: 2,
        email: credentials.email,
        name: 'Demo Cashier',
        role: 'cashier',
        plan: 'ultra',
        accountId: 1,
        active: true
      }
    };
  },
  
  signup: async (data) => {
    // Mock successful signup
    return {
      token: 'demo_token_' + Date.now(),
      user: {
        id: Date.now(),
        email: data.email,
        name: data.name,
        role: data.plan === 'ultra' ? 'admin' : 'cashier',
        plan: data.plan || 'basic',
        accountId: Date.now(),
        active: true
      }
    };
  },
  
  signupWithPayment: async (data) => {
    return auth.signup(data);
  },
  
  me: async () => {
    return {
      id: 1,
      email: 'demo@example.com',
      name: 'Demo User',
      role: 'admin',
      plan: 'ultra',
      accountId: 1,
      active: true
    };
  }
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
  getAll: async () => {
    return [
      { id: 1, name: 'Coffee', price: 150, quantity: 20, category: 'beverages' },
      { id: 2, name: 'Sandwich', price: 300, quantity: 15, category: 'food' }
    ];
  },
  
  create: async (productData) => {
    return {
      id: Date.now(),
      ...productData,
      price: parseFloat(productData.price),
      quantity: parseInt(productData.quantity) || 0
    };
  },
  
  update: async (id, productData) => {
    return { id, ...productData };
  },
  
  delete: async (id) => {
    return { success: true };
  },
  
  getMaxProducible: async (id) => {
    return { maxProducible: 10 };
  }
};

// Sales API
export const sales = {
  getAll: async () => {
    return [
      { id: 1, total: 450, items: [{ name: 'Coffee', quantity: 2 }], createdAt: new Date().toISOString() }
    ];
  },
  
  create: async (saleData) => {
    return {
      id: Date.now(),
      ...saleData,
      createdAt: new Date().toISOString()
    };
  }
};

// Expenses API
export const expenses = {
  getAll: () => request('/expenses'),
  
  create: (expenseData) => request('/expenses', {
    method: 'POST',
    body: JSON.stringify(expenseData)
  })
};

// Statistics API
export const stats = {
  get: () => request('/stats')
};

// Reminders API
export const reminders = {
  getAll: async () => {
    return [];
  },
  getToday: async () => {
    return [];
  },
  create: async (reminderData) => {
    return { id: Date.now(), ...reminderData };
  },
  update: async (id, reminderData) => {
    return { id, ...reminderData };
  },
  delete: async (id) => {
    return { success: true };
  }
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
  approve: (id) => request(`/credit-requests/${id}/approve`, {
    method: 'POST'
  }),
  reject: (id) => request(`/credit-requests/${id}/reject`, {
    method: 'POST'
  })
};

// Settings API
export const settings = {
  get: async () => {
    return {
      screenLockPassword: '2005',
      businessName: 'My Business'
    };
  },
  update: async (settingsData) => {
    return settingsData;
  }
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
    const token = localStorage.getItem('ownerToken');
    return request('/main-admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },
  getStats: () => {
    const token = localStorage.getItem('ownerToken');
    return request('/main-admin/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },
  getActivities: () => {
    const token = localStorage.getItem('ownerToken');
    return request('/main-admin/activities', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },
  lockUser: (userId, locked) => {
    const token = localStorage.getItem('ownerToken');
    return request(`/main-admin/users/${userId}/lock`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ locked })
    });
  },
  changePlan: (userId, plan) => {
    const token = localStorage.getItem('ownerToken');
    return request(`/main-admin/users/${userId}/plan`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ plan })
    });
  },
  clearData: (type) => {
    const token = localStorage.getItem('ownerToken');
    return request('/main-admin/system/clear-data', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ type })
    });
  }
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

