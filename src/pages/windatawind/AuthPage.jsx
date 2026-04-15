import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Wind, Loader2 } from 'lucide-react';

const WW_USERS_KEY = 'ww_users';
const WW_SESSION_KEY = 'ww_session';

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(WW_USERS_KEY) || '[]');
  } catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem(WW_USERS_KEY, JSON.stringify(users));
}

// Seed default admin if no users exist
function ensureDefaultUser() {
  const users = getUsers();
  if (users.length === 0) {
    saveUsers([{ id: 1, name: 'Admin User', email: 'admin@gmail.com', password: '1234' }]);
  }
}

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  ensureDefaultUser();

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate network delay
    await new Promise(r => setTimeout(r, 400));

    const users = getUsers();

    if (isLogin) {
      const found = users.find(u => u.email === form.email && u.password === form.password);
      if (!found) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }
      localStorage.setItem(WW_SESSION_KEY, JSON.stringify({ id: found.id, name: found.name, email: found.email }));
      navigate('/main.admin');
    } else {
      if (!form.name.trim()) { setError('Full name is required'); setLoading(false); return; }
      if (!form.email.trim()) { setError('Email is required'); setLoading(false); return; }
      if (form.password.length < 4) { setError('Password must be at least 4 characters'); setLoading(false); return; }
      if (users.find(u => u.email === form.email)) {
        setError('An account with this email already exists');
        setLoading(false);
        return;
      }
      const newUser = { id: Date.now(), name: form.name, email: form.email, password: form.password };
      saveUsers([...users, newUser]);
      localStorage.setItem(WW_SESSION_KEY, JSON.stringify({ id: newUser.id, name: newUser.name, email: newUser.email }));
      navigate('/main.admin');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/25 mb-4">
            <Wind className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            WindataWind
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Subscription Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 border border-white/50 p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">
            {isLogin ? 'Welcome back' : 'Create account'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl animate-[fadeIn_0.2s]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Full Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsLogin(l => !l); setError(''); setForm({ name: '', email: '', password: '' }); }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign In'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">WindataWind © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}
