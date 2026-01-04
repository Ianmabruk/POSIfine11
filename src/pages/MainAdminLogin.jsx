import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { mainAdmin } from '../services/api';

export default function MainAdminLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if already logged in as owner
    const token = localStorage.getItem('ownerToken');
    const user = localStorage.getItem('ownerUser');
    
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        if (userData.type === 'main_admin' || userData.type === 'owner') {
          navigate('/main.admin/dashboard');
          return;
        }
      } catch (e) {
        localStorage.removeItem('ownerToken');
        localStorage.removeItem('ownerUser');
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await mainAdmin.login(formData);
      
      if (response.token && response.user && (response.user.type === 'main_admin' || response.user.type === 'owner')) {
        localStorage.setItem('ownerToken', response.token);
        localStorage.setItem('ownerUser', JSON.stringify(response.user));
        navigate('/main.admin/dashboard');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Owner login error:', err);
      setError(err.message || 'Access denied. Owner access only.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black flex items-center justify-center p-4">
      <div className="bg-black/50 backdrop-blur-lg rounded-2xl shadow-2xl max-w-md w-full p-8 border border-red-500/30">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-black rounded-2xl mx-auto mb-4 flex items-center justify-center border border-red-500/50">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-red-400 mb-2">MAIN.ADMIN</h1>
          <p className="text-gray-400">System Owner Access</p>
          <div className="mt-2 text-xs text-red-500 bg-red-500/10 px-3 py-1 rounded border border-red-500/30">
            🔒 ianmabruk3@gmail.com only
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="email"
              placeholder="Owner Email"
              className="w-full pl-10 pr-4 py-3 bg-black/30 border border-red-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Owner Password"
              className="w-full pl-10 pr-12 py-3 bg-black/30 border border-red-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/30">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white py-3 rounded-lg font-bold hover:from-red-700 hover:to-red-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/50"
          >
            {loading ? 'Authenticating...' : 'ACCESS SYSTEM'}
          </button>
        </form>

        <div className="mt-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-300 text-xs text-center">
            ⚠️ Restricted to system owner only
          </p>
        </div>
      </div>
    </div>
  );
}