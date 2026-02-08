import { useState, useEffect } from 'react';
import { BASE_API_URL } from '../../services/api';
import { Bell, Plus, Trash2, Calendar, PenSquare } from 'lucide-react';
import SignaturePad from '../../components/SignaturePad';

export default function RemindersManager() {
  const [reminders, setReminders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [adminNotes, setAdminNotes] = useState({});
  const [adminSignatures, setAdminSignatures] = useState({});
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
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_API_URL}/reminders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Check if response is ok
      if (!res.ok) {
        console.error('API Error:', res.status, res.statusText);
        setReminders([]);
        return;
      }
      
      const data = await res.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setReminders(data);
      } else {
        console.error('Expected array but got:', typeof data, data);
        setReminders([]);
      }
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
      setReminders([]);
    }
  };



  const saveAdminSignature = async (reminderId) => {
    try {
      const token = localStorage.getItem('token');
      const note = adminNotes[reminderId] || '';
      const signature = adminSignatures[reminderId] || '';

      const response = await fetch(`${BASE_API_URL}/reminders/${reminderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ note, signature, status: 'fulfilled' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Failed to save signature: ${errorData.error || 'Unknown error'}`);
        return;
      }

      fetchReminders();
      alert('Signature saved successfully!');
    } catch (error) {
      console.error('Failed to save signature:', error);
      alert('Failed to save signature. Please try again.');
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${BASE_API_URL}/reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          message: formData.message,
          priority: formData.priority,
          expiresAt: formData.expiresAt || undefined
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create reminder:', errorData);
        alert(`Failed to create reminder: ${errorData.error || 'Unknown error'}`);
        return;

      }
      
      const result = await response.json();
      
      // Reset form and refresh data
      setFormData({ title: '', message: '', priority: 'normal', expiresAt: '' });
      setShowForm(false);
      fetchReminders();
      window.dispatchEvent(new CustomEvent('reminder_created'));
      
      alert('Reminder created successfully!');
    } catch (error) {
      console.error('Failed to create reminder:', error);
      alert('Failed to create reminder. Please try again.');
    }
  };


  const deleteReminder = async (id) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Only admin users can delete reminders
      if (user.role !== 'admin') {
        alert('Only administrators can delete reminders.');
        return;
      }
      
      if (!confirm('Are you sure you want to delete this reminder? This action cannot be undone.')) {
        return;
      }
      

      const token = localStorage.getItem('token');
      
      const response = await fetch(`${BASE_API_URL}/reminders/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to delete reminder:', errorData);
        alert(`Failed to delete reminder: ${errorData.error || 'Unknown error'}`);
        return;

      }
      fetchReminders();
      alert('Reminder deleted successfully!');
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      alert('Failed to delete reminder. Please try again.');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Bell className="text-blue-600" />
          Reminder System
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus size={20} />
          New Reminder
        </button>
      </div>

      <div className="grid gap-4">
        {reminders.map(reminder => (
          <div key={reminder.id} className={`p-6 rounded-xl shadow-lg ${(reminder.status || 'pending') === 'pending' ? 'bg-red-50 border-l-4 border-red-500' : 'bg-green-50 border-l-4 border-green-500'}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold mb-2">{reminder.title}</h3>
                <p className="text-gray-700 mb-2">{reminder.message}</p>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="capitalize">Priority: {reminder.priority || 'normal'}</span>
                  {reminder.expires_at && (
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      Expires: {new Date(reminder.expires_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <span className={`px-4 py-2 rounded-lg font-bold ${(reminder.status || 'pending') === 'pending' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                  {reminder.status || 'pending'}
                </span>
                <button
                  onClick={() => deleteReminder(reminder.id)}
                  className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
            <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-3 text-gray-800 font-semibold">
                <PenSquare size={16} />
                Admin Note & Signature
              </div>
              <textarea
                rows={2}
                className="w-full px-3 py-2 border rounded-lg text-sm mb-3"
                placeholder="Add a short note (optional)"
                value={adminNotes[reminder.id] ?? reminder.admin_note ?? ''}
                onChange={(e) => setAdminNotes({ ...adminNotes, [reminder.id]: e.target.value })}
              />
              <SignaturePad
                value={adminSignatures[reminder.id] ?? reminder.admin_signature ?? ''}
                onChange={(value) => setAdminSignatures({ ...adminSignatures, [reminder.id]: value })}
              />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {reminder.admin_signed_at ? `Signed: ${new Date(reminder.admin_signed_at).toLocaleString()}` : 'Not signed yet'}
                </span>
                <button
                  onClick={() => saveAdminSignature(reminder.id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
                >
                  Save Signature
                </button>
              </div>
            </div>
            {(reminder.cashier_note || reminder.cashier_signature) && (
              <div className="mt-3 bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm font-semibold text-gray-800 mb-2">Cashier Note & Signature</div>
                {reminder.cashier_note && (
                  <p className="text-sm text-gray-700 mb-2">{reminder.cashier_note}</p>
                )}
                {reminder.cashier_signature && (
                  <img
                    src={reminder.cashier_signature}
                    alt="Cashier Signature"
                    className="h-20 border rounded bg-white"
                  />
                )}
                {reminder.cashier_signed_at && (
                  <div className="text-xs text-gray-500 mt-2">
                    Signed: {new Date(reminder.cashier_signed_at).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white rounded-t-2xl">
              <h2 className="text-2xl font-bold">Create Reminder</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Expires At</label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
                >
                  Create Reminder
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
