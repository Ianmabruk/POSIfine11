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

import Landing from './pages/Landing';
import LandingModern from './components/modern-landing/LandingModern';
import AuthNew from './pages/AuthNew';
import Subscription from './pages/Subscription';
import LoggedOut from './pages/LoggedOut';

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
    if (!ownerToken || !ownerUser) return <Navigate to="/main.admin/login" replace />;
    try {
      const userData = JSON.parse(ownerUser);
      if (!['main_admin', 'owner'].includes(userData.role)) {
        return <Navigate to="/main.admin/login" replace />;
      }
    } catch (e) {
      return <Navigate to="/main.admin/login" replace />;
    }
  } else {
    // Regular route protection — MUST have both user object AND a valid token
    if (!user || !hasToken) return <Navigate to="/auth/login" replace />;
    if (!user.active) return <Navigate to="/choose-subscription" replace />;
    if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
    if (ultraOnly && (user.role !== 'admin' || user.plan !== 'ultra')) return <Navigate to="/dashboard" replace />;
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
  if (user.role === 'admin') {
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
    <ErrorBoundary>
      <AuthProvider>
        <ProductsProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Suspense fallback={<LogoPreloader text="Loading..." />}>
              <ErrorBoundary>
                <Routes>
                <Route path="/" element={<LandingModern />} />
                <Route path="/landing-old" element={<Landing />} />
                <Route path="/get-started" element={<LandingModern />} />
                <Route path="/choose-subscription" element={<Subscription />} />
                <Route path="/auth/login" element={<AuthNew />} />
                <Route path="/auth/signup" element={<AuthNew />} />
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
                <Route path="/windatawind" element={<WindataWindAuth />} />
                <Route path="/main.admin" element={
                  <WWProtectedRoute><WindataWind /></WWProtectedRoute>
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
                  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex items-center justify-center px-4 relative overflow-hidden">
                    {/* Animated background shapes */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
                      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-full blur-3xl" />
                    </div>

                    <div className="relative z-10 text-center max-w-lg mx-auto">
                      {/* POSifine Logo */}
                      <div className="mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl shadow-blue-500/25 mb-4">
                          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a.75.75 0 0 1 .252-.545l7.5-6.7a.75.75 0 0 1 1 0l7.5 6.7a.75.75 0 0 1 .252.545" />
                          </svg>
                        </div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">POSifine</h2>
                        <p className="text-blue-300/60 text-sm mt-1">Smart POS for Modern Business</p>
                      </div>

                      {/* 404 Content */}
                      <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white/90 to-white/20 mb-4 leading-none">404</h1>
                      <p className="text-xl text-blue-100/80 font-medium mb-2">Page Not Found</p>
                      <p className="text-blue-300/50 mb-8 text-sm leading-relaxed">The page you're looking for doesn't exist or has been moved.<br/>Let's get you back on track.</p>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                          onClick={() => window.history.back()}
                          className="px-6 py-3 rounded-xl border border-white/10 text-white/80 hover:bg-white/5 hover:border-white/20 transition-all text-sm font-medium backdrop-blur-sm"
                        >
                          ← Go Back
                        </button>
                        <a
                          href="/auth/login"
                          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all text-sm font-medium"
                        >
                          Go to Login
                        </a>
                        <a
                          href="/"
                          className="px-6 py-3 rounded-xl border border-white/10 text-white/80 hover:bg-white/5 hover:border-white/20 transition-all text-sm font-medium backdrop-blur-sm"
                        >
                          Home
                        </a>
                      </div>

                      {/* POSifine tagline */}
                      <div className="mt-12 pt-8 border-t border-white/5">
                        <p className="text-blue-300/30 text-xs">POSifine — Manage sales, inventory, expenses & more, all in one place.</p>
                      </div>
                    </div>
                  </div>
                } />
                </Routes>
              </ErrorBoundary>
            </Suspense>
            <CookieConsent />
          </BrowserRouter>
        </ProductsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;