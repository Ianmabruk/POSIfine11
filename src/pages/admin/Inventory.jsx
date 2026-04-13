

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductsContext';
import { products, batches } from '../../services/api';
import websocketService from '../../services/websocketService';
import { Plus, Search, Edit2, Trash2, ChevronDown, ChevronUp, AlertTriangle, Camera, Package } from 'lucide-react';



export default function Inventory() {
  const { user, isUltraPackage, isRealTimeProductSyncEnabled } = useAuth();
  const { products: globalProducts, refreshProducts } = useProducts();
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
  const [newProduct, setNewProduct] = useState({
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

  // Load data function
  const loadData = async () => {
    try {
      console.log('📦 Loading inventory data...');
      await refreshProducts();
      const batchData = await batches.getAll();
      setBatchList(batchData);
      console.log('✅ Inventory data loaded');
    } catch (error) {
      console.error('❌ Failed to load data:', error);
      showNotification('Failed to load inventory data', 'error');
    }
  };

  useEffect(() => {
    // Initial load only
    if (!hasLoadedInitially) {
      loadData();
      setHasLoadedInitially(true);
    }
    
    // Connect to WebSocket for real-time stock updates
    const token = localStorage.getItem('token');
    if (token) {
      // Debounce WebSocket updates to prevent rapid-fire glitches
      let wsUpdateTimeout = null;
      websocketService.connect(token, (data) => {
        // When stock update received, merge with existing products (don't replace)
        if (data && data.allProducts && data.allProducts.length > 0) {
          console.log('📦 WebSocket stock update received:', data.allProducts.length, 'products');
          
          // Clear previous timeout
          if (wsUpdateTimeout) clearTimeout(wsUpdateTimeout);
          
          // Debounce: wait 200ms before applying update
          wsUpdateTimeout = setTimeout(() => {
            setProductList(prevList => {
              // If we have no products yet, use the new data
              if (prevList.length === 0) {
                return data.allProducts;
              }
              
              // Merge: Keep existing products but update fields from WebSocket
              const productMap = new Map(prevList.map(p => [p.id, p]));
              data.allProducts.forEach(newProduct => {
                const existing = productMap.get(newProduct.id);
                if (existing) {
                  productMap.set(newProduct.id, { ...existing, ...newProduct });
                } else {
                  // Add new products
                  productMap.set(newProduct.id, newProduct);
                }
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
          setProductList(saleData.updatedProducts);
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
      websocketService.disconnect();
    };
  }, [hasLoadedInitially]);

  // Sync with global products whenever they change
  // This ensures inventory always shows the latest stock from backend
  useEffect(() => {
    if (globalProducts && globalProducts.length > 0) {
      console.log('📦 Syncing from global context:', globalProducts.length, 'products');
      // Update product list while preserving any local temporary states
      setProductList(prevList => {
        // If we have temporary products (with temp IDs), keep them
        const tempProducts = prevList.filter(p => typeof p.id === 'string' && p.id.startsWith('temp-'));
        // Merge with global products
        return [...tempProducts, ...globalProducts];
      });
    }
  }, [globalProducts]);

  const handleImageUpload = (e, isNewProduct = true) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 2MB for fast loading)
      if (file.size > 2 * 1024 * 1024) {
        showNotification('Image must be smaller than 2MB', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        setImagePreview(base64);
        if (isNewProduct) {
          setNewProduct({ ...newProduct, image: base64 });
        } else {
          // FAST UPDATE: Show image immediately in edit product
          setEditProduct({ ...editProduct, image: base64 });
          
          // Auto-save image after upload (debounced, happens in background)
          if (editProduct.id) {
            setTimeout(async () => {
              try {
                const updated = await products.update(editProduct.id, { image: base64 });
                if (updated?.id) {
                  setProductList(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
                  refreshProducts().catch(() => {});
                  window.dispatchEvent(new CustomEvent('productUpdated', {
                    detail: { product: updated, timestamp: Date.now(), type: 'image' }
                  }));
                }
                showNotification('✅ Image saved', 'success');
              } catch (error) {
                console.error('Failed to save image:', error);
                // Silently fail - user can retry
              }
            }, 500); // Small delay to avoid multiple rapid uploads
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getProductStock = (productId) => {
    const productBatches = batchList.filter(b => b.productId === productId && b.quantity > 0);
    return productBatches.reduce((total, batch) => total + batch.quantity, 0);
  };

  const getProductBatches = (productId) => {
    return batchList.filter(b => b.productId === productId && b.quantity > 0);
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
    try {
      const parsedCost = parseFloat(newProduct.cost || 0);
      const productData = {
        ...newProduct,
        price: parseFloat(newProduct.price),
        cost: Number.isFinite(parsedCost) ? parsedCost : 0,
        cost_per_unit: Number.isFinite(parsedCost) ? parsedCost : 0,
        quantity: 0, // Stock managed through batches
        visibleToCashier: !newProduct.expenseOnly && newProduct.visibleToCashier !== false,
        reorder_level: newProduct.reorder_level === '' ? undefined : parseFloat(newProduct.reorder_level)
      };
      
      // OPTIMISTIC UPDATE: Add product to UI immediately with temporary ID
      const tempId = `temp-${Date.now()}`;
      const optimisticProduct = { ...productData, id: tempId, created_at: new Date().toISOString() };
      setProductList(prev => [...prev, optimisticProduct]);
      
      // Reset form and close modal IMMEDIATELY
      setNewProduct({ name: '', price: '', cost: '', category: 'finished', unit: 'pcs', expenseOnly: false, image: '', visibleToCashier: true, reorder_level: '' });
      setImagePreview('');
      setShowAddModal(false);
      
      showNotification('⚡ Adding product...', 'info');
      
      try {
        // Make API call in background
        const result = await products.create(productData);
        
        // Replace temporary product with real one
        setProductList(prev => prev.map(p => p.id === tempId ? result : p));
        
        showNotification(`✅ Product "${result.name}" added successfully! ${result.visibleToCashier ? 'Cashiers can now see this product.' : 'This product is hidden from cashiers.'}`, 'success');
        
        // Dispatch events to notify cashier dashboard
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
        
        // Refresh data in background to ensure sync
        loadData().catch(err => console.warn('Background refresh failed:', err));
        
      } catch (apiError) {
        // Rollback optimistic update on failure
        setProductList(prev => prev.filter(p => p.id !== tempId));
        throw apiError;
      }
      
    } catch (error) {
      console.error('Failed to create product:', error);
      showNotification(`❌ Failed to add product: ${error.message || 'Unknown error'}`, 'error');
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    console.log('📦 handleAddStock called - Form submitted');
    console.log('📦 newStock:', newStock);
    console.log('📦 selectedProduct:', selectedProduct);
    
    try {
      const quantityToAdd = parseInt(newStock.quantity);
      
      if (!quantityToAdd || quantityToAdd <= 0) {
        showNotification('⚠️ Please enter a valid quantity', 'warning');
        console.log('⚠️ Invalid quantity:', quantityToAdd);
        return;
      }
      
      const currentProduct = productList.find(p => p.id === selectedProduct.id);
      const oldQuantity = currentProduct?.quantity || 0;
      
      console.log(`📦 STOCK BEFORE: ${selectedProduct.name} = ${oldQuantity} units`);
      console.log(`✅ Adding ${quantityToAdd} units to ${selectedProduct.name}`);
      
      // OPTIMISTIC UPDATE: Update product quantity immediately
      if (currentProduct) {
        const newQuantity = oldQuantity + quantityToAdd;
        setProductList(prev => 
          prev.map(p => p.id === selectedProduct.id ? { ...p, quantity: newQuantity } : p)
        );
        console.log(`📦 OPTIMISTIC UPDATE: ${oldQuantity} → ${newQuantity}`);
      }
      
      // Create batch record optimistically
      const newBatch = {
        id: `batch-${Date.now()}`,
        productId: selectedProduct.id,
        quantity: quantityToAdd,
        expiryDate: newStock.expiryDate,
        batchNumber: newStock.batchNumber || `BATCH-${Date.now()}`,
        cost: parseFloat(newStock.cost || selectedProduct.cost || 0)
      };

      setBatchList(prev => [...prev, newBatch]);
      showNotification('⚡ Adding stock...', 'info');

      try {
        // Make API call - backend will update product quantity AND create batch
        let result = null;
        try {
          result = await batches.create({
            productId: selectedProduct.id,
            quantity: quantityToAdd,
            expiryDate: newStock.expiryDate,
            batchNumber: newStock.batchNumber || `BATCH-${Date.now()}`,
            cost: parseFloat(newStock.cost || selectedProduct.cost || 0)
          });
        } catch (batchError) {
          console.warn('Batches API failed, falling back to direct stock update:', batchError.message);
          const fallbackQuantity = oldQuantity + quantityToAdd;
          await products.updateStock(selectedProduct.id, { quantity: fallbackQuantity });
        }

        if (result) {
          console.log('✅ BACKEND: Batch created successfully:', result);
        }

        // Close form and reset immediately (avoid UI lag)
        setNewStock({ quantity: '', expiryDate: '', batchNumber: '', cost: '' });
        setShowAddStock(false);

        // Refresh in background to confirm authoritative state
        console.log('🔄 Refreshing products from backend to confirm stock update...');
        refreshProducts().then((updatedProducts) => {
          const updatedProduct = updatedProducts?.find(p => p.id === selectedProduct.id);
          if (updatedProduct) {
            console.log(`📦 STOCK AFTER DB UPDATE: ${updatedProduct.name} = ${updatedProduct.quantity} units`);
            console.log(`✅ DB PERSISTED: Stock increased from ${oldQuantity} to ${updatedProduct.quantity}`);
            setProductList(prev =>
              prev.map(p => p.id === selectedProduct.id ? updatedProduct : p)
            );
          }

          const latestQuantity = updatedProduct?.quantity || (oldQuantity + quantityToAdd);
          const threshold = parseFloat(updatedProduct?.reorder_level || selectedProduct.reorder_level || 0) || 0;

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
        }).catch((err) => {
          console.warn('Background refresh failed:', err);
          showNotification(`✅ Stock added! ${selectedProduct.name} quantity: ${oldQuantity} → ${oldQuantity + quantityToAdd}`, 'success');
        });

      } catch (apiError) {
        console.error('❌ BACKEND ERROR:', apiError);
        // Rollback optimistic update on failure
        if (currentProduct) {
          setProductList(prev => 
            prev.map(p => p.id === selectedProduct.id ? currentProduct : p)
          );
          console.log(`🔄 ROLLBACK: Restored ${selectedProduct.name} to ${oldQuantity} units`);
        }
        setBatchList(prev => prev.filter(b => b.id !== newBatch.id));
        throw apiError;
      } finally {
        setSelectedProduct(null);
      }
    } catch (error) {
      console.error('Failed to add stock:', error);
      showNotification(`❌ Failed to add stock: ${error.message || 'Unknown error'}`, 'error');
    }
  };



  const handleEditProduct = async (e) => {
    e.preventDefault();
    try {
      const originalProduct = productList.find(p => p.id === editProduct.id);
      if (parseFloat(editProduct.price) < originalProduct.price) {
        alert('You cannot lower prices, only increase.');
        return;
      }

      const parsedCost = parseFloat(editProduct.cost);
      const hasValidCost = Number.isFinite(parsedCost) && editProduct.cost !== '';
      // Use || so a stored 0 falls through to the next real value
      const originalCost = Number(originalProduct.cost_per_unit || originalProduct.cost || 0);
      // Preserve original non-zero cost if user cleared or kept the field as 0
      const safeCost = hasValidCost && (parsedCost > 0 || originalCost === 0) ? parsedCost : originalCost;
      
      // Don't send quantity - stock is managed via "Add Stock" button only
      const updateData = {
        ...editProduct,
        price: parseFloat(editProduct.price),
        cost: safeCost,
        cost_per_unit: safeCost,
        quantity: originalProduct.quantity,  // Preserve existing quantity
        reorder_level: editProduct.reorder_level === '' ? originalProduct.reorder_level : parseFloat(editProduct.reorder_level)
      };

      // OPTIMISTIC UPDATE: Update UI immediately with preserved quantity
      const optimisticProduct = { ...originalProduct, ...updateData };
      setProductList(prevList => 
        prevList.map(p => p.id === editProduct.id ? optimisticProduct : p)
      );

      // Show loading state
      setIsSyncing(true);
      showNotification('⚡ Updating product...', 'info');
      
      try {
        // Make API call and wait for response
        const result = await products.update(editProduct.id, updateData);
        
        // Update product list with the actual result from backend
        if (result && result.id) {
          setProductList(prevList => 
            prevList.map(p => p.id === editProduct.id ? result : p)
          );
          console.log('✅ Product updated with backend response:', result);
        }

        // Refresh global products to keep COGS and costs in sync
        refreshProducts().then((updatedProducts) => {
          if (Array.isArray(updatedProducts) && updatedProducts.length > 0) {
            setProductList(prevList => {
              const tempProducts = prevList.filter(p => typeof p.id === 'string' && p.id.startsWith('temp-'));
              return [...tempProducts, ...updatedProducts];
            });
          }
        }).catch((err) => {
          console.warn('Failed to refresh products after update:', err);
        });
        
        setShowEditModal(false);
        
        // ALWAYS dispatch events to cashier dashboard - don't make it conditional
        // Dispatch productUpdated event
        window.dispatchEvent(new CustomEvent('productUpdated', { 
          detail: { 
            product: result,
            originalProduct,
            timestamp: new Date().toISOString(),
            type: 'update'
          }
        }));
        
        // Also dispatch stock_updated event so cashier refreshes product list
        window.dispatchEvent(new CustomEvent('stock_updated', {
          detail: { 
            productId: result.id,
            quantity: result.quantity,
            product: result,
            timestamp: Date.now()
          }
        }));
        
        if (isRealTimeProductSyncEnabled()) {
          showNotification(`✅ Product updated and synced!`, 'success');
        } else {
          showNotification('✅ Product updated successfully!', 'success');
        }
        
        setLastSync(new Date());
      } catch (updateError) {
        // Rollback on API error
        setProductList(prevList => 
          prevList.map(p => p.id === editProduct.id ? originalProduct : p)
        );
        throw updateError;
      } finally {
        setIsSyncing(false);
      }
      
    } catch (error) {
      console.error('Failed to update product:', error);
      showNotification(`❌ Update failed: ${error.message || 'Unknown error'}`, 'error');
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
      
      // Refresh products to ensure sync with backend
      await refreshProducts();
      
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



  const filteredProducts = (productList || []).filter(p => {
    if (!p) return false;
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
      (filter === 'raw' && !p.recipe) ||
      (filter === 'composite' && p.recipe) ||
      (filter === 'expense' && p.expenseOnly) ||
      (filter === 'low-stock' && (p.reorder_level || 0) > 0 && (p.quantity || 0) <= (p.reorder_level || 0));
    return matchesSearch && matchesFilter;
  });


  const rawProducts = (productList || []).filter(p => p && !p.recipe && !p.expenseOnly);
  const compositeProducts = (productList || []).filter(p => p && p.recipe);
  const expenseProducts = (productList || []).filter(p => p && p.expenseOnly);


  const calculateMaxProducible = (product) => {
    if (!product || !product.recipe) return 0;
    let max = Infinity;
    (product.recipe || []).forEach(ingredient => {
      if (!ingredient) return;

      const raw = (productList || []).find(p => p && p.id === ingredient.productId);
      if (raw && raw.quantity > 0 && ingredient.quantity > 0) {
        const possible = Math.floor(raw.quantity / ingredient.quantity);
        max = Math.min(max, possible);
      }
    });
    return max === Infinity ? 0 : max;
  };

  const calculateCOGS = (product) => {
    if (!product) return 0;
    if (!product.recipe) {
      const costPerUnit = Number(product.cost_per_unit ?? product.costPerUnit ?? 0);
      const baseCost = costPerUnit > 0 ? costPerUnit : Number(product.cost ?? 0);
      return Number(baseCost || 0);
    }
    let totalCost = 0;
    (product.recipe || []).forEach(ingredient => {
      if (!ingredient) return;

      const raw = (productList || []).find(p => p && p.id === ingredient.productId);
      if (raw) {
        const rawCostPerUnit = raw.cost_per_unit || raw.costPerUnit;
        const unitCost = rawCostPerUnit
          ? Number(rawCostPerUnit)
          : (raw.quantity > 0 ? (raw.cost || 0) / raw.quantity : (raw.cost || 0));
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              className="input pl-10 w-80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="input w-40"
          >
            <option value="all">All Products</option>
            <option value="raw">Raw Materials</option>
            <option value="composite">Composite</option>
            <option value="expense">Expense Only</option>
            <option value="low-stock">Low Stock</option>
          </select>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
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
        <div className="overflow-x-auto">
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
                  <>

                    <tr key={product.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">

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
                          {product.recipe && (
                            <button
                              onClick={() => setExpandedRow(isExpanded ? null : product.id)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          )}
                          <span className="font-medium">{product.name}</span>
                          {(product.reorder_level || 0) > 0 && (product.quantity || 0) <= (product.reorder_level || 0) && !product.recipe && (
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${
                          product.expenseOnly ? 'badge-warning' :
                          product.recipe ? 'badge-success' : 
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {product.expenseOnly ? 'Expense' : product.recipe ? 'Composite' : 'Raw'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-green-600">
                        KSH {product.price?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-orange-600">
                        KSH {cogs.toLocaleString()}
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
                        {product.recipe ? (
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
                              setEditProduct({
                                ...product,
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
                    {isExpanded && product.recipe && (
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

                                  const raw = (productList || []).find(p => p && p.id === ingredient.productId);
                                  if (!raw) return null;
                                  const unitCost = (raw.cost || 0) / (raw.quantity || 1);
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
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>


      {/* Add Stock Modal */}
      {showAddStock && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowAddStock(false);
            setSelectedProduct(null);
          }
        }}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
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
                <button type="submit" className="btn-primary flex-1">Add Stock</button>
                <button type="button" onClick={() => {
                  setShowAddStock(false);
                  setSelectedProduct(null);
                  setNewStock({ quantity: '', expiryDate: '', batchNumber: '', cost: '' });
                }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl ring-1 ring-black/5">
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
              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="Low stock alert at (e.g. 10)"
                  className="input"
                  value={newProduct.reorder_level}
                  onChange={(e) => setNewProduct({ ...newProduct, reorder_level: e.target.value })}
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
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                <button type="submit" className="btn-primary flex-1">Add Product</button>
                <button type="button" onClick={() => {
                  setShowAddModal(false);
                  setImagePreview('');
                  setNewProduct({ name: '', price: '', cost: '', category: 'finished', unit: 'pcs', expenseOnly: false, image: '', visibleToCashier: true, reorder_level: '' });
                }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl ring-1 ring-black/5">
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
              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-4">
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
                <button type="submit" className="btn-primary flex-1">Update Product</button>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Weight-Based Pricing Modal */}
      {showWeightPricingModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Weight-Based Pricing - {selectedProduct.name}</h3>
            <p className="text-sm text-gray-600 mb-4">Set different prices for different weights (in 0.1kg increments)</p>
            
            <div className="space-y-4">
              {/* Add new weight price */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-sm text-gray-700">Add New Weight Price</h4>
                <form onSubmit={handleAddWeightPrice} className="flex gap-3">
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
