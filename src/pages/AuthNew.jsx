import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Loader } from 'lucide-react';
import { getDashboardRoute } from '../utils/dashboardRouting';

export default function AuthNew() {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname === '/auth/login');
  const [loginMethod, setLoginMethod] = useState('password');
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    pin: '', 
    name: '', 
    newPassword: '', 
    confirmPassword: '' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const navigate = useNavigate();
  const { login, user, loading: authLoading } = useAuth();

  // Redirect already-authenticated users to their dashboard
  useEffect(() => {
    if (!authLoading && user) {
      const route = getDashboardRoute(user);
      navigate(route, { replace: true });
    }
  }, [user, authLoading, navigate]);

  const getSelectedPlan = () => {
    try {
      return JSON.parse(localStorage.getItem('selectedPlan') || 'null');
    } catch (e) {
      console.warn('Invalid selectedPlan in localStorage:', e);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (needsPasswordSetup) {
        if (formData.newPassword !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (formData.newPassword.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        const res = await auth.login({ email: formData.email, newPassword: formData.newPassword });
        if (res.token && res.user) {
          await login(res);
          navigate('/dashboard');
        }
        return;
      }

      if (isLogin) {
        if (loginMethod === 'pin') {
          if (!formData.pin || formData.pin.length !== 4) {
            setError('Please enter a valid 4-digit PIN');
            setLoading(false);
            return;
          }
        } else {
          if (!formData.password) {
            setError('Please enter your password');
            setLoading(false);
            return;
          }
        }
      }

      let res;
      if (isLogin) {
        if (loginMethod === 'pin') {
          try {
            res = await auth.pinLogin({ email: formData.email, pin: formData.pin });
          } catch (pinError) {
            if (pinError.message.includes('PIN not set')) {
              setError('PIN not set for this user. Please use password login.');
            } else if (pinError.message.includes('Invalid PIN')) {
              setError('Invalid PIN. Please try again.');
            } else {
              throw pinError;
            }
            setLoading(false);
            return;
          }
        } else {
          res = await auth.login({ email: formData.email, password: formData.password });
        }
      } else {
        const selectedPlan = getSelectedPlan();
        const planId = localStorage.getItem('planId') || selectedPlan?.id || 'basic';
        const businessType = localStorage.getItem('businessType') || localStorage.getItem('selectedBusinessType') || selectedPlan?.business_type;
        const selectedFeatures = localStorage.getItem('selectedFeatures');
        
        res = await auth.signup({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          plan: planId,
          business_type: businessType,
          selectedFeatures: selectedFeatures ? JSON.parse(selectedFeatures) : []
        });
      }
      
      if (res.needsPasswordSetup) {
        setNeedsPasswordSetup(true);
        setFormData({ ...formData, email: res.email });
        setError('');
        setLoading(false);
        return;
      }

      if (!res || !res.user || !res.token) {
        throw new Error('Authentication failed. Please try again.');
      }

      await login(res);
      const dashRoute = getDashboardRoute(res.user);
      navigate(dashRoute, { replace: true });

    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#f5f7fb] to-white flex items-center justify-center p-4">
      <div className="max-w-5xl w-full grid lg:grid-cols-2 gap-6 lg:gap-10 items-stretch">
        <div className="hidden lg:flex flex-col justify-between rounded-3xl p-10 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white shadow-2xl">
          <div>
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-2xl font-bold">P</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">Operate smarter with POSiFine</h2>
            <p className="text-white/70 text-sm leading-relaxed">
              Centralize your sales, stock, and staff workflows with real-time insights and secure access from any device.
            </p>
          </div>
          <div className="space-y-3 text-sm">
            {[
              'Instant dashboards and alerts',
              'AI-powered recommendations',
              'Enterprise-grade security',
              '24/7 priority support'
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                <span className="text-white/80">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl w-full p-8 border border-slate-200">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#2d4cff] via-[#3b82f6] to-[#22c55e] rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-white">P</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Get Started'}
            </h1>
            <p className="text-slate-600 text-sm">
              {isLogin ? 'Sign in to your account' : 'Create your account today'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
          {needsPasswordSetup ? (
            <>
              <div className="bg-[#f5f7fb] border border-slate-200 p-4 rounded-lg">
                <p className="text-sm text-slate-700 font-medium">Please set a new password</p>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  placeholder="New Password"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-[#2d4cff] focus:ring-2 focus:ring-[#2d4cff]/20 outline-none transition-all"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-[#2d4cff] focus:ring-2 focus:ring-[#2d4cff]/20 outline-none transition-all"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </>
          ) : (
            <>
              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-[#2d4cff] focus:ring-2 focus:ring-[#2d4cff]/20 outline-none transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-[#2d4cff] focus:ring-2 focus:ring-[#2d4cff]/20 outline-none transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              {isLogin && (
                <div className="space-y-3">
                  <div className="flex gap-2 bg-[#f5f7fb] p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setLoginMethod('password')}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                        loginMethod === 'password' 
                          ? 'bg-gradient-to-r from-[#2d4cff] to-[#3b82f6] text-white shadow-sm' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Password
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginMethod('pin')}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                        loginMethod === 'pin' 
                          ? 'bg-gradient-to-r from-[#2d4cff] to-[#3b82f6] text-white shadow-sm' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      PIN
                    </button>
                  </div>
                </div>
              )}

              {isLogin && loginMethod === 'password' && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="password"
                    placeholder="Password"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-[#2d4cff] focus:ring-2 focus:ring-[#2d4cff]/20 outline-none transition-all"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              )}

              {isLogin && loginMethod === 'pin' && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="4-digit PIN"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-[#2d4cff] focus:ring-2 focus:ring-[#2d4cff]/20 outline-none transition-all text-center text-2xl tracking-widest"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    maxLength={4}
                    required
                  />
                </div>
              )}

              {!isLogin && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="password"
                    placeholder="Password (min 6 characters)"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-[#2d4cff] focus:ring-2 focus:ring-[#2d4cff]/20 outline-none transition-all"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              )}
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#2d4cff] via-[#3b82f6] to-[#22c55e] text-white py-3 rounded-2xl font-semibold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="animate-spin h-5 w-5" />
                Processing...
              </span>
            ) : (needsPasswordSetup ? 'Set Password' : (isLogin ? 'Sign In' : 'Create Account'))}
          </button>
        </form>

        {isLogin && !needsPasswordSetup && (
          <div className="mt-4 text-center">
            <button className="text-sm text-[#8b5a2b] hover:text-[#6b4c3b] font-medium transition-colors">
              Forgot password?
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            {' '}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setNeedsPasswordSetup(false);
              }}
              className="text-[#2d4cff] hover:text-[#3b82f6] font-semibold transition-colors"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
