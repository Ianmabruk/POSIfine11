import { useState, useEffect } from 'react';
import { Tag, Percent } from 'lucide-react';
import { BASE_API_URL } from '../services/api';

export default function DiscountSelector({ originalPrice, onApply }) {
  const [discounts, setDiscounts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

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
      
      if (res.ok) {
        const data = await res.json();
        const now = new Date();
        const activeDiscounts = data.filter(d => {
          if (!d.active) return false;
          const validFrom = new Date(d.validFrom);
          const validTo = new Date(d.validTo);
          return validFrom <= now && validTo >= now;
        });
        setDiscounts(activeDiscounts);
      }
    } catch (error) {
      console.error('Failed to fetch discounts:', error);
      setDiscounts([]);
    } finally {
      setLoading(false);
    }
  };

  const applyDiscount = (discount) => {
    setSelected(discount);
    const discountAmount = (originalPrice * discount.percentage) / 100;
    const newPrice = originalPrice - discountAmount;
    onApply({ discount, newPrice, discountAmount });
  };

  const clearDiscount = () => {
    setSelected(null);
    onApply({ discount: null, newPrice: originalPrice, discountAmount: 0 });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Loading discounts...</span>
      </div>
    );
  }

  if (discounts.length === 0) {
    return (
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <Tag className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No active discounts available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
          <Percent className="w-4 h-4 text-blue-600" />
          Available Discounts
        </h4>
        {selected && (
          <button
            onClick={clearDiscount}
            className="text-xs text-red-600 hover:text-red-800 underline"
          >
            Clear discount
          </button>
        )}
      </div>
      
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {discounts.map(discount => {
          const discountAmount = (originalPrice * discount.percentage) / 100;
          const newPrice = originalPrice - discountAmount;
          const isSelected = selected?.id === discount.id;
          
          return (
            <button
              key={discount.id}
              onClick={() => applyDiscount(discount)}
              className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? 'border-green-500 bg-green-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Tag className="text-red-500" size={16} />
                  <span className="font-bold text-gray-800">{discount.name}</span>
                  <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                    {discount.percentage}% OFF
                  </span>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Save KSH {discountAmount.toFixed(2)}
                </div>
                <div className="text-right">
                  <p className="text-gray-400 line-through text-sm">
                    KSH {originalPrice.toFixed(2)}
                  </p>
                  <p className="text-green-600 font-bold text-lg">
                    KSH {newPrice.toFixed(2)}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      {selected && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-green-700 font-medium">
              Applied: {selected.name}
            </span>
            <span className="text-green-600 font-bold">
              -{selected.percentage}%
            </span>
          </div>
          <p className="text-green-600 text-sm mt-1">
            You save KSH {((originalPrice * selected.percentage) / 100).toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
}