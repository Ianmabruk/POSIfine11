import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { products } from '../../services/api';
import MobileAddProductModal from '../../components/MobileAddProductModal';
import { Package, Search, Plus, ArrowLeft } from 'lucide-react';

export default function MobileAdminInventory() {
  const navigate = useNavigate();
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      const data = await products.getAll();
      setProductList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filtered = productList.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/mobile')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
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
        <div className="text-center py-8 text-gray-500">Loading inventory...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No products found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((product) => (
            <div key={product.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-500">KSH {Number(product.price).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${product.quantity > 10 ? 'text-green-600' : 'text-orange-600'}`}>
                    {product.quantity} {product.unit || 'units'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Product FAB */}
      <button
        type="button"
        onClick={() => setShowAddProduct(true)}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg flex items-center justify-center hover:bg-primary-700 transition-colors"
        aria-label="Add Product"
      >
        <Plus className="w-7 h-7" />
      </button>

      <MobileAddProductModal
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onProductCreated={loadProducts}
      />
    </div>
  );
}
