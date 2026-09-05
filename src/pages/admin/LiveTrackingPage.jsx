import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { deliveries as deliveriesApi, riders } from '../../services/api';
import trackingService from '../../services/trackingService';
import MapView from '../../components/network/MapView';
import DeliveryStatusStepper from '../../components/network/DeliveryStatusStepper';
import { useNavigate } from 'react-router-dom';
import { Check, X, Package } from 'lucide-react';

export default function LiveTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState(null);
  const [events, setEvents] = useState([]);
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      const d = await deliveriesApi.get(id);
      setDelivery(d.delivery);
      const ev = await deliveriesApi.events(id);
      setEvents(ev.events || []);
      if (d.delivery?.rider) setPosition({ lat: d.delivery.rider.lat, lng: d.delivery.rider.lng });
    } catch (e) { setError(e.message || 'Failed to load delivery'); }
  };
  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    trackingService.connect(localStorage.getItem('token'));
    if (id) trackingService.subscribeDelivery(id);
    const onLoc = (data) => setPosition({ lat: data.latitude, lng: data.longitude });
    const onStatus = () => load();
    trackingService.on('rider_location', onLoc);
    trackingService.on('delivery_status', onStatus);
    trackingService.on('delivery_completed', onStatus);
    return () => {
      trackingService.off('rider_location', onLoc);
      trackingService.off('delivery_status', onStatus);
      trackingService.off('delivery_completed', onStatus);
      if (id) trackingService.unsubscribeDelivery(id);
    };
  }, [id]);

  const doConfirm = async () => {
    try { await deliveriesApi.confirm(id); await load(); } catch (e) { alert(e.message || ''); }
  };
  const doCancel = async () => {
    try { await deliveriesApi.cancel(id); await load(); } catch (e) { alert(e.message || ''); }
  };
  const markStatus = async (status) => {
    try { await deliveriesApi.updateStatus(id, { status }); await load(); } catch (e) { alert(e.message || ''); }
  };
  const role = JSON.parse(localStorage.getItem('user') || '{}').role;
  const isBuyer = delivery?.accountId === JSON.parse(localStorage.getItem('user') || '{}').accountId;

  if (!delivery && !error) return <div className="p-6">Loading delivery...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  const markers = [];
  if (position) markers.push({ lat: position.lat, lng: position.lng, color: '#ef4444', popup: 'Rider' });
  if (delivery?.pickupLocation) markers.push({ lat: delivery.pickupLocation.lat, lng: delivery.pickupLocation.lng, color: '#10b981', popup: 'Pickup' });
  if (delivery?.dropoffLocation) markers.push({ lat: delivery.dropoffLocation.lat, lng: delivery.dropoffLocation.lng, color: '#3b82f6', popup: 'Dropoff' });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Delivery #{delivery?.id}</h1>
        <button onClick={() => navigate('/admin/deliveries')} className="text-sm text-gray-600 hover:text-gray-900">← Back</button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="h-[420px]">
          <MapView center={position || delivery?.dropoffLocation} markers={markers} zoom={14} />
        </div>
        <div className="space-y-4">
          <DeliveryStatusStepper status={delivery?.status} events={events} />
          {role === 'rider' && (
            <div className="flex flex-wrap gap-2">
              {['rider_going_to_pickup','at_pickup_goods_collected' ].map((s) => (
                <button key={s} onClick={() => markStatus(s.replace('at_pickup_goods_collected','goods_collected'))}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
              <button onClick={() => markStatus('in_transit')} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">In Transit</button>
              <button onClick={() => markStatus('near_destination')} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Near Destination</button>
              <button onClick={() => markStatus('delivered_pending_confirmation')} className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">Arrived</button>
            </div>
          )}
          {isBuyer && delivery?.status === 'delivered_pending_confirmation' && (
            <div className="flex gap-2">
              <button onClick={doConfirm} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium">Confirm Delivery</button>
              <button onClick={doCancel} className="px-4 py-2 border border-gray-200 rounded-lg">Cancel</button>
            </div>
          )}
          {delivery?.rider && delivery?.rider.name && (
            <div className="text-sm text-gray-600">Rider: {delivery.rider.name} · {delivery.rider.rating}★</div>
          )}
        </div>
      </div>
    </div>
  );
}
