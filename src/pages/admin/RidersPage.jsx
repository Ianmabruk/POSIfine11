import { useState, useEffect, useRef } from 'react';
import { riders } from '../../services/api';
import MapView from '../../components/network/MapView';
import { Search, MapPin, Star } from 'lucide-react';

export default function RidersMapPage() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState(null);
  const [selected, setSelected] = useState(null);
  const [radius, setRadius] = useState(15);

  const loadNearby = async (pos) => {
    setLoading(true);
    try {
      const res = await riders.nearby({ lat: pos.lat, lng: pos.lng, radius });
      setRiders(res.riders || []);
    } catch (e) { setRiders([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { _locate(); }, []);
  const _locate = () => {
    if (!navigator.geolocation) { setCenter({ lat: -1.2921, lng: 36.8219 }); loadNearby({ lat: -1.2921, lng: 36.8219 }); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => { const v = { lat: p.coords.latitude, lng: p.coords.longitude }; setCenter(v); loadNearby(v); },
      () => { const v = { lat: -1.2921, lng: 36.8219 }; setCenter(v); loadNearby(v); },
      { enableHighAccuracy: true, timeout: 4000 });
  };

  const markers = riders.map((r) => ({
    lat: r.lat || 0, lng: r.lng || 0, color: '#10b981',
    popup: `<strong>${r.name}</strong><br/>Rating: ${r.rating}<br/>${r.completedDeliveries} deliveries`,
  }));
  if (center) markers.unshift({ lat: center.lat, lng: center.lng, color: '#3b82f6', popup: 'You' });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Rider Network</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Radius</label>
          <input type="range" min={5} max={50} value={radius} onChange={(e) => { setRadius(+e.target.value); if (center) loadNearby(center); }} />
          <span className="text-sm font-medium">{radius} km</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-[480px]">
          <MapView center={center} markers={markers} zoom={13} />
        </div>
        <div className="space-y-3 max-h-[480px] overflow-y-auto">
          {loading && <p className="text-sm text-gray-500">Locating nearby riders...</p>}
          {riders.map((r) => (
            <div key={r.id} onClick={() => setSelected(r)}
              className="p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{r.name}</h3>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">{r.vehicleType}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {r.rating}
                <MapPin className="w-3 h-3" /> {r.distanceKm} km · ~{r.etaMinutes} min
              </div>
            </div>
          ))}
          {riders.length === 0 && !loading && <p className="text-sm text-gray-500">No available riders found.</p>}
        </div>
      </div>

      {selected && (
        <RiderDetailDrawer rider={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function RiderDetailDrawer({ rider, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-end z-40">
      <div className="bg-white w-full max-w-md rounded-t-2xl p-5">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />
        <h2 className="text-xl font-bold">{rider.name}</h2>
        <p className="text-sm text-gray-600 mt-1">{rider.vehicleType} • {rider.phone}</p>
        <div className="mt-3 space-y-2 text-sm">
          <Row label="Rating" value={`${rider.rating} ★`} />
          <Row label="Completed deliveries" value={rider.completedDeliveries} />
          <Row label="Distance" value={`${rider.distanceKm} km (~${rider.etaMinutes} min)`} />
        </div>
        <button onClick={onClose} className="mt-4 w-full py-2 text-sm font-medium text-primary-700">Close</button>
      </div>
    </div>
  );
}
function Row({ label, value }) {
  return <div className="flex justify-between"><span className="text-gray-500">{label}</span><span className="text-gray-900 font-medium">{value}</span></div>;
}
