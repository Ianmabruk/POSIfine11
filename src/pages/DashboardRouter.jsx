// Dashboard Router - Routes to the correct dashboard based on business type
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

// Import all dashboard variants
import AdminDashboard from './admin/AdminDashboard';
import BarAdminDashboard from './admin/BarAdminDashboard';

const DashboardRouter = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/login');
      return;
    }
  }, [user, loading, navigate]);

  if (loading) return null;

  // Get business type from user or localStorage
  const businessType = user?.businessType || localStorage.getItem('selectedBusinessType');

  console.log('[DASHBOARD ROUTER] User:', user?.email, 'Business Type:', businessType);

  // Route to correct dashboard based on business type
  switch (businessType) {
    case 'bar':
      return <BarAdminDashboard />;
    case 'hospital':
      return <div className="p-8"><h1>Hospital Admin Dashboard (Coming Soon)</h1></div>;
    case 'school':
      return <div className="p-8"><h1>School Admin Dashboard (Coming Soon)</h1></div>;
    case 'kiosk':
      return <div className="p-8"><h1>Kiosk Admin Dashboard (Coming Soon)</h1></div>;
    case 'petrol':
      return <div className="p-8"><h1>Petrol Station Admin Dashboard (Coming Soon)</h1></div>;
    case 'shoes':
      return <div className="p-8"><h1>Shoes Store Admin Dashboard (Coming Soon)</h1></div>;
    default:
      // Fallback to generic admin dashboard
      return <AdminDashboard />;
  }
};

export default DashboardRouter;
