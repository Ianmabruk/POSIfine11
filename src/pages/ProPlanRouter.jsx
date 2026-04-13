import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { isProUser, hasBusinessType, getBusinessDashboardComponent } from '../utils/dashboardRouting';

// Import clinic dashboards
import DoctorDashboard from './clinic/DoctorDashboard';
import ReceptionDashboard from './clinic/ReceptionDashboard';
import PharmacyDashboard from './clinic/PharmacyDashboard';

// Import bar dashboard
import BarDashboard from './bar/BarDashboard';

// Import hotel dashboard
import HotelDashboard from './hotel/HotelDashboard';

// Import default admin dashboard for supermarket or fallback
import AdminDashboard from './admin/AdminDashboard';

// Import new business-specific dashboards
import SupermarketDashboard from './business/SupermarketDashboard';
import PetrolAdminDashboard from './admin/PetrolAdminDashboard';
import HospitalAdminDashboard from './admin/HospitalAdminDashboard';
import SchoolAdminDashboard from './admin/SchoolAdminDashboard';
import KioskAdminDashboard from './admin/KioskAdminDashboard';
import ShoeAdminDashboard from './admin/ShoeAdminDashboard';

// Import new staff dashboards
import StudentDashboard from './dashboards/StudentDashboard';
import CanteenStaffDashboard from './cashier/CanteenStaffDashboard';
import ShopStaffDashboard from './cashier/ShopStaffDashboard';

/**
 * ProPlanRouter - Routes Pro Plan users to business-specific dashboards
 * 
 * Routing logic:
 * - Basic/Ultra plans → Use existing /admin or /cashier routes
 * - Pro plan → Route based on business_type and business_role:
 *   
 *   Clinic:
 *   - role='doctor' → DoctorDashboard (view patients, write prescriptions)
 *   - role='reception' → ReceptionDashboard (register patients, manage appointments)
 *   - role='pharmacy' → PharmacyDashboard (dispense prescriptions, manage stock)
 *   
 *   Bar/Club:
 *   - role='bartender' or 'waiter' → BarDashboard (table orders, billing)
 *   
 *   Hotel:
 *   - role='reception' or 'housekeeping' → HotelDashboard (bookings, check-in/out)
 *   
 *   Supermarket:
 *   - Any role → SupermarketDashboard (retail POS with barcode scanning)
 */
export default function ProPlanRouter() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }

    // Check if user has Pro subscription (check both subscription and plan fields)
    if (!isProUser(user)) {
      // Redirect Basic/Ultra users to their standard dashboards
      if (user.role === 'admin') {
        console.log('[PRO ROUTER] Not a Pro user - redirecting admin to /admin');
        navigate('/admin');
      } else if (user.role === 'cashier') {
        console.log('[PRO ROUTER] Not a Pro user - redirecting cashier to /cashier');
        navigate('/cashier');
      } else {
        console.log('[PRO ROUTER] Not a Pro user - redirecting to /dashboard');
        navigate('/dashboard');
      }
      return;
    }

    // Pro user without business type → redirect to business selector
    if (!hasBusinessType(user) && user.role === 'admin') {
      console.log('[PRO ROUTER] Pro admin without business type - redirecting to /select-business-type');
      navigate('/select-business-type');
      return;
    }
    
    console.log('[PRO ROUTER] Pro user with business type:', user.businessType || user.business_type, '- rendering dashboard');
  }, [user, navigate]);

  if (!user) return null;

  // Get business context - check multiple sources
  const businessType = user.businessType || 
                       user.business_type || 
                       localStorage.getItem('businessType') || 
                       localStorage.getItem('selectedBusinessType');
  const businessRole = user.businessRole || user.business_role || user.role; // businessRole takes precedence

  console.log('[PRO PLAN ROUTER] Business Type:', businessType, 'Role:', businessRole, 'User:', user);

  // If no business type, show selection prompt (shouldn't reach here if redirect works)
  if (!businessType) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Business Type Not Set</h2>
          <p className="text-gray-600 mb-4">Please select your business type to continue.</p>
          <button
            onClick={() => navigate('/select-business-type')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Select Business Type
          </button>
        </div>
      </div>
    );
  }

  // Route based on business type and role
  if (businessType === 'clinic') {
    switch (businessRole) {
      case 'doctor':
        return <DoctorDashboard />;
      case 'reception':
      case 'registrar':
      case 'receptionist':
        return <ReceptionDashboard />;
      case 'pharmacy':
      case 'pharmacist':
        return <PharmacyDashboard />;
      default:
        // Fallback for clinic without specific role
        return <ReceptionDashboard />;
    }
  }

  if (businessType === 'bar' || businessType === 'restaurant') {
    // Bar/club/restaurant - all roles use same dashboard (bartender, waiter, manager)
    return <BarDashboard />;
  }

  if (businessType === 'hotel') {
    // Hotel - all roles use same dashboard (reception, housekeeping, manager)
    return <HotelDashboard />;
  }

  if (businessType === 'supermarket' || businessType === 'retail') {
    // Supermarket/retail uses specialized dashboard
    return <SupermarketDashboard />;
  }

  if (businessType === 'petrol') {
    return <PetrolAdminDashboard />;
  }

  if (businessType === 'hospital') {
    return <HospitalAdminDashboard />;
  }

  if (businessType === 'school') {
    // School: students get StudentDashboard, canteen/uniform/books staff get shop dashboards
    switch (businessRole) {
      case 'student':
        return <StudentDashboard />;
      case 'canteen':
      case 'canteen_staff':
        return <CanteenStaffDashboard />;
      case 'uniform':
      case 'uniform_staff':
        return <ShopStaffDashboard businessLabel="Uniform Shop" accentColor="purple" />;
      case 'books':
      case 'books_staff':
      case 'bookshop':
        return <ShopStaffDashboard businessLabel="Bookshop" accentColor="blue" />;
      default:
        return <SchoolAdminDashboard />;
    }
  }

  if (businessType === 'kiosk') {
    return <KioskAdminDashboard />;
  }

  if (businessType === 'shoes') {
    return <ShoeAdminDashboard />;
  }

  // For hospital, pharmacy, and other business types - use standard admin dashboard for now
  // These can be replaced with specialized dashboards as they're built
  if (businessType === 'hospital' || businessType === 'pharmacy' ||
      businessType === 'gym' || businessType === 'salon') {
    // Route canteen / shop sub-roles
    if (businessRole === 'canteen' || businessRole === 'canteen_staff') return <CanteenStaffDashboard />;
    if (['uniform', 'uniform_staff', 'books', 'bookshop', 'shop', 'shop_staff'].includes(businessRole))
      return <ShopStaffDashboard businessLabel={businessRole.charAt(0).toUpperCase() + businessRole.slice(1)} accentColor="orange" />;
    console.log(`[PRO PLAN ROUTER] Using standard admin dashboard for ${businessType}`);
    return <AdminDashboard />;
  }

  // Fallback to standard admin dashboard if no business type set
  console.warn('[PRO PLAN ROUTER] Unknown business type, using default admin dashboard');
  return <AdminDashboard />;
}
