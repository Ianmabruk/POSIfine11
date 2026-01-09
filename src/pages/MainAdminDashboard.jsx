import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, DollarSign, Lock, Unlock, Shield, Trash2, RefreshCw,
  Calendar, Activity, AlertTriangle, CheckCircle, XCircle, 
  LogOut, Database, Settings, Crown, Clock, TrendingUp,
  UserCheck, UserX, Edit3, Eye, Download, Mail, Filter,
  Zap, BarChart3, TrendingDown, Send
} from 'lucide-react';
import { mainAdmin, BASE_API_URL } from '../services/api';

export default function MainAdminDashboard() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filterPlan, setFilterPlan] = useState('all');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Verify owner access
    const token = localStorage.getItem('ownerToken');
    const user = localStorage.getItem('ownerUser');
    
    if (!token || !user) {
      navigate('/main.admin', { replace: true });
      return;
    }

    try {
      const userData = JSON.parse(user);
      if ((userData.role !== 'owner' && !userData.isMainAdmin) || userData.email !== 'ianmabruk3@gmail.com') {
        navigate('/main.admin', { replace: true });
        return;
      }
    } catch (e) {
      navigate('/main.admin', { replace: true });
      return;
    }

    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, statsData] = await Promise.all([
        mainAdmin.getUsers(),
        mainAdmin.getStats()
      ]);
      
      setUsers(usersData || []);
      setStats(statsData || {});
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserLock = async (userId, currentLockStatus) => {
    try {
      setActionLoading(`lock-${userId}`);
      await mainAdmin.lockUser(userId, !currentLockStatus);
      await loadData();
    } catch (error) {
      alert('Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  };

  const calculatePlanStats = () => {
    const stats = {
      freeDemo: users.filter(u => u.planType === 'free_demo' || !u.planType).length,
      trial: users.filter(u => u.planType === 'trial' || u.requestedTrial).length,
      paid: users.filter(u => u.planType === 'paid').length
    };
    return stats;
  };

  const getFilteredUsers = () => {
    if (filterPlan === 'all') return users;
    if (filterPlan === 'free_demo') return users.filter(u => u.planType === 'free_demo' || !u.planType);
    if (filterPlan === 'trial') return users.filter(u => u.planType === 'trial' || u.requestedTrial);
    if (filterPlan === 'paid') return users.filter(u => u.planType === 'paid');
    return users;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ownerToken');
    localStorage.removeItem('ownerUser');
    navigate('/main.admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading system data...</p>
        </div>
      </div>
    );
  }

  const planStats = calculatePlanStats();
  const filteredUsers = getFilteredUsers();
  const activeCount = users.filter(u => u.active && !u.locked).length;
  const lockedCount = users.filter(u => u.locked).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black text-white">
      {/* Header */}
      <div className="border-b border-red-500/30 bg-black/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl flex items-center justify-center border-2 border-red-400">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-red-400">🎯 MTC System Owner</h1>
                <p className="text-gray-400 text-sm">Comprehensive Analytics & Control Dashboard</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 border border-blue-500/30">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-200" />
              <span className="text-3xl font-bold">{users.length}</span>
            </div>
            <p className="text-blue-100 text-sm font-medium">Total Users</p>
            <p className="text-blue-300 text-xs mt-2">All registered</p>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-6 border border-green-500/30">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-200" />
              <span className="text-3xl font-bold">{activeCount}</span>
            </div>
            <p className="text-green-100 text-sm font-medium">Active Users</p>
            <p className="text-green-300 text-xs mt-2">Currently active</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-xl p-6 border border-yellow-500/30">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-yellow-200" />
              <span className="text-3xl font-bold">{planStats.trial}</span>
            </div>
            <p className="text-yellow-100 text-sm font-medium">Trial/Demo</p>
            <p className="text-yellow-300 text-xs mt-2">Free & trial users</p>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6 border border-purple-500/30">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-purple-200" />
              <span className="text-3xl font-bold">{planStats.paid}</span>
            </div>
            <p className="text-purple-100 text-sm font-medium">Paid Users</p>
            <p className="text-purple-300 text-xs mt-2">Active subscriptions</p>
          </div>

          <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-xl p-6 border border-red-500/30">
            <div className="flex items-center justify-between mb-2">
              <Lock className="w-8 h-8 text-red-200" />
              <span className="text-3xl font-bold">{lockedCount}</span>
            </div>
            <p className="text-red-100 text-sm font-medium">Locked Users</p>
            <p className="text-red-300 text-xs mt-2">Access restricted</p>
          </div>
        </div>

        {/* Plan Distribution Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-black/50 border border-red-500/30 rounded-xl p-6 backdrop-blur-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-red-400">🆓 Free Demo Users</h3>
              <Zap className="w-6 h-6 text-red-400" />
            </div>
            <p className="text-4xl font-bold text-white mb-2">{planStats.freeDemo}</p>
            <p className="text-gray-400 text-sm">Users on free demo</p>
            <div className="mt-4 w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all" 
                style={{ width: `${users.length > 0 ? (planStats.freeDemo / users.length) * 100 : 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{users.length > 0 ? Math.round((planStats.freeDemo / users.length) * 100) : 0}% of users</p>
          </div>

          <div className="bg-black/50 border border-yellow-500/30 rounded-xl p-6 backdrop-blur-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-yellow-400">⏱️ Trial Users</h3>
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <p className="text-4xl font-bold text-white mb-2">{planStats.trial}</p>
            <p className="text-gray-400 text-sm">Requested/active trials</p>
            <div className="mt-4 w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all" 
                style={{ width: `${users.length > 0 ? (planStats.trial / users.length) * 100 : 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{users.length > 0 ? Math.round((planStats.trial / users.length) * 100) : 0}% of users</p>
          </div>

          <div className="bg-black/50 border border-green-500/30 rounded-xl p-6 backdrop-blur-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-green-400">💰 Paid Users</h3>
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-4xl font-bold text-white mb-2">{planStats.paid}</p>
            <p className="text-gray-400 text-sm">Paid subscription users</p>
            <div className="mt-4 w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all" 
                style={{ width: `${users.length > 0 ? (planStats.paid / users.length) * 100 : 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{users.length > 0 ? Math.round((planStats.paid / users.length) * 100) : 0}% of users</p>
          </div>
        </div>

        {/* Users Analytics Table */}
        <div className="bg-black/50 border border-red-500/30 rounded-xl p-6 backdrop-blur-lg mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">📊 User Analytics & Management</h2>
            <div className="flex items-center gap-2">
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
              >
                <option value="all">All Users ({users.length})</option>
                <option value="free_demo">Free Demo ({planStats.freeDemo})</option>
                <option value="trial">Trial Users ({planStats.trial})</option>
                <option value="paid">Paid Users ({planStats.paid})</option>
              </select>
              <button
                onClick={loadData}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                title="Refresh data"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800/50 border-b border-gray-700">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">User Info</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Plan Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Service Start</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Days Used</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Trial Request</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const planType = user.planType || 'free_demo';
                    const daysUsed = user.daysUsed || 0;
                    
                    return (
                      <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3 text-sm">
                          <div>
                            <div className="flex items-center gap-2">
                              {user.email === 'ianmabruk3@gmail.com' && (
                                <Crown className="w-4 h-4 text-yellow-500" title="Main Admin" />
                              )}
                              <span className="font-medium text-white">{user.name}</span>
                            </div>
                            <p className="text-gray-400 text-xs">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            planType === 'paid' ? 'bg-green-900 text-green-200' :
                            planType === 'trial' ? 'bg-yellow-900 text-yellow-200' :
                            'bg-gray-700 text-gray-200'
                          }`}>
                            {planType === 'free_demo' ? '🆓 Free Demo' : 
                             planType === 'trial' ? '⏱️ Trial' : '💰 Paid'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {formatDate(user.serviceStartDate)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="font-bold text-blue-400">{daysUsed} days</span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {user.requestedTrial ? (
                            <span className="px-2 py-1 bg-yellow-900/30 text-yellow-300 text-xs rounded flex items-center gap-1 w-fit">
                              <AlertTriangle className="w-3 h-3" /> Requested
                            </span>
                          ) : (
                            <span className="text-gray-500 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {user.active && !user.locked ? (
                            <span className="flex items-center gap-1 text-green-400 font-medium text-xs">
                              <CheckCircle className="w-4 h-4" /> Active
                            </span>
                          ) : user.locked ? (
                            <span className="flex items-center gap-1 text-red-400 font-medium text-xs">
                              <Lock className="w-4 h-4" /> Locked
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-gray-400 font-medium text-xs">
                              <XCircle className="w-4 h-4" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => toggleUserLock(user.id, user.locked)}
                            disabled={actionLoading === `lock-${user.id}` || user.email === 'ianmabruk3@gmail.com'}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              user.locked
                                ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white'
                                : 'bg-red-600 hover:bg-red-700 disabled:bg-gray-500 text-white'
                            }`}
                          >
                            {actionLoading === `lock-${user.id}` ? 'Processing...' : (user.locked ? 'Unlock' : 'Lock')}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-400">
                      No users found in this category
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-700 text-sm text-gray-400 flex justify-between">
            <p>Showing {filteredUsers.length} of {users.length} users</p>
            <p>Last updated: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>

        {/* System Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-black/50 border border-blue-500/30 rounded-xl p-6 backdrop-blur-lg">
            <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" /> System Overview
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-gray-700">
                <span className="text-gray-400">Total Sales</span>
                <span className="font-bold text-white">KSH {(stats.totalSales || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-700">
                <span className="text-gray-400">Total Expenses</span>
                <span className="font-bold text-white">KSH {(stats.totalExpenses || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-700">
                <span className="text-gray-400">Profit</span>
                <span className="font-bold text-green-400">KSH {(stats.profit || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Products</span>
                <span className="font-bold text-white">{stats.productsCount || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-black/50 border border-purple-500/30 rounded-xl p-6 backdrop-blur-lg">
            <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" /> Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-gray-700">
                <span className="text-gray-400">Sales Records</span>
                <span className="font-bold text-white">{stats.salesCount || 0}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-700">
                <span className="text-gray-400">Expense Records</span>
                <span className="font-bold text-white">{stats.expensesCount || 0}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-700">
                <span className="text-gray-400">Active Accounts</span>
                <span className="font-bold text-green-400">{activeCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Locked Accounts</span>
                <span className="font-bold text-red-400">{lockedCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legend & Information */}
        <div className="mt-8 bg-black/50 border border-gray-700 rounded-xl p-6 backdrop-blur-lg">
          <h4 className="text-lg font-semibold text-gray-300 mb-4">📋 User Plan Types & Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
              <Zap className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-300">🆓 Free Demo</p>
                <p className="text-gray-500 text-sm">New users getting initial access to test the system</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
              <Clock className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-300">⏱️ Trial Users</p>
                <p className="text-gray-500 text-sm">Users who requested trial period or using extended trial</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
              <DollarSign className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-300">💰 Paid Users</p>
                <p className="text-gray-500 text-sm">Users with active paid subscriptions</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300 text-sm"><span className="font-semibold">📊 Days Used:</span> Calculated from service start date to today</p>
          </div>
        </div>
      </div>
    </div>
  );
}
