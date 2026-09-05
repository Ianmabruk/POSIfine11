import { useState, useEffect } from 'react';
import { marketplace } from '../../services/api';

export default function WholesalerProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  const load = async () => {
    try {
      const { profile: p } = await marketplace.getProfile();
      setProfile(p);
      setForm(p || {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const { profile: p } = await marketplace.upsertProfile(form);
      setProfile(p); setForm(p || {});
      alert('Profile saved');
    } catch (e) { alert('Save failed: ' + (e.message || '')); }
    finally { setSaving(false); }
  };

  const requestVerify = async () => {
    try { await marketplace.requestVerification(); alert('Verification requested'); } catch (e) { alert(e.message || ''); }
  };

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Wholesaler Marketplace Profile</h1>
      <p className="text-sm text-gray-600">This public profile is visible to other businesses browsing the marketplace.</p>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Business name" value={form.businessName} onChange={(v) => setField('businessName', v)} />
        <Field label="Email" value={form.email} onChange={(v) => setField('email', v)} />
        <Field label="Phone" value={form.phone} onChange={(v) => setField('phone', v)} />
        <Field label="Address" value={form.address} onChange={(v) => setField('address', v)} />
        <Field label="City" value={form.city} onChange={(v) => setField('city', v)} />
        <Field label="Country" value={form.country} onChange={(v) => setField('country', v)} />
        <Field label="Latitude" type="number" value={form.lat} onChange={(v) => setField('lat', Number(v))} />
        <Field label="Longitude" type="number" value={form.lng} onChange={(v) => setField('lng', Number(v))} />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Categories</label>
        <input type="text" value={(form.categories || []).join(', ')}
          onChange={(e) => setField('categories', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="e.g. Fruits, Vegetables" />
      </div>

      <div className="flex items-center gap-6">
        <Toggle label="Delivery available" checked={form.deliveryAvailable} onChange={(v) => setField('deliveryAvailable', v)} />
        <Toggle label="Active on marketplace" checked={form.isActive} onChange={(v) => setField('isActive', v)} />
      </div>

      <div className="flex gap-3">
        <button onClick={save} disabled={saving}
          className="px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-60">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
        <button onClick={requestVerify} className="px-5 py-2.5 border border-gray-200 rounded-lg font-medium hover:bg-gray-50">
          Request Verification
        </button>
      </div>

      {profile?.verificationStatus === 'pending' && (
        <p className="text-sm text-amber-600">Your verification is pending review.</p>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={value ?? ''}
        onChange={(e) => onChange(type === 'number' ? e.target.value : e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
    </div>
  );
}
function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" checked={!!checked}
        onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 rounded text-primary-600" />
      {label}
    </label>
  );
}
