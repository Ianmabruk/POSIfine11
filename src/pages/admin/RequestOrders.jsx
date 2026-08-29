import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { requests as requestsApi } from '../../services/api';
import {
  Clock, CheckCircle2, XCircle, Filter, ArrowUpDown, Package, User, Calendar,
  ChevronLeft, Loader2
} from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
};

export default function RequestOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('-created_at');
  const [processing, setProcessing] = useState({});

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await requestsApi.getAll({ status: filter, sort });
      setRequests(data.items || []);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [filter, sort]);

  const handleApprove = async (requestId) => {
    setProcessing(prev => ({ ...prev, [requestId]: 'approving' }));
    try {
      const updated = await requestsApi.approve(requestId);
      setRequests(prev => prev.map(r => r.id === requestId ? updated : updated));
    } catch (error) {
      alert('Unable to approve request. Please try again.');
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: null }));
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt('Rejection reason (optional):');
    if (reason === null) return;
    setProcessing(prev => ({ ...prev, [requestId]: 'rejecting' }));
    try {
      const updated = await requestsApi.reject(requestId, reason || '');
      setRequests(prev => prev.map(r => r.id === requestId ? updated : updated));
    } catch (error) {
      alert('Unable to reject request. Please try again.');
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: null }));
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Request Orders</h1>
            {pendingCount > 0 && (
              <p className="text-xs text-orange-600 font-medium">{pendingCount} pending</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
          >
            <option value="-created_at">Newest</option>
            <option value="created_at">Oldest</option>
          </select>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No requests found</p>
          </div>
        ) : (
          requests.map((req) => {
            const statusConfig = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;
            const isProcessing = processing[req.id];
            const isPending = req.status === 'pending';

            return (
              <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border ${statusConfig.color}`}>
                      <StatusIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{req.product_name}</p>
                      <p className="text-xs text-gray-500">Qty: {req.quantity} {req.unit}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full border ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span>{req.cashier_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>{new Date(req.created_at).toLocaleDateString()} {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {req.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
                    <p className="text-xs text-red-700 font-medium mb-0.5">Rejection Reason:</p>
                    <p className="text-xs text-red-600">{req.rejection_reason}</p>
                  </div>
                )}

                {isPending && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleApprove(req.id)}
                      disabled={!!isProcessing}
                      className="flex-1 bg-green-600 text-white text-xs font-medium py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      {isProcessing === 'approving' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      disabled={!!isProcessing}
                      className="flex-1 bg-red-50 text-red-700 border border-red-200 text-xs font-medium py-2.5 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      {isProcessing === 'rejecting' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
