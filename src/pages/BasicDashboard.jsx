import { useState, useEffect } from 'react';
import { BASE_API_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Package, DollarSign, TrendingUp, ShoppingCart, Trash2, LogOut } from 'lucide-react';
import { products, sales } from '../services/api';

export default function BasicDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    products: 0,
    sales: 0,
    revenue: 0,
    profit: 0
  });
  const [recentSales, setRecentSales] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, salesData] = await Promise.all([
        products.getAll(),
        sales.getAll()
      ]);

      const todaySales = salesData.filter(sale => 
        new Date(sale.createdAt).toDateString() === new Date().toDateString()
      );

      const revenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
      const profit = todaySales.reduce((sum, sale) => sum + (sale.profit || 0), 0);

      setStats({
        products: productsData.length,
        sales: todaySales.length,
        revenue,
        profit
      });

      setRecentSales(salesData.slice(-5).reverse());
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to clear all sales and data? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        const API_URL = BASE_API_URL;
        
        await fetch(`${API_URL}/clear-data`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ type: 'all' })
        });
        
        setStats({ products: 0, sales: 0, revenue: 0, profit: 0 });
        setRecentSales([]);
        alert('Data cleared successfully!');
        await loadData();
      } catch (error) {
        console.error('Failed to clear data:', error);
        alert('Failed to clear data');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.name}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleClearData} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                <Trash2 className="w-4 h-4" />
                Clear Data
              </button>
              <button onClick={logout} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Products</p>
                <p className="text-3xl font-bold text-gray-900">{stats.products}</p>
              </div>
              <Package className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Today's Sales</p>
                <p className="text-3xl font-bold text-gray-900">{stats.sales}</p>
              </div>
              <ShoppingCart className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Revenue</p>
                <p className="text-3xl font-bold text-gray-900">KSH {stats.revenue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-12 h-12 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Profit</p>
                <p className="text-3xl font-bold text-gray-900">KSH {stats.profit.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Recent Sales</h2>
          {recentSales.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No sales yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Items</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map(sale => (
                    <tr key={sale.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {sale.items?.length || 0} items
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        KSH {sale.total.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {sale.paymentMethod || 'Cash'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <button 
            onClick={() => window.location.href = '/products'}
            className="bg-blue-600 text-white p-6 rounded-xl hover:bg-blue-700 transition-all"
          >
            <Package className="w-8 h-8 mb-2" />
            <h3 className="font-bold">Manage Products</h3>
            <p className="text-sm opacity-90">Add and edit your inventory</p>
          </button>

          <button 
            onClick={() => window.location.href = '/pos'}
            className="bg-green-600 text-white p-6 rounded-xl hover:bg-green-700 transition-all"
          >
            <ShoppingCart className="w-8 h-8 mb-2" />
            <h3 className="font-bold">Make Sale</h3>
            <p className="text-sm opacity-90">Process customer orders</p>
          </button>

          <button 
            onClick={() => window.location.href = '/reports'}
            className="bg-purple-600 text-white p-6 rounded-xl hover:bg-purple-700 transition-all"
          >
            <TrendingUp className="w-8 h-8 mb-2" />
            <h3 className="font-bold">View Reports</h3>
            <p className="text-sm opacity-90">Check sales analytics</p>
          </button>
        </div>
      </div>
    </div>
  );
}