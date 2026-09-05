import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const WholesaleCartContext = createContext();
export const useWholesaleCart = () => useContext(WholesaleCartContext);

export function WholesaleCartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wholesale_cart') || '[]'); } catch { return []; }
  });
  const [wholesaler, setWholesaler] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wholesale_cart_wholesaler') || 'null'); } catch { return null; }
  });

  useEffect(() => {
    localStorage.setItem('wholesale_cart', JSON.stringify(items));
  }, [items]);
  useEffect(() => {
    localStorage.setItem('wholesale_cart_wholesaler', JSON.stringify(wholesaler));
  }, [wholesaler]);

  const add = (product, qty = (product.minOrderQuantity || 1)) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => i.id === product.id ? { ...i, quantity: Math.max(i.quantity + qty, product.minOrderQuantity || 1) } : i);
      }
      return [...prev, { ...product, quantity: qty }];
    });
  };
  const updateQty = (id, qty) => setItems((prev) => prev.map((i) => i.id === id ? { ...i, quantity: qty } : i));
  const remove = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
  const clear = () => setItems([]);

  const totals = useMemo(() => {
    const subTotal = items.reduce((s, i) => s + (i.price * i.quantity), 0);
    return { subTotal: Math.round(subTotal), itemCount: items.length };
  }, [items]);

  return (
    <WholesaleCartContext.Provider value={{ items, add, updateQty, remove, clear, setWholesaler, wholesaler, totals }}>
      {children}
    </WholesaleCartContext.Provider>
  );
}
