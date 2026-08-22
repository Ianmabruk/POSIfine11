import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { stats, sales as salesApi, users } from '../../services/api';
import MobileAddProductModal from '../../components/MobileAddProductModal';
import {
  ExternalLink, ChevronRight, Bell, Plus, Loader2, User, X
} from 'lucide-react';

export default function AdminMobileDashboard() {
  const { user, logout, isCashierUserManagementEnabled } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({
    stats: { totalSales: 0, totalExpenses: 0, profit: 0, grossProfit: 0, netProfit: 0, totalCOGS: 0, dailySales: 0, weeklySales: 0, productCount: 0 },
    recentSales: [],
    lowStock: []
  });
  const [loading, setLoading] = useState(true);
  const [showCashierSelect, setShowCashierSelect] = useState(false);
  const [cashierList, setCashierList] = useState([]);
  const [cashierLoading, setCashierLoading] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);

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
    { label: 'View Reports', icon: Bell, path: '/mobile/sales', color: 'bg-purple-500' },
  ];

  return (
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
