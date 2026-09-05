import { useState, useEffect } from 'react';
import { wholesaleOrders, geocoding } from '../../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import MapView from '../../components/network/MapView';
import { Package, Truck, MapPin } from 'lucide-react';

export default function WholesaleOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await wholesaleOrders.get(id);
      setOrder(res.order);
      const d = res.order?.delivery;
      if (d?.pickupLocation && d?.dropoffLocation && res.order?.paymentStatus === 'payment_confirmed') {
        const r = await geocoding.route({
          from_lat: d.pickupLocation.lat, from_lng: d.pickupLocation.lng,
          to_lat: d.dropoffLocation.lat, to_lng: d.dropoffLocation.lng,
        });
        console.log('route', r);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const refresh = async (action) => {
    try { await action(); } catch (e) { alert(e.message || ''); }
    await load();
  };

  if (loading) return <div className="p-6">Loading order...</div>;
  if (!order) return <div className="p-6 text-red-600">Order not found</div>;

  const markers = [];
  if (order.delivery?.pickupLocation) markers.push({ lat: order.delivery.pickupLocation.lat, lng: order.delivery.pickupLocation.lng, color: '#10b981', popup: 'Pickup' });
  if (order.delivery?.dropoffLocation) markers.push({ lat: order.delivery.dropoffLocation.lat, lng: order.delivery.dropoffLocation.lng, color: '#3b82f6', popup: 'Dropoff' });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
        <button onClick={() => navigate('/admin/wholesale/orders')} className="text-sm text-gray-600 hover:text-gray-900">← Back</button>
      </div>

      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${orderStatusColor(order.status)}`}>{order.status.replace('_', ' ')}</span>
        <span className="text-sm text-gray-600">Payment: {order.paymentStatus}</span>
        {order.selfAsWholesaler && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">Seller view</span>}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900 mb-2">Items</h2>
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50"><tr><th className="px-2 py-1">Product</th><th className="px-2 py-1 text-right">Qty</th><th className="px-2 py-1 text-right">Total</th></tr></thead>
              <tbody>
                {(order.items || []).map((it) => (
                  <tr key={it.id}><td className="px-2 py-1">{it.name}</td><td className="px-2 py-1 text-right">{it.quantity}</td><td className="px-2 py-1 text-right">KES {it.total}</td></tr>
                ))}
              </tbody>
              <tfoot><tr className="font-medium"><td colSpan="2" className="px-2 py-1 text-right">Total</td><td className="px-2 py-1 text-right">KES {order.totalAmount}</td></tr></tfoot>
            </table>
          </div>

          <div className="flex flex-wrap gap-2">
            {!order.selfAsWholesaler && !order.deliveryId && order.status === 'pending' && (
              <button onClick={() => refresh(() => wholesaleOrders.accept(order.id))} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium">Accept Order</button>
            )}
            {order.selfAsWholesaler && !order.deliveryId && order.status === 'accepted' && (
              <button onClick={() => refresh(() => wholesaleOrders.markReady(order.id))} className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium">Mark Ready for Pickup</button>
            )}
            {order.selfAsWholesaler && order.status === 'ready_for_pickup' && (
              <button onClick={() => refresh(() => wholesaleOrders.markPickedUp(order.id))} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium">Mark Picked Up</button>
            )}
            {!order.selfAsWholesaler && !order.deliveryId && order.status === 'ready_for_pickup' && (
              <button onClick={() => refresh(() => wholesaleOrders.requestRider(order.id, {}))} className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium">Request Rider</button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {order.delivery && (
            <>
              <div className="h-48">
                <MapView center={order.delivery.dropoffLocation} markers={markers} zoom={14} />
              </div>
              <div className="text-sm flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs ${deliveryStatusColor(order.delivery.status)}`}>{order.delivery.status.replace(/_/g, ' ')}</span>
                {order.delivery.rider && <span>Rider: {order.delivery.rider.name}</span>}
              </div>
              {order.delivery.riderId && order.delivery.status !== 'completed' && (
                <button onClick={() => navigate(`/admin/deliveries/${order.delivery.id}`)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg font-medium">Track Delivery</button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function orderStatusColor(s) {
  const m = { pending: 'bg-amber-100 text-amber-800', accepted: 'bg-blue-100 text-blue-800',
    preparing: 'bg-indigo-100 text-indigo-800', completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800', ready_for_pickup: 'bg-purple-100 text-purple-800',
    picked_up: 'bg-indigo-100 text-indigo-800', rejected: 'bg-red-100 text-red-800' };
  return m[s] || 'bg-gray-100 text-gray-800';
}
function deliveryStatusColor(s) {
  const m = { rider_requested: 'bg-amber-100 text-amber-800', rider_assigned: 'bg-blue-100 text-blue-800',
    in_transit: 'bg-blue-100 text-blue-800', completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800', delivered_pending_confirmation: 'bg-amber-100 text-amber-800' };
  return m[s] || 'bg-gray-100 text-gray-800';
}
