import { useState, useEffect } from 'react';
import { DollarSign, Plus, Edit2, Trash2 } from 'lucide-react';
import { BASE_API_URL } from '../../services/api';

export default function ServiceFeesManager() {
  const [fees, setFees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    description: '',
    active: true
  });

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = BASE_API_URL;
      const res = await fetch(`${API_URL}/service-fees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setFees(data);
    } catch (error) {
      console.error('Failed to fetch service fees:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const API_URL = BASE_API_URL;
      if (editingFee) {
        await fetch(`${API_URL}/service-fees/${editingFee.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ...formData,
            amount: parseFloat(formData.amount)
          })
        });
      } else {
        await fetch(`${API_URL}/service-fees`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ...formData,
            amount: parseFloat(formData.amount)
          })
        });
      }
      
      fetchFees();
      setShowForm(false);
      setEditingFee(null);
      setFormData({ name: '', amount: '', description: '', active: true });
    } catch (error) {
      console.error('Failed to save service fee:', error);
    }
  };

  const deleteFee = async (id) => {
    if (!confirm('Delete this service fee?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const API_URL = BASE_API_URL;
      await fetch(`${API_URL}/service-fees/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchFees();
    } catch (error) {
      console.error('Failed to delete service fee:', error);
    }
  };

  const editFee = (fee) => {
    setEditingFee(fee);
    setFormData({
      name: fee.name,
      amount: fee.amount.toString(),
      description: fee.description,
      active: fee.active
    });
    setShowForm(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <DollarSign className="text-green-600" />
          Service Fees Manager
        </h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingFee(null);
            setFormData({ name: '', amount: '', description: '', active: true });
          }}
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition flex items-center gap-2"
        >
          <Plus size={20} />
          Add Service Fee
        </button>
      </div>

      <div className="grid gap-4">
        {fees.map(fee => (
          <div key={fee.id} className={`p-6 rounded-xl shadow-lg ${fee.active ? 'bg-white' : 'bg-gray-100'}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold mb-2">{fee.name}</h3>
                <p className="text-gray-700 mb-2">{fee.description}</p>
                <p className="text-2xl font-bold text-green-600">KSH {fee.amount}</p>
              </div>
              <div className="flex gap-2">
                <span className={`px-4 py-2 rounded-lg font-bold ${fee.active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                  {fee.active ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => editFee(fee)}
                  className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition"
                >
                  <Edit2 size={20} />
                </button>
                <button
                  onClick={() => deleteFee(fee.id)}
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
            <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 text-white rounded-t-2xl">
              <h2 className="text-2xl font-bold">{editingFee ? 'Edit' : 'Add'} Service Fee</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Fee Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Delivery Fee"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Amount (KSH)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-green-500"
                  placeholder="100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-green-500"
                  placeholder="Brief description of the service fee"
                  rows="3"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-5 h-5 text-green-600 rounded"
                />
                <label htmlFor="active" className="text-sm font-medium">Active</label>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition"
                >
                  {editingFee ? 'Update' : 'Create'} Fee
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