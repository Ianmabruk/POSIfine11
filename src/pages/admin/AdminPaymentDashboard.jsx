import { useState, useEffect } from 'react';
import { Users, DollarSign, CheckCircle, XCircle, Lock, Unlock } from 'lucide-react';
import { BASE_API_URL } from '../../services/api';

export default function AdminPaymentDashboard() {
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // Refresh every 5 seconds for real-time updates
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = BASE_API_URL;
      
      const [usersRes, paymentsRes] = await Promise.all([
        fetch(`${API_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/payments`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (usersRes.ok && paymentsRes.ok) {
        const usersData = await usersRes.json();
        const paymentsData = await paymentsRes.json();
        setUsers(usersData);
        setPayments(paymentsData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const activateUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = BASE_API_URL;
      
      await fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ active: true })
      });
      
      fetchData();
    } catch (error) {
      console.error('Failed to activate user:', error);
    }
  };

  const lockUser = async (userId, locked) => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = BASE_API_URL;
      
      await fetch(`${API_URL}/users/${userId}/lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ locked })
      });
      
      fetchData();
    } catch (error) {
      console.error('Failed to lock/unlock user:', error);
    }
  };

  const createCashier = async (userData) => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = BASE_API_URL;
      
      await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });
      
      fetchData();
    } catch (error) {
      console.error('Failed to create cashier:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const paidUsers = users.filter(u => u.active && u.plan);
  const pendingUsers = users.filter(u => !u.active || !u.plan);
  const recentPayments = payments.slice(-5).reverse();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Active Users</p>
              <p className="text-3xl font-bold text-green-700">{paidUsers.length}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Pending Users</p>
              <p className="text-3xl font-bold text-yellow-700">{pendingUsers.length}</p>
            </div>
            <Users className="w-12 h-12 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold text-blue-700">
                KSH {payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Recent Payments</h2>
        <div className="space-y-3">
          {recentPayments.map(payment => {
            const user = users.find(u => u.id === payment.userId);
            return (
              <div key={payment.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <p className="font-semibold">{user?.name || 'Unknown User'}</p>
                  <p className="text-sm text-gray-600">{payment.plan} plan</p>
                  <p className="text-xs text-gray-500">{new Date(payment.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">KSH {payment.amount.toLocaleString()}</p>
                  <p className="text-xs text-green-500">{payment.status}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* User Management */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">User Management</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">User</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Plan</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.plan === 'ultra' ? 'bg-purple-100 text-purple-800' :
                      user.plan === 'basic' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.plan || 'No Plan'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {user.active ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle size={16} />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 text-sm">
                          <XCircle size={16} />
                          Inactive
                        </span>
                      )}
                      {user.locked && (
                        <span className="text-red-500 text-xs">(Locked)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {!user.active && user.plan && (
                        <button
                          onClick={() => activateUser(user.id)}
                          className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600"
                        >
                          Activate
                        </button>
                      )}
                      <button
                        onClick={() => lockUser(user.id, !user.locked)}
                        className={`px-3 py-1 rounded text-xs ${
                          user.locked 
                            ? 'bg-green-500 text-white hover:bg-green-600' 
                            : 'bg-red-500 text-white hover:bg-red-600'
                        }`}
                      >
                        {user.locked ? <Unlock size={14} /> : <Lock size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}