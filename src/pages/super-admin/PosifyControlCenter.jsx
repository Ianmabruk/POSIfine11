import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, FileText, Settings, LogOut,
  TrendingUp, Shield, Activity, Search, ChevronRight, BarChart3,
  Package, Clock, DollarSign
} from 'lucide-react';
import mainAdminApi from '../../services/mainAdminApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3B82F6', '#F97316', '#22C55E', '#EF4444', '#A855F7'];

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'businesses', label: 'Businesses', icon: Building2 },
  { id: 'trials', label: 'Trials', icon: Clock },
  { id: 'subscriptions', label: 'Subscriptions', icon: FileText },
  { id: 'payments', label: 'Payments', icon: DollarSign },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export default function PosifyControlCenter() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [trials, setTrials] = useState({ active: [], expired: [] });
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadData();
    const intervalId = setInterval(loadData, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [metricsData, bizData, activeTrials, expiredTrials, subsData, paymentsData, revenue] = await Promise.all([
        mainAdminApi.getDashboardMetrics().catch(() => null),
        mainAdminApi.getBusinesses().catch(() => []),
        mainAdminApi.getActiveTrials().catch(() => []),
        mainAdminApi.getExpiredTrials().catch(() => []),
        mainAdminApi.getAllSubscriptions().catch(() => []),
        mainAdminApi.getPaymentHistory().catch(() => []),
        mainAdminApi.getRevenueAnalytics().catch(() => null),
      ]);

      setMetrics(metricsData);
      setBusinesses(Array.isArray(bizData) ? bizData : []);
      setTrials({ active: activeTrials, expired: expiredTrials });
      setSubscriptions(Array.isArray(subsData) ? subsData : []);
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setRevenueData(revenue);
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mainAdminToken');
    localStorage.removeItem('ownerToken');
    localStorage.removeItem('mainAdminUser');
    localStorage.removeItem('ownerUser');
    navigate('/windatawind');
  };

  const handleSuspend = async (id) => {
    try {
      await mainAdminApi.suspendBusiness(id);
      loadData();
    } catch (e) {
      console.error('Failed to suspend business:', e);
    }
  };

  const handleActivate = async (id) => {
    try {
      await mainAdminApi.activateBusiness(id);
      loadData();
    } catch (e) {
      console.error('Failed to activate business:', e);
    }
  };

  const handleRequestPayment = async (id) => {
    try {
      await mainAdminApi.requestPayment(id);
      loadData();
    } catch (e) {
      console.error('Failed to request payment:', e);
      alert(e.message || 'Failed to request payment.');
    }
  };

  const handleClearPayment = async (id) => {
    try {
      await mainAdminApi.clearPayment(id);
      loadData();
    } catch (e) {
      console.error('Failed to clear payment:', e);
      alert(e.message || 'Failed to clear payment.');
    }
  };

  const filteredBusinesses = businesses.filter(b => {
    const matchesSearch = (b.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'trial') return b.trialStatus === 'active';
    if (statusFilter === 'expired') return b.trialStatus === 'expired';
    if (statusFilter === 'payment_required') return b.paymentRequired;
    if (statusFilter === 'active') return !b.trialStatus || b.trialStatus === 'none';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading Posify Control Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        bg-white border-r border-cream-200 transition-all duration-300 flex flex-col
        fixed inset-y-0 left-0 z-50
        w-64 transform
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm">Posify</h1>
              <p className="text-xs text-slate-400">Control Center</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? 'bg-accent-50 text-accent-700'
                    : 'text-slate-600 hover:bg-cream-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-cream-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-cream-100 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top Navbar */}
        <header className="bg-white border-b border-cream-200 px-4 sm:px-6 lg:px-10 py-3 sm:py-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 capitalize">
              {activeTab}
            </h1>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
                <p className="text-slate-500 mt-1">Welcome to Posify Control Center</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {[
                  { label: 'Total Businesses', value: metrics?.totalBusinesses || 0, icon: Building2, color: 'bg-accent-500' },
                  { label: 'Active Businesses', value: metrics?.activeBusinesses || 0, icon: Shield, color: 'bg-sage-500' },
                  { label: 'Trial Accounts', value: metrics?.trialAccounts || 0, icon: Clock, color: 'bg-accent-500' },
                  { label: 'Expired Trials', value: metrics?.expiredTrials || 0, icon: Activity, color: 'bg-red-500' },
                  { label: 'Total Revenue', value: `KES ${(metrics?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-sage-500' },
                  { label: 'Paying Customers', value: metrics?.payingCustomers || 0, icon: TrendingUp, color: 'bg-accent-500' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white rounded-2xl p-6 border border-cream-200 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center`}>
                        <stat.icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {revenueData?.dailyRevenue && (
                <div className="bg-white rounded-2xl p-6 border border-cream-200 shadow-sm">
                  <h3 className="font-semibold text-slate-900 mb-6">Revenue Analytics (Last 30 Days)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData.dailyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="_id" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip />
                      <Line type="monotone" dataKey="revenue" stroke="#FF6B00" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'businesses' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Businesses</h2>
                  <p className="text-slate-500 mt-1">Manage all registered businesses</p>
                </div>
                <div className="relative">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search businesses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 bg-white border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 w-full sm:w-64"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'trial', label: 'Free Trial' },
                  { key: 'expired', label: 'Trial Expired' },
                  { key: 'payment_required', label: 'Payment Required' },
                  { key: 'active', label: 'Active Paid' },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setStatusFilter(filter.key)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      statusFilter === filter.key
                        ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/25'
                        : 'bg-white text-slate-600 border border-cream-300 hover:bg-cream-50'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
                <>
                   <div className="md:hidden space-y-3 p-4">
                     {filteredBusinesses.map((business) => (
                       <div key={business._id} className="bg-white rounded-xl shadow p-4 space-y-2 border border-cream-100">
                         <div className="flex items-center justify-between">
                           <div>
                             <p className="font-medium text-slate-900 text-sm">{business.name}</p>
                             <p className="text-xs text-slate-400">{business.email}</p>
                           </div>
                           <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                             business.paymentRequired ? 'bg-orange-50 text-orange-700' :
                             business.isLocked ? 'bg-red-50 text-red-700' :
                             business.isActive ? 'bg-green-50 text-green-700' :
                             'bg-slate-100 text-slate-600'
                           }`}>
                             {business.paymentRequired ? 'Payment Required' : business.isLocked ? 'Locked' : business.isActive ? 'Active' : 'Inactive'}
                           </span>
                         </div>
                         <div className="flex items-center justify-between text-sm pt-2 border-t border-cream-100">
                           <span className="text-slate-600">Owner</span>
                           <span className="text-slate-900">{business.ownerName}</span>
                         </div>
                         <div className="flex items-center justify-between text-sm">
                           <span className="text-slate-600">Plan</span>
                           <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-accent-50 text-accent-700 capitalize">{business.plan}</span>
                         </div>
                         <div className="flex items-center justify-between text-sm">
                           <span className="text-slate-600">Trial</span>
                           <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                             business.trialStatus === 'expired' ? 'bg-red-50 text-red-700' :
                             business.trialStatus === 'active' ? 'bg-amber-50 text-amber-700' :
                             'bg-slate-100 text-slate-600'
                           }`}>
                             {business.trialStatus === 'expired' ? 'Expired' : business.trialStatus === 'active' ? `${business.daysRemaining}d left` : 'None'}
                           </span>
                         </div>
                         <div className="flex items-center justify-between text-sm">
                           <span className="text-slate-600">Revenue</span>
                           <span className="text-slate-900">KES {(business.totalRevenue || 0).toLocaleString()}</span>
                         </div>
                         <div className="pt-2 flex gap-2">
                           {business.paymentRequired ? (
                             <button onClick={() => handleClearPayment(business._id)} className="text-xs px-3 py-1.5 bg-sage-500 text-white rounded-lg hover:bg-sage-600 transition-colors flex-1">Clear Payment</button>
                           ) : business.isLocked ? (
                             <button onClick={() => handleActivate(business._id)} className="text-xs px-3 py-1.5 bg-sage-500 text-white rounded-lg hover:bg-sage-600 transition-colors flex-1">Activate</button>
                           ) : business.trialStatus === 'expired' && business.plan === 'trial' ? (
                             <button onClick={() => handleRequestPayment(business._id)} className="text-xs px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex-1">Request Payment</button>
                           ) : (
                             <button onClick={() => handleSuspend(business._id)} className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex-1">Suspend</button>
                           )}
                         </div>
                       </div>
                     ))}
                     {filteredBusinesses.length === 0 && (
                       <div className="text-center text-slate-400 text-sm py-4">No businesses found</div>
                     )}
                   </div>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-cream-100 border-b border-cream-200">
                        <tr>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Business</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Owner</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trial</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Revenue</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cream-100">
                        {filteredBusinesses.map((business) => (
                          <tr key={business._id} className="hover:bg-cream-50/50">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-slate-900 text-sm">{business.name}</p>
                                <p className="text-xs text-slate-400">{business.email}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">{business.ownerName}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-accent-50 text-accent-700 capitalize">
                                {business.plan}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                                business.trialStatus === 'expired' ? 'bg-red-50 text-red-700' :
                                business.trialStatus === 'active' ? 'bg-amber-50 text-amber-700' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {business.trialStatus === 'expired' ? 'Expired' : business.trialStatus === 'active' ? `${business.daysRemaining}d left` : 'None'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                                business.paymentRequired ? 'bg-orange-50 text-orange-700' :
                                business.isLocked ? 'bg-red-50 text-red-700' :
                                business.isActive ? 'bg-green-50 text-green-700' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {business.paymentRequired ? 'Payment Required' : business.isLocked ? 'Locked' : business.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">KES {(business.totalRevenue || 0).toLocaleString()}</td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                {business.paymentRequired ? (
                                  <button
                                    onClick={() => handleClearPayment(business._id)}
                                    className="text-xs px-3 py-1.5 bg-sage-500 text-white rounded-lg hover:bg-sage-600 transition-colors"
                                  >
                                    Clear Payment
                                  </button>
                                ) : business.isLocked ? (
                                  <button
                                    onClick={() => handleActivate(business._id)}
                                    className="text-xs px-3 py-1.5 bg-sage-500 text-white rounded-lg hover:bg-sage-600 transition-colors"
                                  >
                                    Activate
                                  </button>
                                ) : business.trialStatus === 'expired' && business.plan === 'trial' ? (
                                  <button
                                    onClick={() => handleRequestPayment(business._id)}
                                    className="text-xs px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                                  >
                                    Request Payment
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleSuspend(business._id)}
                                    className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                  >
                                    Suspend
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredBusinesses.length === 0 && (
                      <div className="px-6 py-8 text-center text-slate-400 text-sm">No businesses found</div>
                    )}
                  </div>
                </>
              </div>
            </motion.div>
          )}

          {activeTab === 'trials' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Trial Management</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-cream-200 shadow-sm">
                  <h3 className="font-semibold text-slate-900 mb-4">Active Trials ({trials.active.length})</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {trials.active.map((trial) => (
                      <div key={trial._id} className="flex items-center justify-between p-3 bg-accent-50 rounded-xl">
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{trial.businessId?.name || trial.businessName || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{trial.packageType} plan</p>
                        </div>
                        <span className="text-xs text-accent-600 font-medium">Ends {new Date(trial.endDate).toLocaleDateString()}</span>
                      </div>
                    ))}
                    {trials.active.length === 0 && <p className="text-slate-400 text-sm">No active trials</p>}
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-cream-200 shadow-sm">
                  <h3 className="font-semibold text-slate-900 mb-4">Expired Trials ({trials.expired.length})</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {trials.expired.map((trial) => (
                      <div key={trial._id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{trial.businessId?.name || trial.businessName || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{trial.packageType} plan</p>
                        </div>
                        <span className="text-xs text-red-600 font-medium">Expired</span>
                      </div>
                    ))}
                    {trials.expired.length === 0 && <p className="text-slate-400 text-sm">No expired trials</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'subscriptions' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Subscriptions</h2>
              <div className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
                <>
                  <div className="md:hidden space-y-3 p-4">
                    {subscriptions.map((sub) => (
                      <div key={sub._id} className="bg-white rounded-xl shadow p-4 space-y-2 border border-cream-100">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-900 text-sm">{sub.businessId?.name || 'Unknown'}</span>
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${sub.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{sub.status}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm pt-2 border-t border-cream-100">
                          <span className="text-slate-600">Plan</span>
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-accent-50 text-accent-700 capitalize">{sub.packageType}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Start Date</span>
                          <span className="text-slate-900">{sub.startDate ? new Date(sub.startDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">End Date</span>
                          <span className="text-slate-900">{sub.endDate ? new Date(sub.endDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                    {subscriptions.length === 0 && (
                      <div className="text-center text-slate-400 text-sm py-4">No subscriptions found</div>
                    )}
                  </div>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-cream-100 border-b border-cream-200">
                        <tr>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Business</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Plan</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Start Date</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">End Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cream-100">
                        {subscriptions.map((sub) => (
                          <tr key={sub._id} className="hover:bg-cream-50/50">
                            <td className="px-6 py-4 text-sm text-slate-900 font-medium">{sub.businessId?.name || 'Unknown'}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-accent-50 text-accent-700 capitalize">
                                {sub.packageType}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                                sub.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                              }`}>
                                {sub.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">{sub.startDate ? new Date(sub.startDate).toLocaleDateString() : 'N/A'}</td>
                            <td className="px-6 py-4 text-sm text-slate-500">{sub.endDate ? new Date(sub.endDate).toLocaleDateString() : 'N/A'}</td>
                          </tr>
                        ))}
                        {subscriptions.length === 0 && (
                          <tr>
                            <td colSpan="5" className="px-6 py-8 text-center text-slate-400 text-sm">No subscriptions found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              </div>
            </motion.div>
          )}

          {activeTab === 'payments' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Payment History</h2>
              <div className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
                <>
                  <div className="md:hidden space-y-3 p-4">
                    {payments.map((payment) => (
                      <div key={payment._id} className="bg-white rounded-xl shadow p-4 space-y-2 border border-cream-100">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-900 text-sm">{payment.businessId?.name || 'Unknown'}</span>
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            payment.paymentStatus === 'completed' ? 'bg-green-50 text-green-700' :
                            payment.paymentStatus === 'pending' ? 'bg-amber-50 text-amber-700' :
                            'bg-red-50 text-red-700'
                          }`}>{payment.paymentStatus}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm pt-2 border-t border-cream-100">
                          <span className="text-slate-600">Amount</span>
                          <span className="font-medium text-slate-900">KES {(payment.amount || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Method</span>
                          <span className="text-slate-900 capitalize">{payment.paymentMethod}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Date</span>
                          <span className="text-slate-900">{payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                    {payments.length === 0 && (
                      <div className="text-center text-slate-400 text-sm py-4">No payments found</div>
                    )}
                  </div>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-cream-100 border-b border-cream-200">
                        <tr>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Business</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Amount</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Method</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cream-100">
                        {payments.map((payment) => (
                          <tr key={payment._id} className="hover:bg-cream-50/50">
                            <td className="px-6 py-4 text-sm text-slate-900 font-medium">{payment.businessId?.name || 'Unknown'}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">KES {(payment.amount || 0).toLocaleString()}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                                payment.paymentStatus === 'completed' ? 'bg-green-50 text-green-700' :
                                payment.paymentStatus === 'pending' ? 'bg-amber-50 text-amber-700' :
                                'bg-red-50 text-red-700'
                              }`}>
                                {payment.paymentStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 capitalize">{payment.paymentMethod}</td>
                            <td className="px-6 py-4 text-sm text-slate-500">{payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : 'N/A'}</td>
                          </tr>
                        ))}
                        {payments.length === 0 && (
                          <tr>
                            <td colSpan="5" className="px-6 py-8 text-center text-slate-400 text-sm">No payments found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Analytics</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {revenueData?.dailyRevenue && (
                  <div className="bg-white rounded-2xl p-6 border border-cream-200 shadow-sm">
                    <h3 className="font-semibold text-slate-900 mb-6">Daily Revenue</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={revenueData.dailyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="_id" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip />
                        <Line type="monotone" dataKey="revenue" stroke="#FF6B00" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {businesses.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-cream-200 shadow-sm">
                    <h3 className="font-semibold text-slate-900 mb-6">Plan Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={businesses.reduce((acc, b) => {
                            const plan = b.plan || 'free';
                            const existing = acc.find(item => item.name === plan);
                            if (existing) existing.value++;
                            else acc.push({ name: plan, value: 1 });
                            return acc;
                          }, [])}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {businesses.slice(0, 5).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
        </div>
      </main>
    </div>
  );
}
