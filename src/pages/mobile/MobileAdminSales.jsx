import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sales as salesApi } from '../../services/api';
import { ShoppingBag, TrendingUp, TrendingDown, DollarSign, ArrowLeft } from 'lucide-react';
import websocketService from '../../services/websocketService';

export default function MobileAdminSales() {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSales = async () => {
      try {
        const data = await salesApi.getAll({ limit: 50, sort: '-created_at' });
        setSales(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load sales:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSales();
  }, []);

  useEffect(() => {
    const handleSaleCompleted = (sale) => {
      setSales(prev => {
        const exists = prev.some(s => s.id === sale.id);
        if (exists) return prev;
        return [sale, ...prev].slice(0, 50);
      });
    };

    const token = localStorage.getItem('token');
    if (token) {
      websocketService.connect(token, handleSaleCompleted).catch(() => {});
      websocketService.on('sale_completed', handleSaleCompleted);
    }

    return () => {
      websocketService.disconnect();
    };
  }, []);

  const totalSales = sales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/mobile')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Sales</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 font-medium">Total Sales</p>
          </div>
          <p className="text-lg font-bold text-gray-900">KSH {totalSales.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 font-medium">Transactions</p>
          </div>
          <p className="text-lg font-bold text-gray-900">{sales.length}</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Transactions</h3>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading sales...</div>
        ) : sales.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center border border-gray-100">
            <p className="text-gray-500 text-sm">No sales yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sales.slice(0, 20).map((sale) => (
              <div key={sale.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    {sale.createdAt ? new Date(sale.createdAt).toLocaleString() : 'N/A'}
                  </span>
                  <span className="badge badge-success text-xs">{sale.paymentMethod || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{Array.isArray(sale.items) ? sale.items.length : 0} items</span>
                  <span className="font-semibold text-green-600">KSH {sale.total?.toLocaleString() || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
