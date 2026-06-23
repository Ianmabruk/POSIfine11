import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Lock, User, Loader, LogOut, ArrowRight, Eye, EyeOff,
  Smartphone, CheckCircle2, AlertCircle, ArrowLeft
} from 'lucide-react';
import { getDashboardRoute } from '../utils/dashboardRouting';

export default function AuthEnterprise() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, login, loading: authLoading } = useAuth();
  
  const [mode, setMode] = useState('login');
  const [loginMethod, setLoginMethod] = useState('password');
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    pin: '', 
    name: '', 
    newPassword: '', 
    confirmPassword: '',
    currentPassword: '',
    totpCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const [switchingUser, setSwitchingUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const existingSession = !authLoading && user && localStorage.getItem('token');

  const handleSwitchUser = async () => {
    setSwitchingUser(true);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('csrfToken');
    localStorage.removeItem('appLogo');
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('products_cache_')) localStorage.removeItem(key);
    });
    sessionStorage.removeItem('reminderShown');
    sessionStorage.removeItem('adminReminderShown');
    window.location.replace('/auth/login');
  };

  const getSelectedPlan = () => {
    try {
      return JSON.parse(localStorage.getItem('selectedPlan') || 'null');
    } catch (e) {
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'forgot-password') {
        setEmailSent(true);
        setLoading(false);
        return;
      }

      if (mode === 'reset-password') {
        if (formData.newPassword !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (formData.newPassword.length < 8) {
          setError('Password must be at least 8 characters');
          setLoading(false);
          return;
        }
        setError('Password reset link sent. Check your email.');
        setLoading(false);
        setTimeout(() => setMode('login'), 3000);
        return;
      }

      if (mode === '2fa-setup') {
        if (formData.totpCode.length !== 6) {
          setError('Please enter a valid 6-digit code');
          setLoading(false);
          return;
        }
        setLoading(false);
        navigate('/dashboard');
        return;
      }

      if (needsPasswordSetup) {
        if (formData.newPassword !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (formData.newPassword.length < 8) {
          setError('Password must be at least 8 characters');
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

      if (mode === 'login') {
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
      if (mode === 'login') {
        if (loginMethod === 'pin') {
          try {
            res = await auth.pinLogin({ email: formData.email, pin: formData.pin });
          } catch (pinError) {
            if (pinError.message?.includes('PIN not set')) {
              setError('PIN not set. Please use password login.');
            } else if (pinError.message?.includes('Invalid PIN')) {
              setError('Invalid PIN. Please try again.');
            } else {
              setError(pinError.message || 'PIN login failed');
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
        const selectedFeatures = localStorage.getItem('selectedFeatures');
        res = await auth.signup({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          plan: planId,
          selectedFeatures: selectedFeatures ? JSON.parse(selectedFeatures) : []
        });
      }
      
      if (res?.needsPasswordSetup) {
        setNeedsPasswordSetup(true);
        setFormData({ ...formData, email: res.email || formData.email });
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
      let errorMsg = err.message || 'Authentication failed. Please try again.';
      
      if (errorMsg.includes('Email already registered') || errorMsg.includes('already exists')) {
        errorMsg = 'This email is already registered. Please log in instead.';
      } else if (errorMsg.includes('500') || errorMsg.includes('Server error')) {
        errorMsg = 'Server error. Please wait a moment and try again.';
      } else if (errorMsg.includes('network') || errorMsg.includes('no response') || errorMsg.includes('fetch')) {
        errorMsg = 'Network error. Check your connection and try again.';
      } else if (errorMsg.includes('lock')) {
        errorMsg = 'Your account has been locked. Please contact support.';
      } else if (errorMsg.includes('inactive') || errorMsg.includes('subscription')) {
        errorMsg = 'Your account is inactive. Please choose a subscription plan.';
      } else if (mode === 'signup' && errorMsg.includes('failed')) {
        errorMsg = 'Please ensure all fields are filled correctly.';
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const modeTitle = { login: 'Welcome back', signup: 'Create your account', 'forgot-password': 'Reset your password', 'reset-password': 'Set new password', '2fa-setup': 'Two-factor authentication', 'verify-email': 'Verify your email' };
  const modeSubtitle = { login: 'Sign in to your account to continue', signup: 'Start your 15-day free trial today', 'forgot-password': "Enter your email and we'll send you a reset link", 'reset-password': 'Choose a strong password for your account', '2fa-setup': 'Enter the 6-digit code from your authenticator app', 'verify-email': 'Check your inbox and verify your email address' };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">POSIFY</span>
          </button>
          <button onClick={() => navigate('/')} className="text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors">
            Back to Home
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-16">
        <div className="w-full max-w-md">
          {existingSession && !switchingUser && mode === 'login' && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-2xl bg-primary-50 border border-primary-100">
              <p className="text-sm text-primary-800 font-medium mb-1">You're signed in as</p>
              <p className="text-primary-900 font-semibold truncate">{user?.email}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => navigate(getDashboardRoute(user), { replace: true })} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors">
                  Go to Dashboard <ArrowRight size={14} />
                </button>
                <button onClick={handleSwitchUser} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-primary-200 text-primary-700 text-sm font-medium hover:bg-primary-100 transition-colors">
                  <LogOut size={14} /> Switch
                </button>
              </div>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-white rounded-3xl shadow-soft border border-slate-100 p-8 sm:p-10">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/20">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">{modeTitle[mode] || 'Welcome'}</h1>
              <p className="text-sm text-slate-500">{modeSubtitle[mode] || ''}</p>
            </div>

            {emailSent && mode === 'forgot-password' ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-success" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Check your email</h3>
                <p className="text-sm text-slate-500 mb-6">We've sent a password reset link to <strong>{formData.email}</strong></p>
                <button onClick={() => { setEmailSent(false); setMode('login'); }} className="btn-primary w-full py-3 text-sm">Back to Login</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'signup' && (
                  <div>
                    <label className="input-label">Full Name</label>
                    <div className="relative">
                      <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === 'name' ? 'text-primary-600' : 'text-slate-400'}`} />
                      <input type="text" placeholder="John Doe" className="input pl-10" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)} required />
                    </div>
                  </div>
                )}

                <div>
                  <label className="input-label">Email Address</label>
                  <div className="relative">
                    <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === 'email' ? 'text-primary-600' : 'text-slate-400'}`} />
                    <input type="email" placeholder="you@company.com" className="input pl-10" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} required />
                  </div>
                </div>

                {mode === 'login' && (
                  <div>
                    <label className="input-label">Sign in with</label>
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                      {['password', 'pin'].map((method) => (
                        <button key={method} type="button" onClick={() => setLoginMethod(method)} className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${loginMethod === method ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                          {method === 'password' ? 'Password' : 'PIN'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(mode === 'login' || mode === 'signup' || mode === 'reset-password') && mode !== 'forgot-password' && mode !== '2fa-setup' && !needsPasswordSetup && (
                  <>
                    {mode === 'login' && loginMethod === 'password' && (
                      <div>
                        <label className="input-label">Password</label>
                        <div className="relative">
                          <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === 'password' ? 'text-primary-600' : 'text-slate-400'}`} />
                          <input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" className="input pl-10 pr-10" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} required />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {mode === 'login' && loginMethod === 'pin' && (
                      <div>
                        <label className="input-label">4-digit PIN</label>
                        <input type="text" inputMode="numeric" placeholder="••••" className="input text-center text-2xl tracking-[0.5em] font-mono" value={formData.pin} onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })} maxLength={4} required />
                      </div>
                    )}

                    {(mode === 'signup' || mode === 'reset-password') && (
                      <div>
                        <label className="input-label">Password</label>
                        <div className="relative">
                          <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === 'password' ? 'text-primary-600' : 'text-slate-400'}`} />
                          <input type={showPassword ? 'text' : 'password'} placeholder={mode === 'signup' ? 'Create a strong password' : 'New password'} className="input pl-10 pr-10" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} required />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {mode === 'reset-password' && (
                      <div>
                        <label className="input-label">Confirm Password</label>
                        <div className="relative">
                          <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === 'confirmPassword' ? 'text-primary-600' : 'text-slate-400'}`} />
                          <input type={showPassword ? 'text' : 'password'} placeholder="Confirm your password" className="input pl-10" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} onFocus={() => setFocusedField('confirmPassword')} onBlur={() => setFocusedField(null)} required />
                        </div>
                      </div>
                    )}

                    {mode === '2fa-setup' && (
                      <div>
                        <label className="input-label">Authenticator Code</label>
                        <div className="relative">
                          <Smartphone className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === 'totpCode' ? 'text-primary-600' : 'text-slate-400'}`} />
                          <input type="text" inputMode="numeric" placeholder="000000" className="input pl-10 text-center text-2xl tracking-[0.3em] font-mono" value={formData.totpCode} onChange={(e) => setFormData({ ...formData, totpCode: e.target.value.replace(/\D/g, '').slice(0, 6) })} maxLength={6} onFocus={() => setFocusedField('totpCode')} onBlur={() => setFocusedField(null)} required />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {needsPasswordSetup && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <p className="text-sm text-amber-800 font-medium">Please set a new password to continue</p>
                  </div>
                )}

                {error && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-100 rounded-xl p-3.5 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-red-700 leading-relaxed">{error}</span>
                  </motion.div>
                )}

                <button type="submit" disabled={loading} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                  {loading ? (
                    <span className="flex items-center gap-2"><Loader className="w-4 h-4 animate-spin" /> Processing...</span>
                  ) : ({ login: 'Sign In', signup: 'Create Account', 'forgot-password': 'Send Reset Link', 'reset-password': 'Update Password', '2fa-setup': 'Verify & Continue', 'verify-email': 'Verify Email' })[mode] || 'Continue'}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setNeedsPasswordSetup(false); }} className="text-sm text-slate-500 hover:text-primary-600 font-medium transition-colors">
                {mode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>

            {mode === 'login' && (
              <div className="mt-4 text-center">
                <button onClick={() => { setMode('forgot-password'); setEmailSent(false); setError(''); }} className="text-sm text-slate-400 hover:text-primary-600 font-medium transition-colors">
                  Forgot password?
                </button>
              </div>
            )}

            {mode === 'forgot-password' && !emailSent && (
              <div className="mt-4 text-center">
                <button onClick={() => { setMode('login'); setEmailSent(false); setError(''); }} className="text-sm text-slate-400 hover:text-primary-600 font-medium transition-colors flex items-center justify-center gap-1 mx-auto">
                  <ArrowLeft className="w-3 h-3" /> Back to login
                </button>
              </div>
            )}
          </motion.div>

          <p className="text-center text-xs text-slate-400 mt-8">
            Protected by enterprise-grade security.
          </p>
        </div>
      </main>
    </div>
  );
}
