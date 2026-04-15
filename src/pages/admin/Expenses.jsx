import { useState, useEffect } from 'react';
import { expenses as expensesApi, rawMaterials as rawMaterialsApi } from '../../services/api';
import websocketService from '../../services/websocketService';
import { Plus, TrendingDown, Package, Download } from 'lucide-react';
import { exportExpensesPDF } from '../../utils/exportData';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [ingredientStocks, setIngredientStocks] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    quantity: '',
    unit: 'liters',
    category: 'general',
    trackStock: false
  });
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'ingredients'

  useEffect(() => {
    loadExpenses();
    loadIngredientStocks();
    
    const token = localStorage.getItem('token');
    if (token) {
      websocketService.connect(token).catch((error) => {
        console.warn('WebSocket connection failed:', error);
      });
      
      websocketService.on('sale_completed', (saleData) => {
        loadExpenses();
        loadIngredientStocks();
        if (saleData.saleId) {
          showNotification(`Expenses updated from Sale #${saleData.saleId}`, 'success');
        }
      });
    }

    return () => {
      websocketService.disconnect();
    };
  }, []);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadExpenses = async () => {
    try {
      const data = await expensesApi.getAll();
      setExpenses(data.reverse());
    } catch (err) {
      console.warn('Failed to load expenses:', err);
    }
  };

  const loadIngredientStocks = async () => {
    try {
      const data = await rawMaterialsApi.getAll();
      setIngredientStocks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load ingredient stocks:', err);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const amount = parseFloat(newExpense.amount);
    const quantity = parseFloat(newExpense.quantity || '0');
    const isIngredientStock = newExpense.trackStock || newExpense.category === 'ingredient';

    if (isIngredientStock && quantity <= 0) {
      alert('For stock-tracked ingredients, quantity must be greater than zero.');
      return;
    }

    const expenseData = {
      ...newExpense,
      amount,
      quantity: isIngredientStock ? quantity : 1,
      track_stock: isIngredientStock,
      category: isIngredientStock ? 'ingredient' : newExpense.category
    };

    await expensesApi.create(expenseData);
    setNewExpense({ description: '', amount: '', quantity: '', unit: 'liters', category: 'general', trackStock: false });
    setShowAddModal(false);
    
    window.dispatchEvent(new CustomEvent('expense_added', {
      detail: { expense: expenseData }
    }));
    
    loadExpenses();
    loadIngredientStocks();
  };

  const isAutomaticExpense = (expense) => (
    expense?.automatic === true
    || expense?.source === 'auto-deduction'
    || expense?.source === 'auto-sale'
    || expense?.category === 'ingredient'
    || expense?.category === 'cogs'
  );

  const expenseTypeBadge = (expense) => {
    if (expense?.category === 'cogs' || expense?.source === 'auto-sale') {
      return { label: 'COGS', cls: 'bg-orange-100 text-orange-800' };
    }
    if (expense?.source === 'auto-deduction') {
      return { label: 'Auto Deduction', cls: 'bg-red-100 text-red-800' };
    }
    if (expense?.category === 'ingredient' && expense?.source !== 'auto-deduction') {
      return { label: 'Ingredient Purchase', cls: 'bg-purple-100 text-purple-800' };
    }
    return { label: 'Manual', cls: 'bg-blue-100 text-blue-800' };
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const manualExpenses = expenses.filter(e => !isAutomaticExpense(e));
  const autoExpenses = expenses.filter(isAutomaticExpense);
  const ingredientDeductions = expenses.filter(e => e?.source === 'auto-deduction');

  const displayedExpenses = activeTab === 'ingredients'
    ? expenses.filter(e => e?.category === 'ingredient' || e?.source === 'auto-deduction')
    : expenses;

  return (
    <div className="p-6 space-y-6">
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg text-white font-medium z-50 ${
          notification.type === 'success' ? 'bg-green-600' : 'bg-blue-600'
        }`}>
          {notification.message}
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Expense Management</h2>
          <p className="text-sm text-gray-600 mt-1">Track manual expenses and automatic ingredient deductions from sales</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
            <div className="hidden group-hover:block absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px]">
              <button
                onClick={() => exportExpensesPDF(expenses)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-lg"
              >
                Export PDF
              </button>
            </div>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-red-500 to-pink-600 text-white">
          <p className="text-sm text-red-100 mb-1">Total Expenses</p>
          <p className="text-3xl font-bold">KSH {totalExpenses.toLocaleString()}</p>
        </div>
        <div className="card bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <p className="text-sm text-blue-100 mb-1">Manual Expenses</p>
          <p className="text-3xl font-bold">KSH {manualExpenses.reduce((s, e) => s + (e.amount || 0), 0).toLocaleString()}</p>
        </div>
        <div className="card bg-gradient-to-br from-purple-500 to-violet-600 text-white">
          <p className="text-sm text-purple-100 mb-1">Auto Deductions</p>
          <p className="text-3xl font-bold">KSH {autoExpenses.reduce((s, e) => s + (e.amount || 0), 0).toLocaleString()}</p>
        </div>
        <div className="card bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <p className="text-sm text-amber-100 mb-1">Ingredient Deductions</p>
          <p className="text-3xl font-bold">{ingredientDeductions.length} items</p>
        </div>
      </div>

      {/* Ingredient Stock Levels */}
      {ingredientStocks.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-600" />
            Ingredient Stock Levels
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {ingredientStocks.map((material) => {
              const qty = Number(material.quantity || 0);
              const reorder = Number(material.reorder_level || 0);
              const isLow = reorder > 0 && qty <= reorder;
              return (
                <div key={material.id} className={`p-3 rounded-lg border ${isLow ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                  <p className="font-medium text-sm truncate">{material.name}</p>
                  <p className={`text-xl font-bold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                    {qty.toLocaleString(undefined, { maximumFractionDigits: 4 })} {material.unit || 'units'}
                  </p>
                  {isLow && <p className="text-xs text-red-500 mt-1">Low stock - reorder level: {reorder}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${activeTab === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          All Expenses ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab('ingredients')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${activeTab === 'ingredients' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Ingredient Deductions ({expenses.filter(e => e?.category === 'ingredient' || e?.source === 'auto-deduction').length})
        </button>
      </div>

      {/* Expense Table */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">
          {activeTab === 'ingredients' ? 'Ingredient Expense History' : 'Expense History'}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Qty Used</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
              </tr>
            </thead>
            <tbody>
              {displayedExpenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No expenses found</td>
                </tr>
              )}
              {displayedExpenses.map((expense) => {
                const createdAt = expense.createdAt || expense.created_at || expense.date || expense.timestamp;
                return (
                <tr key={expense.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-4 py-3 text-sm">
                    <div>{expense.name || expense.description || 'Expense'}</div>
                    {expense.description && expense.description !== expense.name && (
                      <div className="text-xs text-gray-400">{expense.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="badge badge-warning">{expense.category}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {(() => { const t = expenseTypeBadge(expense); return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.cls}`}>{t.label}</span>; })()}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {expense.quantity && expense.quantity !== 1 ? (
                      <span className="font-medium">
                        {Number(expense.quantity).toLocaleString(undefined, { maximumFractionDigits: 4 })} {expense.unit || ''}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-red-600 text-right">
                    KSH {expense.amount?.toLocaleString()}
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add Manual Expense</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <input
                type="text"
                placeholder="Description (e.g. Cooking Oil)"
                className="input"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Total Amount (KSH)"
                className="input"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                required
              />
              <select
                className="input"
                value={newExpense.category}
                onChange={(e) => {
                  const category = e.target.value;
                  setNewExpense({
                    ...newExpense,
                    category,
                    trackStock: category === 'ingredient' ? true : newExpense.trackStock
                  });
                }}
              >
                <option value="general">General</option>
                <option value="ingredient">Ingredient Stock</option>
                <option value="utilities">Utilities</option>
                <option value="rent">Rent</option>
                <option value="salaries">Salaries</option>
                <option value="supplies">Supplies</option>
                <option value="other">Other</option>
              </select>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={newExpense.trackStock}
                  onChange={(e) => setNewExpense({ ...newExpense, trackStock: e.target.checked })}
                />
                Track as ingredient stock (auto-deducted when used in recipes)
              </label>

              {(newExpense.trackStock || newExpense.category === 'ingredient') && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">Specify how much of this ingredient you purchased. It will be added to your ingredient stock and automatically deducted when composite products are sold.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.001"
                      placeholder="Quantity (e.g. 5)"
                      className="input"
                      value={newExpense.quantity}
                      onChange={(e) => setNewExpense({ ...newExpense, quantity: e.target.value })}
                      required
                    />
                    <select
                      className="input"
                      value={newExpense.unit}
                      onChange={(e) => setNewExpense({ ...newExpense, unit: e.target.value })}
                    >
                      <option value="liters">Liters</option>
                      <option value="kg">Kilograms</option>
                      <option value="grams">Grams</option>
                      <option value="ml">Milliliters</option>
                      <option value="pcs">Pieces</option>
                    </select>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">Add Expense</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
