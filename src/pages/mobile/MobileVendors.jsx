import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, ArrowLeft, Search, Phone, Mail, MapPin, Download } from 'lucide-react';
import { BASE_API_URL } from '../../services/api';

export default function MobileVendors() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    products: ''
  });

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_API_URL}/vendors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setVendors(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to load vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingVendor
        ? `${BASE_API_URL}/vendors/${editingVendor.id}`
        : `${BASE_API_URL}/vendors`;
      const method = editingVendor ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        await loadVendors();
        setShowModal(false);
        setEditingVendor(null);
        setFormData({ name: '', email: '', phone: '', address: '', city: '', country: '', products: '' });
      }
    } catch (error) {
      console.error('Failed to save vendor:', error);
    }
  };

  const handleDelete = async (vendorId) => {
    if (!confirm('Delete this vendor?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${BASE_API_URL}/vendors/${vendorId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setVendors(vendors.filter(v => v.id !== vendorId));
    } catch (error) {
      console.error('Failed to delete vendor:', error);
    }
  };

  const filtered = vendors.filter(v =>
    v.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/mobile')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Vendors</h1>
          <p className="text-xs text-gray-500">{vendors.length} vendors</p>
        </div>
        <button
          onClick={() => { setEditingVendor(null); setFormData({ name: '', email: '', phone: '', address: '', city: '', country: '', products: '' }); setShowModal(true); }}
          className="p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search vendors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading vendors...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No vendors found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(vendor => (
            <div key={vendor.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-gray-900">{vendor.name}</p>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingVendor(vendor); setFormData(vendor); setShowModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(vendor.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                {vendor.phone && <div className="flex items-center gap-2"><Phone className="w-3 h-3" />{vendor.phone}</div>}
                {vendor.email && <div className="flex items-center gap-2"><Mail className="w-3 h-3" />{vendor.email}</div>}
                {vendor.address && <div className="flex items-center gap-2"><MapPin className="w-3 h-3" />{vendor.address}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{editingVendor ? 'Edit Vendor' : 'Add Vendor'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              {['name', 'email', 'phone', 'address', 'city', 'country', 'products'].map(field => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field}</label>
                  <input
                    type="text"
                    value={formData[field]}
                    onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              ))}
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-medium">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
