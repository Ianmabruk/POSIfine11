import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BarChart3, DollarSign, Droplet, Fuel, Gauge, LogOut, Plus, Users } from 'lucide-react';
import { petroleumService } from '../../services/petroleumService';

export default function PetrolAdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [tanks, setTanks] = useState([]);
  const [sales, setSales] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newTank, setNewTank] = useState({ fuel_type: 'Petrol', capacity: '', current_volume: '', price_per_liter: '' });
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', role: 'pump_attendant' });

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.subscription !== 'PRO_PETROLEUM') return;
    loadPetroleumData();
  }, [user?.subscription]);

  const loadPetroleumData = async () => {
    try {
      setLoading(true);
      const [tanksData, salesData, staffData] = await Promise.all([
        petroleumService.getTanks(),
        petroleumService.getSales(),
        petroleumService.getStaff()
      ]);
      setTanks(Array.isArray(tanksData) ? tanksData : []);
      setSales(Array.isArray(salesData) ? salesData : []);
      setStaff(Array.isArray(staffData) ? staffData : []);
    } catch (error) {
      console.error('Failed to load petroleum data:', error);
      alert(error.message || 'Failed to load petroleum data');
    } finally {
      setLoading(false);
    }
  };

  const fuelTotals = useMemo(() => {
    return sales.reduce((acc, sale) => {
      const fuel = sale.fuel_type || 'Unknown';
      acc[fuel] = acc[fuel] || { liters: 0, revenue: 0 };
      acc[fuel].liters += Number(sale.liters || 0);
      acc[fuel].revenue += Number(sale.amount || 0);
      return acc;
    }, {});
  }, [sales]);

  const salesByPump = useMemo(() => {
    return sales.reduce((acc, sale) => {
      const pump = sale.pump_number || 'N/A';
      acc[pump] = (acc[pump] || 0) + Number(sale.amount || 0);
      return acc;
    }, {});
  }, [sales]);

  const dailyTotals = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return sales.reduce(
      (acc, sale) => {
        if ((sale.created_at || '').startsWith(today)) {
          acc.liters += Number(sale.liters || 0);
          acc.revenue += Number(sale.amount || 0);
        }
        return acc;
      },
      { liters: 0, revenue: 0 }
    );
  }, [sales]);

  const performanceData = useMemo(() => {
    const profit = dailyTotals.revenue;
    return [
      { label: 'Sales', value: sales.length },
      { label: 'Volume', value: dailyTotals.liters },
      { label: 'Profit', value: profit }
    ];
  }, [dailyTotals, sales.length]);

  const handleAddTank = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        fuel_type: newTank.fuel_type,
        capacity: Number(newTank.capacity),
        current_volume: Number(newTank.current_volume),
        price_per_liter: Number(newTank.price_per_liter)
      };
      await petroleumService.createTank(payload);
      setNewTank({ fuel_type: 'Petrol', capacity: '', current_volume: '', price_per_liter: '' });
      await loadPetroleumData();
    } catch (error) {
      alert(error.message || 'Failed to add tank');
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      await petroleumService.createStaff(newStaff);
      setNewStaff({ name: '', email: '', password: '', role: 'pump_attendant' });
      await loadPetroleumData();
    } catch (error) {
      alert(error.message || 'Failed to add staff');
    }
  };

  if (!user) return null;

  if (user.subscription !== 'PRO_PETROLEUM') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-lg text-center space-y-4">
          <h1 className="text-3xl font-bold">Petroleum Module Locked</h1>
          <p className="text-slate-300">Upgrade to PRO_PETROLEUM to access petroleum dashboards.</p>
          <button
            onClick={() => navigate('/choose-subscription')}
            className="px-6 py-3 rounded-xl bg-cyan-500 text-slate-900 font-semibold"
          >
            Upgrade Subscription
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
              <Fuel className="text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Petroleum Admin Command</h1>
              <p className="text-slate-400 text-sm">Tank control • Pump analytics • Staff management</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/auth/login');
            }}
            className="flex items-center gap-2 bg-red-500/10 text-red-300 px-4 py-2 rounded-lg hover:bg-red-500/20"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900 border border-cyan-500/20 rounded-2xl p-6 shadow-xl">
            <p className="text-slate-400 text-sm">Daily Volume Sold</p>
            <h2 className="text-3xl font-bold text-cyan-300">{dailyTotals.liters.toLocaleString()} L</h2>
            <p className="text-slate-500 text-xs mt-2">Updated in real-time</p>
          </div>
          <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-6 shadow-xl">
            <p className="text-slate-400 text-sm">Daily Revenue</p>
            <h2 className="text-3xl font-bold text-emerald-300">KES {dailyTotals.revenue.toLocaleString()}</h2>
            <p className="text-slate-500 text-xs mt-2">All pumps aggregated</p>
          </div>
          <div className="bg-slate-900 border border-purple-500/20 rounded-2xl p-6 shadow-xl">
            <p className="text-slate-400 text-sm">Active Staff</p>
            <h2 className="text-3xl font-bold text-purple-300">{staff.length}</h2>
            <p className="text-slate-500 text-xs mt-2">Petroleum staff roster</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'tanks', label: 'Fuel Tanks', icon: Droplet },
            { id: 'pumps', label: 'Pump Analytics', icon: Gauge },
            { id: 'staff', label: 'Staff', icon: Users }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${
                  activeTab === tab.id
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                    : 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {loading && (
          <div className="text-slate-400">Loading petroleum data...</div>
        )}

        {!loading && activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue by Fuel Type</h3>
              <div className="space-y-3">
                {Object.entries(fuelTotals).map(([fuel, stats]) => (
                  <div key={fuel} className="flex items-center justify-between">
                    <span className="text-slate-300">{fuel}</span>
                    <span className="text-emerald-300 font-semibold">KES {stats.revenue.toLocaleString()}</span>
                  </div>
                ))}
                {!Object.keys(fuelTotals).length && (
                  <p className="text-slate-500 text-sm">No sales recorded yet.</p>
                )}
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Liters by Fuel Type</h3>
              <div className="space-y-3">
                {Object.entries(fuelTotals).map(([fuel, stats]) => (
                  <div key={fuel} className="flex items-center justify-between">
                    <span className="text-slate-300">{fuel}</span>
                    <span className="text-cyan-300 font-semibold">{stats.liters.toLocaleString()} L</span>
                  </div>
                ))}
                {!Object.keys(fuelTotals).length && (
                  <p className="text-slate-500 text-sm">No sales recorded yet.</p>
                )}
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Performance Chart</h3>
              <div className="space-y-4">
                {performanceData.map((metric) => {
                  const maxValue = Math.max(...performanceData.map(item => item.value), 1);
                  const width = (metric.value / maxValue) * 100;
                  return (
                    <div key={metric.label}>
                      <div className="flex items-center justify-between text-sm text-slate-400">
                        <span>{metric.label}</span>
                        <span>{metric.value.toLocaleString()}</span>
                      </div>
                      <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-purple-400"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {!loading && activeTab === 'tanks' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {tanks.map((tank) => {
                const percent = tank.capacity ? Math.min(100, (tank.current_volume / tank.capacity) * 100) : 0;
                return (
                  <div key={tank.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-cyan-200">{tank.fuel_type}</h4>
                        <p className="text-slate-400 text-sm">Capacity {tank.capacity} L • Price KES {tank.price_per_liter}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-400">Current Volume</p>
                        <p className="text-xl font-bold text-emerald-300">{tank.current_volume.toLocaleString()} L</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-lime-300 transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-2">{percent.toFixed(1)}% full</p>
                    </div>
                  </div>
                );
              })}
              {!tanks.length && (
                <div className="text-slate-500">No tanks configured yet.</div>
              )}
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Add Fuel Tank</h3>
              <form onSubmit={handleAddTank} className="space-y-4">
                <select
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                  value={newTank.fuel_type}
                  onChange={(e) => setNewTank(prev => ({ ...prev, fuel_type: e.target.value }))}
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Kerosene">Kerosene</option>
                </select>
                <input
                  type="number"
                  placeholder="Capacity (L)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                  value={newTank.capacity}
                  onChange={(e) => setNewTank(prev => ({ ...prev, capacity: e.target.value }))}
                />
                <input
                  type="number"
                  placeholder="Current Volume (L)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                  value={newTank.current_volume}
                  onChange={(e) => setNewTank(prev => ({ ...prev, current_volume: e.target.value }))}
                />
                <input
                  type="number"
                  placeholder="Price per Liter"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                  value={newTank.price_per_liter}
                  onChange={(e) => setNewTank(prev => ({ ...prev, price_per_liter: e.target.value }))}
                />
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-cyan-500 text-slate-900 font-semibold py-2 rounded-lg"
                >
                  <Plus size={16} />
                  Add Fuel Type
                </button>
              </form>
            </div>
          </div>
        )}

        {!loading && activeTab === 'pumps' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Sales per Pump</h3>
              <div className="space-y-3">
                {Object.entries(salesByPump).map(([pump, amount]) => (
                  <div key={pump} className="flex items-center justify-between">
                    <span className="text-slate-300">Pump {pump}</span>
                    <span className="text-emerald-300 font-semibold">KES {amount.toLocaleString()}</span>
                  </div>
                ))}
                {!Object.keys(salesByPump).length && (
                  <p className="text-slate-500 text-sm">No pump sales recorded yet.</p>
                )}
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Sales</h3>
              <div className="space-y-3">
                {sales.slice(0, 6).map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-slate-300">{sale.fuel_type} • Pump {sale.pump_number || 'N/A'}</p>
                      <p className="text-slate-500">{new Date(sale.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-cyan-300 font-semibold">{sale.liters} L</p>
                      <p className="text-emerald-300">KES {Number(sale.amount || 0).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {!sales.length && (
                  <p className="text-slate-500 text-sm">No sales yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {!loading && activeTab === 'staff' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Staff List</h3>
              <div className="space-y-3">
                {staff.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-200">{member.name}</p>
                      <p className="text-slate-500 text-sm">{member.email} • {member.role}</p>
                    </div>
                    <span className="text-xs text-emerald-300">Active</span>
                  </div>
                ))}
                {!staff.length && (
                  <p className="text-slate-500 text-sm">No staff added yet.</p>
                )}
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Add Staff</h3>
              <form onSubmit={handleAddStaff} className="space-y-4">
                <input
                  type="text"
                  placeholder="Full name"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, name: e.target.value }))}
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, email: e.target.value }))}
                />
                <input
                  type="password"
                  placeholder="Temporary password"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, password: e.target.value }))}
                />
                <select
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                  value={newStaff.role}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="pump_attendant">Pump Attendant</option>
                  <option value="cashier">Cashier</option>
                </select>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-purple-400 text-slate-900 font-semibold py-2 rounded-lg"
                >
                  <Plus size={16} />
                  Add Staff
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
