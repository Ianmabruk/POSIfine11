import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProductsProvider } from './context/ProductsContext';
import { ProtectedRoute as RouteGuard } from './components/RouteGuards';
import ReminderModal from './components/ReminderModal';
import SubscriptionReminderBar from './components/SubscriptionReminderBar';
import StockUpdateListener from './components/StockUpdateListener';
import ErrorBoundary from './components/ErrorBoundary';
import CookieConsent from './components/CookieConsent';
import LogoPreloader from './components/LogoPreloader';
import performanceMonitor from './services/performanceMonitor';
import { useState, useEffect, useRef, lazy, Suspense } from 'react';

import LandingSaaS from './pages/LandingSaaS';
import LandingPremium from './pages/LandingPremium';
import AuthNew from './pages/AuthNew';
import AuthEnterprise from './pages/AuthEnterprise';
import Subscription from './pages/Subscription';
import SubscriptionEnterprise from './pages/SubscriptionEnterprise';
import SubscriptionExpired from './pages/SubscriptionExpired';
import LoggedOut from './pages/LoggedOut';
import PosifyControlCenter from './pages/super-admin/PosifyControlCenter';

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const BuildPOS = lazy(() => import('./pages/BuildPOS'));
const CashierPOS = lazy(() => import('./pages/CashierPOS'));
const StudentDashboard = lazy(() => import('./pages/dashboards/StudentDashboard'));
const CanteenStaffDashboard = lazy(() => import('./pages/cashier/CanteenStaffDashboard'));
const ShopStaffDashboard = lazy(() => import('./pages/cashier/ShopStaffDashboard'));

// WindataWind - Subscription Management
const WindataWindAuth = lazy(() => import('./pages/windatawind/AuthPage'));
const WindataWind = lazy(() => import('./pages/windatawind/WindataWind'));
const WWProtectedRoute = lazy(() => import('./pages/windatawind/ProtectedRoute'));
const SuperAdminLogin = lazy(() => import('./pages/super-admin/ControlCenterLogin'));
const SuperAdminDashboard = lazy(() => import('./pages/super-admin/PosifyControlCenter'));

function ProtectedRoute({ children, adminOnly = false, ultraOnly = false, ownerOnly = false }) {
  const { user, loading } = useAuth();
  const [showReminders, setShowReminders] = useState(false);
  const reminderChecked = useRef(false);
  
  // Security: verify a token actually exists alongside the user object.
  const hasToken = !!localStorage.getItem('token');
  
  useEffect(() => {
    if (reminderChecked.current) return;
    if (user && hasToken && !ownerOnly) {
      reminderChecked.current = true;
      const reminderShown = sessionStorage.getItem('reminderShown');
      if (!reminderShown) {
        setShowReminders(true);
        sessionStorage.setItem('reminderShown', 'true');
      }
    }
  }, [user, hasToken, ownerOnly]);
  
  if (loading && !ownerOnly) {
    return <LogoPreloader text="Loading..." />;
  }
  
  // Owner route protection (main.admin)
  if (ownerOnly) {
    const ownerToken = localStorage.getItem('ownerToken') || localStorage.getItem('mainAdminToken') || localStorage.getItem('token');
    const ownerUser = localStorage.getItem('ownerUser') || localStorage.getItem('mainAdminUser') || localStorage.getItem('user');
    if (!ownerToken || !ownerUser) return <Navigate to="/windatawind" replace />;
    try {
      const userData = JSON.parse(ownerUser);
      if (!['main_admin', 'owner'].includes(userData.role)) {
        return <Navigate to="/windatawind" replace />;
      }
    } catch (e) {
      return <Navigate to="/windatawind" replace />;
    }
  } else {
    // Regular route protection — MUST have both user object AND a valid token
    if (!user || !hasToken) return <Navigate to="/auth/login" replace />;
    if (!user.active) return <Navigate to="/choose-subscription" replace />;
    if (adminOnly && !['admin', 'main_admin'].includes(user.role)) return <Navigate to="/dashboard/cashier" replace />;
    if (ultraOnly && (user.role !== 'admin' || user.plan !== 'ultra')) return <Navigate to="/dashboard/cashier" replace />;
  }
  
  return (
    <>
      <SubscriptionReminderBar />
      <StockUpdateListener />
      {showReminders && <ReminderModal onClose={() => setShowReminders(false)} />}
      {children}
    </>
  );
}

function DashboardRouter() {
  const { user, loading } = useAuth();
  
  if (loading) return <LogoPreloader text="Loading..." />;
  if (!user || !user.active) return <Navigate to="/choose-subscription" />;
  
  // Route based on ROLE
  if (user.role === 'admin' || user.role === 'main_admin') {
    return <Navigate to="/admin" />;
  }
  
  // All non-admin users go to cashier dashboard
  return <Navigate to="/dashboard/cashier" />;
}

function App() {
  // Initialize performance monitoring
  useEffect(() => {
    performanceMonitor.trackUserAction('app_loaded', {
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    });
  }, []);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ErrorBoundary>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium">
          Skip to main content
        </a>
        <AuthProvider>
          <ProductsProvider>
              <Suspense fallback={<LogoPreloader text="Loading..." />}>
                <div id="main-content">
                <Routes>
                <Route path="/" element={<LandingPremium />} />
                <Route path="/get-started" element={<LandingPremium />} />
                <Route path="/choose-subscription" element={<SubscriptionEnterprise />} />
                <Route path="/subscription-expired" element={<SubscriptionExpired />} />
                <Route path="/auth/login" element={<AuthEnterprise />} />
                <Route path="/auth/signup" element={<AuthEnterprise />} />
                <Route path="/logged-out" element={<LoggedOut />} />
                <Route path="/plans" element={<Navigate to="/choose-subscription" />} />
                <Route path="/build-pos" element={<ProtectedRoute><BuildPOS /></ProtectedRoute>} />
                
                {/* Regular User Routes */}
                <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
                <Route path="/dashboard/cashier" element={<ProtectedRoute><CashierPOS /></ProtectedRoute>} />
                
                {/* Admin Dashboard */}
                <Route path="/admin/*" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
                
                {/* Student routes */}
                <Route path="/student" element={<ProtectedRoute><RouteGuard><StudentDashboard /></RouteGuard></ProtectedRoute>} />
                <Route path="/student/*" element={<ProtectedRoute><RouteGuard><StudentDashboard /></RouteGuard></ProtectedRoute>} />
                <Route path="/canteen" element={<ProtectedRoute><RouteGuard><CanteenStaffDashboard /></RouteGuard></ProtectedRoute>} />
                <Route path="/uniform" element={<ProtectedRoute><RouteGuard><ShopStaffDashboard businessLabel="Uniform Shop" accentColor="purple" /></RouteGuard></ProtectedRoute>} />
                <Route path="/bookshop" element={<ProtectedRoute><RouteGuard><ShopStaffDashboard businessLabel="Bookshop" accentColor="blue" /></RouteGuard></ProtectedRoute>} />

                {/* WindataWind Subscription Management */}
                <Route path="/windatawind" element={<SuperAdminLogin />} />
                <Route path="/main.admin" element={
                  <ProtectedRoute ownerOnly><PosifyControlCenter /></ProtectedRoute>
                } />
                
                {/* Super Admin API routes - use SuperAdminLogin for auth */}
                <Route path="/super-admin/login" element={<SuperAdminLogin />} />
                <Route path="/super-admin/dashboard" element={
                  <ProtectedRoute ownerOnly><PosifyControlCenter /></ProtectedRoute>
                } />
                
                {/* Posify Control Center */}
                <Route path="/control-center" element={<SuperAdminLogin />} />
                <Route path="/control-center/dashboard" element={
                  <ProtectedRoute ownerOnly><PosifyControlCenter /></ProtectedRoute>
                } />

                {/* Legacy redirects */}
                <Route path="/login" element={<Navigate to="/auth/login" />} />
                <Route path="/signup" element={<Navigate to="/auth/signup" />} />
                <Route path="/subscription" element={<Navigate to="/choose-subscription" />} />
                <Route path="/payment" element={<Navigate to="/choose-subscription" />} />
                
                {/* OLD Cashier route - direct access to old CashierPOS */}
                <Route path="/cashier" element={<ProtectedRoute><CashierPOS /></ProtectedRoute>} />

                {/* 404 Catch-all */}
                <Route path="*" element={
                  <div className="min-h-screen bg-white flex items-center justify-center px-4">
                    <div className="max-w-md w-full text-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <span className="text-2xl font-bold text-slate-400">404</span>
                      </div>
                      <h1 className="text-4xl font-bold text-slate-900 mb-3">Page Not Found</h1>
                      <p className="text-slate-500 mb-8 leading-relaxed">
                        The page you're looking for doesn't exist or has been moved.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                          onClick={() => window.history.back()}
                          className="btn-secondary px-6 py-3 text-sm"
                        >
                          Go Back
                        </button>
                        <a
                          href="/"
                          className="btn-primary px-6 py-3 text-sm inline-flex items-center justify-center"
                        >
                          Back to Home
                        </a>
                      </div>
                    </div>
                  </div>
                 } />
                 </Routes>
                 </div>
               </Suspense>
             </ProductsProvider>
           </AuthProvider>
           <CookieConsent />
         </ErrorBoundary>
       </BrowserRouter>
  );
}

export default App;