import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wind, Plus, LogOut, RefreshCw } from 'lucide-react';
import { getWWSession, clearWWSession } from './ProtectedRoute';
import DashboardCards from './DashboardCards';
import SubscribersTable from './SubscribersTable';
import SubscriberModal from './SubscriberModal';
import SubscriberForm from './SubscriberForm';

const SUBS_KEY = 'ww_subscribers';

function getSubscribers() {
  try {
    return JSON.parse(localStorage.getItem(SUBS_KEY) || '[]');
  } catch { return []; }
}

function saveSubscribers(subs) {
  localStorage.setItem(SUBS_KEY, JSON.stringify(subs));
}

function ensureSeedData() {
  const subs = getSubscribers();
  if (subs.length === 0) {
    saveSubscribers([
      { id: 1, name: 'John Doe', email: 'john@gmail.com', phone: '0712345678', package: 'Pro', businessType: 'Supermarket', startDate: '2026-04-01', duration: 30 },
      { id: 2, name: 'Jane Smith', email: 'jane@gmail.com', phone: '0723456789', package: 'Ultra', businessType: '', startDate: '2026-04-10', duration: 14 },
      { id: 3, name: 'Mike Johnson', email: 'mike@gmail.com', phone: '0734567890', package: 'Basic', businessType: '', startDate: '2026-03-01', duration: 15 },
      { id: 4, name: 'Sarah Williams', email: 'sarah@gmail.com', phone: '0745678901', package: 'Pro', businessType: 'Hotel', startDate: '2026-04-05', duration: 60 },
      { id: 5, name: 'David Brown', email: 'david@gmail.com', phone: '0756789012', package: 'Basic', businessType: '', startDate: '2026-04-12', duration: 7 },
    ]);
  }
}

export default function WindataWind() {
  const navigate = useNavigate();
  const session = getWWSession();
  const [subscribers, setSubscribers] = useState([]);
  const [viewSub, setViewSub] = useState(null);
  const [editSub, setEditSub] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    ensureSeedData();
    setSubscribers(getSubscribers());
    setTimeout(() => setLoading(false), 300);
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = (sub) => {
    let updated;
    const existing = subscribers.find(s => s.id === sub.id);
    if (existing) {
      updated = subscribers.map(s => s.id === sub.id ? sub : s);
    } else {
      updated = [...subscribers, sub];
    }
    saveSubscribers(updated);
    setSubscribers(updated);
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this subscriber?')) return;
    const updated = subscribers.filter(s => s.id !== id);
    saveSubscribers(updated);
    setSubscribers(updated);
  };

  const handleLogout = () => {
    clearWWSession();
    navigate('/windatawind');
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                <Wind className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 leading-tight">WindataWind</h1>
                <p className="text-[11px] text-slate-400 leading-tight hidden sm:block">Subscription Management</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500 hidden sm:block">
                {session?.name}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Dashboard</h2>
            <p className="text-sm text-slate-500 mt-1">Manage your POS subscriptions</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => { setEditSub(null); setShowAdd(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25"
            >
              <Plus className="w-4 h-4" />
              Add Subscriber
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="mb-6 sm:mb-8">
          <DashboardCards subscribers={subscribers} />
        </div>

        {/* Subscribers Table */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Subscribers</h3>
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
              <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-400">Loading subscribers...</p>
            </div>
          ) : (
            <SubscribersTable
              subscribers={subscribers}
              onView={setViewSub}
              onEdit={(sub) => { setEditSub(sub); setShowAdd(true); }}
              onDelete={handleDelete}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      {viewSub && <SubscriberModal subscriber={viewSub} onClose={() => setViewSub(null)} />}
      {showAdd && (
        <SubscriberForm
          subscriber={editSub}
          onSave={handleSave}
          onClose={() => { setShowAdd(false); setEditSub(null); }}
        />
      )}
    </div>
  );
}
