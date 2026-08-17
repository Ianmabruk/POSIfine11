/**
 * Dashboard Routing Utility
 * 
 * Determines the correct dashboard route based on user attributes:
 * - subscription (starter, business, custom)
 * - role (main_admin, admin, cashier)
 */

/**
 * Get the correct dashboard route for a user
 * 
 * @param {Object} user - User object with subscription, role, deviceMode
 * @returns {string} - Dashboard route path
 */
export function getDashboardRoute(user) {
  if (!user) {
    console.warn('[getDashboardRoute] No user provided');
    return '/auth/login';
  }

  const role = user.role || 'cashier';
  const deviceMode = user.deviceMode || user.device_mode || 'desktop';

  console.log('[getDashboardRoute] Evaluating:', {
    role,
    deviceMode,
    user: user.email
  });

  if (role === 'main_admin' || role === 'owner') {
    console.log('[getDashboardRoute] → /main.admin (Main Admin)');
    return '/main.admin';
  }

  if (role === 'admin') {
    if (deviceMode === 'mobile') {
      console.log('[getDashboardRoute] → /mobile (Mobile Admin)');
      return '/mobile';
    }
    console.log('[getDashboardRoute] → /admin (Desktop Admin)');
    return '/admin';
  }

  if (role === 'cashier') {
    if (deviceMode === 'mobile') {
      console.log('[getDashboardRoute] → /mobile/cashier (Mobile Cashier)');
      return '/mobile/cashier';
    }
    console.log('[getDashboardRoute] → /dashboard/cashier (Desktop Cashier)');
    return '/dashboard/cashier';
  }

  console.warn('[getDashboardRoute] → /dashboard (Fallback)');
  return '/dashboard';
}

export function hasBusinessType(user) {
  if (!user) return false;
  return !!(user.businessType || user.business_type);
}

export function isProUser(user) {
  if (!user) return false;
  const plan = user.plan || user.subscription || user.account_plan;
  return plan === 'business' || plan === 'custom';
}

export function getBusinessDashboardComponent(user) {
  if (!user) return null;
  const businessType = user.businessType || user.business_type;
  const businessRole = user.businessRole || user.business_role || user.role;
  return { businessType, businessRole };
}
