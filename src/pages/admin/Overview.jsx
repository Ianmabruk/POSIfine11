import { useState, useEffect } from 'react';
import { stats, sales as salesApi, products } from '../../services/api';
import { BASE_API_URL } from '../../services/api';
import { DollarSign, TrendingUp, TrendingDown, ShoppingBag, Package, AlertCircle, BarChart3 } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import SkeletonCard from '../../components/ui/SkeletonCard';
import EmptyState from '../../components/ui/EmptyState';


export default function Overview() {
  const [data, setData] = useState({ 
    stats: { totalSales: 0, totalExpenses: 0, profit: 0, grossProfit: 0, netProfit: 0, totalCOGS: 0, dailySales: 0, weeklySales: 0, productCount: 0 }, 
    recentSales: [],
    topProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
    const intervalId = window.setInterval(loadData, 30000);
    const handleFocus = () => loadData();
    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      const [statsData, salesData, topProductsData] = await Promise.all([
        stats.get(),
        salesApi.getAll({ limit: 20, sort: '-created_at' }),
        fetchTopProducts()
      ]);
      
      const validStats = {
        totalSales: statsData?.totalSales || 0,
        totalExpenses: statsData?.totalExpenses || 0,
        profit: statsData?.profit || 0,
        grossProfit: statsData?.grossProfit || ((statsData?.totalSales || 0) - (statsData?.totalCOGS || 0)),
        netProfit: statsData?.netProfit ?? statsData?.profit ?? 0,
        totalCOGS: statsData?.totalCOGS || 0,
        dailySales: statsData?.dailySales || 0,
        weeklySales: statsData?.weeklySales || 0,
        productCount: statsData?.productCount ?? statsData?.productsCount ?? 0
      };
      
      const validSales = Array.isArray(salesData) ? salesData : [];
      const validTopProducts = Array.isArray(topProductsData) ? topProductsData : [];
      
      setData({ 
        stats: validStats, 
        recentSales: validSales.slice(0, 10),
        topProducts: validTopProducts
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      setError(error.message);
      setData({ 
        stats: { totalSales: 0, totalExpenses: 0, profit: 0, grossProfit: 0, netProfit: 0, totalCOGS: 0, dailySales: 0, weeklySales: 0, productCount: 0 }, 
        recentSales: [],
        topProducts: []
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTopProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_API_URL}/admin/analytics/top-products?period=month`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Failed to load top products:', error);
      return [];
    }
  };


  if (loading) {
    return (
      <div className="p-6 space-y-8">
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="min-w-[200px] flex-1">
              <SkeletonCard variant="stat" />
            </div>
          ))}
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="min-w-[180px] flex-1">
              <SkeletonCard variant="stat" />
            </div>
          ))}
        </div>
        <SkeletonCard variant="chart" />
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
    <div className="p-6 space-y-8">

      {/* KPI Cards - horizontal row everywhere */}
      <div className="flex flex-nowrap gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {(kpis || []).map((kpi, index) => {
          const Icon = kpi?.icon;
          if (!Icon) return null;
          return (
            <div key={index} className="min-w-[200px] flex-1">
              <StatCard
                title={kpi.label}
                value={kpi.value}
                icon={Icon}
                color={kpi.color}
                trend="up"
                trendValue={kpi.change}
                delay={index * 100}
              />
            </div>
          );
        })}
      </div>

      {/* Summary Cards - horizontal row everywhere */}
      <div className="flex flex-nowrap gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {(summaryCards || []).map((card, index) => {
          const Icon = card?.icon;
          if (!Icon) return null;
          return (
            <div key={index} className="min-w-[180px] flex-1">
              <StatCard
                title={card.label}
                value={card.value}
                icon={Icon}
                color="from-gray-500 to-gray-600"
                delay={index * 100 + 400}
              />
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
          <EmptyState
            icon="no-sales"
            title="No sales yet"
            description="Sales will appear here once transactions are completed. Start processing sales to see your revenue data."
            actionLabel="View POS"
            onAction={() => window.open('/cashier', '_blank')}
          />
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {(data.recentSales || []).map((sale) => {
                if (!sale) return null;
                const cogs = sale.cogs ?? sale.total_cost ?? 0;
                const profit = sale.profit ?? sale.gross_profit ?? (sale.total || 0) - cogs;
                return (
                  <div key={sale.id || Math.random()} className="card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {sale.createdAt ? new Date(sale.createdAt).toLocaleString() : 'N/A'}
                      </span>
                      <span className="badge badge-success text-xs">{sale.paymentMethod || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{Array.isArray(sale.items) ? sale.items.length : 0} items</span>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                      <span className="text-gray-600">Total</span>
                      <span className="font-semibold text-green-600">KSH {sale.total?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">COGS</span>
                      <span className="text-orange-600">KSH {cogs?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Profit</span>
                      <span className="font-semibold text-blue-600">KSH {profit?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
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
                    const cogs = sale.cogs ?? sale.total_cost ?? 0;
                    const profit = sale.profit ?? sale.gross_profit ?? (sale.total || 0) - cogs;
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
                          KSH {cogs?.toLocaleString() || 0}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                          KSH {profit?.toLocaleString() || 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      {/* Most Selling Products */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-gray-50 p-6 mt-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 text-white shadow-lg">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Most Selling Products</h2>
              <p className="text-sm text-slate-600">Best sellers based on actual completed sales</p>
            </div>
          </div>
        </div>
        {!data.topProducts || data.topProducts.length === 0 ? (
          <EmptyState
            icon="no-sales"
            title="No sales data yet"
            description="Sales data will appear here once transactions are completed."
            actionLabel="View POS"
            onAction={() => window.open('/cashier', '_blank')}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {data.topProducts.map((product, index) => (
              <div key={product.productId || index} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-full h-24 bg-gray-50 rounded-xl mb-3 overflow-hidden flex items-center justify-center">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-10 h-10 text-gray-300" />
                  )}
                </div>
                <h3 className="font-semibold text-sm text-gray-900 truncate">{product.name}</h3>
                <p className="text-xs text-gray-500 mt-1">Sold: {product.quantitySold?.toLocaleString() || 0} {product.unit || 'pcs'}</p>
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">#{index + 1}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
