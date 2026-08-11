import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  ShoppingCart,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Download
} from 'lucide-react';
import { BASE_API_URL } from '../../services/api';
import { exportAnalyticsPDF } from '../../utils/exportData';

export default function Analytics() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7days');
  const [chartType, setChartType] = useState('bar');
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [salesRes, productsRes] = await Promise.all([
        fetch(`${BASE_API_URL}/sales`, { headers }),
        fetch(`${BASE_API_URL}/products`, { headers })
      ]);

      const salesData = salesRes.ok ? await salesRes.json() : [];
      const productsData = productsRes.ok ? await productsRes.json() : [];

      setSales(Array.isArray(salesData) ? salesData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter sales by date range
  const getFilteredSales = () => {
    const now = new Date();
    const ranges = {
      '7days': 7,
      '30days': 30,
      '90days': 90,
      'all': 9999
    };
    const days = ranges[dateRange] || 7;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return sales.filter(sale => {
      const rawDate = sale.created_at || sale.createdAt || sale.date || sale.timestamp;
      const saleDate = rawDate ? new Date(rawDate) : null;
      return saleDate && saleDate >= startDate;
    });
  };

  // Calculate product sales statistics
  const getProductStats = () => {
    const filteredSales = getFilteredSales();
    const productSales = {};

    filteredSales.forEach(sale => {
      if (sale.items) {
        sale.items.forEach(item => {
          const productId = item.product_id ?? item.productId ?? item.id;
          if (!productId) return;

          if (!productSales[productId]) {
            const product = products.find(p => p.id === productId);
            productSales[productId] = {
              name: item.name || product?.name || 'Unknown',
              quantity: 0,
              revenue: 0,
              profit: 0,
              count: 0
            };
          }
          productSales[productId].quantity += item.quantity || 0;
          productSales[productId].revenue += (item.price || 0) * (item.quantity || 0);
          const product = products.find(p => p.id === productId);
          const cost = product?.cost_per_unit ?? product?.cost ?? 0;
          productSales[productId].profit += ((item.price || 0) - cost) * (item.quantity || 0);
          productSales[productId].count += 1;
        });
      }
    });

    return Object.values(productSales).sort((a, b) => b.revenue - a.revenue);
  };

  // Calculate daily sales trend
  const getDailySalesTrend = () => {
    const filteredSales = getFilteredSales();
    const dailySales = {};

    filteredSales.forEach(sale => {
      const rawDate = sale.created_at || sale.createdAt || sale.date || sale.timestamp;
      if (!rawDate) return;
      const date = new Date(rawDate).toLocaleDateString();
      if (!dailySales[date]) {
        dailySales[date] = { date, revenue: 0, count: 0 };
      }
      dailySales[date].revenue += sale.total || 0;
      dailySales[date].count += 1;
    });

    return Object.values(dailySales).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    const filteredSales = getFilteredSales();
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const totalTransactions = filteredSales.length;
    const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Calculate total profit
    const totalProfit = filteredSales.reduce((sum, sale) => {
      if (!sale.items) return sum;
      return sum + sale.items.reduce((itemSum, item) => {
        const productId = item.product_id ?? item.productId ?? item.id;
        const product = products.find(p => p.id === productId);
        const cost = product?.cost_per_unit ?? product?.cost ?? 0;
        return itemSum + ((item.price || 0) - cost) * (item.quantity || 0);
      }, 0);
    }, 0);

    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return { totalRevenue, totalTransactions, avgTransaction, totalProfit, profitMargin };
  };

  const stats = getSummaryStats();
  const productStats = getProductStats();
  const dailyTrend = getDailySalesTrend();

  // Calculate max revenue for chart scaling
  const maxRevenue = Math.max(...dailyTrend.map(d => d.revenue), 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your business performance and trends</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
          <div className="relative">
            <button 
              onClick={() => setExportOpen(!exportOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            {exportOpen && (
              <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px]">
                <button
                  onClick={() => { exportAnalyticsPDF(productStats, stats); setExportOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-lg"
                >
                  Export PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                KES {stats.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-sm text-green-600">
            <TrendingUp className="w-4 h-4" />
            <span>Revenue generated</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Profit</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                KES {stats.totalProfit.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-sm text-blue-600">
            <span>{stats.profitMargin.toFixed(1)}% Margin</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Transactions</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.totalTransactions}
              </p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <ShoppingCart className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-sm text-purple-600">
            <span>Total sales count</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Avg Transaction</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                KES {stats.avgTransaction.toLocaleString()}
              </p>
            </div>
            <div className="bg-orange-100 rounded-full p-3">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-sm text-orange-600">
            <span>Per sale average</span>
          </div>
        </motion.div>
      </div>

      {/* Sales Trend Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Sales Trend</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setChartType('bar')}
              className={`p-2 rounded-lg ${chartType === 'bar' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
            >
              <BarChart3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`p-2 rounded-lg ${chartType === 'line' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
            >
              <TrendingUp className="w-5 h-5" />
            </button>
          </div>
        </div>

        {dailyTrend.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No sales data available for selected period</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Bar Chart */}
            {chartType === 'bar' && (
              <div className="space-y-3">
                {dailyTrend.map((day, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-24 text-sm text-gray-600">{day.date}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-10 relative overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(day.revenue / maxRevenue) * 100}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.05 }}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full flex items-center justify-end pr-3"
                      >
                        <span className="text-white text-sm font-medium">
                          KES {day.revenue.toLocaleString()}
                        </span>
                      </motion.div>
                    </div>
                    <div className="w-16 text-sm text-gray-600 text-right">{day.count} sales</div>
                  </div>
                ))}
              </div>
            )}

            {/* Line Chart (Simple) */}
            {chartType === 'line' && (
              <div className="relative h-64">
                <svg className="w-full h-full">
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map(percent => (
                    <line
                      key={percent}
                      x1="0"
                      y1={`${100 - percent}%`}
                      x2="100%"
                      y2={`${100 - percent}%`}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                    />
                  ))}
                  
                  {/* Line path */}
                  <motion.polyline
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5 }}
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="3"
                    points={dailyTrend.map((day, idx) => {
                      const x = (idx / (dailyTrend.length - 1)) * 100;
                      const y = 100 - (day.revenue / maxRevenue) * 90;
                      return `${x}%,${y}%`;
                    }).join(' ')}
                  />
                  
                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                  
                  {/* Data points */}
                  {dailyTrend.map((day, idx) => {
                    const x = (idx / (dailyTrend.length - 1)) * 100;
                    const y = 100 - (day.revenue / maxRevenue) * 90;
                    return (
                      <circle
                        key={idx}
                        cx={`${x}%`}
                        cy={`${y}%`}
                        r="4"
                        fill="#3b82f6"
                      />
                    );
                  })}
                </svg>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Top Products Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-6">Top Selling Products</h2>
        
        {productStats.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No product sales data available</p>
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {productStats.slice(0, 10).map((product, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-2 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                        idx === 1 ? 'bg-gray-100 text-gray-700' :
                        idx === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-50 text-gray-600'
                      }`}>
                        {idx + 1}
                      </div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm pl-11">
                    <div>
                      <span className="text-xs text-gray-500 block">Qty Sold</span>
                      <span className="font-medium">{product.quantity}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Revenue</span>
                      <span className="font-medium">KES {product.revenue.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Profit</span>
                      <span className={`font-medium ${product.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        KES {product.profit.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Sales Count</span>
                      <span className="text-gray-600">{product.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Rank</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Product</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Quantity Sold</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Revenue</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Profit</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Sales Count</th>
                </tr>
              </thead>
              <tbody>
                {productStats.slice(0, 10).map((product, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                        idx === 1 ? 'bg-gray-100 text-gray-700' :
                        idx === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-50 text-gray-600'
                      }`}>
                        {idx + 1}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium text-gray-900">{product.name}</p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-gray-900">{product.quantity}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-medium text-gray-900">KES {product.revenue.toLocaleString()}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className={`font-medium ${product.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        KES {product.profit.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-gray-600">{product.count}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
       </motion.div>
    </div>
  );
}
