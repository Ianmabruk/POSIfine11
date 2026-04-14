
import { useState, useEffect } from 'react';
import { BASE_API_URL } from '../../services/api';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, ShoppingBag, Package, Layers, TrendingDown, TrendingUp,
  Users, Settings, LogOut, Menu, X, ExternalLink, Clock, Bell, DollarSign, Tag, CreditCard, Truck, MessageSquare, BarChart3
} from 'lucide-react';
import Overview from './Overview';
import Analytics from './Analytics';
import Inventory from './Inventory';
import Recipes from './Recipes';
import Sales from './Sales';
import Expenses from './Expenses';
import UserManagement from './UserManagement';
import TimeTracking from './TimeTracking';
import SettingsPage from './SettingsPage';
import ServiceFees from './ServiceFees';
import RemindersManager from './RemindersManager';
import Discounts from './Discounts';
import CreditRequests from './CreditRequests';
import Vendors from './Vendors';
import AdminSupportChat from './AdminSupportChat';
import StockDashboard from './StockDashboard';
import ReminderModal from '../../components/ReminderModal';
import ScreenLock from '../../components/ScreenLock';
import useInactivity from '../../hooks/useInactivity';
import { settings as settingsApi } from '../../services/api';


export default function AdminDashboard() {
  const { user, logout, isCashierUserManagementEnabled, appSettings: ctxSettings } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  // Seed appSettings from context (which reads localStorage + backend on login)
  const [appSettings, setAppSettings] = useState(() => {
    try {
      const cached = localStorage.getItem('appLogo');
      return cached ? { logo: cached } : {};
    } catch { return {}; }
  });
  const [isLocked, unlock] = useInactivity(45000); // 45 seconds

  // Sync from AuthContext appSettings whenever it changes
  useEffect(() => {
    if (ctxSettings && Object.keys(ctxSettings).length > 0) {
      setAppSettings(prev => ({ ...prev, ...ctxSettings }));
    }
  }, [ctxSettings]);

  // 🚫 CRITICAL: Pro Plan users should NOT access this Basic/Ultra Admin Dashboard
  // Redirect them to their business-specific dashboards
  const isPro = user?.subscription === 'pro' || user?.plan === 'pro' || user?.subscription === 'custom' || user?.plan === 3000;
  const businessType = user?.businessType || user?.business_type;
  
  if (isPro && businessType) {
    console.log('🚫 [AdminDashboard] Pro user detected - redirecting to business dashboard:', businessType);
    return <Navigate to={`/admin/${businessType}`} replace />;
  }
  
  if (isPro && !businessType && user?.role === 'admin') {
    console.log('🚫 [AdminDashboard] Pro user without business type - redirecting to selector');
    return <Navigate to="/select-business-type" replace />;
  }

  useEffect(() => {
    // CRITICAL: Ensure user data is correct and prevent unnecessary redirects
    const ensureUserData = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        let needsUpdate = false;
        
        // If user has ultra plan or admin role, ensure they stay here
        if (userData.plan === 'ultra' || userData.role === 'admin') {
          // Ensure active flag is set
          if (!userData.active) {
            userData.active = true;
            needsUpdate = true;
          }
          // Ensure role matches plan
          if (userData.plan === 'ultra' && userData.role !== 'admin') {
            userData.role = 'admin';
            needsUpdate = true;
          }
          // Ensure price is set
          if (userData.plan === 'ultra' && (!userData.price || userData.price !== 1600)) {
            userData.price = 1600;
            needsUpdate = true;
          }
          
          if (needsUpdate) {
            localStorage.setItem('user', JSON.stringify(userData));
            // Force context to update by dispatching storage event
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('localStorageUpdated'));
          }
        }
      }
    };
    
    // Run immediately and also after a short delay to catch any async updates
    ensureUserData();
    setTimeout(ensureUserData, 100);
    
    // Show reminder modal on login (with delay to ensure everything is loaded)
    const timer = setTimeout(() => {
      setShowReminderModal(true);
    }, 1000);
    
    loadSettings();

    const handleSettingsChanged = (event) => {
      if (event?.detail) {
        setAppSettings((prev) => ({ ...prev, ...event.detail }));
        return;
      }
      loadSettings();
    };

    window.addEventListener('settingsChanged', handleSettingsChanged);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('settingsChanged', handleSettingsChanged);
    };
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsApi.get();
      setAppSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };


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

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const filteredMenuItems = menuItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      askAiFromSearch();
    }
  };

  const askAiFromSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setAiLoading(true);
      setAiError('');
      setAiAnswer('');
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_API_URL}/ai/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          question: searchQuery.trim(),
          context: {
            section: menuItems.find(item => isActive(item.path))?.label || 'Dashboard',
            user: { name: user?.name, email: user?.email },
            note: 'Analyze current admin reports and answer based on available data.'
          }
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || 'AI request failed');
      }

      const answer = payload?.data?.answer || payload?.answer;
      if (!answer) throw new Error('No AI response received');
      setAiAnswer(answer);
    } catch (err) {
      setAiError(err.message || 'AI request failed');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-gray-200 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} flex flex-col`}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center gap-3">
                {appSettings.logo ? (
                  <img src={appSettings.logo} alt="Business logo" className="w-11 h-11 rounded-xl object-cover border border-gray-200" />
                ) : null}
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Admin Panel
                  </h2>
                  <p className="text-xs text-gray-500">POS Management</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={() => window.open('/cashier', '_blank')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ExternalLink className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Open POS</span>}
          </button>
          
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
          
          <button
            onClick={handleClearData}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors"
          >
            <X className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Clear Data</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {menuItems.find(item => isActive(item.path))?.label || 'Dashboard'}
              </h1>
            </div>
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search pages, reports, inventory..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchQuery && filteredMenuItems.length > 0 && (
                  <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    {filteredMenuItems.slice(0, 6).map((item) => (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(`/admin${item.path}`);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  onClick={askAiFromSearch}
                  disabled={aiLoading || !searchQuery.trim()}
                  className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {aiLoading ? 'Asking AI...' : 'Search with AI'}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {appSettings.logo ? (
                <img src={appSettings.logo} alt="Business logo" className="hidden md:block w-12 h-12 rounded-2xl object-cover border border-gray-200" />
              ) : null}
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              {user?.profile_picture || user?.profilePicture ? (
                <img
                  src={user?.profile_picture || user?.profilePicture}
                  alt={user?.name}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {(aiAnswer || aiError) && (
            <div className="px-6 pt-4">
              <div className={`rounded-lg border px-4 py-3 text-sm ${aiError ? 'border-red-200 bg-red-50 text-red-700' : 'border-blue-200 bg-blue-50 text-blue-900'}`}>
                {aiError ? aiError : aiAnswer}
              </div>
            </div>
          )}
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
        </main>
      </div>

      {/* Reminder Modal */}
      {showReminderModal && (
        <ReminderModal onClose={() => setShowReminderModal(false)} />
      )}

      {/* Screen Lock */}
      {isLocked && (
        <ScreenLock onUnlock={unlock} logo={appSettings.logo} />
      )}
    </div>
  );
}