import { useState } from 'react';
import { CreditCard, X } from 'lucide-react';

export default function CreditRequestForm({ product, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    customerName: '',
    quantity: 1,
    amount: product.price
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5001/api';
      const res = await fetch(`${API_URL}/credit-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product.id,
          ...formData
        })
      });
      const data = await res.json();
      onSubmit(data);
      onClose();
    } catch (error) {
      console.error('Failed to submit credit request:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white flex justify-between items-center rounded-t-2xl">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard />
            Credit Request
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Product</label>
            <input
              type="text"
              value={product.name}
              disabled
              className="w-full px-4 py-3 rounded-lg bg-gray-100 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Customer Name</label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Quantity</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value), amount: parseFloat(e.target.value) * product.price })}
              className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-orange-500"
              min="1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Amount</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-lg font-bold hover:shadow-lg transition"
          >
            Submit Request
          </button>
        </form>
      </div>
    </div>
  );
}
