import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { stats, sales as salesApi, products, users } from '../../services/api';
import { BASE_API_URL } from '../../services/api';
import MobileAddProductModal from '../../components/MobileAddProductModal';
import {
  LayoutDashboard, ShoppingBag, Package, Layers, TrendingDown, TrendingUp,
  Users, Settings, LogOut, Menu, X, ExternalLink, Clock, Bell, DollarSign,
  Tag, CreditCard, Truck, MessageSquare, BarChart3, Search, Smartphone,
  Monitor, Home, Plus, ChevronRight, BellRing, User, Loader2
} from 'lucide-react';

export default function AdminMobileDashboard() {
  const { user, logout, isCashierUserManagementEnabled } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState({
    stats: { totalSales: 0, totalExpenses: 0, profit: 0, grossProfit: 0, netProfit: 0, totalCOGS: 0, dailySales: 0, weeklySales: 0, productCount: 0 },
    recentSales: [],
    lowStock: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [showCashierSelect, setShowCashierSelect] = useState(false);
  const [cashierList, setCashierList] = useState([]);
  const [cashierLoading, setCashierLoading] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, path: '/mobile' },
    { id: 'sales', label: 'Sales', icon: ShoppingBag, path: '/mobile/sales' },
    { id: 'inventory', label: 'Inventory', icon: Package, path: '/mobile/inventory' },
    { id: 'stock', label: 'Stock', icon: BarChart3, path: '/mobile/stock' },
    { id: 'recipes', label: 'Recipes', icon: Layers, path: '/mobile/recipes' },
    { id: 'expenses', label: 'Expenses', icon: TrendingDown, path: '/mobile/expenses' },
    { id: 'vendors', label: 'Vendors', icon: Truck, path: '/mobile/vendors' },
    ...(isCashierUserManagementEnabled() ? [{ id: 'users', label: 'Users', icon: Users, path: '/mobile/users' }] : []),
    { id: 'time', label: 'Time Tracking', icon: Clock, path: '/mobile/time-tracking' },
    { id: 'reminders', label: 'Reminders', icon: Bell, path: '/mobile/reminders' },
    { id: 'discounts', label: 'Discounts', icon: Tag, path: '/mobile/discounts' },
    { id: 'credit-requests', label: 'Credit Requests', icon: CreditCard, path: '/mobile/credit-requests' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/mobile/analytics' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/mobile/settings' }
  ];

  const menuGroups = [
    { key: 'main', label: 'MAIN', items: menuItems.filter(i => ['overview','sales','inventory','stock','recipes','expenses','vendors','users','time','reminders','discounts','credit-requests','analytics'].includes(i.id)) },
    { key: 'system', label: 'SYSTEM', items: menuItems.filter(i => ['settings'].includes(i.id)) },
  ];

  const loadCashiers = async () => {
    setCashierLoading(true);
    try {
      const data = await users.getAll();
      const cashiers = (Array.isArray(data) ? data : []).filter(
        (u) => u.role === 'cashier' && u.isActive !== false
      );
      setCashierList(cashiers);
    } catch (error) {
      console.error('Failed to load cashiers:', error);
      setCashierList([]);
    } finally {
      setCashierLoading(false);
    }
  };

  const handleOpenPOS = () => {
    setShowCashierSelect(true);
    loadCashiers();
  };

  const handleSelectCashier = (cashier) => {
    localStorage.setItem('adminViewingCashier', String(cashier.id));
    setShowCashierSelect(false);
    navigate('/mobile/cashier');
  };

  const loadData = async () => {
    try {
      const [statsData, salesData] = await Promise.all([
        stats.get(),
        salesApi.getAll({ limit: 20, sort: '-created_at' })
      ]);
      setData({
        stats: {
          totalSales: statsData?.totalSales || 0,
          totalExpenses: statsData?.totalExpenses || 0,
          profit: statsData?.profit || 0,
          grossProfit: statsData?.grossProfit || ((statsData?.totalSales || 0) - (statsData?.totalCOGS || 0)),
          netProfit: statsData?.netProfit ?? statsData?.profit ?? 0,
          totalCOGS: statsData?.totalCOGS || 0,
          dailySales: statsData?.dailySales || 0,
          weeklySales: statsData?.weeklySales || 0,
          productCount: statsData?.productCount ?? statsData?.productsCount ?? 0
        },
        recentSales: Array.isArray(salesData) ? salesData.slice(0, 10) : [],
        lowStock: []
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const quickActions = [
    { label: 'Add Product', icon: Plus, action: () => setShowAddProduct(true), color: 'bg-blue-500' },
    { label: 'View Reports', icon: BarChart3, path: '/mobile/sales', color: 'bg-purple-500' },
  ];

  const bottomNavItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'sales', label: 'Sales', icon: ShoppingBag },
    { id: 'cart', label: 'Inventory', icon: Package },
    { id: 'more', label: 'More', icon: Menu },
  ];

  const handleBottomNav = (tab) => {
    setActiveTab(tab);
    if (tab === 'home') {
      navigate('/mobile');
    } else if (tab === 'sales') {
      navigate('/mobile/sales');
    } else if (tab === 'cart') {
      navigate('/mobile/inventory');
    } else if (tab === 'more') {
      setSidebarOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
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
              {menuGroups.map(group => (
                <div key={group.key} className="mb-3">
                  <p className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">{group.label}</p>
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                    return (
                      <button
                        key={item.id}
                        onClick={() => { navigate(item.path); setSidebarOpen(false); }}
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
                </div>
              ))}
            </nav>
            <div className="p-3 border-t border-gray-200/60 space-y-1.5">
              <button
                onClick={() => { handleOpenPOS(); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-gray-100/80 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm">Open POS</span>
              </button>
              <button
                onClick={() => { handleLogout(); setSidebarOpen(false); }}
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

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Welcome Card */}
        <div className="bg-gradient-to-br from-primary-600 to-brand-600 rounded-2xl p-5 text-white shadow-lg">
          <h2 className="text-xl font-bold mb-1">Good Morning, {user?.name?.split(' ')[0] || 'Admin'} 👋</h2>
          <p className="text-white/80 text-sm">Here's what's happening with your business today.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 font-medium mb-1">Orders</p>
            <p className="text-2xl font-bold text-gray-900">{data.recentSales.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 font-medium mb-1">Products</p>
            <p className="text-2xl font-bold text-gray-900">{data.stats.productCount || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 font-medium mb-1">Low Stock</p>
            <p className="text-2xl font-bold text-orange-600">0</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 font-medium mb-1">Users</p>
            <p className="text-2xl font-bold text-gray-900">-</p>
          </div>
        </div>

        {/* Overview Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Overview</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-xs text-gray-500 font-medium">Total Sales</p>
              </div>
              <p className="text-lg font-bold text-gray-900">KSH {data.stats.totalSales?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-xs text-gray-500 font-medium">Gross Profit</p>
              </div>
              <p className="text-lg font-bold text-gray-900">KSH {data.stats.grossProfit?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Package className="w-4 h-4 text-orange-600" />
                </div>
                <p className="text-xs text-gray-500 font-medium">Total COGS</p>
              </div>
              <p className="text-lg font-bold text-gray-900">KSH {data.stats.totalCOGS?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-xs text-gray-500 font-medium">Net Profit</p>
              </div>
              <p className="text-lg font-bold text-gray-900">KSH {data.stats.netProfit?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>

        {/* Open POS */}
        <button
          onClick={handleOpenPOS}
          className="w-full bg-gradient-to-r from-primary-600 to-brand-600 text-white rounded-xl p-4 flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center gap-3">
            <ExternalLink className="w-5 h-5" />
            <span className="font-semibold">Open POS</span>
          </div>
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Recent Sales */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
            <button onClick={() => navigate('/mobile/sales')} className="text-sm text-primary-600 font-medium">
              View All
            </button>
          </div>
          {data.recentSales.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center border border-gray-100">
              <p className="text-gray-500 text-sm mb-3">No sales yet</p>
              <p className="text-gray-400 text-xs mb-4">Sales will appear here once transactions are completed.</p>
              <button onClick={handleOpenPOS} className="btn-primary text-sm px-4 py-2">
                View POS
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentSales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {sale.createdAt ? new Date(sale.createdAt).toLocaleString() : 'N/A'}
                    </span>
                    <span className="badge badge-success text-xs">{sale.paymentMethod || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{Array.isArray(sale.items) ? sale.items.length : 0} items</span>
                    <span className="font-semibold text-green-600">KSH {sale.total?.toLocaleString() || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

         {/* Quick Actions */}
         <div>
           <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
           <div className="grid grid-cols-2 gap-3">
             {quickActions.map((action) => {
               const Icon = action.icon;
               return (
                 <button
                   key={action.label}
                   onClick={() => action.action ? action.action() : navigate(action.path)}
                   className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
                 >
                   <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center`}>
                     <Icon className="w-5 h-5 text-white" />
                   </div>
                   <span className="text-sm font-medium text-gray-700">{action.label}</span>
                 </button>
               );
             })}
           </div>
         </div>

         {/* Add Product FAB - primary action */}
         <button
           type="button"
           onClick={() => setShowAddProduct(true)}
           className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-slate-900 text-white shadow-xl flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all"
           aria-label="Add Product"
           style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
         >
           <Plus className="w-7 h-7" />
         </button>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200/60 z-30" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around py-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleBottomNav(item.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
                  isActive ? 'text-primary-600' : 'text-gray-400'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Add Product Modal */}
      <MobileAddProductModal
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onProductCreated={loadData}
      />

      {/* Cashier Selection Modal for Open POS */}
      {showCashierSelect && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCashierSelect(false)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Select Cashier for POS</h3>
              <button onClick={() => setShowCashierSelect(false)} className="p-2 text-gray-400 hover:text-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {cashierLoading ? (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Loading cashiers...
                </div>
              ) : cashierList.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No cashiers found</p>
                </div>
              ) : (
                cashierList.map((cashier) => (
                  <button
                    key={cashier.id}
                    onClick={() => handleSelectCashier(cashier)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                      {cashier.name?.[0]?.toUpperCase() || 'C'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{cashier.name || 'Cashier'}</p>
                      <p className="text-xs text-gray-500">{cashier.email}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
