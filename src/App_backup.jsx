
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProductsProvider } from './context/ProductsContext';
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

  // Active check (if backend sends this)
  if (user.active === false || user.locked === true) {
      // Maybe redirect to a "Locked" or "Subscription Expired" page
      // For now, let's just send to subscription if not active
      return <Navigate to="/subscription" replace />;
  }
  
  // For admin-only routes
  if (adminOnly) {
    if (user.role !== 'admin' && user.role !== 'main-admin') {
      // If a cashier tries to access admin, send them to cashier
      return <Navigate to="/cashier" replace />;
    }
  }
  
  return children;
}

function DashboardRouter() {
  const { user, loading, isInitialized } = useAuth();
  
  if (!isInitialized || loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  
  if (user.role === 'admin' || user.role === 'main-admin') {
    return <Navigate to="/admin" replace />;
  }
  if (user.role === 'cashier') {
    return <Navigate to="/cashier" replace />;
  }
  
  return <Navigate to="/login" replace />;
}

function App() {
  // Initialize localStorage and set up cross-tab synchronization
  useEffect(() => {
    // Initialize localStorage with default data if not exists
    initializeStorage();
    
    // Set up cross-tab synchronization
    const cleanup = setupCrossTabSync();
    
    return () => {
      cleanup();
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ProductsProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/signup" element={<Auth />} />
              
              <Route path="/subscription" element={
                <ProtectedRoute>
                    <Subscription />
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard" element={<DashboardRouter />} />
              
              <Route path="/admin/*" element={
                <ProtectedRoute adminOnly>
                    <AdminDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/cashier" element={
                <ProtectedRoute>
                    <CashierPOS />
                </ProtectedRoute>
              } />
              
              <Route path="/cashier/settings" element={
                <ProtectedRoute>
                    <CashierSettings />
                </ProtectedRoute>
              } />
              
              <Route path="/main.admin" element={<MainAdmin />} />
            </Routes>
          </BrowserRouter>
        </ProductsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

