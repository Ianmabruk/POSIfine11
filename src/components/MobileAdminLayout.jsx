import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Package, Menu, X, Bell, LogOut,
  BarChart3,   Layers, TrendingDown, Truck, Users, Clock,
  BellRing, Tag, CreditCard, Settings, BookOpen, FileText
} from 'lucide-react';

const mainNavItems = [
  { id: 'home', label: 'Home', icon: LayoutDashboard, path: '/mobile' },
  { id: 'sales', label: 'Sales', icon: ShoppingBag, path: '/mobile/sales' },
  { id: 'inventory', label: 'Inventory', icon: Package, path: '/mobile/inventory' },
  { id: 'more', label: 'More', icon: Menu, path: '' },
];

const sidebarNavItems = [
  { id: 'home', label: 'Home', icon: LayoutDashboard, path: '/mobile' },
  { id: 'sales', label: 'Sales', icon: ShoppingBag, path: '/mobile/sales' },
  { id: 'inventory', label: 'Inventory', icon: Package, path: '/mobile/inventory' },
  { id: 'stock', label: 'Stock', icon: BarChart3, path: '/mobile/stock' },
  { id: 'recipes', label: 'Recipes', icon: Layers, path: '/mobile/recipes' },
  { id: 'expenses', label: 'Expenses', icon: TrendingDown, path: '/mobile/expenses' },
  { id: 'vendors', label: 'Vendors', icon: Truck, path: '/mobile/vendors' },
  { id: 'users', label: 'Users', icon: Users, path: '/mobile/users' },
  { id: 'time', label: 'Time Tracking', icon: Clock, path: '/mobile/time-tracking' },
  { id: 'reminders', label: 'Reminders', icon: BellRing, path: '/mobile/reminders' },
  { id: 'discounts', label: 'Discounts', icon: Tag, path: '/mobile/discounts' },
  { id: 'credit-requests', label: 'Credit Requests', icon: CreditCard, path: '/mobile/credit-requests' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/mobile/analytics' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/mobile/settings' },
];

export default function MobileAdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path) => {
    if (!path) return false;
    if (path === '/mobile') return location.pathname === '/mobile';
    return location.pathname.startsWith(path);
  };

  const handleNav = (item) => {
    if (item.path) {
      navigate(item.path);
    }
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
              <p className="text-xs text-gray-500 font-medium">Posify Management</p>
            </div>
          </div>
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </header>

      {/* Sidebar Drawer */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 translate-x-0">
            <div className="p-4 border-b border-gray-200/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-brand-500 flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
                  <p className="text-xs text-gray-500">Posify Management</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto" style={{ height: 'calc(100vh - 140px)' }}>
              {sidebarNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-r from-primary-600 to-brand-600 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      active ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-3 border-t border-gray-200/60 space-y-1.5">
              <button
                onClick={() => { navigate('/mobile/cashier'); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-gray-100/80 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm">Open POS</span>
              </button>
              <button
                onClick={() => { navigate('/auth/login'); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm">Logout</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200/60 z-30 safe-bottom shadow-lg"
        style={{ height: 'auto' }}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                onClick={() => item.path && handleNav(item)}
                type="button"
                className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] py-2 rounded-lg transition-all duration-200 touch-manipulation ${
                  active ? 'text-primary-600' : 'text-gray-400'
                }`}
                style={{ flex: 1 }}
              >
                <Icon className={`w-6 h-6 transition-all duration-200 ${active ? 'scale-110' : ''}`} />
                <span className={`text-[10px] mt-1 font-medium transition-all duration-200 ${active ? 'text-primary-600' : 'text-gray-500'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
