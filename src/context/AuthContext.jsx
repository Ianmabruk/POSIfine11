import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { auth, users, BASE_API_URL } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import LockedAccount from '../components/LockedAccount';
import { refreshAuthSession } from '../utils/authRefresh';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [authError, setAuthError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [appSettings, setAppSettings] = useState(() => {
    const cachedLogo = localStorage.getItem('appLogo');
    return cachedLogo ? { logo: cachedLogo } : {};
  });

  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  const normalizeUser = useCallback((rawUser) => {
    if (!rawUser) return rawUser;
    const active = rawUser.active ?? rawUser.is_active ?? rawUser.account_active ?? true;
    const plan = rawUser.plan ?? rawUser.subscription ?? rawUser.account_plan;
    const profilePicture = rawUser.profilePicture ?? rawUser.profile_picture ?? null;
    const businessLogo = rawUser.business_logo ?? rawUser.businessLogo ?? null;
    const businessType = rawUser.business_type ?? rawUser.businessType ?? null;
    const businessName = rawUser.business_name ?? rawUser.businessName ?? null;
    const accountId = rawUser.account_id ?? rawUser.accountId ?? null;
    const deviceMode = rawUser.device_mode ?? rawUser.deviceMode ?? null;
    return {
      ...rawUser,
      active,
      plan,
      profilePicture,
      profile_picture: profilePicture,
      business_logo: businessLogo,
      businessLogo,
      business_type: businessType,
      businessType,
      business_name: businessName,
      businessName,
      account_id: accountId,
      accountId,
      device_mode: deviceMode,
      deviceMode,
    };
  }, []);

  const clearAuthStorage = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('csrfToken');
    localStorage.removeItem('appLogo');
    localStorage.removeItem('mainAdminToken');
    localStorage.removeItem('ownerToken');
    localStorage.removeItem('mainAdminUser');
    localStorage.removeItem('ownerUser');
    const prefixes = ['products_cache_', 'settings_cache_', 'subscription_cache_', 'api_cache_'];
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && prefixes.some(prefix => key.startsWith(prefix))) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
    sessionStorage.removeItem('reminderShown');
    sessionStorage.removeItem('adminReminderShown');
  }, []);

  const loadAppSettings = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAppSettings({});
      return;
    }
    const cacheKey = `settings_cache_${token.slice(-8)}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data, expiresAt } = JSON.parse(cached);
        if (Date.now() < expiresAt) {
          setAppSettings(data || {});
          return;
        }
      } catch { /* ignore */ }
    }
    try {
      const response = await fetch(`${BASE_API_URL}/settings`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error('Failed to load settings');
      }
      const data = await response.json();
      setAppSettings(data || {});
      localStorage.setItem(cacheKey, JSON.stringify({ data, expiresAt: Date.now() + 5 * 60 * 1000 }));
    } catch (error) {
      console.warn('Failed to load app settings', error);
    }
  }, []);

  const checkSubscriptionStatus = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setSubscriptionStatus(null);
      return;
    }
    const cacheKey = `subscription_cache_${token.slice(-8)}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data, expiresAt } = JSON.parse(cached);
        if (Date.now() < expiresAt) {
          setSubscriptionStatus(data);
          return;
        }
      } catch { /* ignore */ }
    }
    try {
      const response = await fetch(`${BASE_API_URL}/subscription/status`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data);
        localStorage.setItem(cacheKey, JSON.stringify({ data, expiresAt: Date.now() + 60 * 1000 }));
      } else if (response.status === 401) {
        setSubscriptionStatus(null);
      } else {
        setSubscriptionStatus(null);
      }
    } catch (error) {
      setSubscriptionStatus(null);
    }
  }, []);

  const initializeAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    setAuthError(null);
    setIsRefreshing(false);

    if (!token) {
      clearAuthStorage();
      setUser(null);
      setLoading(false);
      setIsInitialized(true);
      return;
    }

    const cachedUser = localStorage.getItem('user');
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser);
        setUser(normalizeUser(parsed));
      } catch {
        // ignore corrupted cache
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${BASE_API_URL}/auth/me`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const normalized = normalizeUser(data);
        setUser(normalized);
        localStorage.setItem('user', JSON.stringify(normalized));
      } else if (response.status === 401) {
        const refreshed = await refreshAuthSession();
        if (refreshed?.token) {
          try {
            const verifyResp = await fetch(`${BASE_API_URL}/auth/me`, {
              credentials: 'include',
              headers: { Authorization: `Bearer ${refreshed.token}`, 'Content-Type': 'application/json' },
            });
            if (verifyResp.ok) {
              const data = await verifyResp.json();
              const normalized = normalizeUser(data);
              setUser(normalized);
              localStorage.setItem('user', JSON.stringify(normalized));
            } else {
              clearAuthStorage();
              setUser(null);
              setAuthError('Session expired. Please sign in again.');
            }
          } catch {
            clearAuthStorage();
            setUser(null);
          }
        } else {
          clearAuthStorage();
          setUser(null);
          setAuthError('Session expired. Please sign in again.');
        }
      } else {
        setUser(null);
        setAuthError('Unable to verify session. Please try again.');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        const refreshed = await refreshAuthSession();
        if (refreshed?.token) {
          try {
            const verifyResp = await fetch(`${BASE_API_URL}/auth/me`, {
              credentials: 'include',
              headers: { Authorization: `Bearer ${refreshed.token}`, 'Content-Type': 'application/json' },
            });
            if (verifyResp.ok) {
              const data = await verifyResp.json();
              const normalized = normalizeUser(data);
              setUser(normalized);
              localStorage.setItem('user', JSON.stringify(normalized));
              setAuthError(null);
            } else {
              clearAuthStorage();
              setUser(null);
              setAuthError('Session expired. Please sign in again.');
            }
          } catch {
            clearAuthStorage();
            setUser(null);
          }
        } else {
          clearAuthStorage();
          setUser(null);
        }
      } else {
        clearAuthStorage();
        setUser(null);
        setAuthError('Network error. Please check your connection.');
      }
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, [clearAuthStorage, normalizeUser]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    const handleSettingsChanged = (event) => {
      if (event?.detail) {
        setAppSettings((prev) => {
          const next = { ...prev, ...event.detail };
          return next;
        });
        return;
      }
      loadAppSettings();
    };
    window.addEventListener('settingsChanged', handleSettingsChanged);
    return () => window.removeEventListener('settingsChanged', handleSettingsChanged);
  }, [loadAppSettings]);

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setUser(normalizeUser(parsed));
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
  }, [normalizeUser]);

  const login = async (payload) => {
    try {
      if (payload && payload.token && payload.user) {
        const normalized = normalizeUser(payload.user);
        localStorage.setItem('token', payload.token);
        if (payload.refreshToken) {
          localStorage.setItem('refreshToken', payload.refreshToken);
        }
        if (payload.csrfToken) {
          localStorage.setItem('csrfToken', payload.csrfToken);
        }
        localStorage.setItem('user', JSON.stringify(normalized));
        setUser(normalized);
        loadAppSettings();
        checkSubscriptionStatus();
        return payload;
      }

      const response = await auth.login(payload);
      if (response.token && response.user) {
        const normalized = normalizeUser(response.user);
        localStorage.setItem('token', response.token);
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
        if (response.csrfToken) {
          localStorage.setItem('csrfToken', response.csrfToken);
        }
        localStorage.setItem('user', JSON.stringify(normalized));
        setUser(normalized);
        loadAppSettings();
        checkSubscriptionStatus();
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
        const normalized = normalizeUser(response.user);
        localStorage.setItem('token', response.token);
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
        if (response.csrfToken) {
          localStorage.setItem('csrfToken', response.csrfToken);
        }
        localStorage.setItem('user', JSON.stringify(normalized));
        setUser(normalized);
        loadAppSettings();
        checkSubscriptionStatus();
        return response;
      }
      throw new Error('Invalid response from server');
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const updateUser = async (updated) => {
    try {
      const normalized = normalizeUser(updated);
      localStorage.setItem('user', JSON.stringify(normalized));
      setUser(normalized);
      window.dispatchEvent(new Event('localStorageUpdated'));

      if (updated && updated.id) {
        try {
          const result = await users.update(updated.id, updated);
          const persistedUser = normalizeUser(result?.user || result || updated);
          localStorage.setItem('user', JSON.stringify(persistedUser));
          setUser(persistedUser);
          window.dispatchEvent(new Event('localStorageUpdated'));
        } catch (err) {
          console.warn('Failed to persist updated user to backend', err);
        }
      }

      return updated;
    } catch (error) {
      console.error('updateUser failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');

    clearAuthStorage();
    setUser(null);
    setAppSettings({});
    setSubscriptionStatus(null);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      if (refreshToken) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        fetch(`${BASE_API_URL}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
          headers,
          body: JSON.stringify({ refreshToken }),
          signal: controller.signal
        }).catch(() => {}).finally(() => clearTimeout(timer));
      }
    } catch (e) {
      // ignore
    } finally {
      window.location.replace('/logged-out');
    }
  };

  const isAuthenticated = useCallback(() => {
    const hasRegularToken = !!localStorage.getItem('token');
    const hasMainAdminToken = !!localStorage.getItem('mainAdminToken') || !!localStorage.getItem('ownerToken');
    return !!user && (hasRegularToken || hasMainAdminToken);
  }, [user]);

  const hasRole = useCallback((role) => user && (user.role === role), [user]);

  const isOwner = useCallback(() => user && (user.role === 'main_admin' || user.role === 'owner'), [user]);

  const isAdmin = useCallback(() => user && (user.role === 'admin' || user.role === 'main_admin'), [user]);

  const isCashier = useCallback(() => user && (user.role === 'cashier'), [user]);

  const getDashboardUrl = useCallback((userRole = null) => {
    const role = userRole || user?.role;
    if (role === 'main_admin') {
      return '/main.admin';
    } else if (role === 'admin') {
      return '/admin';
    } else if (role === 'cashier') {
      return '/dashboard/cashier';
    } else {
      return '/dashboard';
    }
  }, [user]);

  const isStarterPackage = useCallback(() => user && (user.plan === 'starter'), [user]);
  const isBusinessPackage = useCallback(() => user && (user.plan === 'business'), [user]);
  const canEditStock = useCallback(() => user && (user.role === 'admin' || user.role === 'main_admin' || user.role === 'cashier'), [user]);
  const canManageUsers = useCallback(() => user && (user.role === 'admin' || user.role === 'main_admin'), [user]);
  const canViewAnalytics = useCallback(() => user && (user.role === 'admin' || user.role === 'main_admin'), [user]);
  const isRealTimeProductSyncEnabled = useCallback(() => true, []);
  const isCashierUserManagementEnabled = useCallback(() => true, []);

  if (user?.locked) {
    return <LockedAccount />;
  }

  const contextValue = useMemo(() => ({
    user,
    loading,
    isInitialized,
    authError,
    isRefreshing,
    appSettings,
    loadAppSettings,
    subscriptionStatus,
    checkSubscriptionStatus,
    login,
    signup,
    updateUser,
    logout,
    isAuthenticated,
    hasRole,
    isOwner,
    isAdmin,
    isCashier,
    getDashboardUrl,
    isStarterPackage,
    isBusinessPackage,
    canEditStock,
    canManageUsers,
    canViewAnalytics,
    isRealTimeProductSyncEnabled,
    isCashierUserManagementEnabled,
    clearAuthStorage,
  }), [user, loading, isInitialized, authError, isRefreshing, appSettings, subscriptionStatus, isAuthenticated,
      hasRole, isOwner, isAdmin, isCashier, getDashboardUrl,       isStarterPackage, isBusinessPackage,
      canEditStock, canManageUsers, canViewAnalytics, loadAppSettings, checkSubscriptionStatus,
      clearAuthStorage]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
