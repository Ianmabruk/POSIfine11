import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import mainAdminApi from '../../services/mainAdminApi';

export default function ControlCenterLogin() {
  const navigate = useNavigate();
  const { initializeAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('ownerToken');
      localStorage.removeItem('ownerUser');
      localStorage.removeItem('mainAdminToken');
      localStorage.removeItem('mainAdminUser');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('csrfToken');

      const loginData = await mainAdminApi.login({ email, password });
      
      if (loginData.token) {
        localStorage.setItem('mainAdminToken', loginData.token);
        localStorage.setItem('token', loginData.token);
        localStorage.setItem('ownerToken', loginData.token);
        if (loginData.user) {
          const userStr = JSON.stringify(loginData.user);
          localStorage.setItem('mainAdminUser', userStr);
          localStorage.setItem('user', userStr);
          localStorage.setItem('ownerUser', userStr);
        }
        if (loginData.refreshToken) {
          localStorage.setItem('refreshToken', loginData.refreshToken);
        }
        if (loginData.csrfToken) {
          localStorage.setItem('csrfToken', loginData.csrfToken);
        }
        
        await initializeAuth();
        
        navigate('/main.admin');
      } else {
        throw new Error(loginData.error || loginData.message || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-2xl font-bold text-slate-900">Posify</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Posify Control Center</h1>
          <p className="text-slate-500">Manage your Posify businesses and subscriptions</p>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-3">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@business.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Access Control Center
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <Link to="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
              Back to Posify Home
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
