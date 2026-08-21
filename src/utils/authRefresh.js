import { getToken, getRefreshToken, getCsrfToken } from '../services/api';

let refreshPromise = null;

export async function refreshAuthSession() {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  const baseUrl = (import.meta.env.VITE_API_BASE || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000') + '/api').replace(/\/$/, '');

  refreshPromise = fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(getCsrfToken() ? { 'X-CSRF-Token': getCsrfToken() } : {}),
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
