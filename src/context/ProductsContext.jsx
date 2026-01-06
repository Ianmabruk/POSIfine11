import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { products as productsApi } from '../services/api';
import { useAuth } from './AuthContext';
import { demoProducts } from '../utils/demoData';

const ProductsContext = createContext();

export const useProducts = () => useContext(ProductsContext);

export const ProductsProvider = ({ children }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  const fetchProducts = useCallback(async () => {
    // We can fetch products even if not logged in (e.g. for public display if needed),
    // but typically we want a user. For now, let's allow it but handling 401s is done in api.js
    if (!localStorage.getItem('token')) {
       setLoading(false);
       return;
    }

    try {
      const data = await productsApi.getAll();
      let productList = [];

      // Handle different response structures
      if (Array.isArray(data)) {
        productList = data;
      } else if (data && Array.isArray(data.products)) {
        productList = data.products;
      } else if (data && Array.isArray(data.data)) {
         productList = data.data;
      }

      // Filter out deleted products globally
      const activeProducts = productList.filter(p => !p.pendingDelete);
      
      setProducts(prev => {
        // Simple optimization: only update if length changed or strict equality fails
        // For deep comparison we'd need lodash.isEqual or similar, but this is okay for now
        if (JSON.stringify(prev) !== JSON.stringify(activeProducts)) {
            console.log('Products updated:', activeProducts.length, 'products');
            return activeProducts;
        }
        return prev;
      });
      setError(null);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      // Use demo data when backend returns 500 error
      if (err.message.includes('500') || err.message.includes('Network') || err.message.includes('fetch')) {
        console.log('Using demo products due to backend error');
        setProducts(demoProducts);
        setError('Using demo data - backend unavailable');
      } else {
        // Don't wipe out existing products on temporary failure if we have them
        if (products.length === 0) {
          setError(err.message || 'Failed to load products');
        } else {
          // Just log the error but keep existing products
          console.warn('Product fetch failed, keeping cached products');
        }
      }
    } finally {
      setLoading(false);
      setLastUpdated(Date.now());
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, user]); 

  // Auto-refresh interval (every 3 seconds) to keep cashier/admin in sync
  useEffect(() => {
    const intervalId = setInterval(() => {
        console.log('Auto-refreshing products for real-time sync...');
        fetchProducts();
    }, 3000); // 3 seconds for real-time sync between admin and cashier

    return () => clearInterval(intervalId);
  }, [fetchProducts]);

  const refreshProducts = async () => {
    setLoading(true);
    await fetchProducts();
  };

  return (
    <ProductsContext.Provider 
      value={{ 
        products, 
        loading, 
        error, 
        lastUpdated,
        refreshProducts 
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
};

