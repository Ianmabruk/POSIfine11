import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // Initialize user from localStorage with proper loading state
  const [user, setUser] = useState(() => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user');
      return null;
    }
  });
  
  // Track if initial auth check is complete
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);


  useEffect(() => {
    // Perform initial auth check
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          

          // Ensure role is set correctly based on plan and package type
          if (parsedUser.plan === 'ultra') {
            // Ultra package always gets admin role
            if (parsedUser.role !== 'admin') {
              parsedUser.role = 'admin';
              parsedUser.active = true;
              parsedUser.packageType = 'ultra';
              localStorage.setItem('user', JSON.stringify(parsedUser));
            }
          } else if (parsedUser.plan === 'basic') {
            // Basic package gets cashier role
            if (parsedUser.role !== 'cashier') {
              parsedUser.role = 'cashier';
              parsedUser.active = true;
              parsedUser.packageType = 'basic';
              localStorage.setItem('user', JSON.stringify(parsedUser));
            }
          }
          
          // Ensure active flag is set for all plan users
          if (parsedUser.plan && !parsedUser.active) {
            parsedUser.active = true;
            localStorage.setItem('user', JSON.stringify(parsedUser));
          }
          
          setUser(parsedUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };
    
    // Initial sync
    initializeAuth();
    
    // Listen for storage changes (from other tabs or manual updates)
    const handleStorageChange = (e) => {
      if (e.key === 'user' || e.key === 'token') {
        // Add slight delay to ensure localStorage is fully updated
        setTimeout(() => {
          initializeAuth();
        }, 50);
      }
    };
    
    // Also listen for custom storage events triggered by subscription updates
    const handleCustomStorageEvent = () => {
      setTimeout(() => {
        initializeAuth();
      }, 100);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageUpdated', handleCustomStorageEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageUpdated', handleCustomStorageEvent);
    };
  }, []);

  const login = (token, userData) => {
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const updateUser = async (userData) => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:5001/api' : '/api';
      
      // Update localStorage FIRST
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      try {
        const response = await fetch(`${API_URL}/users/${userData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
          throw new Error('Backend not available');
        }
        
        const data = await response.json();
        
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          setUser(data.user);
        }
        
        return data;
      } catch (backendError) {
        console.warn('Backend not available, using client-side update:', backendError);
        
        // Generate a mock token if needed
        if (!token) {
          const mockToken = btoa(JSON.stringify({ 
            id: userData.id, 
            email: userData.email, 
            role: userData.role,
            plan: userData.plan 
          }));
          localStorage.setItem('token', mockToken);
        }
        
        return { user: userData, token: token || btoa(JSON.stringify(userData)) };
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, updateUser, logout, loading, isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
};