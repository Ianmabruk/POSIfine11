

import { useState, useEffect, useMemo, useCallback, Fragment, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductsContext';
import { products, batches } from '../../services/api';
import websocketService from '../../services/websocketService';
import { Plus, Search, Edit2, Trash2, ChevronDown, ChevronUp, AlertTriangle, Camera, Package } from 'lucide-react';
import { compressImage } from '../../utils/imageCompress';

const hasRecipe = (product) => Array.isArray(product?.recipe) && product.recipe.length > 0;

export default function Inventory() {
  const { user, isUltraPackage, isRealTimeProductSyncEnabled } = useAuth();
  const { products: globalProducts, refreshProducts, upsertProducts, removeProduct, setEditingState } = useProducts();
  const [productList, setProductList] = useState([]);
  const [batchList, setBatchList] = useState([]);
  const [hasLoadedInitially, setHasLoadedInitially] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddStock, setShowAddStock] = useState(false);
  const [showWeightPricingModal, setShowWeightPricingModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [weightPricing, setWeightPricing] = useState({});
  const [newWeightPrice, setNewWeightPrice] = useState({ weight: '', price: '' });
  const [expandedRow, setExpandedRow] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const addProductRef = useRef(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    cost: '',
    category: 'finished',
    unit: 'pcs',
    quantity: '0',
    expenseOnly: false,
    image: '',
    visibleToCashier: true,
    reorder_level: ''
  });
  const [newStock, setNewStock] = useState({
    quantity: '',
    expiryDate: '',
    batchNumber: '',
    cost: ''
  });
  const [editProduct, setEditProduct] = useState({
    name: '',
    price: '',
    cost: '',
    quantity: '',
    unit: 'pcs',
    category: 'raw',
    expenseOnly: false,
    image: '',
    visibleToCashier: true,
    reorder_level: ''
  });

  const mergeProductsById = useCallback((existingProducts = [], incomingProducts = []) => {
    const merged = new Map((existingProducts || []).map(product => [product.id, product]));

    (incomingProducts || []).forEach((incomingProduct) => {
      if (!incomingProduct?.id) return;
      const previous = merged.get(incomingProduct.id) || {};
      merged.set(incomingProduct.id, { ...previous, ...incomingProduct });
    });

    return Array.from(merged.values());
  }, []);

  const inventorySnapshotKey = useMemo(() => {
    const accountKey = user?.account_id || user?.accountId || user?.id || 'anonymous';
    return `inventory_snapshot_${accountKey}`;
  }, [user?.account_id, user?.accountId, user?.id]);

  // Load data function
  const loadData = async () => {
    try {
      console.log('📦 Loading inventory data...');
      const [freshProducts, batchData] = await Promise.all([
        refreshProducts(),
        batches.getAll()
      ]);
      if (Array.isArray(freshProducts)) {
        setProductList(freshProducts);
      }
      setBatchList(Array.isArray(batchData) ? batchData : []);
      console.log('✅ Inventory data loaded');
    } catch (error) {
      console.error('❌ Failed to load data:', error);
      showNotification('Failed to load inventory data', 'error');
    }
  };

  useEffect(() => {
    // Initial load only
    if (!hasLoadedInitially) {
      try {
        const cachedSnapshot = localStorage.getItem(inventorySnapshotKey);
        if (cachedSnapshot) {
          const parsedSnapshot = JSON.parse(cachedSnapshot);
          if (Array.isArray(parsedSnapshot?.products) && parsedSnapshot.products.length > 0) {
            setProductList(parsedSnapshot.products);
          }
          if (Array.isArray(parsedSnapshot?.batches) && parsedSnapshot.batches.length > 0) {
            setBatchList(parsedSnapshot.batches);
          }
        }
      } catch (error) {
        console.warn('Failed to restore inventory snapshot:', error);
      }

      loadData();
      setHasLoadedInitially(true);
    }

    // Connect to WebSocket for real-time stock updates
    const token = localStorage.getItem('token');
    let wsUpdateTimeout = null;
    if (token) {
      websocketService.connect(token, (data) => {
        // Keep merge surgical: preserve local edit fields while allowing real-time stock sync.
        if (data && data.allProducts && data.allProducts.length > 0) {
          if (wsUpdateTimeout) clearTimeout(wsUpdateTimeout);
          wsUpdateTimeout = setTimeout(() => {
            setProductList(prevList => {
              if (prevList.length === 0) return data.allProducts;

              const productMap = new Map(prevList.map(p => [p.id, p]));
              data.allProducts.forEach(incomingProduct => {
                const existing = productMap.get(incomingProduct.id);
                if (!existing) {
                  productMap.set(incomingProduct.id, incomingProduct);
                  return;
                }

                productMap.set(incomingProduct.id, {
                  ...existing,
                  quantity: incomingProduct.quantity,
                  updated_at: incomingProduct.updated_at,
                  reorder_level: incomingProduct.reorder_level,
                  max_stock_level: incomingProduct.max_stock_level
                });
              });
              return Array.from(productMap.values());
            });
          }, 200);
        }
      }).catch((error) => {
        console.warn('WebSocket connection failed:', error);
      });
      
      // Listen for SALE_COMPLETED events to refresh inventory
      websocketService.on('sale_completed', (saleData) => {
        console.log('🔄 Sale completed - updating inventory display:', saleData);
        if (saleData.updatedProducts && saleData.updatedProducts.length > 0) {
          console.log(`✅ Updating ${saleData.updatedProducts.length} products from sale`);
          setProductList(prevList => mergeProductsById(prevList, saleData.updatedProducts));
          upsertProducts(saleData.updatedProducts);
          showNotification(`✅ Stock updated! Sale #${saleData.saleId} deducted inventory`, 'success');
        }
        if (saleData.lowStockWarnings && saleData.lowStockWarnings.length > 0) {
          const warnings = saleData.lowStockWarnings.map(w => `${w.name}: ${w.current} left`).join(', ');
          showNotification(`⚠️ Low stock alert: ${warnings}`, 'warning');
        }
      });
      
      // Listen for STOCK_UPDATED events (when stock is added via batches)
      websocketService.on('stock_updated', (stockData) => {
        console.log('📦 Stock updated via WebSocket:', stockData);
        if (stockData.product_id && stockData.quantity !== undefined) {
          // Update specific product's quantity
          setProductList(prev => 
            prev.map(p => 
              p.id === stockData.product_id 
                ? { ...p, quantity: stockData.quantity } 
                : p
            )
          );
          showNotification(`✅ Stock updated!`, 'success');
        }
      });
    }

    // Cleanup on unmount
    return () => {
      if (wsUpdateTimeout) clearTimeout(wsUpdateTimeout);
      websocketService.disconnect();
      setEditingState(false);
    };
  }, [hasLoadedInitially, inventorySnapshotKey, mergeProductsById, setEditingState, upsertProducts]);

  // Sync with global products whenever they change.
  useEffect(() => {
    if (globalProducts && globalProducts.length > 0) {
      setProductList(prevList => mergeProductsById(prevList, globalProducts));
    }
  }, [globalProducts, mergeProductsById]);

  useEffect(() => {
    try {
      localStorage.setItem(inventorySnapshotKey, JSON.stringify({
        products: productList,
        batches: batchList,
        savedAt: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to persist inventory snapshot:', error);
    }
  }, [inventorySnapshotKey, productList, batchList]);

  // Pause shared product auto-refresh while user is editing in this screen.
  useEffect(() => {
    const editing = showAddModal || showEditModal || showAddStock || showWeightPricingModal;
    setEditingState(editing);
    return () => setEditingState(false);
  }, [showAddModal, showEditModal, showAddStock, showWeightPricingModal, setEditingState]);

  const handleImageUpload = async (e, isNewProduct = true) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showNotification('Image is too large. Please select an image smaller than or equal to 10 MB.', 'error');
        return;
      }

      setIsImageLoading(true);
      try {
        const compressed = await compressImage(file);
        setImagePreview(compressed.dataUrl);
        if (isNewProduct) {
          setNewProduct(prev => ({ ...prev, image: compressed.dataUrl }));
        } else {
          setEditProduct(prev => ({ ...prev, image: compressed.dataUrl }));
        }
        if (compressed.compressed) {
          showNotification(`Image optimized: ${formatBytes(compressed.originalSize)} → ${formatBytes(compressed.size)}`, 'success');
        }
      } catch (error) {
        showNotification('Failed to process image', 'error');
      } finally {
        setIsImageLoading(false);
      }
    }
  };

  const productById = useMemo(() => {
    const byId = new Map();
    (productList || []).forEach((product) => {
      if (product?.id != null) {
        byId.set(Number(product.id), product);
      }
    });
    return byId;
  }, [productList]);

  const batchesByProductId = useMemo(() => {
    const byId = new Map();
    (batchList || []).forEach((batch) => {
      const productId = Number(batch?.productId ?? batch?.product_id);
      if (!Number.isFinite(productId)) return;
      const existing = byId.get(productId) || [];
      if (Number(batch?.quantity || 0) > 0) {
        existing.push(batch);
        byId.set(productId, existing);
      }
    });
    return byId;
  }, [batchList]);

  const getProductStock = (productId) => {
    const productBatches = batchesByProductId.get(Number(productId)) || [];
    return productBatches.reduce((total, batch) => total + Number(batch.quantity || 0), 0);
  };

  const getProductBatches = (productId) => {
    return batchesByProductId.get(Number(productId)) || [];
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };






  const loadProducts = async () => {
    // Deprecated: Using global context instead
    refreshProducts();
  };



  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (isAddingProduct || addProductRef.current) return;

    try {
      addProductRef.current = true;
      setIsAddingProduct(true);
      const parsedPrice = Number(newProduct.price);
      const parsedCost = newProduct.cost === '' ? null : Number(newProduct.cost);
      const parsedReorder = newProduct.reorder_level === '' ? null : Number(newProduct.reorder_level);

      if (!Number.isFinite(parsedPrice)) {
        showNotification('❌ Enter a valid price', 'error');
        return;
      }
      if (parsedCost !== null && !Number.isFinite(parsedCost)) {
        showNotification('❌ Enter a valid cost', 'error');
        return;
      }
      if (parsedReorder !== null && !Number.isFinite(parsedReorder)) {
        showNotification('❌ Enter a valid low-stock level', 'error');
        return;
      }
      const parsedQuantity = Number(newProduct.quantity || 0);
      if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0) {
        showNotification('❌ Enter a valid initial stock', 'error');
        return;
      }

      const productData = {
        ...newProduct,
        price: parsedPrice,
        quantity: parsedQuantity,
        visibleToCashier: !newProduct.expenseOnly && newProduct.visibleToCashier !== false,
        reorder_level: parsedReorder ?? undefined
      };

      if (parsedCost !== null) {
        productData.cost = parsedCost;
        productData.cost_per_unit = parsedCost;
      } else {
        delete productData.cost;
        delete productData.cost_per_unit;
      }

      showNotification('⚡ Adding product...', 'info');
      const result = await products.create(productData);

      setProductList(prev => mergeProductsById(prev, [result]));
      upsertProducts(result);
      setNewProduct({
        name: '',
        price: '',
        cost: '',
        category: 'finished',
        unit: 'pcs',
        expenseOnly: false,
        image: '',
        visibleToCashier: true,
        reorder_level: ''
      });
      setImagePreview('');
      setShowAddModal(false);

      showNotification(`✅ Product "${result.name}" added successfully! ${result.visibleToCashier ? 'Cashiers can now see this product.' : 'This product is hidden from cashiers.'}`, 'success');

      window.dispatchEvent(new CustomEvent('productCreated', {
        detail: {
          product: result,
          timestamp: new Date().toISOString()
        }
      }));

      window.dispatchEvent(new CustomEvent('stock_updated', {
        detail: {
          productId: result.id,
          quantity: result.quantity || 0,
          product: result,
          timestamp: Date.now()
        }
      }));

    } catch (error) {
      console.error('Failed to create product:', error);
      showNotification(`❌ Failed to add product: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setIsAddingProduct(false);
      addProductRef.current = false;
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    if (isAddingStock || !selectedProduct) return;

    try {
      setIsAddingStock(true);
      const quantityToAdd = Number(newStock.quantity);
      if (!Number.isFinite(quantityToAdd) || quantityToAdd <= 0) {
        showNotification('⚠️ Please enter a valid quantity', 'warning');
        return;
      }

      const currentProduct = productList.find(p => p.id === selectedProduct.id);
      const oldQuantity = Number(currentProduct?.quantity || 0);
      const parsedCost = newStock.cost === '' ? null : Number(newStock.cost);
      if (parsedCost !== null && !Number.isFinite(parsedCost)) {
        showNotification('⚠️ Please enter a valid stock cost', 'warning');
        return;
      }

      showNotification('⚡ Adding stock...', 'info');

      const result = await batches.create({
        productId: selectedProduct.id,
        quantity: quantityToAdd,
        expiryDate: newStock.expiryDate,
        batchNumber: newStock.batchNumber || `BATCH-${Date.now()}`,
        cost: parsedCost ?? Number(selectedProduct.cost_per_unit || selectedProduct.cost || 0)
      });

      const createdBatch = result?.batch || result;
      const updatedProduct = result?.product || {
        ...currentProduct,
        quantity: oldQuantity + quantityToAdd,
        cost: parsedCost ?? Number(currentProduct?.cost_per_unit || currentProduct?.cost || 0),
        cost_per_unit: parsedCost ?? Number(currentProduct?.cost_per_unit || currentProduct?.cost || 0),
        updated_at: new Date().toISOString()
      };

      if (createdBatch?.id || createdBatch?.productId || createdBatch?.product_id) {
        setBatchList(prev => [...prev, createdBatch]);
      }

      setProductList(prev => mergeProductsById(prev, [updatedProduct]));
      upsertProducts(updatedProduct);

      const latestQuantity = Number(updatedProduct?.quantity ?? (oldQuantity + quantityToAdd));
      const threshold = Number(updatedProduct?.reorder_level || selectedProduct.reorder_level || 0);

      window.dispatchEvent(new CustomEvent('stock_updated', {
        detail: {
          productId: selectedProduct.id,
          quantity: latestQuantity,
          timestamp: Date.now()
        }
      }));

      if (threshold > 0 && latestQuantity <= threshold) {
        showNotification(`⚠️ Low stock alert: ${selectedProduct.name} is at ${latestQuantity} (threshold ${threshold})`, 'warning');
      } else {
        showNotification(`✅ Stock added! ${selectedProduct.name} quantity: ${oldQuantity} → ${latestQuantity}`, 'success');
      }

      setNewStock({ quantity: '', expiryDate: '', batchNumber: '', cost: '' });
      setShowAddStock(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Failed to add stock:', error);
      showNotification(`❌ Failed to add stock: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setIsAddingStock(false);
    }
  };



  const handleEditProduct = async (e) => {
    e.preventDefault();
    if (isUpdatingProduct) return;

    try {
      setIsUpdatingProduct(true);
      const originalProduct = productList.find(p => p.id === editProduct.id);
      if (!originalProduct) {
        showNotification('❌ Product not found for update', 'error');
        return;
      }

      const parsedPrice = Number(editProduct.price);
      const parsedCost = editProduct.cost === '' ? null : Number(editProduct.cost);
      const parsedReorder = editProduct.reorder_level === '' ? null : Number(editProduct.reorder_level);

      if (!Number.isFinite(parsedPrice)) {
        showNotification('❌ Enter a valid price', 'error');
        return;
      }
      if (parsedCost !== null && !Number.isFinite(parsedCost)) {
        showNotification('❌ Enter a valid cost', 'error');
        return;
      }
      if (parsedReorder !== null && !Number.isFinite(parsedReorder)) {
        showNotification('❌ Enter a valid low-stock level', 'error');
        return;
      }

      const originalCost = Number(originalProduct.cost_per_unit || originalProduct.cost || 0);
      const safeCost = parsedCost === null ? originalCost : parsedCost;
      const costChanged = parsedCost !== null && parsedCost !== originalCost;

      // Keep image if user does not provide a new one.
      const safeImage = editProduct.image === '' ? (originalProduct.image || '') : editProduct.image;
      const updateData = {
        ...editProduct,
        image: safeImage,
        price: parsedPrice,
        reorder_level: parsedReorder ?? Number(originalProduct.reorder_level || 0)
      };

      // Quantity is managed via Add Stock, not edit payload.
      delete updateData.quantity;
      // Only include cost fields when the admin explicitly changed them.
      // This prevents a stale edit-modal value from overwriting a cost update
      // that a batch receipt just applied.
      if (costChanged) {
        updateData.cost = safeCost;
        updateData.cost_per_unit = safeCost;
      } else {
        delete updateData.cost;
        delete updateData.cost_per_unit;
      }

      setIsSyncing(true);
      showNotification('⚡ Updating product...', 'info');

      const result = await products.update(editProduct.id, updateData);
      if (result && result.id) {
        setProductList(prevList => mergeProductsById(prevList, [result]));
        upsertProducts(result);
      }

      setShowEditModal(false);

      window.dispatchEvent(new CustomEvent('productUpdated', {
        detail: {
          product: result,
          originalProduct,
          timestamp: new Date().toISOString(),
          type: 'update'
        }
      }));

      window.dispatchEvent(new CustomEvent('stock_updated', {
        detail: {
          productId: result.id,
          quantity: result.quantity,
          product: result,
          timestamp: Date.now()
        }
      }));

      if (isRealTimeProductSyncEnabled()) {
        showNotification('✅ Product updated and synced!', 'success');
      } else {
        showNotification('✅ Product updated successfully!', 'success');
      }

      setLastSync(new Date());
    } catch (error) {
      console.error('Failed to update product:', error);
      showNotification(`❌ Update failed: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setIsSyncing(false);
      setIsUpdatingProduct(false);
    }
  };



  const handleDelete = async (id) => {
    try {
      if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
        return;
      }

      const productToDelete = productList.find(p => p.id === id);
      const result = await products.delete(id);
      

      // Update local state immediately for better UX
      setProductList(prevProducts => prevProducts.filter(p => p.id !== id));
      removeProduct(id);
      
      // Trigger real-time sync notification if enabled
      if (isRealTimeProductSyncEnabled() && productToDelete) {
        setIsSyncing(true);
        window.dispatchEvent(new CustomEvent('productDeleted', { 
          detail: { 
            product: productToDelete,
            timestamp: new Date().toISOString(),
            type: 'delete'
          }
        }));
        
        // Show sync notification
        showNotification(`📡 Product "${productToDelete.name}" deleted and synced to all dashboards!`, 'success');
        setLastSync(new Date());
        
        // Clear sync status after 3 seconds
        setTimeout(() => {
          setIsSyncing(false);
        }, 3000);
      } else {
        // Show success message
        const successMessage = result?.message || 'Product deleted successfully!';
        alert(successMessage);
      }
      
    } catch (error) {
      console.error('Failed to delete product:', error);
      
      // Provide more specific error messages
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
  };



  const filteredProducts = useMemo(() => (productList || []).filter(p => {
    if (!p) return false;
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' ||
      (filter === 'raw' && !hasRecipe(p)) ||
      (filter === 'composite' && hasRecipe(p)) ||
      (filter === 'expense' && p.expenseOnly) ||
      (filter === 'low-stock' && (p.reorder_level || 0) > 0 && (p.quantity || 0) <= (p.reorder_level || 0));
    return matchesSearch && matchesFilter;
  }), [productList, searchTerm, filter]);

  const rawProducts = useMemo(() => (productList || []).filter(p => p && !hasRecipe(p) && !p.expenseOnly), [productList]);
  const compositeProducts = useMemo(() => (productList || []).filter(p => p && hasRecipe(p)), [productList]);
  const expenseProducts = useMemo(() => (productList || []).filter(p => p && p.expenseOnly), [productList]);


  const calculateMaxProducible = (product) => {
    if (!product || !hasRecipe(product)) return 0;
    let max = Infinity;
    (product.recipe || []).forEach(ingredient => {
      if (!ingredient) return;

      const raw = productById.get(Number(ingredient.productId || ingredient.product_id));
      if (raw && raw.quantity > 0 && ingredient.quantity > 0) {
        const possible = Math.floor(raw.quantity / ingredient.quantity);
        max = Math.min(max, possible);
      }
    });
    return max === Infinity ? 0 : max;
  };

  const calculateCOGS = (product) => {
    if (!product) return 0;
    if (!hasRecipe(product)) {
      // Use cost_per_unit (always synced with cost on the backend).
      return Number(product.cost_per_unit || product.costPerUnit || product.cost || 0);
    }
    let totalCost = 0;
    (product.recipe || []).forEach(ingredient => {
      if (!ingredient) return;
      // Support both camelCase (productId, from Recipes.jsx) and snake_case (product_id)
      const ingProductId = ingredient.productId || ingredient.product_id;
      const raw = productById.get(Number(ingProductId));
      if (raw) {
        // Always use cost_per_unit — it is the fixed unit cost and doesn't vary with stock level.
        const unitCost = Number(raw.cost_per_unit || raw.costPerUnit || raw.cost || 0);
        totalCost += unitCost * (ingredient.quantity || 0);
      }
    });
    return totalCost;
  };

  // Weight-based pricing handlers
  const openWeightPricingModal = async (product) => {
    setSelectedProduct(product);
    try {
      const data = await products.getWeightPricing(product.id);
      setWeightPricing(data.weightPricing || {});
    } catch (error) {
      console.error('Failed to load weight pricing:', error);
      setWeightPricing({});
    }
    setShowWeightPricingModal(true);
  };

  const handleAddWeightPrice = async (e) => {
    e.preventDefault();
    if (!newWeightPrice.weight || !newWeightPrice.price) {
      showNotification('❌ Please enter both weight and price', 'error');
      return;
    }

    try {
      const weight = parseFloat(newWeightPrice.weight);
      const price = parseFloat(newWeightPrice.price);
      
      // Validate weight is valid increment (0.1kg increments)
      if ((weight * 10) % 1 !== 0) {
        showNotification('❌ Weight must be in 0.1kg increments (0.1, 0.2, 0.3, etc)', 'error');
        return;
      }

      await products.addWeightPrice(selectedProduct.id, weight, price);
      setWeightPricing({...weightPricing, [String(weight)]: price});
      setNewWeightPrice({ weight: '', price: '' });
      showNotification(`✅ Weight price added for ${weight}kg`, 'success');
    } catch (error) {
      showNotification(`❌ Failed to add weight price: ${error.message}`, 'error');
    }
  };

  const handleDeleteWeightPrice = async (weight) => {
    if (!confirm(`Delete pricing for ${weight}kg?`)) return;
    
    try {
      await products.deleteWeightPrice(selectedProduct.id, weight);
      const updated = {...weightPricing};
      delete updated[String(weight)];
      setWeightPricing(updated);
      showNotification(`✅ Weight price for ${weight}kg deleted`, 'success');
    } catch (error) {
      showNotification(`❌ Failed to delete weight price: ${error.message}`, 'error');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
          notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
          notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
          'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              className="input w-full pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="input w-full md:w-48"
          >
            <option value="all">All Products</option>
            <option value="raw">Raw Materials</option>
            <option value="composite">Composite</option>
            <option value="expense">Expense Only</option>
            <option value="low-stock">Low Stock</option>
          </select>
        </div>

        <button
          onClick={() => {
            setImagePreview('');
            setShowAddModal(true);
          }}
          className="btn-primary flex w-full items-center justify-center gap-2 md:w-auto"
          disabled={isAddingProduct}
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <h4 className="text-sm font-medium text-blue-700 mb-2">Raw Materials</h4>
          <p className="text-3xl font-bold text-blue-900">{rawProducts.length}</p>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <h4 className="text-sm font-medium text-purple-700 mb-2">Composite Products</h4>
          <p className="text-3xl font-bold text-purple-900">{compositeProducts.length}</p>
        </div>
        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <h4 className="text-sm font-medium text-orange-700 mb-2">Expense Items</h4>
          <p className="text-3xl font-bold text-orange-900">{expenseProducts.length}</p>
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {(filteredProducts || []).map((product) => {
            if (!product) return null;
            const cogs = calculateCOGS(product);
            const margin = product.price ? (((product.price - cogs) / product.price) * 100).toFixed(1) : 0;
            const maxUnits = calculateMaxProducible(product);
            const isExpanded = expandedRow === product.id;
            return (
              <div key={product.id} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{product.name}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        product.expenseOnly ? 'bg-yellow-100 text-yellow-800' :
                        hasRecipe(product) ? 'bg-green-100 text-green-800' : 
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {product.expenseOnly ? 'Expense' : hasRecipe(product) ? 'Composite' : 'Raw'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openWeightPricingModal(product)} className="p-2 hover:bg-purple-50 rounded-lg text-purple-600 min-h-[44px] min-w-[44px] flex items-center justify-center" title="Edit weight-based pricing">
                      <Package className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setImagePreview(''); setEditProduct({...product, image: product.image || '', price: String(product.price ?? ''), cost: String(product.cost_per_unit || product.cost || 0), reorder_level: String(product.reorder_level ?? ''), quantity: String(product.quantity ?? 0)}); setShowEditModal(true); }} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 min-h-[44px] min-w-[44px] flex items-center justify-center" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-600 min-h-[44px] min-w-[44px] flex items-center justify-center" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-xs text-gray-500 block">Price</span><span className="font-semibold text-green-600">KSH {product.price?.toLocaleString()}</span></div>
                  <div><span className="text-xs text-gray-500 block">Cost/COGS</span><span className="text-orange-600">{cogs > 0 ? `KSH ${cogs.toLocaleString()}` : <span className="text-xs text-gray-400 italic">No cost</span>}</span></div>
                  <div><span className="text-xs text-gray-500 block">Stock</span><span className={`font-medium ${(product.quantity || 0) === 0 ? 'text-red-600' : ((product.reorder_level || 0) > 0 && (product.quantity || 0) <= (product.reorder_level || 0)) ? 'text-yellow-600' : 'text-gray-900'}`}>{product.quantity || 0} {product.unit}</span></div>
                  <div><span className="text-xs text-gray-500 block">Margin</span><span className={`font-semibold ${margin > 30 ? 'text-green-600' : margin > 15 ? 'text-yellow-600' : 'text-red-600'}`}>{margin}%</span></div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Batches: {getProductBatches(product.id).length} active</span>
                  <button onClick={() => { setSelectedProduct(product); const defaultCost = product.cost_per_unit || product.cost || 0; setNewStock(prev => ({...prev, cost: String(defaultCost)})); setShowAddStock(true); }} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium min-h-[44px] flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Stock
                  </button>
                </div>
                {hasRecipe(product) && (
                  <button onClick={() => setExpandedRow(isExpanded ? null : product.id)} className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm font-medium text-gray-700 min-h-[44px]">
                    <span>Recipe Breakdown ({product.recipe.length} ingredients)</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}
                {isExpanded && hasRecipe(product) && (
                  <div className="mt-2 space-y-2 border border-blue-100 rounded-lg p-3 bg-blue-50/50">
                    {(product.recipe || []).map((ingredient, idx) => {
                      if (!ingredient) return null;
                      const ingProductId = ingredient.productId || ingredient.product_id;
                      const raw = (productList || []).find(p => p && p.id === ingProductId);
                      if (!raw) return null;
                      const unitCost = Number(raw.cost_per_unit || raw.costPerUnit || raw.cost || 0);
                      const totalCost = unitCost * (ingredient.quantity || 0);
                      return (
                        <div key={idx} className="flex items-center justify-between text-sm border-b border-blue-100 last:border-0 pb-2 last:pb-0">
                          <span className="font-medium text-gray-700">{raw.name || 'Unknown'}</span>
                          <div className="text-right text-xs">
                            <p className="text-gray-600">{ingredient.quantity || 0} {raw.unit || 'pcs'} needed</p>
                            <p className="text-gray-500">Available: {raw.quantity || 0} {raw.unit || 'pcs'}</p>
                            <p className="font-semibold text-orange-600">KSH {totalCost.toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div className="text-right text-sm font-semibold text-orange-700 pt-2 border-t border-blue-200">
                      Total COGS per unit: KSH {cogs.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">

            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Image</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Product Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cost/COGS</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Stock</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Batches</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Max Units</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Margin</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>

            <tbody>
              {(filteredProducts || []).map((product) => {
                if (!product) return null;
                const cogs = calculateCOGS(product);
                const margin = product.price ? (((product.price - cogs) / product.price) * 100).toFixed(1) : 0;
                const maxUnits = calculateMaxProducible(product);
                const isExpanded = expandedRow === product.id;

                return (
                  <Fragment key={product.id}>

                    <tr className="border-t border-gray-100 hover:bg-gray-50 transition-colors">

                      <td className="px-4 py-3">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center" style={{ display: product.image ? 'none' : 'flex' }}>
                          <span className="text-xs text-gray-400">No Image</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {hasRecipe(product) && (
                            <button
                              onClick={() => setExpandedRow(isExpanded ? null : product.id)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          )}
                          <span className="font-medium">{product.name}</span>
                          {(product.reorder_level || 0) > 0 && (product.quantity || 0) <= (product.reorder_level || 0) && !hasRecipe(product) && (
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${
                          product.expenseOnly ? 'badge-warning' :
                          hasRecipe(product) ? 'badge-success' : 
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {product.expenseOnly ? 'Expense' : hasRecipe(product) ? 'Composite' : 'Raw'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-green-600">
                        KSH {product.price?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-orange-600">
                        {cogs > 0 ? (
                          <>KSH {cogs.toLocaleString()}</>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No cost set</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${
                            (product.quantity || 0) === 0 ? 'text-red-600' : 
                            ((product.reorder_level || 0) > 0 && (product.quantity || 0) <= (product.reorder_level || 0)) ? 'text-yellow-600' : 'text-gray-900'
                          }`}>
                            {product.quantity || 0} {product.unit}
                          </span>
                          {(product.reorder_level || 0) > 0 && (product.quantity || 0) <= (product.reorder_level || 0) && (product.quantity || 0) > 0 && (
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          )}
                          {(product.quantity || 0) === 0 && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                              Out of Stock
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">{getProductBatches(product.id).length} active</span>
                          <button 
                            onClick={() => {
                              console.log('🔵 Add Stock clicked for product:', product.name, product.id);
                              setSelectedProduct(product);
                              const defaultCost = product.cost_per_unit || product.cost || 0;
                              setNewStock(prev => ({
                                ...prev,
                                cost: String(defaultCost)
                              }));
                              setShowAddStock(true);
                              console.log('🔵 Modal state set - showAddStock: true, selectedProduct:', product.name);
                            }}
                            className="p-1 hover:bg-blue-50 rounded text-blue-600 transition-colors"
                            title="Add Stock"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {hasRecipe(product) ? (
                          <span className="font-semibold text-blue-600">{maxUnits} units</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${margin > 30 ? 'text-green-600' : margin > 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {margin}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openWeightPricingModal(product)}
                            className="p-2 hover:bg-purple-50 rounded-lg text-purple-600 transition-colors"
                            title="Edit weight-based pricing"
                          >
                            <Package className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setImagePreview('');
                              setEditProduct({
                                ...product,
                                image: product.image || '',
                                price: String(product.price ?? ''),
                                cost: String(product.cost_per_unit || product.cost || 0),
                                reorder_level: String(product.reorder_level ?? ''),
                                quantity: String(product.quantity ?? 0)
                              });
                              setShowEditModal(true);
                            }}
                            className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    

                    {/* Expanded Row - Recipe Breakdown */}
                    {isExpanded && hasRecipe(product) && (
                      <tr className="bg-blue-50">
                        <td colSpan="9" className="px-4 py-4">
                          <div className="ml-8">
                            <h4 className="font-semibold text-sm text-gray-700 mb-3">Recipe Breakdown:</h4>
                            <table className="w-full text-sm">
                              <thead className="bg-white">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Ingredient</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Quantity Needed</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Available</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Unit Cost</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Total Cost</th>
                                </tr>
                              </thead>

                              <tbody>
                                {(product.recipe || []).map((ingredient, idx) => {
                                  if (!ingredient) return null;
                                  const ingProductId = ingredient.productId || ingredient.product_id;
                                  const raw = (productList || []).find(p => p && p.id === ingProductId);
                                  if (!raw) return null;
                                  // Use the fixed unit cost — don't divide by stock quantity
                                  const unitCost = Number(raw.cost_per_unit || raw.costPerUnit || raw.cost || 0);
                                  const totalCost = unitCost * (ingredient.quantity || 0);
                                  return (
                                    <tr key={idx} className="border-t border-blue-100">
                                      <td className="px-3 py-2">{raw.name || 'Unknown'}</td>
                                      <td className="px-3 py-2">{ingredient.quantity || 0} {raw.unit || 'pcs'}</td>
                                      <td className="px-3 py-2">{raw.quantity || 0} {raw.unit || 'pcs'}</td>
                                      <td className="px-3 py-2">KSH {unitCost.toFixed(2)}</td>
                                      <td className="px-3 py-2 font-semibold">KSH {totalCost.toFixed(2)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot className="bg-white font-semibold">
                                <tr>
                                  <td colSpan="4" className="px-3 py-2 text-right">Total COGS per unit:</td>
                                  <td className="px-3 py-2 text-orange-600">KSH {cogs.toFixed(2)}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>


      {/* Add Stock Modal */}
      {showAddStock && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowAddStock(false);
            setSelectedProduct(null);
          }
        }}>
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Add Stock for {selectedProduct.name}</h3>
            <form onSubmit={handleAddStock} className="space-y-4">
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
                step="0.01"
                placeholder="Cost per Unit"
                className="input"
                value={newStock.cost}
                onChange={(e) => setNewStock({ ...newStock, cost: e.target.value })}
              />
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1" disabled={isAddingStock}>
                  {isAddingStock ? 'Adding...' : 'Add Stock'}
                </button>
                <button type="button" onClick={() => {
                  setShowAddStock(false);
                  setSelectedProduct(null);
                  setNewStock({ quantity: '', expiryDate: '', batchNumber: '', cost: '' });
                }} className="btn-secondary" disabled={isAddingStock}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5">
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Add New Product</h3>
              <p className="text-sm text-gray-500">Create products faster with inline image preview and quick pricing.</p>
            </div>
            <form onSubmit={handleAddProduct} className="space-y-5">
              <input
                type="text"
                placeholder="Product Name"
                className="input"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                required
              />
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Product Image</label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, true)}
                    className="input"
                  />
                  <Camera className="w-5 h-5 text-gray-400" />
                </div>
                {(imagePreview || newProduct.image) && (
                  <div className="mt-2">
                    <img src={imagePreview || newProduct.image} alt="Preview" className="w-24 h-24 object-cover rounded-lg border" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  className="input"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Cost"
                  className="input"
                  value={newProduct.cost}
                  onChange={(e) => setNewProduct({ ...newProduct, cost: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="Low stock alert at (e.g. 10)"
                  className="input"
                  value={newProduct.reorder_level}
                  onChange={(e) => setNewProduct({ ...newProduct, reorder_level: e.target.value })}
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Initial Stock"
                  className="input"
                  value={newProduct.quantity}
                  onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <select
                  className="input"
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                >
                  <option value="pcs">Pieces</option>
                  <option value="kg">Kilograms</option>
                  <option value="L">Liters</option>
                  <option value="g">Grams</option>
                  <option value="ml">Milliliters</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newProduct.expenseOnly}
                    onChange={(e) => setNewProduct({ ...newProduct, expenseOnly: e.target.checked, visibleToCashier: !e.target.checked })}
                  />
                  <span className="text-sm">Expense Only (Hidden from cashier)</span>
                </label>
                {!newProduct.expenseOnly && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newProduct.visibleToCashier}
                      onChange={(e) => setNewProduct({ ...newProduct, visibleToCashier: e.target.checked })}
                    />
                    <span className="text-sm">Visible to Cashier</span>
                  </label>
                )}
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1" disabled={isAddingProduct || isImageLoading}>
                  {isAddingProduct ? 'Adding...' : isImageLoading ? 'Processing Image...' : 'Add Product'}
                </button>
                <button type="button" onClick={() => {
                  setShowAddModal(false);
                  setImagePreview('');
                  setNewProduct({ name: '', price: '', cost: '', category: 'finished', unit: 'pcs', quantity: '0', expenseOnly: false, image: '', visibleToCashier: true, reorder_level: '' });
                }} className="btn-secondary" disabled={isAddingProduct || isImageLoading}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5">
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Edit Product</h3>
              <p className="text-sm text-gray-500">Changes save fast and sync across cashiers.</p>
            </div>
            <form onSubmit={handleEditProduct} className="space-y-5">
              <input
                type="text"
                placeholder="Product Name"
                className="input"
                value={editProduct.name}
                onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                required
              />
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Product Image</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Image URL"
                    className="input flex-1"
                    value={editProduct.image || ''}
                    onChange={(e) => setEditProduct({ ...editProduct, image: e.target.value })}
                  />
                  <span className="text-sm text-gray-500 self-center">or</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="input flex-1"
                    onChange={(e) => handleImageUpload(e, false)}
                  />
                </div>
                {editProduct.image && (
                  <img src={editProduct.image} alt="Preview" className="w-20 h-20 object-cover rounded" />
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  className="input"
                  value={editProduct.price ?? ''}
                  onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Cost"
                  className="input"
                  value={editProduct.cost ?? ''}
                  onChange={(e) => setEditProduct({ ...editProduct, cost: e.target.value })}
                  required
                />
              </div>
              <input
                type="number"
                step="1"
                min="0"
                placeholder="Low stock alert at (e.g. 10)"
                className="input"
                value={editProduct.reorder_level ?? ''}
                onChange={(e) => setEditProduct({ ...editProduct, reorder_level: e.target.value })}
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Quantity"
                    className="input bg-gray-100 cursor-not-allowed"
                    value={editProduct.quantity ?? ''}
                    readOnly
                    disabled
                    title="Use 'Add Stock' button to update quantity"
                  />
                  <span className="absolute right-3 top-3 text-xs text-gray-500">
                    Read-only
                  </span>
                </div>
                <select
                  className="input"
                  value={editProduct.unit || 'pcs'}
                  onChange={(e) => setEditProduct({ ...editProduct, unit: e.target.value })}
                >
                  <option value="pcs">Pieces</option>
                  <option value="kg">Kilograms</option>
                  <option value="L">Liters</option>
                  <option value="g">Grams</option>
                  <option value="ml">Milliliters</option>
                </select>
              </div>
              <select
                className="input"
                value={editProduct.category || 'raw'}
                onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })}
              >
                <option value="raw">Raw Material</option>
                <option value="finished">Finished Product</option>
              </select>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editProduct.expenseOnly || false}
                    onChange={(e) => setEditProduct({ ...editProduct, expenseOnly: e.target.checked, visibleToCashier: !e.target.checked })}
                  />
                  <span className="text-sm">Expense Only (Hidden from cashier)</span>
                </label>
                {!editProduct.expenseOnly && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editProduct.visibleToCashier !== false}
                      onChange={(e) => setEditProduct({ ...editProduct, visibleToCashier: e.target.checked })}
                    />
                    <span className="text-sm">Visible to Cashier</span>
                  </label>
                )}
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1" disabled={isUpdatingProduct}>
                  {isUpdatingProduct ? 'Updating...' : 'Update Product'}
                </button>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary" disabled={isUpdatingProduct}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Weight-Based Pricing Modal */}
      {showWeightPricingModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6">
            <h3 className="text-xl font-bold mb-4">Weight-Based Pricing - {selectedProduct.name}</h3>
            <p className="text-sm text-gray-600 mb-4">Set different prices for different weights (in 0.1kg increments)</p>
            
            <div className="space-y-4">
              {/* Add new weight price */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-sm text-gray-700">Add New Weight Price</h4>
                <form onSubmit={handleAddWeightPrice} className="flex flex-col gap-3 md:flex-row">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="Weight (kg) - e.g., 0.1, 0.5, 1.0"
                    className="input flex-1"
                    value={newWeightPrice.weight}
                    onChange={(e) => setNewWeightPrice({...newWeightPrice, weight: e.target.value})}
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Price (KSH)"
                    className="input flex-1"
                    value={newWeightPrice.price}
                    onChange={(e) => setNewWeightPrice({...newWeightPrice, price: e.target.value})}
                    required
                  />
                  <button type="submit" className="btn-primary whitespace-nowrap">Add Price</button>
                </form>
              </div>

              {/* Existing weight prices */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-sm text-gray-700 mb-3">Current Prices</h4>
                {Object.keys(weightPricing).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(weightPricing)
                      .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
                      .map(([weight, price]) => (
                        <div key={weight} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex-1">
                            <span className="font-medium">{weight} kg</span>
                            <span className="text-gray-600 ml-4">KSH {parseFloat(price).toLocaleString()}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteWeightPrice(weight)}
                            className="text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm font-medium transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No weight-based pricing set. Add one above.</p>
                )}
              </div>

              {/* Base price info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Base price:</strong> KSH {selectedProduct.price?.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button 
                onClick={() => {
                  setShowWeightPricingModal(false);
                  setSelectedProduct(null);
                  setWeightPricing({});
                  setNewWeightPrice({ weight: '', price: '' });
                }}
                className="btn-secondary flex-1"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
