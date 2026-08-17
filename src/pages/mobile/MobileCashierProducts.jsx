import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { products } from '../../services/api';
import { Search, Plus, ArrowLeft, Package } from 'lucide-react';

export default function MobileCashierProducts() {
  const navigate = useNavigate();
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await products.getAll();
        const filtered = Array.isArray(data) ? data.filter(p => p.visibleToCashier !== false && !p.expenseOnly) : [];
        setProductList(filtered);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const filtered = productList.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product) => {
    navigate('/mobile/cashier');
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/mobile/cashier')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Products</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading products...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No products found</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center mb-3">
                <Package className="w-5 h-5 text-primary-600" />
              </div>
              <p className="font-medium text-gray-900 text-sm truncate">{product.name}</p>
              <p className="text-sm text-gray-500">KSH {Number(product.price).toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">{product.quantity} {product.unit || 'left'}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
