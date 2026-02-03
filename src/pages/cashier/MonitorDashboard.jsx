import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { fetchMonitorStats } from '../../services/transactionService';

export default function MonitorDashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalExpenses: 0,
    netProfit: 0,
    transactionCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await fetchMonitorStats();
        setStats(data);
        setLoading(false);
        console.log('📊 [Monitor] Stats updated:', data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        setLoading(false);
      }
    };

    // Fetch immediately
    fetchStats();

    // Auto-refresh every 3 seconds
    const interval = setInterval(fetchStats, 3000);
    
    // Listen for sale/expense events to trigger immediate refresh
    const handleSaleComplete = () => {
      console.log('🔔 [Monitor] Sale completed, refreshing stats...');
      fetchStats();
    };
    
    const handleExpenseAdded = () => {
      console.log('🔔 [Monitor] Expense added, refreshing stats...');
      fetchStats();
    };
    
    window.addEventListener('sale_completed', handleSaleComplete);
    window.addEventListener('expense_added', handleExpenseAdded);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('sale_completed', handleSaleComplete);
      window.removeEventListener('expense_added', handleExpenseAdded);
    };
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin">
          <Zap size={48} className="text-blue-600" />
        </div>
        <p className="mt-4 text-gray-600">Loading statistics...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Sales */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Sales</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {stats.totalSales.toLocaleString()}
            </p>
            <p className="text-xs text-gray-600 mt-2">{stats.transactionCount} transactions</p>
          </div>
          <TrendingUp size={48} className="text-green-600 opacity-50" />
        </div>
      </div>

      {/* Total Expenses */}
      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Expenses</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {stats.totalExpenses.toLocaleString()}
            </p>
            <p className="text-xs text-gray-600 mt-2">Today's costs</p>
          </div>
          <TrendingDown size={48} className="text-red-600 opacity-50" />
        </div>
      </div>

      {/* Net Profit */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Net Profit</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {stats.netProfit.toLocaleString()}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              {stats.totalSales > 0 ? `${((stats.netProfit / stats.totalSales) * 100).toFixed(1)}%` : '0%'} margin
            </p>
          </div>
          <Zap size={48} className="text-blue-600 opacity-50" />
        </div>
      </div>

      {/* Profit Percentage */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Profit %</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {stats.totalSales > 0 ? ((stats.netProfit / stats.totalSales) * 100).toFixed(1) : '0'}%
            </p>
            <p className="text-xs text-gray-600 mt-2">Profitability</p>
          </div>
          <TrendingUp size={48} className="text-purple-600 opacity-50" />
        </div>
      </div>
    </div>
  );
}
