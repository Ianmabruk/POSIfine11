import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marketplace } from '../../services/api';
import { useWholesaleCart } from '../../context/WholesaleCartContext';
import RatingStars from '../../components/network/RatingStars';
import { ShoppingCart, MapPin, Plus, Minus } from 'lucide-react';

export default function WholesalerStorePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add, setWholesaler } = useWholesaleCart();
  const [wholesaler, setWholesalerState] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await marketplace.getWholesaler(id);
        setWholesalerState(res.wholesaler);
        setWholesaler(res.wholesaler);
        setProducts(res.products || []);
        // seed a default delivery location from the buyer's last known location
        if (!localStorage.getItem('wholesale_delivery_location')) {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((p) => {
              localStorage.setItem('wholesale_delivery_location', JSON.stringify({
                lat: p.coords.latitude, lng: p.coords.longitude,
              }));
            }, () => {}, { timeout: 2000 });
          }
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const qty = (p) => Math.max(p.minOrderQuantity || 1, 1);

  if (loading) return <div className="p-6">Loading store...</div>;
  if (!wholesaler) return <div className="p-6 text-red-600">Wholesaler not found</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{wholesaler.businessName || wholesaler.business_name}</h1>
        <button onClick={() => navigate('/admin/marketplace/cart')} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm">
          <ShoppingCart className="w-4 h-4" /> View Cart
        </button>
      </div>
      <div className="flex items-center gap-3">
        <RatingStars rating={wholesaler.rating} readOnly />
        <span className="text-sm text-gray-600">{wholesaler.rating?.toFixed(1) || '—'} rating · {wholesaler.orderCount} orders</span>
        {wholesaler.deliveryAvailable && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">🚚 Delivery</span>}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => (
          <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col">
            {p.image && <img src={p.image} alt={p.name} className="h-24 w-full object-cover rounded-lg mb-2" />}
            <h3 className="font-medium">{p.name}</h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{p.description}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-semibold">KES {p.price} / {p.unit}</span>
              <span className="text-xs text-gray-500">Min: {p.minOrderQuantity || 1}</span>
            </div>
            <button onClick={() => add(p, qty(p))}
              className="mt-3 px-3 py-2 bg-gradient-to-r from-primary-600 to-brand-600 text-white rounded-lg text-sm font-medium">
              Add to Cart
            </button>
          </div>
        ))}
      </div>
      {products.length === 0 && <p className="text-sm text-gray-500">No products listed.</p>}
    </div>
  );
}
