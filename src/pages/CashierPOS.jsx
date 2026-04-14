import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductsContext';
import { products, sales, expenses, stats, batches, discounts, timeEntries, creditRequests, reminders } from '../services/api';
import websocketService from '../services/websocketService';
import { BASE_API_URL } from '../services/api';
import { ShoppingCart, Trash2, LogOut, Plus, Minus, DollarSign, TrendingDown, Package, Edit2, Search, Camera, Upload, AlertTriangle, Clock, Play, Square, CreditCard, X, Bell, PenSquare } from 'lucide-react';
import SignaturePad from '../components/SignaturePad';
import DiscountSelector from '../components/DiscountSelector';
import ProductCard from '../components/ProductCard';
import LowStockAlert from '../components/LowStockAlert';
// Import optimized transaction service
import { 
  completeSaleTransaction, 
  invalidateProductCache
} from '../services/transactionService';

export default function CashierPOS() {
  const { user, logout } = useAuth();
  const { products: globalProducts, refreshProducts } = useProducts();
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
  const [showCreditRequest, setShowCreditRequest] = useState(false);
  const [creditRequestForm, setCreditRequestForm] = useState({ customerName: '', amount: '', reason: '', notes: '' });
  const [creditRequestSubmitting, setCreditRequestSubmitting] = useState(false);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: '' });
  const [imagePreview, setImagePreview] = useState('');
  const [discountList, setDiscountList] = useState([]);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [taxType, setTaxType] = useState('exclusive');
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentTimeEntry, setCurrentTimeEntry] = useState(null);
  const [clockedInTime, setClockedInTime] = useState(null);
  const [cartItemUnits, setCartItemUnits] = useState({});  // Track units for each cart item
  const [checkoutLoading, setCheckoutLoading] = useState(false);  // Prevent double-submit
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);  // Auto-refresh indicator
  const [isProcessingSale, setIsProcessingSale] = useState(false);  // Processing sale state
  const [lastProductUpdate, setLastProductUpdate] = useState(Date.now());  // Track updates
  const [productUpdateCount, setProductUpdateCount] = useState(0);  // Update count
  const [reminderList, setReminderList] = useState([]);
  const [reminderNotes, setReminderNotes] = useState({});
  const [reminderSignatures, setReminderSignatures] = useState({});
  const [remindersLoading, setRemindersLoading] = useState(false);
  const [saleToast, setSaleToast] = useState(null); // { type: 'success'|'error'|'warning', message, id }
  const toastTimerRef = useRef(null);
  const productRefreshTimeoutRef = useRef(null);

  // Show a non-blocking toast notification (auto-dismisses after `ms` ms)
  const showToast = useCallback((type, message, ms = 3500) => {
    const id = Date.now();
    setSaleToast({ type, message, id });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setSaleToast(null), ms);
  }, []);

  const getAccountKey = () => user?.account_id || user?.accountId || user?.id || 'anonymous';
  const getCashierSnapshotKey = () => `cashier_snapshot_${getAccountKey()}`;
  const getClockStorageKey = () => `clockIn_${user?.id}_${new Date().toDateString()}`;

  const persistCashierSnapshot = useCallback((payload) => {
    try {
      localStorage.setItem(getCashierSnapshotKey(), JSON.stringify({
        ...payload,
        savedAt: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to persist cashier snapshot:', error);
    }
  }, [user?.account_id, user?.accountId, user?.id]);

  const hydrateCashierSnapshot = useCallback(() => {
    try {
      const raw = localStorage.getItem(getCashierSnapshotKey());
      if (!raw) return;
      const parsed = JSON.parse(raw);

      const cachedProducts = Array.isArray(parsed?.productList) ? parsed.productList : [];
      const cachedSales = Array.isArray(parsed?.sales) ? parsed.sales : [];
      const cachedExpenses = Array.isArray(parsed?.expenses) ? parsed.expenses : [];
      const cachedBatches = Array.isArray(parsed?.batchList) ? parsed.batchList : [];
      const cachedDiscounts = Array.isArray(parsed?.discountList) ? parsed.discountList : [];
      const cachedStats = parsed?.stats || {};

      if (cachedProducts.length) setProductList(cachedProducts);
      if (cachedBatches.length) setBatchList(cachedBatches);
      if (cachedDiscounts.length) setDiscountList(cachedDiscounts);

      if (cachedSales.length || cachedExpenses.length || Object.keys(cachedStats).length) {
        setData({
          sales: cachedSales,
          expenses: cachedExpenses,
          stats: cachedStats
        });
      }
    } catch (error) {
      console.warn('Failed to restore cashier snapshot:', error);
    }
  }, [user?.account_id, user?.accountId, user?.id]);

  const refreshVisibleProducts = useCallback(async () => {
    try {
      const freshProducts = await refreshProducts();
      if (Array.isArray(freshProducts)) {
        const filtered = freshProducts.filter(p => p.visibleToCashier !== false && !p.expenseOnly && !p.pendingDelete);
        setProductList(filtered);
      }
    } catch (error) {
      console.warn('Failed to refresh visible products:', error);
    }
  }, [refreshProducts]);

  const scheduleProductRefresh = useCallback(() => {
    if (productRefreshTimeoutRef.current) {
      clearTimeout(productRefreshTimeoutRef.current);
    }
    productRefreshTimeoutRef.current = setTimeout(() => {
      refreshVisibleProducts();
    }, 200);
  }, [refreshVisibleProducts]);

  useEffect(() => {
    hydrateCashierSnapshot();

    Promise.all([
      loadData(),
      fetchReminders(),
      checkClockStatus()
    ]).catch((error) => {
      console.warn('Initial cashier bootstrap completed with warnings:', error);
    });
    
    // Restore session data from localStorage
    const savedCart = localStorage.getItem(`cart_${user?.id}`);
    const savedPaymentMethod = localStorage.getItem(`paymentMethod_${user?.id}`);
    const savedDiscount = localStorage.getItem(`selectedDiscount_${user?.id}`);
    const savedTaxType = localStorage.getItem(`taxType_${user?.id}`);
    
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
    
    // Real-time event listeners for stock updates from admin
    const handleStockUpdated = (event) => {
      console.log('📦 Stock update event received:', event.detail);
      scheduleProductRefresh();
    };

    const handleProductsSync = (event) => {
      console.log('🔄 Products sync event received:', event.detail);
      if (event.detail && event.detail.products) {
        const filtered = event.detail.products.filter(p => p.visibleToCashier !== false && !p.expenseOnly);
        setProductList(filtered);
      }
    };

    const handleProductUpdated = () => {
      console.log('📝 Product update event received');
      scheduleProductRefresh();
    };

    const handleReminderBroadcast = () => {
      fetchReminders();
    };

    const handleSaleCompleted = () => {
      console.log('💹 Sale completed event received - refreshing stats');
      scheduleProductRefresh();
      refreshStats();
    };

    const handleExpenseAdded = () => {
      console.log('💸 Expense added event received - refreshing stats');
      refreshStats();
    };

    // Add event listeners
    window.addEventListener('stock_updated', handleStockUpdated);
    window.addEventListener('productsSync', handleProductsSync);
    window.addEventListener('productUpdated', handleProductUpdated);
    window.addEventListener('productCreated', handleProductUpdated);
    window.addEventListener('reminder_created', handleReminderBroadcast);
    window.addEventListener('sale_completed', handleSaleCompleted);
    window.addEventListener('expense_added', handleExpenseAdded);

    // REMOVED: 30-second auto-refresh - now handled by ProductsContext smart auto-refresh
    // This prevents duplicate refresh logic and respects editing state
    // ProductsContext will refresh every 30s when user is not actively editing

    return () => {
      // Cleanup event listeners
      window.removeEventListener('stock_updated', handleStockUpdated);
      window.removeEventListener('productsSync', handleProductsSync);
      window.removeEventListener('productUpdated', handleProductUpdated);
      window.removeEventListener('productCreated', handleProductUpdated);
      window.removeEventListener('reminder_created', handleReminderBroadcast);
      window.removeEventListener('sale_completed', handleSaleCompleted);
      window.removeEventListener('expense_added', handleExpenseAdded);
      if (productRefreshTimeoutRef.current) {
        clearTimeout(productRefreshTimeoutRef.current);
      }
    };
  }, [user?.id, scheduleProductRefresh, hydrateCashierSnapshot]);

  // Sync with global products from ProductsContext
  useEffect(() => {
    if (globalProducts) {
      const visibleProducts = globalProducts.filter(p => 
        p.visibleToCashier !== false && !p.expenseOnly && !p.pendingDelete
      );
      
      // 🔥 CRITICAL FIX: Only update if products actually changed
      // This prevents unnecessary re-renders that reset stock values
      const currentProductIds = productList.map(p => p.id).sort().join(',');
      const newProductIds = visibleProducts.map(p => p.id).sort().join(',');
      const currentProductHash = productList.map(p => `${p.id}:${p.quantity}`).sort().join('|');
      const newProductHash = visibleProducts.map(p => `${p.id}:${p.quantity}`).sort().join('|');
      
      // Only update if structure or quantities actually changed
      if (currentProductIds !== newProductIds || currentProductHash !== newProductHash) {
        console.log('📦 [ProductSync] Updating products - actual changes detected');
        setProductList(visibleProducts);
        setLastProductUpdate(Date.now());
        setProductUpdateCount(prev => prev + 1);
      } else {
        console.log('📦 [ProductSync] Skipping update - no changes detected');
      }
    }
  }, [globalProducts]);

  // Subscribe to real-time product updates
  useEffect(() => {
    const token = localStorage.getItem('token');
    let wsUpdateTimeout = null;
    
    if (token) {
      websocketService.connect(token, (data) => {
        console.log('📡 WebSocket callback received:', data);
        
        // Handle all product updates with debouncing to prevent glitches
        if (data && data.allProducts) {
          console.log(`📦 Merging ${data.allProducts.length} products from WebSocket`);
          
          // Clear previous timeout
          if (wsUpdateTimeout) clearTimeout(wsUpdateTimeout);
          
          // Debounce: wait 300ms before applying update
          wsUpdateTimeout = setTimeout(() => {
            const filtered = data.allProducts.filter(p => p.visibleToCashier !== false && !p.expenseOnly);
            setProductList(filtered);
          }, 300);
        }
        
        // Handle individual stock updates immediately (these are usually single product updates)
        if (data && data.productId !== undefined && data.newQuantity !== undefined) {
          console.log(`📦 Stock update for product ${data.productId}: ${data.newQuantity}${data.unit || ''}`);
          setProductList(prev => {
            // Find and update the product in current list
            const updated = prev.map(p => 
              p.id === data.productId 
                ? { ...p, quantity: data.newQuantity } 
                : p
            );
            return updated;
          });
        }
        
        // When discounts updated, refresh discount list
        if (data && data.discounts) {
          console.log('📊 Discount list updated');
          setDiscountList(data.discounts);
        }
        
        // When new sale created, reload data to show updated stats
        if (data && data.sale) {
          console.log('💰 Sale detected, reloading stats');
          refreshStats();
          scheduleProductRefresh();
        }
      }).catch((error) => {
        console.warn('⚠️ WebSocket connection failed:', error);
      });
    }
    
    return () => {
      if (wsUpdateTimeout) clearTimeout(wsUpdateTimeout);
      websocketService.disconnect();
    };
  }, []);

  // Auto-save cart whenever it changes
  useEffect(() => {
    if (cart.length > 0 || paymentMethod || taxType) {
      saveSessionData();
    }
  }, [cart, paymentMethod, taxType, selectedDiscount, user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    persistCashierSnapshot({
      productList,
      sales: data.sales || [],
      expenses: data.expenses || [],
      stats: data.stats || {},
      batchList,
      discountList
    });
  }, [user?.id, productList, data, batchList, discountList, persistCashierSnapshot]);

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
    if (isClockedIn) {
      showToast('warning', 'You are already clocked in.');
      return;
    }
    
    try {
      setIsProcessingSale(true);
      console.log('⏰ Attempting to clock in...');
      
      const result = await timeEntries.create('clock_in');
      
      console.log('✅ Clock in response:', result);
      
      if (result && result.id) {
        setCurrentTimeEntry(result);
        setIsClockedIn(true);
        const clockInTime = new Date(result.clockInTime || result.clock_in_time || new Date());
        setClockedInTime(clockInTime);
        localStorage.setItem(getClockStorageKey(), clockInTime.toISOString());
        console.log('✅ Clocked in successfully at', clockInTime.toLocaleTimeString());
        showToast('success', `Clocked in at ${clockInTime.toLocaleTimeString()}`);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('❌ Clock in failed:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to connect to server';
      showToast('error', `Clock in failed: ${errorMsg}`);
    } finally {
      setIsProcessingSale(false);
    }
  };

  // Clock out function
  const handleClockOut = async () => {
    if (!isClockedIn) {
      showToast('warning', 'You are not clocked in.');
      return;
    }
    
    const confirm = window.confirm('⏰ Clock Out\n\nAre you sure you want to clock out now?');
    if (!confirm) return;
    
    try {
      setIsProcessingSale(true);
      console.log('⏰ Attempting to clock out...');
      
      const result = await timeEntries.create('clock_out');
      
      console.log('✅ Clock out response:', result);
      
      setCurrentTimeEntry(result);
      setIsClockedIn(false);
      setClockedInTime(null);
      localStorage.removeItem(getClockStorageKey());
      
      const durationStr = result.duration 
        ? `${Math.floor(result.duration / 60)}h ${result.duration % 60}m` 
        : result.durationMinutes
        ? `${Math.floor(result.durationMinutes / 60)}h ${result.durationMinutes % 60}m`
        : 'calculated';
      
      console.log('✅ Clocked out successfully. Duration:', durationStr);
      showToast('success', `Clocked out successfully. Duration: ${durationStr}`);
    } catch (error) {
      console.error('❌ Clock out failed:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to connect to server';
      showToast('error', `Clock out failed: ${errorMsg}`);
    } finally {
      setIsProcessingSale(false);
    }
  };

  // Check clock status from backend
  const checkClockStatus = async () => {
    try {
      const data = await timeEntries.getStatus();
      if (data.isClockedIn) {
        setIsClockedIn(true);
        setClockedInTime(new Date(data.clockInTime));
        setCurrentTimeEntry(data);
        console.log('✅ User is clocked in since:', data.clockInTime);
      } else {
        setIsClockedIn(false);
        setClockedInTime(null);
        setCurrentTimeEntry(null);
        localStorage.removeItem(getClockStorageKey());
        console.log('User is not clocked in');
      }
    } catch (error) {
      console.warn('Failed to check clock status:', error);
      const savedClockIn = localStorage.getItem(getClockStorageKey());
      if (savedClockIn) {
        setIsClockedIn(true);
        setClockedInTime(new Date(savedClockIn));
      } else {
        setIsClockedIn(false);
        setClockedInTime(null);
      }
    }
  };

  const loadData = async () => {
    try {
      console.log('🔄 Loading cashier data...');
      
      const [p, s, e, st, b, d] = await Promise.all([
        products.getAll(),
        sales.getAll(),
        expenses.getAll(),
        stats.get({ cashierId: user?.id }),
        batches.getAll(),
        discounts.getAll().catch(() => [])  // Fallback to empty array if discounts fail
      ]);
      
      const filteredProducts = p.filter(prod => prod.visibleToCashier !== false && !prod.expenseOnly);
      
      setProductList(filteredProducts);
      setData({ sales: s, expenses: e, stats: st });
      setBatchList(b);
      setDiscountList(d || []);

      persistCashierSnapshot({
        productList: filteredProducts,
        sales: s,
        expenses: e,
        stats: st || {},
        batchList: b,
        discountList: d || []
      });
      
      console.log('✅ Data loaded:', {
        products: filteredProducts.length,
        sales: s.length,
        expenses: e.length,
        batches: b.length,
        discounts: d.length
      });
    } catch (error) {
      console.error('❌ Failed to load data:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to connect to server';
      hydrateCashierSnapshot();
      // Show error only on initial load, not on background refreshes
      if (!productList.length) {
        alert('⚠️ Failed to load data\n\n' + errorMsg + '\n\nSome features may not work correctly.');
      }
    }
  };

  const refreshStats = async () => {
    try {
      const st = await stats.get({ cashierId: user?.id });
      setData(prev => {
        const merged = {
          ...(st || {}),
          totalCOGS: st?.totalCOGS ?? st?.cogs ?? 0,
          grossProfit: st?.grossProfit ?? ((st?.totalSales || 0) - (st?.totalCOGS || st?.cogs || 0)),
          netProfit: st?.netProfit ?? st?.profit ?? ((st?.totalSales || 0) - (st?.totalExpenses || 0))
        };

        persistCashierSnapshot({
          productList,
          sales: prev.sales || [],
          expenses: prev.expenses || [],
          stats: merged,
          batchList,
          discountList
        });

        return {
        ...prev,
          stats: merged
        };
      });
    } catch (error) {
      console.warn('Stats refresh failed:', error);
    }
  };

  const fetchReminders = async () => {
    try {
      setRemindersLoading(true);
      const data = await reminders.getToday();
      setReminderList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
      setReminderList([]);
    } finally {
      setRemindersLoading(false);
    }
  };

  const saveReminderSignature = async (reminderId) => {
    try {
      const note = reminderNotes[reminderId] || '';
      const signature = reminderSignatures[reminderId] || '';
      await reminders.update(reminderId, { note, signature, status: 'fulfilled' });
      await fetchReminders();
    } catch (error) {
      console.error('Failed to save reminder signature:', error);
      alert('Failed to save reminder. Please try again.');
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

  const getProductStock = useCallback((productId) => {
    const product = productList.find(p => p.id === productId);
    return Number(product?.quantity || 0);
  }, [productList]);

  const getLowStockThreshold = useCallback((product) => {
    const threshold = Number(product?.reorder_level ?? product?.reorderLevel ?? 0);
    return threshold > 0 ? threshold : 10;
  }, []);

  const getOldestBatch = (productId) => {
    const productBatches = batchList
      .filter(b => b.productId === productId && b.quantity > 0)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return productBatches[0] || null;
  };

  const addToCart = useCallback((product) => {
    const availableStock = getProductStock(product.id);
    if (availableStock <= 0) {
      alert('Product is out of stock!');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      const currentCartQty = existing ? existing.quantity : 0;

      if (currentCartQty >= availableStock) {
        alert(`Only ${availableStock} units available in stock!`);
        return prev;
      }

      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...prev, { ...product, quantity: 1 }];
    });
  }, [getProductStock]);

  const updateQuantity = useCallback((id, delta) => {
    const availableStock = getProductStock(id);

    setCart(prev => prev.map(item => {
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
  }, [getProductStock]);

  const removeFromCart = useCallback((id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  }, []);

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = useCallback(async () => {
    console.log('🛒 [Checkout] Starting optimized checkout flow');
    
    // Prevent double submission
    if (cart.length === 0) {
      alert('❌ Cart is empty! Add products first.');
      return;
    }
    
    if (checkoutLoading) {
      console.log('⚠️ [Checkout] Already processing, please wait...');
      return;
    }
    
    // Check if clocked in
    if (!isClockedIn) {
      const proceed = confirm('⚠️ You are not clocked in!\n\nDo you want to clock in now before completing the sale?');
      if (proceed) {
        await handleClockIn();
      }
    }
    
    setCheckoutLoading(true);
    setIsProcessingSale(true);
    
    // Save cart state for potential rollback
    const savedCart = [...cart];
    const savedCartUnits = {...cartItemUnits};
    const savedDiscount = selectedDiscount;
    const savedTaxType = taxType;
    
    try {
      // Calculate totals
      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const discountValue = selectedDiscount 
        ? (selectedDiscount.type === 'percentage' ? (subtotal * selectedDiscount.value / 100) : selectedDiscount.value)
        : 0;
      
      // Calculate tax based on type
      let taxAmount = 0;
      let finalTotal = 0;
      
      if (taxType === 'inclusive') {
        // Tax already included in total, extract it
        taxAmount = (subtotal / 1.16) * 0.16;
        finalTotal = subtotal - discountValue;
      } else {
        // Tax needs to be added
        taxAmount = (subtotal - discountValue) * 0.16;
        finalTotal = subtotal - discountValue + taxAmount;
      }
      
      // Prepare cart items with units
      const cartItems = cart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        unit: cartItemUnits[item.id] || item.unit || 'piece',
        price: item.price,
        name: item.name
      }));
      
      console.log('💳 [Checkout] Processing sale:', {
        items: cartItems.length,
        total: finalTotal,
        discount: discountValue,
        tax: taxAmount
      });
      
      // ====================================================================
      // CALL OPTIMIZED TRANSACTION SERVICE
      // ====================================================================
      const result = await completeSaleTransaction(
        {
          items: cartItems,
          total: finalTotal,
          discount: discountValue,
          tax: taxAmount,
          taxType: taxType,
          paymentMethod: paymentMethod,
          shiftId: currentTimeEntry?.id
        },
        // onOptimisticUpdate - called IMMEDIATELY before API
        (optimisticData) => {
          console.log('⚡ [Checkout] Optimistic update:', optimisticData.action);
          // Clear cart instantly for user feedback
          setCart([]);
          setCartItemUnits({});
          setSelectedDiscount(null);
          setTaxType('exclusive');
        },
        // onSuccess - called with server response
        (successData) => {
          console.log(`✅ [Checkout] Sale completed in ${successData.clientElapsedMs.toFixed(1)}ms ${successData.performanceGrade}`);
          
          // Merge updated products into the existing list so we get fresh
          // stock quantities without losing all the other products.
          if (successData.updatedProducts && successData.updatedProducts.length > 0) {
            const updatedMap = {};
            for (const p of successData.updatedProducts) {
              if (p.id != null) updatedMap[p.id] = p;
            }
            setProductList(prev => {
              const merged = prev.map(p => updatedMap[p.id] ? updatedMap[p.id] : p);
              // Filter visibility after merge
              return merged.filter(p => p.visibleToCashier !== false && !p.expenseOnly);
            });
            console.log('📦 [Checkout] Products merged from server');
          }

          // Always follow up with a full refresh to catch any missed changes
          refreshProducts().then((fresh) => {
            const filtered = Array.isArray(fresh)
              ? fresh.filter(p => p.visibleToCashier !== false && !p.expenseOnly)
              : [];
            if (filtered.length) {
              setProductList(filtered);
              console.log('📦 [Checkout] Products fully refreshed from server');
            }
          }).catch(() => {});
          
          // Invalidate cache to force fresh data on next fetch
          invalidateProductCache();
          
          // Add sale to local data
          const newSale = {
            id: successData.saleId,
            items: cartItems,
            total: finalTotal,
            discount: discountValue,
            tax: taxAmount,
            taxType: taxType,
            paymentMethod: paymentMethod,
            accountId: user?.accountId,
            cashierId: user?.id,
            cashierName: user?.name || 'Cashier',
            stockDeductions: successData.stockDeductions || {},
            createdAt: successData.timestamp || new Date().toISOString()
          };
          
          setData(prev => ({
            ...prev,
            sales: [newSale, ...prev.sales]
          }));
          
          console.log('📢 [Checkout] Dispatching sale_completed event for cashier sync');
          window.dispatchEvent(new CustomEvent('sale_completed', {
            detail: {
              sale: newSale,
              saleId: successData.saleId,
              total: finalTotal,
              timestamp: new Date().toISOString()
            }
          }));
          
          // Show success message – non-blocking toast so the cashier can
          // immediately start the next sale without dismissing a dialog.
          showToast(
            'success',
            `Sale #${successData.saleId} — KSH ${finalTotal.toLocaleString()} (${successData.processingTime || successData.clientElapsedMs?.toFixed(0) + 'ms'})`,
            4000
          );
          
          // Show low stock warnings if any
          if (successData.lowStockWarnings && successData.lowStockWarnings.length > 0) {
            const warnings = successData.lowStockWarnings
              .map(w => `${w.name}: ${w.quantity}${w.unit || ''} left`)
              .join(' · ');
            console.warn('⚠️ [Checkout] Low stock warnings:\n' + warnings);
            setTimeout(() => showToast('warning', `Low Stock: ${warnings}`, 6000), 800);
          }
          
          // Trigger stats refresh
          refreshStats();
        },
        // onError - called on failure
        (errorData) => {
          console.error(`❌ [Checkout] Failed after ${errorData.elapsedMs.toFixed(1)}ms:`, errorData.error);
          
          // Rollback optimistic update if needed
          if (errorData.needsRollback) {
            setCart(savedCart);
            setCartItemUnits(savedCartUnits);
            setSelectedDiscount(savedDiscount);
            setTaxType(savedTaxType);
            console.log('🔄 [Checkout] Rolled back to previous state');
          }
          
          showToast('error', `Sale Failed: ${errorData.error}`, 5000);
        }
      );
      
      console.log('✅ [Checkout] Transaction completed successfully');
      
    } catch (error) {
      console.error('❌ [Checkout] Unexpected error:', error);
      
        // Rollback on unexpected error
      setCart(savedCart);
      setCartItemUnits(savedCartUnits);
      setSelectedDiscount(savedDiscount);
      setTaxType(savedTaxType);
      
      showToast('error', `Checkout Failed: ${error.message || 'Unknown error — cart restored'}`, 5000);
    } finally {
      // Always clear processing states
      setCheckoutLoading(false);
      setIsProcessingSale(false);
    }
  }, [
    cart,
    cartItemUnits,
    checkoutLoading,
    currentTimeEntry?.id,
    handleClockIn,
    isClockedIn,
    paymentMethod,
    refreshProducts,
    refreshStats,
    selectedDiscount,
    showToast,
    taxType,
    user?.accountId,
    user?.id,
    user?.name
  ]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      console.log('➕ Creating new product:', newProduct.name);
      
      // Create the product with visibleToCashier flag
      const createdProduct = await products.create({ 
        ...newProduct, 
        price: parseFloat(newProduct.price),
        cost: parseFloat(newProduct.cost || 0),
        quantity: 0, // Stock managed through batches
        visibleToCashier: true, // ✅ CRITICAL: Make product visible to cashier
        expenseOnly: false // ✅ Not an expense-only item
      });
      
      console.log('✅ Product created:', createdProduct);
      
      // Optimistic update: Add product to the list immediately
      if (createdProduct) {
        setProductList(prev => [...prev, createdProduct]);
      }
      
      // Clear form
      setNewProduct({ name: '', price: '', cost: '', category: 'finished', image: '' });
      setImagePreview('');
      setShowAddProduct(false);
      
      console.log('✅ Product added successfully and visible in POS!');
      alert('✅ Product added successfully!');
    } catch (error) {
      console.error('❌ Failed to add product:', error.message, error);
      alert(`❌ Failed to add product: ${error.message || 'Unknown error'}`);
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      const quantity = parseInt(newStock.quantity);
      if (quantity <= 0) {
        alert('Quantity must be positive');
        return;
      }

      console.log('📦 [AddStock] Adding stock:', {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: quantity,
        currentStock: selectedProduct.quantity
      });

      // Make API call (server is source of truth)
      const result = await batches.create({
        productId: selectedProduct.id,
        quantity: quantity,
        expiryDate: newStock.expiryDate,
        batchNumber: newStock.batchNumber || `BATCH-${Date.now()}`,
        cost: parseFloat(newStock.cost || selectedProduct.cost || 0)
      });
      
      console.log('✅ [AddStock] Stock added successfully:', result);

      const [freshProducts, freshBatches] = await Promise.all([
        refreshProducts ? refreshProducts() : products.getAll(),
        batches.getAll().catch(() => batchList)
      ]);

      const filteredProducts = Array.isArray(freshProducts)
        ? freshProducts.filter(p => p.visibleToCashier !== false && !p.expenseOnly)
        : [];

      if (filteredProducts.length) {
        setProductList(filteredProducts);
      }

      if (Array.isArray(freshBatches)) {
        setBatchList(freshBatches);
      }
      
      // Clear form and close modal
      setNewStock({ quantity: '', expiryDate: '', batchNumber: '', cost: '' });
      setShowAddStock(false);
      setSelectedProduct(null);
      
      // Trigger real-time sync for admin dashboard
      const updatedProduct = filteredProducts.find(p => p.id === selectedProduct.id);
      const updatedQuantity = updatedProduct?.quantity;

      window.dispatchEvent(new CustomEvent('stock_updated', {
        detail: {
          productId: selectedProduct.id,
          newQuantity: updatedQuantity
        }
      }));

      alert(
        `✅ Stock Added Successfully!\n\n` +
        `Product: ${selectedProduct.name}\n` +
        `Added: +${quantity}` +
        (updatedQuantity !== undefined ? `\nNew Total: ${updatedQuantity}` : '')
      );
      
    } catch (error) {
      console.error('❌ [AddStock] Failed:', error);

      alert(`❌ Failed to add stock: ${error.message || 'Unknown error'}`);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const expenseData = { 
        ...newExpense,
        amount: parseFloat(newExpense.amount),
        cashierId: user?.id,
        cashierName: user?.name || user?.email
      };
      await expenses.create(expenseData);
      setNewExpense({ description: '', amount: '', category: '' });
      setShowAddExpense(false);
      
      // Dispatch expense_added event for real-time updates
      window.dispatchEvent(new CustomEvent('expense_added', {
        detail: { expense: expenseData }
      }));
      
      await Promise.all([
        refreshStats(),
        refreshVisibleProducts()
      ]);
    } catch (error) {
      console.error('Failed to add expense:', error);
      alert('Failed to add expense');
    }
  };

  const handleCreditRequest = async (e) => {
    e.preventDefault();
    if (!creditRequestForm.customerName || !creditRequestForm.amount) {
      alert('Please fill in all required fields');
      return;
    }
    
    setCreditRequestSubmitting(true);
    try {
      const response = await creditRequests.create({
        customerName: creditRequestForm.customerName,
        amount: parseFloat(creditRequestForm.amount),
        reason: creditRequestForm.reason,
        notes: creditRequestForm.notes
      });
      
      console.log('✅ Credit request submitted:', response);
      setCreditRequestForm({ customerName: '', amount: '', reason: '', notes: '' });
      setShowCreditRequest(false);
      alert('✅ Credit request submitted successfully!');
    } catch (error) {
      console.error('Failed to submit credit request:', error);
      alert('❌ Failed to submit credit request: ' + (error.message || 'Unknown error'));
    } finally {
      setCreditRequestSubmitting(false);
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
        setData({
          sales: [],
          expenses: [],
          stats: {
            totalSales: 0,
            totalExpenses: 0,
            totalCOGS: 0,
            grossProfit: 0,
            netProfit: 0,
            profit: 0
          }
        });
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
      {/* Sale Toast Notification — non-blocking, auto-dismisses */}
      {saleToast && (
        <div
          key={saleToast.id}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white text-sm font-semibold transition-all animate-bounce-in max-w-md
            ${saleToast.type === 'success' ? 'bg-green-600' : saleToast.type === 'warning' ? 'bg-amber-500' : 'bg-red-600'}`}
        >
          <span>{saleToast.type === 'success' ? '✅' : saleToast.type === 'warning' ? '⚠️' : '❌'}</span>
          <span>{saleToast.message}</span>
          <button onClick={() => setSaleToast(null)} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">&times;</button>
        </div>
      )}
      <LowStockAlert />
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-50 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">Cashier Dashboard</h1>
            <p className="text-xs text-gray-500 mt-0.5">Cashier Plan - KSH 900/month</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="text-left sm:text-right w-full sm:w-auto">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            {isClockedIn && (
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs text-green-600 font-semibold">🟢 Clocked In</p>
                <button onClick={handleClockOut} className="px-4 py-3 sm:py-2 min-h-[44px] rounded-lg font-medium transition-all bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 shadow-md text-sm sm:text-base touch-manipulation">
                  <Square className="w-4 h-4" />
                  Clock Out
                </button>
              </div>
            )}
            {!isClockedIn && (
              <button onClick={handleClockIn} className="px-4 py-3 sm:py-2 min-h-[44px] rounded-lg font-medium transition-all bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 shadow-md text-sm sm:text-base touch-manipulation">
                <Play className="w-4 h-4" />
                Clock In
              </button>
            )}
            <button onClick={() => { saveSessionData(); logout(); }} className="px-4 py-3 sm:py-2 min-h-[44px] rounded-lg font-medium transition-all bg-red-100 hover:bg-red-200 text-red-600 border border-red-300 flex items-center gap-2 text-sm sm:text-base touch-manipulation">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
            <button onClick={handleClearData} className="px-4 py-3 sm:py-2 min-h-[44px] rounded-lg font-medium transition-all bg-orange-100 hover:bg-orange-200 text-orange-600 border border-orange-300 flex items-center gap-2 text-sm sm:text-base touch-manipulation">
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
            <button onClick={() => setShowCreditRequest(true)} className="px-4 py-3 sm:py-2 min-h-[44px] rounded-lg font-medium transition-all bg-blue-100 hover:bg-blue-200 text-blue-600 border border-blue-300 flex items-center gap-2 text-sm sm:text-base touch-manipulation">
              <CreditCard className="w-4 h-4" />
              Request Credit
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

      <div className="flex flex-wrap sm:flex-nowrap gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveView('pos')}
          className={`px-4 sm:px-6 py-3 sm:py-2 min-h-[44px] rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap touch-manipulation ${
            activeView === 'pos' ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <ShoppingCart className="w-4 h-4 inline mr-2" />
          POS
        </button>
        <button
          onClick={() => setActiveView('products')}
          className={`px-4 sm:px-6 py-3 sm:py-2 min-h-[44px] rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap touch-manipulation ${
            activeView === 'products' ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          Products
        </button>
        <button
          onClick={() => setActiveView('expenses')}
          className={`px-4 sm:px-6 py-3 sm:py-2 min-h-[44px] rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap touch-manipulation ${
            activeView === 'expenses' ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <TrendingDown className="w-4 h-4 inline mr-2" />
          Expenses
        </button>
        <button
          onClick={() => {
            setActiveView('reminders');
            fetchReminders();
          }}
          className={`px-4 sm:px-6 py-3 sm:py-2 min-h-[44px] rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap touch-manipulation ${
            activeView === 'reminders' ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Bell className="w-4 h-4 inline mr-2" />
          Reminders
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
                const lowStockThreshold = getLowStockThreshold(product);
                const isLowStock = stock > 0 && stock <= lowStockThreshold;
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
                        isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        Stock: {stock}
                      </p>
                      {isOutOfStock ? (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                          Low Stock
                        </span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                          In Stock
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
                      <div className="flex items-center justify-between mb-2">
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
                      
                      {/* UNIT SELECTOR */}
                      <div className="flex gap-2 items-center mt-2">
                        <label className="text-xs font-semibold text-gray-600">Unit:</label>
                        <select 
                          value={cartItemUnits[item.id] || item.unit || 'piece'}
                          onChange={(e) => {
                            setCartItemUnits({
                              ...cartItemUnits,
                              [item.id]: e.target.value
                            });
                          }}
                          className="text-xs px-2 py-1 border border-gray-300 rounded bg-white"
                        >
                          <option value="piece">Piece</option>
                          <option value="kg">Kilogram (kg)</option>
                          <option value="g">Grams (g)</option>
                          <option value="l">Liters (L)</option>
                        </select>
                        <input 
                          type="number" 
                          step="0.01"
                          min="0.01"
                          max="999"
                          placeholder="qty"
                          defaultValue={item.quantity}
                          className="text-xs px-2 py-1 border border-gray-300 rounded w-16"
                          onChange={(e) => {
                            const newQty = parseFloat(e.target.value);
                            if (!isNaN(newQty) && newQty > 0) {
                              updateQuantity(item.id, newQty - item.quantity);
                            }
                          }}
                        />
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
                  className="input h-12 text-base touch-manipulation"
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
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input className="h-5 w-5" type="radio" value="exclusive" checked={taxType === 'exclusive'} onChange={(e) => setTaxType(e.target.value)} />
                    <span className="text-sm">Tax Exclusive (16% added)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input className="h-5 w-5" type="radio" value="inclusive" checked={taxType === 'inclusive'} onChange={(e) => setTaxType(e.target.value)} />
                    <span className="text-sm">Tax Inclusive</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Payment Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="input h-12 text-base touch-manipulation">
                  <option value="cash">Cash</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="card">Card</option>
                </select>
              </div>

              <button 
                onClick={() => {
                  try {
                    console.log('🛒 Complete Sale button clicked');
                    handleCheckout();
                  } catch (err) {
                    console.error('❌ Button handler error:', err);
                    alert(`Error: ${err.message}`);
                  }
                }} 
                disabled={cart.length === 0 || checkoutLoading} 
                className="btn-primary w-full py-4 sm:py-3 min-h-[52px] sm:min-h-[48px] text-base sm:text-lg bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 touch-manipulation"
              >
                {checkoutLoading ? '⏳ Processing...' : 'Checkout'}
              </button>
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
                    const lowStockThreshold = getLowStockThreshold(product);
                    const isLowStock = stock > 0 && stock <= lowStockThreshold;
                    const isOutOfStock = stock <= 0;
                    
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
                              isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-green-700'
                            }`}>
                              {stock}
                            </span>
                            {isLowStock && !isOutOfStock && (
                              <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            )}
                            {isOutOfStock ? (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                                Out of Stock
                              </span>
                            ) : isLowStock ? (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                                Low Stock
                              </span>
                            ) : (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                                In Stock
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

      {activeView === 'reminders' && (
        <div className="p-6 max-w-5xl mx-auto w-full">
          <div className="card shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Reminders</h3>
              </div>
              <button onClick={fetchReminders} className="btn-secondary">Refresh</button>
            </div>

            {remindersLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : reminderList.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No reminders for you right now</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reminderList.map((reminder) => (
                  <div key={reminder.id} className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{reminder.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{reminder.message}</p>
                        <p className="text-xs text-gray-500 mt-2">Priority: {reminder.priority || 'normal'}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${(reminder.status || 'pending') === 'pending' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {reminder.status || 'pending'}
                      </span>
                    </div>

                    <div className="mt-4 bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3 text-gray-700 font-semibold">
                        <PenSquare size={16} />
                        Cashier Note & Signature
                      </div>
                      <textarea
                        rows={2}
                        className="w-full px-3 py-2 border rounded-lg text-sm mb-3"
                        placeholder="Write a short note (optional)"
                        value={reminderNotes[reminder.id] ?? reminder.cashier_note ?? ''}
                        onChange={(e) => setReminderNotes({ ...reminderNotes, [reminder.id]: e.target.value })}
                      />
                      <SignaturePad
                        value={reminderSignatures[reminder.id] ?? reminder.cashier_signature ?? ''}
                        onChange={(value) => setReminderSignatures({ ...reminderSignatures, [reminder.id]: value })}
                      />
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {reminder.cashier_signed_at ? `Signed: ${new Date(reminder.cashier_signed_at).toLocaleString()}` : 'Not signed yet'}
                        </span>
                        <button
                          onClick={() => saveReminderSignature(reminder.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
                        >
                          Save Signature
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Credit Request Modal */}
      {showCreditRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-96 overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white flex justify-between items-center sticky top-0">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <CreditCard />
                Request Credit
              </h2>
              <button onClick={() => setShowCreditRequest(false)} className="hover:bg-white/20 p-2 rounded-lg transition">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreditRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Customer Name *</label>
                <input
                  type="text"
                  placeholder="Enter customer name"
                  value={creditRequestForm.customerName}
                  onChange={(e) => setCreditRequestForm({ ...creditRequestForm, customerName: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={creditRequestSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Amount (KES) *</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={creditRequestForm.amount}
                  onChange={(e) => setCreditRequestForm({ ...creditRequestForm, amount: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                  required
                  disabled={creditRequestSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Reason</label>
                <select
                  value={creditRequestForm.reason}
                  onChange={(e) => setCreditRequestForm({ ...creditRequestForm, reason: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={creditRequestSubmitting}
                >
                  <option value="">Select reason...</option>
                  <option value="regular_customer">Regular Customer</option>
                  <option value="emergency">Emergency</option>
                  <option value="bulk_order">Bulk Order</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  placeholder="Add any additional notes..."
                  value={creditRequestForm.notes}
                  onChange={(e) => setCreditRequestForm({ ...creditRequestForm, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  disabled={creditRequestSubmitting}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={creditRequestSubmitting}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creditRequestSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreditRequest(false)}
                  disabled={creditRequestSubmitting}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition disabled:opacity-50"
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
