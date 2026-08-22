import { useState, useEffect } from 'react';
import { sales as salesApi, BASE_API_URL } from '../../services/api';
import { Calendar, Download, Filter, Trash2, Trash, ChevronDown, Wallet, Landmark, Smartphone, CreditCard } from 'lucide-react';
import { exportSalesPDF, exportSalesDetailedPDF } from '../../utils/exportData';
import websocketService from '../../services/websocketService';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedSales, setSelectedSales] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    loadSales();
  }, []);

  useEffect(() => {
    const handleSaleCompleted = (sale) => {
      setSales(prev => {
        const exists = prev.some(s => s.id === sale.id);
        if (exists) return prev;
        return [sale, ...prev];
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

  const loadSales = async () => {
    const data = await salesApi.getAll();
    setSales(data.reverse());
  };

  const deleteSale = async (saleId) => {
    if (!window.confirm('Delete this sale? This action cannot be undone.')) return;
    
    try {
      setDeleting(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_API_URL}/sales/${saleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to delete sale');
      
      setSales(sales.filter(s => s.id !== saleId));
      alert('Sale deleted successfully');
    } catch (error) {
      alert('Failed to delete sale: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const bulkDeleteSales = async () => {
    if (selectedSales.length === 0) {
      alert('No sales selected');
      return;
    }
    
    if (!window.confirm(`Delete ${selectedSales.length} sales? This action cannot be undone.`)) return;
    
    try {
      setDeleting(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_API_URL}/sales/bulk-delete`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ saleIds: selectedSales })
      });
      
      if (!response.ok) throw new Error('Failed to delete sales');
      
      setSales(sales.filter(s => !selectedSales.includes(s.id)));
      setSelectedSales([]);
      alert('Sales deleted successfully');
    } catch (error) {
      alert('Failed to delete sales: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const clearAllSales = async () => {
    if (!window.confirm('Clear ALL sales data? This will delete everything and cannot be undone.')) return;
    
    try {
      setDeleting(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_API_URL}/clear-data`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: 'sales' })
      });
      
      if (!response.ok) throw new Error('Failed to clear sales');
      
      setSales([]);
      setSelectedSales([]);
      alert('All sales data cleared');
    } catch (error) {
      alert('Failed to clear sales: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredSales = sales.filter(sale => {
    if (filter === 'today') {
      return new Date(sale.createdAt).toDateString() === new Date().toDateString();
    }
    if (filter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(sale.createdAt) >= weekAgo;
    }
    return true;
  });

  const totalSales = filteredSales.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalCOGS = filteredSales.reduce((sum, s) => sum + (s.cogs ?? s.total_cost ?? 0), 0);
  const totalProfit = filteredSales.reduce((sum, s) => {
    const cogs = s.cogs ?? s.total_cost ?? 0;
    const profit = s.profit ?? s.gross_profit ?? (s.total || 0) - cogs;
    return sum + profit;
  }, 0);

  const getPaymentBadge = (sale) => {
    const pm = String(sale.paymentMethod || sale.payment_method || '').toLowerCase();
    const cls = pm === 'cash'
      ? 'bg-green-100 text-green-800'
      : pm === 'card'
      ? 'bg-blue-100 text-blue-800'
      : pm === 'credit'
      ? 'bg-yellow-100 text-yellow-800'
      : pm === 'mpesa' || pm === 'm-pesa'
      ? 'bg-teal-100 text-teal-800'
      : 'bg-gray-100 text-gray-600';
    const icon = pm === 'cash' ? <Wallet className="w-3.5 h-3.5" /> : pm === 'card' ? <CreditCard className="w-3.5 h-3.5" /> : pm === 'credit' ? <Landmark className="w-3.5 h-3.5" /> : pm === 'mpesa' || pm === 'm-pesa' ? <Smartphone className="w-3.5 h-3.5" /> : <Wallet className="w-3.5 h-3.5" />;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
        {icon}
        {sale.paymentMethod || sale.payment_method || '—'}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="input w-40"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
          </select>
          {selectedSales.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{selectedSales.length} selected</span>
              <button 
                onClick={bulkDeleteSales}
                disabled={deleting}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded text-sm font-medium flex items-center gap-1 min-h-[44px]"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={clearAllSales}
            disabled={deleting || sales.length === 0}
            className="px-4 py-2 bg-red-700 hover:bg-red-800 disabled:bg-gray-400 text-white rounded font-medium flex items-center gap-2 min-h-[44px]"
          >
            <Trash className="w-4 h-4" />
            Clear All Sales
          </button>
          <div className="relative">
            <button 
              onClick={() => setExportOpen(!exportOpen)}
              className="btn-secondary flex items-center gap-2 min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              Export
              <ChevronDown className={`w-4 h-4 transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
            </button>
            {exportOpen && (
              <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px]">
                <button
                  onClick={() => { exportSalesPDF(filteredSales); setExportOpen(false); }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 rounded-t-lg min-h-[44px]"
                >
                  Export Summary PDF
                </button>
                <button
                  onClick={() => { exportSalesDetailedPDF(filteredSales); setExportOpen(false); }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 rounded-b-lg min-h-[44px]"
                >
                  Export Detailed PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <p className="text-sm text-green-100 mb-1">Total Sales</p>
          <p className="text-3xl font-bold">KSH {totalSales.toLocaleString()}</p>
        </div>
        <div className="card bg-gradient-to-br from-orange-500 to-red-600 text-white">
          <p className="text-sm text-orange-100 mb-1">Total COGS</p>
          <p className="text-3xl font-bold">KSH {totalCOGS.toLocaleString()}</p>
        </div>
        <div className="card bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <p className="text-sm text-blue-100 mb-1">Total Profit</p>
          <p className="text-3xl font-bold">KSH {totalProfit.toLocaleString()}</p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Sales History</h3>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input 
                    type="checkbox" 
                    checked={selectedSales.length === filteredSales.length && filteredSales.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSales(filteredSales.map(s => s.id));
                      } else {
                        setSelectedSales([]);
                      }
                    }}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date & Time</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Items</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Payment</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">COGS</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Profit</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input 
                      type="checkbox" 
                      checked={selectedSales.includes(sale.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSales([...selectedSales, sale.id]);
                        } else {
                          setSelectedSales(selectedSales.filter(id => id !== sale.id));
                        }
                      }}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">#{sale.id}</td>
                  <td className="px-4 py-3 text-sm">{new Date(sale.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">{sale.items?.length || 0} items</td>
                  <td className="px-4 py-3 text-sm">{getPaymentBadge(sale)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-600">
                    KSH {sale.total?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-orange-600">
                    KSH {(sale.cogs ?? sale.total_cost ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                    KSH {(sale.profit ?? sale.gross_profit ?? (sale.total || 0) - (sale.cogs ?? sale.total_cost ?? 0)).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => deleteSale(sale.id)}
                      disabled={deleting}
                      className="px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded text-sm font-medium flex items-center gap-1 min-h-[44px]"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {filteredSales.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No sales found</p>
          ) : (
            filteredSales.map((sale) => (
              <div key={sale.id} className="border border-gray-200 rounded-lg p-4 space-y-2 bg-white">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">Sale #{sale.id}</span>
                  {getPaymentBadge(sale)}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-xs text-gray-500 block">Date & Time</span>
                    <span className="font-medium">{new Date(sale.createdAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Items</span>
                    <span className="font-medium">{sale.items?.length || 0} items</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Total</span>
                    <span className="font-semibold text-green-600">KSH {sale.total?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">COGS</span>
                    <span className="text-orange-600">KSH {(sale.cogs ?? sale.total_cost ?? 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Profit</span>
                    <span className="font-semibold text-blue-600">KSH {(sale.profit ?? sale.gross_profit ?? (sale.total || 0) - (sale.cogs ?? sale.total_cost ?? 0)).toLocaleString()}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <button
                    onClick={() => deleteSale(sale.id)}
                    disabled={deleting}
                    className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Sale
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
