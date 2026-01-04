import { ShoppingCart, Package, Tag } from 'lucide-react';
import DiscountSelector from './DiscountSelector';

export default function ProductCard({ product, onAddToCart, onRequestCredit, showDiscounts = false }) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition transform hover:-translate-y-1">
      {product.image ? (
        <img src={product.image} alt={product.name} className="w-full h-64 object-contain bg-gray-50" />
      ) : (
        <div className="w-full h-64 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
          <Package size={64} className="text-white" />
        </div>
      )}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg">{product.name}</h3>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{product.code || 'N/A'}</span>
        </div>
        <p className="text-gray-600 text-sm mb-2">{product.category}</p>
        {product.notes && <p className="text-gray-500 text-xs mb-3 italic">{product.notes}</p>}

        <div className="flex justify-between items-center mb-3">
          <span className="text-2xl font-bold text-green-600">KSH {product.price?.toLocaleString()}</span>
          <span className="text-sm text-gray-500">{product.quantity} {product.unit}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onAddToCart(product)}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <ShoppingCart size={18} />
            Add
          </button>
          <button
            onClick={() => onRequestCredit(product)}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 transition"
          >
            Credit
          </button>
        </div>
      </div>
    </div>
  );
}
