import { Users, CheckCircle, XCircle, DollarSign } from 'lucide-react';

export default function DashboardCards({ subscribers }) {
  const now = new Date();
  const active = subscribers.filter(s => {
    const end = new Date(s.startDate);
    end.setDate(end.getDate() + (s.duration || 0));
    return end > now;
  });
  const expired = subscribers.length - active.length;
  const revenue = subscribers.reduce((sum, s) => {
    const pkg = (s.package || '').toLowerCase();
    const price = pkg === 'pro' ? 5000 : pkg === 'ultra' ? 3000 : 1500;
    return sum + price;
  }, 0);

  const cards = [
    { label: 'Total Subscribers', value: subscribers.length, icon: Users, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'Active', value: active.length, icon: CheckCircle, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Expired', value: expired, icon: XCircle, color: 'from-red-500 to-red-600', bg: 'bg-red-50', text: 'text-red-600' },
    { label: 'Revenue (KSH)', value: revenue.toLocaleString(), icon: DollarSign, color: 'from-violet-500 to-violet-600', bg: 'bg-violet-50', text: 'text-violet-600' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map(card => (
        <div key={card.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center`}>
              <card.icon className={`w-5 h-5 ${card.text}`} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-800">{card.value}</p>
          <p className="text-sm text-slate-500 mt-1">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
