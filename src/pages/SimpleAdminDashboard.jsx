import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { users as usersApi, products as productsApi, sales as salesApi } from '../services/api';
import { LogOut, Users, Package, DollarSign } from 'lucide-react';

export default function SimpleAdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ totalSales: 0, totalProducts: 0, totalUsers: 0 });
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'cashier' });
  const [newProduct, setNewProduct] = useState({ name: '', price: '', quantity: 0, cost: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [u, p, s] = await Promise.all([
        usersApi.getAll(),
        productsApi.getAll(),
        salesApi.getAll()
      ]);
      
      setUsers(Array.isArray(u) ? u : []);
      setProducts(Array.isArray(p) ? p : []);
      
      const totalSales = Array.isArray(s) ? s.reduce((sum, sale) => sum + (sale.total || 0), 0) : 0;
      setStats({
        totalSales: totalSales,
        totalProducts: Array.isArray(p) ? p.length : 0,
        totalUsers: Array.isArray(u) ? u.length : 0
      });
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await usersApi.create({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: 'cashier'
      });
      alert('✅ Cashier added successfully! They can now log in.');
      setNewUser({ name: '', email: '', password: '', role: 'cashier' });
      setShowAddUser(false);
      loadData();
    } catch (error) {
      console.error('Failed to add user:', error);
      alert('Failed to add user: ' + error.message);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const parsedCost = newProduct.cost === '' ? 0 : parseFloat(newProduct.cost) || 0;
      await productsApi.create({
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        quantity: parseInt(newProduct.quantity) || 0,
        cost: parsedCost,
        cost_per_unit: parsedCost
      });
      alert('\u2705 Product added successfully!');
      setNewProduct({ name: '', price: '', quantity: 0, cost: '' });
      setShowAddProduct(false);
      loadData();
    } catch (error) {
      console.error('Failed to add product:', error);
      alert('Failed to add product: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">TZS {stats.totalSales.toLocaleString()}</p>
              </div>
              <DollarSign className="text-green-600" size={40} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
              <Package className="text-blue-600" size={40} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <Users className="text-purple-600" size={40} />
            </div>
          </div>
        </div>

        {/* Users Section */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Users / Cashiers</h2>
            <button
              onClick={() => setShowAddUser(!showAddUser)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Cashier
            </button>
          </div>
          
          {showAddUser && (
            <div className="p-6 border-b bg-gray-50">
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    Save Cashier
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddUser(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
          
          <div className="p-6">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Email</th>
                  <th className="text-left py-2">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b">
                    <td className="py-2">{u.name}</td>
                    <td className="py-2">{u.email}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Products Section */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Products</h2>
            <button
              onClick={() => setShowAddProduct(!showAddProduct)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Add Product
            </button>
          </div>
          
          {showAddProduct && (
            <div className="p-6 border-b bg-gray-50">
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (TZS)</label>
                  <input
                    type="number"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost / COG (TZS)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={newProduct.cost}
                    onChange={(e) => setNewProduct({...newProduct, cost: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={newProduct.quantity}
                    onChange={(e) => setNewProduct({...newProduct, quantity: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    Save Product
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddProduct(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
          
          <div className="p-6">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Product Name</th>
                  <th className="text-left py-2">Price</th>
                  <th className="text-left py-2">Cost/COG</th>
                  <th className="text-left py-2">Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="border-b">
                    <td className="py-2">{p.name}</td>
                    <td className="py-2">TZS {p.price?.toLocaleString()}</td>
                    <td className="py-2">TZS {(p.cost_per_unit || p.cost || 0).toLocaleString()}</td>
                    <td className="py-2">{p.quantity || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
