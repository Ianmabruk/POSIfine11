import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { products, sales, expenses, stats } from '../services/api';
import { Package, DollarSign, TrendingUp, TrendingDown, Plus, Edit2, Trash2, LogOut, Search, Filter, BarChart3, ShoppingBag, Layers } from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [data, setData] = useState({ products: [], sales: [], expenses: [], stats: {} });
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', price: '', quantity: '', category: 'raw' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [p, s, e, st] = await Promise.all([
        products.getAll(),
        sales.getAll(),
        expenses.getAll(),
        stats.get()
      ]);
      
      // Ensure we have valid data structures
      setData({ 
        products: Array.isArray(p) ? p : [], 
        sales: Array.isArray(s) ? s : [], 
        expenses: Array.isArray(e) ? e : [], 
        stats: st || {} 
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      // Set empty data on error
      setData({ products: [], sales: [], expenses: [], stats: {} });
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    await products.create({ ...newProduct, price: parseFloat(newProduct.price), quantity: parseInt(newProduct.quantity) });
    setNewProduct({ name: '', price: '', quantity: '', category: 'raw' });
    setShowAddProduct(false);
    loadData();
  };

  const filteredProducts = data.products.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'inventory', label: 'Inventory', icon: Layers },
    { id: 'sales', label: 'Sales', icon: ShoppingBag },
    { id: 'expenses', label: 'Expenses', icon: TrendingDown }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Admin Dashboard</h1>
            <p className="text-xs text-gray-500 mt-0.5">Professional Plan - KSH 1,600/month</p>
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
                <p className="text-3xl font-bold">{data.products.length}</p>
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
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Payment</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sales.slice(-10).reverse().map((sale, i) => (
                        <tr key={i} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm">{new Date(sale.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-sm">{sale.items?.length || 0} items</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="badge badge-success">{sale.paymentMethod || 'cash'}</span>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-green-600">KSH {sale.total?.toLocaleString()}</td>
                        </tr>
                      ))}
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
                <button onClick={() => setShowAddProduct(true)} className="btn-primary flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Plus className="w-4 h-4" />
                  Add Product
                </button>
              </div>

              {showAddProduct && (
                <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
                  <h4 className="font-semibold mb-4 text-lg">Add New Product</h4>
                  <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                      type="text"
                      placeholder="Product Name"
                      className="input"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      className="input"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Quantity"
                      className="input"
                      value={newProduct.quantity}
                      onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                      required
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="btn-primary flex-1">Add</button>
                      <button type="button" onClick={() => setShowAddProduct(false)} className="btn-secondary">Cancel</button>
                    </div>
                  </form>
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
                      <tr key={product.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium">{product.name}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-blue-600">KSH {product.price?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`font-medium ${product.quantity < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                            {product.quantity || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`badge ${product.recipe ? 'badge-success' : 'badge-warning'}`}>
                            {product.recipe ? 'Composite' : 'Raw'}
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
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Payment Method</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sales.slice().reverse().map((sale, i) => (
                      <tr key={i} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm">{new Date(sale.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm">{sale.items?.length || 0} items</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="badge badge-success">{sale.paymentMethod || 'cash'}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">KSH {sale.total?.toLocaleString()}</td>
                      </tr>
                    ))}
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
                        <td className="px-4 py-3 text-sm">{new Date(expense.createdAt).toLocaleDateString()}</td>
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
        </div>
      </div>
    </div>
  );
}
