import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, DollarSign } from 'lucide-react';

export default function ServiceFees() {
  const [fees, setFees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [formData, setFormData] = useState({ name: '', amount: '', description: '', active: true });

  useEffect(() => {
    loadFees();
  }, []);

  const loadFees = () => {
    const stored = JSON.parse(localStorage.getItem('serviceFees') || '[]');
    setFees(stored);
  };

  const saveFees = (updatedFees) => {
    localStorage.setItem('serviceFees', JSON.stringify(updatedFees));
    setFees(updatedFees);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingFee) {
      const updated = fees.map(f => f.id === editingFee.id ? { ...formData, id: f.id } : f);
      saveFees(updated);
    } else {
      const newFee = { ...formData, id: Date.now(), createdAt: new Date().toISOString() };
      saveFees([...fees, newFee]);
    }
    setShowModal(false);
    setEditingFee(null);
    setFormData({ name: '', amount: '', description: '', active: true });
  };

  const handleDelete = (id) => {
    if (confirm('Delete this service fee?')) {
      saveFees(fees.filter(f => f.id !== id));
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Service Fees</h2>
          <p className="text-sm text-gray-600 mt-1">Manage delivery, packaging, and other fees</p>
        </div>
        <button onClick={() => { setShowModal(true); setEditingFee(null); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Fee
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fees.map(fee => (
          <div key={fee.id} className={`card ${fee.active ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">{fee.name}</h3>
                  <p className="text-xs text-gray-500">{fee.description}</p>
                </div>
              </div>
              <span className={`badge ${fee.active ? 'badge-success' : 'bg-gray-200 text-gray-600'}`}>
                {fee.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-blue-600">KSH {fee.amount}</p>
              <div className="flex gap-2">
                <button onClick={() => { setEditingFee(fee); setFormData(fee); setShowModal(true); }} className="p-2 hover:bg-blue-50 rounded-lg">
                  <Edit2 className="w-4 h-4 text-blue-600" />
                </button>
                <button onClick={() => handleDelete(fee.id)} className="p-2 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{editingFee ? 'Edit' : 'Add'} Service Fee</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Fee Name (e.g., Delivery)" className="input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <input type="number" step="0.01" placeholder="Amount" className="input" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
              <textarea placeholder="Description" className="input" rows="2" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} />
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
