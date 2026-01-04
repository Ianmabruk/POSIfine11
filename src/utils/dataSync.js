/**
 * Data synchronization utility for syncing localStorage data to backend
 */

const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5001/api';

export const syncUserToBackend = async (userData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;

    // Check if user already exists in backend
    const checkResponse = await fetch(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (checkResponse.ok) {
      const users = await checkResponse.json();
      const existingUser = users.find(u => u.email === userData.email);

      if (existingUser) {
        // Update existing user
        const updateResponse = await fetch(`${API_URL}/users/${existingUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(userData)
        });
        return updateResponse.ok;
      } else {
        // Create new user (admin creating cashier)
        const createResponse = await fetch(`${API_URL}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(userData)
        });
        return createResponse.ok;
      }
    }
  } catch (error) {
    console.warn('Failed to sync user to backend:', error);
    return false;
  }
  return false;
};

export const syncDataToBackend = async (endpoint, data) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;

    const response = await fetch(`${API_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    return response.ok;
  } catch (error) {
    console.warn(`Failed to sync ${endpoint} to backend:`, error);
    return false;
  }
};

export const getLocalUsers = () => {
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      return [JSON.parse(storedUser)];
    }
  } catch (error) {
    console.error('Error getting local users:', error);
  }
  return [];
};

export const getLocalData = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error getting local ${key}:`, error);
    return [];
  }
};

export const isBackendAvailable = async () => {
  try {
    const response = await fetch(`${API_URL}/stats`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.ok;
  } catch {
    return false;
  }
};
