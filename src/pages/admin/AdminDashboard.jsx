import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, ShoppingBag, Package, Layers, TrendingDown,
  Users, Settings, LogOut, Menu, X, ExternalLink, Clock, Bell, DollarSign, Tag, CreditCard
} from 'lucide-react';
import Overview from './Overview';
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
import ReminderModal from '../../components/ReminderModal';
import ScreenLock from '../../components/ScreenLock';
import useInactivity from '../../hooks/useInactivity';
import { settings as settingsApi } from '../../services/api';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [appSettings, setAppSettings] = useState({});
  const [isLocked, unlock] = useInactivity(45000); // 45 seconds


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
    
    return () => clearTimeout(timer);
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsApi.get();
      setAppSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { id: 'sales', label: 'Sales', icon: ShoppingBag, path: '/admin/sales' },
    { id: 'inventory', label: 'Inventory', icon: Package, path: '/admin/inventory' },
    { id: 'recipes', label: 'Recipes/BOM', icon: Layers, path: '/admin/recipes' },
    { id: 'expenses', label: 'Expenses', icon: TrendingDown, path: '/admin/expenses' },
    { id: 'users', label: 'Users', icon: Users, path: '/admin/users' },
    { id: 'time', label: 'Time Tracking', icon: Clock, path: '/admin/time' },
    { id: 'reminders', label: 'Reminders', icon: Bell, path: '/admin/reminders' },
    { id: 'service-fees', label: 'Service Fees', icon: DollarSign, path: '/admin/service-fees' },
    { id: 'discounts', label: 'Discounts', icon: Tag, path: '/admin/discounts' },
    { id: 'credit-requests', label: 'Credit Requests', icon: CreditCard, path: '/admin/credit-requests' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' }
  ];

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-gray-200 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} flex flex-col`}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Admin Panel
                </h2>
                <p className="text-xs text-gray-500 mt-1">Ultra Package</p>
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
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {menuItems.find(item => isActive(item.path))?.label || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/reminders" element={<RemindersManager />} />
            <Route path="/service-fees" element={<ServiceFees />} />
            <Route path="/discounts" element={<Discounts />} />
            <Route path="/credit-requests" element={<CreditRequests />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/time" element={<TimeTracking />} />
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