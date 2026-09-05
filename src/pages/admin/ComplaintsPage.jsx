import { useState, useEffect } from 'react';
import { complaints as complaintsApi } from '../../services/api';
import { FileText, Plus, Send, Check, X } from 'lucide-react';

const STATUS_COLOR = {
  open: 'bg-amber-100 text-amber-800', in_progress: 'bg-indigo-100 text-indigo-800',
  waiting_for_information: 'bg-pink-100 text-pink-800', resolved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: '', subject: '', description: '' });

  const load = async () => {
    setLoading(true);
    try { const r = await complaintsApi.list(); setComplaints(r.complaints || []); }
    catch (e) { console.error(e); setComplaints([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    try {
      await complaintsApi.create(form);
      setShowForm(false);
      await load();
    } catch (e) { alert(e.message || ''); }
  };

  const respond = async (id, status, notes) => {
    try {
      await complaintsApi.respond(id, { status, resolutionNotes: notes });
      await load();
    } catch (e) { alert(e.message || ''); }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Complaints & Disputes</h1>
        <button onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> File Complaint
        </button>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="space-y-3">
          {complaints.map((c) => (
            <ComplaintCard key={c.id} c={c} onRespond={respond} onResolved={() => load()} />
          ))}
          {complaints.length === 0 && <p className="text-sm text-gray-500">No complaints filed.</p>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold mb-4">File a Complaint</h2>
            <div className="space-y-3">
              <Field label="Category" name="category" val={form.category} setForm={setForm} />
              <Field label="Subject" name="subject" val={form.subject} setForm={setForm} />
              <textarea placeholder="Description" value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" rows={4} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={create} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, name, val, setForm }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type="text" value={val || ''} onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
    </div>
  );
}

function ComplaintCard({ c, onRespond }) {
  const [notes, setNotes] = useState('');
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium">#{c.id} — {c.subject}</h3>
          <p className="text-sm text-gray-600 mt-1">{c.description}</p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLOR[c.status] || ''}`}>{c.status}</span>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        Order: #{c.orderId || '-'} · Rider: #{c.riderId || '-'} · Created: {c.createdAt}
      </div>
      {c.resolutionNotes && <p className="mt-2 text-sm text-gray-700"><strong>Resolution:</strong> {c.resolutionNotes}</p>}
      {c.status === 'open' && (
        <div className="mt-3 flex gap-2">
          <input type="text" placeholder="Resolution notes..." value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs" />
          <button onClick={() => onRespond(c.id, 'resolved', notes)} className="px-2 py-1 text-xs text-green-700"><Check className="w-4 h-4" /></button>
          <button onClick={() => onRespond(c.id, 'rejected', notes)} className="px-2 py-1 text-xs text-red-700"><X className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}
