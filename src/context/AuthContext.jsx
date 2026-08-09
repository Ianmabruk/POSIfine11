import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { auth, users, BASE_API_URL } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import LockedAccount from '../components/LockedAccount';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [appSettings, setAppSettings] = useState(() => {
    const cachedLogo = localStorage.getItem('appLogo');
    return cachedLogo ? { logo: cachedLogo } : {};
  });

  const normalizeUser = (rawUser) => {
    if (!rawUser) return rawUser;
    const active = rawUser.active ?? rawUser.is_active ?? rawUser.account_active ?? true;
    const plan = rawUser.plan ?? rawUser.subscription ?? rawUser.account_plan;
    const profilePicture = rawUser.profilePicture ?? rawUser.profile_picture ?? null;
    const businessLogo = rawUser.business_logo ?? rawUser.businessLogo ?? null;
    const businessType = rawUser.business_type ?? rawUser.businessType ?? null;
    const accountId = rawUser.account_id ?? rawUser.accountId ?? null;
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
      account_id: accountId,
      accountId,
    };
  };

  const loadAppSettings = async () => {
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
          if (data?.logo) localStorage.setItem('appLogo', data.logo);
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
      if (data?.logo) {
        localStorage.setItem('appLogo', data.logo);
      }
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ data, expiresAt: Date.now() + 5 * 60 * 1000 }));
      } catch { /* ignore */ }
    } catch (error) {
      console.warn('Failed to load app settings', error);
    }
  };

  const checkSubscriptionStatus = async () => {
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
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data);
        try {
          localStorage.setItem(cacheKey, JSON.stringify({ data, expiresAt: Date.now() + 60 * 1000 }));
        } catch { /* ignore */ }
        if (data.status === 'expired' && !location.pathname.includes('subscription-expired') && !location.pathname.includes('choose-subscription')) {
          navigate('/subscription-expired', { replace: true });
        }
      } else {
        setSubscriptionStatus(null);
      }
    } catch (error) {
      setSubscriptionStatus(null);
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    const handleSettingsChanged = (event) => {
      if (event?.detail) {
        setAppSettings((prev) => {
          const next = { ...prev, ...event.detail };
          if (next.logo) {
            localStorage.setItem('appLogo', next.logo);
          }
          return next;
        });
        return;
      }
      loadAppSettings();
    };

    window.addEventListener('settingsChanged', handleSettingsChanged);
    return () => window.removeEventListener('settingsChanged', handleSettingsChanged);
  }, []);

  useEffect(() => {
    // Update user state when localStorage changes in other tabs or when we dispatch a custom event
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
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      const savedUser = localStorage.getItem('user');

      if (!token) {
        if (savedUser) {
          localStorage.removeItem('user');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('csrfToken');
        }
        return;
      }

      if (savedUser) {
        try {
          setUser(normalizeUser(JSON.parse(savedUser)));
        } catch (e) { /* ignore */ }
      }

      try {
        const [meResp, settingsResp] = await Promise.allSettled([
          fetch(`${BASE_API_URL}/auth/me`, {
            credentials: 'include',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
          }),
          fetch(`${BASE_API_URL}/settings`, {
            credentials: 'include',
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (meResp.status === 'fulfilled' && meResp.value.ok) {
          const data = await meResp.value.json();
          const normalized = normalizeUser(data);
          setUser(normalized);
          localStorage.setItem('user', JSON.stringify(normalized));
        } else if (meResp.status === 'fulfilled' && meResp.value.status === 401) {
          localStorage.removeItem('token');
          if (refreshToken) {
            try {
              const refreshResp = await fetch(`${BASE_API_URL}/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
              });
              if (refreshResp.ok) {
                const refreshed = await refreshResp.json();
                if (refreshed?.token && refreshed?.user) {
                  const normalized = normalizeUser(refreshed.user);
                  localStorage.setItem('token', refreshed.token);
                  if (refreshed.refreshToken) localStorage.setItem('refreshToken', refreshed.refreshToken);
                  if (refreshed.csrfToken) localStorage.setItem('csrfToken', refreshed.csrfToken);
                  localStorage.setItem('user', JSON.stringify(normalized));
                  setUser(normalized);
                  return;
                }
              }
            } catch (refreshErr) {
              console.warn('Refresh failed:', refreshErr);
            }
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('csrfToken');
          }
          localStorage.removeItem('user');
          setUser(null);
        }

        if (settingsResp.status === 'fulfilled' && settingsResp.value.ok) {
          try {
            const data = await settingsResp.value.json();
            setAppSettings(data || {});
            if (data?.logo) localStorage.setItem('appLogo', data.logo);
          } catch (e) { /* ignore */ }
        }
      } catch (err) {
        console.warn('Auth check failed (network error):', err.message);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      const token = localStorage.getItem('token');
      if (token) {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try { setUser(normalizeUser(JSON.parse(savedUser))); } catch (e) { setUser(null); }
        } else {
          setUser(null);
        }
      } else {
        localStorage.removeItem('user');
        setUser(null);
      }
    } finally {
      setLoading(false);
      setIsInitialized(true);
      if (localStorage.getItem('token')) {
        setTimeout(() => checkSubscriptionStatus(), 2000);
      }
    }
  };


  const login = async (payload) => {
    try {
      // CRITICAL: Fully clear ALL previous session data before setting new session.
      // This prevents data leaking between different users/accounts.
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('csrfToken');
      localStorage.removeItem('appLogo');
      // Clear ALL products caches from any previous account
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('products_cache_')) {
          localStorage.removeItem(key);
        }
      });
      // Clear session flags so they don't bleed across accounts
      sessionStorage.removeItem('reminderShown');
      sessionStorage.removeItem('adminReminderShown');
      setUser(null);
      setAppSettings({});

      // If payload already contains token & user (caller passed the auth response), just set state
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
        // Fetch settings in background — non-blocking
        setTimeout(() => loadAppSettings(), 0);
        setTimeout(() => checkSubscriptionStatus(), 500);
        return payload;
      }

      // Otherwise assume credentials were provided and call API
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
        // Fetch settings in background — non-blocking
        setTimeout(() => loadAppSettings(), 0);
        setTimeout(() => checkSubscriptionStatus(), 500);
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
      // CRITICAL: Fully clear ALL previous session data before creating new account.
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('csrfToken');
      localStorage.removeItem('appLogo');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('products_cache_')) {
          localStorage.removeItem(key);
        }
      });
      sessionStorage.removeItem('reminderShown');
      sessionStorage.removeItem('adminReminderShown');
      setUser(null);
      setAppSettings({});

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
        setTimeout(() => loadAppSettings(), 0);
        setTimeout(() => checkSubscriptionStatus(), 500);
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
      const normalized = normalizeUser(updated);
      localStorage.setItem('user', JSON.stringify(normalized));
      setUser(normalized);
      // Notify other listeners in same tab
      window.dispatchEvent(new Event('localStorageUpdated'));

      // Try to persist to backend if we have an id
      if (updated && updated.id) {
        try {
          const result = await users.update(updated.id, updated);
          const persistedUser = normalizeUser(result?.user || result || updated);
          localStorage.setItem('user', JSON.stringify(persistedUser));
          setUser(persistedUser);
          window.dispatchEvent(new Event('localStorageUpdated'));
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

  const logout = async () => {
    // Capture refresh token before clearing localStorage
    const refreshToken = localStorage.getItem('refreshToken');

    // Clear local state immediately so the UI updates even if the API call is slow
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('csrfToken');
    localStorage.removeItem('appLogo');
    // Clear ALL products caches to prevent data leaking across accounts
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('products_cache_')) {
        localStorage.removeItem(key);
      }
    });
    // Clear session flags so they don't persist across re-logins
    sessionStorage.removeItem('reminderShown');
    sessionStorage.removeItem('adminReminderShown');
    setUser(null);
    setAppSettings({});

    try {
      if (refreshToken) {
        // Fire-and-forget with a 3s timeout so logout is never blocked
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        await fetch(`${BASE_API_URL}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
          signal: controller.signal
        }).catch(() => {});
        clearTimeout(timer);
      }
    } catch (e) {
      // ignore
    } finally {
      // Use replace so back-button doesn't return to a stale dashboard.
      window.location.replace('/logged-out');
    }
  };

  const isAuthenticated = useCallback(() => !!user && !!localStorage.getItem('token'), [user]);
  
  const hasRole = useCallback((role) => user && (user.role === role), [user]);
  
  const isOwner = useCallback(() => user && (user.role === 'main_admin'), [user]);
  
  const isAdmin = useCallback(() => user && (user.role === 'admin' || user.role === 'main_admin'), [user]);
  
  const isCashier = useCallback(() => user && (user.role === 'cashier'), [user]);
  
  /**
   * Get the correct dashboard URL for the current user's role
   * This ensures consistent redirects across the application
   * 
  * Role hierarchy:
  * - 'main_admin' (Main Admin/Super Admin) → /main.admin
   * - 'admin' (Regular Business Admin) → /admin
   * - 'cashier' (POS Staff) → /cashier
   */
  const getDashboardUrl = useCallback((userRole = null) => {
    const role = userRole || user?.role;
    
    if (role === 'main_admin') {
      return '/main.admin';
    } else if (role === 'admin') {
      return '/admin';
    } else if (role === 'cashier') {
      return '/cashier';
    } else {
      return '/dashboard'; // Fallback
    }
  }, [user]);

  // Package-related helper functions
  const isUltraPackage = useCallback(() => user && (user.plan === 'ultra'), [user]);
  const isBasicPackage = useCallback(() => user && (user.plan === 'basic'), [user]);
  const canEditStock = useCallback(() => user && (user.role === 'admin' || user.role === 'main_admin' || user.role === 'cashier'), [user]);
  const canManageUsers = useCallback(() => user && (user.role === 'admin' || user.role === 'main_admin'), [user]);
  const canViewAnalytics = useCallback(() => user && (user.role === 'admin' || user.role === 'main_admin'), [user]);
  const isRealTimeProductSyncEnabled = useCallback(() => true, []);
  const isCashierUserManagementEnabled = useCallback(() => true, []);

  // Show locked account screen if user is locked
  if (user?.locked) {
    return <LockedAccount />;
  }

  const contextValue = useMemo(() => ({ 
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
    isOwner,
    isAdmin,
    isCashier,
    getDashboardUrl,
    isUltraPackage,
    isBasicPackage,
    canEditStock,
    canManageUsers,
    canViewAnalytics,
    isRealTimeProductSyncEnabled,
    isCashierUserManagementEnabled
  }), [user, loading, isInitialized, appSettings, isAuthenticated, hasRole, isOwner, isAdmin, isCashier, getDashboardUrl, isUltraPackage, isBasicPackage, canEditStock, canManageUsers, canViewAnalytics]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

