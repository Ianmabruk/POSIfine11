import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { products, sales, expenses, stats, batches, subscribeProducts, unsubscribeAllProductSubscriptions } from '../services/api';
import websocketService from '../services/websocketService';
import { BASE_API_URL } from '../services/api';
import { ShoppingCart, Trash2, LogOut, Plus, Minus, DollarSign, TrendingDown, Package, Edit2, Search, BarChart3, Camera, Upload, AlertTriangle, Clock, Play, Square } from 'lucide-react';

export default function CashierPOS() {
  const { user, logout } = useAuth();
  const [productList, setProductList] = useState([]);
  const [batchList, setBatchList] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [activeView, setActiveView] = useState('pos');
  const [data, setData] = useState({ sales: [], expenses: [], stats: {} });
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddStock, setShowAddStock] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', cost: '', category: 'finished', image: '' });
  const [newStock, setNewStock] = useState({ quantity: '', expiryDate: '', batchNumber: '', cost: '' });
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: '' });
  const [imagePreview, setImagePreview] = useState('');
  const [discountList, setDiscountList] = useState([]);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [taxType, setTaxType] = useState('exclusive');
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentTimeEntry, setCurrentTimeEntry] = useState(null);
  const [clockedInTime, setClockedInTime] = useState(null);

  useEffect(() => {
    loadData();
    // Restore session data from localStorage
    const savedCart = localStorage.getItem(`cart_${user?.id}`);
    const savedPaymentMethod = localStorage.getItem(`paymentMethod_${user?.id}`);
    const savedDiscount = localStorage.getItem(`selectedDiscount_${user?.id}`);
    const savedTaxType = localStorage.getItem(`taxType_${user?.id}`);
    const savedClockStatus = localStorage.getItem(`clockStatus_${user?.id}`);
    const savedClockInTime = localStorage.getItem(`clockInTime_${user?.id}`);
    
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.warn('Failed to restore cart:', e);
      }
    }
    
    if (savedPaymentMethod) setPaymentMethod(savedPaymentMethod);
    if (savedTaxType) setTaxType(savedTaxType);
    
    if (savedDiscount) {
      try {
        setSelectedDiscount(JSON.parse(savedDiscount));
      } catch (e) {}
    }
    
    if (savedClockStatus === 'clocked_in') {
      setIsClockedIn(true);
      if (savedClockInTime) {
        setClockedInTime(new Date(savedClockInTime));
      }
    }
    
    // Check actual clock status from backend
    checkClockStatus();
  }, [user?.id]);

  // Subscribe to real-time product updates
  useEffect(() => {
    // Connect to WebSocket for real-time stock updates
    const token = localStorage.getItem('token');
    if (token) {
      websocketService.connect(token, (data) => {
        // When stock update received, reload products to show new stock
        if (data && data.allProducts) {
          const filtered = data.allProducts.filter(p => p.visibleToCashier !== false && !p.expenseOnly);
          setProductList(filtered);
        }
        // When discounts updated, refresh discount list
        if (data && data.discounts) {
          setDiscountList(data.discounts);
        }
        // When new sale created, reload data to show updated stats
        if (data && data.sale) {
          loadData();
        }
      }).catch((error) => {
        console.warn('WebSocket connection failed:', error);
      });
    }

    const unsub = subscribeProducts((msg) => {
      try {
        if (!msg) return;
        if (msg.type === 'initial' || msg.type === 'products_snapshot' || msg.type === 'product_created' || msg.type === 'product_updated' || msg.type === 'product_deleted') {
          products.getAll().then(p => setProductList(p.filter(prod => prod.visibleToCashier !== false && !prod.expenseOnly))).catch(() => {});
        }
      } catch (e) {
        console.error('Product subscription handler error', e);
      }
    });

    return () => {
      try { unsub(); } catch (e) {}
      websocketService.disconnect();
    };
  }, []);

  // Auto-save cart whenever it changes
  useEffect(() => {
    if (cart.length > 0 || paymentMethod || taxType) {
      saveSessionData();
    }
  }, [cart, paymentMethod, taxType, selectedDiscount, user?.id]);

  // Save session data to localStorage
  const saveSessionData = () => {
    localStorage.setItem(`cart_${user?.id}`, JSON.stringify(cart));
    localStorage.setItem(`paymentMethod_${user?.id}`, paymentMethod);
    localStorage.setItem(`taxType_${user?.id}`, taxType);
    if (selectedDiscount) {
      localStorage.setItem(`selectedDiscount_${user?.id}`, JSON.stringify(selectedDiscount));
    }
  };

  // Clock in function
  const handleClockIn = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/time-entries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'clock_in' })
      });
      
      if (response.ok) {
        const entry = await response.json();
        setCurrentTimeEntry(entry);
        setIsClockedIn(true);
        const now = new Date();
        setClockedInTime(now);
        localStorage.setItem(`clockStatus_${user?.id}`, 'clocked_in');
        localStorage.setItem(`clockInTime_${user?.id}`, now.toISOString());
        alert('Clocked in successfully!');
      }
    } catch (error) {
      console.error('Clock in failed:', error);
      alert('Failed to clock in');
    }
  };

  // Clock out function
  const handleClockOut = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/time-entries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'clock_out' })
      });
      
      if (response.ok) {
        const entry = await response.json();
        setCurrentTimeEntry(entry);
        setIsClockedIn(false);
        setClockedInTime(null);
        localStorage.removeItem(`clockStatus_${user?.id}`);
        localStorage.removeItem(`clockInTime_${user?.id}`);
        const hours = Math.floor(entry.duration / 60);
        const minutes = entry.duration % 60;
        alert(`Clocked out successfully! Total time: ${hours}h ${minutes}m`);
      }
    } catch (error) {
      console.error('Clock out failed:', error);
      alert('Failed to clock out');
    }
  };

  // Check clock status from backend
  const checkClockStatus = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/time-entries/today`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const entries = await response.json();
        const activeEntry = entries.find(e => e.cashierId === user?.id && e.status === 'clocked_in');
        
        if (activeEntry) {
          setCurrentTimeEntry(activeEntry);
          setIsClockedIn(true);
          setClockedInTime(new Date(activeEntry.clockInTime));
        }
      }
    } catch (error) {
      console.warn('Failed to check clock status:', error);
    }
  };

  const loadData = async () => {
    try {
      const [p, s, e, st, b] = await Promise.all([
        products.getAll(),
        sales.getAll(),
        expenses.getAll(),
        stats.get(),
        batches.getAll()
      ]);
      setProductList(p.filter(prod => prod.visibleToCashier !== false && !prod.expenseOnly));
      setData({ sales: s, expenses: e, stats: st });
      setBatchList(b);
      
      // Load discounts
      try {
        const discounts = await fetch(`${BASE_API_URL}/discounts`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(r => r.json());
        setDiscountList(discounts || []);
      } catch (err) {
        console.warn('Failed to load discounts:', err);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleImageUpload = (e, isNewProduct = true) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        setImagePreview(base64);
        if (isNewProduct) {
          setNewProduct({ ...newProduct, image: base64 });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getProductStock = (productId) => {
    const productBatches = batchList.filter(b => b.productId === productId && b.quantity > 0);
    return productBatches.reduce((total, batch) => total + batch.quantity, 0);
  };

  const getOldestBatch = (productId) => {
    const productBatches = batchList
      .filter(b => b.productId === productId && b.quantity > 0)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return productBatches[0] || null;
  };

  const addToCart = (product) => {
    const availableStock = getProductStock(product.id);
    if (availableStock <= 0) {
      alert('Product is out of stock!');
      return;
    }
    
    const existing = cart.find(item => item.id === product.id);
    const currentCartQty = existing ? existing.quantity : 0;
    
    if (currentCartQty >= availableStock) {
      alert(`Only ${availableStock} units available in stock!`);
      return;
    }
    
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, delta) => {
    const product = productList.find(p => p.id === id);
    const availableStock = getProductStock(id);
    
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty > availableStock) {
          alert(`Only ${availableStock} units available!`);
          return item;
        }
        return { ...item, quantity: Math.max(1, newQty) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    try {
      const discountValue = selectedDiscount 
        ? (selectedDiscount.type === 'percentage' ? (total * selectedDiscount.value / 100) : selectedDiscount.value)
        : 0;
      
      const tax = taxType === 'inclusive' 
        ? (total * 0.16)  // Kenya standard tax 16%
        : (total * 0.16);
      
      const finalTotal = taxType === 'inclusive'
        ? (total - discountValue)
        : (total - discountValue + tax);
      
      await sales.create({
        items: cart.map(item => ({ productId: item.id, quantity: item.quantity, price: item.price })),
        total: finalTotal,
        discount: discountValue,
        tax: tax,
        taxType: taxType,
        paymentMethod
      });
      
      setCart([]);
      setSelectedDiscount(null);
      setTaxType('exclusive');
      await loadData();
      alert('Sale completed successfully!');
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Sale failed. Please try again.');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await products.create({ 
        ...newProduct, 
        price: parseFloat(newProduct.price),
        cost: parseFloat(newProduct.cost || 0),
        quantity: 0 // Stock managed through batches
      });
      setNewProduct({ name: '', price: '', cost: '', category: 'finished', image: '' });
      setImagePreview('');
      setShowAddProduct(false);
      await loadData(); // Reload all data immediately
      alert('Product added successfully!');
    } catch (error) {
      console.error('Failed to add product:', error);
      alert('Failed to add product');
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      // Get current batch list to calculate new ID
      const currentBatches = Array.isArray(batchList) ? batchList : [];
      const newBatchId = currentBatches.length > 0 
        ? Math.max(...currentBatches.map(b => b.id || 0)) + 1 
        : 1;
      
      // OPTIMISTIC UPDATE: Show stock immediately
      const optimisticBatch = {
        id: newBatchId,
        productId: selectedProduct.id,
        quantity: parseInt(newStock.quantity),
        expiryDate: newStock.expiryDate,
        batchNumber: newStock.batchNumber || `BATCH-${Date.now()}`,
        cost: parseFloat(newStock.cost || selectedProduct.cost || 0)
      };
      
      setBatchList(prev => [...prev, optimisticBatch]);
      
      // Make API call in background
      await batches.create({
        productId: selectedProduct.id,
        quantity: parseInt(newStock.quantity),
        expiryDate: newStock.expiryDate,
        batchNumber: newStock.batchNumber || `BATCH-${Date.now()}`,
        cost: parseFloat(newStock.cost || selectedProduct.cost || 0)
      });
      
      setNewStock({ quantity: '', expiryDate: '', batchNumber: '', cost: '' });
      setShowAddStock(false);
      setSelectedProduct(null);
      await loadData(); // Refresh to sync with backend
      alert('Stock added successfully!');
    } catch (error) {
      console.error('Failed to add stock:', error);
      alert('Failed to add stock');
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await expenses.create({ ...newExpense, amount: parseFloat(newExpense.amount) });
      setNewExpense({ description: '', amount: '', category: '' });
      setShowAddExpense(false);
      await loadData(); // Reload all data immediately
    } catch (error) {
      console.error('Failed to add expense:', error);
      alert('Failed to add expense');
    }
  };

  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to clear all sales and expenses? This action cannot be undone.')) {
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
        
        // Clear local state
        setData({ sales: [], expenses: [], stats: { totalSales: 0, totalExpenses: 0, profit: 0 } });
        setCart([]);
        
        alert('Data cleared successfully!');
        await loadData();
      } catch (error) {
        console.error('Failed to clear data:', error);
        alert('Failed to clear data: ' + error.message);
      }
    }
  };

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
            {isClockedIn && (
              <div className="flex items-center gap-2">
                <p className="text-xs text-green-600 font-semibold">🟢 Clocked In</p>
                <button onClick={handleClockOut} className="px-4 py-2 rounded-lg font-medium transition-all bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 shadow-md">
                  <Square className="w-4 h-4" />
                  Clock Out
                </button>
              </div>
            )}
            {!isClockedIn && (
              <button onClick={handleClockIn} className="px-4 py-2 rounded-lg font-medium transition-all bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 shadow-md">
                <Play className="w-4 h-4" />
                Clock In
              </button>
            )}
            <button onClick={() => { saveSessionData(); logout(); }} className="px-4 py-2 rounded-lg font-medium transition-all bg-red-100 hover:bg-red-200 text-red-600 border border-red-300 flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
            <button onClick={handleClearData} className="px-4 py-2 rounded-lg font-medium transition-all bg-orange-100 hover:bg-orange-200 text-orange-600 border border-orange-300 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
            {isClockedIn && clockedInTime && (
              <div className="ml-auto text-right text-xs">
                <p className="text-green-600 font-semibold flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Clocked In: {clockedInTime.toLocaleTimeString()}
                </p>
              </div>
            )}
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
              {productList.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase())).map(product => {
                const stock = getProductStock(product.id);
                const isLowStock = stock < 10;
                const isOutOfStock = stock <= 0;
                
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={isOutOfStock}
                    className={`card text-left hover:shadow-xl transition-all transform hover:scale-105 relative ${
                      isOutOfStock ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'bg-gradient-to-br from-white to-gray-50'
                    }`}
                  >
                    {product.image && (
                      <div className="w-full h-32 mb-3 rounded-lg overflow-hidden bg-gray-100">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    {isLowStock && !isOutOfStock && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white p-1 rounded-full">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    )}
                    {isOutOfStock && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        OUT
                      </div>
                    )}
                    <h3 className="font-semibold mb-2 text-gray-900">{product.name}</h3>
                    <p className="text-xl font-bold text-green-600">KSH {product.price?.toLocaleString()}</p>
                    <div className="flex justify-between items-center mt-2">
                      <p className={`text-xs font-medium ${
                        isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-gray-500'
                      }`}>
                        Stock: {stock}
                      </p>
                      {isLowStock && !isOutOfStock && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                          Low Stock
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
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
              <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="text-gray-700">KSH {total.toLocaleString()}</span>
                </div>
                {selectedDiscount && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-KSH {(selectedDiscount.type === 'percentage' ? (total * selectedDiscount.value / 100) : selectedDiscount.value).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-orange-600">
                  <span>Tax ({taxType === 'exclusive' ? 'Added' : 'Included'}):</span>
                  <span>{taxType === 'exclusive' ? '+' : ''}KSH {((total - (selectedDiscount ? (selectedDiscount.type === 'percentage' ? (total * selectedDiscount.value / 100) : selectedDiscount.value) : 0)) * 0.16).toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>Final Total:</span>
                  <span className="text-green-600">
                    KSH {
                      (taxType === 'exclusive' 
                        ? (total - (selectedDiscount ? (selectedDiscount.type === 'percentage' ? (total * selectedDiscount.value / 100) : selectedDiscount.value) : 0) + ((total - (selectedDiscount ? (selectedDiscount.type === 'percentage' ? (total * selectedDiscount.value / 100) : selectedDiscount.value) : 0)) * 0.16))
                        : (total - (selectedDiscount ? (selectedDiscount.type === 'percentage' ? (total * selectedDiscount.value / 100) : selectedDiscount.value) : 0))
                      ).toLocaleString()
                    }
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Discount (Optional)</label>
                <select 
                  value={selectedDiscount?.id || ''} 
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDiscount(discountList.find(d => d.id === parseInt(e.target.value)));
                    } else {
                      setSelectedDiscount(null);
                    }
                  }} 
                  className="input"
                >
                  <option value="">No Discount</option>
                  {discountList.filter(d => d.active).map(discount => (
                    <option key={discount.id} value={discount.id}>
                      {discount.name} - {discount.type === 'percentage' ? `${discount.value}%` : `KSH ${discount.value}`}
                    </option>
                  ))}
                </select>
                {selectedDiscount && (
                  <p className="text-sm text-green-600 mt-1">
                    Discount: KSH {(selectedDiscount.type === 'percentage' ? (total * selectedDiscount.value / 100) : selectedDiscount.value).toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Tax Type</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="exclusive" checked={taxType === 'exclusive'} onChange={(e) => setTaxType(e.target.value)} />
                    <span className="text-sm">Tax Exclusive (16% added)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="inclusive" checked={taxType === 'inclusive'} onChange={(e) => setTaxType(e.target.value)} />
                    <span className="text-sm">Tax Inclusive</span>
                  </label>
                </div>
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
              <h3 className="text-lg font-semibold">Manage Products & Stock</h3>
              <button onClick={() => setShowAddProduct(true)} className="btn-primary flex items-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700">
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>

            {showAddProduct && (
              <div className="mb-6 p-6 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border-2 border-green-200">
                <h4 className="font-semibold mb-4 text-lg">Add New Product</h4>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Product Name"
                      className="input"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      required
                    />
                    <select
                      className="input"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    >
                      <option value="finished">Finished Product</option>
                      <option value="raw">Raw Material</option>
                      <option value="service">Service</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Selling Price"
                      className="input"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Cost Price (Optional)"
                      className="input"
                      value={newProduct.cost}
                      onChange={(e) => setNewProduct({ ...newProduct, cost: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Product Image</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, true)}
                        className="input"
                      />
                      <Camera className="w-5 h-5 text-gray-400" />
                    </div>
                    {imagePreview && (
                      <div className="mt-2">
                        <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg border" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary flex-1">Add Product</button>
                    <button type="button" onClick={() => {
                      setShowAddProduct(false);
                      setImagePreview('');
                      setNewProduct({ name: '', price: '', cost: '', category: 'finished', image: '' });
                    }} className="btn-secondary">Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {showAddStock && selectedProduct && (
              <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                <h4 className="font-semibold mb-4 text-lg">Add Stock for {selectedProduct.name}</h4>
                <form onSubmit={handleAddStock} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input
                    type="number"
                    placeholder="Quantity"
                    className="input"
                    value={newStock.quantity}
                    onChange={(e) => setNewStock({ ...newStock, quantity: e.target.value })}
                    required
                  />
                  <input
                    type="date"
                    placeholder="Expiry Date (Optional)"
                    className="input"
                    value={newStock.expiryDate}
                    onChange={(e) => setNewStock({ ...newStock, expiryDate: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Batch Number (Optional)"
                    className="input"
                    value={newStock.batchNumber}
                    onChange={(e) => setNewStock({ ...newStock, batchNumber: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Cost per Unit"
                    className="input"
                    value={newStock.cost}
                    onChange={(e) => setNewStock({ ...newStock, cost: e.target.value })}
                  />
                  <div className="flex gap-2 md:col-span-4">
                    <button type="submit" className="btn-primary flex-1">Add Stock</button>
                    <button type="button" onClick={() => {
                      setShowAddStock(false);
                      setSelectedProduct(null);
                      setNewStock({ quantity: '', expiryDate: '', batchNumber: '', cost: '' });
                    }} className="btn-secondary">Cancel</button>
                  </div>
                </form>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Product</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Stock</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Batches</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productList.map((product) => {
                    const stock = getProductStock(product.id);
                    const productBatches = batchList.filter(b => b.productId === product.id && b.quantity > 0);
                    const isLowStock = stock < 10;
                    
                    return (
                      <tr key={product.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {product.image && (
                              <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded-lg" />
                            )}
                            <div>
                              <div className="text-sm font-medium">{product.name}</div>
                              <div className="text-xs text-gray-500">{product.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">KSH {product.price?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${
                              stock === 0 ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-gray-900'
                            }`}>
                              {stock}
                            </span>
                            {isLowStock && stock > 0 && (
                              <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            )}
                            {stock === 0 && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                                Out of Stock
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="text-gray-600">{productBatches.length} active</span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowAddStock(true);
                              }}
                              className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                              title="Add Stock"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button className="p-2 hover:bg-green-50 rounded-lg text-green-600 transition-colors" title="Edit Product">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
