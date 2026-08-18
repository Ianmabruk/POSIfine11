import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductsContext';
import { products, sales, expenses, stats, batches, discounts, timeEntries, creditRequests, reminders } from '../services/api';
import websocketService from '../services/websocketService';
import { BASE_API_URL } from '../services/api';
import { 
  completeSaleTransaction, 
  invalidateProductCache 
} from '../services/transactionService';
import { 
  ShoppingCart, Trash2, LogOut, Plus, Minus, TrendingDown, Package,
  Search, AlertTriangle, Clock, Play, Square, CreditCard, X,
  Bell, Loader2, Home, Menu, History, Receipt, Share2, Printer, CheckCircle2,
  ChevronRight, Banknote, ShoppingBag, ArrowLeft, RefreshCw, Smartphone, Landmark
} from 'lucide-react';
import LowStockAlert from '../components/LowStockAlert';
import EmptyState from '../components/ui/EmptyState';
import BottomNavBar from '../components/cashier/BottomNavBar';

const TAX_RATE = 0.16;

const useCashierCalculations = (cart, selectedDiscount, taxType) => {
  return useMemo(() => {
    const subtotal = cart.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return sum + (price * quantity);
    }, 0);

    const discountAmount = selectedDiscount
      ? selectedDiscount.type === 'percentage'
        ? (subtotal * Number(selectedDiscount.value) / 100)
        : Number(selectedDiscount.value)
      : 0;

    const safeDiscount = Math.max(0, Math.min(discountAmount, subtotal));
    const afterDiscount = Math.max(0, subtotal - safeDiscount);

    let taxAmount = 0;
    let finalTotal = 0;

    if (taxType === 'inclusive') {
      taxAmount = Math.round(((afterDiscount / (1 + TAX_RATE)) * TAX_RATE) * 100) / 100;
      finalTotal = Math.round(afterDiscount * 100) / 100;
    } else {
      taxAmount = Math.round((afterDiscount * TAX_RATE) * 100) / 100;
      finalTotal = Math.round((afterDiscount + taxAmount) * 100) / 100;
    }

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: Math.round(safeDiscount * 100) / 100,
      taxAmount,
      finalTotal,
      itemCount: cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
    };
  }, [cart, selectedDiscount, taxType]);
};

export default function MobileCashier() {
  const { user, logout } = useAuth();
  const { products: globalProducts, refreshProducts } = useProducts();

  // Tab state: home | sales | cart | more
  const [activeTab, setActiveTab] = useState('home');
  // Screen state for checkout flow: home | sales | cart | more | payment | success
  const [currentScreen, setCurrentScreen] = useState('home');

  // Core state (mirrors CashierPOS)
  const [productList, setProductList] = useState([]);
  const [batchList, setBatchList] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [taxType, setTaxType] = useState('exclusive');
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
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentTimeEntry, setCurrentTimeEntry] = useState(null);
  const [clockedInTime, setClockedInTime] = useState(null);
  const [cartItemUnits, setCartItemUnits] = useState({});
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [lastProductUpdate, setLastProductUpdate] = useState(Date.now());
  const [productUpdateCount, setProductUpdateCount] = useState(0);
  const [reminderList, setReminderList] = useState([]);
  const [reminderNotes, setReminderNotes] = useState({});
  const [reminderSignatures, setReminderSignatures] = useState({});
  const [remindersLoading, setRemindersLoading] = useState(false);
  const remindersLoadedRef = useRef(false);
  const [saleToast, setSaleToast] = useState(null);
  const toastTimerRef = useRef(null);
  const productRefreshTimeoutRef = useRef(null);
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const searchTimeoutRef = useRef(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [amountReceived, setAmountReceived] = useState('');
  const [showClearCartModal, setShowClearCartModal] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [salesHistory, setSalesHistory] = useState([]);
  const [salesHistoryLoading, setSalesHistoryLoading] = useState(false);

  useEffect(() => {
    setSearchLoading(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setSearchLoading(false);
    }, 150);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchTerm]);

  useEffect(() => {
    setProductsLoading(true);
    const timer = setTimeout(() => setProductsLoading(false), 200);
    return () => clearTimeout(timer);
  }, [productList.length, productUpdateCount]);

  const calc = useCashierCalculations(cart, selectedDiscount, taxType);

  const changeAmount = useMemo(() => {
    const received = parseFloat(amountReceived);
    if (isNaN(received) || received < 0) return null;
    return Math.round((received - calc.finalTotal) * 100) / 100;
  }, [amountReceived, calc.finalTotal]);

  const clearCart = useCallback(() => {
    setCart([]);
    setCartItemUnits({});
    setSelectedDiscount(null);
    setTaxType('exclusive');
    setAmountReceived('');
    setShowClearCartModal(false);
    }, []);

  // Extract categories from products
  const extractCategories = useCallback(() => {
    const cats = new Set();
    productList.forEach(p => {
      if (p.category && p.category !== 'expense' && p.category !== 'raw') {
        cats.add(p.category);
      }
    });
    return ['all', ...Array.from(cats)];
  }, [productList]);

  useEffect(() => {
    setCategories(extractCategories());
  }, [extractCategories]);

  // Filtered products based on category and search
  const filteredProducts = useMemo(() => {
    let filtered = productList;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    if (debouncedSearchTerm) {
      filtered = filtered.filter(p => p.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
    }
    return filtered;
  }, [productList, selectedCategory, debouncedSearchTerm]);

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

    const savedCart = localStorage.getItem(`cart_${user?.id}`);
    const savedPaymentMethod = localStorage.getItem(`paymentMethod_${user?.id}`);
    const savedTaxType = localStorage.getItem(`taxType_${user?.id}`);
    const savedDiscount = localStorage.getItem(`selectedDiscount_${user?.id}`);

    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) { console.warn('Failed to restore cart:', e); }
    }
    if (savedPaymentMethod) setPaymentMethod(savedPaymentMethod);
    if (savedTaxType) setTaxType(savedTaxType);
    if (savedDiscount) {
      try { setSelectedDiscount(JSON.parse(savedDiscount)); } catch (e) {}
    }

    const handleStockUpdated = (event) => {
      console.log('📦 Stock update event received:', event.detail);
      scheduleProductRefresh();
    };

    const handleProductsSync = (event) => {
      console.log('🔄 Products sync event received:', event.detail);
      if (event.detail && Array.isArray(event.detail.products)) {
        const filtered = event.detail.products.filter(p => p.visibleToCashier !== false && !p.expenseOnly);
        setProductList(filtered);
      }
    };

    const handleProductUpdated = () => {
      console.log('📝 Product update event received');
      scheduleProductRefresh();
    };

    const handleReminderBroadcast = () => { fetchReminders(); };

    const handleSaleCompleted = () => {
      console.log('💹 Sale completed event received - refreshing stats');
      scheduleProductRefresh();
      refreshStats();
    };

    const handleExpenseAdded = () => {
      console.log('💸 Expense added event received - refreshing stats');
      refreshStats();
    };

    window.addEventListener('stock_updated', handleStockUpdated);
    window.addEventListener('productsSync', handleProductsSync);
    window.addEventListener('productUpdated', handleProductUpdated);
    window.addEventListener('productCreated', handleProductUpdated);
    window.addEventListener('reminder_created', handleReminderBroadcast);
    window.addEventListener('sale_completed', handleSaleCompleted);
    window.addEventListener('expense_added', handleExpenseAdded);

    return () => {
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

  useEffect(() => {
    if (globalProducts) {
      const visibleProducts = globalProducts.filter(p => p.visibleToCashier !== false && !p.expenseOnly && !p.pendingDelete);
      const currentProductIds = productList.map(p => p.id).sort().join(',');
      const newProductIds = visibleProducts.map(p => p.id).sort().join(',');
      const currentProductHash = productList.map(p => `${p.id}:${p.quantity}`).sort().join('|');
      const newProductHash = visibleProducts.map(p => `${p.id}:${p.quantity}`).sort().join('|');
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    let wsUpdateTimeout = null;

    if (token) {
      websocketService.connect(token, (data) => {
        console.log('📡 WebSocket callback received:', data);
        if (data && Array.isArray(data.allProducts)) {
          if (wsUpdateTimeout) clearTimeout(wsUpdateTimeout);
          wsUpdateTimeout = setTimeout(() => {
            const filtered = data.allProducts.filter(p => p.visibleToCashier !== false && !p.expenseOnly);
            setProductList(filtered);
          }, 300);
        }
        if (data && data.productId !== undefined && data.newQuantity !== undefined) {
          console.log(`📦 Stock update for product ${data.productId}: ${data.newQuantity}${data.unit || ''}`);
          setProductList(prev => {
            const updated = prev.map(p => p.id === data.productId ? { ...p, quantity: data.newQuantity } : p);
            return updated;
          });
        }
        if (data && data.discounts) {
          console.log('📊 Discount list updated');
          setDiscountList(data.discounts);
        }
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
        discounts.getAll().catch(() => [])
      ]);
      const safeProducts = Array.isArray(p) ? p : [];
      const safeSales = Array.isArray(s) ? s : [];
      const safeExpenses = Array.isArray(e) ? e : [];
      const safeBatches = Array.isArray(b) ? (b.items || b) : [];
      const filteredProducts = safeProducts.filter(prod => prod.visibleToCashier !== false && !prod.expenseOnly);
      setProductList(filteredProducts);
      setData({ sales: safeSales, expenses: safeExpenses, stats: st || {} });
      setBatchList(safeBatches);
      setDiscountList(Array.isArray(d) ? d : []);
      persistCashierSnapshot({
        productList: filteredProducts,
        sales: safeSales,
        expenses: safeExpenses,
        stats: st || {},
        batchList: safeBatches,
        discountList: Array.isArray(d) ? d : []
      });
      console.log('✅ Data loaded:', {
        products: filteredProducts.length,
        sales: safeSales.length,
        expenses: safeExpenses.length,
        batches: safeBatches.length,
        discounts: (Array.isArray(d) ? d : []).length
      });
    } catch (error) {
      console.error('❌ Failed to load data:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to connect to server';
      hydrateCashierSnapshot();
      if (!productList.length) {
        showToast('error', `Failed to load data: ${errorMsg}`);
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
        return { ...prev, stats: merged };
      });
    } catch (error) {
      console.warn('Stats refresh failed:', error);
    }
  };

  const fetchReminders = async (showSpinner = true) => {
    try {
      if (showSpinner && !remindersLoadedRef.current) setRemindersLoading(true);
      const data = await reminders.getToday();
      setReminderList(Array.isArray(data) ? data : []);
      remindersLoadedRef.current = true;
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
      setReminderList([]);
    } finally {
      setRemindersLoading(false);
    }
  };

   const loadSalesHistory = async () => {
    setSalesHistoryLoading(true);
    try {
      const salesData = await sales.getAll();
      const safeSales = Array.isArray(salesData) ? salesData : [];
      setSalesHistory(safeSales);
      console.log('📊 Loaded sales history:', safeSales.length);
    } catch (error) {
      console.error('Failed to load sales history:', error);
      setSalesHistory([]);
    } finally {
      setSalesHistoryLoading(false);
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
      showToast('error', 'Failed to save reminder. Please try again.');
    }
  };

  const handleImageUpload = (e, isNewProduct = true) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        setImagePreview(base64);
        if (isNewProduct) { setNewProduct({ ...newProduct, image: base64 }); }
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
    const productBatches = batchList.filter(b => b.productId === productId && b.quantity > 0).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return productBatches[0] || null;
  };

  const addToCart = useCallback((product) => {
    const availableStock = getProductStock(product.id);
    if (availableStock <= 0) { showToast('error', 'Product is out of stock!'); return; }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      const currentCartQty = existing ? existing.quantity : 0;
      if (currentCartQty >= availableStock) { showToast('warning', `Only ${availableStock} units available in stock!`); return prev; }
      if (existing) { return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item); }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, [getProductStock]);

  const updateQuantity = useCallback((id, delta) => {
    const availableStock = getProductStock(id);
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty > availableStock) { showToast('warning', `Only ${availableStock} units available!`); return item; }
        return { ...item, quantity: Math.max(1, newQty) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  }, [getProductStock]);

  const removeFromCart = useCallback((id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleCheckout = useCallback(async () => {
    console.log('🛒 [Checkout] Starting optimized checkout flow');
    if (cart.length === 0) { showToast('error', 'Cart is empty! Add products first.'); return; }
    if (checkoutLoading) { console.log('⚠️ [Checkout] Already processing, please wait...'); return; }
    if (!isClockedIn) {
      const proceed = confirm('⚠️ You are not clocked in!\n\nDo you want to clock in now before completing the sale?');
      if (proceed) { await handleClockIn(); }
    }
    setCheckoutLoading(true);
    setIsProcessingSale(true);
    const savedCart = [...cart];
    const savedCartUnits = {...cartItemUnits};
    const savedDiscount = selectedDiscount;
    const savedTaxType = taxType;
    try {
      const cartItems = cart.map(item => ({
        productId: item.id, quantity: item.quantity, unit: cartItemUnits[item.id] || item.unit || 'piece', price: item.price, name: item.name
      }));
      console.log('💳 [Checkout] Processing sale:', { items: cartItems.length, total: calc.finalTotal, discount: calc.discountAmount, tax: calc.taxAmount });
      const result = await completeSaleTransaction(
        { items: cartItems, total: calc.finalTotal, discount: calc.discountAmount, tax: calc.taxAmount, taxType: taxType, paymentMethod: paymentMethod, shiftId: currentTimeEntry?.id, amountReceived: paymentMethod === 'cash' ? (parseFloat(amountReceived) || 0) : null },
        (optimisticData) => { console.log('⚡ [Checkout] Optimistic update:', optimisticData.action); setCart([]); setCartItemUnits({}); setSelectedDiscount(null); setTaxType('exclusive'); },
        (successData) => {
          console.log(`✅ [Checkout] Sale completed in ${successData.clientElapsedMs.toFixed(1)}ms ${successData.performanceGrade}`);
          if (successData.updatedProducts && successData.updatedProducts.length > 0) {
            const updatedMap = {};
            for (const p of successData.updatedProducts) { if (p.id != null) updatedMap[p.id] = p; }
            setProductList(prev => { const merged = prev.map(p => updatedMap[p.id] ? updatedMap[p.id] : p); return merged.filter(p => p.visibleToCashier !== false && !p.expenseOnly); });
            console.log('📦 [Checkout] Products merged from server');
          }
          refreshProducts().then((fresh) => {
            const filtered = Array.isArray(fresh) ? fresh.filter(p => p.visibleToCashier !== false && !p.expenseOnly) : [];
            if (filtered.length) { setProductList(filtered); console.log('📦 [Checkout] Products fully refreshed from server'); }
          }).catch(() => {});
          invalidateProductCache();
          const newSale = {
            id: successData.saleId,
            items: cartItems,
            total: calc.finalTotal,
            discount: calc.discountAmount,
            tax: calc.taxAmount,
            taxType: taxType,
            paymentMethod: paymentMethod,
            accountId: user?.accountId,
            cashierId: user?.id,
            cashierName: user?.name || 'Cashier',
            stockDeductions: successData.stockDeductions || {},
            createdAt: successData.timestamp || new Date().toISOString()
          };
           setData(prev => ({ ...prev, sales: [newSale, ...prev.sales] }));
          setCurrentScreen('success');
          console.log('📢 [Checkout] Dispatching sale_completed event for cashier sync');
          window.dispatchEvent(new CustomEvent('sale_completed', {
            detail: { sale: newSale, saleId: successData.saleId, total: calc.finalTotal, timestamp: new Date().toISOString() }
          }));
          showToast('success', `Sale #${successData.saleId} — KSH ${calc.finalTotal.toLocaleString()} (${successData.processingTime || successData.clientElapsedMs?.toFixed(0) + 'ms'})`, 4000);
          if (successData.lowStockWarnings && successData.lowStockWarnings.length > 0) {
            const warnings = successData.lowStockWarnings.map(w => `${w.name}: ${w.quantity}${w.unit || ''} left`).join(' · ');
            console.warn('⚠️ [Checkout] Low stock warnings:\n' + warnings);
            setTimeout(() => showToast('warning', `Low Stock: ${warnings}`, 6000), 800);
          }
          refreshStats();
        },
        (errorData) => {
          console.error(`❌ [Checkout] Failed after ${errorData.elapsedMs.toFixed(1)}ms:`, errorData.error);
          if (errorData.needsRollback) { setCart(savedCart); setCartItemUnits(savedCartUnits); setSelectedDiscount(savedDiscount); setTaxType(savedTaxType); console.log('🔄 [Checkout] Rolled back to previous state'); }
          showToast('error', `Sale Failed: ${errorData.error}`, 5000);
        }
      );
      console.log('✅ [Checkout] Transaction completed successfully');
    } catch (error) {
      console.error('❌ [Checkout] Unexpected error:', error);
      setCart(savedCart);
      setCartItemUnits(savedCartUnits);
      setSelectedDiscount(savedDiscount);
      setTaxType(savedTaxType);
      showToast('error', `Checkout Failed: ${error.message || 'Unknown error — cart restored'}`, 5000);
    } finally {
      setCheckoutLoading(false);
      setIsProcessingSale(false);
    }
  }, [cart, cartItemUnits, checkoutLoading, currentTimeEntry?.id, handleClockIn, isClockedIn, paymentMethod, refreshProducts, refreshStats, showToast, taxType, user?.accountId, user?.id, user?.name, calc]);

  const handleCompleteSale = useCallback(() => {
    handleCheckout();
  }, [handleCheckout]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const price = Number(newProduct.price);
      if (!Number.isFinite(price) || price < 0) { showToast('error', 'Please enter a valid price'); return; }
      console.log('➕ Creating new product:', newProduct.name);
      const createdProduct = await products.create({ ...newProduct, price, cost: Number(newProduct.cost || 0), quantity: 0, visibleToCashier: true, expenseOnly: false });
      console.log('✅ Product created:', createdProduct);
      if (createdProduct) { setProductList(prev => [...prev, createdProduct]); }
      setNewProduct({ name: '', price: '', cost: '', category: 'finished', image: '' });
      setImagePreview('');
      setShowAddProduct(false);
      console.log('✅ Product added successfully and visible in POS!');
      showToast('success', 'Product added successfully!');
    } catch (error) {
      console.error('❌ Failed to add product:', error.message, error);
      alert(`❌ Failed to add product: ${error.message || 'Unknown error'}`);
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      const quantity = parseInt(newStock.quantity);
      if (quantity <= 0) { showToast('error', 'Quantity must be positive'); return; }
      console.log('📦 [AddStock] Adding stock:', { productId: selectedProduct.id, productName: selectedProduct.name, quantity, currentStock: selectedProduct.quantity });
      const result = await batches.create({ productId: selectedProduct.id, quantity, expiryDate: newStock.expiryDate, batchNumber: newStock.batchNumber || `BATCH-${Date.now()}`, cost: parseFloat(newStock.cost || selectedProduct.cost || 0) });
      console.log('✅ [AddStock] Stock added successfully:', result);
      const [freshProducts, freshBatches] = await Promise.all([
        refreshProducts ? refreshProducts() : products.getAll(),
        batches.getAll().catch(() => batchList)
      ]);
      const filteredProducts = Array.isArray(freshProducts) ? freshProducts.filter(p => p.visibleToCashier !== false && !p.expenseOnly) : [];
      if (filteredProducts.length) { setProductList(filteredProducts); }
      if (Array.isArray(freshBatches)) { setBatchList(freshBatches); }
      setNewStock({ quantity: '', expiryDate: '', batchNumber: '', cost: '' });
      setShowAddStock(false);
      setSelectedProduct(null);
      const updatedProduct = filteredProducts.find(p => p.id === selectedProduct.id);
      const updatedQuantity = updatedProduct?.quantity;
      window.dispatchEvent(new CustomEvent('stock_updated', { detail: { productId: selectedProduct.id, newQuantity: updatedQuantity } }));
      showToast('success', `Stock Added Successfully! +${quantity} units`);
    } catch (error) {
      console.error('❌ [AddStock] Failed:', error);
      showToast('error', `Failed to add stock: ${error.message || 'Unknown error'}`);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const expenseData = { ...newExpense, amount: parseFloat(newExpense.amount), cashierId: user?.id, cashierName: user?.name || user?.email };
      await expenses.create(expenseData);
      setNewExpense({ description: '', amount: '', category: '' });
      setShowAddExpense(false);
      window.dispatchEvent(new CustomEvent('expense_added', { detail: { expense: expenseData } }));
      await Promise.all([refreshStats(), refreshVisibleProducts()]);
    } catch (error) {
      console.error('Failed to add expense:', error);
      showToast('error', 'Failed to add expense');
    }
  };

  const handleCreditRequest = async (e) => {
    e.preventDefault();
    if (!creditRequestForm.customerName || !creditRequestForm.amount || !creditRequestForm.reason) {
      showToast('error', 'Please fill in all required fields (Customer Name, Amount, and Reason)');
      return;
    }
    setCreditRequestSubmitting(true);
    try {
      const response = await creditRequests.create({ customerName: creditRequestForm.customerName, amount: parseFloat(creditRequestForm.amount), reason: creditRequestForm.reason, notes: creditRequestForm.notes });
      console.log('✅ Credit request submitted:', response);
      setCreditRequestForm({ customerName: '', amount: '', reason: '', notes: '' });
      setShowCreditRequest(false);
      showToast('success', 'Credit request submitted successfully!');
    } catch (error) {
      console.error('Failed to submit credit request:', error);
      showToast('error', `Failed to submit credit request: ${error.message || 'Unknown error'}`);
    } finally {
      setCreditRequestSubmitting(false);
    }
  };

  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to clear all sales and expenses? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        const API_URL = BASE_API_URL;
        const response = await fetch(`${API_URL}/clear-data`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'all' }) });
        if (!response.ok) { const error = await response.json(); throw new Error(error.message || 'Failed to clear data'); }
        setData({ sales: [], expenses: [], stats: { totalSales: 0, totalExpenses: 0, totalCOGS: 0, grossProfit: 0, netProfit: 0, profit: 0 } });
        setCart([]);
        showToast('success', 'Data cleared successfully!');
        await loadData();
      } catch (error) {
        console.error('Failed to clear data:', error);
        showToast('error', 'Failed to clear data: ' + error.message);
       }
    }
  };

  // ---------- Screens ----------

  const handlePrintReceipt = () => {
    const lastSale = data.sales[0];
    if (!lastSale) return;
    const printContent = `
      <div style="font-family: monospace; max-width: 300px; margin: 0 auto; padding: 16px;">
        <h2 style="text-align: center;">POSIFY</h2>
        <p style="text-align: center;">Receipt #${lastSale.id ? 'INV-' + String(lastSale.id).padStart(6, '0') : ''}</p>
        <hr/>
        <p>Date: ${new Date(lastSale.createdAt).toLocaleString()}</p>
        <p>Cashier: ${lastSale.cashierName || user?.name || '—'}</p>
        <hr/>
        <p>Total: KSH ${calc.finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        <p>Paid: KSH ${paymentMethod === 'cash' && !isNaN(parseFloat(amountReceived)) ? parseFloat(amountReceived).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : calc.finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        <p>Change: KSH ${changeAmount != null ? changeAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</p>
        <p>Payment: ${(lastSale.paymentMethod || paymentMethod).toUpperCase()}</p>
        <hr/>
        <p style="text-align: center;">Thank you for your purchase!</p>
      </div>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.title = `Receipt #${lastSale.id}`;
      printWindow.onload = () => { printWindow.print(); printWindow.close(); };
    }
  };

  const handleShareReceipt = () => {
    const lastSale = data.sales[0];
    if (!lastSale) return;
    const text = `POSIFY Receipt\n\nReceipt #${lastSale.id ? 'INV-' + String(lastSale.id).padStart(6, '0') : ''}\nDate: ${new Date(lastSale.createdAt).toLocaleString()}\nCashier: ${lastSale.cashierName || user?.name || '—'}\nTotal: KSH ${calc.finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\nPaid: KSH ${paymentMethod === 'cash' && !isNaN(parseFloat(amountReceived)) ? parseFloat(amountReceived).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : calc.finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\nChange: KSH ${changeAmount != null ? changeAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}\nPayment: ${paymentMethod.toUpperCase()}`;
    if (navigator.share) {
      navigator.share({ title: `Receipt #${lastSale.id}`, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => showToast('success', 'Receipt copied to clipboard'));
    }
  };

  const HomeScreen = () => {
    const handleNewSale = () => {
      setCart([]);
      setCartItemUnits({});
      setSelectedDiscount(null);
      setTaxType('exclusive');
      setAmountReceived('');
      setActiveTab('sales');
      setCurrentScreen('sales');
    };

    return (
      <div className="pb-20 bg-gray-50 min-h-screen">
        <div className="p-4 space-y-4">
          {/* Today's Summary - compact card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-900 mb-3 text-sm">Today's Summary</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Sales</p>
                <p className="font-bold text-green-600">{data.stats?.totalSales ? data.stats.totalSales.toLocaleString() : '0'}</p>
              </div>
              <div>
                <p className="text-gray-500">Expenses</p>
                <p className="font-bold text-red-600">{data.stats?.totalExpenses ? data.stats.totalExpenses.toLocaleString() : '0'}</p>
              </div>
              <div>
                <p className="text-gray-500">Profit</p>
                <p className="font-bold text-teal-600">{data.stats?.netProfit != null ? data.stats.netProfit.toLocaleString() : '0'}</p>
              </div>
              <div>
                <p className="text-gray-500">COGS</p>
                <p className="font-bold text-orange-600">{data.stats?.totalCOGS ? data.stats.totalCOGS.toLocaleString() : '0'}</p>
              </div>
            </div>
          </div>

          {/* Low Stock Alerts */}
          {productList.filter(p => {
            const stock = getProductStock(p.id);
            const threshold = getLowStockThreshold(p);
            return stock <= 0 || (stock > 0 && stock <= threshold);
          }).length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">Low Stock Alerts</h4>
              {productList.filter(p => {
                const stock = getProductStock(p.id);
                const threshold = getLowStockThreshold(p);
                return stock <= 0 || (stock > 0 && stock <= threshold);
              }).slice(0, 3).map(p => (
                <div key={p.id} className="flex items-center gap-2 my-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate">{p.name}</span>
                  {getProductStock(p.id) <= 0 && <span className="text-xs text-red-600 font-medium">Out of stock</span>}
                </div>
              ))}
            </div>
          )}

          {/* New Sale Button */}
          <button
            onClick={handleNewSale}
            className="w-full py-5 min-h-[60px] text-xl font-bold text-white bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl shadow-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200 touch-manipulation flex items-center justify-center gap-3"
          >
            <Plus className="w-6 h-6" />
            New Sale
          </button>

          {/* Quick Stats Grid - Compact */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{productList.filter(p => getProductStock(p.id) > 0).length}</div>
              <p className="text-xs text-gray-500">Available Products</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">{data.sales.length}</div>
              <p className="text-xs text-gray-500">Total Sales</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SalesScreen = () => {
    return (
      <div className="pb-20 bg-gray-50 min-h-screen">
        {/* Sticky search header */}
        <div className="p-4 bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-10 pr-10 h-12 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              inputMode="search"
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Category chips - horizontal scrollable */}
        {categories.length > 1 && (
          <div className="py-3 px-4 bg-white border-b border-gray-100 overflow-x-auto">
            <div className="flex gap-2 pb-1">
              {categories.map(cat => {
                const isActive = selectedCategory === cat;
                const label = cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1);
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all min-h-[44px] min-w-[44px] touch-manipulation ${
                      isActive
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Product list */}
        <div className="p-4">
          {productsLoading && productList.length === 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="w-full h-28 bg-gray-100 animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                    <div className="h-8 bg-gray-200 rounded w-full animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No products found</h3>
              <p className="text-sm text-gray-500 mb-4">
                {debouncedSearchTerm
                  ? `No products match "${debouncedSearchTerm}"`
                  : selectedCategory !== 'all'
                  ? `No products in ${selectedCategory} category`
                  : 'No products available'}
              </p>
              <button
                onClick={() => setShowAddProduct(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-xl font-medium min-h-[44px] touch-manipulation"
              >
                Add Product
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map(product => {
                const stock = getProductStock(product.id);
                const lowStockThreshold = getLowStockThreshold(product);
                const isLowStock = stock > 0 && stock <= lowStockThreshold;
                const isOutOfStock = stock <= 0;
                const isComposite = Boolean(product?.isComposite || product?.is_composite);
                const availableCount = isComposite ? (product?.maxUnits ?? 0) : (product?.quantity ?? 0);

                return (
                  <button
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    disabled={isOutOfStock}
                    className={`
                      relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden
                      text-left transition-all duration-200 active:scale-95
                      ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md active:translate-y-0'}
                      touch-manipulation
                    `}
                  >
                    {/* Image */}
                    <div className="relative w-full h-28 bg-gradient-to-br from-gray-50 to-gray-100 flex-shrink-0">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                      {isLowStock && !isOutOfStock && (
                        <div className="absolute top-1 right-1 bg-amber-500 text-white p-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                        </div>
                      )}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                            OUT OF STOCK
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3">
                      <h3 className="font-semibold text-sm text-gray-900 truncate mb-1">{product.name}</h3>
                      <p className="text-xs text-gray-500 capitalize mb-2">{product.category}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-600">
                          KSH {product.price?.toLocaleString() || 0}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          stock <= 0 ? 'text-red-600 bg-red-50' : isLowStock ? 'text-amber-600 bg-amber-50' : 'text-green-600 bg-green-50'
                        }`}>
                          {stock} in stock
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const CartScreen = () => {
    return (
      <div className="pb-24 bg-gray-50 min-h-screen">
        {/* Sticky Cart Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
          <button
            onClick={() => setCurrentScreen('home')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors min-h-[44px] min-w-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Cart</span>
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{cart.length} item{cart.length !== 1 ? 's' : ''}</span>
            {cart.length > 0 && (
              <button
                onClick={() => setShowClearCartModal(true)}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Clear cart"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="p-4">
          {/* Cart items */}
          <div className="mb-6">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                  <ShoppingCart className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-1">Cart is empty</h3>
                <p className="text-sm text-gray-500">Tap products to add them</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => {
                  const itemTotal = item.price * item.quantity;
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="font-semibold text-sm text-gray-900 truncate">{item.name}</p>
                          <p className="text-xs text-gray-500">KSH {item.price?.toLocaleString()} each</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
                          aria-label={`Remove ${item.name}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all min-h-[44px] min-w-[44px]"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-5 h-5 text-gray-600" />
                          </button>
                          <span className="w-10 text-center font-bold text-gray-900 text-lg min-w-[40px]">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-10 h-10 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center hover:bg-green-100 active:scale-95 transition-all min-h-[44px] min-w-[44px]"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-5 h-5 text-green-600" />
                          </button>
                        </div>
                        <span className="font-bold text-green-600 text-lg">
                          KSH {itemTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Order Summary & Controls */}
          {cart.length > 0 && (
            <div className="space-y-4">
              {/* Order Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900 font-medium">KSH {calc.subtotal.toLocaleString()}</span>
                  </div>
                  {selectedDiscount && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({selectedDiscount.name})</span>
                      <span>-KSH {calc.discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-orange-600">
                    <span>Tax (16% {taxType === 'inclusive' ? 'included' : 'added'})</span>
                    <span>KSH {calc.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-green-600">KSH {calc.finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Tax Type Selector */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <label className="block text-sm font-semibold text-gray-900 mb-3">Tax Type</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTaxType('exclusive')}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all min-h-[48px] ${
                      taxType === 'exclusive'
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Tax Exclusive
                  </button>
                  <button
                    onClick={() => setTaxType('inclusive')}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all min-h-[48px] ${
                      taxType === 'inclusive'
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Tax Inclusive
                  </button>
                </div>
              </div>

              {/* Discount Selector */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <label className="block text-sm font-semibold text-gray-900 mb-3">Discount</label>
                {discountList.filter(d => d.active && !selectedDiscount).length > 0 ? (
                  <select
                    value={selectedDiscount?.id || ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedDiscount(discountList.find(d => d.id === parseInt(e.target.value)));
                      } else {
                        setSelectedDiscount(null);
                      }
                    }}
                    className="w-full h-12 text-base border border-gray-300 rounded-xl px-3 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all touch-manipulation"
                  >
                    <option value="">No Discount</option>
                    {discountList.filter(d => d.active).map(discount => (
                      <option key={discount.id} value={discount.id}>
                        {discount.name} - {discount.type === 'percentage' ? `${discount.value}%` : `KSH ${discount.value}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">
                      {selectedDiscount ? selectedDiscount.name : 'No Discount'}
                    </span>
                    {selectedDiscount && (
                      <span className="text-sm text-green-600 font-medium">
                        -KSH {calc.discountAmount.toLocaleString()}
                      </span>
                    )}
                  </div>
                )}
                {selectedDiscount && (
                  <button
                    onClick={() => setSelectedDiscount(null)}
                    className="mt-2 text-xs text-red-600 underline"
                  >
                    Remove discount
                  </button>
                )}
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => setCurrentScreen('payment')}
                disabled={cart.length === 0 || checkoutLoading}
                className="w-full py-4 min-h-[52px] text-lg font-bold text-white bg-gradient-to-r from-green-600 to-teal-600 rounded-xl shadow-lg hover:from-green-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 touch-manipulation flex items-center justify-center gap-2"
              >
                {checkoutLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Proceed to Payment'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const PaymentScreen = () => {
    return (
      <div className="pb-24 bg-gray-50 min-h-screen">
        {/* Sticky Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-30 flex items-center">
          <button
            onClick={() => setCurrentScreen('cart')}
            className="mr-3 text-gray-600 hover:text-gray-900 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">Payment</h2>
        </div>

        <div className="p-4 space-y-4">
          {/* Sale Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900 font-medium">KSH {calc.subtotal.toLocaleString()}</span>
              </div>
              {selectedDiscount && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({selectedDiscount.name})</span>
                  <span>-KSH {calc.discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-orange-600">
                <span>Tax ({taxType === 'inclusive' ? 'Included' : 'Added'})</span>
                <span>KSH {calc.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-xl font-bold">
                <span>Total Amount</span>
                <span className="text-green-600">KSH {calc.finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection - Card-based */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <label className="block text-sm font-semibold text-gray-900 mb-3">Select Payment Method</label>
            <div className="space-y-3">
              <button
                onClick={() => { setPaymentMethod('cash'); setAmountReceived(''); }}
                className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all min-h-[56px] ${
                  paymentMethod === 'cash'
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Banknote className="w-6 h-6 text-amber-600 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <span className="font-semibold text-gray-900 block">Cash</span>
                  <span className="text-xs text-gray-500">Pay with cash</span>
                </div>
                {paymentMethod === 'cash' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
              </button>
              <button
                onClick={() => { setPaymentMethod('card'); if (paymentMethod === 'cash') setAmountReceived(''); }}
                className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all min-h-[56px] ${
                  paymentMethod === 'card'
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <span className="font-semibold text-gray-900 block">Card</span>
                  <span className="text-xs text-gray-500">Pay with card</span>
                </div>
                {paymentMethod === 'card' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
              </button>
              <button
                onClick={() => { setPaymentMethod('mpesa'); if (paymentMethod === 'cash') setAmountReceived(''); }}
                className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all min-h-[56px] ${
                  paymentMethod === 'mpesa'
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Smartphone className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <span className="font-semibold text-gray-900 block">M-PESA</span>
                  <span className="text-xs text-gray-500">Pay with M-PESA</span>
                </div>
                {paymentMethod === 'mpesa' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
              </button>
              <button
                onClick={() => { setPaymentMethod('bank_transfer'); if (paymentMethod === 'cash') setAmountReceived(''); }}
                className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all min-h-[56px] ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Landmark className="w-6 h-6 text-purple-600 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <span className="font-semibold text-gray-900 block">Bank Transfer</span>
                  <span className="text-xs text-gray-500">Pay via bank transfer</span>
                </div>
                {paymentMethod === 'bank_transfer' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
              </button>
            </div>
          </div>

          {/* Cash Amount Received - Only show for cash */}
          {paymentMethod === 'cash' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Amount Received</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">KSH</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="10"
                  placeholder="0.00"
                  value={amountReceived}
                  onChange={(e) => {
                    setAmountReceived(e.target.value);
                  }}
                  className="w-full pl-14 pr-4 h-14 text-2xl font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all touch-manipulation"
                  autoFocus
                />
              </div>
              {amountReceived && changeAmount !== null && changeAmount > 0 && (
                <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-700">Change</span>
                    <span className="text-xl font-bold text-green-600">
                      KSH {changeAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
              {amountReceived && (parseFloat(amountReceived) || 0) < calc.finalTotal && (
                <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-sm text-red-600 font-medium">
                    Insufficient amount. Need at least KSH {calc.finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Complete Sale Button */}
          <div className="sticky bottom-0 pt-2 bg-gray-50">
            <button
              onClick={handleCompleteSale}
              disabled={checkoutLoading || (paymentMethod === 'cash' && ((parseFloat(amountReceived) || 0) < calc.finalTotal))}
              className="w-full py-4 min-h-[56px] text-lg font-bold text-white bg-gradient-to-r from-green-600 to-teal-600 rounded-xl shadow-lg hover:from-green-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 touch-manipulation flex items-center justify-center gap-2"
            >
              {checkoutLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                `Complete Sale • KSH ${calc.finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const SuccessScreen = () => {
    const lastSale = data.sales[0];
    const received = parseFloat(amountReceived);
    const receiptTotal = calc.finalTotal;
    const receiptPaid = paymentMethod === 'cash' && received >= receiptTotal ? received : receiptTotal;
    const receiptChange = paymentMethod === 'cash' && changeAmount !== null ? changeAmount : 0;

    return (
      <div className="pb-20 bg-white min-h-screen">
        <div className="p-6 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Sale Completed</h2>
          <p className="text-gray-500 mb-6">Successfully</p>

          {/* Receipt Number */}
          <div className="bg-gray-50 rounded-xl py-3 px-4 mb-4 inline-block">
            <p className="text-xs text-gray-500">Receipt #</p>
            <p className="font-bold text-lg text-gray-900">
              {lastSale?.id ? `INV-${String(lastSale.id).padStart(6, '0')}` : `INV-${String(Date.now()).slice(-6)}`}
            </p>
          </div>

          {/* Receipt Details Table */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 text-left">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total</span>
                <span className="font-medium">KSH {receiptTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paid</span>
                <span className="font-medium text-green-600">
                  KSH {receiptPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Change</span>
                <span className="font-medium">
                  KSH {receiptChange.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-gray-600">Payment</span>
                <span className="font-medium capitalize">{lastSale?.paymentMethod || paymentMethod}</span>
              </div>
              {lastSale && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cashier</span>
                    <span className="font-medium">{lastSale?.cashierName || user?.name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date</span>
                    <span className="font-medium">{new Date(lastSale?.createdAt).toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => {
                setCurrentScreen('home');
                setCart([]);
                setCartItemUnits({});
                setSelectedDiscount(null);
                setTaxType('exclusive');
                setAmountReceived('');
                setActiveTab('home');
              }}
              className="w-full py-4 min-h-[52px] text-lg font-bold text-white bg-gradient-to-r from-green-600 to-teal-600 rounded-xl shadow-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200 touch-manipulation"
            >
              New Sale
            </button>
            <div className="flex gap-3">
              <button
                onClick={handlePrintReceipt}
                disabled={!lastSale}
                className="flex-1 py-3 min-h-[48px] text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors touch-manipulation flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                onClick={handleShareReceipt}
                disabled={!lastSale}
                className="flex-1 py-3 min-h-[48px] text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors touch-manipulation flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SalesHistoryScreen = () => {
    return (
      <div className="pb-20 bg-gray-50 min-h-screen">
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-30 flex items-center">
          <button
            onClick={() => { setCurrentScreen('more'); setActiveView('pos'); }}
            className="mr-3 text-gray-600 hover:text-gray-900 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">Sales History</h2>
          <button
            onClick={loadSalesHistory}
            className="ml-auto text-gray-600 hover:text-gray-900 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <RefreshCw className={`w-5 h-5 ${salesHistoryLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="p-4">
          {salesHistoryLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-1" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : salesHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Receipt className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-1">No sales history yet</h3>
              <p className="text-sm text-gray-500">Sales will appear here once you start selling.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {salesHistory.map((sale) => (
                <div key={sale.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-gray-900">#{sale.id ? `INV-${String(sale.id).padStart(6, '0')}` : `INV-${String(Date.now()).slice(-6)}`}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      sale.payment_method === 'cash' ? 'text-amber-700 bg-amber-50' :
                      sale.payment_method === 'card' ? 'text-blue-700 bg-blue-50' :
                      sale.payment_method === 'mpesa' ? 'text-green-700 bg-green-50' :
                      'text-purple-700 bg-purple-50'
                    }`}>
                      {sale.payment_method || 'cash'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">
                    {new Date(sale.createdAt || sale.created_at).toLocaleString()}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {sale.items ? `${JSON.parse(sale.items).length} items` : '—'}
                    </span>
                    <span className="font-bold text-green-600">
                      KSH {sale.total?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const MoreScreen = () => {
    return (
      <div className="pb-20 bg-gray-50 min-h-screen">
        {/* User Info Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-lg">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user?.name || 'Cashier'}</p>
              <p className="text-sm text-gray-500">{user?.email || ''}</p>
            </div>
          </div>
        </div>

        <div className="p-2">
          {/* Clock In/Out */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-3">
            <button
              onClick={isClockedIn ? handleClockOut : handleClockIn}
              className={`w-full p-4 flex items-center gap-4 text-left min-h-[56px] ${
                isClockedIn
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-green-600 hover:bg-green-50'
              } transition-colors`}
            >
              {isClockedIn ? (
                <>
                  <Square className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-semibold">Clock Out</span>
                    {clockedInTime && (
                      <p className="text-xs text-red-500 mt-0.5">
                        Clocked in since {clockedInTime.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="font-semibold">Clock In</span>
                </>
              )}
              {isClockedIn && <ChevronRight className="w-5 h-5 text-red-600 ml-auto" />}
            </button>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => { setShowAddExpense(true); setCurrentScreen('more'); }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col items-center justify-center min-h-[80px] hover:bg-gray-50 transition-colors touch-manipulation"
            >
              <TrendingDown className="w-6 h-6 text-red-600 mb-1" />
              <span className="text-sm font-medium text-gray-900">Expenses</span>
            </button>
            <button
              onClick={() => { setActiveView('history'); setCurrentScreen('salesHistory'); }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col items-center justify-center min-h-[80px] hover:bg-gray-50 transition-colors touch-manipulation"
            >
              <History className="w-6 h-6 text-blue-600 mb-1" />
              <span className="text-sm font-medium text-gray-900">Sales History</span>
            </button>
          </div>

          {/* Menu List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4">
            <button
              onClick={() => setShowCreditRequest(true)}
              className="w-full p-4 flex items-center gap-4 text-left text-gray-700 hover:bg-gray-50 transition-colors min-h-[52px]"
            >
              <CreditCard className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span className="font-medium">Request Credit</span>
              <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
            </button>
            <button
              onClick={() => { setShowAddProduct(true); }}
              className="w-full p-4 flex items-center gap-4 text-left text-gray-700 hover:bg-gray-50 transition-colors min-h-[52px]"
            >
              <Package className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="font-medium">Add Product</span>
              <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
            </button>
            <button
              onClick={() => logout()}
              className="w-full p-4 flex items-center gap-4 text-left text-red-600 hover:bg-red-50 transition-colors min-h-[52px]"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">Logout</span>
            </button>
          </div>

          {/* Reminders */}
          {reminderList.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Reminders</h4>
              <div className="space-y-2">
                {reminderList.map((reminder) => (
                  <div key={reminder.id} className="flex items-center gap-3 p-2 rounded-lg border border-gray-100">
                    <Bell className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">{reminder.title}</p>
                      <p className="text-xs text-gray-500">{reminder.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expenses list */}
          {data.expenses.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Recent Expenses</h4>
              <div className="space-y-2">
                {data.expenses.slice().reverse().slice(0, 5).map((expense, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-700">{expense.description}</span>
                    <span className="font-semibold text-red-600">KSH {expense.amount?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ---------- Tab Navigation & Screen Routing ----------

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    if (tab === 'home') {
      setCurrentScreen('home');
      setActiveView('pos');
    } else if (tab === 'sales') {
      setCurrentScreen('sales');
      setActiveView('pos');
    } else if (tab === 'cart') {
      setCurrentScreen('cart');
    } else if (tab === 'more') {
      setCurrentScreen('more');
      setActiveView('pos');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {localStorage.getItem('adminViewingCashier') && (user?.role === 'admin' || user?.role === 'main_admin' || user?.role === 'owner') && (
        <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between">
          <span className="text-sm font-semibold">Admin View: Operating POS</span>
          <button
            onClick={() => {
              localStorage.removeItem('adminViewingCashier');
              window.location.href = '/mobile';
            }}
            className="px-3 py-1 bg-white text-amber-600 rounded-lg text-sm font-semibold hover:bg-amber-50"
          >
            Exit
          </button>
        </div>
      )}

      {/* Bottom Navigation Bar - always visible on mobile */}
      <BottomNavBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        cartItemCount={cart.length}
      />

      {/* Sale Toast Notification — non-blocking, auto-dismisses */}
      {saleToast && (
        <div
          key={saleToast.id}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white text-sm font-semibold transition-all max-w-md
            ${saleToast.type === 'success' ? 'bg-green-600' : saleToast.type === 'warning' ? 'bg-amber-500' : 'bg-red-600'}`}
        >
          <span>{saleToast.type === 'success' ? '✅' : saleToast.type === 'warning' ? '⚠️' : '❌'}</span>
          <span>{saleToast.message}</span>
          <button onClick={() => setSaleToast(null)} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Clear Cart Confirmation Modal */}
      {showClearCartModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Clear Cart?</h3>
            <p className="text-sm text-gray-500 mb-4">All products currently in the cart will be removed.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearCartModal(false)}
                className="flex-1 py-3 min-h-[48px] text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors touch-manipulation"
              >
                Cancel
              </button>
              <button
                onClick={clearCart}
                className="flex-1 py-3 min-h-[48px] text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors touch-manipulation"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end p-0">
          <div className="bg-white rounded-t-2xl p-6 w-full max-w-md mx-auto mb-0 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Expense</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <input
                  type="text"
                  placeholder="Enter description"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  required
                  className="w-full h-12 px-4 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (KSH) *</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  min="0"
                  step="0.01"
                  required
                  className="w-full h-12 px-4 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <input
                  type="text"
                  placeholder="e.g., Utilities, Supplies"
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="w-full h-12 px-4 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="flex-1 py-3 min-h-[48px] text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 min-h-[48px] text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors touch-manipulation"
                >
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credit Request Modal */}
      {showCreditRequest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end p-0">
          <div className="bg-white rounded-t-2xl p-6 w-full max-w-md mx-auto mb-0 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-4">Request Credit</h3>
            <form onSubmit={handleCreditRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
                <input
                  type="text"
                  placeholder="Enter customer name"
                  value={creditRequestForm.customerName}
                  onChange={(e) => setCreditRequestForm({ ...creditRequestForm, customerName: e.target.value })}
                  required
                  className="w-full h-12 px-4 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (KSH) *</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={creditRequestForm.amount}
                  onChange={(e) => setCreditRequestForm({ ...creditRequestForm, amount: e.target.value })}
                  min="0"
                  step="0.01"
                  required
                  className="w-full h-12 px-4 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
                <select
                  value={creditRequestForm.reason}
                  onChange={(e) => setCreditRequestForm({ ...creditRequestForm, reason: e.target.value })}
                  required
                  className="w-full h-12 px-4 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                >
                  <option value="">Select reason...</option>
                  <option value="regular_customer">Regular Customer</option>
                  <option value="emergency">Emergency</option>
                  <option value="bulk_order">Bulk Order</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  placeholder="Add any additional notes..."
                  value={creditRequestForm.notes}
                  onChange={(e) => setCreditRequestForm({ ...creditRequestForm, notes: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreditRequest(false)}
                  className="flex-1 py-3 min-h-[48px] text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creditRequestSubmitting}
                  className="flex-1 py-3 min-h-[48px] text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 touch-manipulation"
                >
                  {creditRequestSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Screens - render based on active tab and current screen state */}
      {activeTab === 'home' && currentScreen === 'home' && <HomeScreen />}
      {activeTab === 'sales' && currentScreen === 'sales' && <SalesScreen />}
      {activeTab === 'sales' && currentScreen === 'salesHistory' && <SalesHistoryScreen />}
      {activeTab === 'cart' && currentScreen === 'cart' && <CartScreen />}
      {activeTab === 'more' && currentScreen === 'more' && <MoreScreen />}
      {currentScreen === 'payment' && <PaymentScreen />}
      {currentScreen === 'success' && <SuccessScreen />}
    </div>
  );
}