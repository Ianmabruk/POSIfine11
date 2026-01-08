

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductsContext';
import { products, batches } from '../../services/api';
import { Plus, Search, Edit2, Trash2, ChevronDown, ChevronUp, AlertTriangle, Camera, Package } from 'lucide-react';



export default function Inventory() {
  const { user, isUltraPackage, isRealTimeProductSyncEnabled } = useAuth();
  const { products: globalProducts, refreshProducts } = useProducts();
  const [productList, setProductList] = useState([]);
  const [batchList, setBatchList] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddStock, setShowAddStock] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
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
    visibleToCashier: true
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
    visibleToCashier: true
  });


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await refreshProducts();
      const batchData = await batches.getAll();
      setBatchList(batchData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  // Sync with global context
  useEffect(() => {
    if (globalProducts) {
      setProductList(globalProducts);
    }
  }, [globalProducts]);

  const handleImageUpload = (e, isNewProduct = true) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        setImagePreview(base64);
        if (isNewProduct) {
          setNewProduct({ ...newProduct, image: base64 });
        } else {
          setEditProduct({ ...editProduct, image: base64 });
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
      const productData = {
        ...newProduct,
        price: parseFloat(newProduct.price),
        cost: parseFloat(newProduct.cost || 0),
        quantity: 0, // Stock managed through batches
        visibleToCashier: !newProduct.expenseOnly && newProduct.visibleToCashier !== false
      };
      
      const result = await products.create(productData);
      
      // Reset form and close modal
      setNewProduct({ name: '', price: '', cost: '', category: 'finished', unit: 'pcs', expenseOnly: false, image: '', visibleToCashier: true });
      setImagePreview('');
      setShowAddModal(false);
      
      // Refresh data
      await loadData();
      
      showNotification(`✅ Product "${result.name}" added successfully! ${result.visibleToCashier ? 'Cashiers can now see this product.' : 'This product is hidden from cashiers.'}`, 'success');
      
    } catch (error) {
      console.error('Failed to create product:', error);
      alert(`Failed to create product: ${error.message || 'Unknown error'}`);
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
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
      await loadData();
      
      showNotification(`✅ Stock added successfully for ${selectedProduct.name}!`, 'success');
    } catch (error) {
      console.error('Failed to add stock:', error);
      alert('Failed to add stock');
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
      
      const updateData = {
        ...editProduct,
        price: parseFloat(editProduct.price),
        cost: parseFloat(editProduct.cost),
        quantity: parseFloat(editProduct.quantity)
      };


      const result = await products.update(editProduct.id, updateData);
      
      setShowEditModal(false);
      await refreshProducts();
      
      // Trigger real-time sync notification if enabled
      if (isRealTimeProductSyncEnabled()) {
        setIsSyncing(true);
        window.dispatchEvent(new CustomEvent('productUpdated', { 
          detail: { 
            product: result,
            originalProduct,
            timestamp: new Date().toISOString(),
            type: 'update'
          }
        }));
        
        // Show sync notification
        showNotification(`📡 Product updated and synced to all dashboards!`, 'success');
        setLastSync(new Date());
        
        // Clear sync status after 3 seconds
        setTimeout(() => {
          setIsSyncing(false);
        }, 3000);
      } else {
        alert('Product updated successfully!');
      }
      
    } catch (error) {
      console.error('Failed to update product:', error);
      alert(`Failed to update product: ${error.message || 'Unknown error'}`);
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
      (filter === 'low-stock' && p.quantity < 10);
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
    if (!product.recipe) return product.cost || 0;
    let totalCost = 0;
    (product.recipe || []).forEach(ingredient => {
      if (!ingredient) return;

      const raw = (productList || []).find(p => p && p.id === ingredient.productId);
      if (raw && raw.quantity > 0) {
        const unitCost = (raw.cost || 0) / raw.quantity;
        totalCost += unitCost * (ingredient.quantity || 0);
      }
    });
    return totalCost;
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
                          {product.quantity < 10 && !product.recipe && (
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
                            getProductStock(product.id) === 0 ? 'text-red-600' : 
                            getProductStock(product.id) < 10 ? 'text-yellow-600' : 'text-gray-900'
                          }`}>
                            {getProductStock(product.id)} {product.unit}
                          </span>
                          {getProductStock(product.id) < 10 && getProductStock(product.id) > 0 && (
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          )}
                          {getProductStock(product.id) === 0 && (
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
                              setSelectedProduct(product);
                              setShowAddStock(true);
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
                            onClick={() => {
                              setEditProduct(product);
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add Stock for {selectedProduct.name}</h3>
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
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add New Product</h3>
            <form onSubmit={handleAddProduct} className="space-y-4">
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
                <select
                  className="input"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                >
                  <option value="finished">Finished Product</option>
                  <option value="raw">Raw Material</option>
                  <option value="service">Service</option>
                </select>
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
                  setNewProduct({ name: '', price: '', cost: '', category: 'finished', unit: 'pcs', expenseOnly: false, image: '', visibleToCashier: true });
                }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Edit Product</h3>
            <form onSubmit={handleEditProduct} className="space-y-4">
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
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setEditProduct({ ...editProduct, image: reader.result });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
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
                  value={editProduct.price || ''}
                  onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Cost"
                  className="input"
                  value={editProduct.cost || ''}
                  onChange={(e) => setEditProduct({ ...editProduct, cost: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Quantity"
                  className="input"
                  value={editProduct.quantity || ''}
                  onChange={(e) => setEditProduct({ ...editProduct, quantity: e.target.value })}
                  required
                />
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
    </div>
  );
}
