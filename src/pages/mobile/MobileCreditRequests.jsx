import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { creditRequests } from '../../services/api';
import { ArrowLeft, CheckCircle2, XCircle, Clock, AlertCircle, Download } from 'lucide-react';

export default function MobileCreditRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [processingId, setProcessingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadRequests = async () => {
    try {
      const data = await creditRequests.getAll();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load credit requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      await creditRequests.approve(id);
      await loadRequests();
    } catch (error) {
      console.error('Failed to approve request:', error);
      alert('Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedRequest) return;
    setProcessingId(selectedRequest.id);
    try {
      await creditRequests.update(selectedRequest.id, {
        action: 'reject',
        adminNotes: rejectionReason
      });
      await loadRequests();
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to reject request:', error);
      alert('Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/mobile')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Credit Requests</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize whitespace-nowrap ${filter === f ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading credit requests...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No credit requests found</div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map(request => (
            <div key={request.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusBadge(request.status)}`}>
                  {request.status}
                </span>
                <span className="text-xs text-gray-500">
                  {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="mb-2">
                <p className="font-medium text-gray-900">{request.customerName || 'Unknown Customer'}</p>
                <p className="text-sm text-gray-600">Amount: KSH {Number(request.amount).toLocaleString()}</p>
                {request.reason && <p className="text-sm text-gray-500 mt-1">{request.reason}</p>}
              </div>
              {request.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(request.id)}
                    disabled={processingId === request.id}
                    className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded-lg disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectClick(request)}
                    disabled={processingId === request.id}
                    className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Reject Credit Request</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
            />
            <div className="flex gap-2">
              <button onClick={() => { setShowRejectModal(false); setRejectionReason(''); setSelectedRequest(null); }} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium">Cancel</button>
              <button onClick={handleRejectConfirm} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-medium">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
