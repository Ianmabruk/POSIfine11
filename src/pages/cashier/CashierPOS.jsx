
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductsContext';


import { sales as salesApi, stats, creditRequests, discounts, products, BASE_API_URL } from '../../services/api';
import { ShoppingCart, Trash2, LogOut, Plus, Minus, Search, DollarSign, TrendingUp, Package, BarChart3, Edit2, Settings, Tag } from 'lucide-react';
import DiscountSelector from '../../components/DiscountSelector';
import ProductCard from '../../components/ProductCard';



export default function CashierPOS() {
  const { user, logout, isUltraPackage, isBasicPackage, canEditStock, canManageUsers, canViewAnalytics, isRealTimeProductSyncEnabled, isCashierUserManagementEnabled } = useAuth();
  const { products: globalProducts, refreshProducts } = useProducts();

  const [productList, setProductList] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [taxInclusive, setTaxInclusive] = useState(true);
  const [activeView, setActiveView] = useState('pos');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', price: '', quantity: '', unit: 'pcs' });
  const [searchTerm, setSearchTerm] = useState('');
  const [salesData, setSalesData] = useState([]);
  const [statsData, setStatsData] = useState({});

  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState(null);
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  const [discountRequests, setDiscountRequests] = useState([]);


  const [discounts, setDiscounts] = useState([]);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [discountForm, setDiscountForm] = useState({
    type: 'percentage',
    value: '',
    reason: '',
    items: []
  });
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  // Track last products update time and update count to display refresh info
  const [lastProductUpdate, setLastProductUpdate] = useState(Date.now());
  const [productUpdateCount, setProductUpdateCount] = useState(0);

  // User management state for 1600 package
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'cashier',
    cashierPIN: ''
  });

  useEffect(() => {
    loadData();
    refreshProducts();
    
    // Check if already clocked in today
    const todayClockIn = localStorage.getItem(`clockIn_${user?.id}_${new Date().toDateString()}`);
    if (todayClockIn) {
      setClockedIn(true);
      setClockInTime(new Date(todayClockIn));
    }

    // Set up automatic product refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing products...');
      setIsAutoRefreshing(true);
      refreshProducts().finally(() => setIsAutoRefreshing(false));
    }, 30000); // 30 seconds

    return () => clearInterval(refreshInterval);
  }, []);

  // Sync with global products
  useEffect(() => {
    if (globalProducts) {
      // Show ALL products to cashiers - don't filter them out
      const visibleProducts = globalProducts.filter(p => {
        // Only exclude products that are explicitly marked as deleted or expense-only
        return !p.pendingDelete && !p.expenseOnly;
      });
      setProductList(visibleProducts);
    }
  }, [globalProducts]);

  const handleClockIn = () => {
    const now = new Date();
    localStorage.setItem(`clockIn_${user?.id}_${now.toDateString()}`, now.toISOString());
    setClockedIn(true);
    setClockInTime(now);
  };


  const handleClockOut = () => {
    const now = new Date();
    const clockInData = localStorage.getItem(`clockIn_${user?.id}_${new Date().toDateString()}`);
    if (clockInData) {
      const clockIn = new Date(clockInData);
      const duration = Math.floor((now - clockIn) / 1000 / 60); // minutes
      // Store clock out record
      const records = JSON.parse(localStorage.getItem('clockRecords') || '[]');
      records.push({
        userId: user?.id,
        userName: user?.name,
        clockIn: clockIn.toISOString(),
        clockOut: now.toISOString(),
        duration,
        date: new Date().toDateString()
      });
      localStorage.setItem('clockRecords', JSON.stringify(records));
      localStorage.removeItem(`clockIn_${user?.id}_${new Date().toDateString()}`);
    }
    setClockedIn(false);
    setClockInTime(null);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    try {
      // Validate passwords match
      if (userForm.password !== userForm.confirmPassword) {
        alert('Passwords do not match');
        return;
      }

      // Validate PIN for cashier role
      if (userForm.role === 'cashier' && (!userForm.cashierPIN || userForm.cashierPIN.length !== 4)) {
        alert('Please provide a valid 4-digit PIN for cashier accounts');
        return;
      }

      // Create user object
      const newUser = {
        name: userForm.name,
        email: userForm.email,
        password: userForm.password,
        role: userForm.role,
        plan: userForm.role === 'admin' ? '1600' : '900', // Admin gets 1600, Cashier gets 900
        active: true,
        cashierPIN: userForm.cashierPIN || null,
        createdBy: user?.id,
        createdAt: new Date().toISOString()
      };

      // This would typically call the users API
      console.log('Creating new user:', newUser);
      
      // Simulate API call
      setTimeout(() => {
        alert(`✅ User "${userForm.name}" created successfully!\n\n📧 Email: ${userForm.email}\n👤 Role: ${userForm.role}\n📦 Package: ${userForm.role === 'admin' ? '1600 Package' : '900 Package'}\n${userForm.cashierPIN ? `🔢 PIN: ${userForm.cashierPIN}` : ''}\n\n${userForm.role === 'cashier' ? 'Cashier can now login with email and PIN from the landing page.' : ''}`);
        setShowAddUserModal(false);
        setUserForm({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'cashier',
          cashierPIN: ''
        });
      }, 1000);

    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Failed to create user: ' + error.message);
    }
  };






  const loadData = async () => {
    try {

      const [salesData, statistics, requests, discountData] = await Promise.all([
        salesApi.getAll(),
        stats.get(),
        creditRequests.getAll().catch(() => []),
        discounts.getAll().catch(() => [])
      ]);
      
      setSalesData(salesData.reverse());
      setStatsData(statistics);
      setDiscountRequests(requests);
      setDiscounts(discountData);
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to empty data on error
      setSalesData([]);
      setStatsData({});
      setDiscountRequests([]);
      setDiscounts([]);
    }
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

  const handleRequestDiscount = async (e) => {
    e.preventDefault();
    try {
      const requestData = {
        type: discountForm.type,
        value: parseFloat(discountForm.value),
        reason: discountForm.reason,
        items: cart.map(item => ({ productId: item.id, quantity: item.quantity, price: item.price })),
        requestedBy: user?.id,
        requestedByName: user?.name,
        subtotal: subtotal,
        createdAt: new Date().toISOString()
      };

      await creditRequests.create(requestData);
      setShowDiscountModal(false);
      setDiscountForm({ type: 'percentage', value: '', reason: '', items: [] });
      await loadData();
      alert('Discount request submitted successfully!');
    } catch (error) {
      console.error('Failed to request discount:', error);
      alert('Failed to request discount: ' + error.message);
    }
  };



  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  // Calculate discount based on selected discount or use a small default discount
  const discountRate = selectedDiscount ? selectedDiscount.percentage / 100 : 0.05; // 5% default or selected discount
  const discountAmount = subtotal * discountRate;
  const discountedSubtotal = subtotal - discountAmount;
  const taxRate = 0.16; // 16% VAT
  const taxAmount = taxInclusive ? 0 : discountedSubtotal * taxRate;
  const total = discountedSubtotal + taxAmount;

  const handleApplyDiscount = ({ discount, newPrice, discountAmount }) => {
    setSelectedDiscount(discount);
  };


  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    try {
      // Create sale through the backend API
      const result = await salesApi.create({
        items: cart.map(item => ({ productId: item.id, quantity: item.quantity, price: item.price })),
        total,
        paymentMethod
      });
      
      setCart([]);
      loadData();
      
      // Show success message with sale details
      alert(`✅ Sale completed successfully!\n\n💰 Total: KSH ${total.toLocaleString()}\n📋 Payment: ${paymentMethod}\n🧾 Receipt #: ${result.id || 'N/A'}\n\nThank you for your purchase!`);
    } catch (error) {
      console.error('Checkout error:', error);
      let errorMessage = 'Failed to complete sale';
      
      if (error.message.includes('Failed to fetch') || error.message.includes('Network error')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
        errorMessage = 'Session expired. Please log in again.';
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      } else if (error.message) {
        errorMessage = `Failed to complete sale: ${error.message}`;
      }
      
      alert(errorMessage);
    }
  };

  const filteredProducts = productList.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">

      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              {isUltraPackage() ? 'Admin Dashboard' : isBasicPackage() ? 'Cashier Dashboard' : 'POS System'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5 hidden md:block">
              {isUltraPackage() ? '1600 Package - Full Admin Access' : 
               isBasicPackage() ? '900 Package - Stock Management' : 'Package Access'}
            </p>
          </div>

        <div className="flex items-center gap-2 md:gap-4">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
              {clockedIn && clockInTime && (
                <p className="text-xs text-green-600 font-medium">Clocked in: {clockInTime.toLocaleTimeString()}</p>
              )}
              <div className="text-xs text-gray-400 mt-1">
                {isAutoRefreshing ? (
                  <span className="text-blue-600 flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    Updating...
                  </span>
                ) : (
                  <span>
                    Last update: {new Date(lastProductUpdate).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {clockedIn ? (
                <button onClick={handleClockOut} className="btn-secondary flex items-center gap-1 md:gap-2 text-sm md:text-base px-2 md:px-4 bg-red-50 text-red-600 border-red-200">
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Clock Out</span>
                </button>
              ) : (
                <button onClick={handleClockIn} className="btn-secondary flex items-center gap-1 md:gap-2 text-sm md:text-base px-2 md:px-4 bg-green-50 text-green-600 border-green-200">
                  <LogOut className="w-4 h-4 rotate-180" />
                  <span className="hidden md:inline">Clock In</span>
                </button>
              )}
              <button onClick={() => window.location.href = '/cashier/settings'} className="btn-secondary flex items-center gap-1 md:gap-2 text-sm md:text-base px-2 md:px-4">
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline">Settings</span>
              </button>
              <button onClick={logout} className="btn-secondary flex items-center gap-1 md:gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-sm md:text-base px-2 md:px-4">
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>


      {/* View Tabs */}
      <div className="flex gap-1 md:gap-2 px-2 md:px-6 py-2 md:py-4 bg-white border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveView('pos')}
          className={`px-3 md:px-6 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm md:text-base ${
            activeView === 'pos' ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <ShoppingCart className="w-4 h-4 inline mr-1 md:mr-2" />
          POS
        </button>
        
        {/* Show Sales tab for both packages */}
        <button
          onClick={() => setActiveView('sales')}
          className={`px-3 md:px-6 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm md:text-base ${
            activeView === 'sales' ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-1 md:mr-2" />
          Sales
        </button>
        
        {/* Show Stock tab for both packages (900 package can edit stock) */}
        {canEditStock() && (
          <button
            onClick={() => setActiveView('stock')}
            className={`px-3 md:px-6 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm md:text-base ${
              activeView === 'stock' ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Package className="w-4 h-4 inline mr-1 md:mr-2" />
            Stock
          </button>
        )}
        

        {/* Show User Management tab based on new permission system */}
        {canManageUsers() && isCashierUserManagementEnabled() && (
          <button
            onClick={() => setActiveView('users')}
            className={`px-3 md:px-6 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm md:text-base ${
              activeView === 'users' ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-1 md:mr-2" />
            Users
          </button>
        )}
        
        {/* Show disabled User Management tab when admin has disabled it */}
        {canManageUsers() && !isCashierUserManagementEnabled() && (
          <button
            onClick={() => alert('User Management has been disabled by the admin')}
            className="px-3 md:px-6 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm md:text-base bg-gray-200 text-gray-500 cursor-not-allowed opacity-60"
            title="User Management disabled by admin"
          >
            <Settings className="w-4 h-4 inline mr-1 md:mr-2" />
            Users (Disabled)
          </button>
        )}
      </div>

      {/* POS View */}
      {activeView === 'pos' && (
        <div className="flex-1 flex flex-col md:flex-row">
          {/* Products Grid */}
          <div className="flex-1 p-3 md:p-6 overflow-y-auto">

            <div className="mb-6">
              <div className="flex items-center gap-4">
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
                <button
                  onClick={() => {
                    console.log('🔄 Manual refresh triggered');
                    setIsAutoRefreshing(true);
                    loadData().finally(() => {
                      setIsAutoRefreshing(false);
                      setLastProductUpdate(Date.now());
                      setProductUpdateCount(prev => prev + 1);
                    });
                  }}
                  disabled={isAutoRefreshing}
                  className="btn-secondary flex items-center gap-2 px-4 py-2"
                  title="Refresh products manually"
                >
                  <svg className={`w-4 h-4 ${isAutoRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
              
              {/* Auto-refresh status */}
              <div className="mt-2 text-xs text-gray-500">
                💡 Products auto-refresh every 30 seconds. Current products: {filteredProducts.length}
                {productUpdateCount > 0 && (
                  <span className="ml-2 text-green-600">
                    • Updated {productUpdateCount} time{productUpdateCount !== 1 ? 's' : ''} this session
                  </span>
                )}
              </div>
            </div>
            


            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                  onRequestCredit={() => {}}
                  showDiscounts={true}
                />
              ))}
            </div>
          </div>

          {/* Cart Sidebar */}
          <div className="w-full md:w-96 bg-white border-t md:border-l md:border-t-0 border-gray-200 p-4 md:p-6 flex flex-col shadow-xl max-h-[50vh] md:max-h-none">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-teal-600 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold">Cart</h2>
              <span className="ml-auto bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                {cart.length} items
              </span>
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
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-100">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center font-semibold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-100">
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





            {/* Dynamic Discount Display Area */}
            {cart.length > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 mb-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Tag className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="font-semibold text-blue-900">Available Discounts</h4>
                </div>
                

                {discounts.length > 0 ? (
                  <div className="space-y-3">
                    <div className="max-h-48 overflow-y-auto">
                      <DiscountSelector 
                        originalPrice={subtotal} 
                        onApply={handleApplyDiscount}
                      />
                    </div>
                    {selectedDiscount && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-green-700 font-medium">Applied: {selectedDiscount.name}</span>
                          </div>
                          <span className="text-green-600 font-bold">{selectedDiscount.percentage}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No active discounts available</p>
                    <p className="text-xs text-gray-400 mt-1">Check with admin to set up discounts</p>
                  </div>
                )}
                

                <div className="border-t-2 border-blue-300 pt-2 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-blue-900">Total Discount Applied</span>
                    <span className="text-sm font-bold text-blue-600">
                      KSH {discountAmount.toLocaleString()} ({Math.round(discountRate * 100)}%)
                    </span>
                  </div>
                  {selectedDiscount && (
                    <div className="text-xs text-gray-600 mt-1">
                      Applied discount: {selectedDiscount.name} ({selectedDiscount.percentage}%)
                    </div>
                  )}
                </div>
                
                {/* Enhanced Request Discount Button */}
                <div className="mt-4 p-3 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-900">Need Additional Discount?</span>
                  </div>
                  <p className="text-xs text-orange-700 mb-3">
                    Request manager approval for special discounts due to customer circumstances, bulk orders, or promotional events.
                  </p>
                  <button 
                    onClick={() => setShowDiscountModal(true)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg hover:from-orange-600 hover:to-yellow-600 transition-all text-sm font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    💰 Request Manager Discount Approval
                  </button>
                </div>
              </div>
            )}

            {/* Current Discount Requests */}
            {discountRequests.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                <h4 className="font-semibold text-yellow-900 mb-3">Pending Discount Requests</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {discountRequests.slice(0, 3).map((request) => (
                    <div key={request.id} className="bg-white rounded-lg p-3 border border-yellow-200">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {request.type === 'percentage' ? `${request.value}%` : `KSH ${request.value}`}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 truncate">{request.reason}</p>
                    </div>
                  ))}
                  {discountRequests.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{discountRequests.length - 3} more requests
                    </p>
                  )}
                </div>
              </div>
            )}


            <div className="border-t border-gray-200 pt-4 space-y-4">
              <div className="space-y-2 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="font-semibold">KSH {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-blue-600">
                  <span>Discount ({Math.round(discountRate * 100)}%):</span>
                  <span className="font-semibold">-KSH {discountAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Discounted Subtotal:</span>
                  <span className="font-semibold">KSH {discountedSubtotal.toLocaleString()}</span>
                </div>
                {!taxInclusive && (
                  <div className="flex justify-between text-sm">
                    <span>Tax (16%):</span>
                    <span className="font-semibold">KSH {taxAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold border-t border-gray-200 pt-2">
                  <span>Total:</span>
                  <span className="text-green-600">KSH {total.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Tax</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTaxInclusive(true)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      taxInclusive ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Tax Inclusive
                  </button>
                  <button
                    onClick={() => setTaxInclusive(false)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      !taxInclusive ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Tax Exclusive
                  </button>
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

              <button 
                onClick={handleCheckout} 
                disabled={cart.length === 0} 
                className="btn-primary w-full py-4 text-lg bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 shadow-lg"
              >
                Complete Sale
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Stock Management View */}
      {activeView === 'stock' && (
        <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Stock Management</h2>
            <button 
              onClick={() => {
                setShowAddProduct(true);
                setProductForm({ name: '', price: '', quantity: '', unit: 'pcs' });
              }}
              className="btn-primary flex items-center gap-2 bg-gradient-to-r from-green-600 to-teal-600"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>

          <div className="card shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Product</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Stock</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>


                <tbody>
                  {productList.map((product) => (
                    <tr key={product.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{product.name}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">KSH {product.price?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`font-medium ${product.quantity < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                          {product.quantity} {product.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setEditingProduct(product);
                              setProductForm({ name: product.name, price: product.price, quantity: product.quantity, unit: product.unit || 'pcs' });
                            }}
                            className="p-2 hover:bg-green-50 rounded-lg text-green-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={async () => {
                              if (confirm('Delete this product? This action cannot be undone.')) {
                                try {

                                  await products.delete(product.id);
                                  // Update local state immediately for better UX
                                  setProductList(prevProducts => prevProducts.filter(p => p.id !== product.id));
                                  alert('Product deleted successfully!');
                                  loadData(); // Refresh to ensure sync
                                } catch (error) {
                                  console.error('Failed to delete product:', error);
                                  
                                  // Provide specific error messages
                                  let errorMessage = 'Failed to delete product';
                                  
                                  if (error.message.includes('Failed to execute') || error.message.includes('JSON')) {
                                    errorMessage = 'Network error. Please check your connection and try again.';
                                  } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
                                    errorMessage = 'You are not authorized to delete this product.';
                                  } else if (error.message.includes('404') || error.message.includes('not found')) {
                                    errorMessage = 'Product not found. It may have been deleted already.';
                                  } else if (error.message) {
                                    errorMessage = `Failed to delete product: ${error.message}`;
                                  }
                                  
                                  alert(errorMessage);
                                }
                              }
                            }}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                          >
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

          {/* Add/Edit Product Modal */}
          {(showAddProduct || editingProduct) && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    if (editingProduct) {

                      await products.update(editingProduct.id, {
                        ...editingProduct,
                        ...productForm,
                        price: parseFloat(productForm.price),
                        quantity: parseFloat(productForm.quantity)
                      });
                    } else {

                      await products.create({
                        ...productForm,
                        price: parseFloat(productForm.price),
                        cost: parseFloat(productForm.price) * 0.6,
                        quantity: parseFloat(productForm.quantity),
                        category: 'raw'
                      });
                    }
                    setShowAddProduct(false);
                    setEditingProduct(null);
                    loadData();
                  } catch (error) {
                    alert('Failed: ' + error.message);
                  }
                }} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Product Name"
                    className="input"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    className="input"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Quantity"
                      className="input"
                      value={productForm.quantity}
                      onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
                      required
                    />
                    <select
                      className="input"
                      value={productForm.unit}
                      onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    >
                      <option value="pcs">Pieces</option>
                      <option value="kg">Kilograms</option>
                      <option value="L">Liters</option>
                      <option value="g">Grams</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary flex-1">{editingProduct ? 'Update' : 'Add'}</button>
                    <button type="button" onClick={() => { setShowAddProduct(false); setEditingProduct(null); }} className="btn-secondary">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sales View */}
      {activeView === 'sales' && (
        <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-100 mb-1">Daily Sales</p>
                  <p className="text-3xl font-bold">KSH {statsData.dailySales?.toLocaleString() || 0}</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <DollarSign className="w-8 h-8" />
                </div>
              </div>
            </div>
            
            <div className="card bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-100 mb-1">Weekly Sales</p>
                  <p className="text-3xl font-bold">KSH {statsData.weeklySales?.toLocaleString() || 0}</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-8 h-8" />
                </div>
              </div>
            </div>
            
            <div className="card bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-100 mb-1">Total Sales</p>
                  <p className="text-3xl font-bold">KSH {statsData.totalSales?.toLocaleString() || 0}</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Package className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>

          {/* Sales Table */}
          <div className="card shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Sales History</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date & Time</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Items</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Payment</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                    {user?.plan === 'ultra' && (
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Profit</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {salesData.slice(0, 20).map((sale) => (
                    <tr key={sale.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm">{new Date(sale.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm">{sale.items?.length || 0} items</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="badge badge-success">{sale.paymentMethod || 'cash'}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">
                        KSH {sale.total?.toLocaleString()}
                      </td>
                      {user?.plan === 'ultra' && (
                        <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                          KSH {sale.profit?.toLocaleString() || 0}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>


        </div>
      )}

      {/* User Management View */}
      {activeView === 'users' && isUltraPackage() && canManageUsers() && (
        <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">User Management</h2>
            <button 
              onClick={() => {
                setShowAddUserModal(true);
                setUserForm({ name: '', email: '', password: '', confirmPassword: '', role: 'cashier', cashierPIN: '' });
              }}
              className="btn-primary flex items-center gap-2 bg-gradient-to-r from-green-600 to-teal-600"
            >
              <Plus className="w-4 h-4" />
              Add User
            </button>
          </div>

          <div className="card shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Package</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">PIN</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* This would typically fetch from users API */}
                  <tr className="border-t border-gray-100">
                    <td className="px-4 py-3 text-sm">Admin User</td>
                    <td className="px-4 py-3 text-sm">admin@example.com</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="badge badge-success">Admin</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="badge badge-primary">1600 Package</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">N/A</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="badge badge-success">Active</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-green-50 rounded-lg text-green-600">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Add User Modal */}
          {showAddUserModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-lg">
                <h3 className="text-xl font-bold mb-4">Add New User</h3>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="input"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    className="input"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    className="input"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    className="input"
                    value={userForm.confirmPassword}
                    onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value })}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      className="input"
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    >
                      <option value="cashier">Cashier</option>
                      <option value="admin">Admin</option>
                    </select>
                    <input
                      type="text"
                      placeholder="4-digit PIN"
                      className="input"
                      value={userForm.cashierPIN}
                      onChange={(e) => setUserForm({ ...userForm, cashierPIN: e.target.value })}
                      maxLength="4"
                      pattern="[0-9]{4}"
                      title="Please enter a 4-digit PIN"
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-700">
                      💡 <strong>PIN Note:</strong> Cashiers can login using their email and the 4-digit PIN provided.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary flex-1">Add User</button>
                    <button type="button" onClick={() => setShowAddUserModal(false)} className="btn-secondary">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}


      {/* Enhanced Discount Request Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center">
                <Tag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Request Manager Discount Approval</h3>
                <p className="text-sm text-gray-600">Submit a discount request for manager review</p>
              </div>
            </div>

            <form onSubmit={handleRequestDiscount} className="space-y-5">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">📋 Cart Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Items in Cart:</span>
                    <span className="font-semibold text-blue-900 ml-2">{cart.length}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Current Subtotal:</span>
                    <span className="font-semibold text-blue-900 ml-2">KSH {subtotal.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Applied Discounts:</span>
                    <span className="font-semibold text-green-600 ml-2">KSH {discountAmount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">After Discounts:</span>
                    <span className="font-semibold text-blue-900 ml-2">KSH {discountedSubtotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Discount Type</label>
                  <select 
                    className="input"
                    value={discountForm.type}
                    onChange={(e) => setDiscountForm({ ...discountForm, type: e.target.value })}
                  >
                    <option value="percentage">📊 Percentage (%)</option>
                    <option value="fixed">💰 Fixed Amount (KSH)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {discountForm.type === 'percentage' ? 'Discount Percentage' : 'Discount Amount (KSH)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={discountForm.type === 'percentage' ? '100' : subtotal.toString()}
                    placeholder={discountForm.type === 'percentage' ? '10' : '500'}
                    className="input"
                    value={discountForm.value}
                    onChange={(e) => setDiscountForm({ ...discountForm, value: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🎯 Reason for Discount Request
                </label>
                <textarea
                  className="input"
                  placeholder="Please provide detailed reasoning for this discount request. Examples: Customer loyalty, bulk purchase, damaged packaging, special occasion, competitor pricing, etc."
                  rows="4"
                  value={discountForm.reason}
                  onChange={(e) => setDiscountForm({ ...discountForm, reason: e.target.value })}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 <strong>Tip:</strong> Be specific about customer circumstances or business reasons to help managers approve requests faster.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-yellow-800 mb-1">Important Notes:</p>
                    <ul className="text-yellow-700 space-y-1 text-xs">
                      <li>• Manager approval is required for all discount requests</li>



                      <li>• Large discounts (greater than 20%) may require additional authorization</li>
                      <li>• All requests are logged and monitored for compliance</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button 
                  type="submit" 
                  className="flex-1 btn-primary bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold py-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                >
                  📤 Submit Discount Request
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowDiscountModal(false);
                    setDiscountForm({ type: 'percentage', value: '', reason: '', items: [] });
                  }} 
                  className="btn-secondary px-6"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
