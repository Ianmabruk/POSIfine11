import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export default function ReminderModal({ onClose }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminders();
  }, []);


  const fetchReminders = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5001/api';
      const res = await fetch(`${API_URL}/reminders/today`, {
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
    } finally {
      setLoading(false);
    }
  };

  const markFulfilled = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5001/api';
      await fetch(`${API_URL}/reminders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'fulfilled' })
      });
      fetchReminders();
    } catch (error) {
      console.error('Failed to update reminder:', error);
    }
  };


  if (loading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white flex justify-between items-center">
          <h2 className="text-2xl font-bold">Today's Reminders</h2>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {reminders.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <p className="text-gray-600 text-lg">No reminders for today</p>
              <p className="text-gray-400 text-sm mt-2">You're all caught up!</p>
            </div>
          ) : (
            reminders.map(reminder => (
              <div key={reminder.id} className="mb-4 p-4 border-l-4 border-red-500 bg-red-50 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800">{reminder.customerName}</p>
                  <p className="text-sm text-gray-600">Product ID: {reminder.productId}</p>
                  <p className="text-xs text-gray-500">{reminder.frequency}</p>
                </div>
                <button
                  onClick={() => markFulfilled(reminder.id)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                >
                  <CheckCircle size={18} />
                  Mark Done
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
