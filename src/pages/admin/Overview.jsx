import { useState, useEffect } from 'react';
import { stats, sales as salesApi } from '../../services/api';
import { DollarSign, TrendingUp, TrendingDown, ShoppingBag, Package, AlertCircle } from 'lucide-react';


export default function Overview() {
  const [data, setData] = useState({ 
    stats: { totalSales: 0, totalExpenses: 0, profit: 0, grossProfit: 0, netProfit: 0, totalCOGS: 0, dailySales: 0, weeklySales: 0, productCount: 0 }, 
    recentSales: [] 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      const [statsData, salesData] = await Promise.all([
        stats.get(),
        salesApi.getAll()
      ]);
      
      // Ensure we have valid data structures with comprehensive defaults
      const validStats = {
        totalSales: statsData?.totalSales || 0,
        totalExpenses: statsData?.totalExpenses || 0,
        profit: statsData?.profit || 0,
        grossProfit: statsData?.grossProfit || 0,
        netProfit: statsData?.netProfit || 0,
        totalCOGS: statsData?.totalCOGS || 0,
        dailySales: statsData?.dailySales || 0,
        weeklySales: statsData?.weeklySales || 0,
        productCount: statsData?.productCount || 0
      };
      
      // Ensure sales data is always an array
      const validSales = Array.isArray(salesData) ? salesData : [];
      
      setData({ 
        stats: validStats, 
        recentSales: validSales.slice(-10).reverse() 
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      setError(error.message);
      // Set empty data on error
      setData({ 
        stats: { totalSales: 0, totalExpenses: 0, profit: 0, grossProfit: 0, netProfit: 0, totalCOGS: 0, dailySales: 0, weeklySales: 0, productCount: 0 }, 
        recentSales: [] 
      });
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error boundary component
  if (error && data.stats.totalSales === 0 && data.recentSales.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Unable to Load Dashboard</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadData}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Total Sales',
      value: `KSH ${data.stats.totalSales?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600',
      change: '+12.5%'
    },
    {
      label: 'Gross Profit',
      value: `KSH ${data.stats.grossProfit?.toLocaleString() || 0}`,
      icon: TrendingUp,
      color: 'from-blue-500 to-indigo-600',
      change: '+8.2%'
    },
    {
      label: 'Total COGS',
      value: `KSH ${data.stats.totalCOGS?.toLocaleString() || 0}`,
      icon: Package,
      color: 'from-orange-500 to-red-600',
      change: '+5.1%'
    },
    {
      label: 'Net Profit',
      value: `KSH ${data.stats.netProfit?.toLocaleString() || 0}`,
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-600',
      change: '+15.3%'
    }
  ];

  const summaryCards = [
    {
      label: 'Daily Sales',
      value: `KSH ${data.stats.dailySales?.toLocaleString() || 0}`,
      icon: ShoppingBag,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      label: 'Weekly Sales',
      value: `KSH ${data.stats.weeklySales?.toLocaleString() || 0}`,
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600'
    },
    {
      label: 'Total Expenses',
      value: `KSH ${data.stats.totalExpenses?.toLocaleString() || 0}`,
      icon: TrendingDown,
      color: 'bg-red-50 text-red-600'
    },
    {
      label: 'Products',
      value: data.stats.productCount || 0,
      icon: Package,
      color: 'bg-purple-50 text-purple-600'
    }
  ];

  return (
    <div className="p-6 space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(kpis || []).map((kpi, index) => {
          const Icon = kpi?.icon;
          if (!Icon) return null;
          return (
            <div key={index} className={`card bg-gradient-to-br ${kpi.color} text-white border-0 shadow-lg hover:shadow-xl transition-all transform hover:scale-105`}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold bg-white/20 px-2 py-1 rounded-full">
                  {kpi.change}
                </span>
              </div>
              <p className="text-sm text-white/80 mb-1">{kpi.label}</p>
              <p className="text-2xl font-bold">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(summaryCards || []).map((card, index) => {
          const Icon = card?.icon;
          if (!Icon) return null;
          return (
            <div key={index} className="card">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{card.label}</p>
                  <p className="text-xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Sales */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Recent Sales</h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All
          </button>
        </div>
        

        {(!data.recentSales || data.recentSales.length === 0) ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No sales yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date & Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Items</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Payment</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">COGS</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Profit</th>
                </tr>
              </thead>
              <tbody>
                {(data.recentSales || []).map((sale) => {
                  if (!sale) return null;
                  return (
                    <tr key={sale.id || Math.random()} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm">{sale.createdAt ? new Date(sale.createdAt).toLocaleString() : 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">{Array.isArray(sale.items) ? sale.items.length : 0} items</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="badge badge-success">{sale.paymentMethod || 'N/A'}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">
                        KSH {sale.total?.toLocaleString() || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-orange-600">
                        KSH {sale.cogs?.toLocaleString() || 0}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                        KSH {sale.profit?.toLocaleString() || 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
