/**
 * Dashboard Routing Utility
 * 
 * Determines the correct dashboard route based on user attributes:
 * - subscription (basic, ultra)
 * - role (main_admin, admin, cashier)
 */

/**
 * Get the correct dashboard route for a user
 * 
 * @param {Object} user - User object with subscription, role
 * @returns {string} - Dashboard route path
 */
export function getDashboardRoute(user) {
  if (!user) {
    console.warn('[getDashboardRoute] No user provided');
    return '/auth/login';
  }

  const role = user.role || 'cashier';

  console.log('[getDashboardRoute] Evaluating:', {
    role,
    user: user.email
  });

  // 1. MAIN ADMIN - Always goes to /main.admin
  if (role === 'main_admin') {
    console.log('[getDashboardRoute] → /main.admin (Main Admin)');
    return '/main.admin';
  }

  // 2. ADMIN - Standard admin dashboard
  if (role === 'admin') {
    console.log('[getDashboardRoute] → /admin (Admin)');
    return '/admin';
  }

  // 3. CASHIER - Cashier dashboard
  if (role === 'cashier') {
    console.log('[getDashboardRoute] → /dashboard/cashier (Cashier)');
    return '/dashboard/cashier';
  }

  // 4. FALLBACK
  console.warn('[getDashboardRoute] → /dashboard (Fallback)');
  return '/dashboard';
}

/**
 * Check if user has a business type configured
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function hasBusinessType(user) {
  if (!user) return false;
  return !!(user.businessType || user.business_type);
}
