import { ShoppingCart, Package, CreditCard } from 'lucide-react';

export default function ProductCard({ product, onAddToCart, onRequestCredit, showDiscounts = false }) {
  const isComposite = Boolean(product?.isComposite || product?.is_composite);
  const availableCount = isComposite ? (product?.maxUnits ?? 0) : (product?.quantity ?? 0);
  const isAvailable = availableCount > 0;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      {product.image ? (
        <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
          <Package size={64} className="text-white" />
        </div>
      )}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-gray-800">{product.name}</h3>
          {product.code && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
              {product.code}
            </span>
          )}
        </div>
        <p className="text-gray-600 text-sm mb-2 capitalize">{product.category}</p>
        {product.notes && (
          <p className="text-gray-500 text-xs mb-3 italic bg-gray-50 p-2 rounded">
            {product.notes}
          </p>
        )}
        <div className="flex justify-between items-center mb-4">
          <span className="text-2xl font-bold text-green-600">
            KSH {product.price?.toLocaleString() || 0}
          </span>
          <div className="text-right">
            {isComposite ? (
              <>
                <span className="text-sm font-medium text-gray-600">
                  Producible: {availableCount}
                </span>
                {!isAvailable && (
                  <p className="text-xs text-red-500">Unavailable</p>
                )}
              </>
            ) : (
              <>
                <span className={`text-sm font-medium ${
                  (product.quantity || 0) < 10 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {product.quantity || 0} {product.unit || 'pcs'}
                </span>
                {(product.quantity || 0) < 10 && (
                  <p className="text-xs text-red-500">Low stock!</p>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onAddToCart(product)}
            disabled={!isAvailable}
            className={`flex-1 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
              !isAvailable
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
            }`}
          >
            <ShoppingCart size={18} />
            Add to Cart
          </button>
          {onRequestCredit && (
            <button
              onClick={() => onRequestCredit(product)}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 transition-all hover:shadow-lg flex items-center gap-1"
              title="Request credit for this product"
            >
              <CreditCard size={16} />
              Credit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}