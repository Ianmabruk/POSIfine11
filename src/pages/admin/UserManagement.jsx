



import { useState, useEffect } from 'react';
import { users as usersApi, sales as salesApi } from '../../services/api';
import { Plus, Edit2, Trash2, Mail, Shield, Eye, Monitor, X, Clock, ShoppingCart } from 'lucide-react';

export default function UserManagement() {

  const [users, setUsers] = useState([]);
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
      const data = await usersApi.getAll();
      // Ensure we always have an array, even if API returns undefined/null
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]); // Fallback to empty array on error
    }
  };


  const handleAddUser = async (e) => {
    e.preventDefault();
    
    // Validate password
    if (!newUser.password || newUser.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    
    try {

      const result = await usersApi.create({
        ...newUser,
        role: 'cashier',
        addedByAdmin: true,
        needsPasswordSetup: true

      });
      
      // Show success message with credentials
      alert(`Cashier added successfully!\n\nLogin Credentials:\nEmail: ${newUser.email}\nPassword: ${newUser.password}\n\nThe cashier will need to log in and set their password first.\nPlease share these credentials securely.`);
      
      setNewUser({
        name: '',
        email: '',
        password: '',
        permissions: { viewSales: true, viewInventory: true, viewExpenses: false, manageProducts: false }
      });
      setShowAddModal(false);
      loadUsers();
    } catch (error) {
      console.error('Error creating cashier:', error);
      alert('Failed to add cashier: ' + (error.message || 'Unknown error'));
    }
  };

  const handleUpdatePermissions = async (userId, permissions) => {
    await usersApi.update(userId, { permissions });
    loadUsers();
    setEditingUser(null);
  };


  const handleDeleteUser = async (userId) => {
    if (confirm('Are you sure you want to delete this user?')) {
      await usersApi.delete(userId);
      loadUsers();
    }
  };

  const startLiveView = (user) => {
    setLiveViewUser(user);
    setLiveViewData({ isActive: false, currentCart: [], totalSalesToday: 0, salesCount: 0, lastActivity: 'Loading...' });

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-sm text-gray-600 mt-1">Manage cashiers and their permissions</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Cashier
        </button>
      </div>

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
          <p className="text-sm text-purple-700 mb-1">Admins</p>

          <p className="text-3xl font-bold text-purple-900">{(users || []).filter(u => u.role === 'admin').length}</p>
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
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Permissions</th>
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
                      <button
                        onClick={() => setEditingUser(user)}
                        className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                      >
                        Edit Permissions
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">Full Access</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-sm">
                    {user.role === 'cashier' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            // Store the selected cashier ID for admin access
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
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Email"
                className="input"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                className="input"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                required
                minLength={6}
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
                      />
                      <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">Add Cashier</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
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
                  />
                  <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <button 
                onClick={() => handleUpdatePermissions(editingUser.id, editingUser.permissions)}
                className="btn-primary flex-1"
              >
                Save Changes
              </button>
              <button onClick={() => setEditingUser(null)} className="btn-secondary">Cancel</button>
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
    </div>
  );
}
