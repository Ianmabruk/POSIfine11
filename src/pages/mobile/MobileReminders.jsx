import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reminders } from '../../services/api';
import { Plus, Trash2, ArrowLeft, Bell, Calendar, CheckCircle2, Circle } from 'lucide-react';

export default function MobileReminders() {
  const navigate = useNavigate();
  const [remindersList, setRemindersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'normal',
    expiresAt: ''
  });

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const data = await reminders.getAll();
      setRemindersList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await reminders.create(formData);
      await fetchReminders();
      setShowForm(false);
      setFormData({ title: '', message: '', priority: 'normal', expiresAt: '' });
    } catch (error) {
      console.error('Failed to create reminder:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await reminders.delete(id);
      await fetchReminders();
    } catch (error) {
      console.error('Failed to delete reminder:', error);
    }
  };

  const handleComplete = async (id) => {
    try {
      await reminders.update(id, { status: 'fulfilled' });
      await fetchReminders();
    } catch (error) {
      console.error('Failed to complete reminder:', error);
    }
  };

  const priorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
          <h1 className="text-xl font-bold text-gray-900">Reminders</h1>
          <p className="text-xs text-gray-500">{remindersList.length} reminders</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading reminders...</div>
      ) : remindersList.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No reminders</div>
      ) : (
        <div className="space-y-3">
          {remindersList.map(reminder => (
            <div key={reminder.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-gray-400 mt-0.5" />
                  <p className="font-medium text-gray-900">{reminder.title}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${priorityColor(reminder.priority)}`}>
                  {reminder.priority}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{reminder.message}</p>
              {reminder.expiresAt && (
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(reminder.expiresAt).toLocaleDateString()}
                </p>
              )}
              <div className="flex gap-2">
                {reminder.status !== 'fulfilled' && (
                  <button onClick={() => handleComplete(reminder.id)} className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded-lg flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Complete
                  </button>
                )}
                <button onClick={() => handleDelete(reminder.id)} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">New Reminder</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expires At (optional)</label>
                <input type="datetime-local" value={formData.expiresAt} onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-medium">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
