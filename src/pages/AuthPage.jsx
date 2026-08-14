import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { getDashboardRoute } from '../utils/dashboardRouting';
import PosifyLogo from '../components/PosifyLogo';

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, signup, user, loading: authLoading } = useAuth();

  const [isLogin, setIsLogin] = useState(location.pathname === '/auth/login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const formRef = useRef(null);
  const redirectedRef = useRef(false);

  const existingSession = !authLoading && user && localStorage.getItem('token');

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateField = useCallback((name, value, isLogin) => {
    if (name === 'email') {
      if (!value) return 'Email is required';
      if (!validateEmail(value)) return 'Please enter a valid email';
      return '';
    }
    if (name === 'password') {
      if (!value) return 'Password is required';
      if (!isLogin && value.length < 8) return 'Must be at least 8 characters';
      if (!isLogin && !/[A-Z]/.test(value)) return 'Must contain an uppercase letter';
      if (!isLogin && !/[0-9]/.test(value)) return 'Must contain a number';
      return '';
    }
    if (name === 'name') {
      if (!value) return 'Name is required';
      if (value.length < 2) return 'Name must be at least 2 characters';
      return '';
    }
    if (name === 'confirmPassword') {
      if (value !== formData.password) return 'Passwords do not match';
      return '';
    }
    return '';
  }, [formData.password]);

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value, isLogin) }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value, isLogin) }));
    }
    setError('');
    setSuccess('');
  };

  const resetForm = useCallback(() => {
    setFormData({ email: '', password: '', name: '', confirmPassword: '' });
    setError('');
    setSuccess('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setTouched({});
    setFieldErrors({});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const allFields = isLogin 
      ? ['email', 'password'] 
      : ['email', 'name', 'password', 'confirmPassword'];

    const newTouched = {};
    const newFieldErrors = {};
    let hasError = false;

    allFields.forEach(field => {
      newTouched[field] = true;
      const err = validateField(field, formData[field], isLogin);
      if (err) {
        newFieldErrors[field] = err;
        hasError = true;
      }
    });
    setTouched(newTouched);
    setFieldErrors(newFieldErrors);

    if (hasError) {
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const res = await auth.login({ email: formData.email, password: formData.password });
        if (res.token && res.user) {
          await login(res);
          setSuccess('Login successful! Redirecting...');
          setTimeout(() => navigate(getDashboardRoute(res.user), { replace: true }), 800);
        } else {
          throw new Error('Authentication failed. Please try again.');
        }
      } else {
        const selectedPlan = localStorage.getItem('selectedPlan');
        const planId = localStorage.getItem('planId');
        const planData = selectedPlan ? JSON.parse(selectedPlan) : null;
        const res = await signup({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          plan: planId || planData?.id || 'starter',
        });
        if (res.token && res.user) {
          await login(res);
          setSuccess('Account created! Redirecting...');
          setTimeout(() => navigate(getDashboardRoute(res.user), { replace: true }), 800);
        } else {
          throw new Error('Signup failed. Please try again.');
        }
      }
    } catch (err) {
      let errorMsg = err.message || 'Authentication failed. Please try again.';
      if (errorMsg.includes('Email already registered') || errorMsg.includes('already exists')) {
        errorMsg = 'This email is already registered. Please sign in instead.';
      } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
        errorMsg = 'Invalid email or password.';
      } else if (errorMsg.includes('409')) {
        errorMsg = 'This email is already registered. Please sign in instead.';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    resetForm();
  };

  useEffect(() => {
    if (redirectedRef.current) return;
    if (existingSession && !authLoading) {
      redirectedRef.current = true;
      navigate(getDashboardRoute(user), { replace: true });
    }
  }, [existingSession, authLoading, user, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-950 via-slate-900 to-brand-950">
        <div className="text-center">
          <PosifyLogo size="lg" animated className="justify-center mb-6" />
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 border-4 border-white/10 rounded-full" />
            <div className="absolute inset-0 border-4 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
          </div>
          <p className="text-white/60 text-sm mt-4 font-medium animate-pulse">Loading your experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary-950 via-slate-900 to-brand-950 -z-20" />
      
      {/* Floating Orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-brand-500/15 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute -bottom-40 left-1/3 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl animate-float-slow" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="fixed inset-0 -z-5 bg-grid-pattern opacity-[0.03]" />

      {/* Main Content */}
      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <PosifyLogo size="xl" animated />
          </div>
          <p className="text-white/50 text-sm font-medium tracking-wide">
            Modern Point of Sale
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass-card-premium p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-gray-500 text-sm">
              {isLogin ? 'Sign in to your POSify account' : 'Start your free trial today'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-900">Authentication Error</p>
                  <p className="text-sm text-red-700 mt-0.5">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {success && (
            <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-100 animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-900">Success</p>
                  <p className="text-sm text-green-700 mt-0.5">{success}</p>
                </div>
              </div>
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name - Signup Only */}
            {!isLogin && (
              <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <label className="input-label">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`
                      input pl-11
                      ${fieldErrors.name ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30 bg-red-50/50' : ''}
                      ${!fieldErrors.name && touched.name && formData.name ? 'border-green-400 focus:border-green-500 focus:ring-green-500/30 bg-green-50/50' : ''}
                    `}
                    required
                  />
                </div>
                {fieldErrors.name && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />{fieldErrors.name}
                  </p>
                )}
              </div>
            )}

            {/* Email */}
            <div className={isLogin ? 'animate-fade-in-up' : ''} style={!isLogin ? { animationDelay: '150ms' } : {}}>
              <label className="input-label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="username"
                  className={`
                    input pl-11
                    ${fieldErrors.email ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30 bg-red-50/50' : ''}
                    ${!fieldErrors.email && touched.email && formData.email && validateEmail(formData.email) ? 'border-green-400 focus:border-green-500 focus:ring-green-500/30 bg-green-50/50' : ''}
                  `}
                  required
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <XCircle className="w-3 h-3" />{fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className={isLogin ? 'animate-fade-in-up' : ''} style={!isLogin ? { animationDelay: '200ms' } : {}}>
              <label className="input-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`
                    input pl-11 pr-12
                    ${fieldErrors.password ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30 bg-red-50/50' : ''}
                    ${!fieldErrors.password && touched.password && formData.password && formData.password.length >= 8 ? 'border-green-400 focus:border-green-500 focus:ring-green-500/30 bg-green-50/50' : ''}
                  `}
                  required
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <XCircle className="w-3 h-3" />{fieldErrors.password}
                </p>
              )}
              {!isLogin && !fieldErrors.password && (
                <p className="mt-1.5 text-xs text-gray-400">
                  Min 8 characters, 1 uppercase letter, 1 number
                </p>
              )}
            </div>

            {/* Confirm Password - Signup Only */}
            {!isLogin && (
              <div className="animate-fade-in-up" style={{ animationDelay: '250ms' }}>
                <label className="input-label">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`
                      input pl-11 pr-12
                      ${fieldErrors.confirmPassword ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30 bg-red-50/50' : ''}
                      ${!fieldErrors.confirmPassword && touched.confirmPassword && formData.confirmPassword && formData.confirmPassword === formData.password ? 'border-green-400 focus:border-green-500 focus:ring-green-500/30 bg-green-50/50' : ''}
                    `}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />{fieldErrors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`
                w-full py-3.5 rounded-2xl font-semibold text-white
                bg-gradient-to-r from-primary-600 to-brand-600
                hover:from-primary-700 hover:to-brand-700
                shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30
                transition-all duration-300 active:scale-[0.98]
                disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100
                flex items-center justify-center gap-2 mt-6
                ${isLogin ? 'animate-fade-in-up' : ''}
              `}
              style={!isLogin ? { animationDelay: '300ms' } : {}}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                </>
              ) : (
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              {' '}
              <button
                type="button"
                onClick={toggleMode}
                className="text-primary-600 hover:text-primary-700 font-semibold transition-colors relative group"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary-500 transition-all group-hover:w-full" />
              </button>
            </p>
          </div>

          {/* Copyright */}
          <div className="mt-6 pt-4 text-center">
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} POSify. All rights reserved.
            </p>
          </div>
        </div>

        {/* Bottom Trust Indicators */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-white/30 text-xs">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5.999c.26.574.406 1.182.406 1.834v.007a9.96 9.96 0 01-.406 3.834 11.954 11.954 0 01-7.834 7.834 9.96 9.96 0 01-3.834-.406v-.007c0-.652.146-1.26.406-1.834A11.954 11.954 0 012 10.005c0-2.398.866-4.598 2.166-6.006z" clipRule="evenodd" />
            </svg>
            Secure
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Encrypted
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5.999c.26.574.406 1.182.406 1.834v.007a9.96 9.96 0 01-.406 3.834 11.954 11.954 0 01-7.834 7.834 9.96 9.96 0 01-3.834-.406v-.007c0-.652.146-1.26.406-1.834A11.954 11.954 0 012 10.005c0-2.398.866-4.598 2.166-6.006z" clipRule="evenodd" />
            </svg>
            SOC 2
          </span>
        </div>
      </div>
    </div>
  );
}
