import { useState, useEffect } from 'react';
import { products as productsApi } from '../../services/api';
import { Plus, Trash2, Save } from 'lucide-react';

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

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await productsApi.getAll();
    setProducts(data);
    setRawProducts(data.filter(p => !p.recipe));
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

  const calculateTotalCost = () => {
    return newRecipe.ingredients.reduce((total, ing) => {
      // Find matching raw product by name (case-insensitive)
      const raw = rawProducts.find(p =>
        p.name.toLowerCase() === ing.name.toLowerCase()
      );
      if (raw && ing.quantity) {
        const unitCost = raw.cost / raw.quantity;
        return total + (unitCost * parseFloat(ing.quantity));
      }
      // For custom ingredients not in inventory, use a default cost of 0
      // This allows recipes to be created even with custom ingredients
      return total;
    }, 0);
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
      await productsApi.create({
        name: newRecipe.name,
        price: parseFloat(newRecipe.price),
        cost: totalCost,
        quantity: 0,
        unit: 'pcs',
        category: 'composite',
        recipe: mappedIngredients, // Now stores custom ingredient objects
        image: newRecipe.image || '',
        visibleToCashier: newRecipe.visibleToCashier,
        expenseOnly: false
      });

      setNewRecipe({ name: '', price: '', ingredients: [], image: '', visibleToCashier: true });
      setShowCreateModal(false);
      loadProducts();
      alert('Recipe created successfully!');
    } catch (error) {
      console.error('Error creating recipe:', error);
      alert('Failed to create recipe. Please try again.');
    }
  };

  const compositeProducts = products.filter(p => p.recipe);

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
              const totalCost = product.recipe.reduce((sum, ing) => {
                // Handle both old format (productId) and new format (name)
                if (ing.productId) {
                  const raw = products.find(p => p.id === ing.productId);
                  if (raw) {
                    const unitCost = raw.cost / raw.quantity;
                    return sum + (unitCost * ing.quantity);
                  }
                } else if (ing.name) {
                  // For custom ingredients, try to find matching raw product
                  const raw = products.find(p => p.name.toLowerCase() === ing.name.toLowerCase());
                  if (raw) {
                    const unitCost = raw.cost / raw.quantity;
                    return sum + (unitCost * ing.quantity);
                  }
                }
                return sum;
              }, 0);
              const margin = ((product.price - totalCost) / product.price * 100).toFixed(1);

              return (
                <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{product.name}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span className="text-green-600 font-semibold">Price: KSH {product.price}</span>
                        <span className="text-orange-600">COGS: KSH {totalCost.toFixed(2)}</span>
                        <span className={`font-semibold ${margin > 30 ? 'text-green-600' : 'text-yellow-600'}`}>
                          Margin: {margin}%
                        </span>
                      </div>
                    </div>
                    <button className="text-red-600 hover:bg-red-50 p-2 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-600 mb-2">INGREDIENTS:</p>
                    <div className="grid grid-cols-2 gap-2">
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
                  onChange={(e) => setNewRecipe({ ...newRecipe, image: e.target.value })}
                />
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
                <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  Create Recipe
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewRecipe({ name: '', price: '', ingredients: [] });
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
    </div>
  );
}
