import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, FileText, Settings, LogOut,
  TrendingUp, Shield, Activity, MessageSquare, ChevronRight
} from 'lucide-react';
import mainAdminApi from '../../services/mainAdminApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'businesses', label: 'Businesses', icon: Building2 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'growth', label: 'Growth', icon: TrendingUp },
  { id: 'system', label: 'System', icon: Activity },
  { id: 'support', label: 'Support', icon: MessageSquare },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, bizData] = await Promise.all([
        mainAdminApi.getStats().catch(() => null),
        mainAdminApi.getBusinesses().catch(() => []),
      ]);
      setStats(statsData);
      setBusinesses(bizData.businesses || bizData || []);
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mainAdminToken');
    localStorage.removeItem('mainAdminUser');
    navigate('/windatawind');
  };

  const StatCard = ({ label, value, change, icon: Icon }) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6 hover:shadow-card-hover transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5 text-slate-600" />
        </div>
        {change && (
          <span className="text-xs font-semibold text-success bg-green-50 px-2 py-1 rounded-full">
            {change}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-900 mb-1">{value || '—'}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 fixed h-full flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">POSIFY</div>
              <div className="text-xs text-slate-500">Super Admin</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64 p-4 sm:p-6 md:p-10 mt-14 md:mt-0">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {activeTab === 'overview' && (
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-6">Platform Overview</h1>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <StatCard label="Total Users" value={stats?.total_users || '—'} icon={Users} />
                  <StatCard label="Active Businesses" value={stats?.active_businesses || '—'} icon={Building2} />
                  <StatCard label="Expired Trials" value={stats?.expired_trials || '—'} icon={Shield} />
                  <StatCard label="Paid Subscribers" value={stats?.paid_subscribers || '—'} icon={Activity} />
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6">
                    <h3 className="font-bold text-slate-900 mb-4">Business Registrations</h3>
                    <p className="text-sm text-slate-500 mb-4">Daily new business signups</p>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats?.growth_metrics?.daily_registrations || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                          <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6">
                    <h3 className="font-bold text-slate-900 mb-4">Revenue Trend</h3>
                    <p className="text-sm text-slate-500 mb-4">Monthly platform revenue</p>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats?.growth_metrics?.revenue || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                          <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="mt-8 bg-white rounded-2xl border border-slate-100 shadow-soft p-6">
                  <h3 className="font-bold text-slate-900 mb-4">Recent Registrations</h3>
                  <div className="overflow-x-auto">
                    <div className="md:hidden space-y-3">
                      {(businesses || []).slice(0, 5).map((biz, i) => (
                        <div key={i} className="bg-white rounded-xl shadow p-4 space-y-2 border border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-900">{biz.business_name || biz.owner_email || '—'}</span>
                            <span className={`badge ${biz.is_active ? 'badge-success' : 'badge-danger'} text-xs`}>{biz.is_active ? 'Active' : 'Inactive'}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-100">
                            <span className="text-slate-600">Plan</span>
                            <span className="capitalize text-slate-900">{biz.plan || '—'}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Created</span>
                            <span className="text-slate-900">{biz.created_at ? new Date(biz.created_at).toLocaleDateString() : '—'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <table className="hidden md:table w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="pb-3 font-semibold text-slate-500">Business</th>
                          <th className="pb-3 font-semibold text-slate-500">Plan</th>
                          <th className="pb-3 font-semibold text-slate-500">Status</th>
                          <th className="pb-3 font-semibold text-slate-500">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(businesses || []).slice(0, 5).map((biz, i) => (
                          <tr key={i} className="border-b border-slate-50 last:border-0">
                            <td className="py-3 font-medium text-slate-900">{biz.business_name || biz.owner_email || '—'}</td>
                            <td className="py-3 capitalize text-slate-600">{biz.plan || '—'}</td>
                            <td className="py-3">
                              <span className={`badge ${biz.is_active ? 'badge-success' : 'badge-danger'}`}>
                                {biz.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="py-3 text-slate-500">
                              {biz.created_at ? new Date(biz.created_at).toLocaleDateString() : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'businesses' && (
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-6">Businesses</h1>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
                  <div className="overflow-x-auto">
                    <>
                      <div className="md:hidden space-y-3">
                        {(businesses || []).map((biz, i) => (
                          <div key={i} className="bg-white rounded-xl shadow p-4 space-y-2 border border-slate-100">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-slate-900">{biz.business_name || biz.owner_email}</span>
                              <span className={`badge ${biz.is_active ? 'badge-success' : 'badge-danger'} text-xs`}>{biz.is_active ? 'Active' : 'Inactive'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-100">
                              <span className="text-slate-600">Plan</span>
                              <span className="capitalize text-slate-900">{biz.plan || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">Users</span>
                              <span className="text-slate-900">{biz.user_count || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">Created</span>
                              <span className="text-slate-900">{biz.created_at ? new Date(biz.created_at).toLocaleDateString() : '—'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">Last Active</span>
                              <span className="text-slate-900">{biz.last_activity_date ? new Date(biz.last_activity_date).toLocaleDateString() : '—'}</span>
                            </div>
                          </div>
                        ))}
                        {(!businesses || businesses.length === 0) && (
                          <div className="text-center text-slate-500 py-8">No businesses found</div>
                        )}
                      </div>
                      <table className="hidden md:table w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="px-6 py-4 font-semibold text-slate-500">Business</th>
                            <th className="px-6 py-4 font-semibold text-slate-500">Plan</th>
                            <th className="px-6 py-4 font-semibold text-slate-500">Status</th>
                            <th className="px-6 py-4 font-semibold text-slate-500">Users</th>
                            <th className="px-6 py-4 font-semibold text-slate-500">Created</th>
                            <th className="px-6 py-4 font-semibold text-slate-500">Last Active</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(businesses || []).map((biz, i) => (
                            <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                              <td className="px-6 py-4 font-medium text-slate-900">{biz.business_name || biz.owner_email}</td>
                              <td className="px-6 py-4 capitalize text-slate-600">{biz.plan || '—'}</td>
                              <td className="px-6 py-4">
                                <span className={`badge ${biz.is_active ? 'badge-success' : 'badge-danger'}`}>
                                  {biz.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-600">{biz.user_count || '—'}</td>
                              <td className="px-6 py-4 text-slate-500">
                                {biz.created_at ? new Date(biz.created_at).toLocaleDateString() : '—'}
                              </td>
                              <td className="px-6 py-4 text-slate-500">
                                {biz.last_activity_date ? new Date(biz.last_activity_date).toLocaleDateString() : '—'}
                              </td>
                            </tr>
                          ))}
                          {(!businesses || businesses.length === 0) && (
                            <tr>
                              <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                No businesses found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-6">Platform Users</h1>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-12 text-center">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">User management coming soon.</p>
                </div>
              </div>
            )}

            {activeTab === 'growth' && (
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-6">Growth Metrics</h1>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-12 text-center">
                  <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Detailed growth analytics coming soon.</p>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-6">System Health</h1>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: 'API Status', value: 'Operational', color: 'success' },
                    { label: 'Database', value: 'Connected', color: 'success' },
                    { label: 'Server', value: 'Healthy', color: 'success' },
                    { label: 'Cache', value: 'Active', color: 'success' },
                    { label: 'WebSocket', value: 'Connected', color: 'success' },
                    { label: 'SMTP', value: 'Pending', color: 'warning' },
                  ].map((item, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6">
                      <div className="text-sm text-slate-500 mb-2">{item.label}</div>
                      <div className={`text-lg font-bold ${
                        item.color === 'success' ? 'text-success' :
                        item.color === 'warning' ? 'text-amber-600' :
                        'text-red-600'
                      }`}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'support' && (
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-6">Support Tickets</h1>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-12 text-center">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Support ticket management coming soon.</p>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-6">Portal Settings</h1>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-12 text-center">
                  <Settings className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Settings panel coming soon.</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
