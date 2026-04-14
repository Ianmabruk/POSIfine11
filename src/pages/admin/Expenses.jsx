import { useState, useEffect } from 'react';
import { expenses as expensesApi } from '../../services/api';
import websocketService from '../../services/websocketService';
import { Plus, TrendingDown } from 'lucide-react';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
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

  useEffect(() => {
    loadExpenses();
    
    // Connect to WebSocket for real-time expense updates from sales
    const token = localStorage.getItem('token');
    if (token) {
      websocketService.connect(token).catch((error) => {
        console.warn('WebSocket connection failed:', error);
      });
      
      // Listen for SALE_COMPLETED events to refresh expenses
      websocketService.on('sale_completed', (saleData) => {
        console.log('💰 Sale completed - updating expenses:', saleData);
        // Reload expenses to show new auto-deducted items
        loadExpenses();
        if (saleData.saleId) {
          showNotification(`✅ Expenses updated from Sale #${saleData.saleId}`, 'success');
        }
      });
    }

    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
    };
  }, []);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadExpenses = async () => {
    const data = await expensesApi.getAll();
    setExpenses(data.reverse());
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
    
    // Dispatch expense_added event for real-time updates
    window.dispatchEvent(new CustomEvent('expense_added', {
      detail: { expense: expenseData }
    }));
    
    loadExpenses();
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
    if (expense?.category === 'ingredient' || expense?.source === 'auto-deduction') {
      return { label: 'Ingredient', cls: 'bg-purple-100 text-purple-800' };
    }
    return { label: 'Manual', cls: 'bg-blue-100 text-blue-800' };
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const manualExpenses = expenses.filter(e => !isAutomaticExpense(e));
  const autoExpenses = expenses.filter(isAutomaticExpense);

  return (
    <div className="p-6 space-y-6">
      {/* Real-time notification */}
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
          <p className="text-sm text-gray-600 mt-1">Track manual and automatic ingredient-based expenses</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-red-500 to-pink-600 text-white">
          <p className="text-sm text-red-100 mb-1">Total Expenses</p>
          <p className="text-3xl font-bold">KSH {totalExpenses.toLocaleString()}</p>
        </div>
        <div className="card bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <p className="text-sm text-blue-100 mb-1">Manual Expenses</p>
          <p className="text-3xl font-bold">KSH {manualExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}</p>
        </div>
        <div className="card bg-gradient-to-br from-purple-500 to-violet-600 text-white">
          <p className="text-sm text-purple-100 mb-1">Auto Expenses</p>
          <p className="text-3xl font-bold">KSH {autoExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Expense History</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => {
                const createdAt = expense.createdAt || expense.created_at || expense.date || expense.timestamp;
                const isAutomatic = isAutomaticExpense(expense);
                return (
                <tr key={expense.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-4 py-3 text-sm">{expense.description || expense.name || 'Expense'}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="badge badge-warning">{expense.category}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {(() => { const t = expenseTypeBadge(expense); return <span className={`badge ${t.cls}`}>{t.label}</span>; })()}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-red-600">
                    KSH {expense.amount?.toLocaleString()}
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add Manual Expense</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <input
                type="text"
                placeholder="Description"
                className="input"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
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
                Track as ingredient stock (used in recipe deductions)
              </label>

              {(newExpense.trackStock || newExpense.category === 'ingredient') && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Quantity (e.g. 2)"
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
