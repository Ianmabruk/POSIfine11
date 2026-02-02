import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CashierPOS from '../CashierPOS';
import { ShoppingCart, LogOut, Barcode } from 'lucide-react';
// import { monitoredRequest } from '../../services/monitoring';

export default function SupermarketCashierPOS() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [dayStats, setDayStats] = useState({ sales: 0, count: 0 });
  const [performance, setPerformance] = useState({ avgCheckout: 0, successRate: 100 });

  useEffect(() => {
    const stats = JSON.parse(localStorage.getItem('dayStats') || '{"sales": 0, "count": 0}');
    setDayStats(stats);
    
    // Track page view
    window.frontendMonitor?.trackUserAction('page_view', { page: 'supermarket_pos' });
    
    // Load performance metrics
    // const loadPerformance = async () => {
    //   try {
    //     const data = await monitoredRequest('/api/stats/performance');
    //     setPerformance(data);
    //   } catch (error) {
    //     console.warn('Failed to load performance metrics:', error);
    //   }
    // };
    
    // loadPerformance();
  }, []);

  const handleLogout = () => {
    window.frontendMonitor?.trackUserAction('logout', { from: 'supermarket_pos' });
    logout();
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50">
      <div className="bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#22c55e] to-[#f59e0b] flex items-center justify-center text-white shadow">
              <ShoppingCart size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Supermarket POS</h1>
              <p className="text-slate-500 text-sm">Barcode • Bulk • Fast checkout</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-slate-500 text-sm">Today's Sales</p>
              <p className="text-2xl font-bold text-emerald-600">{dayStats.sales.toLocaleString()} KES</p>
              <p className="text-slate-400 text-xs">{dayStats.count} transactions</p>
              <div className="mt-1 text-xs text-slate-400">
                Avg: {performance.avgCheckout}ms • {performance.successRate}% success
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white">
        <CashierPOS businessType="supermarket" />
      </div>

      <div className="bg-slate-900 text-white py-3 text-center">
        <div className="flex items-center justify-center gap-2 text-sm">
          <Barcode size={16} className="text-amber-300" />
          Scan ready • Fast lanes • Real-time inventory
        </div>
      </div>
    </div>
  );
}
