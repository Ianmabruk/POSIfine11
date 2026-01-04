import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { products, sales, expenses, stats } from '../services/api';
import { ShoppingCart, Trash2, LogOut, Plus, Minus, DollarSign, TrendingDown, Package, Edit2, Search, BarChart3 } from 'lucide-react';

export default function CashierPOS() {
  const { user, logout } = useAuth();
  const [productList, setProductList] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [activeView, setActiveView] = useState('pos');
  const [data, setData] = useState({ sales: [], expenses: [], stats: {} });
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', quantity: '' });
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [p, s, e, st] = await Promise.all([
      products.getAll(),
      sales.getAll(),
      expenses.getAll(),
      stats.get()
    ]);
    setProductList(p.filter(prod => prod.visibleToCashier !== false && !prod.expenseOnly));
    setData({ sales: s, expenses: e, stats: st });
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    await sales.create({
      items: cart.map(item => ({ productId: item.id, quantity: item.quantity, price: item.price })),
      total,
      paymentMethod
    });
    
    setCart([]);
    loadData();
    alert('Sale completed successfully!');
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    await products.create({ ...newProduct, price: parseFloat(newProduct.price), quantity: parseInt(newProduct.quantity) });
    setNewProduct({ name: '', price: '', quantity: '' });
    setShowAddProduct(false);
    loadData();
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    await expenses.create({ ...newExpense, amount: parseFloat(newExpense.amount) });
    setNewExpense({ description: '', amount: '', category: '' });
    setShowAddExpense(false);
    loadData();
  };

  const filteredProducts = productList.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">Cashier Dashboard</h1>
            <p className="text-xs text-gray-500 mt-0.5">Cashier Plan - KSH 900/month</p>
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

      <div className="flex gap-2 px-6 py-4 bg-white border-b border-gray-200">
        <button
          onClick={() => setActiveView('pos')}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            activeView === 'pos' ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <ShoppingCart className="w-4 h-4 inline mr-2" />
          POS
        </button>
        <button
          onClick={() => setActiveView('monitor')}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            activeView === 'monitor' ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          Monitor
        </button>
        <button
          onClick={() => setActiveView('products')}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            activeView === 'products' ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          Products
        </button>
        <button
          onClick={() => setActiveView('expenses')}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            activeView === 'expenses' ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <TrendingDown className="w-4 h-4 inline mr-2" />
          Expenses
        </button>
      </div>

      {activeView === 'pos' && (
        <div className="flex-1 flex">
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="mb-6">
              <div className="relative max-w-md">
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="card text-left hover:shadow-xl transition-all transform hover:scale-105 bg-gradient-to-br from-white to-gray-50"
                >
                  <h3 className="font-semibold mb-2 text-gray-900">{product.name}</h3>
                  <p className="text-xl font-bold text-green-600">KSH {product.price?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-2">Stock: {product.quantity || 0}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="w-96 bg-white border-l border-gray-200 p-6 flex flex-col shadow-xl">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-teal-600 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold">Cart</h2>
              <span className="ml-auto bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">{cart.length} items</span>
            </div>

            <div className="flex-1 overflow-y-auto mb-6">
              {cart.length === 0 ? (
                <div className="text-center mt-16">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-400">Cart is empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-gray-900">{item.name}</h4>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-600 hover:bg-red-50 p-1 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center font-semibold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="font-bold text-green-600">KSH {(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-4">
              <div className="flex justify-between text-xl font-bold">
                <span>Total:</span>
                <span className="text-green-600">KSH {total.toLocaleString()}</span>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Payment Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="input">
                  <option value="cash">Cash</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="card">Card</option>
                </select>
              </div>

              <button onClick={handleCheckout} disabled={cart.length === 0} className="btn-primary w-full py-4 text-lg bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 shadow-lg">
                Complete Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {activeView === 'monitor' && (
        <div className="p-6 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg">
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
            
            <div className="card bg-gradient-to-br from-red-500 to-pink-600 text-white border-0 shadow-lg">
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
            
            <div className="card bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-100 mb-1">Net Profit</p>
                  <p className="text-3xl font-bold">KSH {data.stats.profit?.toLocaleString() || 0}</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <DollarSign className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Recent Sales</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date & Time</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Items</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Payment</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sales.slice(-15).reverse().map((sale, i) => (
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
        </div>
      )}

      {activeView === 'products' && (
        <div className="p-6 max-w-7xl mx-auto w-full">
          <div className="card shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Manage Products</h3>
              <button onClick={() => setShowAddProduct(true)} className="btn-primary flex items-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700">
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>

            {showAddProduct && (
              <div className="mb-6 p-6 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border-2 border-green-200">
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
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Product Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Stock</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productList.map((product) => (
                    <tr key={product.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium">{product.name}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">KSH {product.price?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`font-medium ${product.quantity < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                          {product.quantity || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button className="p-2 hover:bg-green-50 rounded-lg text-green-600 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeView === 'expenses' && (
        <div className="p-6 max-w-7xl mx-auto w-full">
          <div className="card shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Track Expenses</h3>
              <button onClick={() => setShowAddExpense(true)} className="btn-primary flex items-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700">
                <Plus className="w-4 h-4" />
                Add Expense
              </button>
            </div>

            {showAddExpense && (
              <div className="mb-6 p-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border-2 border-red-200">
                <h4 className="font-semibold mb-4 text-lg">Add New Expense</h4>
                <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input
                    type="text"
                    placeholder="Description"
                    className="input"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    className="input"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Category"
                    className="input"
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary flex-1">Add</button>
                    <button type="button" onClick={() => setShowAddExpense(false)} className="btn-secondary">Cancel</button>
                  </div>
                </form>
              </div>
            )}

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
        </div>
      )}
    </div>
  );
}
