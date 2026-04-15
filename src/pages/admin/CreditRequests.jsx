import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, XCircle, Clock, AlertCircle, Download } from 'lucide-react';
import { creditRequests as creditRequestsApi } from '../../services/api';
import { exportCreditRequestsPDF } from '../../utils/exportData';

export default function CreditRequests() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [processingId, setProcessingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    loadRequests();
    // Reload every 10 seconds to check for new requests
    const interval = setInterval(loadRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadRequests = async () => {
    try {
      const data = await creditRequestsApi.getAll();
      setRequests(data || []);
    } catch (error) {
      console.error('Failed to load credit requests:', error);
    }
  };

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      await creditRequestsApi.update(id, { action: 'approve' });
      console.log('✅ Credit request approved');
      loadRequests();
    } catch (error) {
      console.error('Failed to approve request:', error);
      alert('Failed to approve request: ' + (error.message || 'Unknown error'));
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
      await creditRequestsApi.update(selectedRequest.id, { 
        action: 'reject',
        adminNotes: rejectionReason 
      });
      console.log('✅ Credit request rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedRequest(null);
      loadRequests();
    } catch (error) {
      console.error('Failed to reject request:', error);
      alert('Failed to reject request: ' + (error.message || 'Unknown error'));
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-orange-50 border-orange-200';
      case 'approved': return 'bg-green-50 border-green-200';
      case 'rejected': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-6 h-6 text-orange-600" />;
      case 'approved': return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'rejected': return <XCircle className="w-6 h-6 text-red-600" />;
      default: return <CreditCard className="w-6 h-6 text-gray-600" />;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Credit Requests</h2>
          <p className="text-sm text-gray-600 mt-1">Review and manage credit requests from cashiers</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative group">
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 font-medium">
              <Download className="w-4 h-4" />
              Export
            </button>
            <div className="hidden group-hover:block absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px]">
              <button
                onClick={() => exportCreditRequestsPDF(filteredRequests)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-lg"
              >
                Export PDF
              </button>
            </div>
          </div>
          {['all', 'pending', 'approved', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status === 'pending' && requests.filter(r => r.status === 'pending').length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {requests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredRequests.map(request => (
          <div key={request.id} className={`card border-l-4 ${getStatusColor(request.status)}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  request.status === 'pending' ? 'bg-orange-600' :
                  request.status === 'approved' ? 'bg-green-600' : 'bg-red-600'
                }`}>
                  {getStatusIcon(request.status)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{request.customer_name || request.customerName}</h3>
                  <p className="text-sm text-gray-600">Requested by: {request.cashier_name || request.cashierName}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span>Amount: <strong className="text-green-600">KSH {request.amount?.toLocaleString()}</strong></span>
                    {request.reason && (
                      <span>Reason: <strong>{request.reason.replace(/_/g, ' ')}</strong></span>
                    )}
                  </div>
                  {request.notes && (
                    <p className="text-sm text-gray-600 mt-2">Notes: {request.notes}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Requested: {new Date(request.created_at || request.createdAt).toLocaleString()}
                  </p>
                  {(request.reviewed_at || request.approvalDate) && (
                    <p className="text-xs text-gray-500">
                      {request.status === 'approved' ? 'Approved' : 'Processed'}: {new Date(request.reviewed_at || request.approvalDate).toLocaleString()}
                      {(request.reviewed_by || request.approvedBy) && ` by ID: ${request.reviewed_by || request.approvedBy}`}
                    </p>
                  )}
                  {(request.admin_notes || request.rejectionReason) && request.status === 'rejected' && (
                    <p className="text-xs text-red-600 mt-2">
                      Rejection reason: {request.admin_notes || request.rejectionReason}
                    </p>
                  )}
                </div>
              </div>
              {request.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(request.id)}
                    disabled={processingId === request.id}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
                  >
                    <CheckCircle size={16} />
                    {processingId === request.id ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleRejectClick(request)}
                    disabled={processingId === request.id}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
                  >
                    <XCircle size={16} />
                    {processingId === request.id ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              )}
              {request.status !== 'pending' && (
                <span className={`badge ${
                  request.status === 'approved' ? 'badge-success' : 'bg-red-100 text-red-800'
                }`}>
                  {request.status.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        ))}
        {filteredRequests.length === 0 && (
          <div className="card text-center py-12">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No {filter !== 'all' ? filter : ''} credit requests found.</p>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white flex items-center gap-3">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-xl font-bold">Reject Credit Request</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to reject this credit request from <strong>{selectedRequest.customer_name || selectedRequest.customerName}</strong> for <strong>KSH {selectedRequest.amount?.toLocaleString()}</strong>?
              </p>
              <div>
                <label className="block text-sm font-medium mb-2">Rejection Reason</label>
                <textarea
                  placeholder="Enter reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-red-500"
                  rows="4"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRejectConfirm}
                  disabled={processingId !== null}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition disabled:opacity-50"
                >
                  {processingId ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                    setSelectedRequest(null);
                  }}
                  disabled={processingId !== null}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-400 transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {filteredRequests.map(request => (
          <div key={request.id} className={`card border-l-4 ${getStatusColor(request.status)}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  request.status === 'pending' ? 'bg-orange-600' :
                  request.status === 'approved' ? 'bg-green-600' : 'bg-red-600'
                }`}>
                  {getStatusIcon(request.status)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{request.customerName}</h3>
                  <p className="text-sm text-gray-600">{getProductName(request.productId)}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span>Quantity: <strong>{request.quantity}</strong></span>
                    <span>Amount: <strong className="text-green-600">KSH {request.amount?.toLocaleString()}</strong></span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Requested: {new Date(request.createdAt).toLocaleString()}
                  </p>
                  {request.approvedAt && (
                    <p className="text-xs text-gray-500">
                      Approved: {new Date(request.approvedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              {request.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(request.id)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                  >
                    <CheckCircle size={16} />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </div>
              )}
              {request.status !== 'pending' && (
                <span className={`badge ${
                  request.status === 'approved' ? 'badge-success' : 'bg-red-100 text-red-800'
                }`}>
                  {request.status.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        ))}
        {filteredRequests.length === 0 && (
          <div className="card text-center py-12">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No {filter !== 'all' ? filter : ''} credit requests found.</p>
          </div>
        )}
      </div>
    </div>
  );
}