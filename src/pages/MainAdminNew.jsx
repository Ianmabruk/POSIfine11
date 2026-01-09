import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, DollarSign, TrendingUp, Lock, Unlock, Search, Filter, MoreVertical, AlertCircle, CheckCircle, Clock, Activity, ArrowUp, BarChart3, Settings } from 'lucide-react';
import { mainAdmin } from '../services/api';
import websocketService from '../services/websocketService';

export default function MainAdminNew() {
  const [currentPage, setCurrentPage] = useState('login'); // login, dashboard
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const navigate = useNavigate();

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('ownerToken');
    const user = localStorage.getItem('ownerUser');
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        if (userData.role === 'owner') {
          setCurrentPage('dashboard');
          loadDashboardData();
        }
      } catch (e) {
        localStorage.removeItem('ownerToken');
        localStorage.removeItem('ownerUser');
      }
    }
  }, []);

  // Listen for real-time updates via custom events
  useEffect(() => {
    const handleDataUpdate = () => {
      loadDashboardData();
    };

    // Listen for custom events from WebSocket or API updates
    window.addEventListener('dataUpdated', handleDataUpdate);
    window.addEventListener('userDeleted', handleDataUpdate);
    window.addEventListener('saleDeleted', handleDataUpdate);

    return () => {
      window.removeEventListener('dataUpdated', handleDataUpdate);
      window.removeEventListener('userDeleted', handleDataUpdate);
      window.removeEventListener('saleDeleted', handleDataUpdate);
    };
  }, []);

  // Auto-refresh dashboard data every 15 seconds to keep it fresh
  useEffect(() => {
    if (currentPage !== 'dashboard') return;
    
    const interval = setInterval(() => {
      loadDashboardData();
    }, 15000); // 15 seconds
    
    return () => clearInterval(interval);
  }, [currentPage]);

  const loadDashboardData = async () => {
    try {
      // Add cache-busting timestamp to force fresh data
      const timestamp = Date.now();
      const [usersData, statsData] = await Promise.all([
        mainAdmin.getUsers(),
        mainAdmin.getStats()
      ]);
      
      // Ensure data defaults to 0 if not present
      const cleanStats = {
        totalSales: statsData?.totalSales ?? 0,
        totalExpenses: statsData?.totalExpenses ?? 0,
        profit: statsData?.profit ?? 0,
        salesCount: statsData?.salesCount ?? 0,
        expensesCount: statsData?.expensesCount ?? 0,
        productsCount: statsData?.productsCount ?? 0,
        usersCount: statsData?.usersCount ?? 0,
        activeUsers: statsData?.activeUsers ?? 0,
        lockedUsers: statsData?.lockedUsers ?? 0
      };
      
      setUsers(usersData || []);
      setStats(cleanStats);
      console.log('Dashboard data loaded:', { users: usersData?.length, stats: cleanStats });
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load dashboard data');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.email || !formData.password) {
        throw new Error('Email and password required');
      }

      const response = await mainAdmin.login(formData);

      if (response.token && response.user && response.user.role === 'owner') {
        // Clear any old cached data
        sessionStorage.clear();
        
        localStorage.setItem('ownerToken', response.token);
        localStorage.setItem('ownerUser', JSON.stringify(response.user));
        setCurrentPage('dashboard');
        
        // Force fresh data load after login
        await new Promise(resolve => setTimeout(resolve, 100));
        await loadDashboardData();
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ownerToken');
    localStorage.removeItem('ownerUser');
    setFormData({ email: '', password: '' });
    setError('');
    setCurrentPage('login');
  };

  const handleLockUser = async (userId) => {
    try {
      setActionLoading(userId);
      const user = users.find(u => u.id === userId);
      if (!user) return;

      await mainAdmin.lockUser(userId, !user.locked);
      await loadDashboardData();
    } catch (error) {
      setError('Failed to lock/unlock user');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'active' && user.active && !user.locked) ||
      (filterStatus === 'locked' && user.locked) ||
      (filterStatus === 'inactive' && !user.active);

    return matchesSearch && matchesFilter;
  });

  if (currentPage === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">MTC Admin</h1>
            <p className="text-purple-300">System Owner Portal</p>
          </div>

          {/* Login Card */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8 shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  placeholder="ianmabruk3@gmail.com"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Access Dashboard'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-purple-500/20">
              <p className="text-gray-400 text-xs text-center">
                🔒 Owner access only • Limited to ianmabruk3@gmail.com
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-800/80 backdrop-blur-xl border-b border-purple-500/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-purple-400" />
              MTC Admin Dashboard
            </h1>
            <p className="text-sm text-gray-400 mt-1">System owner portal</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition border border-red-500/30"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-white mt-2">{users.length}</p>
              </div>
              <Users className="w-10 h-10 text-blue-400 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Users</p>
                <p className="text-3xl font-bold text-white mt-2">{users.filter(u => u.active && !u.locked).length}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-400 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Locked Users</p>
                <p className="text-3xl font-bold text-white mt-2">{users.filter(u => u.locked).length}</p>
              </div>
              <Lock className="w-10 h-10 text-orange-400 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-pink-600/5 border border-purple-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Sales</p>
                <p className="text-3xl font-bold text-white mt-2">KSH {((stats?.totalSales ?? 0) || 0).toLocaleString()}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-400 opacity-50" />
            </div>
          </div>
        </div>

        {/* Users Management Section */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/10 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              User Management
            </h2>
            <div className="flex items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-slate-700/50 border border-purple-500/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Users</option>
                <option value="active">Active</option>
                <option value="locked">Locked</option>
                <option value="inactive">Inactive</option>
              </select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="pl-10 pr-4 py-2 bg-slate-700/50 border border-purple-500/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-purple-500/10">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-400 font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-gray-400 font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-gray-400 font-semibold">Plan</th>
                  <th className="px-4 py-3 text-left text-gray-400 font-semibold">Role</th>
                  <th className="px-4 py-3 text-left text-gray-400 font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-gray-400 font-semibold">Days Used</th>
                  <th className="px-4 py-3 text-left text-gray-400 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-purple-500/5 hover:bg-slate-700/30 transition">
                    <td className="px-4 py-3 text-white font-medium">{user.name || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-300">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.planType === 'paid' ? 'bg-green-500/30 text-green-300' :
                        user.planType === 'trial' ? 'bg-yellow-500/30 text-yellow-300' :
                        'bg-gray-500/30 text-gray-300'
                      }`}>
                        {(user.plan || user.planType || 'free_demo').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === 'owner' ? 'bg-purple-500/30 text-purple-300' :
                        user.role === 'admin' ? 'bg-blue-500/30 text-blue-300' :
                        'bg-gray-500/30 text-gray-300'
                      }`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {user.locked ? (
                          <span className="flex items-center gap-1 text-orange-300 text-xs">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        ) : user.active ? (
                          <span className="flex items-center gap-1 text-green-300 text-xs">
                            <CheckCircle className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-400 text-xs">
                            <Activity className="w-3 h-3" /> Inactive
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {user.daysUsed || 0} days
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleLockUser(user.id)}
                        disabled={actionLoading === user.id || user.role === 'owner'}
                        className="p-2 hover:bg-purple-500/20 rounded-lg text-purple-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title={user.role === 'owner' ? 'Cannot lock owner' : user.locked ? 'Unlock user' : 'Lock user'}
                      >
                        {user.locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p>No users found</p>
              </div>
            )}
          </div>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/10 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">System Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Expenses</span>
                <span className="text-white font-semibold">KSH {(stats.totalExpenses || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Net Profit</span>
                <span className="text-green-400 font-semibold">KSH {(stats.profit || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Products Count</span>
                <span className="text-white font-semibold">{stats.productsCount || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/10 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition border border-purple-500/30 text-sm font-medium">
                📊 View Analytics
              </button>
              <button className="w-full px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition border border-blue-500/30 text-sm font-medium">
                📥 Export Data
              </button>
              <button className="w-full px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-lg transition border border-orange-500/30 text-sm font-medium">
                ⚙️ System Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
