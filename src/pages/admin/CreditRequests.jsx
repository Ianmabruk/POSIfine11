import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react';
import { creditRequests as creditRequestsApi, products as productsApi } from '../../services/api';

export default function CreditRequests() {
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadRequests();
    loadProducts();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await creditRequestsApi.getAll();
      setRequests(data);
    } catch (error) {
      console.error('Failed to load credit requests:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await productsApi.getAll();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleApprove = async (id) => {
    try {
      await creditRequestsApi.approve(id);
      loadRequests();
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };

  const handleReject = async (id) => {
    try {
      await creditRequestsApi.reject(id);
      loadRequests();
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown Product';
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
        <div className="flex gap-2">
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