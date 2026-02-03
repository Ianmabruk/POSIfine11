import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Fuel, Users, BarChart3, Settings, Plus, Edit2, Trash2, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { api } from '../../services/enhancedApi';

export default function PetroleumDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [tanks, setTanks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({});
  const [showAddTank, setShowAddTank] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newTank, setNewTank] = useState({
    fuelType: '',
    capacity: '',
    currentVolume: '',
    pricePerLiter: ''
  });
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    password: '',
    role: 'pump_attendant'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load petroleum-specific data
      const [tanksData, staffData, salesData, statsData] = await Promise.all([
        fetch('/api/petroleum/tanks').then(r => r.json()),
        fetch('/api/petroleum/staff').then(r => r.json()),
        fetch('/api/petroleum/sales').then(r => r.json()),
        api.stats.getDashboard()
      ]);

      setTanks(tanksData);
      setStaff(staffData);
      setSales(salesData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load petroleum data:', error);
    }
  };

  const handleAddTank = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/petroleum/tanks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTank)
      });

      if (response.ok) {
        const tank = await response.json();
        setTanks([...tanks, tank]);
        setNewTank({ fuelType: '', capacity: '', currentVolume: '', pricePerLiter: '' });
        setShowAddTank(false);
      }
    } catch (error) {
      console.error('Failed to add tank:', error);
    }
  };

  const getFuelIcon = (fuelType) => {
    switch (fuelType?.toLowerCase()) {
      case 'petrol':
      case 'gasoline':
        return '⛽';
      case 'diesel':
        return '🚛';
      case 'kerosene':
        return '🛢️';
      default:
        return '⛽';
    }
  };

  const getTankStatus = (tank) => {
    const percentage = (tank.currentVolume / tank.capacity) * 100;
    if (percentage <= 10) return { status: 'critical', color: 'red' };
    if (percentage <= 25) return { status: 'low', color: 'yellow' };
    return { status: 'normal', color: 'green' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Fuel className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Petroleum Station</h1>
                <p className="text-sm text-gray-600">Fuel management & operations</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.businessName}</p>
              <p className="text-xs text-gray-500">Pro Plan - Petroleum</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'tanks', label: 'Fuel Tanks', icon: Fuel },
              { id: 'staff', label: 'Staff', icon: Users },
              { id: 'sales', label: 'Sales', icon: DollarSign }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-blue-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Sales</p>
                    <p className="text-2xl font-bold text-gray-900">KSH {stats.totalSales?.toLocaleString() || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-blue-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Active Tanks</p>
                    <p className="text-2xl font-bold text-gray-900">{tanks.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Fuel className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-blue-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Staff Members</p>
                    <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-blue-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Today's Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">{sales.filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString()).length}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Tank Status Overview */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tank Status Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tanks.map(tank => {
                  const status = getTankStatus(tank);
                  const percentage = (tank.currentVolume / tank.capacity) * 100;
                  
                  return (
                    <div key={tank.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getFuelIcon(tank.fuelType)}</span>
                          <span className="font-semibold text-gray-900">{tank.fuelType}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          status.color === 'red' ? 'bg-red-100 text-red-700' :
                          status.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {status.status}
                        </span>
                      </div>
                      <div className="mb-2">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>{tank.currentVolume}L</span>
                          <span>{tank.capacity}L</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              status.color === 'red' ? 'bg-red-500' :
                              status.color === 'yellow' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        KSH {tank.pricePerLiter}/L
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tanks Tab */}
        {activeTab === 'tanks' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Fuel Tanks</h2>
              <button
                onClick={() => setShowAddTank(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Tank
              </button>
            </div>

            {/* Add Tank Form */}
            {showAddTank && (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Tank</h3>
                <form onSubmit={handleAddTank} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <select
                    value={newTank.fuelType}
                    onChange={(e) => setNewTank({...newTank, fuelType: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Fuel Type</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Kerosene">Kerosene</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Capacity (L)"
                    value={newTank.capacity}
                    onChange={(e) => setNewTank({...newTank, capacity: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Current Volume (L)"
                    value={newTank.currentVolume}
                    onChange={(e) => setNewTank({...newTank, currentVolume: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price per Liter"
                    value={newTank.pricePerLiter}
                    onChange={(e) => setNewTank({...newTank, pricePerLiter: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <div className="flex gap-2 md:col-span-4">
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                      Add Tank
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowAddTank(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tanks List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tanks.map(tank => {
                const status = getTankStatus(tank);
                const percentage = (tank.currentVolume / tank.capacity) * 100;
                
                return (
                  <motion.div
                    key={tank.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-blue-100"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{getFuelIcon(tank.fuelType)}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">{tank.fuelType}</h3>
                          <p className="text-sm text-gray-600">Tank #{tank.id}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Current: {tank.currentVolume}L</span>
                        <span>Capacity: {tank.capacity}L</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all ${
                            status.color === 'red' ? 'bg-red-500' :
                            status.color === 'yellow' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600">{percentage.toFixed(1)}% full</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          status.color === 'red' ? 'bg-red-100 text-red-700' :
                          status.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {status.status}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Price per Liter</span>
                        <span className="font-semibold text-gray-900">KSH {tank.pricePerLiter}</span>
                      </div>
                    </div>

                    {status.color === 'red' && (
                      <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Critical - Refill needed</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}