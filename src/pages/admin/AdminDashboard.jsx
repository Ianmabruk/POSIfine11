
import { useState, useEffect, lazy, Suspense } from 'react';
import { BASE_API_URL } from '../../services/api';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, ShoppingBag, Package, Layers, TrendingDown, TrendingUp,
  Users, Settings, LogOut, Menu, X, ExternalLink, Clock, Bell, DollarSign, Tag, CreditCard, Truck, MessageSquare, BarChart3, Search
} from 'lucide-react';
import ReminderModal from '../../components/ReminderModal';
import SkeletonCard from '../../components/ui/SkeletonCard';

const Overview = lazy(() => import('./Overview'));
const Analytics = lazy(() => import('./Analytics'));
const Inventory = lazy(() => import('./Inventory'));
const Recipes = lazy(() => import('./Recipes'));
const Sales = lazy(() => import('./Sales'));
const Expenses = lazy(() => import('./Expenses'));
const UserManagement = lazy(() => import('./UserManagement'));
const TimeTracking = lazy(() => import('./TimeTracking'));
const SettingsPage = lazy(() => import('./SettingsPage'));
const ServiceFees = lazy(() => import('./ServiceFees'));
const RemindersManager = lazy(() => import('./RemindersManager'));
const Discounts = lazy(() => import('./Discounts'));
const CreditRequests = lazy(() => import('./CreditRequests'));
const Vendors = lazy(() => import('./Vendors'));
const AdminSupportChat = lazy(() => import('./AdminSupportChat'));
const StockDashboard = lazy(() => import('./StockDashboard'));


export default function AdminDashboard() {
  const { user, logout, isCashierUserManagementEnabled, appSettings: ctxSettings } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiError, setAiError] = useState('');
  // Seed appSettings from context (which reads localStorage + backend on login)
  const [appSettings, setAppSettings] = useState(() => {
    try {
      const cached = localStorage.getItem('appLogo');
      return cached ? { logo: cached } : {};
    } catch { return {}; }
  });

  // Sync from AuthContext appSettings whenever it changes
  useEffect(() => {
    if (ctxSettings && Object.keys(ctxSettings).length > 0) {
      setAppSettings(prev => ({ ...prev, ...ctxSettings }));
    }
  }, [ctxSettings]);

  useEffect(() => {
    const reminderAlreadyShown = sessionStorage.getItem('adminReminderShown');
    let timer;
    if (!reminderAlreadyShown) {
      timer = setTimeout(() => {
        setShowReminderModal(true);
        sessionStorage.setItem('adminReminderShown', 'true');
      }, 1500);
    }

    const handleSettingsChanged = (event) => {
      if (event?.detail) {
        setAppSettings((prev) => ({ ...prev, ...event.detail }));
        return;
      }
    };

    window.addEventListener('settingsChanged', handleSettingsChanged);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('settingsChanged', handleSettingsChanged);
    };
  }, []);

  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to clear all sales and expenses data? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        const API_URL = BASE_API_URL;
        
        const response = await fetch(`${API_URL}/clear-data`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ type: 'all' })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to clear data');
        }
        
        alert('Data cleared successfully!');
        window.location.reload();
      } catch (error) {
        console.error('Failed to clear data:', error);
        alert('Failed to clear data: ' + error.message);
      }
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, path: '/admin/analytics' },
    { id: 'sales', label: 'Sales', icon: ShoppingBag, path: '/admin/sales' },
    { id: 'inventory', label: 'Inventory', icon: Package, path: '/admin/inventory' },
    { id: 'stock', label: 'Stock Dashboard', icon: BarChart3, path: '/admin/stock' },
    { id: 'recipes', label: 'Recipes/BOM', icon: Layers, path: '/admin/recipes' },
    { id: 'expenses', label: 'Expenses', icon: TrendingDown, path: '/admin/expenses' },
    { id: 'vendors', label: 'Vendors', icon: Truck, path: '/admin/vendors' },
    ...(isCashierUserManagementEnabled() ? [{ id: 'users', label: 'Users', icon: Users, path: '/admin/users' }] : []),
    { id: 'time', label: 'Time Tracking', icon: Clock, path: '/admin/time' },
    { id: 'reminders', label: 'Reminders', icon: Bell, path: '/admin/reminders' },
    { id: 'service-fees', label: 'Service Fees', icon: DollarSign, path: '/admin/service-fees' },
    { id: 'discounts', label: 'Discounts', icon: Tag, path: '/admin/discounts' },
    { id: 'credit-requests', label: 'Credit Requests', icon: CreditCard, path: '/admin/credit-requests' },
    { id: 'support', label: 'Support Chat', icon: MessageSquare, path: '/admin/support' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' }
  ];

  const menuGroups = [
    { key: 'main', label: 'Main', items: menuItems.filter(i => ['overview','analytics','sales','inventory','stock'].includes(i.id)) },
    { key: 'management', label: 'Management', items: menuItems.filter(i => ['recipes','expenses','vendors','users','time','reminders'].includes(i.id)) },
    { key: 'financial', label: 'Financial', items: menuItems.filter(i => ['service-fees','discounts','credit-requests'].includes(i.id)) },
    { key: 'system', label: 'System', items: menuItems.filter(i => ['support','settings'].includes(i.id)) },
  ];

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const filteredMenuItems = menuItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const menuItem = menuItems.find(item => isActive(item.path));
      if (menuItem) navigate(menuItem.path);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        bg-white/80 backdrop-blur-xl border-r border-gray-200/80 transition-all duration-300 flex flex-col
        fixed inset-y-0 left-0 z-50
        w-72 transform
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
        shadow-xl lg:shadow-none
      `}>
        <div className="p-4 md:p-6 border-b border-gray-200/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {appSettings.logo ? (
              <img src={appSettings.logo} alt="Business logo" className="w-9 h-9 md:w-11 md:h-11 rounded-xl object-cover border border-gray-200 shadow-sm" />
            ) : (
              <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-primary-500 to-brand-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                <LayoutDashboard className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
            )}
            <div className="hidden md:block">
              <h2 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-brand-600 bg-clip-text text-transparent">
                Admin Panel
              </h2>
              <p className="text-xs text-gray-500 font-medium">POS Management</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 md:p-4 space-y-1.5 overflow-y-auto">
          {menuGroups.map(group => (
            <div key={group.key} className="mb-3">
              <p className="hidden md:block px-3 md:px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">{group.label}</p>
              {group.items.map(item => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.id}
                    onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                    className={`
                      w-full flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl transition-all duration-200
                      ${active
                        ? 'bg-gradient-to-r from-primary-600 to-brand-600 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                      }
                    `}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      active ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-sm">{item.label}</span>
                    {active && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 md:p-4 border-t border-gray-200/60 space-y-1.5">
          <button
            onClick={() => {
              const deviceMode = user?.deviceMode || user?.device_mode || 'desktop';
              const posRoute = deviceMode === 'mobile' ? '/mobile/cashier' : '/cashier';
              if (deviceMode === 'desktop') {
                localStorage.setItem('adminViewingCashier', 'true');
              }
              window.open(posRoute, '_blank');
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100/80 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-white group-hover:shadow-sm flex items-center justify-center transition-all">
              <ExternalLink className="w-4 h-4" />
            </div>
            <span className="font-medium text-sm">Open POS</span>
          </button>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-red-50 group-hover:bg-white group-hover:shadow-sm flex items-center justify-center transition-all">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="font-medium text-sm">Logout</span>
          </button>

          <button
            onClick={handleClearData}
            className="w-full flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl text-amber-600 hover:bg-amber-50 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 group-hover:bg-white group-hover:shadow-sm flex items-center justify-center transition-all">
              <X className="w-4 h-4" />
            </div>
            <span className="font-medium text-sm">Clear Data</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="bg-white/70 backdrop-blur-xl border-b border-gray-200/60 px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-4 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center justify-between gap-2 sm:gap-6 flex-wrap flex-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-brand-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                {(() => {
                  const activeItem = menuItems.find(item => isActive(item.path));
                  const IconComp = activeItem?.icon || LayoutDashboard;
                  return <IconComp className="w-5 h-5 text-white" />;
                })()}
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                  {menuItems.find(item => isActive(item.path))?.label || 'Dashboard'}
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">Welcome back, {user?.name?.split(' ')[0]}</p>
              </div>
            </div>
            <div className="flex-1 max-w-xl hidden sm:block">
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search pages..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all placeholder:text-gray-400"
                />
                {searchQuery && filteredMenuItems.length > 0 && (
                  <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-fade-in">
                    <div className="p-2 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 px-2">Navigation</p>
                    </div>
                    {filteredMenuItems.slice(0, 6).map((item) => {
                      const IconComp = item.icon;
                      return (
                        <button
                          key={item.path}
                          onClick={() => {
                            navigate(item.path);
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors group/item"
                        >
                          <IconComp className="w-4 h-4 text-gray-400 group-hover/item:text-primary-500 transition-colors" />
                          <span className="font-medium text-gray-700 group-hover/item:text-gray-900">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {appSettings.logo ? (
                <img src={appSettings.logo} alt="Business logo" className="hidden md:block w-12 h-12 rounded-xl object-cover border border-gray-200 shadow-sm" />
              ) : null}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              {user?.profile_picture || user?.profilePicture ? (
                <img
                  src={user?.profile_picture || user?.profilePicture}
                  alt={user?.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-brand-500 flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/20">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {(aiAnswer || aiError) && (
            <div className="px-3 sm:px-6 pt-4">
              <div className={`rounded-xl border px-4 py-3 text-sm animate-fade-in ${
                aiError 
                  ? 'border-red-200 bg-red-50 text-red-700' 
                  : 'border-primary-200 bg-primary-50 text-primary-900'
              }`}>
                {aiError ? aiError : aiAnswer}
              </div>
            </div>
          )}
          <Suspense fallback={
            <div className="p-6 space-y-8">
              <div className="flex gap-4 overflow-x-auto pb-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="min-w-[200px] flex-1">
                    <SkeletonCard variant="stat" />
                  </div>
                ))}
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="min-w-[180px] flex-1">
                    <SkeletonCard variant="stat" />
                  </div>
                ))}
              </div>
              <SkeletonCard variant="chart" />
            </div>
          }>
            <Routes>
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/" element={<Overview />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/stock" element={<StockDashboard />} />
              <Route path="/recipes" element={<Recipes />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/vendors" element={<Vendors />} />
              <Route path="/reminders" element={<RemindersManager />} />
              <Route path="/service-fees" element={<ServiceFees />} />
              <Route path="/discounts" element={<Discounts />} />
              <Route path="/credit-requests" element={<CreditRequests />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/time" element={<TimeTracking />} />
              <Route path="/support" element={<AdminSupportChat />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>

      {/* Reminder Modal */}
      {showReminderModal && (
        <ReminderModal onClose={() => setShowReminderModal(false)} />
      )}
    </div>
  );
}