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
      
      // Ensure we always get an array
      const productList = Array.isArray(data) ? data : [];
      
      // Filter visible products for cashiers
      const visibleProducts = productList.filter(p => {
        // Show all products to admins
        if (user?.role === 'admin') return true;
        // For cashiers, hide expense-only and deleted products
        return !p.expenseOnly && !p.pendingDelete && p.visibleToCashier !== false;
      });
      
      setProducts(visibleProducts);
      setError(null);
      
      // Dispatch sync event for real-time updates
      window.dispatchEvent(new CustomEvent('productsSync', { 
        detail: { products: visibleProducts, timestamp: Date.now() }
      }));
      
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError(`Failed to load products: ${err.message}`);
      setProducts([]);
    } finally {
      setLoading(false);
      setLastUpdated(Date.now());
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, user]); 

  // Auto-refresh interval (every 2 seconds) for instant sync
  useEffect(() => {
    const intervalId = setInterval(() => {
        fetchProducts();
    }, 2000); // 2 seconds for instant sync

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

