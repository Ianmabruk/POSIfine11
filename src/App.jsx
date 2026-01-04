

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { initializeStorage, setupCrossTabSync, refreshData } from './utils/localStorage';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Subscription from './pages/Subscription';
import AdminDashboard from './pages/admin/AdminDashboard';
import CashierPOS from './pages/cashier/CashierPOS';
import CashierSettings from './pages/cashier/CashierSettings';
import MainAdmin from './pages/MainAdmin';
import ErrorBoundary from './components/ErrorBoundary';

// Loading component
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg animate-pulse">
          <span className="text-2xl font-bold text-white">POS</span>
        </div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}


function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isInitialized } = useAuth();
  
  // Wait for auth to initialize before making routing decisions
  if (!isInitialized || loading) {
    return <LoadingScreen />;
  }
  
  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // For admin-only routes, check if user has admin access
  if (adminOnly) {
    // First check localStorage for the most up-to-date user data
    const storedUser = localStorage.getItem('user');
    let currentUser = user;
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        currentUser = { ...user, ...parsedUser };
      } catch (error) {
        console.warn('Error parsing stored user data:', error);
      }
    }
    
    const isAdmin = currentUser.plan === 'ultra' || currentUser.role === 'admin';
    const hasValidSubscription = currentUser.active && currentUser.plan;
    
    if (!isAdmin || !hasValidSubscription) {
      console.log('Access denied - User does not have admin privileges:', currentUser);
      
      // If user has ultra plan but wrong role, try to fix it
      if (currentUser.plan === 'ultra' && currentUser.role !== 'admin') {
        currentUser.role = 'admin';
        currentUser.active = true;
        localStorage.setItem('user', JSON.stringify(currentUser));
        window.dispatchEvent(new Event('storage'));
        
        // Return children if we just fixed the role
        return children;
      }
      
      return <Navigate to="/cashier" replace />;
    }
  }
  
  return children;
}

function DashboardRouter() {
  const { user, loading, isInitialized } = useAuth();
  
  // Wait for auth to initialize
  if (!isInitialized || loading) {
    return <LoadingScreen />;
  }
  
  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If user doesn't have an active subscription, redirect to subscription page
  if (!user.active || !user.plan) {
    return <Navigate to="/subscription" replace />;
  }
  
  // Route based on user's plan and role
  const isAdmin = user.plan === 'ultra' || user.role === 'admin';
  
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  
  return <Navigate to="/cashier" replace />;
}




function App() {
  // Initialize localStorage and set up cross-tab synchronization
  useEffect(() => {
    // Initialize localStorage with default data if not exists
    initializeStorage();
    
    // Set up cross-tab synchronization
    const cleanup = setupCrossTabSync();
    
    // Set up data refresh on localStorage changes
    const handleDataChange = (event) => {
      if (event.detail?.key) {
        console.log(`Data changed, refreshing: ${event.detail.key}`);
        refreshData(event.detail.key);
      }
    };
    
    window.addEventListener('localStorageDataChanged', handleDataChange);
    
    // Clean up event listeners on unmount
    return () => {
      cleanup();
      window.removeEventListener('localStorageDataChanged', handleDataChange);
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/signup" element={<Auth />} />
            <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
            <Route path="/admin/*" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            <Route path="/cashier" element={<ProtectedRoute><CashierPOS /></ProtectedRoute>} />
            <Route path="/cashier/settings" element={<ProtectedRoute><CashierSettings /></ProtectedRoute>} />
            <Route path="/main.admin" element={<MainAdmin />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;