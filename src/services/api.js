
// Updated API Service Layer - Connected to Deployed Backend

const getBaseUrl = () => {
  // Production: Use Vercel backend URL
  if (import.meta.env.PROD) {
    return 'https://posifine11-backend-spu4.vercel.app/api';
  }
  // Development: Use local backend
  return 'http://localhost:5002/api';
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
      throw new Error('Cannot connect to server. Please ensure the backend is running on port 5002.');
    }
    throw error;
  }
};


// Authentication API
export const auth = {
  login: (credentials) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  
  pinLogin: (credentials) => request('/auth/pin-login', {
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
  
  me: () => request('/auth/me')
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
  getAll: () => request('/products'),
  
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
  
  getMaxProducible: (id) => request(`/products/${id}/max-producible`)
};

// Sales API
export const sales = {
  getAll: () => request('/sales'),
  
  create: (saleData) => request('/sales', {
    method: 'POST',
    body: JSON.stringify(saleData)
  })
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
    method: 'POST',
    body: JSON.stringify(settingsData)
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

