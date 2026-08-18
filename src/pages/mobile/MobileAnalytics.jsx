import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { stats, sales as salesApi, products } from '../../services/api';
import { DollarSign, TrendingUp, TrendingDown, ShoppingBag, Package, ArrowLeft, BarChart3 } from 'lucide-react';

export default function MobileAnalytics() {
  const navigate = useNavigate();
  const [statsData, setStatsData] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, salesRes] = await Promise.all([
        stats.get(),
        salesApi.getAll({ limit: 20, sort: '-created_at' })
      ]);
      setStatsData(statsRes);
      setRecentSales(Array.isArray(salesRes) ? salesRes : []);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/mobile')} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
        </div>
        <div className="text-center py-8 text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  const totalRevenue = statsData?.totalSales || 0;
  const totalProfit = statsData?.profit || 0;
  const totalTransactions = statsData?.salesCount || 0;
  const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/mobile')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 font-medium">Total Revenue</p>
          </div>
          <p className="text-lg font-bold text-gray-900">KSH {totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 font-medium">Total Profit</p>
          </div>
          <p className="text-lg font-bold text-gray-900">KSH {totalProfit.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-xs text-gray-500 font-medium">Transactions</p>
          </div>
          <p className="text-lg font-bold text-gray-900">{totalTransactions}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <Package className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-xs text-gray-500 font-medium">Avg Transaction</p>
          </div>
          <p className="text-lg font-bold text-gray-900">KSH {Math.round(avgTransaction).toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Performance</h3>
        {recentSales.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No sales data available yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentSales.slice(0, 10).map((sale, idx) => (
              <div key={sale.id || idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">KSH {sale.total?.toLocaleString() || 0}</p>
                  <p className="text-xs text-gray-500">{sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : 'N/A'}</p>
                </div>
                <span className="text-xs font-medium text-gray-500">{sale.paymentMethod || 'N/A'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
