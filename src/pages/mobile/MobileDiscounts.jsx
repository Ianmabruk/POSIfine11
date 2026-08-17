import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { discounts } from '../../services/api';
import { Plus, Edit2, Trash2, ArrowLeft, Tag, Calendar } from 'lucide-react';

export default function MobileDiscounts() {
  const navigate = useNavigate();
  const [discountsList, setDiscountsList] = useState([]);
  const [loading, setLoading] = useState(true);
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
      const data = await discounts.getAll();
      setDiscountsList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load discounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDiscount) {
        await discounts.update(editingDiscount.id, formData);
      } else {
        await discounts.create(formData);
      }
      await loadDiscounts();
      setShowModal(false);
      setEditingDiscount(null);
      setFormData({ name: '', percentage: '', validFrom: '', validTo: '', active: true });
    } catch (error) {
      console.error('Failed to save discount:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this discount?')) return;
    try {
      await discounts.delete(id);
      await loadDiscounts();
    } catch (error) {
      console.error('Failed to delete discount:', error);
    }
  };

  const isActive = (discount) => {
    const now = new Date();
    const from = new Date(discount.validFrom);
    const to = new Date(discount.validTo);
    return discount.active && from <= now && to >= now;
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
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Discounts</h1>
          <p className="text-xs text-gray-500">{discountsList.length} discounts</p>
        </div>
        <button
          onClick={() => { setEditingDiscount(null); setFormData({ name: '', percentage: '', validFrom: '', validTo: '', active: true }); setShowModal(true); }}
          className="p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading discounts...</div>
      ) : discountsList.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No discounts configured</div>
      ) : (
        <div className="space-y-3">
          {discountsList.map(discount => (
            <div key={discount.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary-600" />
                  <p className="font-medium text-gray-900">{discount.name}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isActive(discount) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {isActive(discount) ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-lg font-bold text-primary-600 mb-1">{discount.percentage}% OFF</p>
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {discount.validFrom ? new Date(discount.validFrom).toLocaleDateString() : 'N/A'} - {discount.validTo ? new Date(discount.validTo).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingDiscount(discount); setFormData({ name: discount.name, percentage: String(discount.percentage), validFrom: discount.validFrom?.split('T')[0], validTo: discount.validTo?.split('T')[0], active: discount.active }); setShowModal(true); }} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg">Edit</button>
                <button onClick={() => handleDelete(discount.id)} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{editingDiscount ? 'Edit Discount' : 'New Discount'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Percentage (%)</label>
                <input type="number" min="0" max="100" step="0.1" value={formData.percentage} onChange={(e) => setFormData({ ...formData, percentage: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
                  <input type="date" value={formData.validFrom} onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid To</label>
                  <input type="date" value={formData.validTo} onChange={(e) => setFormData({ ...formData, validTo: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-medium">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
