import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { timeEntries, users } from '../../services/api';
import { Clock, LogIn, LogOut, Calendar, User, ArrowLeft, RefreshCw } from 'lucide-react';

const STATUS_CONFIG = {
  clocked_in: { label: 'Clocked In', color: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  clocked_out: { label: 'Clocked Out', color: 'bg-gray-50 text-gray-700 border-gray-200', dot: 'bg-gray-400' },
};

export default function MobileAdminAttendance() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const [timeData, usersData] = await Promise.all([
        timeEntries.getAll(),
        users.getAll()
      ]);
      const usersMap = {};
      (usersData || []).forEach(u => {
        usersMap[u.id] = u;
      });
      const enriched = (timeData || []).map(record => ({
        ...record,
        user: usersMap[record.user_id] || { name: record.user_name, email: '' }
      }));
      enriched.sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));
      setRecords(enriched);
    } catch (error) {
      console.error('Failed to load attendance records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRecords();
    setRefreshing(false);
  };

  useEffect(() => {
    loadRecords();
    const interval = setInterval(loadRecords, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (isoString) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Group records by user
  const grouped = records.reduce((acc, record) => {
    const key = record.user_id;
    if (!acc[key]) {
      acc[key] = {
        user: record.user,
        records: []
      };
    }
    acc[key].records.push(record);
    return acc;
  }, {});

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/mobile')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Attendance</h1>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-gray-300" />
          <p>Loading attendance...</p>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No attendance records found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([userId, group]) => {
            const latestRecord = group.records[0];
            const isClockedIn = latestRecord?.action === 'clock_in';
            const statusConfig = STATUS_CONFIG[isClockedIn ? 'clocked_in' : 'clocked_out'];

            return (
              <div key={userId} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-bold">
                      {(group.user?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{group.user?.name || 'Unknown User'}</p>
                      <p className="text-xs text-gray-500">{group.user?.email || ''}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                </div>

                <div className="space-y-2">
                  {group.records.slice(0, 5).map((record, idx) => {
                    const clockIn = record.action === 'clock_in';
                    const clockOut = record.action === 'clock_out';
                    const recordDate = formatDate(record.created_at || record.date);
                    const recordTime = formatTime(record.created_at || record.date);

                    return (
                      <div key={record.id || idx} className="flex items-start gap-3 text-xs">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${clockIn ? 'bg-green-500' : clockOut ? 'bg-red-500' : 'bg-gray-400'}`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-700">
                              {clockIn ? 'Clocked In' : clockOut ? 'Clocked Out' : record.action}
                            </span>
                            <span className="text-gray-500">{recordDate}</span>
                          </div>
                          {recordTime && (
                            <p className="text-gray-500 mt-0.5">{recordTime}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
