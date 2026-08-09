import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertCircle, Users, Pill, UserPlus, Stethoscope } from 'lucide-react';
import api from '../../services/api';

export default function HospitalAdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [staff, setStaff] = useState([]);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);

  if (!user) {
    navigate('/auth/login');
    return null;
  }

  const tabs = [
    { id: 'staff', label: 'Staff', icon: UserPlus },
    { id: 'services', label: 'Services', icon: Users },
    { id: 'medicines', label: 'Medicines', icon: Pill },
    { id: 'patients', label: 'Patient Billing', icon: AlertCircle },
    { id: 'commission', label: 'Doctor Commission', icon: Users },
    { id: 'expiry', label: 'Batch & Expiry', icon: AlertCircle },
  ];

  const hospitalRoles = [
    { value: 'doctor', label: 'Doctor', icon: Stethoscope },
    { value: 'reception', label: 'Receptionist', icon: Users },
    { value: 'pharmacist', label: 'Pharmacist', icon: Pill },
    { value: 'nurse', label: 'Nurse', icon: UserPlus }
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
          <h1 className="text-3xl font-bold text-gray-900">Hospital Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage services, medicines, and billing</p>
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
                    ? 'text-blue-600 border-b-2 border-blue-600'
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
                <h2 className="text-xl font-semibold text-gray-900">Hospital Staff</h2>
                <button
                  onClick={() => setShowAddStaff(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
                <>
                  <div className="md:hidden space-y-3">
                    {staff.map((member) => (
                      <div key={member.id} className="bg-white rounded-xl shadow p-4 space-y-2 border border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{member.name}</span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {member.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">{member.email}</div>
                        <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                          <span className="text-gray-600">Role</span>
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">{member.business_role || member.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="hidden md:block overflow-x-auto">
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
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
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
                </>
              )}
            </div>
          )}

          {/* Services Tab */}
          {activeTab === 'services' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Medical Services</h2>
                <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus size={18} />
                  Add Service
                </button>
              </div>
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No services added yet.</p>
                <p className="text-sm">Click "Add Service" to create a new medical service.</p>
              </div>
            </div>
          )}

          {/* Medicines Tab */}
          {activeTab === 'medicines' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Medicines Inventory</h2>
                <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus size={18} />
                  Add Medicine
                </button>
              </div>
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No medicines added yet.</p>
                <p className="text-sm">Click "Add Medicine" to add inventory items.</p>
              </div>
            </div>
          )}

          {/* Patient Billing Tab */}
          {activeTab === 'patients' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Patient Billing Records</h2>
              </div>
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">Patient billing records will appear here.</p>
                <p className="text-sm">Billing records are created when staff process sales.</p>
              </div>
            </div>
          )}

          {/* Doctor Commission Tab */}
          {activeTab === 'commission' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Doctor Commission Tracking</h2>
              </div>
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">Doctor commission records will appear here.</p>
                <p className="text-sm">Commission is calculated based on services provided.</p>
              </div>
            </div>
          )}

          {/* Batch & Expiry Tab */}
          {activeTab === 'expiry' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Batch & Expiry Tracking</h2>
              </div>
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">Batch and expiry information will appear here.</p>
                <p className="text-sm">Track medicine batches and expiration dates.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddStaff && (
        <AddStaffModal
          roles={hospitalRoles}
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
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
          <h3 className="text-2xl font-bold text-white">Add New Staff Member</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Dr. John Doe"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="staff@hospital.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="text"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Temporary password"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={formData.businessRole}
              onChange={(e) => setFormData({ ...formData, businessRole: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            >
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
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
