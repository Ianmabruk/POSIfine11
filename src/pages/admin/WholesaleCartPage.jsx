import { useWholesaleCart } from '../../context/WholesaleCartContext';
import { wholesaleOrders } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingCart } from 'lucide-react';

export default function WholesaleCartPage() {
  const { items, updateQty, remove, clear, setWholesaler, wholesaler, totals } = useWholesaleCart();
  const navigate = useNavigate();

  const checkout = async () => {
    if (!wholesaler) return alert('Select a wholesaler first');
    if (!items.length) return alert('Cart is empty');
    try {
      const loc = JSON.parse(localStorage.getItem('wholesale_delivery_location') || '{}');
      await wholesaleOrders.create({
        wholesalerId: wholesaler.id,
        items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
        deliveryLocation: loc,
        pickupLocation: { lat: wholesaler.lat, lng: wholesaler.lng, address: 'Wholesaler address' },
      });
      clear();
      alert('Order placed! Check "My Orders".');
      navigate('/admin/wholesale/orders');
    } catch (e) { alert(e.message || 'Order failed'); }
  };

  if (!items.length) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold mb-4 flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> Your Cart</h1>
        <p className="text-gray-500">Your cart is empty. Browse the <button onClick={() => navigate('/admin/marketplace')} className="text-primary-600 underline">marketplace</button>.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> Your Cart — {wholesaler?.businessName || wholesaler?.business_name}</h1>
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50"><tr>
          <th className="px-3 py-2">Product</th><th className="px-3 py-2">Qty</th><th className="px-3 py-2">Price</th><th className="px-3 py-2">Total</th><th className="px-3 py-2 text-right">Actions</th>
        </tr></thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((i) => (
            <tr key={i.id}>
              <td className="px-3 py-2">{i.name}</td>
              <td className="px-3 py-2 w-24"><input type="number" min={i.minOrderQuantity || 1} value={i.quantity}
                onChange={(e) => updateQty(i.id, Math.max(i.minOrderQuantity || 1, +e.target.value))} className="w-full px-2 py-1 border border-gray-200 rounded"/></td>
              <td className="px-3 py-2">KES {i.price}</td>
              <td className="px-3 py-2">KES {(i.price * i.quantity).toFixed(2)}</td>
              <td className="px-3 py-2 text-right"><button onClick={() => remove(i.id)} className="p-1 text-red-600"><Trash2 className="w-4 h-4" /></button></td>
            </tr>
          ))}
        </tbody>
        <tfoot><tr className="font-bold"><td colSpan="3" className="px-3 py-2">Subtotal</td><td className="px-3 py-2">KES {totals.subTotal.toFixed(2)}</td><td /></tr></tfoot>
      </table>
      <div className="flex justify-between">
        <button onClick={clear} className="px-3 py-1.5 border border-gray-200 rounded text-sm">Clear Cart</button>
        <button onClick={() => navigate('/admin/marketplace')} className="px-3 py-1.5 border border-gray-200 rounded text-sm">Continue Shopping</button>
        <button onClick={checkout} className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium">Checkout — KES {totals.subTotal.toFixed(2)}</button>
      </div>
    </div>
  );
}
