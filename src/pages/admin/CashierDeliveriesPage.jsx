import { useState, useEffect } from 'react';
import { deliveries, riders } from '../../services/api';
import trackingService from '../../services/trackingService';
import MapView from '../../components/network/MapView';
import DeliveryStatusStepper from '../../components/network/DeliveryStatusStepper';
import { Truck, MapPin, RefreshCw } from 'lucide-react';

export default function CashierDeliveriesPage() {
  const [deliveriesList, setDeliveriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const r = await deliveries.list(); setDeliveriesList(r.deliveries || []); }
    catch (e) { console.error(e); setDeliveriesList([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    trackingService.connect(localStorage.getItem('token') || '');
    const onLoc = (d) => {
      if (d.deliveryId === tracking?.id) setTracking((t) => ({ ...t, rider: { lat: d.latitude, lng: d.longitude } }));
    };
    trackingService.on('rider_location', onLoc);
    return () => trackingService.off('rider_location', onLoc);
  }, [tracking?.id]);

  const openLive = (d) => setTracking(d);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Truck className="w-5 h-5" /> Deliveries</h1>
      {loading ? <p>Loading...</p> : (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50"><tr>
                <th className="px-3 py-2">#</th><th className="px-3 py-2">Order</th><th className="px-3 py-2">Rider</th>
                <th className="px-3 py-2">Status</th><th className="px-3 py-2 text-right">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {deliveriesList.map((d) => (
                  <tr key={d.id}>
                    <td className="px-3 py-2">{d.id}</td>
                    <td className="px-3 py-2">{d.wholesaleOrderId ? `#${d.wholesaleOrderId}` : '-'}</td>
                    <td className="px-3 py-2">{d.rider?.name || (d.riderId ? `#${d.riderId}` : 'Unassigned')}</td>
                    <td className="px-3 py-2 text-xs">{d.status.replace(/_/g, ' ')}</td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => openLive(d)} className="px-2 py-1 text-xs text-primary-700 hover:bg-primary-50 rounded">Live Track</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {tracking && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Live: Delivery #{tracking.id}</h2>
              <DeliveryStatusStepper status={tracking.status} events={tracking.events || []} />
              <div className="h-56">
                <MapView center={tracking.rider || tracking.dropoffLocation} markers={[
                  tracking.rider ? { lat: tracking.rider.lat, lng: tracking.rider.lng, color: '#ef4444', popup: 'Rider' } : null,
                  tracking.pickupLocation ? { lat: tracking.pickupLocation.lat, lng: tracking.pickupLocation.lng, color: '#10b981', popup: 'Pickup' } : null,
                  tracking.dropoffLocation ? { lat: tracking.dropoffLocation.lat, lng: tracking.dropoffLocation.lng, color: '#3b82f6', popup: 'Dropoff' } : null,
                ].filter(Boolean)} zoom={14} />
              </div>
              <div className="flex gap-2">
                {tracking.status === 'delivered_pending_confirmation' && (
                  <button onClick={async () => { await deliveries.confirm(tracking.id); await load(); }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">Confirm Delivery</button>
                )}
                <button onClick={() => setTracking(null)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg">Close</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
