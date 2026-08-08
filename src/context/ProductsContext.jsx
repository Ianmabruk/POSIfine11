import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { products as productsApi } from '../services/api';
import { useAuth } from './AuthContext';

const ProductsContext = createContext();

const mergeProductsById = (existingProducts = [], incomingProducts = []) => {
  const merged = new Map((existingProducts || []).map(product => [product.id, product]));

  (incomingProducts || []).forEach((incomingProduct) => {
    if (!incomingProduct?.id) return;
    const previous = merged.get(incomingProduct.id) || {};
    merged.set(incomingProduct.id, { ...previous, ...incomingProduct });
  });

  return Array.from(merged.values());
};

export const useProducts = () => useContext(ProductsContext);

export const ProductsProvider = ({ children }) => {
  const { user, isInitialized } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [isEditing, setIsEditing] = useState(false); // Track if user is actively editing

  const getAccountKey = () => user?.account_id || user?.accountId || user?.id || null;
  const getProductsCacheKey = () => {
    const key = getAccountKey();
    return key ? `products_cache_${key}` : null;
  };

  const persistProductsCache = useCallback((nextProducts) => {
    try {
      const cacheKey = getProductsCacheKey();
      if (!cacheKey) return;
      localStorage.setItem(cacheKey, JSON.stringify({
        products: nextProducts,
        savedAt: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to persist products cache:', error);
    }
  }, [user?.account_id, user?.accountId, user?.id]);

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

      persistProductsCache(visibleProducts);
      
      
      setProducts(visibleProducts);
      setError(null);
      
      window.dispatchEvent(new CustomEvent('productsSync', { 
        detail: { products: visibleProducts, timestamp: Date.now() }
      }));
      window.dispatchEvent(new Event('productUpdated'));
      
      return visibleProducts;
      
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError(`Failed to load products: ${err.message}`);

      // Prefer current in-memory state to avoid regressing recently edited costs/COGS.
      if (Array.isArray(products) && products.length) {
        return products;
      }

      try {
        const cacheKey = getProductsCacheKey();
        if (cacheKey) {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            const cachedProducts = Array.isArray(parsed?.products) ? parsed.products : [];
            if (cachedProducts.length) {
              setProducts(cachedProducts);
              return cachedProducts;
            }
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
  }, [user?.account_id, user?.accountId, user?.id, products, persistProductsCache]);

  // Fetch when auth is ready and user changes
  useEffect(() => {
    // Wait for auth to finish initializing before making any API calls
    if (!isInitialized) return;

    if (!user) {
      setProducts([]);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      const cacheKey = getProductsCacheKey();
      if (cacheKey) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          const cachedProducts = Array.isArray(parsed?.products) ? parsed.products : [];
          if (cachedProducts.length) {
            setProducts(cachedProducts);
          }
        }
      }
    } catch (cacheError) {
      console.warn('Failed to hydrate products cache:', cacheError);
    }

    setLoading(true);
    fetchProducts();
  }, [user?.id, user?.account_id, user?.accountId, isInitialized]);

  // SMART AUTO-REFRESH: Only when NOT editing
  // Refreshes every 30 seconds to ensure cashiers see admin updates
  // But respects active editing state to prevent data loss
  useEffect(() => {
    if (!user) return; // Don't auto-refresh when not authenticated
    const interval = setInterval(() => {
      if (!isEditing && document.visibilityState === 'visible') {
        console.log('🔄 Auto-refresh: Fetching latest products from backend...');
        fetchProducts();
      } else if (isEditing) {
        console.log('⏸️ Auto-refresh: Skipped (user is editing)');
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isEditing, fetchProducts, user]);

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

  const upsertProducts = useCallback((incomingProducts) => {
    const normalizedIncoming = Array.isArray(incomingProducts) ? incomingProducts : [incomingProducts];
    setProducts((prevProducts) => {
      const nextProducts = mergeProductsById(prevProducts, normalizedIncoming).filter(product => !product?.pendingDelete);
      persistProductsCache(nextProducts);
      return nextProducts;
    });
    setLastUpdated(Date.now());
  }, [persistProductsCache]);

  const removeProduct = useCallback((productId) => {
    setProducts((prevProducts) => {
      const nextProducts = (prevProducts || []).filter(product => product?.id !== productId);
      persistProductsCache(nextProducts);
      return nextProducts;
    });
    setLastUpdated(Date.now());
  }, [persistProductsCache]);
  
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
        upsertProducts,
        removeProduct,
        setEditingState // Export so components can pause auto-refresh when editing
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
};

