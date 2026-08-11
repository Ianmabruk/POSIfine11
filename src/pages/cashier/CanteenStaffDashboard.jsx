import { useState, useEffect } from 'react';
import { ShoppingCart, Package, X, Plus, Minus, DollarSign, CheckCircle, Search } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function CanteenStaffDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selling, setSelling] = useState(false);
  const [saleSuccess, setSaleSuccess] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.get('/products');
      const visible = Array.isArray(data) ? data.filter(p => p.visible_to_cashier !== false && p.quantity > 0) : [];
      setProducts(visible);
    } catch (e) {
      setError(e.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase());
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
        amount_paid: cartTotal,
        amountPaid: cartTotal,
        tax_rate: 0,
        discount_amount: 0
      });
      setCart([]);
      setSaleSuccess(true);
      loadProducts();
      setTimeout(() => setSaleSuccess(false), 2500);
    } catch (e) {
      setError(e.message || 'Sale failed');
    } finally {
      setSelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Canteen POS</h1>
            <p className="text-green-200 text-sm mt-0.5">{user?.name || 'Staff'} · {new Date().toLocaleDateString()}</p>
          </div>
          <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
            <p className="text-xl font-bold">KSH {cartTotal.toLocaleString()}</p>
            <p className="text-xs text-green-200">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-4 py-4 flex gap-4 flex-1">
        {/* Products panel */}
        <div className="flex-1 min-w-0">
          {/* Search & category filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex-1 relative min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    category === cat ? 'bg-green-600 text-white' : 'bg-white border text-gray-600 hover:border-green-400'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          {/* Product grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map(product => {
              const inCart = cart.find(i => i.id === product.id);
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.quantity <= 0}
                  className={`bg-white rounded-xl p-4 shadow-sm border text-left hover:border-green-400 hover:shadow-md transition-all relative ${
                    inCart ? 'border-green-400 ring-2 ring-green-200' : 'border-gray-200'
                  } ${product.quantity <= 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  {inCart && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {inCart.qty}
                    </div>
                  )}
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3">
                    <Package className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="font-medium text-gray-800 text-sm leading-tight">{product.name}</p>
                  <p className="text-green-600 font-bold mt-1">KSH {Number(product.price).toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Stock: {product.quantity}</p>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                No products found
              </div>
            )}
          </div>
        </div>

        {/* Cart panel */}
        <div className="w-72 shrink-0 hidden sm:flex flex-col">
          <div className="bg-white rounded-xl border shadow-sm flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-green-600" /> Cart
              </h3>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-xs text-red-500 hover:underline">Clear</button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {cart.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-8">Cart is empty</p>
              )}
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">KSH {Number(item.price).toLocaleString()} each</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-full bg-gray-200 hover:bg-red-100 flex items-center justify-center">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-bold w-5 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-full bg-gray-200 hover:bg-green-100 flex items-center justify-center">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gray-600">Total</span>
                <span className="font-bold text-gray-900">KSH {cartTotal.toLocaleString()}</span>
              </div>

              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="credit">Credit</option>
              </select>

              <button
                onClick={handleSell}
                disabled={!cart.length || selling}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {selling ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : saleSuccess ? (
                  <><CheckCircle className="w-4 h-4" /> Sold!</>
                ) : (
                  <><DollarSign className="w-4 h-4" /> Complete Sale</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile cart button */}
      {cart.length > 0 && (
        <div className="sm:hidden fixed bottom-4 inset-x-4">
          <button
            onClick={handleSell}
            disabled={selling}
            className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-between px-6 disabled:opacity-50"
          >
            <span>{cart.length} item{cart.length !== 1 ? 's' : ''}</span>
            <span>KSH {cartTotal.toLocaleString()} · Sell</span>
          </button>
        </div>
      )}
    </div>
  );
}
