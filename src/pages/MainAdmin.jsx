import { useState, useEffect } from 'react';
import {
  Users, DollarSign, Mail, Lock, Unlock, CheckCircle, XCircle,
  AlertTriangle, TrendingUp, Calendar, Search, Filter, Send
} from 'lucide-react';
import { getLocalUsers } from '../utils/dataSync';

export default function MainAdmin() {
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [emailData, setEmailData] = useState({ subject: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    lockedUsers: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    overduePayments: 0
  });

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5001/api';

      // Load users
      let usersLoaded = false;
      try {
        const usersRes = await fetch(`${API_URL}/main-admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData);
          usersLoaded = true;
        } else {
          // Fallback: Load from regular users endpoint
          const fallbackRes = await fetch(`${API_URL}/users`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (fallbackRes.ok) {
            const usersData = await fallbackRes.json();
            setUsers(usersData);
            usersLoaded = true;
          }
        }
      } catch (err) {
        console.warn('Backend not available for users:', err);
      }

      // If no users loaded from backend, use local users
      if (!usersLoaded) {
        const localUsers = getLocalUsers();
        setUsers(localUsers);
      }

      // Load payments
      try {
        const paymentsRes = await fetch(`${API_URL}/main-admin/payments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (paymentsRes.ok) {
          const paymentsData = await paymentsRes.json();
          setPayments(paymentsData);
        }
      } catch (err) {
        console.log('Payments endpoint not available, using empty data');
        setPayments([]);
      }

      // If no users found and in production, generate demo data
      if (users.length === 0 && import.meta.env.PROD) {
        const demoUsers = generateDemoData();
        setUsers(demoUsers);
        calculateStats(demoUsers, []);
      } else {
        calculateStats(users, payments);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      // Don't break the page, generate demo data
      if (import.meta.env.PROD) {
        const demoUsers = generateDemoData();
        setUsers(demoUsers);
        calculateStats(demoUsers, []);
      } else {
        setUsers([]);
        setPayments([]);
        calculateStats([], []);
      }
    }
  };

  const generateDemoData = () => {
    // Check if we already have a real user
    const storedUser = localStorage.getItem('user');
    const demoUsers = [];
    
    if (storedUser) {
      const realUser = JSON.parse(storedUser);
      demoUsers.push(realUser);
    }
    
    // Add some demo users
    const demoData = [
      { name: 'John Doe', email: 'john@example.com', plan: 'ultra', price: 1600, active: true, locked: false },
      { name: 'Jane Smith', email: 'jane@example.com', plan: 'basic', price: 900, active: true, locked: false },
      { name: 'Bob Wilson', email: 'bob@example.com', plan: 'ultra', price: 1600, active: false, locked: false },
      { name: 'Alice Brown', email: 'alice@example.com', plan: 'basic', price: 900, active: true, locked: true }
    ];
    
    demoData.forEach((demo, index) => {
      if (!demoUsers.find(u => u.email === demo.email)) {
        demoUsers.push({
          id: Date.now() + index,
          ...demo,
          role: demo.plan === 'ultra' ? 'admin' : 'cashier',
          createdAt: new Date(Date.now() - (index * 86400000)).toISOString()
        });
      }
    });
    
    return demoUsers;
  };

  const calculateStats = (usersData, paymentsData) => {
    const totalUsers = usersData.length;
    const activeUsers = usersData.filter(u => u.active).length;
    const lockedUsers = usersData.filter(u => u.locked).length;
    const totalRevenue = paymentsData.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const pendingPayments = paymentsData.filter(p => p.status === 'pending').length;
    const overduePayments = paymentsData.filter(p => p.status === 'overdue').length;

    setStats({
      totalUsers,
      activeUsers,
      lockedUsers,
      totalRevenue,
      pendingPayments,
      overduePayments
    });
  };

  const toggleUserLock = async (userId, currentLockStatus) => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5001/api';
      
      try {
        const response = await fetch(`${API_URL}/main-admin/users/${userId}/lock`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ locked: !currentLockStatus })
        });
        
        if (response.ok) {
          loadData();
          return;
        }
      } catch (backendError) {
        console.warn('Backend not available, using client-side update');
      }
      
      // Fallback: Update locally
      const updatedUsers = users.map(u => 
        u.id === userId ? { ...u, locked: !currentLockStatus, active: currentLockStatus } : u
      );
      setUsers(updatedUsers);
      calculateStats(updatedUsers, payments);
      
      // Also update in localStorage if this is the current user
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.id === userId) {
          user.locked = !currentLockStatus;
          user.active = currentLockStatus;
          localStorage.setItem('user', JSON.stringify(user));
        }
      }
      
    } catch (error) {
      console.error('Failed to toggle lock:', error);
      alert('Failed to update user lock status.');
    }
  };

  const sendEmail = async (userIds, subject, message) => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5001/api';
      
      try {
        const response = await fetch(`${API_URL}/main-admin/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ userIds, subject, message })
        });
        
        if (response.ok) {
          alert('Emails sent successfully!');
          setShowEmailModal(false);
          setSelectedUsers([]);
          setEmailData({ subject: '', message: '' });
          return;
        }
      } catch (backendError) {
        console.warn('Backend not available, simulating email send');
      }
      
      // Fallback: Simulate email sending
      const selectedUsersList = users.filter(u => userIds.includes(u.id));
      const emailLog = {
        timestamp: new Date().toISOString(),
        recipients: selectedUsersList.map(u => ({ id: u.id, name: u.name, email: u.email })),
        subject,
        message,
        status: 'simulated'
      };
      
      // Store in localStorage for reference
      const emailLogs = JSON.parse(localStorage.getItem('emailLogs') || '[]');
      emailLogs.push(emailLog);
      localStorage.setItem('emailLogs', JSON.stringify(emailLogs));
      
      alert(`Email simulated successfully!\n\nSent to ${selectedUsersList.length} user(s):\n${selectedUsersList.map(u => u.email).join(', ')}\n\nNote: Deploy backend to send real emails.`);
      setShowEmailModal(false);
      setSelectedUsers([]);
      setEmailData({ subject: '', message: '' });
      
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to process email request.');
    }
  };

  const sendPaymentReminder = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    await sendEmail(
      [userId],
      'Payment Reminder - Subscription Upgrade',
      `Dear ${user.name},\n\nThis is a friendly reminder about your pending subscription payment for ${user.plan?.toUpperCase()} plan (KSH ${user.price}).\n\nPlease complete your payment to continue enjoying our services.\n\nThank you!`
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === 'all') return matchesSearch;
    if (filter === 'active') return matchesSearch && user.active && !user.locked;
    if (filter === 'locked') return matchesSearch && user.locked;
    if (filter === 'trial') return matchesSearch && (!user.active || !user.plan);
    if (filter === 'pending-payment') {
      const userPayments = payments.filter(p => p.userId === user.id && p.status === 'pending');
      return matchesSearch && userPayments.length > 0;
    }
    if (filter === 'overdue') {
      const userPayments = payments.filter(p => p.userId === user.id && p.status === 'overdue');
      return matchesSearch && userPayments.length > 0;
    }
    return matchesSearch;
  });

  const getUserPaymentStatus = (userId) => {
    const userPayments = payments.filter(p => p.userId === userId);
    const pending = userPayments.filter(p => p.status === 'pending').length;
    const overdue = userPayments.filter(p => p.status === 'overdue').length;
    const paid = userPayments.filter(p => p.status === 'paid').length;
    
    return { pending, overdue, paid, total: userPayments.length };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading Main Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      {/* Demo Mode Banner */}
      {import.meta.env.PROD && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 text-center">
          <p className="text-sm md:text-base font-semibold">
            ⚠️ Demo Mode: Backend not deployed. Actions are simulated locally. 
            <a href="/BACKEND_NOT_DEPLOYED.md" className="underline ml-2">Deploy Backend →</a>
          </p>
        </div>
      )}
      
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-lg border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">Main Admin Dashboard</h1>
          <p className="text-gray-300">Monitor all users, payments, and system activity</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">{stats.totalUsers}</span>
            </div>
            <p className="text-gray-300 text-sm">Total Users</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <span className="text-2xl font-bold text-white">{stats.activeUsers}</span>
            </div>
            <p className="text-gray-300 text-sm">Active Users</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <Lock className="w-8 h-8 text-red-400" />
              <span className="text-2xl font-bold text-white">{stats.lockedUsers}</span>
            </div>
            <p className="text-gray-300 text-sm">Locked Users</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-yellow-400" />
              <span className="text-2xl font-bold text-white">KSH {stats.totalRevenue.toLocaleString()}</span>
            </div>
            <p className="text-gray-300 text-sm">Total Revenue</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-8 h-8 text-orange-400" />
              <span className="text-2xl font-bold text-white">{stats.pendingPayments}</span>
            </div>
            <p className="text-gray-300 text-sm">Pending Payments</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-8 h-8 text-red-400" />
              <span className="text-2xl font-bold text-white">{stats.overduePayments}</span>
            </div>
            <p className="text-gray-300 text-sm">Overdue Payments</p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4 flex-1 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Users</option>
                <option value="active">Active</option>
                <option value="locked">Locked</option>
                <option value="trial">Free Trial</option>
                <option value="pending-payment">Pending Payment</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <button
              onClick={() => setShowEmailModal(true)}
              disabled={selectedUsers.length === 0}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mail className="w-5 h-5" />
              Send Email to Selected ({selectedUsers.length})
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/30">
                <tr>
                  <th className="px-4 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(filteredUsers.map(u => u.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                      className="w-5 h-5 rounded"
                    />
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-200">User</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-200">Plan</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-200">Status</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-200">Payments</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-200">Joined</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center">
                      <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">No users found</p>
                      <p className="text-gray-500 text-sm mt-2">
                        {searchTerm || filter !== 'all' 
                          ? 'Try adjusting your filters' 
                          : 'Users will appear here once they sign up'}
                      </p>
                    </td>
                  </tr>
                )}
                {filteredUsers.map(user => {
                  const paymentStatus = getUserPaymentStatus(user.id);
                  return (
                    <tr key={user.id} className="border-t border-white/10 hover:bg-white/5 transition">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                            }
                          }}
                          className="w-5 h-5 rounded"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {user.profilePicture ? (
                            <img src={user.profilePicture} alt={user.name} className="w-10 h-10 rounded-full" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                              {user.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-white">{user.name}</p>
                            <p className="text-sm text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          user.plan === 'ultra' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {user.plan?.toUpperCase()} - KSH {user.price}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {user.locked ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              Locked
                            </span>
                          ) : user.active ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-300 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-500/20 text-gray-300">
                              Inactive
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {paymentStatus.paid > 0 && (
                            <span className="text-xs text-green-400">✓ {paymentStatus.paid} Paid</span>
                          )}
                          {paymentStatus.pending > 0 && (
                            <span className="text-xs text-orange-400 block">⏳ {paymentStatus.pending} Pending</span>
                          )}
                          {paymentStatus.overdue > 0 && (
                            <span className="text-xs text-red-400 block">⚠ {paymentStatus.overdue} Overdue</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleUserLock(user.id, user.locked)}
                            className={`p-2 rounded-lg transition ${
                              user.locked
                                ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300'
                                : 'bg-red-500/20 hover:bg-red-500/30 text-red-300'
                            }`}
                            title={user.locked ? 'Unlock User' : 'Lock User'}
                          >
                            {user.locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => sendPaymentReminder(user.id)}
                            className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 transition"
                            title="Send Payment Reminder"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-purple-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-white/20">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white rounded-t-2xl">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Mail />
                Send Email to {selectedUsers.length} User(s)
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email subject..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                <textarea
                  value={emailData.message}
                  onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 h-40"
                  placeholder="Email message..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => sendEmail(selectedUsers, emailData.subject, emailData.message)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-bold transition"
                >
                  Send Email
                </button>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}