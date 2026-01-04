
import { useState, useEffect } from 'react';
import { Tag } from 'lucide-react';
import { discounts } from '../services/api';

export default function DiscountSelector({ originalPrice, onApply }) {
  const [discountList, setDiscountList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const data = await discounts.getAll();
      const now = new Date();
      // Filter active discounts that are currently valid
      const activeDiscounts = data.filter(d => 
        d.active !== false && 
        (!d.validFrom || new Date(d.validFrom) <= now) &&
        (!d.validTo || new Date(d.validTo) >= now)
      );
      setDiscountList(activeDiscounts);
    } catch (error) {
      console.error('Failed to fetch discounts:', error);
      setDiscountList([]);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading discounts...</span>
      </div>
    );
  }

  if (discountList.length === 0) {
    return (
      <div className="text-center py-8">
        <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No active discounts available</p>
        <p className="text-gray-400 text-sm mt-1">Check with administrator to set up discounts</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Tag className="w-5 h-5 text-blue-600" />
        Available Discounts
      </h4>
      {discountList.map(discount => {
        const discountAmount = (originalPrice * discount.percentage) / 100;
        const newPrice = originalPrice - discountAmount;
        return (
          <button
            key={discount.id}
            onClick={() => applyDiscount(discount)}
            className={`w-full p-4 rounded-lg border-2 transition-all hover:shadow-md ${
              selected?.id === discount.id
                ? 'border-green-500 bg-green-50 shadow-md'
                : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-900">{discount.name}</span>
                  <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-semibold">
                    {discount.percentage}% OFF
                  </span>
                </div>
                {discount.description && (
                  <p className="text-sm text-gray-600">{discount.description}</p>
                )}
                {discount.validFrom && discount.validTo && (
                  <p className="text-xs text-gray-500 mt-1">
                    Valid: {new Date(discount.validFrom).toLocaleDateString()} - {new Date(discount.validTo).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="text-right ml-4">
                <p className="text-gray-400 line-through text-sm">KSH {originalPrice.toLocaleString()}</p>
                <p className="text-green-600 font-bold text-lg">KSH {newPrice.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Save KSH {discountAmount.toLocaleString()}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
