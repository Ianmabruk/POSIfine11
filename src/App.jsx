import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProductsProvider } from './context/ProductsContext';
import { ScreenLockProvider, useScreenLock } from './context/ScreenLockContext';
import { ProtectedRoute as RouteGuard, ProPlanGuard, RoleGuard, BusinessTypeGuard, AdminGuard, PetroleumPlanGuard } from './components/RouteGuards';
import ReminderModal from './components/ReminderModal';
import ScreenLock from './components/ScreenLock';
import SubscriptionReminderBar from './components/SubscriptionReminderBar';
import StockUpdateListener from './components/StockUpdateListener';
import useInactivity from './hooks/useInactivity';
import { BASE_API_URL } from './services/api';
import { useState, useEffect, useCallback, lazy, Suspense } from 'react';

import Landing from './pages/Landing';
import LandingModern from './components/modern-landing/LandingModern';
import AuthNew from './pages/AuthNew';
import Subscription from './pages/Subscription';

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const BusinessAwareAdminRouter = lazy(() => import('./pages/BusinessAwareAdminRouter'));
const ProPlanRouter = lazy(() => import('./pages/ProPlanRouter'));
const BusinessTypeSelector = lazy(() => import('./pages/BusinessTypeSelector'));
const PaymentInput = lazy(() => import('./pages/PaymentInput'));
const BasicDashboard = lazy(() => import('./pages/BasicDashboard'));
const BuildPOS = lazy(() => import('./pages/BuildPOS'));
const CashierPOS = lazy(() => import('./pages/CashierPOS'));
const BarCashierPOS = lazy(() => import('./pages/cashier/BarCashierPOS'));
const ClinicCashierPOS = lazy(() => import('./pages/cashier/ClinicCashierPOS'));
const HotelCashierPOS = lazy(() => import('./pages/cashier/HotelCashierPOS'));
const SupermarketCashierPOS = lazy(() => import('./pages/cashier/SupermarketCashierPOS'));
const HospitalCashierPOS = lazy(() => import('./pages/cashier/HospitalCashierPOS'));
const SchoolCashierPOS = lazy(() => import('./pages/cashier/SchoolCashierPOS'));
const KioskCashierPOS = lazy(() => import('./pages/cashier/KioskCashierPOS'));
const PetrolCashierPOS = lazy(() => import('./pages/cashier/PetrolCashierPOS'));
const ShoesCashierPOS = lazy(() => import('./pages/cashier/ShoesCashierPOS'));
const MainAdmin = lazy(() => import('./pages/MainAdmin'));
const MainAdminLogin = lazy(() => import('./pages/MainAdminLogin'));
const MainAdminLanding = lazy(() => import('./pages/MainAdminLanding'));
const AdminClinicDashboard = lazy(() => import('./pages/admin/AdminClinicDashboard'));
const AdminBarDashboard = lazy(() => import('./pages/admin/AdminBarDashboard'));
const PetrolAdminDashboard = lazy(() => import('./pages/admin/PetrolAdminDashboard'));
const AdminHotelDashboard = lazy(() => import('./pages/admin/AdminHotelDashboard'));
const AdminSupermarketDashboard = lazy(() => import('./pages/admin/AdminSupermarketDashboard'));
const ClinicDoctorDashboard = lazy(() => import('./pages/dashboards/clinic/ClinicDoctorDashboard'));

function ProtectedRoute({ children, adminOnly = false, ultraOnly = false, ownerOnly = false }) {
  const { user, loading } = useAuth();
  const { isLocked: isScreenLocked, lock: lockScreen, unlock: unlockScreen } = useScreenLock();
  const [showReminders, setShowReminders] = useState(false);
  const inactivityResult = useInactivity(60000); // 1 minute for all dashboards
  const isLocked = inactivityResult?.[0] || isScreenLocked || false;
  const unlock = useCallback(() => {
    inactivityResult?.[1]?.();
    unlockScreen();
  }, [inactivityResult, unlockScreen]);
  const [settings, setSettings] = useState({});
  
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const API_URL = BASE_API_URL;
        const res = await fetch(`${API_URL}/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    
    if (user && !ownerOnly) {
      loadSettings();
      // Only show reminders once per session to avoid duplicate displays
      const reminderShown = sessionStorage.getItem('reminderShown');
      if (!reminderShown) {
        setShowReminders(true);
        sessionStorage.setItem('reminderShown', 'true');
      }
    }
  }, [user, ownerOnly]);

  // Listen for screen lock from admin
  useEffect(() => {
    const handleAdminLock = (event) => {
      console.log('🔒 Admin locked screen:', event.detail);
      lockScreen('admin');
    };

    window.addEventListener('admin_locked_user_screen', handleAdminLock);
    return () => window.removeEventListener('admin_locked_user_screen', handleAdminLock);
  }, [lockScreen]);
  
  if (loading && !ownerOnly) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Owner route protection (main.admin)
  if (ownerOnly) {
    const ownerToken = localStorage.getItem('ownerToken');
    const ownerUser = localStorage.getItem('ownerUser');
    if (!ownerToken || !ownerUser) {
      return <Navigate to="/main.admin" />;
    }
    try {
      const userData = JSON.parse(ownerUser);
      if (userData.role !== 'main_admin') {
        return <Navigate to="/main.admin" />;
      }
    } catch (e) {
      return <Navigate to="/main.admin" />;
    }
  } else {
    // Regular route protection
    if (!user) return <Navigate to="/auth/login" />;
    if (!user.active) return <Navigate to="/choose-subscription" />;
    if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" />;
    if (ultraOnly && (user.role !== 'admin' || user.plan !== 'ultra')) return <Navigate to="/dashboard" />;
  }
  
  const userType = ownerOnly ? 'main_admin' : 'user';
  
  return (
    <>
      <SubscriptionReminderBar />
      <StockUpdateListener />
      {isLocked && <ScreenLock onUnlock={unlock} userType={userType} />}
      {showReminders && <ReminderModal onClose={() => setShowReminders(false)} />}
      {children}
    </>
  );
}

function DashboardRouter() {
  const { user } = useAuth();
  
  if (!user || !user.active) return <Navigate to="/choose-subscription" />;
  
  // 🎯 PRO PLAN ROUTING - Business-specific dashboards
  const isPro = user.subscription === 'pro' || user.plan === 'pro' || user.subscription === 'custom' || user.plan === 3000 || user.plan === 3400;
  const businessType = user.businessType || user.business_type;
  const businessRole = user.businessRole || user.business_role;
  
  if (isPro && businessType) {
    // Pro users with business type → route to business-specific dashboard
    console.log('[Dashboard Router] Pro user detected:', { businessType, businessRole, role: user.role });
    
    // Admins go to admin dashboard for their business type
    if (user.role === 'admin') {
      return <Navigate to={`/admin/${businessType}`} />;
    }
    
    // Non-admin Pro users with business_role go to their role-specific dashboard
    if (businessRole) {
      if (businessType === 'clinic') {
        if (businessRole === 'doctor') return <Navigate to="/dashboard/clinic/doctor" />;
        if (businessRole === 'registrar' || businessRole === 'reception') return <Navigate to="/dashboard/clinic/reception" />;
        if (businessRole === 'pharmacist' || businessRole === 'pharmacy') return <Navigate to="/dashboard/clinic/pharmacy" />;
        if (businessRole === 'cashier') return <Navigate to="/cashier/clinic" />;
      }
      if (businessType === 'bar') {
        if (businessRole === 'bartender') return <Navigate to="/dashboard/bar/bartender" />;
        if (businessRole === 'cashier') return <Navigate to="/cashier/bar" />;
      }
      if (businessType === 'hotel') {
        if (businessRole === 'receptionist') return <Navigate to="/dashboard/hotel/reception" />;
        if (businessRole === 'housekeeping') return <Navigate to="/dashboard/hotel/housekeeping" />;
        if (businessRole === 'cashier') return <Navigate to="/cashier/hotel" />;
      }
      if (businessType === 'supermarket') {
        if (businessRole === 'department_head') return <Navigate to="/dashboard/supermarket/department" />;
        if (businessRole === 'cashier') return <Navigate to="/cashier/supermarket" />;
      }
    }
    
    // Default fallback for Pro users without specific role routing
    if (businessType === 'clinic') return <Navigate to="/cashier/clinic" />;
    if (businessType === 'bar') return <Navigate to="/cashier/bar" />;
    if (businessType === 'hotel') return <Navigate to="/cashier/hotel" />;
    if (businessType === 'supermarket') return <Navigate to="/cashier/supermarket" />;
    return <Navigate to="/dashboard/cashier" />;
  }
  
  // Pro users WITHOUT business type → redirect to selector
  if (isPro && !businessType && user.role === 'admin') {
    return <Navigate to="/select-business-type" />;
  }
  
  // 📦 BASIC / ULTRA PLAN ROUTING - Standard dashboards
  // Route based on ROLE, not package
  if (user.role === 'admin') {
    return <Navigate to="/admin" />;
  }
  
  // All non-admin users go to cashier dashboard
  return <Navigate to="/dashboard/cashier" />;
}

function App() {
  return (
    <AuthProvider>
      <ProductsProvider>
        <ScreenLockProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            }>
              <Routes>
                <Route path="/" element={<LandingModern />} />
                <Route path="/landing-old" element={<Landing />} />
                <Route path="/get-started" element={<LandingModern />} />
                <Route path="/choose-subscription" element={<Subscription />} />
                <Route path="/auth/login" element={<AuthNew />} />
                <Route path="/auth/signup" element={<AuthNew />} />
                <Route path="/plans" element={<Navigate to="/choose-subscription" />} />
                <Route path="/build-pos" element={<BuildPOS />} />
                
                {/* Owner Main Admin Routes (strict /main.admin) */}
                <Route path="/main.admin" element={<MainAdminLanding />} />
                <Route path="/main.admin/login" element={<MainAdminLogin />} />
                <Route path="/main.admin/dashboard" element={<ProtectedRoute ownerOnly><MainAdmin /></ProtectedRoute>} />
                
                {/* Pro Plan Business Type Selection */}
                <Route path="/select-business-type" element={<ProtectedRoute adminOnly><BusinessTypeSelector /></ProtectedRoute>} />
                
                {/* Pro Plan Business-Specific Dashboard (DEPRECATED - use /admin/{businessType}) */}
                <Route path="/pro-dashboard" element={<ProtectedRoute adminOnly><ProPlanRouter /></ProtectedRoute>} />
                
                {/* Pro Plan Admin Dashboards */}
                <Route path="/admin/clinic" element={
                  <RouteGuard>
                    <ProPlanGuard>
                      <BusinessTypeGuard requiredType="clinic">
                        <AdminGuard>
                          <AdminClinicDashboard />
                        </AdminGuard>
                      </BusinessTypeGuard>
                    </ProPlanGuard>
                  </RouteGuard>
                } />
                <Route path="/admin/bar" element={
                  <RouteGuard>
                    <ProPlanGuard>
                      <BusinessTypeGuard requiredType="bar">
                        <AdminGuard>
                          <AdminBarDashboard />
                        </AdminGuard>
                      </BusinessTypeGuard>
                    </ProPlanGuard>
                  </RouteGuard>
                } />
                <Route path="/admin/hotel" element={
                  <RouteGuard>
                    <ProPlanGuard>
                      <BusinessTypeGuard requiredType="hotel">
                        <AdminGuard>
                          <AdminHotelDashboard />
                        </AdminGuard>
                      </BusinessTypeGuard>
                    </ProPlanGuard>
                  </RouteGuard>
                } />
                <Route path="/admin/supermarket" element={
                  <RouteGuard>
                    <ProPlanGuard>
                      <BusinessTypeGuard requiredType="supermarket">
                        <AdminGuard>
                          <AdminSupermarketDashboard />
                        </AdminGuard>
                      </BusinessTypeGuard>
                    </ProPlanGuard>
                  </RouteGuard>
                } />
                <Route path="/admin/petrol" element={
                  <RouteGuard>
                    <PetroleumPlanGuard>
                      <BusinessTypeGuard requiredType="petrol">
                        <AdminGuard>
                          <PetrolAdminDashboard />
                        </AdminGuard>
                      </BusinessTypeGuard>
                    </PetroleumPlanGuard>
                  </RouteGuard>
                } />
                
                {/* Pro Plan Role Dashboards */}
                <Route path="/dashboard/clinic/doctor" element={
                  <RouteGuard>
                    <ProPlanGuard>
                      <BusinessTypeGuard requiredType="clinic">
                        <RoleGuard allowedRoles={['doctor']}>
                          <ClinicDoctorDashboard />
                        </RoleGuard>
                      </BusinessTypeGuard>
                    </ProPlanGuard>
                  </RouteGuard>
                } />
                
                {/* Regular User Routes */}
                <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
                <Route path="/dashboard/cashier" element={<ProtectedRoute><CashierPOS /></ProtectedRoute>} />
                
                {/* Business-Specific Cashier Routes */}
                <Route path="/cashier/bar" element={<ProtectedRoute><BarCashierPOS /></ProtectedRoute>} />
                <Route path="/cashier/clinic" element={<ProtectedRoute><ClinicCashierPOS /></ProtectedRoute>} />
                <Route path="/cashier/hotel" element={<ProtectedRoute><HotelCashierPOS /></ProtectedRoute>} />
                <Route path="/cashier/supermarket" element={<ProtectedRoute><SupermarketCashierPOS /></ProtectedRoute>} />
                <Route path="/cashier/hospital" element={<ProtectedRoute><HospitalCashierPOS /></ProtectedRoute>} />
                <Route path="/cashier/school" element={<ProtectedRoute><SchoolCashierPOS /></ProtectedRoute>} />
                <Route path="/cashier/kiosk" element={<ProtectedRoute><KioskCashierPOS /></ProtectedRoute>} />
                <Route path="/cashier/petrol" element={
                  <ProtectedRoute>
                    <PetroleumPlanGuard>
                      <PetrolCashierPOS />
                    </PetroleumPlanGuard>
                  </ProtectedRoute>
                } />
                <Route path="/cashier/shoes" element={<ProtectedRoute><ShoesCashierPOS /></ProtectedRoute>} />
                
                {/* Admin Dashboard - ORIGINAL OLD version with tabs */}
                <Route path="/admin/*" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
                
                {/* Legacy redirects */}
                <Route path="/login" element={<Navigate to="/auth/login" />} />
                <Route path="/signup" element={<Navigate to="/auth/signup" />} />
                <Route path="/subscription" element={<Navigate to="/choose-subscription" />} />
                <Route path="/payment" element={<Navigate to="/choose-subscription" />} />
                
                {/* OLD Cashier route - direct access to old CashierPOS */}
                <Route path="/cashier" element={<ProtectedRoute><CashierPOS /></ProtectedRoute>} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ScreenLockProvider>
      </ProductsProvider>
    </AuthProvider>
  );
}

export default App;