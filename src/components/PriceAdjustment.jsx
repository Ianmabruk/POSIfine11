import { useState } from 'react';
import { AlertTriangle, TrendingUp, History } from 'lucide-react';

export default function PriceAdjustment({ product, onUpdate, user }) {
  const [newPrice, setNewPrice] = useState(product.price || 0);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState('');

  const handlePriceChange = async () => {
    if (newPrice < product.price) {
      setError('You cannot lower prices, only increase.');
      return;
    }

    if (newPrice === product.price) {
      setError('Price is the same. No change needed.');
      return;
    }

    // Log price change
    const priceHistory = product.priceHistory || [];
    priceHistory.push({
      oldPrice: product.price,
      newPrice: newPrice,
      changedBy: user.name,
      userId: user.id,
      timestamp: new Date().toISOString()
    });

    await onUpdate({
      ...product,
      price: newPrice,
      priceHistory
    });

    setError('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Price: KSH {product.price?.toLocaleString()}
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={newPrice}
              onChange={(e) => {
                setNewPrice(parseFloat(e.target.value));
                setError('');
              }}
              className="input pr-10"
              placeholder="New Price"
            />
            <TrendingUp className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />
          </div>
        </div>
        <button
          onClick={handlePriceChange}
          className="btn-primary mt-6"
          disabled={newPrice <= product.price}
        >
          Update Price
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {product.priceHistory && product.priceHistory.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <History className="w-4 h-4" />
            {showHistory ? 'Hide' : 'Show'} Price History
          </button>

          {showHistory && (
            <div className="mt-3 space-y-2">
              {product.priceHistory.slice().reverse().map((change, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <p className="font-medium">
                      KSH {change.oldPrice} → KSH {change.newPrice}
                    </p>
                    <p className="text-xs text-gray-500">
                      by {change.changedBy} • {new Date(change.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span className="badge badge-success">
                    +{((change.newPrice - change.oldPrice) / change.oldPrice * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
