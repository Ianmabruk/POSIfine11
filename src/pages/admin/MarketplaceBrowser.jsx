import { useState, useEffect } from 'react';
import { marketplace, wholesaleOrders } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useWholesaleCart } from '../../context/WholesaleCartContext';
import { Search, ShoppingCart, Star, MapPin } from 'lucide-react';
import RatingStars from '../../components/network/RatingStars';

export default function MarketplaceBrowser() {
  const { add, setWholesaler, wholesale, totals } = useWholesaleCart();
  const [wholesalers, setWholesalers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const load = async (q = query) => {
    setLoading(true);
    try {
      const pos = await _pos();
      const params = {};
      if (q) params.search = q;
      if (pos) { params.lat = pos.lat; params.lng = pos.lng; params.radius = 50; }
      const res = await marketplace.listWholesalers(params);
      setWholesalers(res.wholesalers || []);
    } catch (e) {
      setWholesalers([]);
    } finally { setLoading(false); }
  };

  const _pos = () => new Promise((resolve) => {
    const cached = JSON.parse(localStorage.getItem('biz_location') || 'null');
    if (cached && cached.lat) return resolve(cached);
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => { const v = { lat: p.coords.latitude, lng: p.coords.longitude }; localStorage.setItem('biz_location', JSON.stringify(v)); resolve(v); },
      () => resolve(cached), { enableHighAccuracy: true, timeout: 3000 });
  });

  useEffect(() => { load(); }, []);

  const handleBrowse = async (w) => {
    setWholesaler(w);
    navigate(`/admin/marketplace/wholesaler/${w.id}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Business Marketplace</h1>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search wholesalers..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); load(e.target.value); }}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      </div>

      {totals.itemCount > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm text-gray-600">{totals.itemCount} item(s) in cart — KES {totals.subTotal}</span>
          <button onClick={() => navigate('/admin/marketplace/cart')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
            View Cart
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse h-40 bg-gray-100 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wholesalers.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              <MapPin className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>No wholesalers found near you.</p>
            </div>
          ) : (
            wholesalers.map((w) => (
              <WholesalerCard key={w.id} w={w} onBrowse={() => handleBrowse(w)} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function WholesalerCard({ w, onBrowse }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col cursor-pointer hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-gray-900">{w.businessName || w.business_name}</h3>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{w.category}</span>
      </div>
      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{w.description || 'B2B supplier'}</p>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <RatingStars rating={w.rating} readOnly />
          <span className="text-sm text-gray-600">{w.rating?.toFixed(1) || '0.0'}</span>
        </div>
        {w.deliveryAvailable && <span className="text-xs text-gray-500">🚚 Delivery</span>}
      </div>
      {w.distanceKm != null && (
        <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
          <MapPin className="w-3 h-3" /> {w.distanceKm} km · ~{w.etaMinutes} min
        </div>
      )}
      <button onClick={onBrowse}
        className="mt-3 px-3 py-2 bg-gradient-to-r from-primary-600 to-brand-600 text-white rounded-lg text-sm font-medium">
        Browse Products
      </button>
    </div>
  );
}
