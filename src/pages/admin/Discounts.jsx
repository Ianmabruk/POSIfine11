import { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, Calendar } from 'lucide-react';
import { discounts as discountsApi } from '../../services/api';

export default function Discounts() {
  const [discounts, setDiscounts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    percentage: '',
    validFrom: '',
    validTo: '',
    active: true
  });

  useEffect(() => {
    loadDiscounts();
  }, []);

  const loadDiscounts = async () => {
    try {
      const data = await discountsApi.getAll();
      setDiscounts(data);
    } catch (error) {
      console.error('Failed to load discounts:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDiscount) {
        await discountsApi.update(editingDiscount.id, formData);
      } else {
        await discountsApi.create(formData);
      }
      setShowModal(false);
      setEditingDiscount(null);
      setFormData({ name: '', percentage: '', validFrom: '', validTo: '', active: true });
      loadDiscounts();
    } catch (error) {
      console.error('Failed to save discount:', error);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this discount?')) {
      try {
        await discountsApi.delete(id);
        loadDiscounts();
      } catch (error) {
        console.error('Failed to delete discount:', error);
      }
    }
  };

  const isActive = (discount) => {
    const now = new Date();
    const from = new Date(discount.validFrom);
    const to = new Date(discount.validTo);
    return discount.active && from <= now && to >= now;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Discount Manager</h2>
          <p className="text-sm text-gray-600 mt-1">Create and manage discount rules</p>
        </div>
        <button
          onClick={() => {
            setShowModal(true);
            setEditingDiscount(null);
            setFormData({ name: '', percentage: '', validFrom: '', validTo: '', active: true });
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Discount
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {discounts.map(discount => (
          <div
            key={discount.id}
            className={`card ${
              isActive(discount)
                ? 'border-green-200 bg-green-50'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isActive(discount) ? 'bg-green-600' : 'bg-gray-400'
                }`}>
                  <Tag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">{discount.name}</h3>
                  <p className="text-2xl font-bold text-red-600">{discount.percentage}% OFF</p>
                </div>
              </div>
              <span className={`badge ${isActive(discount) ? 'badge-success' : 'bg-gray-200 text-gray-600'}`}>
                {isActive(discount) ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>From: {new Date(discount.validFrom).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>To: {new Date(discount.validTo).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingDiscount(discount);
                  setFormData(discount);
                  setShowModal(true);
                }}
                className="p-2 hover:bg-blue-50 rounded-lg flex-1"
              >
                <Edit2 className="w-4 h-4 text-blue-600 mx-auto" />
              </button>
              <button onClick={() => handleDelete(discount.id)} className="p-2 hover:bg-red-50 rounded-lg flex-1">
                <Trash2 className="w-4 h-4 text-red-600 mx-auto" />
              </button>
            </div>
          </div>
        ))}
        {discounts.length === 0 && (
          <div className="card text-center py-12 col-span-full">
            <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No discounts yet. Create your first discount!</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{editingDiscount ? 'Edit' : 'Add'} Discount</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Discount Name</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Holiday Sale"
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
                  className="input"
                  value={formData.percentage}
                  onChange={(e) => setFormData({ ...formData, percentage: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Valid From</label>
                <input
                  type="date"
                  className="input"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Valid To</label>
                <input
                  type="date"
                  className="input"
                  value={formData.validTo}
                  onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                  required
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
                <span className="text-sm">Active</span>
              </label>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">Save</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}