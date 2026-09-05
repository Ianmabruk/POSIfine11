import { useState, useEffect } from 'react';
import { networkPayments, settlements } from '../../services/api';
import { CreditCard, DollarSign, Banknote, RefreshCw } from 'lucide-react';

const STATUS_COLOR = {
  pending: 'bg-amber-100 text-amber-800', payment_initiated: 'bg-amber-100 text-amber-800',
  payment_confirmed: 'bg-green-100 text-green-800', held_pending_delivery_confirmation: 'bg-blue-100 text-blue-800',
  delivery_confirmed: 'bg-indigo-100 text-indigo-800', settlement_requested: 'bg-purple-100 text-purple-800',
  settled: 'bg-green-100 text-green-800', failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800', refunded: 'bg-red-100 text-red-800',
};

export default function PaymentsPage() {
  const [tab, setTab] = useState('transactions');
  const [txs, setTxs] = useState([]);
  const [settlementsList, setSettlementsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [p, t, s] = await Promise.allSettled([
        networkPayments.providers(), networkPayments.list(), settlements.list(),
      ]);
      if (p.status === 'fulfilled') setProviders(p.value.providers || []);
      if (t.status === 'fulfilled') setTxs(t.value.transactions || []);
      if (s.status === 'fulfilled') setSettlementsList(s.value.settlements || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const confirmManual = async (tx) => {
    try { await networkPayments.complete(tx.id); await load(); } catch (e) { alert(e.message || ''); }
  };
  const release = async (s) => {
    try { await settlements.release(s.id); await load(); } catch (e) { alert(e.message || ''); }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Payments & Settlements</h1>
      <div className="flex gap-4 border-b border-gray-200">
        <button onClick={() => setTab('transactions')}
          className={`px-4 py-2 text-sm font-medium ${tab === 'transactions' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-600'}`}>
          <CreditCard className="w-4 h-4 inline mr-1" /> Transactions</button>
        <button onClick={() => setTab('settlements')}
          className={`px-4 py-2 text-sm font-medium ${tab === 'settlements' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-600'}`}>
          <Banknote className="w-4 h-4 inline mr-1" /> Settlements</button>
      </div>

      {loading ? <p>Loading...</p> : tab === 'transactions' ? (
        <TxTable txs={txs} providers={providers} onConfirm={confirmManual} />
      ) : (
        <SettlementTable s={settlementsList} onRelease={release} />
      )}
    </div>
  );
}

function TxTable({ txs, providers, onConfirm }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50"><tr>
          <th className="px-3 py-2">#</th><th className="px-3 py-2">Provider</th><th className="px-3 py-2">Amount</th>
          <th className="px-3 py-2">Status</th><th className="px-3 py-2">Order</th><th className="px-3 py-2 text-right">Actions</th>
        </tr></thead>
        <tbody className="divide-y divide-gray-100">
          {txs.map((t) => (
            <tr key={t.id}>
              <td className="px-3 py-2">{t.id}</td><td className="px-3 py-2 capitalize">{t.provider}</td>
              <td className="px-3 py-2">{t.currency} {t.amount}</td>
              <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLOR[t.status] || ''}`}>{t.status.replace(/_/g, ' ')}</span></td>
              <td className="px-3 py-2">{t.orderId ? `#${t.orderId}` : (t.deliveryId ? `del #${t.deliveryId}` : '-')}</td>
              <td className="px-3 py-2 text-right">
                {t.provider === 'manual' && t.status === 'payment_initiated' && (
                  <button onClick={() => onConfirm(t)} className="px-2 py-1 text-xs text-green-700 hover:bg-green-50 rounded">Confirm Collected</button>
                )}
                {['payment_initiated','payment_confirmed'].includes(t.status) && (
                  <button onClick={async () => { try { await networkPayments.refund(t.id); await onConfirm(t); } catch(e){alert(e.message||'');} }}
                    className="px-2 py-1 text-xs text-red-700 hover:bg-red-50 rounded">Refund</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function SettlementTable({ s, onRelease }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50"><tr>
          <th className="px-3 py-2">#</th><th className="px-3 py-2">Recipient</th><th className="px-3 py-2">Amount</th>
          <th className="px-3 py-2">Status</th><th className="px-3 py-2 text-right">Actions</th>
        </tr></thead>
        <tbody className="divide-y divide-gray-100">
          {s.map((x) => (
            <tr key={x.id}>
              <td className="px-3 py-2">{x.id}</td>
              <td className="px-3 py-2">{x.riderId ? 'Rider' : 'Wholesaler'} · {x.accountId}</td>
              <td className="px-3 py-2">{x.currency} {x.amount}</td>
              <td className="px-3 py-2">{x.status}</td>
              <td className="px-3 py-2 text-right">
                {x.status === 'pending' && (
                  <button onClick={() => onRelease(x)} className="px-2 py-1 text-xs text-primary-700 hover:bg-primary-50 rounded">Release</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
