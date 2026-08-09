import { useState, useEffect, useCallback, Fragment } from 'react';
import { products as productsApi } from '../../services/api';
import api from '../../services/api';
import {
  Package, TrendingDown, AlertTriangle, RefreshCw, Search,
  ChevronDown, ChevronUp, Filter, BarChart3, Download
} from 'lucide-react';
import { exportStockPDF } from '../../utils/exportData';

const hasRecipe = (product) => Array.isArray(product?.recipe) && product.recipe.length > 0;

const PAYMENT_COLORS = {
  cash: 'bg-green-100 text-green-800',
  card: 'bg-blue-100 text-blue-800',
  mpesa: 'bg-purple-100 text-purple-800',
  credit: 'bg-yellow-100 text-yellow-800',
};

function paymentBadge(method) {
  const cls = PAYMENT_COLORS[String(method || '').toLowerCase()] || 'bg-gray-100 text-gray-700';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{method || '—'}</span>;
}

export default function StockDashboard() {
  const [products, setProducts] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deductionsLoading, setDeductionsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchDeductions = useCallback(async (productId = null) => {
    const endpoint = productId
      ? `/stock-deductions?product_id=${productId}&limit=500`
      : `/stock-deductions?limit=500`;
    try {
      return await api.get(endpoint);
    } catch {
      return [];
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setDeductionsLoading(true);
    try {
      const [productData, rawMaterialData, deductionData] = await Promise.all([
        productsApi.getAll(),
        api.get('/raw-materials').catch(() => []),
        fetchDeductions()
      ]);

      const normalizedProducts = Array.isArray(productData) ? productData : [];
      const normalizedRawMaterials = Array.isArray(rawMaterialData)
        ? rawMaterialData.map((m) => ({
            id: `raw-${m.id}`,
            raw_material_id: m.id,
            item_type: 'raw_material',
            name: m.name,
            quantity: m.quantity,
            unit: m.unit,
            reorder_level: m.reorder_level || 0,
            category: 'ingredients'
          }))
        : [];

      setProducts([...normalizedProducts, ...normalizedRawMaterials]);
      setDeductions(Array.isArray(deductionData) ? deductionData : []);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load stock dashboard:', err);
    } finally {
      setLoading(false);
      setDeductionsLoading(false);
    }
  }, [fetchDeductions]);

  useEffect(() => {
    loadData();
    
    // Set up auto-refresh every 60 seconds (not 5s to prevent constant reloading)
    const pollInterval = setInterval(() => {
      loadData().catch(err => console.warn('Auto-refresh failed:', err));
    }, 60000);
    
    return () => clearInterval(pollInterval);
  }, [loadData]);

  const handleProductFilter = async (productId) => {
    if (selectedProductId === productId) {
      setSelectedProductId(null);
      // Reload all deductions
      setDeductionsLoading(true);
      const data = await fetchDeductions();
      setDeductions(data);
      setDeductionsLoading(false);
    } else {
      setSelectedProductId(productId);
      setDeductionsLoading(true);
      const data = await fetchDeductions(productId);
      setDeductions(data);
      setDeductionsLoading(false);
    }
  };

  const getProductEntityKey = (p) => (
    p.item_type === 'raw_material' || p.raw_material_id
      ? `raw-${p.raw_material_id || p.id}`
      : `product-${p.id}`
  );

  // Ingredients are products that appear in any composite product's recipe
  const compositeProducts = products.filter(hasRecipe);

  // Collect all ingredient entity keys referenced in recipes.
  const ingredientIds = new Set();
  compositeProducts.forEach(cp => {
    (cp.recipe || []).forEach(ing => {
      const productId = ing.productId || ing.product_id || ing.id;
      const rawMaterialId = ing.raw_material_id || ing.rawMaterialId || ing.materialId;
      const ingredientName = String(ing.name || '').trim().toLowerCase();

      if (rawMaterialId) {
        ingredientIds.add(`raw-${rawMaterialId}`);
      } else if (productId) {
        ingredientIds.add(`product-${productId}`);
      } else if (ingredientName) {
        const matchedRaw = products.find(
          (p) => (p.item_type === 'raw_material' || p.raw_material_id) && String(p.name || '').trim().toLowerCase() === ingredientName
        );
        const matchedProduct = products.find(
          (p) => !p.raw_material_id && String(p.name || '').trim().toLowerCase() === ingredientName
        );
        if (matchedRaw) ingredientIds.add(getProductEntityKey(matchedRaw));
        if (matchedProduct) ingredientIds.add(getProductEntityKey(matchedProduct));
      }
    });
  });

  const categories = ['all', 'ingredients', 'composite', 'raw', 'finished', 'general'];

  const filteredProducts = products.filter(p => {
    const matchSearch = !searchTerm ||
      (p.name || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (categoryFilter === 'ingredients') {
      return matchSearch && ingredientIds.has(getProductEntityKey(p));
    }
    if (categoryFilter === 'composite') {
      return matchSearch && hasRecipe(p);
    }
    if (categoryFilter !== 'all') {
      return matchSearch && String(p.category || '').toLowerCase() === categoryFilter;
    }
    return matchSearch;
  });

  // Stats
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => {
    const threshold = Number(p.reorder_level || p.reorderLevel || 0);
    return threshold > 0 && Number(p.quantity || 0) <= threshold;
  }).length;
  const outOfStockCount = products.filter(p => Number(p.quantity || 0) <= 0).length;
  const totalDeductionsToday = deductions.filter(d => {
    if (!d.created_at) return false;
    return new Date(d.created_at).toDateString() === new Date().toDateString();
  }).length;

  const getDeductionEntityKey = (d) => (
    d.item_type === 'raw_material'
      ? `raw-${d.raw_material_id}`
      : `product-${d.product_id}`
  );

  // Deductions grouped per entity for the deductions table
  const deductionsByProduct = {};
  deductions.forEach(d => {
    const key = getDeductionEntityKey(d);
    if (!deductionsByProduct[key]) {
      deductionsByProduct[key] = { name: d.product_name, unit: d.unit, records: [], totalDeducted: 0 };
    }
    deductionsByProduct[key].records.push(d);
    deductionsByProduct[key].totalDeducted += Number(d.quantity_deducted || 0);
  });

  const getStockStatusColor = (product) => {
    const qty = Number(product.quantity || 0);
    const threshold = Number(product.reorder_level || product.reorderLevel || 0);
    if (qty <= 0) return 'text-red-600 font-bold';
    if (threshold > 0 && qty <= threshold) return 'text-orange-600 font-semibold';
    return 'text-green-600';
  };

  const getStockBadge = (product) => {
    const qty = Number(product.quantity || 0);
    const threshold = Number(product.reorder_level || product.reorderLevel || 0);
    if (qty <= 0) return <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-semibold">Out of Stock</span>;
    if (threshold > 0 && qty <= threshold) return <span className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700 font-semibold">Low Stock</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-semibold">In Stock</span>;
  };

  // Product deductions summary
  const productDeductionTotals = {};
  deductions.forEach(d => {
    const id = getDeductionEntityKey(d);
    productDeductionTotals[id] = (productDeductionTotals[id] || 0) + Number(d.quantity_deducted || 0);
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Stock Dashboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Live ingredient & product stock levels with deduction history
            {lastRefreshed && <span className="ml-2 text-xs">• Last updated: {lastRefreshed}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportStockPDF(products, [])}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-xs text-blue-100">Total Products</p>
              <p className="text-2xl font-bold">{totalProducts}</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-red-500 to-rose-600 text-white">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-xs text-red-100">Out of Stock</p>
              <p className="text-2xl font-bold">{outOfStockCount}</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-orange-500 to-amber-600 text-white">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-xs text-orange-100">Low Stock Items</p>
              <p className="text-2xl font-bold">{lowStockCount}</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-purple-500 to-violet-600 text-white">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-xs text-purple-100">Deductions Today</p>
              <p className="text-2xl font-bold">{totalDeductionsToday}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 input w-full"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-500" />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat === 'ingredients' ? '🥕 Ingredients' : cat === 'composite' ? '🍳 Composite' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Product Stock Levels
            {selectedProductId && (
              <button
                onClick={() => handleProductFilter(selectedProductId)}
                className="ml-3 text-xs text-blue-600 hover:underline"
              >
                × Clear filter
              </button>
            )}
          </h3>
          <span className="text-sm text-gray-500">{filteredProducts.length} products</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mr-2" />
            <span className="text-gray-500">Loading stock data...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No products found</div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {filteredProducts.map(product => {
                const entityKey = getProductEntityKey(product);
                const isIngredient = ingredientIds.has(entityKey);
                const totalDeducted = productDeductionTotals[entityKey] || 0;
                const isExpanded = expandedProduct === entityKey;
                const productDeductionHistory = deductions.filter(
                  d => getDeductionEntityKey(d) === entityKey
                ).slice(0, 10);
                return (
                  <div key={entityKey} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{product.name}</p>
                          <span className="text-xs text-gray-500 capitalize">{product.category || 'general'}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setExpandedProduct(isExpanded ? null : entityKey)}
                        className="p-2 rounded hover:bg-gray-200 text-gray-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="View deduction history"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-xs text-gray-500 block">Current Stock</span>
                        <span className={`font-semibold ${getStockStatusColor(product)}`}>
                          {Number(product.quantity || 0).toFixed(3)} {product.unit || 'pcs'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">Reorder Level</span>
                        <span className="text-gray-700">
                          {Number(product.reorder_level || product.reorderLevel || 0) > 0
                            ? `${Number(product.reorder_level || product.reorderLevel || 0)} ${product.unit || 'pcs'}`
                            : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">Total Deducted</span>
                        <span className="text-red-600 font-medium">
                          {totalDeducted > 0 ? `−${totalDeducted.toFixed(3)} ${product.unit || 'pcs'}` : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">Status</span>
                        {getStockBadge(product)}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-2 space-y-2 border border-blue-100 rounded-lg p-3 bg-blue-50/50">
                        <h4 className="text-xs font-semibold text-gray-600 uppercase">
                          Deduction History for {product.name}
                        </h4>
                        {productDeductionHistory.length === 0 ? (
                          <p className="text-xs text-gray-400">No deductions recorded yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {productDeductionHistory.slice(0, 5).map((d, idx) => (
                              <div key={idx} className="text-xs border-b border-blue-100 last:border-0 pb-2 last:pb-0">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">{d.created_at ? new Date(d.created_at).toLocaleString() : '—'}</span>
                                  {paymentBadge(d.payment_method)}
                                </div>
                                <div className="flex justify-between mt-1">
                                  <span className="text-gray-500">Before: {Number(d.quantity_before || 0).toFixed(3)} {d.unit}</span>
                                  <span className="text-red-600 font-semibold">−{Number(d.quantity_deducted || 0).toFixed(3)} {d.unit}</span>
                                  <span className="text-green-700 font-semibold">After: {Number(d.quantity_after || 0).toFixed(3)} {d.unit}</span>
                                </div>
                                <p className="text-gray-500 mt-1">{d.cashier_name || '—'} • {d.deduction_reason || d.parent_product || 'Direct sale'}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-right">Current Stock</th>
                  <th className="px-4 py-3 text-right">Reorder Level</th>
                  <th className="px-4 py-3 text-right">Total Deducted</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">History</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => {
                  const entityKey = getProductEntityKey(product);
                  const isIngredient = ingredientIds.has(entityKey);
                  const totalDeducted = productDeductionTotals[entityKey] || 0;
                  const isExpanded = expandedProduct === entityKey;
                  const productDeductionHistory = deductions.filter(
                    d => getDeductionEntityKey(d) === entityKey
                  ).slice(0, 10);

                  return (
                    <Fragment key={entityKey}>
                      <tr
                        className={`border-t border-gray-100 hover:bg-gray-50 transition-colors ${
                          isExpanded ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-8 h-8 rounded object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{product.name}</p>
                              {isIngredient && (
                                <span className="text-xs text-orange-600">🥕 Used as ingredient</span>
                              )}
                              {hasRecipe(product) && (
                                <span className="text-xs text-purple-600">🍳 Composite product</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="capitalize text-gray-600">{product.category || 'general'}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold ${getStockStatusColor(product)}`}>
                            {Number(product.quantity || 0).toFixed(3)} {product.unit || 'pcs'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">
                          {Number(product.reorder_level || product.reorderLevel || 0) > 0
                            ? `${Number(product.reorder_level || product.reorderLevel || 0)} ${product.unit || 'pcs'}`
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {totalDeducted > 0 ? (
                            <span className="text-red-600 font-medium">
                              −{totalDeducted.toFixed(3)} {product.unit || 'pcs'}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {getStockBadge(product)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setExpandedProduct(isExpanded ? null : entityKey)}
                            className="p-1 rounded hover:bg-gray-200 text-gray-500"
                            title="View deduction history"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-blue-50">
                          <td colSpan={7} className="px-6 py-4">
                            <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase">
                              Deduction History for {product.name}
                            </h4>
                            {productDeductionHistory.length === 0 ? (
                              <p className="text-xs text-gray-400">No deductions recorded yet.</p>
                            ) : (
                              <table className="w-full text-xs bg-white rounded-lg overflow-hidden shadow-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-gray-500">Date & Time</th>
                                    <th className="px-3 py-2 text-right text-gray-500">Before</th>
                                    <th className="px-3 py-2 text-right text-red-500">Deducted</th>
                                    <th className="px-3 py-2 text-right text-gray-500">After</th>
                                    <th className="px-3 py-2 text-left text-gray-500">Deducted For</th>
                                    <th className="px-3 py-2 text-center text-gray-500">Payment</th>
                                    <th className="px-3 py-2 text-left text-gray-500">Cashier</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {productDeductionHistory.map((d, idx) => (
                                    <tr key={idx} className="border-t border-gray-100">
                                      <td className="px-3 py-2 text-gray-600">
                                        {d.created_at ? new Date(d.created_at).toLocaleString() : '—'}
                                      </td>
                                      <td className="px-3 py-2 text-right text-gray-600">
                                        {Number(d.quantity_before || 0).toFixed(3)} {d.unit}
                                      </td>
                                      <td className="px-3 py-2 text-right text-red-600 font-semibold">
                                        −{Number(d.quantity_deducted || 0).toFixed(3)} {d.unit}
                                      </td>
                                      <td className="px-3 py-2 text-right font-semibold">
                                        {Number(d.quantity_after || 0).toFixed(3)} {d.unit}
                                      </td>
                                      <td className="px-3 py-2 text-gray-600 text-xs">
                                        {d.deduction_reason || d.parent_product || 'Direct sale'}
                                      </td>
                                      <td className="px-3 py-2 text-center">
                                        {paymentBadge(d.payment_method)}
                                      </td>
                                      <td className="px-3 py-2 text-gray-500">{d.cashier_name || '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>

      {/* Recent Deductions Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Ingredient Deductions</h3>
          <span className="text-sm text-gray-500">{deductions.length} records</span>
        </div>
        {deductionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-500 mr-2" />
            <span className="text-gray-400">Loading deductions...</span>
          </div>
        ) : deductions.length === 0 ? (
          <div className="text-center py-10">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">No deduction records yet.</p>
            <p className="text-xs text-gray-400 mt-1">
              Deductions are logged automatically when composite products are sold.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Product / Ingredient</th>
                  <th className="px-4 py-3 text-right">Before</th>
                  <th className="px-4 py-3 text-right">Deducted</th>
                  <th className="px-4 py-3 text-right">After</th>
                  <th className="px-4 py-3 text-left">Deducted For</th>
                  <th className="px-4 py-3 text-center">Payment</th>
                  <th className="px-4 py-3 text-left">Cashier</th>
                  <th className="px-4 py-3 text-left">Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {deductions.slice(0, 50).map((d, idx) => (
                  <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{d.product_name || '—'}</td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {Number(d.quantity_before || 0).toFixed(3)} {d.unit}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">
                      −{Number(d.quantity_deducted || 0).toFixed(3)} {d.unit}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700">
                      {Number(d.quantity_after || 0).toFixed(3)} {d.unit}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {d.deduction_reason || d.parent_product || 'Direct sale'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {paymentBadge(d.payment_method)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{d.cashier_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {d.created_at ? new Date(d.created_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {deductions.length > 50 && (
              <p className="text-center text-xs text-gray-400 py-3">
                Showing 50 of {deductions.length} records
              </p>
            )}
          </div>
        )}
      </div>

      {/* Composite Products & Their Ingredient Usage */}
      {compositeProducts.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Composite Products — Ingredient Usage & Cost Analysis</h3>
          <div className="space-y-4">
            {compositeProducts.map(cp => {
              // Count how many times this composite product was sold from deductions
              const cpDeductions = deductions.filter(d => 
                d.deduction_reason?.includes(cp.name) || d.parent_product === cp.name
              );
              // Group by sale event to count distinct sales
              const saleEvents = new Set(cpDeductions.map(d => d.sale_id || d.created_at));
              const totalSold = saleEvents.size;

              return (
              <div key={cp.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  {cp.image ? (
                    <img src={cp.image} alt={cp.name} className="w-10 h-10 rounded object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-purple-100 flex items-center justify-center">
                      <span className="text-lg">🍳</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{cp.name}</h4>
                    <p className="text-xs text-gray-500">Selling price: KSH {Number(cp.price || 0).toLocaleString()}</p>
                  </div>
                  {totalSold > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1 text-sm">
                      <span className="text-blue-700 font-semibold">{totalSold} sold</span>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Ingredients deducted per 1 sale:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(cp.recipe || []).map((ing, idx) => {
                      const ingId = ing.productId || ing.product_id || ing.id;
                      const rawMaterialId = ing.raw_material_id || ing.rawMaterialId || ing.materialId;
                      const ingName = String(ing.name || '').trim().toLowerCase();

                      const ingredientProduct = products.find((p) => {
                        if (rawMaterialId) return Number(p.raw_material_id) === Number(rawMaterialId);
                        if (ingId) return p.raw_material_id ? false : Number(p.id) === Number(ingId);
                        return ingName && String(p.name || '').trim().toLowerCase() === ingName;
                      });

                      const name = ingredientProduct?.name || ing.name || `ID:${rawMaterialId || ingId || idx}`;
                      const unit = ing.unit || ingredientProduct?.unit || 'pcs';
                      const currentStock = ingredientProduct ? Number(ingredientProduct.quantity || 0) : null;
                      const stock_ok = currentStock === null || currentStock >= Number(ing.quantity || 0);
                      const perUseQty = Number(ing.quantity || 0);

                      // Calculate total deducted for this ingredient across all sales of this composite product
                      const entityKey = ingredientProduct ? getProductEntityKey(ingredientProduct) : null;
                      const totalIngDeducted = entityKey ? (productDeductionTotals[entityKey] || 0) : 0;

                      // Cost calculation: if ingredient has a cost/price, calculate cost per use
                      const ingCostPerUnit = Number(ingredientProduct?.cost_per_unit || ingredientProduct?.cost || ingredientProduct?.price || 0);
                      const costPerUse = perUseQty * ingCostPerUnit;
                      const totalCostDeducted = totalIngDeducted * ingCostPerUnit;

                      return (
                        <div
                          key={idx}
                          className={`bg-white px-3 py-2 rounded border ${
                            !stock_ok ? 'border-red-200 bg-red-50' : 'border-gray-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-gray-800">{name}</p>
                              {currentStock !== null && (
                                <p className={`text-xs ${stock_ok ? 'text-gray-400' : 'text-red-500'}`}>
                                  Stock: {currentStock.toFixed(3)} {unit}
                                </p>
                              )}
                            </div>
                            <span className={`text-sm font-bold ml-2 ${stock_ok ? 'text-blue-600' : 'text-red-600'}`}>
                              −{perUseQty} {unit}
                            </span>
                          </div>
                          {/* Cost breakdown */}
                          {ingCostPerUnit > 0 && (
                            <div className="mt-1 pt-1 border-t border-gray-100 text-xs text-gray-500">
                              <p>Cost per {unit}: KSH {ingCostPerUnit.toLocaleString()}</p>
                              <p className="font-medium text-gray-700">Cost per sale: KSH {costPerUse.toLocaleString()}</p>
                            </div>
                          )}
                          {/* Total deducted summary */}
                          {totalIngDeducted > 0 && (
                            <div className="mt-1 pt-1 border-t border-gray-100 text-xs">
                              <p className="text-red-600">Total deducted: {totalIngDeducted.toFixed(3)} {unit}</p>
                              {ingCostPerUnit > 0 && (
                                <p className="text-red-700 font-medium">Total cost: KSH {totalCostDeducted.toLocaleString()}</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Total cost per composite sale */}
                  {(() => {
                    const totalCostPerSale = (cp.recipe || []).reduce((sum, ing) => {
                      const ingId = ing.productId || ing.product_id || ing.id;
                      const rawMaterialId = ing.raw_material_id || ing.rawMaterialId || ing.materialId;
                      const ingName = String(ing.name || '').trim().toLowerCase();
                      const ingredientProduct = products.find((p) => {
                        if (rawMaterialId) return Number(p.raw_material_id) === Number(rawMaterialId);
                        if (ingId) return p.raw_material_id ? false : Number(p.id) === Number(ingId);
                        return ingName && String(p.name || '').trim().toLowerCase() === ingName;
                      });
                      const ingCost = Number(ingredientProduct?.cost_per_unit || ingredientProduct?.cost || ingredientProduct?.price || 0);
                      return sum + (Number(ing.quantity || 0) * ingCost);
                    }, 0);
                    const sellingPrice = Number(cp.price || 0);
                    const profitPerSale = sellingPrice - totalCostPerSale;

                    if (totalCostPerSale > 0) {  
                      return (
                        <div className="mt-3 bg-white rounded-lg p-3 border border-gray-200">
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div>
                              <p className="text-xs text-gray-500">Ingredient Cost</p>
                              <p className="text-sm font-bold text-red-600">KSH {totalCostPerSale.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Selling Price</p>
                              <p className="text-sm font-bold text-blue-600">KSH {sellingPrice.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Profit Per Sale</p>
                              <p className={`text-sm font-bold ${profitPerSale >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                KSH {profitPerSale.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          {totalSold > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-100 grid grid-cols-2 gap-3 text-center">
                              <div>
                                <p className="text-xs text-gray-500">Total Revenue ({totalSold} sales)</p>
                                <p className="text-sm font-bold text-blue-700">KSH {(sellingPrice * totalSold).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Total Profit</p>
                                <p className={`text-sm font-bold ${(profitPerSale * totalSold) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                  KSH {(profitPerSale * totalSold).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
