// Business Aware Admin Router - Routes to correct dashboard based on business type
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

// Import OLD admin dashboard (simple version)
import AdminDashboard from './AdminDashboard';

// Import business-specific admin dashboards
import BarAdminDashboard from './admin/BarAdminDashboard';
import HospitalAdminDashboard from './admin/HospitalAdminDashboard';
import SchoolAdminDashboard from './admin/SchoolAdminDashboard';
import KioskAdminDashboard from './admin/KioskAdminDashboard';
import PetrolAdminDashboard from './admin/PetrolAdminDashboard';
import ShoeAdminDashboard from './admin/ShoeAdminDashboard';

const BusinessAwareAdminRouter = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/auth/login');
      return;
    }
    
    // CRITICAL: Cashiers should NEVER access /admin routes
    // Redirect them to their proper dashboard
    if (user.role === 'cashier') {
      navigate('/dashboard/cashier');
      return;
    }
  }, [user, loading, navigate]);

  if (loading) return null;

  // Get business type from user or localStorage
  const businessType = user?.businessType || localStorage.getItem('selectedBusinessType');

  console.log('[BUSINESS ADMIN ROUTER] User:', user?.email, 'Role:', user?.role, 'Business Type:', businessType);

  // Only show admin dashboards - this route is admin-only
  // Route to correct dashboard based on business type
  switch (businessType) {
    case 'bar':
      return <BarAdminDashboard />;
    case 'hospital':
      return <HospitalAdminDashboard />;
    case 'school':
      return <SchoolAdminDashboard />;
    case 'kiosk':
      return <KioskAdminDashboard />;
    case 'petrol':
      return <PetrolAdminDashboard />;
    case 'shoes':
      return <ShoeAdminDashboard />;
    default:
      // Default to OLD simple admin dashboard
      return <AdminDashboard />;
  }
};

export default BusinessAwareAdminRouter;
