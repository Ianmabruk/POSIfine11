import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { riders, deliveries } from '../../services/api';
import trackingService from '../../services/trackingService';
import MapView from '../../components/network/MapView';
import DeliveryStatusStepper from '../../components/network/DeliveryStatusStepper';
import { Home, Package, BarChart3, User } from 'lucide-react';

export default function RiderApp() {
  const [tab, setTab] = useState('home');
  return (
    <div className="min-h-screen bg-gray-50 pb-16 relative">
      <div className="h-[calc(100vh-4rem)] pt-4">
        <Routes>
          <Route index element={<RiderHome />} />
          <Route path="home" element={<RiderHome />} />
          <Route path="deliveries" element={<RiderMyDeliveries />} />
          <Route path="deliveries/:id" element={<RiderDeliveryTracker />} />
          <Route path="earnings" element={<RiderEarnings />} />
          <Route path="profile" element={<RiderProfile />} />
        </Routes>
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 text-xs">
        {[['home', Home, 'Home'], ['deliveries', Package, 'Deliveries'], ['earnings', BarChart3, 'Earnings'], ['profile', User, 'Profile']].map(([k, I, l]) => (
          <Link key={k} to={`/rider/${k}`} onClick={() => setTab(k)}
            className={`flex flex-col items-center py-2 ${tab === k ? 'text-primary-600' : 'text-gray-500'}`}>
            <I className="w-5 h-5" />
            <span>{l}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
}

function RiderHome() {
  const user = getStoredUser();
  const token = localStorage.getItem('token');
  const [rider, setRider] = useState(null);
  const [pos, setPos] = useState(null);
  const [assigned, setAssigned] = useState(null);
  const [error, setError] = useState('');
  const watchId = useRef(null);

  const refreshRider = async () => {
    try { const r = await riders.getProfile(); setRider(r.rider); } catch (e) { setError(e.message || ''); }
  };
  useEffect(() => { refreshRider(); }, []);

  const setAvailability = async (online, avail) => {
    try { await riders.setAvailability({ isOnline: online, isAvailable: avail }); await refreshRider(); }
    catch (e) { setError(e.message || ''); }
  };

  useEffect(() => {
    trackingService.connect(token).then(() => {
      trackingService.on('delivery_assigned', (data) => setAssigned(data));
    });
    if (!navigator.geolocation) return;
    watchId.current = navigator.geolocation.watchPosition(
      (p) => {
        const loc = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy };
        setPos({ lat: loc.lat, lng: loc.lng });
        const payload = { latitude: loc.lat, longitude: loc.lng, accuracy: loc.accuracy, speed: p.coords.speed || 0 };
        if (assigned?.deliveryId) payload.currentDeliveryId = assigned.deliveryId;
        trackingService.sendLocation(payload);
      },
      () => {}, { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 });
    return () => { if (watchId.current) navigator.geolocation.clearWatch(watchId.current); };
  }, [token, assigned]);

  const markers = [pos, assigned?.dropoffLocation, assigned?.pickupLocation].filter(Boolean).map((p, i) => ({
    lat: p.lat, lng: p.lng, color: i === 0 ? '#ef4444' : '#10b981', popup: i === 0 ? 'You' : i === 1 ? 'Dropoff' : 'Pickup',
  }));

  return (
    <div className="h-full p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Rider Home</h1>
        {rider && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{rider.isVerified ? 'Verified' : 'Pending'} · {rider.rating}★</span>}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!rider?.isVerified && <p className="text-sm text-amber-700 bg-amber-50 p-2 rounded-lg">Awaiting verification to receive deliveries.</p>}
      <div className="flex gap-2">
        <button onClick={() => setAvailability(true, true)} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">Go Available</button>
        <button onClick={() => setAvailability(false, false)} className="flex-1 py-2 bg-gray-300 text-gray-800 rounded-lg text-sm font-medium">Go Offline</button>
      </div>
      {assigned && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">New delivery #{assigned.deliveryId}</h3>
            <button onClick={() => navigate(`/rider/deliveries/${assigned.deliveryId}`)} className="text-sm text-primary-600">Open</button>
          </div>
        </div>
      )}
      <div className="h-64">
        <MapView center={pos || { lat: -1.2921, lng: 36.8219 }} markers={markers} zoom={15} />
      </div>
    </div>
  );
}
// attach navigate helper (not used)
function RiderMyDeliveries() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  useEffect(() => {
    (async () => { try { const r = await deliveries.list(); setItems(r.deliveries || []); } catch {} })();
  }, []);
  return (
    <div className="p-4 space-y-3">
      <h1 className="text-xl font-bold">My Deliveries</h1>
      {items.map((d) => (
        <div key={d.id} className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="font-medium">#{d.id} — {d.status.replace(/_/g, ' ')}</p>
            <p className="text-xs text-gray-500">{d.wholesaleOrderId ? `Order #${d.wholesaleOrderId}` : ''}</p>
          </div>
          <button onClick={() => navigate(`/rider/deliveries/${d.id}`)} className="text-sm text-primary-600">Open</button>
        </div>
      ))}
      {items.length === 0 && <p className="text-sm text-gray-500">No deliveries assigned yet.</p>}
    </div>
  );
}

function RiderDeliveryTracker() {
  const { id } = useParams();
  const [delivery, setDelivery] = useState(null);
  const [events, setEvents] = useState([]);
  const [pos, setPos] = useState(null);
  const load = async () => {
    try {
      const [d, ev] = await Promise.all([deliveries.get(id), deliveries.events(id)]);
      setDelivery(d.delivery); setEvents(ev.events || []);
      if (d.delivery?.rider) setPos({ lat: d.delivery.rider.lat, lng: d.delivery.rider.lng });
    } catch {}
  };
  useEffect(() => { load(); }, [id]);
  const mark = async (status) => {
    try { await deliveries.updateStatus(id, { status }); await load(); } catch (e) { alert(e.message || ''); }
  };
  const allowedRider = ['rider_going_to_pickup', 'rider_at_pickup', 'goods_collected', 'in_transit', 'near_destination', 'delivered_pending_confirmation', 'failed', 'cancelled'];

  if (!delivery) return <div className="p-4">Loading delivery...</div>;
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Delivery #{delivery.id}</h1>
      <DeliveryStatusStepper status={delivery.status} events={events} />
      <div className="h-56">
        <MapView center={pos || delivery.dropoffLocation} markers={[
          pos ? { lat: pos.lat, lng: pos.lng, color: '#ef4444', popup: 'Rider' } : null,
          delivery.pickupLocation ? { lat: delivery.pickupLocation.lat, lng: delivery.pickupLocation.lng, color: '#10b981', popup: 'Pickup' } : null,
          delivery.dropoffLocation ? { lat: delivery.dropoffLocation.lat, lng: delivery.dropoffLocation.lng, color: '#3b82f6', popup: 'Dropoff' } : null,
        ].filter(Boolean)} zoom={14} />
      </div>
      <div className="flex flex-wrap gap-2">
        {allowedRider.filter((s) => delivery.allowedTransitions?.includes(s)).map((s) => (
          <button key={s} onClick={() => mark(s)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">{s.replace(/_/g, ' ')}</button>
        ))}
        {delivery.status === 'delivered_pending_confirmation' && (
          <button onClick={() => mark('buyer_confirmed')} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg">Confirm Handover</button>
        )}
      </div>
    </div>
  );
}

function RiderEarnings() {
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const meResp = await fetch(`${import.meta.env.VITE_API_BASE}/rider/profile`, { headers: { Authorization: `Bearer ${token}` } });
        setSummary((await meResp.json()).rider);
      } catch {}
    })();
  }, []);
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Earnings</h1>
      {summary && (
        <div className="grid grid-cols-2 gap-4">
          <Stat label="Total Earnings" value={`KES ${(summary.earnings || 0).toFixed(2)}`} />
          <Stat label="Completed Deliveries" value={summary.completedDeliveries || 0} />
          <Stat label="Rating" value={`${(summary.rating || 0).toFixed(1)}★`} />
        </div>
      )}
    </div>
  );
}
function Stat({ label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function RiderProfile() {
  const [rider, setRider] = useState(null);
  const [form, setForm] = useState({});
  const load = async () => { try { const r = await riders.getProfile(); setRider(r.rider); setForm(r.rider || {}); } catch {} };
  useEffect(() => { load(); }, []);
  const save = async () => { try { await riders.updateProfile(form); await load(); alert('Saved'); } catch (e) { alert(e.message || ''); } };
  const submitVerify = async () => {
    try { await riders.submitVerification({ licenseNumber: form.licenseNumber, licenseImage: form.licenseImage, licensePlate: form.licensePlate, vehicleType: form.vehicleType }); alert('Verification submitted'); } catch (e) { alert(e.message || ''); }
  };
  if (!rider) return <div className="p-4">Loading...</div>;
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Rider Profile</h1>
      <div className="space-y-3">
        <Field label="Name" v={form.name} set={(v) => setForm({ ...form, name: v })} />
        <Field label="Phone" v={form.phone} set={(v) => setForm({ ...form, phone: v })} />
        <Field label="Vehicle Type" v={form.vehicleType} set={(v) => setForm({ ...form, vehicleType: v })} />
        <Field label="License Plate" v={form.licensePlate} set={(v) => setForm({ ...form, licensePlate: v })} />
        <Field label="License Number" v={form.licenseNumber} set={(v) => setForm({ ...form, licenseNumber: v })} />
        <Field label="License Image URL" v={form.licenseImage} set={(v) => setForm({ ...form, licenseImage: v })} />
        <div className="flex gap-2">
          <button onClick={save} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm">Save</button>
          {!rider.isVerified && <button onClick={submitVerify} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">Submit Verification</button>}
        </div>
      </div>
    </div>
  );
}
function Field({ label, v, set }) {
  return (
    <div><label className="block text-xs text-gray-600 mb-1">{label}</label>
      <input value={v ?? ''} onChange={(e) => set(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
    </div>
  );
}
