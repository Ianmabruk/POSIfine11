import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProductsProvider } from './context/ProductsContext';
import { ProtectedRoute as RouteGuard, ProPlanGuard, RoleGuard, BusinessTypeGuard, AdminGuard, PetroleumPlanGuard } from './components/RouteGuards';
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

const AdminClinicDashboard = lazy(() => import('./pages/admin/AdminClinicDashboard'));
const AdminBarDashboard = lazy(() => import('./pages/admin/AdminBarDashboard'));
const PetrolAdminDashboard = lazy(() => import('./pages/admin/PetrolAdminDashboard'));
const AdminHotelDashboard = lazy(() => import('./pages/admin/AdminHotelDashboard'));
const AdminSupermarketDashboard = lazy(() => import('./pages/admin/AdminSupermarketDashboard'));
const AdminHospitalDashboard = lazy(() => import('./pages/admin/HospitalAdminDashboard'));
const AdminSchoolDashboard = lazy(() => import('./pages/admin/SchoolAdminDashboard'));
const AdminKioskDashboard = lazy(() => import('./pages/admin/KioskAdminDashboard'));
const AdminShoeDashboard = lazy(() => import('./pages/admin/ShoeAdminDashboard'));
const ClinicDoctorDashboard = lazy(() => import('./pages/dashboards/clinic/ClinicDoctorDashboard'));
const ClinicReceptionDashboard = lazy(() => import('./pages/clinic/ReceptionDashboard'));
const ClinicPharmacyDashboard = lazy(() => import('./pages/clinic/PharmacyDashboard'));
const BarDashboard = lazy(() => import('./pages/bar/BarDashboard'));
const HotelDashboard = lazy(() => import('./pages/hotel/HotelDashboard'));
const SupermarketDashboard = lazy(() => import('./pages/business/SupermarketDashboard'));
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
  const { user } = useAuth();
  
  if (!user || !user.active) return <Navigate to="/choose-subscription" />;
  
  // 🎯 PRO PLAN ROUTING - Business-specific dashboards
  const isPro = user.subscription === 'pro' || user.plan === 'pro' || user.subscription === 'custom' || user.plan === 3000 || user.plan === 3400 || user.subscription === 'PRO_PETROLEUM' || user.plan === 'PRO_PETROLEUM' || user.subscription === 'pro_petroleum' || user.plan === 'pro_petroleum';
  const businessType = user.businessType || user.business_type;
  const businessRole = user.businessRole || user.business_role;
  
  if (isPro && businessType) {
    // Pro users with business type → route to business-specific dashboard
    console.log('[Dashboard Router] Pro user detected:', { businessType, businessRole, role: user.role });
    
    // Admins go to admin dashboard for their business type
    if (user.role === 'admin') {
      return <Navigate to={`/admin/${businessType}`} />;
    }

    // Cashiers should always use cashier flows.
    if (user.role === 'cashier') {
      if (businessType === 'clinic') return <Navigate to="/cashier/clinic" />;
      if (businessType === 'bar') return <Navigate to="/cashier/bar" />;
      if (businessType === 'hotel') return <Navigate to="/cashier/hotel" />;
      if (businessType === 'supermarket') return <Navigate to="/cashier/supermarket" />;
      if (businessType === 'hospital') return <Navigate to="/cashier/hospital" />;
      if (businessType === 'school') return <Navigate to="/cashier/school" />;
      if (businessType === 'kiosk') return <Navigate to="/cashier/kiosk" />;
      if (businessType === 'shoes') return <Navigate to="/cashier/shoes" />;
      if (businessType === 'petrol') return <Navigate to="/cashier/petrol" />;
      return <Navigate to="/dashboard/cashier" />;
    }
    
    // Non-admin Pro users with business_role go to their role-specific dashboard
    if (businessRole) {
      if (businessType === 'clinic') {
        if (businessRole === 'doctor') return <Navigate to="/dashboard/clinic/doctor" />;
        if (businessRole === 'registrar' || businessRole === 'reception' || businessRole === 'receptionist') return <Navigate to="/dashboard/clinic/reception" />;
        if (businessRole === 'pharmacist' || businessRole === 'pharmacy') return <Navigate to="/dashboard/clinic/pharmacy" />;
        if (businessRole === 'cashier') return <Navigate to="/cashier/clinic" />;
      }
      if (businessType === 'bar') {
        if (businessRole === 'bartender' || businessRole === 'waiter' || businessRole === 'manager') return <Navigate to="/dashboard/bar/bartender" />;
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
    if (businessType === 'hospital') return <Navigate to="/cashier/hospital" />;
    if (businessType === 'school') return <Navigate to="/cashier/school" />;
    if (businessType === 'kiosk') return <Navigate to="/cashier/kiosk" />;
    if (businessType === 'shoes') return <Navigate to="/cashier/shoes" />;
    if (businessType === 'petrol') return <Navigate to="/cashier/petrol" />;
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
                <Route path="/plans" element={<Navigate to="/choose-subscription" />} />
                <Route path="/build-pos" element={<ProtectedRoute><BuildPOS /></ProtectedRoute>} />
                

                
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
                <Route path="/admin/hospital" element={
                  <RouteGuard>
                    <ProPlanGuard>
                      <BusinessTypeGuard requiredType="hospital">
                        <AdminGuard>
                          <AdminHospitalDashboard />
                        </AdminGuard>
                      </BusinessTypeGuard>
                    </ProPlanGuard>
                  </RouteGuard>
                } />
                <Route path="/admin/school" element={
                  <RouteGuard>
                    <ProPlanGuard>
                      <BusinessTypeGuard requiredType="school">
                        <AdminGuard>
                          <AdminSchoolDashboard />
                        </AdminGuard>
                      </BusinessTypeGuard>
                    </ProPlanGuard>
                  </RouteGuard>
                } />
                <Route path="/admin/kiosk" element={
                  <RouteGuard>
                    <ProPlanGuard>
                      <BusinessTypeGuard requiredType="kiosk">
                        <AdminGuard>
                          <AdminKioskDashboard />
                        </AdminGuard>
                      </BusinessTypeGuard>
                    </ProPlanGuard>
                  </RouteGuard>
                } />
                <Route path="/admin/shoes" element={
                  <RouteGuard>
                    <ProPlanGuard>
                      <BusinessTypeGuard requiredType="shoes">
                        <AdminGuard>
                          <AdminShoeDashboard />
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
                <Route path="/dashboard/clinic/reception" element={
                  <RouteGuard>
                    <ProPlanGuard>
                      <BusinessTypeGuard requiredType="clinic">
                        <RoleGuard allowedRoles={['registrar', 'reception', 'receptionist']}>
                          <ClinicReceptionDashboard />
                        </RoleGuard>
                      </BusinessTypeGuard>
                    </ProPlanGuard>
                  </RouteGuard>
                } />
                <Route path="/dashboard/clinic/pharmacy" element={
                  <RouteGuard>
                    <ProPlanGuard>
                      <BusinessTypeGuard requiredType="clinic">
                        <RoleGuard allowedRoles={['pharmacist', 'pharmacy']}>
                          <ClinicPharmacyDashboard />
                        </RoleGuard>
                      </BusinessTypeGuard>
                    </ProPlanGuard>
                  </RouteGuard>
                } />
                <Route path="/dashboard/bar/bartender" element={
                  <RouteGuard>
                    <ProPlanGuard>
                      <BusinessTypeGuard requiredType="bar">
                        <RoleGuard allowedRoles={['bartender', 'waiter', 'manager']}>
                          <BarDashboard />
                        </RoleGuard>
                      </BusinessTypeGuard>
                    </ProPlanGuard>
                  </RouteGuard>
                } />
                <Route path="/dashboard/bar/waiter" element={
                  <RouteGuard>
                    <ProPlanGuard>
                      <BusinessTypeGuard requiredType="bar">
                        <RoleGuard allowedRoles={['bartender', 'waiter', 'manager']}>
                          <BarDashboard />
                        </RoleGuard>
                      </BusinessTypeGuard>
                    </ProPlanGuard>
                  </RouteGuard>
                } />
                <Route path="/dashboard/hotel/reception" element={
                  <RouteGuard>
                    <ProPlanGuard>
                      <BusinessTypeGuard requiredType="hotel">
                        <RoleGuard allowedRoles={['receptionist', 'reception', 'manager']}>
                          <HotelDashboard />
                        </RoleGuard>
                      </BusinessTypeGuard>
                    </ProPlanGuard>
                  </RouteGuard>
                } />
                <Route path="/dashboard/hotel/housekeeping" element={
                  <RouteGuard>
                    <ProPlanGuard>
                      <BusinessTypeGuard requiredType="hotel">
                        <RoleGuard allowedRoles={['housekeeping', 'manager']}>
                          <HotelDashboard />
                        </RoleGuard>
                      </BusinessTypeGuard>
                    </ProPlanGuard>
                  </RouteGuard>
                } />
                <Route path="/dashboard/supermarket/department" element={
                  <RouteGuard>
                    <ProPlanGuard>
                      <BusinessTypeGuard requiredType="supermarket">
                        <RoleGuard allowedRoles={['department_head', 'manager']}>
                          <SupermarketDashboard />
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
                
                {/* Pro Plan Direct Access Routes — require auth + matching business type */}
                <Route path="/student" element={<ProtectedRoute><RouteGuard><StudentDashboard /></RouteGuard></ProtectedRoute>} />
                <Route path="/student/*" element={<ProtectedRoute><RouteGuard><StudentDashboard /></RouteGuard></ProtectedRoute>} />
                <Route path="/kiosk" element={<ProtectedRoute adminOnly><RouteGuard><ProPlanGuard><BusinessTypeGuard requiredType="kiosk"><AdminKioskDashboard /></BusinessTypeGuard></ProPlanGuard></RouteGuard></ProtectedRoute>} />
                <Route path="/kiosk/*" element={<ProtectedRoute adminOnly><RouteGuard><ProPlanGuard><BusinessTypeGuard requiredType="kiosk"><AdminKioskDashboard /></BusinessTypeGuard></ProPlanGuard></RouteGuard></ProtectedRoute>} />
                <Route path="/bar" element={<ProtectedRoute adminOnly><RouteGuard><ProPlanGuard><BusinessTypeGuard requiredType="bar"><BarDashboard /></BusinessTypeGuard></ProPlanGuard></RouteGuard></ProtectedRoute>} />
                <Route path="/bar/*" element={<ProtectedRoute adminOnly><RouteGuard><ProPlanGuard><BusinessTypeGuard requiredType="bar"><BarDashboard /></BusinessTypeGuard></ProPlanGuard></RouteGuard></ProtectedRoute>} />
                <Route path="/hotel" element={<ProtectedRoute adminOnly><RouteGuard><ProPlanGuard><BusinessTypeGuard requiredType="hotel"><HotelDashboard /></BusinessTypeGuard></ProPlanGuard></RouteGuard></ProtectedRoute>} />
                <Route path="/hotel/*" element={<ProtectedRoute adminOnly><RouteGuard><ProPlanGuard><BusinessTypeGuard requiredType="hotel"><HotelDashboard /></BusinessTypeGuard></ProPlanGuard></RouteGuard></ProtectedRoute>} />
                <Route path="/school" element={<ProtectedRoute adminOnly><RouteGuard><ProPlanGuard><BusinessTypeGuard requiredType="school"><AdminSchoolDashboard /></BusinessTypeGuard></ProPlanGuard></RouteGuard></ProtectedRoute>} />
                <Route path="/school/*" element={<ProtectedRoute adminOnly><RouteGuard><ProPlanGuard><BusinessTypeGuard requiredType="school"><AdminSchoolDashboard /></BusinessTypeGuard></ProPlanGuard></RouteGuard></ProtectedRoute>} />
                <Route path="/supermarket" element={<ProtectedRoute adminOnly><RouteGuard><ProPlanGuard><BusinessTypeGuard requiredType="supermarket"><SupermarketDashboard /></BusinessTypeGuard></ProPlanGuard></RouteGuard></ProtectedRoute>} />
                <Route path="/supermarket/*" element={<ProtectedRoute adminOnly><RouteGuard><ProPlanGuard><BusinessTypeGuard requiredType="supermarket"><SupermarketDashboard /></BusinessTypeGuard></ProPlanGuard></RouteGuard></ProtectedRoute>} />
                <Route path="/hospital" element={<ProtectedRoute adminOnly><RouteGuard><ProPlanGuard><BusinessTypeGuard requiredType="hospital"><AdminHospitalDashboard /></BusinessTypeGuard></ProPlanGuard></RouteGuard></ProtectedRoute>} />
                <Route path="/hospital/*" element={<ProtectedRoute adminOnly><RouteGuard><ProPlanGuard><BusinessTypeGuard requiredType="hospital"><AdminHospitalDashboard /></BusinessTypeGuard></ProPlanGuard></RouteGuard></ProtectedRoute>} />
                <Route path="/clinic" element={<ProtectedRoute adminOnly><RouteGuard><ProPlanGuard><BusinessTypeGuard requiredType="clinic"><AdminClinicDashboard /></BusinessTypeGuard></ProPlanGuard></RouteGuard></ProtectedRoute>} />
                <Route path="/clinic/*" element={<ProtectedRoute adminOnly><RouteGuard><ProPlanGuard><BusinessTypeGuard requiredType="clinic"><AdminClinicDashboard /></BusinessTypeGuard></ProPlanGuard></RouteGuard></ProtectedRoute>} />
                <Route path="/petrol" element={<ProtectedRoute adminOnly><RouteGuard><PetroleumPlanGuard><BusinessTypeGuard requiredType="petrol"><PetrolAdminDashboard /></BusinessTypeGuard></PetroleumPlanGuard></RouteGuard></ProtectedRoute>} />
                <Route path="/petrol/*" element={<ProtectedRoute adminOnly><RouteGuard><PetroleumPlanGuard><BusinessTypeGuard requiredType="petrol"><PetrolAdminDashboard /></BusinessTypeGuard></PetroleumPlanGuard></RouteGuard></ProtectedRoute>} />
                <Route path="/shoes" element={<ProtectedRoute adminOnly><RouteGuard><ProPlanGuard><BusinessTypeGuard requiredType="shoes"><AdminShoeDashboard /></BusinessTypeGuard></ProPlanGuard></RouteGuard></ProtectedRoute>} />
                <Route path="/shoes/*" element={<ProtectedRoute adminOnly><RouteGuard><ProPlanGuard><BusinessTypeGuard requiredType="shoes"><AdminShoeDashboard /></BusinessTypeGuard></ProPlanGuard></RouteGuard></ProtectedRoute>} />
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