import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { timeEntries } from '../../services/api';
import { Clock, LogIn, LogOut, Calendar, User, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MobileTimeTracking() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clockStatus, setClockStatus] = useState(null);
  const [clockLoading, setClockLoading] = useState(false);

  useEffect(() => {
    loadRecords();
    loadClockStatus();
    const interval = setInterval(() => {
      loadRecords();
      loadClockStatus();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadClockStatus = async () => {
    try {
      const data = await timeEntries.getStatus();
      setClockStatus(data);
    } catch (error) {
      console.warn('Failed to load clock status:', error);
    }
  };

  const handleClockIn = async () => {
    try {
      setClockLoading(true);
      await timeEntries.create('clock_in');
      await loadRecords();
      await loadClockStatus();
    } catch (error) {
      console.error('Clock in failed:', error);
      alert(error.message || 'Clock in failed');
    } finally {
      setClockLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setClockLoading(true);
      await timeEntries.create('clock_out');
      await loadRecords();
      await loadClockStatus();
    } catch (error) {
      console.error('Clock out failed:', error);
      alert(error.message || 'Clock out failed');
    } finally {
      setClockLoading(false);
    }
  };

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await timeEntries.getAll();
      if (Array.isArray(data)) {
        setRecords(data.reverse());
      }
    } catch (error) {
      console.error('Failed to load clock records:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const isClockedIn = clockStatus?.clocked_in || clockStatus?.is_clocked_in || false;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/mobile')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Time Tracking</h1>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
        <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${isClockedIn ? 'bg-green-100' : 'bg-gray-100'}`}>
          <Clock className={`w-8 h-8 ${isClockedIn ? 'text-green-600' : 'text-gray-400'}`} />
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {isClockedIn ? 'Currently clocked in' : 'Not clocked in'}
        </p>
        <button
          onClick={isClockedIn ? handleClockOut : handleClockIn}
          disabled={clockLoading}
          className={`w-full py-3 rounded-xl font-medium text-white disabled:opacity-50 ${isClockedIn ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {clockLoading ? 'Processing...' : isClockedIn ? 'Clock Out' : 'Clock In'}
        </button>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">History</h3>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading records...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No time records yet</div>
        ) : (
          <div className="space-y-3">
            {records.slice(0, 20).map(record => (
              <div key={record.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${record.action === 'clock_in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {record.action === 'clock_in' ? 'Clock In' : 'Clock Out'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {record.createdAt ? new Date(record.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
                {record.user && (
                  <p className="text-sm text-gray-600">{record.user.name || record.user.email}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
