import { useState } from 'react';
import { creditRequests } from '../services/api';
import { CreditCard, X } from 'lucide-react';

export default function CreditRequestForm({ product, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    customerName: '',
    quantity: 1,
    amount: product.price,
    reason: 'credit_sale',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const data = await creditRequests.create({
        customerName: formData.customerName,
        amount: formData.amount,
        reason: formData.reason,
        notes: formData.notes || `${product.name} x${formData.quantity}`
      });
      if (data?.error) {
        setError(data.error);
      } else {
        onSubmit(data);
        onClose();
      }
    } catch (err) {
      console.error('Failed to submit credit request:', err);
      setError(err.message || 'Failed to submit credit request');
    } finally {
      setSubmitting(false);
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
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
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
              placeholder="Enter customer name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Reason</label>
            <select
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-orange-500"
              required
            >
              <option value="credit_sale">Credit Sale</option>
              <option value="customer_request">Customer Request</option>
              <option value="regular_customer">Regular Customer</option>
              <option value="business_account">Business Account</option>
              <option value="other">Other</option>
            </select>
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
            <label className="block text-sm font-medium mb-2">Amount (KSH)</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Notes (optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-orange-500"
              placeholder="Additional details..."
              rows="2"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-lg font-bold hover:shadow-lg transition disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
