import { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Calendar } from 'lucide-react';

export default function RemindersManager() {
  const [reminders, setReminders] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    productId: '',
    frequency: 'weekly',
    days: [],
    nextDate: ''
  });

  useEffect(() => {
    fetchReminders();
    fetchProducts();
  }, []);


  const fetchReminders = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5001/api';
      const res = await fetch(`${API_URL}/reminders`, {
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


  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5001/api';
      const res = await fetch(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Check if response is ok
      if (!res.ok) {
        console.error('API Error:', res.status, res.statusText);
        setProducts([]);
        return;
      }
      
      const data = await res.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        console.error('Expected array but got:', typeof data, data);
        setProducts([]);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5001/api';
      
      const response = await fetch(`${API_URL}/reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create reminder:', errorData);
        alert(`Failed to create reminder: ${errorData.error || 'Unknown error'}`);
        return;

      }
      
      const result = await response.json();
      
      // Reset form and refresh data
      setFormData({ customerName: '', productId: '', frequency: 'weekly', days: [], nextDate: '' });
      setShowForm(false);
      fetchReminders();
      
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
      const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5001/api';
      
      const response = await fetch(`${API_URL}/reminders/${id}`, {
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

  const toggleDay = (day) => {
    if (formData.days.includes(day)) {
      setFormData({ ...formData, days: formData.days.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, days: [...formData.days, day] });
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
        {reminders.map(reminder => {
          const product = products.find(p => p.id === reminder.productId);
          return (
            <div key={reminder.id} className={`p-6 rounded-xl shadow-lg ${reminder.status === 'pending' ? 'bg-red-50 border-l-4 border-red-500' : 'bg-green-50 border-l-4 border-green-500'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold mb-2">{reminder.customerName}</h3>
                  <p className="text-gray-700 mb-1">Product: {product?.name || 'Unknown'}</p>
                  <p className="text-gray-600 text-sm mb-1">Frequency: {reminder.frequency}</p>
                  {reminder.days?.length > 0 && (
                    <p className="text-gray-600 text-sm mb-1">Days: {reminder.days.join(', ')}</p>
                  )}
                  <p className="text-gray-600 text-sm flex items-center gap-2">
                    <Calendar size={16} />
                    Next: {new Date(reminder.nextDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-4 py-2 rounded-lg font-bold ${reminder.status === 'pending' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                    {reminder.status}
                  </span>
                  <button
                    onClick={() => deleteReminder(reminder.id)}
                    className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white rounded-t-2xl">
              <h2 className="text-2xl font-bold">Create Reminder</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Customer Name</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Product</label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Frequency</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="specific">Specific Days</option>
                </select>
              </div>
              {formData.frequency === 'specific' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Select Days</label>
                  <div className="flex flex-wrap gap-2">
                    {days.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          formData.days.includes(day)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">Next Reminder Date</label>
                <input
                  type="date"
                  value={formData.nextDate}
                  onChange={(e) => setFormData({ ...formData, nextDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500"
                  required
                />
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
