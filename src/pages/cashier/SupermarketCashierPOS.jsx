import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CashierPOS from '../CashierPOS';
import { ShoppingCart, LogOut, Barcode } from 'lucide-react';

export default function SupermarketCashierPOS() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [dayStats, setDayStats] = useState({ sales: 0, count: 0 });
  const [posPerformance, setPosPerformance] = useState({ avgCheckout: 0, successRate: 100 });
  const [statsError, setStatsError] = useState(null);
  const [performanceError, setPerformanceError] = useState(null);

  useEffect(() => {
    const statsStart = performance.now();
    try {
      const stats = JSON.parse(localStorage.getItem('dayStats') || '{"sales": 0, "count": 0}');
      setDayStats(stats);
      setStatsError(null);
      window.frontendMonitor?.trackMetric('load_day_stats', {
        durationMs: performance.now() - statsStart,
        success: true
      });
    } catch (error) {
      setDayStats({ sales: 0, count: 0 });
      setStatsError('Unable to load today\'s stats');
      window.frontendMonitor?.trackError('local_storage_error', {
        key: 'dayStats',
        message: error?.message
      });
      window.frontendMonitor?.trackMetric('load_day_stats', {
        durationMs: performance.now() - statsStart,
        success: false
      });
    }
    
    // Track page view
    window.frontendMonitor?.trackUserAction('page_view', { page: 'supermarket_pos' });
    
    // Load performance metrics
    const loadPerformance = () => {
      const perfStart = performance.now();
      try {
        const metrics = window.__transactionMetrics?.getStats?.('sales');
        if (metrics && metrics.count > 0) {
          setPosPerformance({
            avgCheckout: Math.round(metrics.avg),
            successRate: 100
          });
        }
        setPerformanceError(null);
        window.frontendMonitor?.trackMetric('load_pos_performance', {
          durationMs: performance.now() - perfStart,
          success: true
        });
      } catch (error) {
        setPerformanceError('Performance metrics unavailable');
        window.frontendMonitor?.trackError('performance_metrics_error', {
          message: error?.message
        });
        window.frontendMonitor?.trackMetric('load_pos_performance', {
          durationMs: performance.now() - perfStart,
          success: false
        });
      }
    };

    loadPerformance();
  }, []);

  const handleLogout = () => {
    window.frontendMonitor?.trackUserAction('logout', { from: 'supermarket_pos' });
    logout();
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50">
      <div className="bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#22c55e] to-[#f59e0b] flex items-center justify-center text-white shadow">
              <ShoppingCart size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Supermarket POS</h1>
              <p className="text-slate-500 text-sm">Barcode • Bulk • Fast checkout</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 w-full sm:w-auto">
            <div className="text-left sm:text-right w-full sm:w-auto">
              <p className="text-slate-500 text-sm">Today's Sales</p>
              <p className="text-2xl font-bold text-emerald-600">{dayStats.sales.toLocaleString()} KES</p>
              <p className="text-slate-400 text-xs">{dayStats.count} transactions</p>
              <div className="mt-1 text-xs text-slate-400">
                Avg: {posPerformance.avgCheckout}ms • {posPerformance.successRate}% success
              </div>
              {(statsError || performanceError) && (
                <div className="mt-1 text-xs text-amber-600">
                  {statsError || performanceError}
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-3 sm:py-2 min-h-[44px] rounded-lg text-white transition text-sm sm:text-base touch-manipulation w-full sm:w-auto"
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
