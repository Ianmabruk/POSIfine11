import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recipes, products } from '../../services/api';
import { Plus, Pencil, Trash2, ArrowLeft, Search, Package, AlertTriangle } from 'lucide-react';

export default function MobileRecipes() {
  const navigate = useNavigate();
  const [recipesList, setRecipesList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    ingredients: [],
    price: '',
    image: '',
    visibleToCashier: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recipesData, productsData] = await Promise.all([
        recipes.getAll(),
        products.getAll()
      ]);
      setRecipesList(Array.isArray(recipesData) ? recipesData : []);
      setProductsList(Array.isArray(productsData) ? productsData : []);
    } catch (err) {
      console.error('Failed to load recipes:', err);
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { name: '', quantity: '', unit: 'pcs', productId: '' }]
    });
  };

  const updateIngredient = (index, field, value) => {
    const updated = [...formData.ingredients];
    updated[index][field] = value;
    setFormData({ ...formData, ingredients: updated });
  };

  const removeIngredient = (index) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        ingredients: formData.ingredients.map(ing => ({
          name: ing.name,
          quantity: parseFloat(ing.quantity) || 0,
          unit: ing.unit,
          productId: ing.productId ? parseInt(ing.productId) : undefined
        })),
        price: parseFloat(formData.price) || 0,
        image: formData.image,
        visibleToCashier: formData.visibleToCashier
      };

      if (editingRecipe) {
        await recipes.update(editingRecipe.id, payload);
      } else {
        await recipes.create(payload);
      }
      await loadData();
      setShowModal(false);
      setEditingRecipe(null);
      setFormData({ name: '', ingredients: [], price: '', image: '', visibleToCashier: true });
    } catch (err) {
      console.error('Failed to save recipe:', err);
      alert('Failed to save recipe');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this recipe?')) return;
    try {
      await recipes.delete(id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete recipe:', err);
    }
  };

  const openEdit = (recipe) => {
    setEditingRecipe(recipe);
    setFormData({
      name: recipe.name || '',
      ingredients: recipe.ingredients?.map(i => ({ ...i })) || [],
      price: recipe.price || '',
      image: recipe.image || '',
      visibleToCashier: recipe.visibleToCashier ?? true
    });
    setShowModal(true);
  };

  const filtered = recipesList.filter(r =>
    r.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/mobile')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Recipes</h1>
          <p className="text-xs text-gray-500">{recipesList.length} recipes</p>
        </div>
        <button
          onClick={() => { setEditingRecipe(null); setFormData({ name: '', ingredients: [], price: '', image: '', visibleToCashier: true }); setShowModal(true); }}
          className="p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search recipes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading recipes...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No recipes found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(recipe => (
            <div key={recipe.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {recipe.image && (
                    <img src={recipe.image} alt={recipe.name} className="w-10 h-10 rounded-lg object-cover" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{recipe.name}</p>
                    <p className="text-xs text-gray-500">{recipe.ingredients?.length || 0} ingredients</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(recipe)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(recipe.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {recipe.ingredients && recipe.ingredients.length > 0 && (
                <div className="mt-2 space-y-1">
                  {recipe.ingredients.slice(0, 3).map((ing, i) => (
                    <div key={i} className="flex items-center justify-between text-xs text-gray-600">
                      <span>{ing.name}</span>
                      <span>{ing.quantity} {ing.unit}</span>
                    </div>
                  ))}
                  {recipe.ingredients.length > 3 && (
                    <p className="text-xs text-gray-400">+{recipe.ingredients.length - 3} more</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{editingRecipe ? 'Edit Recipe' : 'New Recipe'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (KSH)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Ingredients</label>
                  <button type="button" onClick={addIngredient} className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {formData.ingredients.map((ing, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <select
                      value={ing.productId}
                      onChange={(e) => updateIngredient(i, 'productId', e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    >
                      <option value="">Select ingredient</option>
                      {productsList.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Qty"
                      value={ing.quantity}
                      onChange={(e) => updateIngredient(i, 'quantity', e.target.value)}
                      className="w-20 px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    />
                    <select
                      value={ing.unit}
                      onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
                      className="w-20 px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    >
                      <option value="pcs">pcs</option>
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="l">l</option>
                      <option value="ml">ml</option>
                    </select>
                    <button type="button" onClick={() => removeIngredient(i)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-medium">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
