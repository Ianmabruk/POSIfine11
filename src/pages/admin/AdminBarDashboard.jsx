import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, Plus, Wine, DollarSign, Package, MessageSquare } from 'lucide-react';
import api, { BASE_API_URL } from '../../services/api';
import ProAIAssistant from '../../components/ProAIAssistant';

export default function AdminBarDashboard() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [messages, setMessages] = useState([]);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // Available bar roles
  const barRoles = [
    { value: 'bartender', label: 'Bartender', icon: Wine },
    { value: 'cashier', label: 'Cashier', icon: DollarSign },
    { value: 'store', label: 'Store Manager', icon: Package }
  ];

  useEffect(() => {
    loadStaff();
    loadMessages();
  }, []);

  const loadStaff = async () => {
    try {
      const response = await api.get('/business/users');
      setStaff(response.users || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load staff:', error);
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await api.get('/messages/inbox?limit=5');
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleAddStaff = async (formData) => {
    try {
      // Convert camelCase to snake_case for backend
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        business_role: formData.businessRole
      };
      await api.post('/business/users', payload);
      setShowAddStaff(false);
      loadStaff();
    } catch (error) {
      console.error('Failed to add staff:', error);
      alert('Failed to add staff member: ' + (error.response?.data?.error || error.message));
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredStaff = staff.filter((member) => {
    if (!normalizedSearch) return true;
    return (
      (member.name || '').toLowerCase().includes(normalizedSearch) ||
      (member.email || '').toLowerCase().includes(normalizedSearch) ||
      (member.business_role || member.role || '').toLowerCase().includes(normalizedSearch)
    );
  });

  const filteredMessages = messages.filter((msg) => {
    if (!normalizedSearch) return true;
    return (
      (msg.fromUserName || '').toLowerCase().includes(normalizedSearch) ||
      (msg.content || '').toLowerCase().includes(normalizedSearch)
    );
  });

  const askAiFromSearch = async () => {
    if (!searchTerm.trim()) return;
    try {
      setAiLoading(true);
      setAiError('');
      setAiAnswer('');
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_API_URL}/ai/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          question: searchTerm.trim(),
          context: {
            businessType: user?.business_type || 'bar',
            staffCount: staff.length,
            recentMessages: filteredMessages.slice(0, 5)
          }
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || 'AI request failed');
      }

      const answer = payload?.data?.answer || payload?.answer;
      if (!answer) throw new Error('No AI response received');
      setAiAnswer(answer);
    } catch (err) {
      setAiError(err.message || 'AI request failed');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white flex items-center">
                <span className="text-5xl mr-3">🍻</span>
                Bar Admin Dashboard
              </h1>
              <p className="text-purple-100 mt-2 text-lg">Manage your bar staff and operations</p>
            </div>
            <button
              onClick={() => setShowAddStaff(true)}
              className="flex items-center px-6 py-3 bg-white text-purple-600 rounded-xl hover:bg-purple-50 shadow-lg transform transition hover:scale-105 font-semibold"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Staff
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search staff, messages, roles..."
            className="w-full md:w-1/2 px-4 py-3 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
          />
          <div className="mt-2 flex justify-end md:w-1/2">
            <button
              onClick={askAiFromSearch}
              disabled={aiLoading || !searchTerm.trim()}
              className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {aiLoading ? 'Asking AI...' : 'Search with AI'}
            </button>
          </div>
        </div>
        {(aiAnswer || aiError) && (
          <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${aiError ? 'border-red-200 bg-red-50 text-red-700' : 'border-purple-200 bg-purple-50 text-purple-900'}`}>
            {aiError ? aiError : aiAnswer}
          </div>
        )}
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {barRoles.map((role, idx) => {
            const Icon = role.icon;
            const count = staff.filter(s => s.business_role === role.value).length;
            const gradients = [
              'from-purple-500 to-purple-600',
              'from-pink-500 to-pink-600',
              'from-indigo-500 to-indigo-600'
            ];
            return (
              <div key={role.value} className={`bg-gradient-to-br ${gradients[idx]} rounded-xl shadow-lg p-6 text-white transform transition hover:scale-105`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-100 font-medium">{role.label}</p>
                    <p className="text-3xl font-bold mt-2">{count}</p>
                  </div>
                  <Icon className="w-12 h-12 opacity-80" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Messages */}
        {filteredMessages.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg mb-8 p-6 border border-purple-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <MessageSquare className="w-7 h-7 mr-3 text-purple-600" />
                Recent Messages
              </h2>
              <a href="/messages" className="text-purple-600 hover:text-purple-700 font-semibold">View all →</a>
            </div>
            <div className="space-y-3">
              {filteredMessages.map((msg) => (
                <div key={msg.id} className="flex items-start p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{msg.fromUserName}</span>
                      <span className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{msg.content}</p>
                    <span className="text-xs text-purple-600 mt-1 inline-block">From: {msg.fromRole}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Staff List */}
        <div className="bg-white rounded-xl shadow-lg border border-purple-100">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <h2 className="text-2xl font-bold text-gray-900">Bar Staff</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <p className="text-center text-gray-600">Loading staff...</p>
            ) : filteredStaff.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No staff members yet</p>
                <button
                  onClick={() => setShowAddStaff(true)}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Add your first staff member
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStaff.map((member) => (
                      <tr key={member.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{member.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{member.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            {member.business_role || member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {member.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <button className="text-purple-600 hover:text-purple-700 mr-3">Edit</button>
                          <button className="text-red-600 hover:text-red-700">Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Pro AI Assistant - Business Insights */}
        <div className="mt-8">
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 mb-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">🤖 AI Business Assistant</h2>
                <p className="text-gray-600 mt-1">Get intelligent insights and recommendations for your bar</p>
              </div>
              <span className="px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-bold shadow-lg">
                AI POWERED
              </span>
            </div>
          </div>
          <ProAIAssistant
            adminMode
            role={user?.role}
            businessType={user?.business_type || 'bar'}
          />
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddStaff && (
        <AddStaffModal
          roles={barRoles}
          onClose={() => setShowAddStaff(false)}
          onSubmit={handleAddStaff}
        />
      )}
    </div>
  );
}

// Add Staff Modal Component
function AddStaffModal({ roles, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    businessRole: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.businessRole) {
      alert('Please fill all fields');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-pink-600">
          <h3 className="text-2xl font-bold text-white">Add New Staff Member</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              placeholder="John Doe"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              placeholder="john@bar.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={formData.businessRole}
              onChange={(e) => setFormData({ ...formData, businessRole: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              required
            >
              <option value="">Select role...</option>
              {roles.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition font-semibold shadow-lg"
            >
              Add Staff
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
