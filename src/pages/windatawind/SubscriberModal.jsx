import { X } from 'lucide-react';

function getDaysRemaining(startDate, duration) {
  const end = new Date(startDate);
  end.setDate(end.getDate() + (duration || 0));
  return Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
}

function getEndDate(startDate, duration) {
  const end = new Date(startDate);
  end.setDate(end.getDate() + (duration || 0));
  return end.toLocaleDateString();
}

export default function SubscriberModal({ subscriber, onClose }) {
  if (!subscriber) return null;
  const days = getDaysRemaining(subscriber.startDate, subscriber.duration);
  const status = days <= 0 ? 'Expired' : days <= 3 ? 'Expiring Soon' : 'Active';
  const statusColor = days <= 0 ? 'text-red-500 bg-red-50' : days <= 3 ? 'text-amber-500 bg-amber-50' : 'text-emerald-500 bg-emerald-50';

  const fields = [
    { label: 'Full Name', value: subscriber.name },
    { label: 'Email', value: subscriber.email },
    { label: 'Phone', value: subscriber.phone },
    { label: 'Package', value: subscriber.package },
    ...(subscriber.package?.toLowerCase() === 'custom' ? [{ label: 'Business Type', value: subscriber.businessType || '—' }] : []),
    { label: 'Start Date', value: subscriber.startDate },
    { label: 'End Date', value: getEndDate(subscriber.startDate, subscriber.duration) },
    { label: 'Duration', value: `${subscriber.duration} days` },
    { label: 'Days Remaining', value: days <= 0 ? '0' : String(days) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Subscriber Details</h3>
            <span className={`inline-block mt-1 px-2.5 py-1 text-xs font-medium rounded-full ${statusColor}`}>
              {status}
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {fields.map(f => (
            <div key={f.label} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
              <span className="text-sm text-slate-500">{f.label}</span>
              <span className="text-sm font-medium text-slate-800">{f.value}</span>
            </div>
          ))}
        </div>

        <div className="p-5 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
