import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { products } from '../../services/api';
import MobileAddProductModal from '../../components/MobileAddProductModal';
import { Package, Search, Plus, ArrowLeft, Loader2 } from 'lucide-react';

export default function MobileAdminInventory() {
  const navigate = useNavigate();
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const limit = 20;

  const loadProducts = useCallback(async (pageNum = 1, reset = false) => {
    try {
      const data = await products.getAll({ page: pageNum, limit, search: searchTerm || undefined });
      const items = Array.isArray(data) ? data : [];
      setProductList(prev => reset ? items : [...prev, ...items]);
      setHasMore(items.length >= limit);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [searchTerm, limit]);

  useEffect(() => {
    setLoading(true);
    loadProducts(1, true);
  }, [searchTerm, loadProducts]);

  const handleLoadMore = () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    loadProducts(page + 1, false);
  };

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
      ) : productList.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No products found</div>
      ) : (
        <>
          <div className="space-y-3">
            {productList.map((product) => (
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

          {hasMore && (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="w-full py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-base hover:bg-gray-50 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </button>
          )}
        </>
      )}

      {/* Add Product FAB */}
      <button
        type="button"
        onClick={() => setShowAddProduct(true)}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-slate-900 text-white shadow-xl flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all"
        aria-label="Add Product"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <Plus className="w-7 h-7" />
      </button>

      <MobileAddProductModal
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onProductCreated={() => loadProducts(1, true)}
      />
    </div>
  );
}
