import { useState, useEffect } from 'react';
import { Clock, Calendar, User } from 'lucide-react';

export default function TimeTracking() {
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = () => {
    const data = JSON.parse(localStorage.getItem('clockRecords') || '[]');
    setRecords(data.reverse());
  };

  const filteredRecords = filter === 'all' 
    ? records 
    : records.filter(r => r.date === new Date().toDateString());

  const totalHoursToday = filteredRecords
    .filter(r => r.date === new Date().toDateString())
    .reduce((sum, r) => sum + r.duration, 0) / 60;

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Time Tracking</h2>
        <p className="text-sm text-gray-600 mt-1">Monitor cashier clock in/out records</p>
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
              <p className="text-sm text-green-700">Active Cashiers</p>
              <p className="text-2xl font-bold text-green-900">
                {new Set(filteredRecords.filter(r => r.date === new Date().toDateString()).map(r => r.userId)).size}
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
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                    No records found
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, idx) => (
                  <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{record.userName}</td>
                    <td className="px-4 py-3 text-sm">{new Date(record.clockIn).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm">{new Date(record.clockIn).toLocaleTimeString()}</td>
                    <td className="px-4 py-3 text-sm">{new Date(record.clockOut).toLocaleTimeString()}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="badge badge-success">{formatDuration(record.duration)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
