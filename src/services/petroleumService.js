const getBaseUrl = () => {
  return import.meta.env.VITE_API_BASE || ((typeof window !== 'undefined' ? window.location.origin : '') + '/api');
};

const BASE_API_URL = getBaseUrl();

const getToken = () => localStorage.getItem('token');

const toQueryString = (params = {}) => {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (!entries.length) return '';
  const search = new URLSearchParams(entries);
  return `?${search.toString()}`;
};

const request = async (endpoint, options = {}) => {
  const token = getToken();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const response = await fetch(`${BASE_API_URL}${cleanEndpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  if (response.status === 204) return { success: true };

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  return data;
};

export const petroleumService = {
  getTanks: () => request('/petroleum/tanks'),
  createTank: (payload) => request('/petroleum/tanks', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  updateTank: (id, payload) => request(`/petroleum/tanks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),
  deleteTank: (id) => request(`/petroleum/tanks/${id}`, {
    method: 'DELETE'
  }),

  getSales: (params) => request(`/petroleum/sales${toQueryString(params)}`),
  createSale: (payload) => request('/petroleum/sales', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  getStaff: () => request('/petroleum/staff'),
  createStaff: (payload) => request('/petroleum/staff', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  updateStaff: (id, payload) => request(`/petroleum/staff/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),
  deleteStaff: (id) => request(`/petroleum/staff/${id}`, {
    method: 'DELETE'
  })
};
