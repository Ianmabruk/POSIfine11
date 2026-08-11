import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, DollarSign, Package, Image as ImageIcon, BookOpen, FileText, Award, Trash2, X, Upload } from 'lucide-react';
import api from '../../services/api';

const STORAGE_KEY = 'school_admin_data';

function loadSchoolData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { courses: [], assignments: [], results: [], fees: [] };
}

function saveSchoolData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function SchoolAdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [products, setProducts] = useState([]);

  const [schoolData, setSchoolData] = useState(loadSchoolData);

  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productGroup, setProductGroup] = useState('canteen');

  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAssignStudents, setShowAssignStudents] = useState(null);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [showAddResult, setShowAddResult] = useState(false);
  const [showAddFee, setShowAddFee] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(null);

  const [studentForm, setStudentForm] = useState({
    name: '', admissionNumber: '', className: '', parentName: '', parentPhone: '', studentImage: '', idImage: ''
  });
  const [productForm, setProductForm] = useState({
    name: '', price: '', cost: '', quantity: '', unit: 'pcs', category: 'canteen', image: ''
  });
  const [courseForm, setCourseForm] = useState({ name: '', code: '', teacher: '', description: '' });
  const [assignmentForm, setAssignmentForm] = useState({ courseId: '', title: '', description: '', dueDate: '', fileName: '' });
  const [resultForm, setResultForm] = useState({ courseId: '', studentId: '', examName: '', score: '', grade: '', remarks: '' });
  const [feeForm, setFeeForm] = useState({ studentId: '', term: '', amount: '', description: '', dueDate: '' });
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'cash', reference: '' });

  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [studentError, setStudentError] = useState('');
  const [productError, setProductError] = useState('');
  const [formError, setFormError] = useState('');

  const [selectedCourseFilter, setSelectedCourseFilter] = useState('');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState('');

  if (!user) { navigate('/auth/login'); return null; }

  const updateSchoolData = useCallback((updater) => {
    setSchoolData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveSchoolData(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (activeTab === 'students') loadStudents();
    if (activeTab === 'canteen' || activeTab === 'uniform') loadProducts();
  }, [activeTab]);

  const loadStudents = async () => {
    try {
      setLoadingStudents(true); setStudentError('');
      const data = await api.get('/students');
      setStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      setStudentError(error.message || 'Failed to load students');
    } finally { setLoadingStudents(false); }
  };

  const loadProducts = async () => {
    try {
      setLoadingProducts(true); setProductError('');
      const data = await api.get('/products');
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      setProductError(error.message || 'Failed to load products');
    } finally { setLoadingProducts(false); }
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const onStudentImageSelect = async (e, fieldName) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setStudentError('Image must be smaller than 2MB'); return; }
    try {
      const image = await fileToBase64(file);
      setStudentForm(prev => ({ ...prev, [fieldName]: image }));
    } catch { setStudentError('Failed to read image file'); }
  };

  const onProductImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setProductError('Image must be smaller than 2MB'); return; }
    try {
      const image = await fileToBase64(file);
      setProductForm(prev => ({ ...prev, image }));
    } catch { setProductError('Failed to read image file'); }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      setStudentError('');
      const created = await api.post('/students', {
        name: studentForm.name, admissionNumber: studentForm.admissionNumber,
        className: studentForm.className, parentName: studentForm.parentName,
        parentPhone: studentForm.parentPhone, studentImage: studentForm.studentImage,
        idImage: studentForm.idImage
      });
      setStudents(prev => [created, ...prev]);
      setShowAddStudent(false);
      setStudentForm({ name: '', admissionNumber: '', className: '', parentName: '', parentPhone: '', studentImage: '', idImage: '' });
    } catch (error) { setStudentError(error.message || 'Failed to add student'); }
  };

  const openAddProductModal = (group) => {
    setProductGroup(group);
    setProductForm({ name: '', price: '', cost: '', quantity: '', unit: 'pcs', category: group, image: '' });
    setProductError('');
    setShowAddProduct(true);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      setProductError('');
      const created = await api.post('/products', {
        name: productForm.name, price: Number(productForm.price || 0),
        cost: Number(productForm.cost || 0), cost_per_unit: Number(productForm.cost || 0),
        quantity: Number(productForm.quantity || 0), unit: productForm.unit || 'pcs',
        category: productForm.category || productGroup, image: productForm.image,
        visible_to_cashier: true, visibleToCashier: true
      });
      setProducts(prev => [created, ...prev]);
      setShowAddProduct(false);
    } catch (error) { setProductError(error.message || 'Failed to add product'); }
  };

  const handleAddCourse = (e) => {
    e.preventDefault();
    if (!courseForm.name.trim()) { setFormError('Course name is required'); return; }
    const course = { id: genId(), ...courseForm, studentIds: [], createdAt: new Date().toISOString() };
    updateSchoolData(prev => ({ ...prev, courses: [course, ...prev.courses] }));
    setShowAddCourse(false);
    setCourseForm({ name: '', code: '', teacher: '', description: '' });
    setFormError('');
  };

  const handleDeleteCourse = (courseId) => {
    updateSchoolData(prev => ({
      ...prev,
      courses: prev.courses.filter(c => c.id !== courseId),
      assignments: prev.assignments.filter(a => a.courseId !== courseId),
      results: prev.results.filter(r => r.courseId !== courseId)
    }));
  };

  const handleAssignStudents = (courseId, studentIds) => {
    updateSchoolData(prev => ({
      ...prev,
      courses: prev.courses.map(c => c.id === courseId ? { ...c, studentIds } : c)
    }));
    setShowAssignStudents(null);
  };

  const handleAddAssignment = (e) => {
    e.preventDefault();
    if (!assignmentForm.courseId || !assignmentForm.title.trim()) { setFormError('Course and title required'); return; }
    const assignment = { id: genId(), ...assignmentForm, createdAt: new Date().toISOString() };
    updateSchoolData(prev => ({ ...prev, assignments: [assignment, ...prev.assignments] }));
    setShowAddAssignment(false);
    setAssignmentForm({ courseId: '', title: '', description: '', dueDate: '', fileName: '' });
    setFormError('');
  };

  const handleDeleteAssignment = (id) => {
    updateSchoolData(prev => ({ ...prev, assignments: prev.assignments.filter(a => a.id !== id) }));
  };

  const handleAddResult = (e) => {
    e.preventDefault();
    if (!resultForm.courseId || !resultForm.studentId || !resultForm.examName) {
      setFormError('Course, student, and exam name required'); return;
    }
    const result = { id: genId(), ...resultForm, score: Number(resultForm.score || 0), createdAt: new Date().toISOString() };
    updateSchoolData(prev => ({ ...prev, results: [result, ...prev.results] }));
    setShowAddResult(false);
    setResultForm({ courseId: '', studentId: '', examName: '', score: '', grade: '', remarks: '' });
    setFormError('');
  };

  const handleDeleteResult = (id) => {
    updateSchoolData(prev => ({ ...prev, results: prev.results.filter(r => r.id !== id) }));
  };

  const handleAddFee = (e) => {
    e.preventDefault();
    if (!feeForm.studentId || !feeForm.amount) { setFormError('Student and amount required'); return; }
    const fee = { id: genId(), ...feeForm, amount: Number(feeForm.amount), paid: 0, payments: [], createdAt: new Date().toISOString() };
    updateSchoolData(prev => ({ ...prev, fees: [fee, ...prev.fees] }));
    setShowAddFee(false);
    setFeeForm({ studentId: '', term: '', amount: '', description: '', dueDate: '' });
    setFormError('');
  };

  const handleRecordPayment = (feeId) => {
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) { setFormError('Valid amount required'); return; }
    const payment = { id: genId(), amount: Number(paymentForm.amount), method: paymentForm.method, reference: paymentForm.reference, date: new Date().toISOString() };
    updateSchoolData(prev => ({
      ...prev,
      fees: prev.fees.map(f => f.id === feeId ? { ...f, paid: f.paid + payment.amount, payments: [...(f.payments || []), payment] } : f)
    }));
    setShowRecordPayment(null);
    setPaymentForm({ amount: '', method: 'cash', reference: '' });
    setFormError('');
  };

  const handleDeleteFee = (id) => {
    updateSchoolData(prev => ({ ...prev, fees: prev.fees.filter(f => f.id !== id) }));
  };

  const getStudentName = (studentId) => {
    const s = students.find(st => String(st.id) === String(studentId));
    return s ? s.name : 'Unknown Student';
  };
  const getCourseName = (courseId) => {
    const c = schoolData.courses.find(co => co.id === courseId);
    return c ? c.name : 'Unknown Course';
  };

  const canteenProducts = useMemo(() => products.filter(p => String(p.category || '').toLowerCase().includes('canteen')), [products]);
  const uniformAndBooksProducts = useMemo(() => products.filter(p => { const c = String(p.category || '').toLowerCase(); return c.includes('uniform') || c.includes('book'); }), [products]);

  const filteredAssignments = useMemo(() => {
    let list = schoolData.assignments;
    if (selectedCourseFilter) list = list.filter(a => a.courseId === selectedCourseFilter);
    return list;
  }, [schoolData.assignments, selectedCourseFilter]);

  const filteredResults = useMemo(() => {
    let list = schoolData.results;
    if (selectedCourseFilter) list = list.filter(r => r.courseId === selectedCourseFilter);
    if (selectedStudentFilter) list = list.filter(r => String(r.studentId) === String(selectedStudentFilter));
    return list;
  }, [schoolData.results, selectedCourseFilter, selectedStudentFilter]);

  const filteredFees = useMemo(() => {
    let list = schoolData.fees;
    if (selectedStudentFilter) list = list.filter(f => String(f.studentId) === String(selectedStudentFilter));
    return list;
  }, [schoolData.fees, selectedStudentFilter]);

  const tabs = [
    { id: 'students', label: 'Students', icon: Users },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'assignments', label: 'Assignments', icon: FileText },
    { id: 'results', label: 'Results', icon: Award },
    { id: 'fees', label: 'Fees', icon: DollarSign },
    { id: 'canteen', label: 'Canteen', icon: Package },
    { id: 'uniform', label: 'Uniform & Books', icon: Package }
  ];

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm";
  const btnPrimary = "flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm";
  const btnSecondary = "px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm";
  const btnDanger = "p-1.5 text-red-500 hover:bg-red-50 rounded";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">School Admin Dashboard</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage students, courses, assignments, results, fees & inventory</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 mb-6 sm:mb-8">
          <div className="flex gap-1 sm:gap-2 border-b min-w-max">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSelectedCourseFilter(''); setSelectedStudentFilter(''); }}
                  className={`flex items-center gap-1.5 px-3 py-2.5 sm:px-4 sm:py-3 font-medium transition-colors whitespace-nowrap text-xs sm:text-sm ${
                    activeTab === tab.id ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-900'
                  }`}>
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">

          {activeTab === 'students' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Student Registry ({students.length})</h2>
                <button onClick={() => setShowAddStudent(true)} className={btnPrimary}><Plus size={18} />Add Student</button>
              </div>
              {studentError && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{studentError}</div>}
              {loadingStudents ? (
                <div className="text-center py-12 text-gray-500">Loading students...</div>
              ) : students.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><p className="text-lg">No students added yet.</p><p className="text-sm">Click Add Student to enroll a new student.</p></div>
              ) : (
                <>
                  <div className="md:hidden space-y-3">
                    {students.map(student => (
                      <div key={student.id} className="bg-white rounded-xl shadow p-4 space-y-2 border border-gray-100">
                        <div className="flex items-center gap-3">
                          {student.student_image ? <img src={student.student_image} alt="" className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">?</div>}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{student.name}</p>
                            <p className="text-xs text-gray-500">Adm No: {student.admission_number || '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                          <span className="text-gray-600">Class</span>
                          <span className="font-medium text-gray-900">{student.class_name || '-'}</span>
                        </div>
                        {student.parent_name && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Parent</span>
                            <div className="text-right">
                              <span className="text-gray-900">{student.parent_name}</span>
                              <span className="text-xs text-gray-400 block">{student.parent_phone || ''}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="hidden md:block overflow-x-auto -mx-4 sm:mx-0">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Adm No</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Parent</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Photo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {students.map(student => (
                          <tr key={student.id}>
                            <td className="px-3 py-3 text-sm text-gray-900">
                              <div className="flex items-center gap-2">
                                {student.student_image ? <img src={student.student_image} alt="" className="w-8 h-8 rounded-full object-cover sm:hidden" /> : null}
                                <div>
                                  <div>{student.name}</div>
                                  <div className="text-xs text-gray-400 sm:hidden">{student.admission_number || ''}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-sm text-gray-600 hidden sm:table-cell">{student.admission_number || '-'}</td>
                            <td className="px-3 py-3 text-sm text-gray-600">{student.class_name || '-'}</td>
                            <td className="px-3 py-3 text-sm text-gray-600 hidden md:table-cell">
                              {student.parent_name || '-'}<div className="text-xs text-gray-400">{student.parent_phone || ''}</div>
                            </td>
                            <td className="px-3 py-3 hidden lg:table-cell">
                              {student.student_image ? <img src={student.student_image} alt="" className="w-10 h-10 object-cover rounded" /> : <span className="text-xs text-gray-400">-</span>}
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

          {activeTab === 'courses' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Courses ({schoolData.courses.length})</h2>
                <button onClick={() => { setShowAddCourse(true); setFormError(''); }} className={btnPrimary}><Plus size={18} />Add Course</button>
              </div>
              {schoolData.courses.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><p className="text-lg">No courses created yet.</p><p className="text-sm">Add courses then assign students to them.</p></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {schoolData.courses.map(course => (
                    <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{course.name}</h3>
                          {course.code && <p className="text-xs text-gray-500">Code: {course.code}</p>}
                          {course.teacher && <p className="text-sm text-gray-600 mt-1">Teacher: {course.teacher}</p>}
                          {course.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{course.description}</p>}
                        </div>
                        <button onClick={() => handleDeleteCourse(course.id)} className={btnDanger}><Trash2 size={14} /></button>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-gray-500"><Users size={12} className="inline mr-1" />{(course.studentIds || []).length} students</span>
                        <button onClick={() => setShowAssignStudents(course.id)} className="text-xs text-green-600 hover:text-green-700 font-medium">Manage Students</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'assignments' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Assignments</h2>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <select value={selectedCourseFilter} onChange={e => setSelectedCourseFilter(e.target.value)} className={`${inputCls} sm:w-48`}>
                    <option value="">All Courses</option>
                    {schoolData.courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button onClick={() => { setShowAddAssignment(true); setFormError(''); }} className={btnPrimary}><Plus size={18} />Add</button>
                </div>
              </div>
              {filteredAssignments.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><p className="text-lg">No assignments yet.</p><p className="text-sm">Upload assignments per course for students.</p></div>
              ) : (
                <div className="space-y-3">
                  {filteredAssignments.map(a => (
                    <div key={a.id} className="border rounded-lg p-4 flex flex-col sm:flex-row justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-green-600 shrink-0" />
                          <h3 className="font-semibold text-gray-900 truncate">{a.title}</h3>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Course: {getCourseName(a.courseId)}</p>
                        {a.description && <p className="text-sm text-gray-600 mt-1">{a.description}</p>}
                        {a.fileName && <p className="text-xs text-blue-600 mt-1"><Upload size={12} className="inline mr-1" />{a.fileName}</p>}
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                          {a.dueDate && <span>Due: {new Date(a.dueDate).toLocaleDateString()}</span>}
                          <span>Added: {new Date(a.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteAssignment(a.id)} className={`${btnDanger} self-start`}><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'results' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Results & Grades</h2>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <select value={selectedCourseFilter} onChange={e => setSelectedCourseFilter(e.target.value)} className={`${inputCls} w-full sm:w-40`}>
                    <option value="">All Courses</option>
                    {schoolData.courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select value={selectedStudentFilter} onChange={e => setSelectedStudentFilter(e.target.value)} className={`${inputCls} w-full sm:w-40`}>
                    <option value="">All Students</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <button onClick={() => { setShowAddResult(true); setFormError(''); }} className={btnPrimary}><Plus size={18} />Add</button>
                </div>
              </div>
              {filteredResults.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><p className="text-lg">No results recorded yet.</p><p className="text-sm">Record exam results per student per course.</p></div>
              ) : (
                <>
                  <div className="md:hidden space-y-3">
                    {filteredResults.map(r => {
                      const gradeColor = r.grade === 'A' ? 'bg-green-100 text-green-700' : r.grade === 'B' ? 'bg-blue-100 text-blue-700' : r.grade === 'C' ? 'bg-yellow-100 text-yellow-700' : r.grade === 'D' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700';
                      return (
                        <div key={r.id} className="bg-white rounded-xl shadow p-4 space-y-2 border border-gray-100">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{getStudentName(r.studentId)}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${gradeColor}`}>{r.grade || '-'}</span>
                          </div>
                          <div className="text-sm text-gray-600">Course: {getCourseName(r.courseId)}</div>
                          <div className="text-sm text-gray-600">Exam: {r.examName}</div>
                          <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                            <span className="text-gray-600">Score</span>
                            <span className="font-semibold text-gray-900">{r.score}</span>
                          </div>
                          {r.remarks && <div className="text-sm text-gray-500 pt-1">Remarks: {r.remarks}</div>}
                          <div className="pt-2">
                            <button onClick={() => handleDeleteResult(r.id)} className={btnDanger}><Trash2 size={14} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="hidden md:block overflow-x-auto -mx-4 sm:mx-0">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Grade</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Remarks</th>
                          <th className="px-3 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredResults.map(r => (
                          <tr key={r.id}>
                            <td className="px-3 py-3 text-sm text-gray-900">{getStudentName(r.studentId)}</td>
                            <td className="px-3 py-3 text-sm text-gray-600">{getCourseName(r.courseId)}</td>
                            <td className="px-3 py-3 text-sm text-gray-600">{r.examName}</td>
                            <td className="px-3 py-3 text-sm font-semibold text-gray-900">{r.score}</td>
                            <td className="px-3 py-3 text-sm text-gray-600 hidden sm:table-cell">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                r.grade === 'A' ? 'bg-green-100 text-green-700' :
                                r.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                                r.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                                r.grade === 'D' ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }`}>{r.grade || '-'}</span>
                            </td>
                            <td className="px-3 py-3 text-sm text-gray-500 hidden md:table-cell">{r.remarks || '-'}</td>
                            <td className="px-3 py-3"><button onClick={() => handleDeleteResult(r.id)} className={btnDanger}><Trash2 size={14} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'fees' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Fee Management</h2>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <select value={selectedStudentFilter} onChange={e => setSelectedStudentFilter(e.target.value)} className={`${inputCls} w-full sm:w-48`}>
                    <option value="">All Students</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <button onClick={() => { setShowAddFee(true); setFormError(''); }} className={btnPrimary}><Plus size={18} />Add Fee</button>
                </div>
              </div>

              {filteredFees.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                    <p className="text-xs text-blue-600 font-medium">Total Fees</p>
                    <p className="text-lg sm:text-xl font-bold text-blue-900">KSH {filteredFees.reduce((s, f) => s + f.amount, 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                    <p className="text-xs text-green-600 font-medium">Paid</p>
                    <p className="text-lg sm:text-xl font-bold text-green-900">KSH {filteredFees.reduce((s, f) => s + (f.paid || 0), 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 sm:p-4 col-span-2 sm:col-span-1">
                    <p className="text-xs text-red-600 font-medium">Balance</p>
                    <p className="text-lg sm:text-xl font-bold text-red-900">KSH {filteredFees.reduce((s, f) => s + (f.amount - (f.paid || 0)), 0).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {filteredFees.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><p className="text-lg">No fees configured.</p><p className="text-sm">Add fee records per student to track payments.</p></div>
              ) : (
                <div className="space-y-3">
                  {filteredFees.map(fee => {
                    const balance = fee.amount - (fee.paid || 0);
                    return (
                      <div key={fee.id} className="border rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <DollarSign size={16} className="text-green-600 shrink-0" />
                              <h3 className="font-semibold text-gray-900">{getStudentName(fee.studentId)}</h3>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
                              {fee.term && <span>Term: {fee.term}</span>}
                              {fee.description && <span>{fee.description}</span>}
                              {fee.dueDate && <span>Due: {new Date(fee.dueDate).toLocaleDateString()}</span>}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm">
                              <span>Amount: <strong>KSH {fee.amount.toLocaleString()}</strong></span>
                              <span className="text-green-600">Paid: KSH {(fee.paid || 0).toLocaleString()}</span>
                              <span className={balance > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                                Balance: KSH {balance.toLocaleString()}
                              </span>
                            </div>
                            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${Math.min(100, ((fee.paid || 0) / fee.amount) * 100)}%` }} />
                            </div>
                          </div>
                          <div className="flex gap-2 self-start">
                            <button onClick={() => { setShowRecordPayment(fee.id); setFormError(''); setPaymentForm({ amount: '', method: 'cash', reference: '' }); }}
                              className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700">Record Payment</button>
                            <button onClick={() => handleDeleteFee(fee.id)} className={btnDanger}><Trash2 size={14} /></button>
                          </div>
                        </div>
                        {fee.payments && fee.payments.length > 0 && (
                          <div className="mt-3 border-t pt-3">
                            <p className="text-xs font-medium text-gray-500 mb-2">Payment History</p>
                            <div className="space-y-1">
                              {fee.payments.map(p => (
                                <div key={p.id} className="flex justify-between text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded">
                                  <span>KSH {p.amount.toLocaleString()} ({p.method})</span>
                                  <span>{new Date(p.date).toLocaleDateString()}{p.reference ? ` - ${p.reference}` : ''}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'canteen' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Canteen Products</h2>
                <button onClick={() => openAddProductModal('canteen')} className={btnPrimary}><Plus size={18} />Add Product</button>
              </div>
              {productError && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{productError}</div>}
              {loadingProducts ? (
                <div className="text-center py-12 text-gray-500">Loading products...</div>
              ) : canteenProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><p className="text-lg">No canteen products added yet.</p></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {canteenProducts.map(item => (
                    <div key={item.id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex gap-3">
                        {item.image ? <img src={item.image} alt={item.name} className="w-14 h-14 rounded object-cover shrink-0" /> :
                          <div className="w-14 h-14 rounded bg-gray-200 flex items-center justify-center text-gray-400 shrink-0"><ImageIcon size={16} /></div>}
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{item.name}</p>
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
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Uniform and Books Stock</h2>
                <button onClick={() => openAddProductModal('uniform')} className={btnPrimary}><Plus size={18} />Add Item</button>
              </div>
              {productError && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{productError}</div>}
              {loadingProducts ? (
                <div className="text-center py-12 text-gray-500">Loading items...</div>
              ) : uniformAndBooksProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><p className="text-lg">No uniforms or books added yet.</p></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uniformAndBooksProducts.map(item => (
                    <div key={item.id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex gap-3">
                        {item.image ? <img src={item.image} alt={item.name} className="w-14 h-14 rounded object-cover shrink-0" /> :
                          <div className="w-14 h-14 rounded bg-gray-200 flex items-center justify-center text-gray-400 shrink-0"><ImageIcon size={16} /></div>}
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{item.name}</p>
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

      {/* MODALS */}

      {showAddStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg sm:text-xl font-bold">Add Student</h3><button onClick={() => setShowAddStudent(false)} className="p-1"><X size={20} /></button></div>
            {studentError && <div className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg p-2">{studentError}</div>}
            <form onSubmit={handleAddStudent} className="space-y-3">
              <input type="text" placeholder="Student Name" className={inputCls} value={studentForm.name} onChange={e => setStudentForm({ ...studentForm, name: e.target.value })} required />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" placeholder="Admission Number" className={inputCls} value={studentForm.admissionNumber} onChange={e => setStudentForm({ ...studentForm, admissionNumber: e.target.value })} />
                <input type="text" placeholder="Class" className={inputCls} value={studentForm.className} onChange={e => setStudentForm({ ...studentForm, className: e.target.value })} />
              </div>
              <input type="text" placeholder="Parent Name" className={inputCls} value={studentForm.parentName} onChange={e => setStudentForm({ ...studentForm, parentName: e.target.value })} />
              <input type="text" placeholder="Parent Phone" className={inputCls} value={studentForm.parentPhone} onChange={e => setStudentForm({ ...studentForm, parentPhone: e.target.value })} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Student Photo</label>
                  <input type="file" accept="image/*" className={`${inputCls} mt-1`} onChange={e => onStudentImageSelect(e, 'studentImage')} />
                  {studentForm.studentImage && <img src={studentForm.studentImage} alt="" className="w-16 h-16 mt-2 object-cover rounded" />}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">ID Photo</label>
                  <input type="file" accept="image/*" className={`${inputCls} mt-1`} onChange={e => onStudentImageSelect(e, 'idImage')} />
                  {studentForm.idImage && <img src={studentForm.idImage} alt="" className="w-16 h-16 mt-2 object-cover rounded" />}
                </div>
              </div>
              <div className="flex gap-2 pt-2"><button type="submit" className={`${btnPrimary} flex-1 justify-center`}>Save Student</button><button type="button" onClick={() => setShowAddStudent(false)} className={btnSecondary}>Cancel</button></div>
            </form>
          </div>
        </div>
      )}

      {showAddProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg sm:text-xl font-bold">{productGroup === 'canteen' ? 'Add Canteen Product' : 'Add Uniform/Book Item'}</h3><button onClick={() => setShowAddProduct(false)} className="p-1"><X size={20} /></button></div>
            {productError && <div className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg p-2">{productError}</div>}
            <form onSubmit={handleAddProduct} className="space-y-3">
              <input type="text" placeholder="Item Name" className={inputCls} value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} required />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="number" step="0.01" min="0" placeholder="Selling Price" className={inputCls} value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} required />
                <input type="number" step="0.01" min="0" placeholder="COGS Cost" className={inputCls} value={productForm.cost} onChange={e => setProductForm({ ...productForm, cost: e.target.value })} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input type="number" min="0" placeholder="Quantity" className={inputCls} value={productForm.quantity} onChange={e => setProductForm({ ...productForm, quantity: e.target.value })} required />
                <input type="text" placeholder="Unit" className={inputCls} value={productForm.unit} onChange={e => setProductForm({ ...productForm, unit: e.target.value })} />
                <input type="text" placeholder="Category" className={inputCls} value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Item Image</label>
                <input type="file" accept="image/*" className={`${inputCls} mt-1`} onChange={onProductImageSelect} />
                {productForm.image && <img src={productForm.image} alt="" className="w-16 h-16 mt-2 object-cover rounded" />}
              </div>
              <div className="flex gap-2 pt-2"><button type="submit" className={`${btnPrimary} flex-1 justify-center`}>Save Item</button><button type="button" onClick={() => setShowAddProduct(false)} className={btnSecondary}>Cancel</button></div>
            </form>
          </div>
        </div>
      )}

      {showAddCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold">Add Course</h3><button onClick={() => setShowAddCourse(false)} className="p-1"><X size={20} /></button></div>
            {formError && <div className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg p-2">{formError}</div>}
            <form onSubmit={handleAddCourse} className="space-y-3">
              <input type="text" placeholder="Course Name *" className={inputCls} value={courseForm.name} onChange={e => setCourseForm({ ...courseForm, name: e.target.value })} required />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" placeholder="Course Code" className={inputCls} value={courseForm.code} onChange={e => setCourseForm({ ...courseForm, code: e.target.value })} />
                <input type="text" placeholder="Teacher Name" className={inputCls} value={courseForm.teacher} onChange={e => setCourseForm({ ...courseForm, teacher: e.target.value })} />
              </div>
              <textarea placeholder="Description (optional)" className={`${inputCls} min-h-[80px]`} value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} />
              <div className="flex gap-2 pt-2"><button type="submit" className={`${btnPrimary} flex-1 justify-center`}>Save Course</button><button type="button" onClick={() => setShowAddCourse(false)} className={btnSecondary}>Cancel</button></div>
            </form>
          </div>
        </div>
      )}

      {showAssignStudents && (() => {
        const course = schoolData.courses.find(c => c.id === showAssignStudents);
        if (!course) return null;
        const assigned = new Set(course.studentIds || []);
        const toggleStudent = (sid) => {
          const next = new Set(assigned);
          if (next.has(String(sid))) next.delete(String(sid));
          else next.add(String(sid));
          handleAssignStudents(course.id, Array.from(next));
        };
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
            <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold">Manage Students - {course.name}</h3><button onClick={() => setShowAssignStudents(null)} className="p-1"><X size={20} /></button></div>
              {students.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No students available. Add students first.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {students.map(s => (
                    <label key={s.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={assigned.has(String(s.id))} onChange={() => toggleStudent(s.id)} className="w-4 h-4 text-green-600 rounded" />
                      <span className="text-sm text-gray-900">{s.name}</span>
                      <span className="text-xs text-gray-400">{s.class_name || s.className || ''}</span>
                    </label>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-3 border-t flex justify-between items-center">
                <span className="text-sm text-gray-500">{assigned.size} student{assigned.size !== 1 ? 's' : ''} assigned</span>
                <button onClick={() => setShowAssignStudents(null)} className={btnSecondary}>Done</button>
              </div>
            </div>
          </div>
        );
      })()}

      {showAddAssignment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold">Add Assignment</h3><button onClick={() => setShowAddAssignment(false)} className="p-1"><X size={20} /></button></div>
            {formError && <div className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg p-2">{formError}</div>}
            <form onSubmit={handleAddAssignment} className="space-y-3">
              <select className={inputCls} value={assignmentForm.courseId} onChange={e => setAssignmentForm({ ...assignmentForm, courseId: e.target.value })} required>
                <option value="">Select Course *</option>
                {schoolData.courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="text" placeholder="Assignment Title *" className={inputCls} value={assignmentForm.title} onChange={e => setAssignmentForm({ ...assignmentForm, title: e.target.value })} required />
              <textarea placeholder="Description / Instructions" className={`${inputCls} min-h-[80px]`} value={assignmentForm.description} onChange={e => setAssignmentForm({ ...assignmentForm, description: e.target.value })} />
              <input type="date" className={inputCls} value={assignmentForm.dueDate} onChange={e => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })} />
              <div>
                <label className="text-sm font-medium text-gray-700">Attach File (optional)</label>
                <input type="file" className={`${inputCls} mt-1`} onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) setAssignmentForm(prev => ({ ...prev, fileName: file.name }));
                }} />
              </div>
              <div className="flex gap-2 pt-2"><button type="submit" className={`${btnPrimary} flex-1 justify-center`}>Save Assignment</button><button type="button" onClick={() => setShowAddAssignment(false)} className={btnSecondary}>Cancel</button></div>
            </form>
          </div>
        </div>
      )}

      {showAddResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold">Record Result</h3><button onClick={() => setShowAddResult(false)} className="p-1"><X size={20} /></button></div>
            {formError && <div className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg p-2">{formError}</div>}
            <form onSubmit={handleAddResult} className="space-y-3">
              <select className={inputCls} value={resultForm.courseId} onChange={e => setResultForm({ ...resultForm, courseId: e.target.value })} required>
                <option value="">Select Course *</option>
                {schoolData.courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className={inputCls} value={resultForm.studentId} onChange={e => setResultForm({ ...resultForm, studentId: e.target.value })} required>
                <option value="">Select Student *</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input type="text" placeholder="Exam Name *" className={inputCls} value={resultForm.examName} onChange={e => setResultForm({ ...resultForm, examName: e.target.value })} required />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" min="0" max="100" placeholder="Score" className={inputCls} value={resultForm.score} onChange={e => setResultForm({ ...resultForm, score: e.target.value })} />
                <select className={inputCls} value={resultForm.grade} onChange={e => setResultForm({ ...resultForm, grade: e.target.value })}>
                  <option value="">Grade</option>
                  <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option><option value="F">F</option>
                </select>
              </div>
              <textarea placeholder="Remarks (optional)" className={`${inputCls} min-h-[60px]`} value={resultForm.remarks} onChange={e => setResultForm({ ...resultForm, remarks: e.target.value })} />
              <div className="flex gap-2 pt-2"><button type="submit" className={`${btnPrimary} flex-1 justify-center`}>Save Result</button><button type="button" onClick={() => setShowAddResult(false)} className={btnSecondary}>Cancel</button></div>
            </form>
          </div>
        </div>
      )}

      {showAddFee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold">Add Fee</h3><button onClick={() => setShowAddFee(false)} className="p-1"><X size={20} /></button></div>
            {formError && <div className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg p-2">{formError}</div>}
            <form onSubmit={handleAddFee} className="space-y-3">
              <select className={inputCls} value={feeForm.studentId} onChange={e => setFeeForm({ ...feeForm, studentId: e.target.value })} required>
                <option value="">Select Student *</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" placeholder="Term (e.g. Term 1 2025)" className={inputCls} value={feeForm.term} onChange={e => setFeeForm({ ...feeForm, term: e.target.value })} />
                <input type="number" min="0" placeholder="Amount (KSH) *" className={inputCls} value={feeForm.amount} onChange={e => setFeeForm({ ...feeForm, amount: e.target.value })} required />
              </div>
              <input type="text" placeholder="Description" className={inputCls} value={feeForm.description} onChange={e => setFeeForm({ ...feeForm, description: e.target.value })} />
              <input type="date" className={inputCls} value={feeForm.dueDate} onChange={e => setFeeForm({ ...feeForm, dueDate: e.target.value })} />
              <div className="flex gap-2 pt-2"><button type="submit" className={`${btnPrimary} flex-1 justify-center`}>Save Fee</button><button type="button" onClick={() => setShowAddFee(false)} className={btnSecondary}>Cancel</button></div>
            </form>
          </div>
        </div>
      )}

      {showRecordPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold">Record Payment</h3><button onClick={() => setShowRecordPayment(null)} className="p-1"><X size={20} /></button></div>
            {formError && <div className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg p-2">{formError}</div>}
            <div className="space-y-3">
              <input type="number" min="0" placeholder="Amount (KSH) *" className={inputCls} value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
              <select className={inputCls} value={paymentForm.method} onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}>
                <option value="cash">Cash</option><option value="bank">Bank Transfer</option><option value="card">Card</option>
              </select>
              <input type="text" placeholder="Reference / Receipt No" className={inputCls} value={paymentForm.reference} onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })} />
              <div className="flex gap-2 pt-2">
                <button onClick={() => handleRecordPayment(showRecordPayment)} className={`${btnPrimary} flex-1 justify-center`}>Save Payment</button>
                <button onClick={() => setShowRecordPayment(null)} className={btnSecondary}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
