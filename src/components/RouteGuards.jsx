import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoPreloader from './LogoPreloader';

/**
 * Protected Route - Requires authentication
 */
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const hasToken = !!localStorage.getItem('token');

  if (loading) {
    return <LogoPreloader text="Loading..." />;
  }

  if (!user || !hasToken) {
    return <Navigate to="/auth/login" replace />;
  }

  return children;
}

/**
 * Pro Plan Guard - Requires Pro subscription
 */
export function ProPlanGuard({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LogoPreloader text="Loading..." />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  const isPro = user.subscription === 'pro' || user.plan === 'pro' || user.subscription === 'custom' || user.subscription === 'PRO_PETROLEUM' || user.plan === 'PRO_PETROLEUM';

  if (!isPro) {
    return <Navigate to="/upgrade" replace />;
  }

  return children;
}

/**
 * Petroleum Plan Guard - Requires PRO_PETROLEUM subscription
 */
export function PetroleumPlanGuard({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LogoPreloader text="Loading..." />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  const hasPetroleum = user.subscription === 'PRO_PETROLEUM' || user.plan === 'PRO_PETROLEUM';

  if (!hasPetroleum) {
    return <Navigate to="/upgrade" replace />;
  }

  return children;
}

/**
 * Role Guard - Requires specific role
 */
export function RoleGuard({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LogoPreloader text="Loading..." />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  const userRole = user.businessRole || user.business_role || user.role;
  const hasAccess = allowedRoles.length === 0 || allowedRoles.includes(userRole);

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <p className="text-sm text-gray-500">Required role: {allowedRoles.join(', ')}</p>
          <p className="text-sm text-gray-500">Your role: {userRole}</p>
          <button
            onClick={() => window.history.back()}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
}

/**
 * Business Type Guard - Requires specific business type
 */
export function BusinessTypeGuard({ children, requiredType }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LogoPreloader text="Loading..." />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  const businessType = user.businessType || user.business_type;

  if (!businessType) {
    return <Navigate to="/select-business-type" replace />;
  }

  if (businessType !== requiredType) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🏢</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Wrong Business Type</h1>
          <p className="text-gray-600 mb-4">This page is for {requiredType} businesses only.</p>
          <p className="text-sm text-gray-500">Your business type: {businessType}</p>
          <button
            onClick={() => window.location.href = `/admin/${businessType}`}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Your Dashboard
          </button>
        </div>
      </div>
    );
  }

  return children;
}

/**
 * Admin Guard - Requires admin role
 */
export function AdminGuard({ children }) {
  return (
    <RoleGuard allowedRoles={['admin']}>
      {children}
    </RoleGuard>
  );
}
