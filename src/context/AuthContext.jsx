import { createContext, useContext, useState, useEffect } from 'react';
import { auth, users, BASE_API_URL } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [appSettings, setAppSettings] = useState({});

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    // Update user state when localStorage changes in other tabs or when we dispatch a custom event
    const handleStorage = () => {
      const saved = localStorage.getItem('user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setUser(parsed);
        } catch (e) {
          console.warn('Failed to parse user from localStorage', e);
        }
      } else {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('localStorageUpdated', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('localStorageUpdated', handleStorage);
    };
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token) {
        // First verify with backend using a direct fetch so that the
        // global API layer's 401 redirect behavior doesn't navigate away
        // from public pages (like the landing page) during initialization.
        try {
          const resp = await fetch(`${BASE_API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
          });
          if (resp.ok) {
            const data = await resp.json();
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
          } else {
            // Token invalid or server returned error — clear token and optionally fallback
            throw new Error('Invalid token');
          }
        } catch (err) {
          console.warn('Auth check failed:', err);
          // Clear invalid tokens
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

  const login = async (payload) => {
    try {
      // If payload already contains token & user (caller passed the auth response), just set state
      if (payload && payload.token && payload.user) {
        localStorage.setItem('token', payload.token);
        localStorage.setItem('user', JSON.stringify(payload.user));
        setUser(payload.user);
        return payload;
      }

      // Otherwise assume credentials were provided and call API
      const response = await auth.login(payload);
      if (response.token && response.user) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        return response;
      }
      throw new Error('Invalid response from server');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signup = async (userData) => {
    try {
      const response = await auth.signup(userData);
      if (response.token && response.user) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        return response;
      }
      throw new Error('Invalid response from server');
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  // Update the user both locally and on backend (if possible)
  const updateUser = async (updated) => {
    try {
      // Persist locally first for immediate UI update
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      // Notify other listeners in same tab
      window.dispatchEvent(new Event('localStorageUpdated'));

      // Try to persist to backend if we have an id
      if (updated && updated.id) {
        try {
          await users.update(updated.id, updated);
        } catch (err) {
          // Non-fatal: backend update failed but local state is consistent
          console.warn('Failed to persist updated user to backend', err);
        }
      }

      return updated;
    } catch (error) {
      console.error('updateUser failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  const isAuthenticated = () => !!user && !!localStorage.getItem('token');
  
  const hasRole = (role) => user && (user.role === role);
  
  // Helper to check if user is admin
  const isAdmin = () => user && (user.role === 'admin' || user.role === 'main-admin');
  
  // Helper to check if user is cashier
  const isCashier = () => user && (user.role === 'cashier');

  // Package-related helper functions
  const isUltraPackage = () => user && (user.plan === 'ultra');
  const isBasicPackage = () => user && (user.plan === 'basic');
  const canEditStock = () => user && (user.role === 'admin' || user.role === 'cashier');
  const canManageUsers = () => user && (user.role === 'admin' && user.plan === 'ultra');
  const canViewAnalytics = () => user && (user.role === 'admin');
  const isRealTimeProductSyncEnabled = () => true;
  const isCashierUserManagementEnabled = () => true;

  // Show locked account screen if user is locked
  if (user?.locked) {
    return <LockedAccount />;
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        isInitialized,
        appSettings,
        login, 
        signup,
        updateUser,
        logout,
        isAuthenticated,
        hasRole,
        isAdmin,
        isCashier,
        isUltraPackage,
        isBasicPackage,
        canEditStock,
        canManageUsers,
        canViewAnalytics,
        isRealTimeProductSyncEnabled,
        isCashierUserManagementEnabled
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

