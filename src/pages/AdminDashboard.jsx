export { default } from './admin/AdminDashboard';
/* Legacy dashboard (deprecated)
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { users, products, sales, expenses, stats } from '../services/api';
import { Package, DollarSign, TrendingUp, TrendingDown, Plus, Edit2, Trash2, LogOut, Search, Filter, BarChart3, ShoppingBag, Layers, Users } from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [data, setData] = useState({ products: [], sales: [], expenses: [], stats: {}, users: [] });
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', price: '', cost: '', category: 'finished', unit: 'pcs' });
  const [newUser, setNewUser] = useState({ name: '', email: '', password: 'changeme123', role: 'cashier' });
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [loaded, setLoaded] = useState({ products: false, sales: false, users: false, expenses: false });

  // Load lightweight overview on mount
  useEffect(() => {
    loadOverview();
  }, []);

  // Add polling for live stats (every 5 seconds) with smart caching
  useEffect(() => {
    let pollInterval;
    let isPolling = false;
    
    const pollStats = async () => {
      if (isPolling) return; // Prevent concurrent polls
      isPolling = true;
      
      try {
        const st = await stats.get();
        setData(prev => {
          // 🔥 CRITICAL FIX: Only update if stats actually changed
          const currentStats = prev.stats || {};
          const hasChanges = (
            currentStats.totalSales !== st?.totalSales ||
            currentStats.totalExpenses !== st?.totalExpenses ||
            currentStats.profit !== st?.profit ||
            currentStats.productsCount !== st?.productsCount ||
            currentStats.salesCount !== st?.salesCount
          );
          
          if (hasChanges) {
            console.log('📊 [AdminStats] Stats updated:', {
              sales: st?.totalSales,
              expenses: st?.totalExpenses,
              profit: st?.profit
            });
            setLastUpdateTime(new Date().toLocaleTimeString());
            return { ...prev, stats: st || {} };
          }
          
          return prev;
        });
      } catch (error) {
        console.warn('Stats polling failed:', error);
      } finally {
        isPolling = false;
      }
    };
    
    // Initial load
    pollStats();
    
    // Set up polling interval
    pollInterval = setInterval(pollStats, 5000);

    // 🔥 CRITICAL FIX: Listen for real-time events from cashier actions
    const handleSaleCompleted = () => {
      console.log('💰 [AdminStats] Sale completed event - refreshing stats');
      setTimeout(pollStats, 500); // Small delay to ensure backend is updated
    };
    
    const handleExpenseAdded = () => {
      console.log('💸 [AdminStats] Expense added event - refreshing stats');
      setTimeout(pollStats, 500);
    };
    
    const handleStockUpdated = () => {
      console.log('📦 [AdminStats] Stock updated event - refreshing stats');
      setTimeout(pollStats, 500);
    };
    
    // Add event listeners for real-time updates
    window.addEventListener('sale_completed', handleSaleCompleted);
    window.addEventListener('expense_added', handleExpenseAdded);
    window.addEventListener('stock_updated', handleStockUpdated);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      window.removeEventListener('sale_completed', handleSaleCompleted);
      window.removeEventListener('expense_added', handleExpenseAdded);
      window.removeEventListener('stock_updated', handleStockUpdated);
    };
  }, []);

  const loadOverview = async () => {
    try {
      const st = await stats.get();
      setData(prev => ({
        ...prev,
        stats: st || {}
      }));
      setLastUpdateTime(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Failed to load stats:', error);
      setData(prev => ({ ...prev, stats: {} }));
    }
  };

  const loadProducts = async () => {
    try {
      const p = await products.getAll();
      setData(prev => ({ ...prev, products: Array.isArray(p) ? p : [] }));
      setLoaded(prev => ({ ...prev, products: true }));
    } catch (error) {
      console.error('Failed to load products:', error);
      setData(prev => ({ ...prev, products: [] }));
    }
  };

  const loadSales = async () => {
    try {
      const s = await sales.getAll({ sort: '-created_at', limit: 500 });
      setData(prev => ({ ...prev, sales: Array.isArray(s) ? s : [] }));
      setLoaded(prev => ({ ...prev, sales: true }));
    } catch (error) {
      console.error('Failed to load sales:', error);
      setData(prev => ({ ...prev, sales: [] }));
    }
  };

  const loadExpenses = async () => {
    try {
      const e = await expenses.getAll();
      setData(prev => ({ ...prev, expenses: Array.isArray(e) ? e : [] }));
      setLoaded(prev => ({ ...prev, expenses: true }));
    } catch (error) {
      console.error('Failed to load expenses:', error);
      setData(prev => ({ ...prev, expenses: [] }));
    }
  };

  const loadUsers = async () => {
    try {
      const u = await users.getAll();
      setData(prev => ({ ...prev, users: Array.isArray(u) ? u : [] }));
      setLoaded(prev => ({ ...prev, users: true }));
    } catch (error) {
      console.error('Failed to load users:', error);
      setData(prev => ({ ...prev, users: [] }));
    }
  };

  useEffect(() => {
    if (activeTab === 'inventory' && !loaded.products) loadProducts();
    if (activeTab === 'sales' && !loaded.sales) loadSales();
    if (activeTab === 'users' && !loaded.users) loadUsers();
    if (activeTab === 'expenses' && !loaded.expenses) loadExpenses();
  }, [activeTab, loaded]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    console.log('📦 Add Product form submitted');
    
    try {
      if (!newProduct.name || !newProduct.price) {
        console.warn('⚠️ Validation failed - missing required fields');
        alert('Please fill in all required fields (Name, Price)');
        return;
      }

      console.log('➕ Creating product:', newProduct.name, 'Price:', newProduct.price, 'Unit:', newProduct.unit);
      
      if (!products || typeof products.create !== 'function') {
        throw new Error('Products API not properly loaded');
      }
      
      const result = await products.create({
        ...newProduct,
        price: parseFloat(newProduct.price),
        cost: parseFloat(newProduct.cost || 0),
        quantity: 0  // Products start with 0 stock, added via batches
      });

      if (!result || !result.id) {
        throw new Error('Invalid response from server - no product ID returned');
      }

      console.log('✅ Product created:', result.id, result.name);
      setNewProduct({ name: '', price: '', cost: '', category: 'finished', unit: 'pcs' });
      setShowAddProduct(false);

      // Reload data to show new product
      console.log('🔄 Reloading inventory...');
      await loadProducts();
      await loadOverview();
      alert(`✅ Product "${result.name}" added successfully!`);
    } catch (error) {
      console.error('❌ Failed to add product:', error.message, error);
      alert(`❌ Failed to add product: ${error.message || 'Unknown error'}`);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      if (!newUser.name || !newUser.email) {
        alert('Please fill in all required fields (Name, Email)');
        return;
      }

      console.log('➕ Creating user:', newUser.name);
      const result = await users.create(newUser);

      console.log('✅ User created:', result.id);
      setNewUser({ name: '', email: '', password: 'changeme123', role: 'cashier' });
      setShowAddUser(false);

      // Reload data to show new user
      await loadUsers();
      await loadOverview();
      alert(`✅ User "${result.name}" created successfully! Login: ${result.email} / changeme123`);
    } catch (error) {
      console.error('❌ Failed to create user:', error);
      alert(`❌ Failed to create user: ${error.message || 'Unknown error'}`);
    }
  };

  const filteredProducts = data.products.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'inventory', label: 'Inventory', icon: Layers },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'sales', label: 'Sales', icon: ShoppingBag },
    { id: 'expenses', label: 'Expenses', icon: TrendingDown },
    { id: 'stock-deductions', label: 'Stock Log', icon: Package }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Admin Dashboard</h1>
            <p className="text-xs text-gray-500 mt-0.5">Professional Plan - KSH 1,600/month • Live Updates Every 5s {lastUpdateTime && `• Last: ${lastUpdateTime}`}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button onClick={logout} className="btn-secondary flex items-center gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-100 mb-1">Total Sales</p>
                <p className="text-3xl font-bold">KSH {data.stats.totalSales?.toLocaleString() || 0}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-8 h-8" />
              </div>
            </div>
          </div>
          
          <div className="card bg-gradient-to-br from-red-500 to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-100 mb-1">Expenses</p>
                <p className="text-3xl font-bold">KSH {data.stats.totalExpenses?.toLocaleString() || 0}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <TrendingDown className="w-8 h-8" />
              </div>
            </div>
          </div>
          
          <div className="card bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100 mb-1">Net Profit</p>
                <p className="text-3xl font-bold">KSH {data.stats.profit?.toLocaleString() || 0}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-8 h-8" />
              </div>
            </div>
          </div>
          
          <div className="card bg-gradient-to-br from-purple-500 to-violet-600 text-white border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-100 mb-1">Products</p>
                <p className="text-3xl font-bold">{data.stats.productsCount ?? data.products.length}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <Package className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-lg">
          <div className="flex gap-2 border-b border-gray-200 mb-6 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-blue-600" />
                  Recent Sales
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Items</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Stock Deducted</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Payment</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sales.slice(-10).reverse().map((sale, i) => {
                        const deductionsSummary = sale.stockDeductions?.products
                          ?.slice(0, 2)
                          .map(p => `${p.name}: -${p.deducted}${p.unit}`)
                          .join(', ') + (sale.stockDeductions?.products?.length > 2 ? '...' : '') || 'None';
                        
                        return (
                          <tr key={i} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-sm">{new Date(sale.created_at || sale.createdAt).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-sm">{sale.items?.length || 0} items</td>
                            <td className="px-4 py-3 text-sm text-orange-600 font-semibold">{deductionsSummary}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="badge badge-success">{sale.payment_method || sale.paymentMethod || 'cash'}</span>
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-green-600">KSH {sale.total?.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      className="input pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <button 
                  onClick={() => {
                    try {
                      console.log('🛒 Add Product button clicked');
                      setShowAddProduct(true);
                    } catch (err) {
                      console.error('❌ Button handler error:', err);
                      alert(`Error: ${err.message}`);
                    }
                  }} 
                  className="btn-primary flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </button>
              </div>

              {showAddProduct && (
                <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
                  <h4 className="font-semibold mb-4 text-lg">Add New Product</h4>
                  <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Product Name *"
                      className="input"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Selling Price *"
                      className="input"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      step="0.01"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Cost Price"
                      className="input"
                      value={newProduct.cost}
                      onChange={(e) => setNewProduct({ ...newProduct, cost: e.target.value })}
                      step="0.01"
                    />
                    <select
                      className="input"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    >
                      <option value="finished">Finished Good</option>
                      <option value="raw">Raw Material</option>
                      <option value="semi-finished">Semi-Finished</option>
                    </select>
                    <select
                      className="input"
                      value={newProduct.unit}
                      onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    >
                      <option value="pcs">Pieces</option>
                      <option value="kg">Kilograms</option>
                      <option value="liters">Liters</option>
                      <option value="grams">Grams</option>
                      <option value="ml">Milliliters</option>
                    </select>
                    <div className="flex gap-2">
                      <button type="submit" className="btn-primary flex-1">Add Product</button>
                      <button type="button" onClick={() => setShowAddProduct(false)} className="btn-secondary">Cancel</button>
                    </div>
                  </form>
                  <p className="text-xs text-gray-600 mt-2">Note: Stock is added separately via Batches. Fields marked with * are required.</p>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Product Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Stock</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      (() => {
                        const isComposite = Array.isArray(product.recipe) && product.recipe.length > 0;
                        return (
                      <tr key={product.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium">{product.name}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-blue-600">KSH {product.price?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`font-medium ${product.quantity < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                            {product.quantity || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`badge ${isComposite ? 'badge-success' : 'badge-warning'}`}>
                            {isComposite ? 'Composite' : 'Raw'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`badge ${product.quantity > 10 ? 'badge-success' : product.quantity > 0 ? 'badge-warning' : 'badge-danger'}`}>
                            {product.quantity > 10 ? 'In Stock' : product.quantity > 0 ? 'Low Stock' : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                        );
                      })()
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">User Management</h3>
                <button onClick={() => setShowAddUser(true)} className="btn-primary flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add User
                </button>
              </div>

              {showAddUser && (
                <div className="mb-6 p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border-2 border-green-200">
                  <h4 className="font-semibold mb-4 text-lg">Add New User</h4>
                  <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      className="input"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      className="input"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      required
                    />
                    <select
                      className="input"
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    >
                      <option value="cashier">Cashier</option>
                      <option value="admin">Admin</option>
                    </select>
                    <div className="flex gap-2">
                      <button type="submit" className="btn-primary flex-1">Add User</button>
                      <button type="button" onClick={() => setShowAddUser(false)} className="btn-secondary">Cancel</button>
                    </div>
                  </form>
                  <p className="text-xs text-gray-600 mt-2">Default password: changeme123</p>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">PIN</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Created</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.map((user) => (
                      <tr key={user.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium">{user.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`badge ${user.role === 'admin' ? 'badge-success' : 'badge-warning'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`font-mono text-xs ${user.pin ? 'text-blue-600' : 'text-gray-400'}`}>
                            {user.pin || 'Not Set'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`badge ${user.active ? 'badge-success' : 'badge-danger'}`}>
                            {user.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(user.created_at || user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => {
                              const newPin = prompt('Enter 4-digit PIN for ' + user.name + ':', user.pin || '');
                              if (newPin && /^\d{4}$/.test(newPin)) {
                                users.update(user.id, { pin: newPin })
                                  .then(() => {
                                    alert('PIN updated successfully!');
                                    loadData();
                                  })
                                  .catch(err => alert('Failed to update PIN: ' + err.message));
                              } else if (newPin !== null) {
                                alert('PIN must be exactly 4 digits');
                              }
                            }}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Set PIN
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'sales' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">All Sales</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date & Time</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Items</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Stock Deducted</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Payment Method</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sales.slice().reverse().map((sale, i) => {
                      const deductionsSummary = sale.stockDeductions?.products
                        ?.map(p => `${p.name}: -${p.deducted}${p.unit}`)
                        .join(', ') || 'None';
                      
                      return (
                        <tr key={i} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium">{new Date(sale.created_at || sale.createdAt).toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm">{sale.items?.length || 0} items</td>
                          <td className="px-4 py-3 text-sm text-orange-600 font-semibold text-xs">{deductionsSummary}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="badge badge-success">{sale.payment_method || sale.paymentMethod || 'cash'}</span>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-green-600">KSH {sale.total?.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">All Expenses</h3>
                <button className="btn-primary flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Expense
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.expenses.slice().reverse().map((expense, i) => (
                      <tr key={i} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm">{new Date(expense.created_at || expense.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm">{expense.description}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="badge badge-warning">{expense.category || 'General'}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-red-600">KSH {expense.amount?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'stock-deductions' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Stock Deductions Log</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-orange-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Sale ID</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Time</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Product</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Before</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Deducted</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">After</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sales && data.sales.slice().reverse().map((sale) => 
                      sale.stockDeductions?.products?.map((deduction, idx) => (
                        <tr key={`${sale.id}-${idx}`} className="border-t border-orange-100 hover:bg-orange-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-blue-600">#{sale.id}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{new Date(sale.created_at || sale.createdAt).toLocaleString()}</td>
                          <td className="px-4 py-3">{deduction.name}</td>
                          <td className="px-4 py-3 text-gray-600">{deduction.before}</td>
                          <td className="px-4 py-3 font-semibold text-red-600">-{deduction.deducted}</td>
                          <td className="px-4 py-3 font-semibold text-green-600">{deduction.after}</td>
                          <td className="px-4 py-3 text-gray-600">{deduction.unit}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {(!data.sales || data.sales.length === 0 || !data.sales.some(s => s.stockDeductions?.products?.length > 0)) && (
                  <div className="p-4 text-center text-gray-500">No stock deductions recorded yet</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
*/
