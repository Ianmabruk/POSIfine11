import { useState, useEffect } from 'react';
import { wholesaleOrders, marketplace } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Package, Truck, DollarSign, Clock, FileText } from 'lucide-react';

const STATUS_COLOR = {
  pending: 'bg-amber-100 text-amber-800', accepted: 'bg-blue-100 text-blue-800',
  preparing: 'bg-indigo-100 text-indigo-800', ready_for_pickup: 'bg-purple-100 text-purple-800',
  picked_up: 'bg-indigo-100 text-indigo-800', in_transit: 'bg-blue-100 text-blue-800',
  delivered: 'bg-emerald-100 text-emerald-800', completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800', rejected: 'bg-red-100 text-red-800',
  failed: 'bg-red-100 text-red-800', created: 'bg-gray-100 text-gray-800',
};

export default function WholesaleOrdersPage() {
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('buyer');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const [b, s] = await Promise.allSettled([wholesaleOrders.list(), wholesaleOrders.sellerList()]);
      if (b.status === 'fulfilled') setBuyerOrders(b.value.orders || []);
      if (s.status === 'fulfilled') setSellerOrders(s.value.orders || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const accept = async (o) => {
    try { await wholesaleOrders.accept(o.id); await load(); } catch (e) { alert(e.message || ''); }
  };
  const reject = async (o) => {
    try { await wholesaleOrders.reject(o.id); await load(); } catch (e) { alert(e.message || ''); }
  };

  const orders = tab === 'buyer' ? buyerOrders : sellerOrders;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Wholesale Orders</h1>
      <div className="flex gap-4 border-b border-gray-200">
        <button onClick={() => setTab('buyer')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'buyer' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-600'}`}>My Orders (Buying)</button>
        <button onClick={() => setTab('seller')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'seller' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-600'}`}>Orders for My Business (Selling)</button>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50"><tr>
              <th className="px-3 py-2">#</th><th className="px-3 py-2">Wholesaler</th><th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Status</th><th className="px-3 py-2">Payment</th><th className="px-3 py-2 text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-3 py-2">{o.id}</td>
                  <td className="px-3 py-2">{o.wholesalerAccountId ? `W:${o.wholesalerAccountId.slice(0,8)}` : '-'}</td>
                  <td className="px-3 py-2">KES {o.totalAmount}</td>
                  <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLOR[o.status] || STATUS_COLOR.created}`}>{o.status.replace('_', ' ')}</span></td>
                  <td className="px-3 py-2">{o.paymentStatus}</td>
                  <td className="px-3 py-2 text-right space-x-1">
                    <button onClick={() => navigate(`/admin/orders/${o.id}`)} className="px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded">View</button>
                    {tab === 'seller' && o.status === 'pending' && (
                      <>
                        <button onClick={() => accept(o)} className="px-2 py-1 text-xs text-green-700 hover:bg-green-50 rounded">Accept</button>
                        <button onClick={() => reject(o)} className="px-2 py-1 text-xs text-red-700 hover:bg-red-50 rounded">Reject</button>
                      </>
                    )}
                    {tab === 'buyer' && !o.deliveryId && o.status === 'ready_for_pickup' && (
                      <button onClick={async () => { try { await wholesaleOrders.requestRider(o.id, {}); await load(); } catch(e){alert(e.message||'');} }}
                        className="px-2 py-1 text-xs text-primary-700 hover:bg-primary-50 rounded">Request Rider</button>
                    )}
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
