// Legacy auth screen retained only for backward compatibility.
// Use AuthNew as the single source of truth.
export { default } from './AuthNew';
/*
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { getDashboardRoute, debugRoutingDecision } from '../utils/dashboardRouting';

export default function AuthImproved() {
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
  const { login } = useAuth();

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

        const signupPayload = {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          plan: planId,
          business_type: businessType || undefined
        };

        res = await auth.signup(signupPayload);
      }

      if (!res?.token || !res?.user) {
        throw new Error('Invalid response from server');
      }

      if (res.user.needsPasswordSetup) {
        setNeedsPasswordSetup(true);
        setLoading(false);
        return;
      }

      await login(res);

      const dashboardRoute = getDashboardRoute(res.user);
      navigate(dashboardRoute);

    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2c1810] via-[#3d2817] to-[#1a0f08] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* African Pattern Background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <svg className="w-full h-full">
          <defs>
            <pattern id="authPattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="3" fill="rgba(139, 90, 43, 0.4)" />
              <circle cx="100" cy="20" r="3" fill="rgba(205, 133, 63, 0.4)" />
              <circle cx="20" cy="100" r="3" fill="rgba(205, 133, 63, 0.4)" />
              <circle cx="100" cy="100" r="3" fill="rgba(139, 90, 43, 0.4)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#authPattern)" />
        </svg>
      </div>

      {/* Warm gradient orbs */}
      <motion.div
        animate={{ x: [0, 50, 0], y: [0, -50, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-[#8b5a2b]/20 via-[#00ff88]/10 to-transparent rounded-full blur-3xl pointer-events-none"
      />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative max-w-md w-full bg-[#3d2817]/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#8b5a2b]/40 p-8 space-y-8"
      >
        {/* Logo Header */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#8b5a2b] via-[#00ff88] to-[#cd853f] rounded-2xl flex items-center justify-center shadow-lg shadow-[#8b5a2b]/40 mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-[#f5deb3] via-[#00ff88] to-[#ff6b35] bg-clip-text text-transparent">
            {needsPasswordSetup ? 'Setup Password' : (isLogin ? 'Welcome Back' : 'Create Account')}
          </h2>
          <p className="text-[#e8c39e] mt-2">{isLogin ? 'Login to your account' : 'Start your journey today'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {needsPasswordSetup ? (
            <>
              <p className="text-sm text-[#e8c39e] text-center mb-4">Please set your password to continue.</p>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b5a2b]" />
                <input
                  type="password"
                  placeholder="New Password"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#2c1810]/60 border border-[#8b5a2b]/40 focus:border-[#00ff88]/60 focus:ring-2 focus:ring-[#00ff88]/20 text-[#f5deb3] placeholder-[#8b5a2b] transition-all"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b5a2b]" />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#2c1810]/60 border border-[#8b5a2b]/40 focus:border-[#00ff88]/60 focus:ring-2 focus:ring-[#00ff88]/20 text-[#f5deb3] placeholder-[#8b5a2b] transition-all"
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
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b5a2b]" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#2c1810]/60 border border-[#8b5a2b]/40 focus:border-[#00ff88]/60 focus:ring-2 focus:ring-[#00ff88]/20 text-[#f5deb3] placeholder-[#8b5a2b] transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b5a2b]" />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#2c1810]/60 border border-[#8b5a2b]/40 focus:border-[#00ff88]/60 focus:ring-2 focus:ring-[#00ff88]/20 text-[#f5deb3] placeholder-[#8b5a2b] transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              {isLogin && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-[#f5deb3]">Login Method</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setLoginMethod('password')}
                      className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                        loginMethod === 'password' 
                          ? 'bg-gradient-to-r from-[#8b5a2b] to-[#00ff88] text-white shadow-lg' 
                          : 'bg-[#2c1810]/60 text-[#e8c39e] border border-[#8b5a2b]/40 hover:border-[#8b5a2b]/60'
                      }`}
                    >
                      Password
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginMethod('pin')}
                      className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                        loginMethod === 'pin' 
                          ? 'bg-gradient-to-r from-[#8b5a2b] to-[#00ff88] text-white shadow-lg' 
                          : 'bg-[#2c1810]/60 text-[#e8c39e] border border-[#8b5a2b]/40 hover:border-[#8b5a2b]/60'
                      }`}
                    >
                      PIN
                    </button>
                  </div>
                </div>
              )}

              {isLogin && loginMethod === 'password' && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b5a2b]" />
                  <input
                    type="password"
                    placeholder="Password"
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#2c1810]/60 border border-[#8b5a2b]/40 focus:border-[#00ff88]/60 focus:ring-2 focus:ring-[#00ff88]/20 text-[#f5deb3] placeholder-[#8b5a2b] transition-all"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              )}

              {isLogin && loginMethod === 'pin' && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b5a2b]" />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="4-digit PIN"
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#2c1810]/60 border border-[#8b5a2b]/40 focus:border-[#00ff88]/60 focus:ring-2 focus:ring-[#00ff88]/20 text-[#f5deb3] placeholder-[#8b5a2b] transition-all text-center text-2xl tracking-widest"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    maxLength={4}
                    required
                  />
                </div>
              )}

              {!isLogin && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b5a2b]" />
                  <input
                    type="password"
                    placeholder="Password (min 6 characters)"
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#2c1810]/60 border border-[#8b5a2b]/40 focus:border-[#00ff88]/60 focus:ring-2 focus:ring-[#00ff88]/20 text-[#f5deb3] placeholder-[#8b5a2b] transition-all"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              )}
            </>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/40 text-red-200 text-sm p-4 rounded-lg flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#8b5a2b] via-[#00ff88] to-[#cd853f] text-white py-3 rounded-lg font-bold shadow-lg shadow-[#8b5a2b]/40 hover:shadow-xl hover:shadow-[#00ff88]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (needsPasswordSetup ? 'Set Password' : (isLogin ? 'Login' : 'Create Account'))}
          </button>
        </form>

        {/* Forgot Password Link */}
        {isLogin && !needsPasswordSetup && (
          <div className="text-center">
            <button className="text-sm text-[#00ff88] hover:text-[#00ff88]/80 transition-colors">
              Forgot Password?
            </button>
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#8b5a2b]/30" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-[#3d2817] text-[#e8c39e]">or</span>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setNeedsPasswordSetup(false);
            }}
            className="text-[#00ff88] hover:text-[#00ff88]/80 text-sm font-medium transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </button>
        </div>

        {/* Back to Home */}
        <div className="text-center pt-4 border-t border-[#8b5a2b]/20">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-[#e8c39e] hover:text-[#f5deb3] transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
*/
