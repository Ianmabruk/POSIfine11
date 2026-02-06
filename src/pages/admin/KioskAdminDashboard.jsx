import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, Truck, Tag, TrendingUp, UserPlus, Users } from 'lucide-react';
import api from '../../services/api';

export default function KioskAdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inventory');
  const [products, setProducts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);

  if (!user) {
    navigate('/auth/login');
    return null;
  }

  const tabs = [
    { id: 'staff', label: 'Staff', icon: UserPlus },
    { id: 'inventory', label: 'Simple Inventory', icon: Package },
    { id: 'suppliers', label: 'Supplier Tracking', icon: Truck },
    { id: 'pricing', label: 'Price Rules', icon: Tag },
    { id: 'reports', label: 'Profit Reports', icon: TrendingUp },
  ];

  const kioskRoles = [
    { value: 'cashier', label: 'Cashier', icon: Users },
    { value: 'manager', label: 'Manager', icon: UserPlus },
    { value: 'stocker', label: 'Stocker', icon: Package }
  ];

  useEffect(() => {
    if (activeTab === 'staff') {
      loadStaff();
    }
  }, [activeTab]);

  const loadStaff = async () => {
    try {
      setLoadingStaff(true);
      const response = await api.get('/business/users');
      setStaff(response.users || []);
    } catch (error) {
      console.error('Failed to load staff:', error);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleAddStaff = async (formData) => {
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        business_role: formData.businessRole
      };
      await api.post('/business/users', payload);
      setShowAddStaff(false);
      loadStaff();
    } catch (error) {
      console.error('Failed to add staff:', error);
      alert('Failed to add staff member: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Kiosk Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage products, suppliers, and pricing</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Staff Tab */}
          {activeTab === 'staff' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Kiosk Staff</h2>
                <button
                  onClick={() => setShowAddStaff(true)}
                  className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus size={18} />
                  Add Staff
                </button>
              </div>
              {loadingStaff ? (
                <div className="text-center py-12 text-gray-500">Loading staff...</div>
              ) : staff.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No staff members yet.</p>
                  <p className="text-sm">Click "Add Staff" to create staff accounts.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {staff.map((member) => (
                        <tr key={member.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{member.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{member.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                              {member.business_role || member.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {member.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Product Inventory</h2>
                <button className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  <Plus size={18} />
                  Add Product
                </button>
              </div>
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No products in inventory yet.</p>
                <p className="text-sm">Click "Add Product" to start building your inventory.</p>
              </div>
            </div>
          )}

          {/* Suppliers Tab */}
          {activeTab === 'suppliers' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Supplier Contacts</h2>
                <button className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  <Plus size={18} />
                  Add Supplier
                </button>
              </div>
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No suppliers added yet.</p>
                <p className="text-sm">Click "Add Supplier" to track supplier information.</p>
              </div>
            </div>
          )}

          {/* Price Rules Tab */}
          {activeTab === 'pricing' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Price Rules & Discounts</h2>
                <button className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  <Plus size={18} />
                  New Rule
                </button>
              </div>
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No pricing rules configured yet.</p>
                <p className="text-sm">Set up bulk discounts, promotions, and pricing rules.</p>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Profit & Sales Reports</h2>
              </div>
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">Sales reports will appear here.</p>
                <p className="text-sm">View profit margins and sales analytics.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddStaff && (
        <AddStaffModal
          roles={kioskRoles}
          onClose={() => setShowAddStaff(false)}
          onSubmit={handleAddStaff}
        />
      )}
    </div>
  );
}

function AddStaffModal({ roles, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    businessRole: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.businessRole) {
      alert('Please fill all fields');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-600">
          <h3 className="text-2xl font-bold text-white">Add New Staff Member</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              placeholder="Staff name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              placeholder="staff@kiosk.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="text"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              placeholder="Temporary password"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={formData.businessRole}
              onChange={(e) => setFormData({ ...formData, businessRole: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              required
            >
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
              Add Staff
            </button>
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
