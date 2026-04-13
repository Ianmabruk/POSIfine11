import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { products as productsApi } from '../services/api';
import { useAuth } from './AuthContext';

const ProductsContext = createContext();

export const useProducts = () => useContext(ProductsContext);

export const ProductsProvider = ({ children }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [isEditing, setIsEditing] = useState(false); // Track if user is actively editing

  const getAccountKey = () => user?.account_id || user?.accountId || user?.id || 'anonymous';
  const getProductsCacheKey = () => `products_cache_${getAccountKey()}`;

  const fetchProducts = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
       setLoading(false);
       return [];
    }

    try {
      const data = await productsApi.getAll();
      
      // Ensure we always get an array
      const productList = Array.isArray(data) ? data : [];
      
      // Filter visible products
      const visibleProducts = productList.filter(p => {
        return !p.pendingDelete;
      });

      localStorage.setItem(getProductsCacheKey(), JSON.stringify({
        products: visibleProducts,
        savedAt: Date.now()
      }));
      
      setProducts(visibleProducts);
      setError(null);
      
      // Dispatch sync event for real-time updates
      window.dispatchEvent(new CustomEvent('productsSync', { 
        detail: { products: visibleProducts, timestamp: Date.now() }
      }));
      
      // Also emit event that other components can listen to
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.dispatchEvent(new Event('productUpdated'));
        }, 100);
      }
      
      // CRITICAL: Return the products so callers can use them immediately
      return visibleProducts;
      
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError(`Failed to load products: ${err.message}`);

      // Prefer current in-memory state to avoid regressing recently edited costs/COGS.
      if (Array.isArray(products) && products.length) {
        return products;
      }

      try {
        const cached = localStorage.getItem(getProductsCacheKey());
        if (cached) {
          const parsed = JSON.parse(cached);
          const cachedProducts = Array.isArray(parsed?.products) ? parsed.products : [];
          if (cachedProducts.length) {
            setProducts(cachedProducts);
            return cachedProducts;
          }
        }
      } catch (cacheError) {
        console.warn('Failed to restore cached products:', cacheError);
      }

      // Keep current products when fetch fails to avoid accidental UI wipes.
      return products;
    } finally {
      setLoading(false);
      setLastUpdated(Date.now());
    }
  }, [user?.account_id, user?.accountId, user?.id, products]);

  // Initial fetch only
  useEffect(() => {
    fetchProducts();
  }, []); // Only run on mount

  // Re-fetch when user changes to avoid cross-account data mixing
  useEffect(() => {
    if (!user) {
      setProducts([]);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      const cached = localStorage.getItem(getProductsCacheKey());
      if (cached) {
        const parsed = JSON.parse(cached);
        const cachedProducts = Array.isArray(parsed?.products) ? parsed.products : [];
        if (cachedProducts.length) {
          setProducts(cachedProducts);
        }
      }
    } catch (cacheError) {
      console.warn('Failed to hydrate products cache:', cacheError);
    }

    setLoading(true);
    fetchProducts();
  }, [user?.id, user?.account_id, user?.accountId]);

  // SMART AUTO-REFRESH: Only when NOT editing
  // Refreshes every 30 seconds to ensure cashiers see admin updates
  // But respects active editing state to prevent data loss
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isEditing && document.visibilityState === 'visible') {
        console.log('🔄 Auto-refresh: Fetching latest products from backend...');
        fetchProducts();
      } else if (isEditing) {
        console.log('⏸️ Auto-refresh: Skipped (user is editing)');
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isEditing, fetchProducts]);

  // Listen for clear-data events and force immediate refetch
  useEffect(() => {
    const handleDataCleared = () => {
      console.log('🔄 Data cleared event received - forcing products refresh');
      setProducts([]);
      setError(null);
      fetchProducts();
    };

    window.addEventListener('dataCleared', handleDataCleared);
    window.addEventListener('productsCleared', handleDataCleared);
    
    return () => {
      window.removeEventListener('dataCleared', handleDataCleared);
      window.removeEventListener('productsCleared', handleDataCleared);
    };
  }, []); // No dependencies

  const refreshProducts = async () => {
    setLoading(true);
    const freshProducts = await fetchProducts();
    return freshProducts;
  };
  
  // Allow components to signal they're editing
  const setEditingState = (editing) => {
    setIsEditing(editing);
    console.log(editing ? '✏️ Editing mode ON - auto-refresh paused' : '✅ Editing mode OFF - auto-refresh resumed');
  };

  return (
    <ProductsContext.Provider 
      value={{ 
        products, 
        loading, 
        error, 
        lastUpdated,
        refreshProducts,
        setEditingState // Export so components can pause auto-refresh when editing
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
};

