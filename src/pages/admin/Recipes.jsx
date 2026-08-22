import { useState, useEffect, useCallback } from 'react';
import { products as productsApi } from '../../services/api';
import { Plus, Trash2, Save, Pencil, Camera, Image as ImageIcon } from 'lucide-react';

const hasRecipe = (product) => Array.isArray(product?.recipe) && product.recipe.length > 0;

// Correct COGS calculation: always use cost_per_unit (fixed unit cost)
const calcRecipeCost = (recipe, allProducts) => {
  return (recipe || []).reduce((sum, ing) => {
    let raw = null;
    if (ing.productId) {
      raw = allProducts.find(p => p.id === ing.productId);
    } else if (ing.name) {
      raw = allProducts.find(p => p.name.toLowerCase() === ing.name.toLowerCase());
    }
    if (raw) {
      const unitCost = Number(raw.cost_per_unit || raw.costPerUnit || raw.cost || 0);
      return sum + (unitCost * (ing.quantity || 0));
    }
    return sum;
  }, 0);
};

export default function Recipes() {
  const [products, setProducts] = useState([]);
  const [rawProducts, setRawProducts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRecipe, setNewRecipe] = useState({
    name: '',
    price: '',
    ingredients: [],
    image: '',
    visibleToCashier: true
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editRecipe, setEditRecipe] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await productsApi.getAll();
    setProducts(data);
    setRawProducts(data.filter(p => !hasRecipe(p)));
  };

  const addIngredient = () => {
    setNewRecipe({
      ...newRecipe,
      ingredients: [...newRecipe.ingredients, { name: '', quantity: '', unit: 'pcs' }]
    });
  };

  const updateIngredient = (index, field, value) => {
    const updated = [...newRecipe.ingredients];
    updated[index][field] = value;
    setNewRecipe({ ...newRecipe, ingredients: updated });
  };

  const removeIngredient = (index) => {
    setNewRecipe({
      ...newRecipe,
      ingredients: newRecipe.ingredients.filter((_, i) => i !== index)
    });
  };

  const calculateTotalCost = () => calcRecipeCost(newRecipe.ingredients, rawProducts);

  const handleImageUpload = (e, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('Image is too large. Please select an image smaller than or equal to 10 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (isEdit) {
        setEditRecipe(prev => ({ ...prev, image: reader.result }));
        setEditImagePreview(reader.result);
      } else {
        setNewRecipe(prev => ({ ...prev, image: reader.result }));
        setImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setEditRecipe({
      name: product.name,
      price: String(product.price || ''),
      image: product.image || '',
      visibleToCashier: product.visibleToCashier !== false,
      ingredients: (product.recipe || []).map(ing => {
        let name = ing.name || '';
        if (!name && ing.productId) {
          const raw = products.find(p => p.id === ing.productId);
          if (raw) name = raw.name;
        }
        return {
          name,
          productId: ing.productId || null,
          quantity: String(ing.quantity || ''),
          unit: ing.unit || 'pcs'
        };
      })
    });
    setEditImagePreview(product.image || null);
  };

  const addEditIngredient = () => {
    setEditRecipe(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', quantity: '', unit: 'pcs' }]
    }));
  };

  const updateEditIngredient = (index, field, value) => {
    setEditRecipe(prev => {
      const updated = [...prev.ingredients];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, ingredients: updated };
    });
  };

  const removeEditIngredient = (index) => {
    setEditRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateRecipe = async (e) => {
    e.preventDefault();
    if (saving || !editingProduct || !editRecipe) return;

    const mappedIngredients = [];
    for (const ing of editRecipe.ingredients) {
      if (!ing.name || !ing.quantity) continue;
      const raw = rawProducts.find(p => p.name.toLowerCase() === ing.name.toLowerCase());
      if (raw) {
        mappedIngredients.push({ productId: raw.id, quantity: parseFloat(ing.quantity), unit: ing.unit || 'pcs' });
      } else {
        mappedIngredients.push({ name: ing.name, quantity: parseFloat(ing.quantity), unit: ing.unit || 'pcs' });
      }
    }
    if (mappedIngredients.length === 0) { alert('Add at least one ingredient'); return; }

    const totalCost = calcRecipeCost(mappedIngredients, products);

    try {
      setSaving(true);
      await productsApi.update(editingProduct.id, {
        name: editRecipe.name,
        price: parseFloat(editRecipe.price),
        cost: totalCost,
        cost_per_unit: totalCost,
        recipe: mappedIngredients,
        image: editRecipe.image || '',
        visibleToCashier: editRecipe.visibleToCashier,
        is_composite: true,
        isComposite: true
      });
      setEditingProduct(null);
      setEditRecipe(null);
      setEditImagePreview(null);
      loadProducts();
    } catch (error) {
      console.error('Error updating recipe:', error);
      alert('Failed to update recipe.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecipe = async (product) => {
    if (!window.confirm(`Delete recipe "${product.name}"? This cannot be undone.`)) return;
    try {
      await productsApi.delete(product.id);
      loadProducts();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('Failed to delete recipe.');
    }
  };

  const handleCreateRecipe = async (e) => {
    e.preventDefault();

    // Validate ingredients (allow custom names)
    const mappedIngredients = [];
    for (const ing of newRecipe.ingredients) {
      if (!ing.name || !ing.quantity) continue;

      // Find matching raw product by name (case-insensitive)
      const raw = rawProducts.find(p =>
        p.name.toLowerCase() === ing.name.toLowerCase()
      );

      if (raw) {
        // Use productId for known products
        mappedIngredients.push({
          productId: raw.id,
          quantity: parseFloat(ing.quantity),
          unit: ing.unit || 'pcs'
        });
      } else {
        // For custom ingredients, store as text-based entries
        mappedIngredients.push({
          name: ing.name,
          quantity: parseFloat(ing.quantity),
          unit: ing.unit || 'pcs'
        });
      }
    }

    if (mappedIngredients.length === 0) {
      alert('Please add at least one ingredient');
      return;
    }

    const totalCost = calculateTotalCost();

    try {
      setSaving(true);
      await productsApi.create({
        name: newRecipe.name,
        price: parseFloat(newRecipe.price),
        cost: totalCost,
        cost_per_unit: totalCost,
        quantity: 0,
        unit: 'pcs',
        category: 'composite',
        is_composite: true,
        isComposite: true,
        recipe: mappedIngredients,
        image: newRecipe.image || '',
        visibleToCashier: newRecipe.visibleToCashier,
        expenseOnly: false
      });

      setNewRecipe({ name: '', price: '', ingredients: [], image: '', visibleToCashier: true });
      setImagePreview(null);
      setShowCreateModal(false);
      loadProducts();
      alert('Recipe created successfully!');
    } catch (error) {
      console.error('Error creating recipe:', error);
      alert('Failed to create recipe. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const compositeProducts = products.filter(hasRecipe);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Recipe & BOM Builder</h2>
          <p className="text-sm text-gray-600 mt-1">Create composite products with ingredient recipes</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Recipe
        </button>
      </div>

      {/* Example Card */}
      <div className="card bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">💡 How it works</h3>
        <p className="text-sm text-blue-800">
          Create composite products by defining recipes with raw ingredients. When a composite product is sold, 
          the system automatically deducts the required quantities from raw materials and calculates COGS.
        </p>
        <div className="mt-3 p-3 bg-white rounded-lg text-sm">
          <strong>Example: Fish Fingers</strong>
          <ul className="mt-2 space-y-1 text-gray-700">
            <li>• 0.02 kg Nile Perch</li>
            <li>• 0.01 L Cooking Oil</li>
            <li>• 0.004 kg Breadcrumbs</li>
            <li>• 0.002 kg Salt</li>
          </ul>
        </div>
      </div>

      {/* Existing Recipes */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Existing Recipes ({compositeProducts.length})</h3>
        
        {compositeProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No recipes created yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {compositeProducts.map(product => {
              const totalCost = calcRecipeCost(product.recipe, products);
              const margin = product.price > 0 ? ((product.price - totalCost) / product.price * 100).toFixed(1) : '0.0';

              return (
                <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-lg border flex-shrink-0" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg border flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-lg">{product.name}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm flex-wrap">
                          <span className="text-green-600 font-semibold">Price: KSH {product.price}</span>
                          <span className="text-orange-600">COGS: KSH {totalCost.toFixed(2)}</span>
                          <span className={`font-semibold ${margin > 30 ? 'text-green-600' : 'text-yellow-600'}`}>
                            Margin: {margin}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditModal(product)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg" title="Edit Recipe">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteRecipe(product)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg" title="Delete Recipe">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                   <div className="bg-gray-50 rounded-lg p-3">
                     <p className="text-xs font-semibold text-gray-600 mb-2">INGREDIENTS:</p>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {product.recipe.map((ing, idx) => {
                        // Handle both old format (productId) and new format (name)
                        let ingredientName = '';
                        let ingredientUnit = ing.unit || 'pcs';

                        if (ing.productId) {
                          const raw = products.find(p => p.id === ing.productId);
                          if (raw) {
                            ingredientName = raw.name;
                            ingredientUnit = raw.unit;
                          }
                        } else if (ing.name) {
                          ingredientName = ing.name;
                          ingredientUnit = ing.unit || 'pcs';
                        }

                        return ingredientName ? (
                          <div key={idx} className="text-sm flex items-center justify-between bg-white px-3 py-2 rounded">
                            <span>{ingredientName}</span>
                            <span className="font-semibold text-blue-600">{ing.quantity} {ingredientUnit}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Recipe Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Create New Recipe</h3>
            
            <form onSubmit={handleCreateRecipe} className="space-y-4">
              <input
                type="text"
                placeholder="Product Name (e.g., Fish Fingers)"
                className="input"
                value={newRecipe.name}
                onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })}
                required
              />
              
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Selling Price"
                  className="input"
                  value={newRecipe.price}
                  onChange={(e) => setNewRecipe({ ...newRecipe, price: e.target.value })}
                  required
                />
                <input
                  type="url"
                  placeholder="Image URL (optional)"
                  className="input"
                  value={newRecipe.image}
                  onChange={(e) => { setNewRecipe({ ...newRecipe, image: e.target.value }); setImagePreview(null); }}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Or upload image</label>
                <div className="flex items-center gap-4">
                  <input type="file" accept="image/*" className="input flex-1" onChange={(e) => handleImageUpload(e, false)} />
                  <Camera className="w-5 h-5 text-gray-400" />
                </div>
                {(imagePreview || newRecipe.image) && (
                  <img src={imagePreview || newRecipe.image} alt="Preview" className="w-20 h-20 object-cover rounded-lg border mt-2" />
                )}
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newRecipe.visibleToCashier}
                  onChange={(e) => setNewRecipe({ ...newRecipe, visibleToCashier: e.target.checked })}
                />
                <span className="text-sm">Visible to Cashier</span>
              </label>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Ingredients</h4>
                  <button 
                    type="button"
                    onClick={addIngredient}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Add Ingredient
                  </button>
                </div>

                <div className="space-y-3">
                  {newRecipe.ingredients.map((ing, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Ingredient name (e.g., Nile Perch)"
                        className="input flex-1"
                        value={ing.name}
                        onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                        required
                        list={`ingredients-list-${index}`}
                      />
                      <datalist id={`ingredients-list-${index}`}>
                        {rawProducts.map(p => (
                          <option key={p.id} value={p.name}>
                            {p.name} ({p.quantity} {p.unit} available)
                          </option>
                        ))}
                      </datalist>
                      <input
                        type="number"
                        step="0.001"
                        placeholder="Qty"
                        className="input w-32"
                        value={ing.quantity}
                        onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                        required
                      />
                      <select
                        className="input w-24"
                        value={ing.unit}
                        onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                      >
                        <option value="pcs">pcs</option>
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="L">L</option>
                        <option value="ml">ml</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {newRecipe.ingredients.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No ingredients added yet. Click "Add Ingredient" to start.
                  </p>
                )}
              </div>

              {newRecipe.ingredients.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Estimated COGS:</span>
                    <span className="text-lg font-bold text-orange-600">
                      KSH {calculateTotalCost().toFixed(2)}
                    </span>
                  </div>
                  {newRecipe.price && (
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="font-medium">Profit Margin:</span>
                      <span className="text-lg font-bold text-green-600">
                        {((parseFloat(newRecipe.price) - calculateTotalCost()) / parseFloat(newRecipe.price) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? 'Creating...' : 'Create Recipe'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewRecipe({ name: '', price: '', ingredients: [], image: '', visibleToCashier: true });
                    setImagePreview(null);
                  }} 
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Recipe Modal */}
      {editingProduct && editRecipe && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Edit Recipe: {editingProduct.name}</h3>

            <form onSubmit={handleUpdateRecipe} className="space-y-4">
              <input
                type="text"
                placeholder="Product Name"
                className="input"
                value={editRecipe.name}
                onChange={(e) => setEditRecipe({ ...editRecipe, name: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Selling Price"
                  className="input"
                  value={editRecipe.price}
                  onChange={(e) => setEditRecipe({ ...editRecipe, price: e.target.value })}
                  required
                />
                <input
                  type="url"
                  placeholder="Image URL (optional)"
                  className="input"
                  value={editRecipe.image}
                  onChange={(e) => { setEditRecipe({ ...editRecipe, image: e.target.value }); setEditImagePreview(null); }}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Or upload image</label>
                <div className="flex items-center gap-4">
                  <input type="file" accept="image/*" className="input flex-1" onChange={(e) => handleImageUpload(e, true)} />
                  <Camera className="w-5 h-5 text-gray-400" />
                </div>
                {(editImagePreview || editRecipe.image) && (
                  <img src={editImagePreview || editRecipe.image} alt="Preview" className="w-20 h-20 object-cover rounded-lg border mt-2" />
                )}
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editRecipe.visibleToCashier}
                  onChange={(e) => setEditRecipe({ ...editRecipe, visibleToCashier: e.target.checked })}
                />
                <span className="text-sm">Visible to Cashier</span>
              </label>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Ingredients</h4>
                  <button type="button" onClick={addEditIngredient} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    + Add Ingredient
                  </button>
                </div>

                <div className="space-y-3">
                  {editRecipe.ingredients.map((ing, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Ingredient name"
                        className="input flex-1"
                        value={ing.name}
                        onChange={(e) => updateEditIngredient(index, 'name', e.target.value)}
                        required
                        list={`edit-ingredients-list-${index}`}
                      />
                      <datalist id={`edit-ingredients-list-${index}`}>
                        {rawProducts.map(p => (
                          <option key={p.id} value={p.name}>
                            {p.name} ({p.quantity} {p.unit} available)
                          </option>
                        ))}
                      </datalist>
                      <input
                        type="number"
                        step="0.001"
                        placeholder="Qty"
                        className="input w-32"
                        value={ing.quantity}
                        onChange={(e) => updateEditIngredient(index, 'quantity', e.target.value)}
                        required
                      />
                      <select
                        className="input w-24"
                        value={ing.unit}
                        onChange={(e) => updateEditIngredient(index, 'unit', e.target.value)}
                      >
                        <option value="pcs">pcs</option>
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="L">L</option>
                        <option value="ml">ml</option>
                      </select>
                      <button type="button" onClick={() => removeEditIngredient(index)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {editRecipe.ingredients.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No ingredients. Click "+ Add Ingredient" to start.</p>
                )}
              </div>

              {editRecipe.ingredients.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Estimated COGS:</span>
                    <span className="text-lg font-bold text-orange-600">
                      KSH {calcRecipeCost(editRecipe.ingredients, products).toFixed(2)}
                    </span>
                  </div>
                  {editRecipe.price && (
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="font-medium">Profit Margin:</span>
                      <span className="text-lg font-bold text-green-600">
                        {((parseFloat(editRecipe.price) - calcRecipeCost(editRecipe.ingredients, products)) / parseFloat(editRecipe.price) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Update Recipe'}
                </button>
                <button type="button" onClick={() => { setEditingProduct(null); setEditRecipe(null); setEditImagePreview(null); }} className="btn-secondary">
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
