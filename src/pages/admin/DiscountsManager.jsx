import { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, Calendar } from 'lucide-react';
import { BASE_API_URL } from '../../services/api';

export default function DiscountsManager() {
  const [discounts, setDiscounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    percentage: '',
    validFrom: '',
    validTo: '',
    active: true
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = BASE_API_URL;
      const res = await fetch(`${API_URL}/discounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDiscounts(data);
    } catch (error) {
      console.error('Failed to fetch discounts:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const API_URL = BASE_API_URL;
      
      if (editingDiscount) {
        await fetch(`${API_URL}/discounts/${editingDiscount.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ...formData,
            percentage: parseFloat(formData.percentage)
          })
        });
      } else {
        await fetch(`${API_URL}/discounts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ...formData,
            percentage: parseFloat(formData.percentage)
          })
        });
      }
      
      fetchDiscounts();
      setShowForm(false);
      setEditingDiscount(null);
      setFormData({ name: '', percentage: '', validFrom: '', validTo: '', active: true });
    } catch (error) {
      console.error('Failed to save discount:', error);
    }
  };

  const deleteDiscount = async (id) => {
    if (!confirm('Delete this discount?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const API_URL = BASE_API_URL;
      await fetch(`${API_URL}/discounts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDiscounts();
    } catch (error) {
      console.error('Failed to delete discount:', error);
    }
  };

  const editDiscount = (discount) => {
    setEditingDiscount(discount);
    setFormData({
      name: discount.name,
      percentage: discount.percentage.toString(),
      validFrom: discount.validFrom.split('T')[0],
      validTo: discount.validTo.split('T')[0],
      active: discount.active
    });
    setShowForm(true);
  };

  const isDiscountActive = (discount) => {
    if (!discount.active) return false;
    const now = new Date();
    const validFrom = new Date(discount.validFrom);
    const validTo = new Date(discount.validTo);
    return validFrom <= now && validTo >= now;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Tag className="text-red-600" />
          Discounts Manager
        </h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingDiscount(null);
            setFormData({ name: '', percentage: '', validFrom: '', validTo: '', active: true });
          }}
          className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition flex items-center gap-2"
        >
          <Plus size={20} />
          Add Discount
        </button>
      </div>

      <div className="grid gap-4">
        {discounts.map(discount => (
          <div key={discount.id} className={`p-6 rounded-xl shadow-lg ${isDiscountActive(discount) ? 'bg-green-50 border-l-4 border-green-500' : 'bg-gray-100'}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold mb-2">{discount.name}</h3>
                <div className="flex items-center gap-4 mb-2">
                  <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold">
                    {discount.percentage}% OFF
                  </span>
                  <span className={`px-4 py-2 rounded-lg font-bold ${isDiscountActive(discount) ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                    {isDiscountActive(discount) ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>From: {new Date(discount.validFrom).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>To: {new Date(discount.validTo).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => editDiscount(discount)}
                  className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition"
                >
                  <Edit2 size={20} />
                </button>
                <button
                  onClick={() => deleteDiscount(discount.id)}
                  className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-red-600 to-pink-600 p-6 text-white rounded-t-2xl">
              <h2 className="text-2xl font-bold">{editingDiscount ? 'Edit' : 'Add'} Discount</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Discount Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-red-500"
                  placeholder="e.g., Holiday Special"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Percentage (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.percentage}
                  onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-red-500"
                  placeholder="10"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Valid From</label>
                  <input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Valid To</label>
                  <input
                    type="date"
                    value={formData.validTo}
                    onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-5 h-5 text-red-600 rounded"
                />
                <label htmlFor="active" className="text-sm font-medium">Active</label>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition"
                >
                  {editingDiscount ? 'Update' : 'Create'} Discount
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition"
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