import { Search, Filter, ChevronDown } from 'lucide-react';
import { useState } from 'react';

function getDaysRemaining(startDate, duration) {
  const end = new Date(startDate);
  end.setDate(end.getDate() + (duration || 0));
  const diff = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
}

function StatusBadge({ days }) {
  if (days <= 0) return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-50 text-red-600 border border-red-200">Expired</span>;
  if (days <= 3) return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-600 border border-amber-200">Expiring</span>;
  return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">Active</span>;
}

function PackageBadge({ pkg }) {
  const styles = {
    starter: 'bg-slate-50 text-slate-700 border-slate-200',
    business: 'bg-blue-50 text-blue-700 border-blue-200',
    custom: 'bg-violet-50 text-violet-700 border-violet-200',
  };
  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${styles[(pkg || '').toLowerCase()] || styles.starter}`}>
      {pkg}
    </span>
  );
}

export default function SubscribersTable({ subscribers, onView, onEdit, onDelete }) {
  const [search, setSearch] = useState('');
  const [filterPkg, setFilterPkg] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = subscribers.filter(s => {
    const days = getDaysRemaining(s.startDate, s.duration);
    const matchesSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase());
    const matchesPkg = filterPkg === 'all' || (s.package || '').toLowerCase() === filterPkg;
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && days > 0) ||
      (filterStatus === 'expired' && days <= 0);
    return matchesSearch && matchesPkg && matchesStatus;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Search & Filter Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-100 transition-colors sm:w-auto"
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-100">
            <select
              value={filterPkg}
              onChange={e => setFilterPkg(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Packages</option>
              <option value="starter">Starter</option>
              <option value="business">Business</option>
              <option value="custom">Custom</option>
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <>
        <div className="md:hidden space-y-3 p-4">
          {filtered.length === 0 ? (
            <div className="text-center text-slate-400 py-8">No subscribers found</div>
          ) : filtered.map(sub => {
            const days = getDaysRemaining(sub.startDate, sub.duration);
            return (
              <div key={sub.id} className="bg-white rounded-xl shadow p-4 space-y-2 border border-slate-100" onClick={() => onView(sub)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{sub.name}</p>
                    <p className="text-xs text-slate-400">{sub.email}</p>
                  </div>
                  <StatusBadge days={days} />
                </div>
                <div className="text-xs text-slate-500">{sub.phone}</div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-100">
                  <span className="text-slate-600">Package</span>
                  <PackageBadge pkg={sub.package} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Days Left</span>
                  <span className={`font-semibold ${days <= 0 ? 'text-red-500' : days <= 3 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {days <= 0 ? 0 : days}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Joined</span>
                  <span className="text-slate-900">{sub.startDate}</span>
                </div>
                <div className="flex gap-2 pt-2" onClick={e => e.stopPropagation()}>
                  <button onClick={() => onEdit(sub)} className="text-xs px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-1">Edit</button>
                  <button onClick={() => onDelete(sub.id)} className="text-xs px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-1">Delete</button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="text-left px-4 sm:px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 sm:px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
                <th className="text-left px-4 sm:px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Phone</th>
                <th className="text-left px-4 sm:px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Package</th>
                <th className="text-left px-4 sm:px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Days Left</th>
                <th className="text-left px-4 sm:px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 sm:px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Joined</th>
                <th className="text-right px-4 sm:px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    No subscribers found
                  </td>
                </tr>
              ) : filtered.map(sub => {
                const days = getDaysRemaining(sub.startDate, sub.duration);
                return (
                  <tr
                    key={sub.id}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                    onClick={() => onView(sub)}
                  >
                    <td className="px-4 sm:px-5 py-3.5 font-medium text-slate-800">
                      {sub.name}
                      <span className="block sm:hidden text-xs text-slate-400 font-normal mt-0.5">{sub.email}</span>
                    </td>
                    <td className="px-4 sm:px-5 py-3.5 text-slate-600 hidden sm:table-cell">{sub.email}</td>
                    <td className="px-4 sm:px-5 py-3.5 text-slate-600 hidden md:table-cell">{sub.phone}</td>
                    <td className="px-4 sm:px-5 py-3.5"><PackageBadge pkg={sub.package} /></td>
                    <td className="px-4 sm:px-5 py-3.5">
                      <span className={`font-semibold ${days <= 0 ? 'text-red-500' : days <= 3 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {days <= 0 ? 0 : days}
                      </span>
                    </td>
                    <td className="px-4 sm:px-5 py-3.5"><StatusBadge days={days} /></td>
                    <td className="px-4 sm:px-5 py-3.5 text-slate-500 hidden lg:table-cell">{sub.startDate}</td>
                    <td className="px-4 sm:px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => onEdit(sub)}
                          className="px-2.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(sub.id)}
                          className="px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>

      <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
        Showing {filtered.length} of {subscribers.length} subscribers
      </div>
    </div>
  );
}
