import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { products, rawMaterials } from '../../services/api';
import { cacheClear } from '../../utils/apiCache';
import { Package, Search, ArrowLeft, AlertTriangle, TrendingUp, TrendingDown, BarChart3, RefreshCw, X, CheckCircle2, AlertCircle } from 'lucide-react';

const STOCK_MODES = {
  EXACT: 'exact',
  INCREASE: 'increase',
  DECREASE: 'decrease'
};

export default function MobileStockDashboard() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [stockMode, setStockMode] = useState(STOCK_MODES.EXACT);
  const [updateQuantity, setUpdateQuantity] = useState('');
  const [updating, setUpdating] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      cacheClear('^api_cache_/products\\|(GET|HEAD)\\|');
      cacheClear('^api_cache_/raw-materials\\|(GET|HEAD)\\|');
      const [productData, rawMaterialData] = await Promise.all([
        products.getAll(),
        rawMaterials.getAll().catch(() => [])
      ]);

      const normalizedProducts = Array.isArray(productData) ? productData.map(p => ({
        ...p,
        item_type: 'product',
        displayName: p.name,
        quantity: p.quantity || 0,
        unit: p.unit || 'pcs',
        reorder_level: p.reorder_level || 0
      })) : [];

      const normalizedRawMaterials = Array.isArray(rawMaterialData) ? rawMaterialData.map(m => ({
        ...m,
        item_type: 'raw_material',
        displayName: m.name,
        quantity: m.quantity || 0,
        unit: m.unit || 'pcs',
        reorder_level: m.reorder_level || 0,
        id: `raw-${m.id}`,
        rawMaterialId: m.id
      })) : [];

      setItems([...normalizedProducts, ...normalizedRawMaterials]);
    } catch (err) {
      console.error('Failed to load stock:', err);
      showNotification('Failed to load stock data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = items.filter(item =>
    item.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStock = filtered.filter(item => item.quantity <= (item.reorder_level || 0));
  const inStock = filtered.filter(item => item.quantity > (item.reorder_level || 0));

  const validateStockValue = (value, currentQty = 0) => {
    const num = Number(value);
    if (!value || value === '' || value === null || value === undefined) {
      return 'Please enter a stock value';
    }
    if (isNaN(num) || !Number.isFinite(num)) {
      return 'Please enter a valid number';
    }
    if (num < 0) {
      return 'Stock cannot be negative';
    }
    if (stockMode === STOCK_MODES.DECREASE && num > currentQty) {
      return `Cannot decrease more than current stock (${currentQty})`;
    }
    return null;
  };

  const calculateNewQuantity = (item) => {
    const current = Number(item.quantity || 0);
    const change = Number(updateQuantity);
    if (stockMode === STOCK_MODES.EXACT) {
      return change;
    } else if (stockMode === STOCK_MODES.INCREASE) {
      return current + change;
    } else if (stockMode === STOCK_MODES.DECREASE) {
      return Math.max(0, current - change);
    }
    return change;
  };

  const handleUpdateStock = async (item) => {
    const validationError = validateStockValue(updateQuantity, Number(item.quantity || 0));
    if (validationError) {
      showNotification(validationError, 'error');
      return;
    }

    setUpdating(true);
    try {
      const newQuantity = calculateNewQuantity(item);

      if (item.item_type === 'raw_material') {
        await rawMaterials.update(item.rawMaterialId || item.id, {
          quantity: newQuantity
        });
      } else {
        await products.updateStock(item.id, { quantity: newQuantity });
      }
      await loadData();
      setSelectedItem(null);
      setUpdateQuantity('');
      showNotification(`Stock updated to ${newQuantity} ${item.unit}`, 'success');
    } catch (err) {
      console.error('Failed to update stock:', err);
      const message = err?.message || 'Failed to update stock';
      showNotification(message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const openUpdateModal = (item) => {
    setSelectedItem(item);
    setUpdateQuantity(String(item.quantity || 0));
    setStockMode(STOCK_MODES.EXACT);
  };

  const getStockStatus = (item) => {
    if (item.quantity <= 0) return { text: 'Out of Stock', color: 'text-red-600 bg-red-50' };
    if (item.quantity <= (item.reorder_level || 0)) return { text: 'Low Stock', color: 'text-orange-600 bg-orange-50' };
    return { text: 'In Stock', color: 'text-green-600 bg-green-50' };
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/mobile')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Stock</h1>
          <p className="text-xs text-gray-500">{items.length} items</p>
        </div>
        <button
          onClick={loadData}
          className="ml-auto p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {notification && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
          notification.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
          notification.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
          'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> :
           notification.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> :
           null}
          <span className="break-words">{notification.message}</span>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search stock..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <p className="text-sm font-semibold text-red-800">{lowStock.length} Low Stock Items</p>
          </div>
          <div className="space-y-2">
            {lowStock.slice(0, 5).map(item => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-red-700 font-medium">{item.displayName}</span>
                <span className="text-red-600">{item.quantity} {item.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading stock...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No stock items found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const status = getStockStatus(item);
            return (
              <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.displayName}</p>
                    <p className="text-xs text-gray-500 capitalize">{item.item_type?.replace('_', ' ')}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${status.color}`}>
                    {status.text}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-semibold text-gray-900">{item.quantity}</span>
                    <span className="text-gray-500 ml-1">{item.unit}</span>
                  </div>
                  <button
                    onClick={() => openUpdateModal(item)}
                    className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Update
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Update Stock</h3>
              <button
                onClick={() => { setSelectedItem(null); setUpdateQuantity(''); }}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-1 font-medium">{selectedItem.displayName}</p>
            <p className="text-xs text-gray-500 mb-4">Current: {selectedItem.quantity} {selectedItem.unit}</p>

            <div className="flex rounded-xl bg-gray-100 p-1 mb-4">
              {[
                { key: STOCK_MODES.EXACT, label: 'Set Exact' },
                { key: STOCK_MODES.INCREASE, label: 'Increase' },
                { key: STOCK_MODES.DECREASE, label: 'Decrease' }
              ].map(mode => (
                <button
                  key={mode.key}
                  type="button"
                  onClick={() => { setStockMode(mode.key); setUpdateQuantity(''); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    stockMode === mode.key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <input
              type="number"
              step="0.01"
              min="0"
              value={updateQuantity}
              onChange={(e) => setUpdateQuantity(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={
                stockMode === STOCK_MODES.EXACT ? 'New quantity' :
                stockMode === STOCK_MODES.INCREASE ? 'Amount to add' :
                'Amount to remove'
              }
              autoFocus
            />

            {stockMode !== STOCK_MODES.EXACT && updateQuantity && !isNaN(Number(updateQuantity)) && (
              <p className="text-xs text-gray-500 mb-4">
                New stock: <span className="font-semibold text-gray-900">{calculateNewQuantity(selectedItem)} {selectedItem.unit}</span>
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setSelectedItem(null); setUpdateQuantity(''); }}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStock(selectedItem)}
                disabled={updating}
                className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
