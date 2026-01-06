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
        // Only update if products actually changed to prevent glitching
        const prevIds = prev.map(p => p.id).sort().join(',');
        const newIds = activeProducts.map(p => p.id).sort().join(',');
        const prevData = JSON.stringify(prev.map(p => ({id: p.id, quantity: p.quantity, price: p.price})));
        const newData = JSON.stringify(activeProducts.map(p => ({id: p.id, quantity: p.quantity, price: p.price})));
        
        if (prevIds !== newIds || prevData !== newData) {
            return activeProducts;
        }
        return prev;
      });
      setError(null);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      // Don't use demo data - let the error be handled properly
      setError(`Failed to load products: ${err.message}`);
    } finally {
      setLoading(false);
      setLastUpdated(Date.now());
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, user]); 

  // Auto-refresh interval (every 1 second) for instant sync
  useEffect(() => {
    const intervalId = setInterval(() => {
        fetchProducts();
    }, 1000); // 1 second for instant sync

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

