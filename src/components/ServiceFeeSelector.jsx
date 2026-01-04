import { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';

export default function ServiceFeeSelector({ onApply }) {
  const [fees, setFees] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5001/api';
      const res = await fetch(`${API_URL}/service-fees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setFees(data.filter(f => f.active));
    } catch (error) {
      console.error('Failed to fetch fees:', error);
    }
  };

  const toggleFee = (fee) => {
    if (selected.find(f => f.id === fee.id)) {
      setSelected(selected.filter(f => f.id !== fee.id));
    } else {
      setSelected([...selected, fee]);
    }
  };

  const total = selected.reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <DollarSign className="text-green-600" />
        Service Fees
      </h3>
      <div className="space-y-2 mb-4">
        {fees.map(fee => (
          <label key={fee.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={!!selected.find(f => f.id === fee.id)}
              onChange={() => toggleFee(fee)}
              className="w-5 h-5 text-blue-600 rounded"
            />
            <div className="flex-1">
              <p className="font-medium">{fee.name}</p>
              <p className="text-sm text-gray-500">{fee.description}</p>
            </div>
            <span className="font-bold text-green-600">${fee.amount}</span>
          </label>
        ))}
      </div>
      {selected.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold">Total Fees:</span>
            <span className="text-xl font-bold text-green-600">${total.toFixed(2)}</span>
          </div>
          <button
            onClick={() => onApply(selected)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
          >
            Apply Fees
          </button>
        </div>
      )}
    </div>
  );
}
