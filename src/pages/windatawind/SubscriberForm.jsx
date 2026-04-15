import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const BUSINESS_TYPES = [
  'Fish Shop', 'Supermarket', 'Clothing Store', 'Hospital', 'Clinic',
  'Hotel', 'Bar', 'School', 'Kiosk', 'Petrol Station', 'Shoe Store',
  'Bookshop', 'Restaurant', 'Pharmacy', 'Salon', 'Other'
];

export default function SubscriberForm({ subscriber, onSave, onClose }) {
  const isEdit = !!subscriber;
  const [form, setForm] = useState({
    name: '', email: '', phone: '', package: 'Basic',
    businessType: '', duration: 30, startDate: new Date().toISOString().slice(0, 10),
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (subscriber) {
      setForm({
        name: subscriber.name || '',
        email: subscriber.email || '',
        phone: subscriber.phone || '',
        package: subscriber.package || 'Basic',
        businessType: subscriber.businessType || '',
        duration: subscriber.duration || 30,
        startDate: subscriber.startDate || new Date().toISOString().slice(0, 10),
      });
    }
  }, [subscriber]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === 'duration' ? Number(value) || 0 : value }));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.email.trim()) { setError('Email is required'); return; }
    if (!form.phone.trim()) { setError('Phone is required'); return; }
    if (form.duration < 1) { setError('Duration must be at least 1 day'); return; }
    if (form.package === 'Pro' && !form.businessType) { setError('Business type is required for Pro package'); return; }

    onSave({
      ...(subscriber ? { id: subscriber.id } : { id: Date.now() }),
      ...form,
      businessType: form.package === 'Pro' ? form.businessType : '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800">
            {isEdit ? 'Edit Subscriber' : 'Add Subscriber'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Full Name</label>
              <input name="name" value={form.name} onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Package</label>
              <select name="package" value={form.package} onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all">
                <option value="Basic">Basic</option>
                <option value="Ultra">Ultra</option>
                <option value="Pro">Pro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Duration (days)</label>
              <input name="duration" type="number" min="1" value={form.duration} onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
            </div>

            {form.package === 'Pro' && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Business Type</label>
                <select name="businessType" value={form.businessType} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all">
                  <option value="">Select business type...</option>
                  {BUSINESS_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Start Date</label>
              <input name="startDate" type="date" value={form.startDate} onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25">
              {isEdit ? 'Save Changes' : 'Add Subscriber'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
