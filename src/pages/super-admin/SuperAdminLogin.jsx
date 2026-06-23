import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('superadmin@mabrixel.local');
  const [password, setPassword] = useState('SuperAdmin@2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const baseUrl = (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api').replace(/\/$/, '');
      const resp = await fetch(`${baseUrl}/main-admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.token) {
        localStorage.setItem('mainAdminToken', data.token);
        if (data.user) {
          localStorage.setItem('mainAdminUser', JSON.stringify(data.user));
        }
        navigate('/main.admin');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-white font-bold">P</span>
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">POSIFY</span>
          </button>
          <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Super Admin Portal</h1>
          <p className="text-sm text-slate-500">Platform management and monitoring</p>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-soft border border-slate-100 p-8"
        >
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="input-label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Access Portal <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </div>
        </motion.form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Restricted access for authorized personnel only.
        </p>
      </div>
    </div>
  );
}
