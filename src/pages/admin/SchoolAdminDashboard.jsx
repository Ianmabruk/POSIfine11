import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, DollarSign, Package } from 'lucide-react';
import api from '../../services/api';

export default function SchoolAdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [products, setProducts] = useState([]);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [studentForm, setStudentForm] = useState({
    name: '',
    admissionNumber: '',
    className: '',
    parentName: '',
    parentPhone: ''
  });
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentError, setStudentError] = useState('');

  if (!user) {
    navigate('/auth/login');
    return null;
  }

  useEffect(() => {
    if (activeTab === 'students') {
      loadStudents();
    }
  }, [activeTab]);

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      setStudentError('');
      const data = await api.get('/students');
      setStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load students:', error);
      setStudentError(error.message || 'Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      setStudentError('');
      const payload = {
        name: studentForm.name,
        admissionNumber: studentForm.admissionNumber,
        className: studentForm.className,
        parentName: studentForm.parentName,
        parentPhone: studentForm.parentPhone
      };
      const created = await api.post('/students', payload);
      setStudents(prev => [created, ...prev]);
      setShowAddStudent(false);
      setStudentForm({ name: '', admissionNumber: '', className: '', parentName: '', parentPhone: '' });
    } catch (error) {
      console.error('Failed to add student:', error);
      setStudentError(error.message || 'Failed to add student');
    }
  };

  const tabs = [
    { id: 'students', label: 'Students', icon: Users },
    { id: 'fees', label: 'Term Fees', icon: DollarSign },
    { id: 'canteen', label: 'Canteen Products', icon: Package },
    { id: 'uniform', label: 'Uniform & Books', icon: Package },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">School Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage students, fees, and inventory</p>
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
                    ? 'text-green-600 border-b-2 border-green-600'
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
          {/* Students Tab */}
          {activeTab === 'students' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Student Registry</h2>
                <button
                  onClick={() => setShowAddStudent(true)}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus size={18} />
                  Add Student
                </button>
              </div>
              {studentError && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  {studentError}
                </div>
              )}
              {loadingStudents ? (
                <div className="text-center py-12 text-gray-500">Loading students...</div>
              ) : students.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No students added yet.</p>
                  <p className="text-sm">Click "Add Student" to enroll a new student.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission No</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr key={student.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">{student.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{student.admission_number || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{student.class_name || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{student.parent_name || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{student.parent_phone || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Term Fees Tab */}
          {activeTab === 'fees' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Term Fees Configuration</h2>
                <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  <Plus size={18} />
                  Set Fee
                </button>
              </div>
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No term fees configured yet.</p>
                <p className="text-sm">Set up fee amounts for each term or class.</p>
              </div>
            </div>
          )}

          {/* Canteen Products Tab */}
          {activeTab === 'canteen' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Canteen Products</h2>
                <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  <Plus size={18} />
                  Add Product
                </button>
              </div>
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No canteen products added yet.</p>
                <p className="text-sm">Click "Add Product" to add food/beverage items.</p>
              </div>
            </div>
          )}

          {/* Uniform & Books Tab */}
          {activeTab === 'uniform' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Uniform & Books Stock</h2>
                <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  <Plus size={18} />
                  Add Item
                </button>
              </div>
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No uniforms or books added yet.</p>
                <p className="text-sm">Click "Add Item" to add school supplies to inventory.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">Add Student</h3>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <input
                type="text"
                placeholder="Student Name"
                className="input"
                value={studentForm.name}
                onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Admission Number"
                  className="input"
                  value={studentForm.admissionNumber}
                  onChange={(e) => setStudentForm({ ...studentForm, admissionNumber: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Class"
                  className="input"
                  value={studentForm.className}
                  onChange={(e) => setStudentForm({ ...studentForm, className: e.target.value })}
                />
              </div>
              <input
                type="text"
                placeholder="Parent/Guardian Name"
                className="input"
                value={studentForm.parentName}
                onChange={(e) => setStudentForm({ ...studentForm, parentName: e.target.value })}
              />
              <input
                type="text"
                placeholder="Parent/Guardian Phone"
                className="input"
                value={studentForm.parentPhone}
                onChange={(e) => setStudentForm({ ...studentForm, parentPhone: e.target.value })}
              />
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">Save Student</button>
                <button type="button" onClick={() => setShowAddStudent(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
