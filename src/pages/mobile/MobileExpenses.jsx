import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { expenses } from '../../services/api';
import { Plus, ArrowLeft, TrendingDown, Calendar, Download } from 'lucide-react';

export default function MobileExpenses() {
  const navigate = useNavigate();
  const [expensesList, setExpensesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'general',
    date: ''
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const data = await expenses.getAll();
      setExpensesList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: formData.date || new Date().toISOString()
      };
      if (editingExpense) {
        await expenses.update(editingExpense.id, payload);
      } else {
        await expenses.create(payload);
      }
      await loadExpenses();
      setShowModal(false);
      setEditingExpense(null);
      setFormData({ description: '', amount: '', category: 'general', date: '' });
    } catch (err) {
      console.error('Failed to save expense:', err);
      alert('Failed to save expense');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await expenses.delete(id);
      await loadExpenses();
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  };

  const totalExpenses = expensesList.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/mobile')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Expenses</h1>
          <p className="text-xs text-gray-500">KSH {totalExpenses.toLocaleString()} total</p>
        </div>
        <button
          onClick={() => { setEditingExpense(null); setFormData({ description: '', amount: '', category: 'general', date: '' }); setShowModal(true); }}
          className="p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading expenses...</div>
      ) : expensesList.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No expenses recorded</div>
      ) : (
        <div className="space-y-3">
          {expensesList.map(expense => (
            <div key={expense.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-gray-900">{expense.description || 'Expense'}</p>
                <p className="font-semibold text-red-600">- KSH {Number(expense.amount).toLocaleString()}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="capitalize">{expense.category || 'general'}</span>
                <span>{expense.date ? new Date(expense.date).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => { setEditingExpense(expense); setFormData({ description: expense.description, amount: String(expense.amount), category: expense.category || 'general', date: expense.date?.split('T')[0] || '' }); setShowModal(true); }} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg">Edit</button>
                <button onClick={() => handleDelete(expense.id)} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{editingExpense ? 'Edit Expense' : 'Add Expense'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KSH)</label>
                <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="general">General</option>
                  <option value="ingredient">Ingredient</option>
                  <option value="utilities">Utilities</option>
                  <option value="transport">Transport</option>
                  <option value="salary">Salary</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-medium">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
