import { useState, useEffect } from 'react';
import { expenses as expensesApi } from '../../services/api';
import { Plus, TrendingDown } from 'lucide-react';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'general' });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    const data = await expensesApi.getAll();
    setExpenses(data.reverse());
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    await expensesApi.create({ ...newExpense, amount: parseFloat(newExpense.amount) });
    setNewExpense({ description: '', amount: '', category: 'general' });
    setShowAddModal(false);
    loadExpenses();
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const manualExpenses = expenses.filter(e => !e.automatic);
  const autoExpenses = expenses.filter(e => e.automatic);

  return (
    <div className="p-6 space-y-6">
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
              {expenses.map((expense) => (
                <tr key={expense.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{new Date(expense.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm">{expense.description}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="badge badge-warning">{expense.category}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`badge ${expense.automatic ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {expense.automatic ? 'Automatic' : 'Manual'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-red-600">
                    KSH {expense.amount?.toLocaleString()}
                  </td>
                </tr>
              ))}
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
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
              >
                <option value="general">General</option>
                <option value="utilities">Utilities</option>
                <option value="rent">Rent</option>
                <option value="salaries">Salaries</option>
                <option value="supplies">Supplies</option>
                <option value="other">Other</option>
              </select>
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
