import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, DollarSign, Package, Image as ImageIcon } from 'lucide-react';
import api from '../../services/api';

export default function SchoolAdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [products, setProducts] = useState([]);

  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productGroup, setProductGroup] = useState('canteen');

  const [studentForm, setStudentForm] = useState({
    name: '',
    admissionNumber: '',
    className: '',
    parentName: '',
    parentPhone: '',
    studentImage: '',
    idImage: ''
  });

  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    cost: '',
    quantity: '',
    unit: 'pcs',
    category: 'canteen',
    image: ''
  });

  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [studentError, setStudentError] = useState('');
  const [productError, setProductError] = useState('');

  if (!user) {
    navigate('/auth/login');
    return null;
  }

  useEffect(() => {
    if (activeTab === 'students') {
      loadStudents();
    }
    if (activeTab === 'canteen' || activeTab === 'uniform') {
      loadProducts();
    }
  }, [activeTab]);

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      setStudentError('');
      const data = await api.get('/students');
      setStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      setStudentError(error.message || 'Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      setProductError('');
      const data = await api.get('/products');
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      setProductError(error.message || 'Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const onStudentImageSelect = async (e, fieldName) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setStudentError('Image must be smaller than 2MB');
      return;
    }
    try {
      const image = await fileToBase64(file);
      setStudentForm((prev) => ({ ...prev, [fieldName]: image }));
    } catch {
      setStudentError('Failed to read image file');
    }
  };

  const onProductImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setProductError('Image must be smaller than 2MB');
      return;
    }
    try {
      const image = await fileToBase64(file);
      setProductForm((prev) => ({ ...prev, image }));
    } catch {
      setProductError('Failed to read image file');
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
        parentPhone: studentForm.parentPhone,
        studentImage: studentForm.studentImage,
        idImage: studentForm.idImage
      };
      const created = await api.post('/students', payload);
      setStudents((prev) => [created, ...prev]);
      setShowAddStudent(false);
      setStudentForm({
        name: '',
        admissionNumber: '',
        className: '',
        parentName: '',
        parentPhone: '',
        studentImage: '',
        idImage: ''
      });
    } catch (error) {
      setStudentError(error.message || 'Failed to add student');
    }
  };

  const openAddProductModal = (group) => {
    setProductGroup(group);
    setProductForm({
      name: '',
      price: '',
      cost: '',
      quantity: '',
      unit: 'pcs',
      category: group,
      image: ''
    });
    setProductError('');
    setShowAddProduct(true);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      setProductError('');
      const payload = {
        name: productForm.name,
        price: Number(productForm.price || 0),
        cost: Number(productForm.cost || 0),
        cost_per_unit: Number(productForm.cost || 0),
        quantity: Number(productForm.quantity || 0),
        unit: productForm.unit || 'pcs',
        category: productForm.category || productGroup,
        image: productForm.image,
        visible_to_cashier: true,
        visibleToCashier: true
      };
      const created = await api.post('/products', payload);
      setProducts((prev) => [created, ...prev]);
      setShowAddProduct(false);
    } catch (error) {
      setProductError(error.message || 'Failed to add product');
    }
  };

  const canteenProducts = useMemo(
    () => products.filter((p) => String(p.category || '').toLowerCase().includes('canteen')),
    [products]
  );

  const uniformAndBooksProducts = useMemo(
    () =>
      products.filter((p) => {
        const category = String(p.category || '').toLowerCase();
        return category.includes('uniform') || category.includes('book');
      }),
    [products]
  );

  const tabs = [
    { id: 'students', label: 'Students', icon: Users },
    { id: 'fees', label: 'Term Fees', icon: DollarSign },
    { id: 'canteen', label: 'Canteen Products', icon: Package },
    { id: 'uniform', label: 'Uniform & Books', icon: Package }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">School Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage students, fees, and school inventory</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-8 border-b">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                  activeTab === tab.id ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
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
                <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{studentError}</div>
              )}

              {loadingStudents ? (
                <div className="text-center py-12 text-gray-500">Loading students...</div>
              ) : students.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No students added yet.</p>
                  <p className="text-sm">Click Add Student to enroll a new student.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission No</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Photo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Photo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr key={student.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">{student.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{student.admission_number || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{student.class_name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {student.parent_name || '-'}
                            <div className="text-xs text-gray-400">{student.parent_phone || ''}</div>
                          </td>
                          <td className="px-4 py-3">
                            {student.student_image ? (
                              <img src={student.student_image} alt="Student" className="w-12 h-12 object-cover rounded" />
                            ) : (
                              <span className="text-xs text-gray-400">No image</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {student.id_image ? (
                              <img src={student.id_image} alt="Student ID" className="w-12 h-12 object-cover rounded" />
                            ) : (
                              <span className="text-xs text-gray-400">No image</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'fees' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Term Fees Configuration</h2>
              <p className="text-gray-500">Use the Students and Fees tabs in student dashboards to track payments and balances.</p>
            </div>
          )}

          {activeTab === 'canteen' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Canteen Products</h2>
                <button
                  onClick={() => openAddProductModal('canteen')}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus size={18} />
                  Add Product
                </button>
              </div>
              {productError && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{productError}</div>}
              {loadingProducts ? (
                <div className="text-center py-12 text-gray-500">Loading products...</div>
              ) : canteenProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No canteen products added yet.</p>
                  <p className="text-sm">Click Add Product to add food and beverage items.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {canteenProducts.map((item) => (
                    <div key={item.id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex gap-3">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-14 h-14 rounded object-cover" />
                        ) : (
                          <div className="w-14 h-14 rounded bg-gray-200 flex items-center justify-center text-gray-400">
                            <ImageIcon size={16} />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">KSH {Number(item.price || 0).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">Stock: {Number(item.quantity || 0)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'uniform' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Uniform and Books Stock</h2>
                <button
                  onClick={() => openAddProductModal('uniform')}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus size={18} />
                  Add Item
                </button>
              </div>
              {productError && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{productError}</div>}
              {loadingProducts ? (
                <div className="text-center py-12 text-gray-500">Loading items...</div>
              ) : uniformAndBooksProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No uniforms or books added yet.</p>
                  <p className="text-sm">Click Add Item to add school supplies.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uniformAndBooksProducts.map((item) => (
                    <div key={item.id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex gap-3">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-14 h-14 rounded object-cover" />
                        ) : (
                          <div className="w-14 h-14 rounded bg-gray-200 flex items-center justify-center text-gray-400">
                            <ImageIcon size={16} />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">KSH {Number(item.price || 0).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">Stock: {Number(item.quantity || 0)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showAddStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                placeholder="Parent or Guardian Name"
                className="input"
                value={studentForm.parentName}
                onChange={(e) => setStudentForm({ ...studentForm, parentName: e.target.value })}
              />
              <input
                type="text"
                placeholder="Parent or Guardian Phone"
                className="input"
                value={studentForm.parentPhone}
                onChange={(e) => setStudentForm({ ...studentForm, parentPhone: e.target.value })}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Student Photo</label>
                  <input type="file" accept="image/*" className="input mt-1" onChange={(e) => onStudentImageSelect(e, 'studentImage')} />
                  {studentForm.studentImage && <img src={studentForm.studentImage} alt="Student preview" className="w-20 h-20 mt-2 object-cover rounded" />}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Student ID Photo</label>
                  <input type="file" accept="image/*" className="input mt-1" onChange={(e) => onStudentImageSelect(e, 'idImage')} />
                  {studentForm.idImage && <img src={studentForm.idImage} alt="ID preview" className="w-20 h-20 mt-2 object-cover rounded" />}
                </div>
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">Save Student</button>
                <button type="button" onClick={() => setShowAddStudent(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-xl p-6 w-full max-w-xl">
            <h3 className="text-xl font-bold mb-4">{productGroup === 'canteen' ? 'Add Canteen Product' : 'Add Uniform or Book Item'}</h3>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <input
                type="text"
                placeholder="Item Name"
                className="input"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Selling Price"
                  className="input"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="COGS Cost"
                  className="input"
                  value={productForm.cost}
                  onChange={(e) => setProductForm({ ...productForm, cost: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="number"
                  min="0"
                  placeholder="Quantity"
                  className="input"
                  value={productForm.quantity}
                  onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Unit (pcs, box)"
                  className="input"
                  value={productForm.unit}
                  onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Category"
                  className="input"
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Item Image</label>
                <input type="file" accept="image/*" className="input mt-1" onChange={onProductImageSelect} />
                {productForm.image && <img src={productForm.image} alt="Item preview" className="w-20 h-20 mt-2 object-cover rounded" />}
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">Save Item</button>
                <button type="button" onClick={() => setShowAddProduct(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
