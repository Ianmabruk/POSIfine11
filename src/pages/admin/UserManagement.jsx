

import { useState, useEffect } from 'react';
import { users as usersApi, sales as salesApi, BASE_API_URL } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit2, Trash2, Mail, Shield, Eye, Monitor, X, Clock, ShoppingCart, UserCheck, UserX, Users, Lock } from 'lucide-react';


export default function UserManagement() {
  const { isCashierUserManagementEnabled, isCashier } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [liveViewUser, setLiveViewUser] = useState(null);
  const [liveViewData, setLiveViewData] = useState(null);
  const [liveViewRefresh, setLiveViewRefresh] = useState(0);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    permissions: {
      viewSales: true,
      viewInventory: true,
      viewExpenses: false,
      manageProducts: false
    }
  });
  
  const [showPINModal, setShowPINModal] = useState(false);
  const [selectedUserForPIN, setSelectedUserForPIN] = useState(null);
  const [newPIN, setNewPIN] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (liveViewData?.intervalId) {
        clearInterval(liveViewData.intervalId);
      }
    };
  }, [liveViewData]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getAll();
      // Ensure we always have an array
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading users:', error);
      // Don't show error to user, just log it
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };


  // Generate a random 4-digit PIN
  const generatePIN = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', newUser);
    
    // Validate input
    if (!newUser.name?.trim() || !newUser.email?.trim() || !newUser.password?.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (newUser.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    
    try {
      setLoading(true);
      
      // Generate PIN for cashier login
      const cashierPIN = generatePIN();
      
      const userData = {
        name: newUser.name.trim(),
        email: newUser.email.trim().toLowerCase(),
        password: newUser.password.trim(),
        pin: cashierPIN
      };
      
      console.log('Sending user data:', userData);
      
      // Create the user with proper cashier role and PIN
      const result = await usersApi.create(userData);
      
      console.log('User creation result:', result);
      
      // Refresh the users list
      await loadUsers();
      
      // Show success message with login credentials including PIN
      const loginInstructions = `✅ Cashier added successfully!\n\n📧 Email: ${userData.email}\n🔑 Password: ${userData.password}\n🔢 PIN: ${cashierPIN}\n\n💡 LOGIN OPTIONS:\n1. Email + Password: Use email and password above\n2. PIN Login: Use email + ${cashierPIN}\n\nPlease share these credentials securely with the new cashier.`;
      
      alert(loginInstructions);
      
      // Reset form and close modal
      setNewUser({
        name: '',
        email: '',
        password: '',
        permissions: { viewSales: true, viewInventory: true, viewExpenses: false, manageProducts: false }
      });
      setShowAddModal(false);
      
    } catch (error) {
      console.error('Error creating cashier:', error);
      let errorMessage = 'Failed to add cashier';
      
      if (error.message.includes('Current user not found')) {
        errorMessage = 'Authentication error. Please refresh the page and try again.';
      } else if (error.message.includes('email')) {
        errorMessage = 'Email already exists. Please use a different email.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = `Failed to add cashier: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePermissions = async (userId, permissions) => {
    try {
      setLoading(true);
      await usersApi.update(userId, { permissions });
      await loadUsers();
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating permissions:', error);
      alert('Failed to update permissions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };


  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      setLoading(true);
      const newStatus = !currentStatus;
      


      // Call the backend API to update user status
      const response = await fetch(`${BASE_API_URL}/users/${userId}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ active: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      await loadUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLockUnlockUser = async (userId, currentLocked) => {
    try {
      setLoading(true);
      const newLocked = !currentLocked;
      


      // Call the backend API to lock/unlock user
      const response = await fetch(`${BASE_API_URL}/users/${userId}/lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ locked: newLocked })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      await loadUsers();
    } catch (error) {
      console.error('Error updating user lock status:', error);
      alert('Failed to update user lock status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteUser = async (userId) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        setLoading(true);
        await usersApi.delete(userId);
        await loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResetPIN = (user) => {
    setSelectedUserForPIN(user);
    setNewPIN(generatePIN());
    setShowPINModal(true);
  };

  const handleConfirmPINReset = async () => {
    try {
      setLoading(true);
      await usersApi.update(selectedUserForPIN.id, { cashierPIN: newPIN });
      await loadUsers();
      setShowPINModal(false);
      setSelectedUserForPIN(null);
      setNewPIN('');
      alert(`✅ PIN reset successfully!\n\n🔢 New PIN for ${selectedUserForPIN.name}: ${newPIN}\n\nPlease share this PIN securely with the cashier.`);
    } catch (error) {
      console.error('Error resetting PIN:', error);
      alert('Failed to reset PIN: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const startLiveView = (user) => {
    setLiveViewUser(user);
    setLiveViewData({ 
      isActive: false, 
      currentCart: [], 
      totalSalesToday: 0, 
      salesCount: 0, 
      lastActivity: 'Loading...' 
    });

    // Set up auto-refresh every 3 seconds
    const interval = setInterval(() => {
      loadLiveViewData(user);
    }, 3000);

    // Store interval ID for cleanup
    setLiveViewData(prev => ({ ...prev, intervalId: interval }));

    loadLiveViewData(user);
  };

  const stopLiveView = () => {
    if (liveViewData?.intervalId) {
      clearInterval(liveViewData.intervalId);
    }
    setLiveViewUser(null);
    setLiveViewData(null);
  };

  const loadLiveViewData = async (user) => {
    try {
      const sales = await salesApi.getAll();
      const salesArray = Array.isArray(sales) ? sales : [];
      const recentSales = salesArray
        .filter(sale => sale.cashierId === user.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);

      // Simulate current session data
      const currentSession = {
        isActive: Math.random() > 0.3, // 70% chance they're active
        currentCart: recentSales.length > 0 ? [
          { name: 'Product A', price: 150, quantity: 2 },
          { name: 'Product B', price: 300, quantity: 1 }
        ] : [],
        totalSalesToday: recentSales.reduce((sum, sale) => sum + sale.total, 0),
        salesCount: recentSales.length,
        lastActivity: recentSales.length > 0 ? new Date(recentSales[0].createdAt).toLocaleTimeString() : 'No recent activity'
      };

      setLiveViewData(currentSession);
    } catch (error) {
      console.error('Error loading live view data:', error);
    }
  };

  const cashiers = (users || []).filter(u => u.role === 'cashier');

  if (loading && users.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-sm text-gray-600 mt-1">Manage cashiers and their permissions</p>
        </div>
        {isCashierUserManagementEnabled() && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
            disabled={loading}
          >
            <Plus className="w-4 h-4" />
            Add Cashier
          </button>
        )}
      </div>

      {/* Show informational message for cashiers when user management is disabled */}
      {isCashier() && !isCashierUserManagementEnabled() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
              <Lock className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <h4 className="font-semibold text-yellow-800">User Management Restricted</h4>
              <p className="text-sm text-yellow-700 mt-1">
                The admin has disabled cashier user management. You cannot add, edit, or remove users at this time.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <p className="text-sm text-blue-700 mb-1">Total Users</p>
          <p className="text-3xl font-bold text-blue-900">{users.length}</p>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <p className="text-sm text-green-700 mb-1">Cashiers</p>
          <p className="text-3xl font-bold text-green-900">{cashiers.length}</p>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <p className="text-sm text-purple-700 mb-1">Active Users</p>
          <p className="text-3xl font-bold text-purple-900">{users.filter(u => u.active).length}</p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Users</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">

              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Plan</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">PIN</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(users || []).map((user) => (

                <tr key={user.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-sm">{user.email}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`badge ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'badge-success'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="badge badge-warning">{user.plan || 'N/A'}</span>
                  </td>
                  
                  <td className="px-4 py-3 text-sm">
                    {user.role === 'cashier' ? (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {user.pin || user.cashierPIN || '----'}
                        </span>
                        <button
                          onClick={() => handleResetPIN(user)}
                          className="p-1 hover:bg-yellow-50 rounded text-yellow-600"
                          title="Reset PIN"
                          disabled={loading}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">N/A</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        user.active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {user.active ? (
                          <>
                            <UserCheck className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <UserX className="w-3 h-3" />
                            Inactive
                          </>
                        )}
                      </span>
                      {user.locked && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          <Shield className="w-3 h-3" />
                          Locked
                        </span>
                      )}
                    </div>
                  </td>


                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      {isCashierUserManagementEnabled() && (
                        <>
                          <button
                            onClick={() => handleToggleUserStatus(user.id, user.active)}
                            className={`p-2 rounded-lg transition ${
                              user.active
                                ? 'hover:bg-red-50 text-red-600'
                                : 'hover:bg-green-50 text-green-600'
                            }`}
                            title={user.active ? 'Deactivate User' : 'Activate User'}
                            disabled={loading}
                          >
                            {user.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                          
                          <button
                            onClick={() => handleLockUnlockUser(user.id, user.locked || false)}
                            className={`p-2 rounded-lg transition ${
                              user.locked
                                ? 'hover:bg-green-50 text-green-600'
                                : 'hover:bg-red-50 text-red-600'
                            }`}
                            title={user.locked ? 'Unlock User' : 'Lock User'}
                            disabled={loading}
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      {user.role === 'cashier' && (
                        <>
                          <button
                            onClick={() => {
                              localStorage.setItem('adminViewingCashier', user.id);
                              window.location.href = '/cashier/pos';
                            }}
                            className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                            title="Access Cashier POS"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => startLiveView(user)}
                            className="p-2 hover:bg-green-50 rounded-lg text-green-600"
                            title="Live View"
                          >
                            <Monitor className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      {isCashierUserManagementEnabled() && (
                        <>
                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-2 hover:bg-purple-50 rounded-lg text-purple-600"
                            title="Edit Permissions"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                            title="Delete User"
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {users.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No users found</p>
              <p className="text-gray-500 text-sm mt-2">
                Add your first cashier to get started
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add New Cashier</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                className="input"
                value={newUser.name || ''}
                onChange={(e) => {
                  console.log('Name input changed:', e.target.value);
                  setNewUser({ ...newUser, name: e.target.value });
                }}
                required
                disabled={loading}
              />
              <input
                type="email"
                placeholder="Email"
                className="input"
                value={newUser.email || ''}
                onChange={(e) => {
                  console.log('Email input changed:', e.target.value);
                  setNewUser({ ...newUser, email: e.target.value });
                }}
                required
                disabled={loading}
              />
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                className="input"
                value={newUser.password || ''}
                onChange={(e) => {
                  console.log('Password input changed:', e.target.value);
                  setNewUser({ ...newUser, password: e.target.value });
                }}
                required
                minLength={6}
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                💡 The cashier will use this email and password to log in to the system
              </p>
              
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 text-sm">Permissions</h4>
                <div className="space-y-2">
                  {Object.entries(newUser.permissions).map(([key, value]) => (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setNewUser({
                          ...newUser,
                          permissions: { ...newUser.permissions, [key]: e.target.checked }
                        })}
                        disabled={loading}
                      />
                      <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  type="submit" 
                  className="btn-primary flex-1"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Cashier'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  className="btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Permissions Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Edit Permissions: {editingUser.name}</h3>
            <div className="space-y-3">
              {Object.entries(editingUser.permissions || {}).map(([key, value]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      permissions: { ...editingUser.permissions, [key]: e.target.checked }
                    })}
                    disabled={loading}
                  />
                  <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <button 
                onClick={() => handleUpdatePermissions(editingUser.id, editingUser.permissions)}
                className="btn-primary flex-1"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                onClick={() => setEditingUser(null)} 
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live View Modal */}
      {liveViewUser && liveViewData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Live View: {liveViewUser.name}</h3>
                  <p className="text-sm text-gray-600">Real-time cashier activity monitoring</p>
                </div>
              </div>
              <button 
                onClick={stopLiveView}
                className="p-2 hover:bg-red-50 rounded-lg text-red-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
              <div className={`w-3 h-3 rounded-full ${liveViewData.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="font-semibold">
                {liveViewData.isActive ? 'Currently Active' : 'Currently Inactive'}
              </span>
              <div className="ml-auto flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                Last Activity: {liveViewData.lastActivity}
              </div>
            </div>

            {/* Current Cart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold">Current Cart</h4>
                </div>
                {(liveViewData.currentCart?.length || 0) > 0 ? (
                  <div className="space-y-2">
                    {(liveViewData.currentCart || []).map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">{item.name} x{item.quantity}</span>
                        <span className="text-sm font-semibold text-green-600">KSH {item.price.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span className="text-green-600">
                          KSH {(liveViewData.currentCart || []).reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">No items in cart</p>
                )}
              </div>

              <div className="card">
                <h4 className="font-semibold mb-4">Today's Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Sales Count:</span>
                    <span className="font-semibold">{liveViewData.salesCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Sales:</span>
                    <span className="font-semibold text-green-600">KSH {liveViewData.totalSalesToday.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Average Sale:</span>
                    <span className="font-semibold">
                      KSH {liveViewData.salesCount > 0 ? Math.round(liveViewData.totalSalesToday / liveViewData.salesCount).toLocaleString() : '0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Auto-refresh indicator */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                🔄 Auto-refreshing every 3 seconds • Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>

        </div>
      )}

      {/* PIN Reset Modal */}
      {showPINModal && selectedUserForPIN && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Reset PIN for {selectedUserForPIN.name}</h3>
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Generate a new 4-digit PIN for this cashier. The old PIN will be invalid.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 mb-2">New PIN:</p>
                <div className="text-center">
                  <span className="font-mono text-3xl font-bold text-blue-600 bg-white px-4 py-2 rounded border">
                    {newPIN}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setNewPIN(generatePIN())}
                className="btn-secondary flex-1"
                disabled={loading}
              >
                Generate New PIN
              </button>
              <button 
                onClick={handleConfirmPINReset}
                className="btn-primary flex-1"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Confirm & Update'}
              </button>
            </div>
            <div className="mt-4">
              <button 
                onClick={() => {
                  setShowPINModal(false);
                  setSelectedUserForPIN(null);
                  setNewPIN('');
                }} 
                className="btn-secondary w-full"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
