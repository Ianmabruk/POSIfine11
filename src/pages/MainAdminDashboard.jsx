import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, DollarSign, Lock, Unlock, Shield, Trash2, RefreshCw,
  Calendar, Activity, AlertTriangle, CheckCircle, XCircle, 
  LogOut, Database, Settings, Crown, Clock, TrendingUp,
  UserCheck, UserX, Edit3, Eye
} from 'lucide-react';
import { mainAdmin } from '../services/api';

export default function MainAdminDashboard() {
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Verify owner access
    const token = localStorage.getItem('ownerToken');
    const user = localStorage.getItem('ownerUser');
    
    if (!token || !user) {
      navigate('/main.admin');
      return;
    }

    try {
      const userData = JSON.parse(user);
      if ((userData.type !== 'main_admin' && userData.type !== 'owner') || userData.email !== 'ianmabruk3@gmail.com') {
        navigate('/main.admin');
        return;
      }
    } catch (e) {
      navigate('/main.admin');
      return;
    }

    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, statsData, activitiesData] = await Promise.all([
        mainAdmin.getUsers(),
        mainAdmin.getStats(),
        mainAdmin.getActivities()
      ]);
      
      setUsers(usersData);
      setStats(statsData);
      setActivities(activitiesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserLock = async (userId, currentLockStatus) => {
    try {
      setActionLoading(`lock-${userId}`);
      const newLockStatus = !currentLockStatus;
      
      await mainAdmin.lockUser(userId, newLockStatus);
      
      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, locked: newLockStatus, active: !newLockStatus } : u
      ));
      
      // Reload data to get updated stats
      setTimeout(loadData, 1000);
      
    } catch (error) {
      console.error('Failed to toggle lock:', error);
      alert('Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  };

  const changePlan = async (userId, newPlan) => {
    try {
      setActionLoading(`plan-${userId}`);
      
      await mainAdmin.changePlan(userId, newPlan);
      
      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, plan: newPlan, price: newPlan === 'ultra' ? 2400 : newPlan === 'basic' ? 1000 : 0 } : u
      ));
      
      setShowPlanModal(false);
      setSelectedUser(null);
      
      // Reload data to get updated stats
      setTimeout(loadData, 1000);
      
    } catch (error) {
      console.error('Failed to change plan:', error);
      alert('Failed to change user plan');
    } finally {
      setActionLoading(null);
    }
  };

  const clearSystemData = async (type) => {
    const confirmMessage = type === 'all' 
      ? 'Are you sure you want to clear ALL system data? This will remove all sales, expenses, and products from ALL users. This cannot be undone.'
      : `Are you sure you want to clear ${type} data from ALL users? This cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setActionLoading(`clear-${type}`);
      await mainAdmin.clearData(type);
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} data cleared successfully`);
      loadData();
    } catch (error) {
      console.error('Clear data failed:', error);
      alert('Failed to clear data');
    } finally {
      setActionLoading(null);
    }
  };

  const logout = () => {
    localStorage.removeItem('ownerToken');
    localStorage.removeItem('ownerUser');
    navigate('/main.admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-400 mx-auto mb-4"></div>
          <p className="text-red-400 text-xl">Loading System Control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-lg border-b border-red-500/30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Shield className="w-8 h-8 text-red-400" />
            <div>
              <h1 className="text-3xl font-bold text-red-400">MAIN.ADMIN</h1>
              <p className="text-gray-400">Ian Mabruk - System Owner</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 px-4 py-2 rounded-lg transition-colors border border-red-500/30"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-black/30 backdrop-blur-lg rounded-xl p-6 border border-red-500/30">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">{stats.totalUsers || 0}</span>
            </div>
            <p className="text-gray-300 text-sm">Total Users</p>
          </div>

          <div className="bg-black/30 backdrop-blur-lg rounded-xl p-6 border border-red-500/30">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <span className="text-2xl font-bold text-white">{stats.activeUsers || 0}</span>
            </div>
            <p className="text-gray-300 text-sm">Active Users</p>
          </div>

          <div className="bg-black/30 backdrop-blur-lg rounded-xl p-6 border border-red-500/30">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-yellow-400" />
              <span className="text-2xl font-bold text-white">{stats.trialUsers || 0}</span>
            </div>
            <p className="text-gray-300 text-sm">Free Trials</p>
          </div>

          <div className="bg-black/30 backdrop-blur-lg rounded-xl p-6 border border-red-500/30">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-400" />
              <span className="text-2xl font-bold text-white">KSH {(stats.mrr || 0).toLocaleString()}</span>
            </div>
            <p className="text-gray-300 text-sm">Monthly Revenue</p>
          </div>

          <div className="bg-black/30 backdrop-blur-lg rounded-xl p-6 border border-red-500/30">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">{(stats.totalSignups || 0) + (stats.totalLogins || 0)}</span>
            </div>
            <p className="text-gray-300 text-sm">Total Activities</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-6 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'users', label: `Users (${users.length})`, icon: Users },
            { id: 'activities', label: `Activities (${activities.length})`, icon: Activity },
            { id: 'system', label: 'System Control', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-red-600 text-white'
                    : 'bg-black/30 text-gray-300 hover:bg-black/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Plan Distribution */}
            <div className="bg-black/30 backdrop-blur-lg rounded-xl p-6 border border-red-500/30">
              <h2 className="text-xl font-bold text-white mb-4">Plan Distribution</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-300 font-semibold">Free Trial</p>
                      <p className="text-2xl font-bold text-white">{stats.planDistribution?.trial || 0}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-yellow-400" />
                  </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-300 font-semibold">Basic Plan</p>
                      <p className="text-2xl font-bold text-white">{stats.planDistribution?.basic || 0}</p>
                    </div>
                    <UserCheck className="w-8 h-8 text-blue-400" />
                  </div>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-300 font-semibold">Ultra Plan</p>
                      <p className="text-2xl font-bold text-white">{stats.planDistribution?.ultra || 0}</p>
                    </div>
                    <Crown className="w-8 h-8 text-purple-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity Summary */}
            <div className="bg-black/30 backdrop-blur-lg rounded-xl p-6 border border-red-500/30">
              <h2 className="text-xl font-bold text-white mb-4">Recent Activity Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">User Activity</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Signups:</span>
                      <span className="text-green-400">{stats.totalSignups || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Logins:</span>
                      <span className="text-blue-400">{stats.totalLogins || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Recent Signups (7d):</span>
                      <span className="text-yellow-400">{stats.recentSignups || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">System Health</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Active Users:</span>
                      <span className="text-green-400">{stats.activeUsers || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Locked Users:</span>
                      <span className="text-red-400">{stats.lockedUsers || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Revenue:</span>
                      <span className="text-green-400">KSH {(stats.totalRevenue || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Management Tab */}
        {activeTab === 'users' && (
          <div className="bg-black/30 backdrop-blur-lg rounded-xl border border-red-500/30 overflow-hidden">
            <div className="p-4 border-b border-red-500/30">
              <h2 className="text-xl font-bold text-white">User Management</h2>
              <p className="text-gray-400 text-sm">Manage all system users, plans, and access control</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black/50">
                  <tr>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-200">User Details</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-200">Plan & Status</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-200">Trial Info</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-200">Account Status</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    const isFreeTrial = user.isFreeTrial;
                    const createdDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown';
                    
                    return (
                      <tr key={user.id} className="border-t border-red-500/20 hover:bg-black/20 transition">
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-semibold text-white">{user.name}</p>
                            <p className="text-sm text-gray-400">{user.email}</p>
                            <p className="text-xs text-gray-500">ID: {user.id} | Role: {user.role}</p>
                            <p className="text-xs text-gray-500">Created: {createdDate}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            {isFreeTrial ? (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300 flex items-center gap-1 w-fit">
                                <Calendar className="w-3 h-3" />
                                FREE TRIAL
                              </span>
                            ) : (
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                user.plan === 'ultra' 
                                  ? 'bg-purple-500/20 text-purple-300' 
                                  : 'bg-blue-500/20 text-blue-300'
                              }`}>
                                {user.plan?.toUpperCase()}
                              </span>
                            )}
                            {user.price && (
                              <p className="text-xs text-gray-400">KSH {user.price}/month</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {isFreeTrial ? (
                            <div className="space-y-1">
                              <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-300">
                                {user.trialDaysLeft || 0} days left
                              </span>
                              {user.trialDaysLeft <= 7 && (
                                <p className="text-xs text-red-400">⚠️ Expiring soon</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">Paid Plan</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            {user.locked ? (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 flex items-center gap-1 w-fit">
                                <Lock className="w-3 h-3" />
                                Locked
                              </span>
                            ) : user.active ? (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-300 flex items-center gap-1 w-fit">
                                <CheckCircle className="w-3 h-3" />
                                Active
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-500/20 text-gray-300 w-fit">
                                Inactive
                              </span>
                            )}
                            {user.pin && (
                              <p className="text-xs text-blue-400">PIN Set</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleUserLock(user.id, user.locked)}
                              disabled={actionLoading === `lock-${user.id}`}
                              className={`p-2 rounded-lg transition ${
                                user.locked
                                  ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300'
                                  : 'bg-red-500/20 hover:bg-red-500/30 text-red-300'
                              } ${actionLoading === `lock-${user.id}` ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={user.locked ? 'Unlock User' : 'Lock User'}
                            >
                              {actionLoading === `lock-${user.id}` ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : user.locked ? (
                                <Unlock className="w-4 h-4" />
                              ) : (
                                <Lock className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowPlanModal(true);
                              }}
                              disabled={actionLoading === `plan-${user.id}`}
                              className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 transition"
                              title="Change Plan"
                            >
                              {actionLoading === `plan-${user.id}` ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Edit3 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No users registered yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activities Tab */}
        {activeTab === 'activities' && (
          <div className="bg-black/30 backdrop-blur-lg rounded-xl border border-red-500/30 overflow-hidden">
            <div className="p-4 border-b border-red-500/30">
              <h2 className="text-xl font-bold text-white">System Activity Log</h2>
              <p className="text-gray-400 text-sm">All user activities and admin actions</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black/50">
                  <tr>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-200">Activity Type</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-200">User Details</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-200">Plan/Action</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-200">Time</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-200">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.slice(0, 100).map(activity => {
                    const activityTime = activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Unknown';
                    const isSignup = activity.type === 'signup';
                    const isAdminAction = activity.type === 'admin_action';
                    
                    return (
                      <tr key={activity.id} className="border-t border-red-500/20 hover:bg-black/20 transition">
                        <td className="px-4 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            isSignup 
                              ? 'bg-green-500/20 text-green-300' 
                              : isAdminAction
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {isSignup ? 'SIGNUP' : isAdminAction ? 'ADMIN' : 'LOGIN'}
                          </span>
                          {isAdminAction && (
                            <p className="text-xs text-gray-400 mt-1">{activity.action}</p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-semibold text-white">{activity.name || activity.targetUserEmail}</p>
                            <p className="text-sm text-gray-400">{activity.email || activity.targetUserEmail}</p>
                            {isAdminAction && (
                              <p className="text-xs text-red-400">By: {activity.adminEmail}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {isAdminAction ? (
                            <div className="text-xs">
                              {activity.oldPlan && activity.newPlan && (
                                <span className="text-yellow-400">
                                  {activity.oldPlan} → {activity.newPlan}
                                </span>
                              )}
                              {activity.action === 'user_locked' && (
                                <span className="text-red-400">User Locked</span>
                              )}
                              {activity.action === 'user_unlocked' && (
                                <span className="text-green-400">User Unlocked</span>
                              )}
                            </div>
                          ) : (
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              activity.plan === 'ultra' 
                                ? 'bg-purple-500/20 text-purple-300'
                                : activity.plan === 'basic'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-yellow-500/20 text-yellow-300'
                            }`}>
                              {activity.plan?.toUpperCase() || 'TRIAL'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-gray-300 text-sm">
                          {activityTime}
                        </td>
                        <td className="px-4 py-4 text-gray-400 text-sm">
                          {activity.ipAddress || 'Unknown'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {activities.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No activity recorded yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* System Control Tab */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="bg-black/30 backdrop-blur-lg rounded-xl p-6 border border-red-500/30">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Database className="w-6 h-6" />
                System Data Management
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => clearSystemData('sales')}
                  disabled={actionLoading === 'clear-sales'}
                  className="p-4 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-lg text-orange-300 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'clear-sales' ? (
                    <div className="w-6 h-6 mx-auto mb-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-6 h-6 mx-auto mb-2" />
                  )}
                  <p className="font-medium">Clear Sales</p>
                  <p className="text-xs opacity-75">All user sales data</p>
                </button>
                
                <button
                  onClick={() => clearSystemData('expenses')}
                  disabled={actionLoading === 'clear-expenses'}
                  className="p-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-300 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'clear-expenses' ? (
                    <div className="w-6 h-6 mx-auto mb-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <DollarSign className="w-6 h-6 mx-auto mb-2" />
                  )}
                  <p className="font-medium">Clear Expenses</p>
                  <p className="text-xs opacity-75">All user expense data</p>
                </button>
                
                <button
                  onClick={() => clearSystemData('products')}
                  disabled={actionLoading === 'clear-products'}
                  className="p-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-300 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'clear-products' ? (
                    <div className="w-6 h-6 mx-auto mb-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <RefreshCw className="w-6 h-6 mx-auto mb-2" />
                  )}
                  <p className="font-medium">Clear Inventory</p>
                  <p className="text-xs opacity-75">All products & batches</p>
                </button>
                
                <button
                  onClick={() => clearSystemData('all')}
                  disabled={actionLoading === 'clear-all'}
                  className="p-4 bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 rounded-lg text-red-300 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'clear-all' ? (
                    <div className="w-6 h-6 mx-auto mb-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                  )}
                  <p className="font-medium">Clear All Data</p>
                  <p className="text-xs opacity-75">⚠️ Everything except users</p>
                </button>
              </div>
            </div>

            <div className="bg-black/30 backdrop-blur-lg rounded-xl p-6 border border-red-500/30">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Settings className="w-6 h-6" />
                System Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">User Statistics</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Users:</span>
                      <span className="text-white">{users.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Active Users:</span>
                      <span className="text-green-400">{users.filter(u => u.active && !u.locked).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Locked Users:</span>
                      <span className="text-red-400">{users.filter(u => u.locked).length}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">Plan Distribution</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Basic Plans:</span>
                      <span className="text-blue-400">{users.filter(u => u.plan === 'basic').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ultra Plans:</span>
                      <span className="text-purple-400">{users.filter(u => u.plan === 'ultra').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Free Trials:</span>
                      <span className="text-yellow-400">{users.filter(u => !u.plan || u.plan === 'trial').length}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">Revenue</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Monthly Revenue:</span>
                      <span className="text-green-400">KSH {(stats.mrr || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Revenue:</span>
                      <span className="text-green-400">KSH {(stats.totalRevenue || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Activities:</span>
                      <span className="text-blue-400">{activities.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Plan Change Modal */}
      {showPlanModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-black/80 backdrop-blur-lg rounded-xl p-6 border border-red-500/30 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Change User Plan</h3>
            <div className="mb-4">
              <p className="text-gray-300">User: <span className="text-white font-semibold">{selectedUser.name}</span></p>
              <p className="text-gray-400 text-sm">{selectedUser.email}</p>
              <p className="text-gray-400 text-sm">Current Plan: <span className="text-yellow-400">{selectedUser.plan || 'trial'}</span></p>
            </div>
            <div className="space-y-3 mb-6">
              {['trial', 'basic', 'ultra'].map(plan => (
                <button
                  key={plan}
                  onClick={() => changePlan(selectedUser.id, plan)}
                  disabled={actionLoading === `plan-${selectedUser.id}` || selectedUser.plan === plan}
                  className={`w-full p-3 rounded-lg border transition ${
                    selectedUser.plan === plan
                      ? 'bg-gray-500/20 border-gray-500/30 text-gray-400 cursor-not-allowed'
                      : plan === 'trial'
                      ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/30'
                      : plan === 'basic'
                      ? 'bg-blue-500/20 border-blue-500/30 text-blue-300 hover:bg-blue-500/30'
                      : 'bg-purple-500/20 border-purple-500/30 text-purple-300 hover:bg-purple-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className="font-semibold">{plan.charAt(0).toUpperCase() + plan.slice(1)} Plan</p>
                      <p className="text-xs opacity-75">
                        {plan === 'trial' ? 'Free - 30 days' : plan === 'basic' ? 'KSH 1,000/month' : 'KSH 2,400/month'}
                      </p>
                    </div>
                    {selectedUser.plan === plan && <CheckCircle className="w-5 h-5" />}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPlanModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-500/20 border border-gray-500/30 text-gray-300 rounded-lg hover:bg-gray-500/30 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}