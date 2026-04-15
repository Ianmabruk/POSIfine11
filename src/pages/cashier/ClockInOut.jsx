import React, { useState, useEffect } from 'react';
import { Clock, LogOut, AlertCircle } from 'lucide-react';

export default function ClockInOut({ shiftId, onClockOut }) {
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  useEffect(() => {
    if (!shiftId) return;

    // Fetch shift details
    const fetchShift = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL || window.location.origin}/api/v2/shifts/current`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.shift) {
          setShift(data.shift);
        }
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch shift:', error);
        setLoading(false);
      }
    };

    fetchShift();
  }, [shiftId]);

  // Calculate elapsed time
  useEffect(() => {
    if (!shift || !shift.clockInTime) return;

    const timer = setInterval(() => {
      const clockInTime = new Date(shift.clockInTime);
      const now = new Date();
      const diff = Math.floor((now - clockInTime) / 1000);

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      setElapsedTime(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [shift]);

  const clockOut = async () => {
    if (!shiftId) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || window.location.origin}/api/v2/shifts/clock-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ shiftId: shiftId })
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ Clock Out Successful!\n\nTotal Sales: ${data.totalSales.toLocaleString()}\nTotal Expenses: ${data.totalExpenses.toLocaleString()}`);
        onClockOut();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Clock out failed:', error);
      alert('Clock out failed');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin">
          <Clock size={48} className="text-blue-600" />
        </div>
        <p className="mt-4 text-gray-600">Loading shift information...</p>
      </div>
    );
  }

  if (!shift) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <AlertCircle size={48} className="mx-auto text-yellow-600 mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Active Shift</h2>
        <p className="text-gray-600">Please return to POS to start a new shift.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
      <div className="text-center">
        <Clock size={64} className="mx-auto text-blue-600 mb-6" />
        
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <p className="text-sm text-gray-600 mb-2">Shift Duration</p>
          <p className="text-5xl font-bold text-blue-600 font-mono">{elapsedTime}</p>
          <p className="text-xs text-gray-600 mt-2">
            Started: {new Date(shift.clockInTime).toLocaleTimeString()}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Sales</p>
            <p className="text-2xl font-bold text-green-600">
              {shift.totalSales.toLocaleString()}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Expenses</p>
            <p className="text-2xl font-bold text-red-600">
              {shift.totalExpenses.toLocaleString()}
            </p>
          </div>
        </div>

        <button
          onClick={clockOut}
          className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 flex items-center justify-center gap-2 transition-colors"
        >
          <LogOut size={20} />
          Clock Out
        </button>
      </div>
    </div>
  );
}
