import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, Plus, Wine, DollarSign, Package, MessageSquare, Trash2, X, Beer, GlassWater, BarChart3 } from 'lucide-react';
import api, { BASE_API_URL } from '../../services/api';
import ProAIAssistant from '../../components/ProAIAssistant';

const BAR_STORAGE_KEY = 'bar_admin_data';

function loadBarData() {
  try {
    const raw = localStorage.getItem(BAR_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { menuItems: [], tables: [] };
}

function saveBarData(data) {
  localStorage.setItem(BAR_STORAGE_KEY, JSON.stringify(data));
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

const DRINK_CATEGORIES = ['Beer', 'Wine', 'Spirits', 'Cocktails', 'Soft Drinks', 'Water', 'Juices', 'Snacks', 'Food', 'Other'];

export default function AdminBarDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [staff, setStaff] = useState([]);
  const [messages, setMessages] = useState([]);
  const [products, setProducts] = useState([]);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // Bar-specific local data
  const [barData, setBarData] = useState(loadBarData);
  const [showAddMenuItem, setShowAddMenuItem] = useState(false);
  const [showAddTable, setShowAddTable] = useState(false);
  const [menuForm, setMenuForm] = useState({ name: '', category: 'Beer', price: '', cost: '', quantity: '', unit: 'bottle', description: '' });
  const [tableForm, setTableForm] = useState({ name: '', seats: '4', status: 'available' });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formError, setFormError] = useState('');

  const barRoles = [
    { value: 'bartender', label: 'Bartender', icon: Wine },
    { value: 'cashier', label: 'Cashier', icon: DollarSign },
    { value: 'store', label: 'Store Manager', icon: Package }
  ];

  const updateBarData = useCallback((updater) => {
    setBarData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveBarData(next);
      return next;
    });
  }, []);

  useEffect(() => {
    loadStaff();
    loadMessages();
    loadProducts();
  }, []);

  const loadStaff = async () => {
    try {
      const response = await api.get('/business/users');
      setStaff(response.users || []);
    } catch (error) {
      console.error('Failed to load staff:', error);
    } finally { setLoading(false); }
  };

  const loadMessages = async () => {
    try {
      const response = await api.get('/messages/inbox?limit=5');
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await api.get('/products');
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleAddStaff = async (formData) => {
    try {
      await api.post('/business/users', {
        name: formData.name, email: formData.email,
        password: formData.password, business_role: formData.businessRole
      });
      setShowAddStaff(false);
      loadStaff();
    } catch (error) {
      alert('Failed to add staff member: ' + (error.response?.data?.error || error.message));
    }
  };

  // Menu management
  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    if (!menuForm.name.trim()) { setFormError('Item name is required'); return; }
    try {
      // Try adding to API products
      const created = await api.post('/products', {
        name: menuForm.name, price: Number(menuForm.price || 0),
        cost: Number(menuForm.cost || 0), cost_per_unit: Number(menuForm.cost || 0),
        quantity: Number(menuForm.quantity || 0), unit: menuForm.unit || 'bottle',
        category: menuForm.category, visible_to_cashier: true, visibleToCashier: true
      });
      setProducts(prev => [created, ...prev]);
    } catch {
      // Fallback: store locally
      const item = { id: genId(), ...menuForm, price: Number(menuForm.price || 0), cost: Number(menuForm.cost || 0), quantity: Number(menuForm.quantity || 0), createdAt: new Date().toISOString() };
      updateBarData(prev => ({ ...prev, menuItems: [item, ...prev.menuItems] }));
    }
    setShowAddMenuItem(false);
    setMenuForm({ name: '', category: 'Beer', price: '', cost: '', quantity: '', unit: 'bottle', description: '' });
    setFormError('');
  };

  const handleDeleteLocalMenuItem = (id) => {
    updateBarData(prev => ({ ...prev, menuItems: prev.menuItems.filter(m => m.id !== id) }));
  };

  // Table management
  const handleAddTable = (e) => {
    e.preventDefault();
    if (!tableForm.name.trim()) { setFormError('Table name is required'); return; }
    const table = { id: genId(), ...tableForm, seats: Number(tableForm.seats || 4), createdAt: new Date().toISOString() };
    updateBarData(prev => ({ ...prev, tables: [table, ...prev.tables] }));
    setShowAddTable(false);
    setTableForm({ name: '', seats: '4', status: 'available' });
    setFormError('');
  };

  const toggleTableStatus = (id) => {
    updateBarData(prev => ({
      ...prev,
      tables: prev.tables.map(t => t.id === id ? { ...t, status: t.status === 'available' ? 'occupied' : t.status === 'occupied' ? 'reserved' : 'available' } : t)
    }));
  };

  const handleDeleteTable = (id) => {
    updateBarData(prev => ({ ...prev, tables: prev.tables.filter(t => t.id !== id) }));
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredStaff = staff.filter(m => !normalizedSearch || (m.name || '').toLowerCase().includes(normalizedSearch) || (m.email || '').toLowerCase().includes(normalizedSearch) || (m.business_role || m.role || '').toLowerCase().includes(normalizedSearch));
  const filteredMessages = messages.filter(msg => !normalizedSearch || (msg.fromUserName || '').toLowerCase().includes(normalizedSearch) || (msg.content || '').toLowerCase().includes(normalizedSearch));

  // Combine API products + local menu items for display
  const allMenuItems = useMemo(() => {
    const apiItems = products.map(p => ({ ...p, source: 'api' }));
    const localItems = (barData.menuItems || []).map(m => ({ ...m, source: 'local' }));
    const combined = [...apiItems, ...localItems];
    if (selectedCategory) return combined.filter(i => (i.category || '').toLowerCase() === selectedCategory.toLowerCase());
    return combined;
  }, [products, barData.menuItems, selectedCategory]);

  const askAiFromSearch = async () => {
    if (!searchTerm.trim()) return;
    try {
      setAiLoading(true); setAiError(''); setAiAnswer('');
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_API_URL}/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
        body: JSON.stringify({ question: searchTerm.trim(), context: { businessType: user?.business_type || 'bar', staffCount: staff.length } })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || payload?.error || 'AI request failed');
      const answer = payload?.data?.answer || payload?.answer;
      if (!answer) throw new Error('No AI response received');
      setAiAnswer(answer);
    } catch (err) { setAiError(err.message || 'AI request failed'); }
    finally { setAiLoading(false); }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'menu', label: 'Menu & Drinks', icon: Beer },
    { id: 'tables', label: 'Tables', icon: GlassWater },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageSquare }
  ];

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm";
  const btnPrimary = "flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm";
  const btnSecondary = "px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm";
  const btnDanger = "p-1.5 text-red-500 hover:bg-red-50 rounded";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl sm:text-4xl">🍻</span> Bar Admin Dashboard
              </h1>
              <p className="text-purple-100 mt-1 text-sm">Manage your bar staff, menu & operations</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAddStaff(true)} className="flex items-center gap-1 px-3 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 text-sm font-medium"><Plus size={16} />Staff</button>
              <button onClick={() => { setShowAddMenuItem(true); setFormError(''); }} className="flex items-center gap-1 px-3 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 text-sm font-semibold"><Plus size={16} />Drink</button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {/* Tabs */}
        <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 mb-6">
          <div className="flex gap-1 border-b min-w-max">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 font-medium transition-colors whitespace-nowrap text-xs sm:text-sm ${
                    activeTab === tab.id ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-900'
                  }`}>
                  <Icon size={16} />{tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
              {barRoles.map((role, idx) => {
                const Icon = role.icon;
                const count = staff.filter(s => s.business_role === role.value).length;
                const colors = ['bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
                return (
                  <div key={role.value} className={`${colors[idx]} rounded-xl p-4 text-white`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs opacity-80">{role.label}</p>
                        <p className="text-2xl font-bold mt-1">{count}</p>
                      </div>
                      <Icon className="w-8 h-8 opacity-60" />
                    </div>
                  </div>
                );
              })}
              <div className="bg-green-500 rounded-xl p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs opacity-80">Menu Items</p>
                    <p className="text-2xl font-bold mt-1">{products.length + (barData.menuItems || []).length}</p>
                  </div>
                  <Beer className="w-8 h-8 opacity-60" />
                </div>
              </div>
            </div>

            {/* Table status overview */}
            {barData.tables.length > 0 && (
              <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Table Status</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {barData.tables.map(t => (
                    <button key={t.id} onClick={() => toggleTableStatus(t.id)}
                      className={`p-3 rounded-lg text-center text-xs font-medium transition-colors ${
                        t.status === 'available' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                        t.status === 'occupied' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                        'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      }`}>
                      <div className="font-bold text-sm">{t.name}</div>
                      <div className="mt-0.5">{t.status}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search + AI */}
            <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search or ask AI..."
                  className={`${inputCls} flex-1`} />
                <button onClick={askAiFromSearch} disabled={aiLoading || !searchTerm.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm whitespace-nowrap">
                  {aiLoading ? 'Asking...' : 'Ask AI'}
                </button>
              </div>
              {(aiAnswer || aiError) && (
                <div className={`mt-3 rounded-lg border px-4 py-3 text-sm ${aiError ? 'border-red-200 bg-red-50 text-red-700' : 'border-purple-200 bg-purple-50 text-purple-900'}`}>
                  {aiError || aiAnswer}
                </div>
              )}
            </div>

            {/* Recent Messages */}
            {filteredMessages.length > 0 && (
              <div className="bg-white rounded-xl shadow p-4 sm:p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><MessageSquare size={18} className="text-purple-600" />Recent Messages</h3>
                <div className="space-y-2">
                  {filteredMessages.slice(0, 3).map(msg => (
                    <div key={msg.id} className="flex items-start p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-gray-900 text-sm truncate">{msg.fromUserName}</span>
                          <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(msg.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 truncate">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MENU & DRINKS TAB */}
        {activeTab === 'menu' && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Menu & Drinks ({allMenuItems.length})</h2>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className={`${inputCls} sm:w-40`}>
                  <option value="">All Categories</option>
                  {DRINK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button onClick={() => { setShowAddMenuItem(true); setFormError(''); }} className={btnPrimary}><Plus size={18} />Add Item</button>
              </div>
            </div>

            {allMenuItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow">
                <Beer className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No menu items yet.</p>
                <p className="text-sm">Add your drinks, cocktails, and snacks to the menu.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allMenuItems.map(item => (
                  <div key={item.id} className="bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">{item.category || 'Uncategorized'}</span>
                      </div>
                      {item.source === 'local' && (
                        <button onClick={() => handleDeleteLocalMenuItem(item.id)} className={btnDanger}><Trash2 size={14} /></button>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <span className="text-gray-900 font-medium">KSH {Number(item.price || 0).toLocaleString()}</span>
                      {(item.cost || item.cost_per_unit) && <span className="text-gray-500">Cost: KSH {Number(item.cost || item.cost_per_unit || 0).toLocaleString()}</span>}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span>Stock: {Number(item.quantity || 0)} {item.unit || 'pcs'}</span>
                      {Number(item.quantity || 0) <= 5 && Number(item.quantity || 0) > 0 && <span className="text-orange-600 font-medium">Low Stock</span>}
                      {Number(item.quantity || 0) === 0 && <span className="text-red-600 font-medium">Out of Stock</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TABLES TAB */}
        {activeTab === 'tables' && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Table Management ({barData.tables.length})</h2>
              <button onClick={() => { setShowAddTable(true); setFormError(''); }} className={btnPrimary}><Plus size={18} />Add Table</button>
            </div>

            {/* Status legend */}
            <div className="flex flex-wrap gap-3 mb-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> Available</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> Occupied</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> Reserved</span>
            </div>

            {barData.tables.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow">
                <GlassWater className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No tables configured.</p>
                <p className="text-sm">Add tables to manage seating and orders.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {barData.tables.map(table => (
                  <div key={table.id} className={`rounded-xl p-4 text-center relative group cursor-pointer transition-all hover:shadow-md ${
                    table.status === 'available' ? 'bg-green-50 border-2 border-green-200' :
                    table.status === 'occupied' ? 'bg-red-50 border-2 border-red-200' :
                    'bg-yellow-50 border-2 border-yellow-200'
                  }`}>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTable(table.id); }}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
                    <div className="font-bold text-gray-900">{table.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{table.seats} seats</div>
                    <button onClick={() => toggleTableStatus(table.id)}
                      className={`mt-2 px-2 py-1 rounded text-xs font-medium ${
                        table.status === 'available' ? 'bg-green-200 text-green-800' :
                        table.status === 'occupied' ? 'bg-red-200 text-red-800' :
                        'bg-yellow-200 text-yellow-800'
                      }`}>{table.status}</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STAFF TAB */}
        {activeTab === 'staff' && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Bar Staff ({staff.length})</h2>
              <button onClick={() => setShowAddStaff(true)} className={btnPrimary}><Plus size={18} />Add Staff</button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading staff...</div>
            ) : filteredStaff.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No staff members yet.</p>
                <button onClick={() => setShowAddStaff(true)} className="text-purple-600 hover:text-purple-700 font-medium">Add your first staff member</button>
              </div>
            ) : (
              <>
                <div className="md:hidden space-y-3">
                  {filteredStaff.map(member => (
                    <div key={member.id} className="bg-white rounded-xl shadow p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{member.name}</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">{member.email}</div>
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                        <span className="text-gray-600">Role</span>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">{member.business_role || member.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl shadow overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredStaff.map(member => (
                          <tr key={member.id}>
                            <td className="px-4 py-3 text-sm">
                              <div className="font-medium text-gray-900">{member.name}</div>
                              <div className="text-xs text-gray-400 sm:hidden">{member.email}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{member.email}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">{member.business_role || member.role}</span>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {member.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Messages</h2>
            {messages.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No messages yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map(msg => (
                  <div key={msg.id} className="bg-white rounded-xl shadow p-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div>
                        <span className="font-medium text-gray-900">{msg.fromUserName}</span>
                        <span className="text-xs text-purple-600 ml-2">{msg.fromRole}</span>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-600">{msg.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Assistant */}
        <div className="mt-8">
          <ProAIAssistant adminMode role={user?.role} businessType={user?.business_type || 'bar'} />
        </div>
      </div>

      {/* MODALS */}

      {/* Add Menu Item Modal */}
      {showAddMenuItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold">Add Menu Item</h3><button onClick={() => setShowAddMenuItem(false)} className="p-1"><X size={20} /></button></div>
            {formError && <div className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg p-2">{formError}</div>}
            <form onSubmit={handleAddMenuItem} className="space-y-3">
              <input type="text" placeholder="Item Name *" className={inputCls} value={menuForm.name} onChange={e => setMenuForm({ ...menuForm, name: e.target.value })} required />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select className={inputCls} value={menuForm.category} onChange={e => setMenuForm({ ...menuForm, category: e.target.value })}>
                  {DRINK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="text" placeholder="Unit (bottle, glass...)" className={inputCls} value={menuForm.unit} onChange={e => setMenuForm({ ...menuForm, unit: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input type="number" step="0.01" min="0" placeholder="Sell Price" className={inputCls} value={menuForm.price} onChange={e => setMenuForm({ ...menuForm, price: e.target.value })} required />
                <input type="number" step="0.01" min="0" placeholder="Cost Price" className={inputCls} value={menuForm.cost} onChange={e => setMenuForm({ ...menuForm, cost: e.target.value })} />
                <input type="number" min="0" placeholder="Quantity" className={inputCls} value={menuForm.quantity} onChange={e => setMenuForm({ ...menuForm, quantity: e.target.value })} />
              </div>
              <textarea placeholder="Description (optional)" className={`${inputCls} min-h-[60px]`} value={menuForm.description} onChange={e => setMenuForm({ ...menuForm, description: e.target.value })} />
              <div className="flex gap-2 pt-2"><button type="submit" className={`${btnPrimary} flex-1 justify-center`}>Save Item</button><button type="button" onClick={() => setShowAddMenuItem(false)} className={btnSecondary}>Cancel</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold">Add Table</h3><button onClick={() => setShowAddTable(false)} className="p-1"><X size={20} /></button></div>
            {formError && <div className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg p-2">{formError}</div>}
            <form onSubmit={handleAddTable} className="space-y-3">
              <input type="text" placeholder="Table Name (e.g. Table 1, VIP 1) *" className={inputCls} value={tableForm.name} onChange={e => setTableForm({ ...tableForm, name: e.target.value })} required />
              <input type="number" min="1" placeholder="Number of Seats" className={inputCls} value={tableForm.seats} onChange={e => setTableForm({ ...tableForm, seats: e.target.value })} />
              <select className={inputCls} value={tableForm.status} onChange={e => setTableForm({ ...tableForm, status: e.target.value })}>
                <option value="available">Available</option><option value="occupied">Occupied</option><option value="reserved">Reserved</option>
              </select>
              <div className="flex gap-2 pt-2"><button type="submit" className={`${btnPrimary} flex-1 justify-center`}>Save Table</button><button type="button" onClick={() => setShowAddTable(false)} className={btnSecondary}>Cancel</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaff && (
        <AddStaffModal roles={barRoles} onClose={() => setShowAddStaff(false)} onSubmit={handleAddStaff} />
      )}
    </div>
  );
}

function AddStaffModal({ roles, onClose, onSubmit }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', businessRole: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.businessRole) {
      alert('Please fill all fields'); return;
    }
    onSubmit(formData);
  };

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold">Add Staff Member</h3><button onClick={onClose} className="p-1"><X size={20} /></button></div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" placeholder="Full Name *" className={inputCls} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          <input type="email" placeholder="Email *" className={inputCls} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
          <input type="password" placeholder="Password *" className={inputCls} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required minLength={6} />
          <select className={inputCls} value={formData.businessRole} onChange={e => setFormData({ ...formData, businessRole: e.target.value })} required>
            <option value="">Select role...</option>
            {roles.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
          </select>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-semibold">Add Staff</button>
          </div>
        </form>
      </div>
    </div>
  );
}
