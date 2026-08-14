import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  MoreVertical,
  Lock,
  Unlock,
  Trash2,
  Mail
} from 'lucide-react';

export default function SubscriberManagement() {
  const [subscribers, setSubscribers] = useState([]);
  const [filteredSubscribers, setFilteredSubscribers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState(null);
  const [actionSubscriber, setActionSubscriber] = useState(null);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  useEffect(() => {
    filterSubscribers();
  }, [subscribers, searchTerm, filterStatus, filterPlan]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v2/admin/subscribers', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscribers(Array.isArray(data) ? data : data.subscribers || []);
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSubscribers = () => {
    let filtered = subscribers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(sub => 
        sub.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(sub => 
        (filterStatus === 'active' && sub.isActive) ||
        (filterStatus === 'inactive' && !sub.isActive) ||
        (filterStatus === 'suspended' && sub.isSuspended)
      );
    }

    // Plan filter
    if (filterPlan !== 'all') {
      filtered = filtered.filter(sub => sub.plan === filterPlan);
    }

    setFilteredSubscribers(filtered);
  };

  const handleAction = async (action, subscriber) => {
    setActionSubscriber(subscriber);
    setSelectedAction(action);

    if (action === 'download') {
      downloadCSV();
    } else if (action === 'suspend') {
      await updateSubscriber(subscriber.id, { isSuspended: true });
    } else if (action === 'activate') {
      await updateSubscriber(subscriber.id, { isSuspended: false });
    } else if (action === 'delete') {
      if (window.confirm(`Are you sure you want to delete ${subscriber.businessName}?`)) {
        await updateSubscriber(subscriber.id, { isDeleted: true });
      }
    }
  };

  const updateSubscriber = async (subscriberId, updates) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v2/admin/subscribers/${subscriberId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        setSubscribers(subscribers.map(sub => 
          sub.id === subscriberId ? { ...sub, ...updates } : sub
        ));
      }
    } catch (error) {
      console.error('Error updating subscriber:', error);
    }
    setSelectedAction(null);
  };

  const downloadCSV = () => {
    const headers = ['Business Name', 'Owner', 'Email', 'Plan', 'Status', 'Join Date'];
    const rows = filteredSubscribers.map(sub => [
      sub.businessName,
      sub.name,
      sub.email,
      sub.plan,
      sub.isSuspended ? 'Suspended' : sub.isActive ? 'Active' : 'Inactive',
      new Date(sub.createdAt).toLocaleDateString()
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${new Date().toISOString()}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Subscriber Management</h2>
        
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-700 text-white placeholder-gray-400 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Plans</option>
            <option value="starter">Starter</option>
            <option value="business">Business</option>
            <option value="custom">Custom</option>
          </select>

          <button
            onClick={() => handleAction('download')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <Download size={20} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left px-4 py-3 text-gray-300 font-semibold">Business Name</th>
              <th className="text-left px-4 py-3 text-gray-300 font-semibold">Owner</th>
              <th className="text-left px-4 py-3 text-gray-300 font-semibold">Plan</th>
              <th className="text-left px-4 py-3 text-gray-300 font-semibold">Status</th>
              <th className="text-left px-4 py-3 text-gray-300 font-semibold">Join Date</th>
              <th className="text-left px-4 py-3 text-gray-300 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubscribers.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-400">
                  No subscribers found
                </td>
              </tr>
            ) : (
              filteredSubscribers.map(subscriber => (
                <tr key={subscriber.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition">
                  <td className="px-4 py-3">{subscriber.businessName}</td>
                  <td className="px-4 py-3">{subscriber.name}</td>
                  <td className="px-4 py-3">
                     <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      subscriber.plan === 'starter' ? 'bg-blue-900 text-blue-200' :
                      subscriber.plan === 'business' ? 'bg-purple-900 text-purple-200' :
                      subscriber.plan === 'custom' ? 'bg-amber-900 text-amber-200' :
                      'bg-green-900 text-green-200'
                    }`}>
                      {subscriber.plan?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      subscriber.isSuspended ? 'bg-red-900 text-red-200' :
                      subscriber.isActive ? 'bg-green-900 text-green-200' :
                      'bg-gray-700 text-gray-200'
                    }`}>
                      {subscriber.isSuspended ? 'Suspended' : subscriber.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(subscriber.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {subscriber.isSuspended ? (
                        <button
                          onClick={() => handleAction('activate', subscriber)}
                          className="p-2 bg-green-600 hover:bg-green-700 rounded text-white transition"
                          title="Activate"
                        >
                          <Unlock size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction('suspend', subscriber)}
                          className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded text-white transition"
                          title="Suspend"
                        >
                          <Lock size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleAction('delete', subscriber)}
                        className="p-2 bg-red-600 hover:bg-red-700 rounded text-white transition"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 text-sm text-gray-400">
        Showing {filteredSubscribers.length} of {subscribers.length} subscribers
      </div>
    </div>
  );
}
