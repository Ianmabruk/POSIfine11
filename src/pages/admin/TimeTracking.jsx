import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { timeEntries } from '../../services/api';
import { Clock, Calendar, User, LogIn, LogOut } from 'lucide-react';

export default function TimeTracking() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState('all');
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
      // Fetch from backend API instead of localStorage
      const data = await timeEntries.getAll();
      if (Array.isArray(data)) {
        setRecords(data.reverse());
        console.log(`✅ Loaded ${data.length} clock records from backend`);
      }
    } catch (error) {
      console.error('Failed to load clock records:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toDateString();
  
  const filteredRecords = filter === 'all' 
    ? records 
    : records.filter(r => {
        try {
          return new Date(r.date || r.clockInTime).toDateString() === today;
        } catch {
          return false;
        }
      });

  const totalHoursToday = records
    .filter(r => {
      try {
        return new Date(r.date || r.clockInTime).toDateString() === today && r.duration;
      } catch {
        return false;
      }
    })
    .reduce((sum, r) => sum + (r.duration || 0), 0) / 60;

  const formatDuration = (seconds) => {
    // Handle both seconds and minutes
    let mins = typeof seconds === 'number' ? (seconds < 120 ? seconds : Math.floor(seconds / 60)) : 0;
    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;
    return `${hours}h ${remaining}m`;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Time Tracking</h2>
          <p className="text-sm text-gray-600 mt-1">Monitor staff and admin clock in/out records</p>
        </div>
        <div className="flex items-center gap-3">
          {clockStatus?.isClockedIn ? (
            <button
              onClick={handleClockOut}
              disabled={clockLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
            >
              <LogOut className="w-4 h-4" />
              {clockLoading ? 'Clocking out...' : 'Clock Out'}
            </button>
          ) : (
            <button
              onClick={handleClockIn}
              disabled={clockLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              <LogIn className="w-4 h-4" />
              {clockLoading ? 'Clocking in...' : 'Clock In'}
            </button>
          )}
          {clockStatus?.isClockedIn && clockStatus?.clockInTime && (
            <span className="text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full">
              Since {new Date(clockStatus.clockInTime).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-700">Total Hours Today</p>
              <p className="text-2xl font-bold text-blue-900">{totalHoursToday.toFixed(1)}h</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-green-700">Active Cashiers Today</p>
              <p className="text-2xl font-bold text-green-900">
                {new Set(records
                  .filter(r => {
                    try {
                      return new Date(r.date || r.clockInTime).toDateString() === new Date().toDateString();
                    } catch {
                      return false;
                    }
                  })
                  .map(r => r.cashierId || r.userId)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-purple-700">Total Records</p>
              <p className="text-2xl font-bold text-purple-900">{records.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold">Clock Records</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setFilter('today')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={loadRecords}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-600 hover:bg-green-200 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cashier</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Clock In</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Clock Out</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Duration</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    {loading ? 'Loading records...' : 'No records found'}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, idx) => {
                  const clockInTime = new Date(record.clockInTime);
                  const clockOutTime = record.clockOutTime ? new Date(record.clockOutTime) : null;
                  
                  return (
                    <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{record.cashierName || record.userName}</td>
                      <td className="px-4 py-3 text-sm">{clockInTime.toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm">{clockInTime.toLocaleTimeString()}</td>
                      <td className="px-4 py-3 text-sm">
                        {clockOutTime ? clockOutTime.toLocaleTimeString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="badge badge-success">
                          {record.duration ? formatDuration(record.duration) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          record.status === 'clocked_in' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {record.status === 'clocked_in' ? '🟢 Clocked In' : '✓ Clocked Out'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
