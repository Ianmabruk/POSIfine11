import { useEffect, useState, useRef } from 'react';
import { BASE_API_URL } from '../services/api';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export default function ReminderModal({ onClose }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const cacheRef = useRef({ data: null, timestamp: null });
  const CACHE_DURATION = 30000; // Cache for 30 seconds

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      // Check cache first
      const now = Date.now();
      if (cacheRef.current.data && cacheRef.current.timestamp && 
          (now - cacheRef.current.timestamp) < CACHE_DURATION) {
        console.log('📦 Using cached reminders');
        setReminders(cacheRef.current.data);
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_API_URL}/reminders/today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Check if response is ok
      if (!res.ok) {
        console.error('API Error:', res.status, res.statusText);
        setReminders([]);
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        // Cache the data
        cacheRef.current.data = data;
        cacheRef.current.timestamp = Date.now();
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
      await fetch(`${BASE_API_URL}/reminders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'fulfilled' })
      });
      // Clear cache after marking fulfilled
      cacheRef.current = { data: null, timestamp: null };
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
                  <p className="font-semibold text-gray-800">{reminder.title}</p>
                  <p className="text-sm text-gray-600">{reminder.message}</p>
                  <p className="text-xs text-gray-500 capitalize">Priority: {reminder.priority || 'normal'}</p>
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
