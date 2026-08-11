/**
 * ShopStaffDashboard — Reusable POS dashboard for any shop-type business
 * Used for: Uniform shop, Bookshop, Pharmacy counter, Kiosk, etc.
 * Props:
 *   businessLabel  – display name e.g. "Uniform Shop"
 *   accentColor    – tailwind base color e.g. "purple" | "blue" | "orange"
 */
import { useState, useEffect } from 'react';
import { ShoppingCart, Package, Plus, Minus, DollarSign, CheckCircle, Search, BarChart2, History } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const COLORS = {
  purple: { header: 'from-purple-700 to-indigo-700', btn: 'bg-purple-600 hover:bg-purple-700', ring: 'ring-purple-200 border-purple-400', badge: 'bg-purple-500', tag: 'bg-purple-50 text-purple-700' },
  blue:   { header: 'from-blue-700 to-cyan-700',    btn: 'bg-blue-600 hover:bg-blue-700',     ring: 'ring-blue-200 border-blue-400',     badge: 'bg-blue-500',   tag: 'bg-blue-50 text-blue-700' },
  orange: { header: 'from-orange-600 to-amber-600', btn: 'bg-orange-600 hover:bg-orange-700', ring: 'ring-orange-200 border-orange-400', badge: 'bg-orange-500', tag: 'bg-orange-50 text-orange-700' },
  green:  { header: 'from-green-600 to-emerald-600', btn: 'bg-green-600 hover:bg-green-700',  ring: 'ring-green-200 border-green-400',   badge: 'bg-green-500',  tag: 'bg-green-50 text-green-700' },
};

export default function ShopStaffDashboard({ businessLabel = 'Shop', accentColor = 'purple' }) {
  const { user } = useAuth();
  const c = COLORS[accentColor] || COLORS.purple;

  const [activeTab, setActiveTab] = useState('sell');
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selling, setSelling] = useState(false);
  const [saleSuccess, setSaleSuccess] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountTendered, setAmountTendered] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [prods, saleData] = await Promise.allSettled([
        api.get('/products'),
        api.get('/sales'),
      ]);
      const allProds = prods.status === 'fulfilled' && Array.isArray(prods.value) ? prods.value : [];
      setProducts(allProds.filter(p => p.visible_to_cashier !== false && p.quantity > 0));
      setSales(saleData.status === 'fulfilled' && Array.isArray(saleData.value) ? saleData.value : []);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search);
    const matchCat = category === 'all' || p.category === category;
    return matchSearch && matchCat;
  });

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        if (existing.qty >= product.quantity) return prev;
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.flatMap(i => {
      if (i.id !== id) return [i];
      const newQty = i.qty + delta;
      return newQty <= 0 ? [] : [{ ...i, qty: newQty }];
    }));
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const change = Math.max(0, Number(amountTendered || 0) - cartTotal);

  const handleSell = async () => {
    if (!cart.length) return;
    setSelling(true);
    setError('');
    try {
      await api.post('/sales', {
        items: cart.map(i => ({
          product_id: i.id,
          productId: i.id,
          name: i.name,
          quantity: i.qty,
          price: i.price,
          cost: i.cost || i.cost_per_unit || 0,
          total: i.price * i.qty
        })),
        payment_method: paymentMethod,
        paymentMethod: paymentMethod,
        amount_paid: Number(amountTendered || cartTotal),
        amountPaid: Number(amountTendered || cartTotal),
        tax_rate: 0,
        discount_amount: 0
      });
      setCart([]);
      setAmountTendered('');
      setSaleSuccess(true);
      loadAll();
      setTimeout(() => setSaleSuccess(false), 2500);
    } catch (e) {
      setError(e.message || 'Sale failed');
    } finally {
      setSelling(false);
    }
  };

  const todaySales = sales.filter(s => s.created_at?.slice(0, 10) === new Date().toISOString().slice(0, 10));
  const todayRevenue = todaySales.reduce((s, sale) => s + Number(sale.total || sale.total_amount || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className={`animate-spin w-10 h-10 border-4 border-t-transparent rounded-full border-purple-500`} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className={`bg-gradient-to-r ${c.header} text-white px-6 py-5`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{businessLabel} POS</h1>
            <p className="text-white/70 text-sm mt-0.5">{user?.name || 'Staff'} · {new Date().toLocaleDateString()}</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
              <p className="text-lg font-bold">KSH {todayRevenue.toLocaleString()}</p>
              <p className="text-xs text-white/70">Today Revenue</p>
            </div>
            <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
              <p className="text-lg font-bold">{todaySales.length}</p>
              <p className="text-xs text-white/70">Sales</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto flex">
          {[
            { id: 'sell', label: 'Sell', icon: ShoppingCart },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'history', label: 'Sales History', icon: History },
            { id: 'summary', label: 'Summary', icon: BarChart2 },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-4 py-4 flex gap-4 flex-1">
        {error && (
          <div className="fixed top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm z-50">{error}</div>
        )}

        {/* SELL TAB */}
        {activeTab === 'sell' && (
          <>
            {/* Products */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="flex-1 relative min-w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="Search or scan barcode..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-1 flex-wrap">
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setCategory(cat)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${category === cat ? `${c.btn} text-white` : 'bg-white border text-gray-600'}`}>
                      {cat === 'all' ? 'All' : cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filtered.map(product => {
                  const inCart = cart.find(i => i.id === product.id);
                  return (
                    <button key={product.id} onClick={() => addToCart(product)}
                      disabled={product.quantity <= 0}
                      className={`bg-white rounded-xl p-4 shadow-sm border text-left hover:shadow-md transition-all relative ${
                        inCart ? `${c.ring} ring-2` : 'border-gray-200'
                      } ${product.quantity <= 0 ? 'opacity-40 cursor-not-allowed' : ''}`}>
                      {inCart && (
                        <div className={`absolute top-2 right-2 ${c.badge} text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold`}>
                          {inCart.qty}
                        </div>
                      )}
                      <div className={`w-10 h-10 ${c.tag} rounded-lg flex items-center justify-center mb-3`}>
                        <Package className="w-5 h-5" />
                      </div>
                      <p className="font-medium text-gray-800 text-sm leading-tight">{product.name}</p>
                      <p className="text-purple-600 font-bold mt-1">KSH {Number(product.price).toLocaleString()}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Stock: {product.quantity}</p>
                    </button>
                  );
                })}
                {filtered.length === 0 && <div className="col-span-full text-center py-12 text-gray-400">No products found</div>}
              </div>
            </div>

            {/* Cart */}
            <div className="w-72 shrink-0 hidden sm:flex flex-col">
              <div className="bg-white rounded-xl border shadow-sm flex-1 flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-purple-600" /> Cart
                  </h3>
                  {cart.length > 0 && <button onClick={() => { setCart([]); setAmountTendered(''); }} className="text-xs text-red-500 hover:underline">Clear</button>}
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {cart.length === 0 && <p className="text-gray-400 text-sm text-center py-8">Cart is empty</p>}
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">KSH {Number(item.price).toLocaleString()} × {item.qty} = <span className="font-medium">KSH {(item.price * item.qty).toLocaleString()}</span></p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-full bg-gray-200 hover:bg-red-100 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                        <span className="text-sm font-bold w-5 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-full bg-gray-200 hover:bg-green-100 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t space-y-3">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Total</span><span>KSH {cartTotal.toLocaleString()}</span>
                  </div>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="credit">Credit</option>
                  </select>
                  {paymentMethod === 'cash' && (
                    <div>
                      <input
                        type="number"
                        placeholder="Amount tendered"
                        value={amountTendered}
                        onChange={e => setAmountTendered(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                      {Number(amountTendered) > 0 && (
                        <p className={`text-xs mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Change: KSH {change.toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                  <button onClick={handleSell} disabled={!cart.length || selling}
                    className={`w-full ${c.btn} text-white font-bold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors`}>
                    {selling ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                     : saleSuccess ? <><CheckCircle className="w-4 h-4" /> Done!</>
                     : <><DollarSign className="w-4 h-4" /> Complete Sale</>}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">All Products</h2>
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <>
                <div className="md:hidden space-y-3 p-4">
                  {products.map((p, i) => (
                    <div key={i} className="bg-white rounded-xl shadow p-4 space-y-2 border border-gray-100">
                      <div className="font-medium text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.category || '--'}</div>
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                        <span className="text-gray-600">Price</span>
                        <span className="font-medium text-gray-900">KSH {Number(p.price).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">In Stock</span>
                        <span className={`font-bold ${p.quantity <= 5 ? 'text-red-600' : 'text-green-600'}`}>{p.quantity}</span>
                      </div>
                    </div>
                  ))}
                  {products.length === 0 && <div className="text-center text-gray-400 py-4">No products found</div>}
                </div>
                <div className="hidden md:block">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Product</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Category</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Price</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">In Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p, i) => (
                        <tr key={i} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                          <td className="px-4 py-3 text-gray-500">{p.category || '--'}</td>
                          <td className="px-4 py-3 text-right text-gray-800">KSH {Number(p.price).toLocaleString()}</td>
                          <td className={`px-4 py-3 text-right font-bold ${p.quantity <= 5 ? 'text-red-600' : 'text-green-600'}`}>
                            {p.quantity}
                          </td>
                        </tr>
                      ))}
                      {products.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No products found</td></tr>}
                    </tbody>
                  </table>
                </div>
              </>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales History</h2>
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <>
                <div className="md:hidden space-y-3 p-4">
                  {sales.slice(0, 50).map((s, i) => (
                    <div key={i} className="bg-white rounded-xl shadow p-4 space-y-2 border border-gray-100">
                      <div className="text-sm font-medium text-gray-900">{s.created_at?.slice(0, 16).replace('T', ' ') || '--'}</div>
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                        <span className="text-gray-600">Items</span>
                        <span className="text-gray-900">{s.items?.length || 1} item{(s.items?.length || 1) !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Method</span>
                        <span className="text-gray-900 capitalize">{s.payment_method || s.paymentMethod || '--'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total</span>
                        <span className="font-medium text-gray-900">KSH {Number(s.total || s.total_amount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                  {sales.length === 0 && <div className="text-center text-gray-400 py-4">No sales yet</div>}
                </div>
                <div className="hidden md:block">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Items</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Method</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.slice(0, 50).map((s, i) => (
                        <tr key={i} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-600">{s.created_at?.slice(0, 16).replace('T', ' ') || '--'}</td>
                          <td className="px-4 py-3 text-gray-600">{s.items?.length || 1} item{(s.items?.length || 1) !== 1 ? 's' : ''}</td>
                          <td className="px-4 py-3 capitalize text-gray-600">{s.payment_method || s.paymentMethod || '--'}</td>
                          <td className="px-4 py-3 text-right font-medium">KSH {Number(s.total || s.total_amount || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                      {sales.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No sales yet</td></tr>}
                    </tbody>
                  </table>
                </div>
              </>
            </div>
          </div>
        )}

        {/* SUMMARY TAB */}
        {activeTab === 'summary' && (
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Summary</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Today's Sales", value: todaySales.length, suffix: '' },
                { label: "Today's Revenue", value: `KSH ${todayRevenue.toLocaleString()}`, suffix: '' },
                { label: 'Total Products', value: products.length, suffix: '' },
                { label: 'Low Stock (<5)', value: products.filter(p => p.quantity <= 5).length, suffix: '' },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-xl border p-5 shadow-sm text-center">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
            {products.filter(p => p.quantity <= 5).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h3 className="font-semibold text-red-700 mb-2">Low Stock Alert</h3>
                <div className="space-y-1">
                  {products.filter(p => p.quantity <= 5).map((p, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-red-700">{p.name}</span>
                      <span className="font-bold text-red-600">{p.quantity} left</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile sell button */}
      {activeTab === 'sell' && cart.length > 0 && (
        <div className="sm:hidden fixed bottom-4 inset-x-4">
          <button onClick={handleSell} disabled={selling}
            className={`w-full ${c.btn} text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-between px-6 disabled:opacity-50`}>
            <span>{cart.length} item{cart.length !== 1 ? 's' : ''}</span>
            <span>KSH {cartTotal.toLocaleString()} · Sell</span>
          </button>
        </div>
      )}
    </div>
  );
}
