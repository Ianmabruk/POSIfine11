import { createContext, useContext, useState, useEffect } from 'react';
import { auth, users, BASE_API_URL } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [appSettings, setAppSettings] = useState({});

  const normalizeUser = (rawUser) => {
    if (!rawUser) return rawUser;
    const active = rawUser.active ?? rawUser.is_active ?? rawUser.account_active ?? true;
    const plan = rawUser.plan ?? rawUser.subscription ?? rawUser.account_plan;
    const profilePicture = rawUser.profilePicture ?? rawUser.profile_picture ?? null;
    const businessLogo = rawUser.business_logo ?? rawUser.businessLogo ?? null;
    return {
      ...rawUser,
      active,
      plan,
      profilePicture,
      profile_picture: profilePicture,
      business_logo: businessLogo,
      businessLogo
    };
  };

  const loadAppSettings = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAppSettings({});
      return;
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
    } catch (error) {
      console.warn('Failed to load app settings', error);
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
      
      if (token) {
        // First verify with backend using a direct fetch so that the
        // global API layer's 401 redirect behavior doesn't navigate away
        // from public pages (like the landing page) during initialization.
        try {
          const resp = await fetch(`${BASE_API_URL}/auth/me`, {
            credentials: 'include',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
          });
          if (resp.ok) {
            const data = await resp.json();
            const normalized = normalizeUser(data);
            setUser(normalized);
            localStorage.setItem('user', JSON.stringify(normalized));
            loadAppSettings();
          } else if (resp.status === 401) {
            // Actual 401 — token is explicitly rejected by the server
            // Try refresh before giving up
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
                    if (refreshed.refreshToken) {
                      localStorage.setItem('refreshToken', refreshed.refreshToken);
                    }
                    if (refreshed.csrfToken) {
                      localStorage.setItem('csrfToken', refreshed.csrfToken);
                    }
                    localStorage.setItem('user', JSON.stringify(normalized));
                    setUser(normalized);
                    loadAppSettings();
                    return; // success via refresh
                  }
                } else {
                  localStorage.removeItem('refreshToken');
                  localStorage.removeItem('csrfToken');
                }
              } catch (refreshErr) {
                console.warn('Refresh failed:', refreshErr);
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('csrfToken');
              }
            }
            // Only remove user data when server explicitly rejects AND refresh also failed
            localStorage.removeItem('user');
          } else {
            // Server error (5xx) or network issue — keep the cached user data so
            // data is not lost. Restore from localStorage so dashboard still works.
            if (savedUser) {
              try {
                const parsed = JSON.parse(savedUser);
                const normalized = normalizeUser(parsed);
                setUser(normalized);
                console.warn('Backend unreachable during auth init — using cached user data');
              } catch (e) {
                console.warn('Failed to parse cached user:', e);
              }
            }
          }
        } catch (err) {
          // Network error (offline, CORS, connection refused) — DO NOT clear user data
          // Restore from localStorage so the user's dashboard remains usable offline/on slow networks
          console.warn('Auth check failed (network error):', err.message);
          if (savedUser) {
            try {
              const parsed = JSON.parse(savedUser);
              const normalized = normalizeUser(parsed);
              setUser(normalized);
              console.info('Restored user from localStorage after network error');
            } catch (parseErr) {
              console.warn('Failed to parse cached user during network error recovery:', parseErr);
            }
          }
          // Try refresh as a last resort if we couldn't reach the server
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
                  if (refreshed.refreshToken) {
                    localStorage.setItem('refreshToken', refreshed.refreshToken);
                  }
                  if (refreshed.csrfToken) {
                    localStorage.setItem('csrfToken', refreshed.csrfToken);
                  }
                  localStorage.setItem('user', JSON.stringify(normalized));
                  setUser(normalized);
                  loadAppSettings();
                }
              }
            } catch (_) {
              // ignore - already using cached user
            }
          }
        }
      } else if (savedUser) {
        // No token but savedUser present — clear stale user data so login page is shown
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      // Don't clear user data on unexpected errors — only navigate away if truly unauthorized
      // This prevents "Oops something went wrong" on network hiccups
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser(normalizeUser(parsed));
        } catch (e) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

  const login = async (payload) => {
    try {
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
        loadAppSettings();
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
        loadAppSettings();
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
      // Use replace so back-button doesn't return to a stale dashboard
      window.location.replace('/auth/login');
    }
  };

  const isAuthenticated = () => !!user && !!localStorage.getItem('token');
  
  const hasRole = (role) => user && (user.role === role);
  
  // Helper to check if user is owner/main admin
  const isOwner = () => user && (user.role === 'main_admin');
  
  // Helper to check if user is admin
  const isAdmin = () => user && (user.role === 'admin' || user.role === 'main_admin');
  
  // Helper to check if user is cashier
  const isCashier = () => user && (user.role === 'cashier');
  
  /**
   * Get the correct dashboard URL for the current user's role
   * This ensures consistent redirects across the application
   * 
  * Role hierarchy:
  * - 'main_admin' (Main Admin/Super Admin) → /main.admin
   * - 'admin' (Regular Business Admin) → /admin
   * - 'cashier' (POS Staff) → /cashier
   */
  const getDashboardUrl = (userRole = null) => {
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
  };

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

