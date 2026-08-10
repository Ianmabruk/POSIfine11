import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
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
  const redirectDone = useRef(false);

  useEffect(() => {
    // Only check redirect once
    if (redirectDone.current) return;
    redirectDone.current = true;

    const token = localStorage.getItem('token') || localStorage.getItem('ownerToken') || localStorage.getItem('mainAdminToken');
    const userStr = localStorage.getItem('user') || localStorage.getItem('ownerUser') || localStorage.getItem('mainAdminUser');
    
    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr);
        if (['main_admin', 'owner'].includes(userData.role)) {
          navigate('/main.admin', { replace: true });
        }
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
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
      // Reset any stale auth state that can cause role mismatches during owner login.
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('ownerToken');
      localStorage.removeItem('ownerUser');
      localStorage.removeItem('mainAdminToken');
      localStorage.removeItem('mainAdminUser');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('csrfToken');

      const response = await mainAdmin.login(formData);
      
      if (response.token && response.user) {
        // Save to multiple keys for compatibility
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('ownerToken', response.token);
        localStorage.setItem('ownerUser', JSON.stringify(response.user));
        localStorage.setItem('mainAdminToken', response.token);
        localStorage.setItem('mainAdminUser', JSON.stringify(response.user));
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
        if (response.csrfToken) {
          localStorage.setItem('csrfToken', response.csrfToken);
        }
        navigate('/main.admin', { replace: true });
      } else {
        throw new Error('Invalid response from server or insufficient permissions');
      }
    } catch (err) {
      setError(err.message || 'Access denied. Owner access only.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0a0f] via-[#1a0f1f] to-[#0b0a0f] flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl shadow-2xl max-w-md w-full p-8 border border-white/10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-500 via-purple-600 to-blue-500 rounded-3xl mx-auto mb-4 flex items-center justify-center border border-white/20 shadow-lg">
            <div className="text-3xl font-bold text-white">MA</div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to main.admin</h1>
          <div className="mainadmin-motion text-sm text-white/70">
            <span className="word">Secure</span>
            <span className="word">Monitor</span>
            <span className="word">Lead</span>
          </div>
          <p className="text-white/60 text-sm mt-4">Sign in to continue managing system operations.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
            <input
              type="email"
              placeholder="Email address"
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-pink-200 text-sm bg-pink-500/10 p-3 rounded-lg border border-pink-500/20">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white py-3 rounded-lg font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
          >
            {loading ? 'Authenticating...' : 'ACCESS SYSTEM'}
          </button>
        </form>

        <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-lg">
          <p className="text-white/60 text-xs text-center">
            Credentials are managed securely via environment configuration.
          </p>
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => navigate('/auth/login')}
              className="text-xs text-blue-200 hover:text-white underline"
            >
              Open Auth Page
            </button>
          </div>
        </div>
      </div>
      <style>{`
        .mainadmin-motion {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 8px;
        }
        .mainadmin-motion .word {
          display: inline-block;
          background: linear-gradient(90deg, #f472b6, #c084fc, #60a5fa);
          -webkit-background-clip: text;
          color: transparent;
          animation: drift 4s ease-in-out infinite;
        }
        .mainadmin-motion .word:nth-child(2) {
          animation-delay: 0.8s;
        }
        .mainadmin-motion .word:nth-child(3) {
          animation-delay: 1.6s;
        }
        @keyframes drift {
          0% { transform: translateY(0); opacity: 0.6; }
          50% { transform: translateY(-6px); opacity: 1; }
          100% { transform: translateY(0); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}