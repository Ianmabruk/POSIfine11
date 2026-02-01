import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Droplet, Fuel, LogOut, Zap } from 'lucide-react';
import { petroleumService } from '../../services/petroleumService';

export default function PetrolCashierPOS() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tanks, setTanks] = useState([]);
  const [sales, setSales] = useState([]);
  const [selectedFuel, setSelectedFuel] = useState('Petrol');
  const [pumpNumber, setPumpNumber] = useState('1');
  const [liters, setLiters] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.subscription !== 'PRO_PETROLEUM') return;
    loadPetroleumData();
  }, [user?.subscription]);

  const loadPetroleumData = async () => {
    try {
      const [tanksData, salesData] = await Promise.all([
        petroleumService.getTanks(),
        petroleumService.getSales({ limit: 100 })
      ]);
      setTanks(Array.isArray(tanksData) ? tanksData : []);
      setSales(Array.isArray(salesData) ? salesData : []);
    } catch (error) {
      console.error('Failed to load petroleum data:', error);
      alert(error.message || 'Failed to load petroleum data');
    }
  };

  const selectedTank = useMemo(() => {
    return tanks.find(tank => (tank.fuel_type || '').toLowerCase() === selectedFuel.toLowerCase());
  }, [tanks, selectedFuel]);

  const amount = useMemo(() => {
    const price = Number(selectedTank?.price_per_liter || 0);
    return price * Number(liters || 0);
  }, [selectedTank, liters]);

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

  const handleCompleteSale = async () => {
    if (!selectedTank) {
      alert('Select a valid fuel tank first.');
      return;
    }
    if (!liters || Number(liters) <= 0) {
      alert('Enter liters sold.');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await petroleumService.createSale({
        fuelType: selectedFuel,
        liters: Number(liters),
        pumpNumber
      });

      setSales(prev => [created, ...prev]);
      setTanks(prev => prev.map(tank => {
        if (tank.id === selectedTank.id) {
          return { ...tank, current_volume: tank.current_volume - Number(liters) };
        }
        return tank;
      }));
      setLiters('');
      alert('✅ Sale completed and tank updated.');
    } catch (error) {
      console.error('Sale failed:', error);
      alert(error.message || 'Sale failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  if (user.subscription !== 'PRO_PETROLEUM') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-lg text-center space-y-4">
          <h1 className="text-3xl font-bold">Petroleum POS Locked</h1>
          <p className="text-slate-300">Upgrade to PRO_PETROLEUM to access petroleum staff tools.</p>
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
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
              <Fuel className="text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Petroleum Staff Console</h1>
              <p className="text-slate-400 text-sm">Pump operations • Real-time tank tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-slate-400">Today&apos;s Volume</p>
              <p className="text-2xl font-bold text-cyan-300">{dailyTotals.liters.toLocaleString()} L</p>
              <p className="text-xs text-slate-500">KES {dailyTotals.revenue.toLocaleString()}</p>
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
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Pump Selector</h2>
            <div className="flex flex-wrap gap-3">
              {[1, 2, 3, 4, 5, 6].map((pump) => (
                <button
                  key={pump}
                  onClick={() => setPumpNumber(String(pump))}
                  className={`px-4 py-2 rounded-lg font-semibold border transition ${
                    pumpNumber === String(pump)
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                      : 'border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <Droplet size={16} className="inline mr-2" />
                  Pump {pump}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Fuel Sale</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400">Fuel Type</label>
                <select
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 mt-2"
                  value={selectedFuel}
                  onChange={(e) => setSelectedFuel(e.target.value)}
                >
                  {tanks.map((tank) => (
                    <option key={tank.id} value={tank.fuel_type}>{tank.fuel_type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-400">Liters Sold</label>
                <input
                  type="number"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 mt-2"
                  value={liters}
                  onChange={(e) => setLiters(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="mt-6 bg-slate-950 border border-cyan-500/20 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Auto-calculated Amount</p>
                <p className="text-3xl font-bold text-cyan-300">KES {amount.toLocaleString()}</p>
              </div>
              <button
                onClick={handleCompleteSale}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-cyan-400 text-slate-900 font-semibold px-6 py-3 rounded-xl disabled:opacity-50"
              >
                <Zap size={18} />
                {isSubmitting ? 'Processing...' : 'Complete Sale'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Fuel Meter</h2>
            {selectedTank ? (
              <div>
                <p className="text-sm text-slate-400">{selectedTank.fuel_type} Tank</p>
                <div className="mt-3 h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-lime-300 animate-pulse"
                    style={{
                      width: `${Math.min(100, (selectedTank.current_volume / selectedTank.capacity) * 100)}%`
                    }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">{selectedTank.current_volume} L / {selectedTank.capacity} L</p>
              </div>
            ) : (
              <p className="text-slate-500">No tank available for selected fuel.</p>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Latest Sales</h2>
            <div className="space-y-3">
              {sales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="text-sm flex justify-between">
                  <div>
                    <p className="text-slate-300">{sale.fuel_type} • Pump {sale.pump_number || 'N/A'}</p>
                    <p className="text-slate-500">{new Date(sale.created_at).toLocaleTimeString()}</p>
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
      </div>
    </div>
  );
}
