import { useState, useEffect } from 'react';
import { deliveries as deliveriesApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, MapPin, User, Truck } from 'lucide-react';

const STATUS_COLOR = {
  created: 'bg-gray-100 text-gray-800', awaiting_rider: 'bg-amber-100 text-amber-800',
  rider_requested: 'bg-amber-100 text-amber-800', rider_assigned: 'bg-blue-100 text-blue-800',
  rider_going_to_pickup: 'bg-indigo-100 text-indigo-800', rider_at_pickup: 'bg-indigo-100 text-indigo-800',
  goods_collected: 'bg-purple-100 text-purple-800', in_transit: 'bg-blue-100 text-blue-800',
  near_destination: 'bg-sky-100 text-sky-800', delivered_pending_confirmation: 'bg-amber-100 text-amber-800',
  buyer_confirmed: 'bg-green-100 text-green-800', completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800', failed: 'bg-red-100 text-red-800',
};

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try { const r = await deliveriesApi.list(); setDeliveries(r.deliveries || []); }
    catch (e) { console.error(e); setDeliveries([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
      {loading ? <p>Loading...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50"><tr>
              <th className="px-3 py-2">#</th><th className="px-3 py-2">Order</th><th className="px-3 py-2">Rider</th>
              <th className="px-3 py-2">Status</th><th className="px-3 py-2">ETA</th><th className="px-3 py-2 text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {deliveries.map((d) => (
                <tr key={d.id}>
                  <td className="px-3 py-2">{d.id}</td>
                  <td className="px-3 py-2">{d.wholesaleOrderId ? `#${d.wholesaleOrderId}` : '-'}</td>
                  <td className="px-3 py-2">{d.rider ? d.rider.name : (d.riderId ? `Rider #${d.riderId}` : 'Unassigned')}</td>
                  <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLOR[d.status] || STATUS_COLOR.created}`}>{d.status.replace(/_/g, ' ')}</span></td>
                  <td className="px-3 py-2">{d.etaMinutes ? `~${d.etaMinutes} min` : '-'}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => navigate(`/admin/deliveries/${d.id}`)} className="px-2 py-1 text-xs text-primary-700 hover:bg-primary-50 rounded">Track</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
