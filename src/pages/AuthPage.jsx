import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, Loader } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);

  const existingSession = !authLoading && user && localStorage.getItem('token');

  const resetForm = useCallback(() => {
    setFormData({ email: '', password: '', name: '', confirmPassword: '' });
    setError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        if (!formData.email || !formData.password) {
          setError('Email and password are required');
          setLoading(false);
          return;
        }
        const res = await auth.login({ email: formData.email, password: formData.password });
        if (res.token && res.user) {
          await login(res);
          navigate(getDashboardRoute(res.user), { replace: true });
        } else {
          throw new Error('Authentication failed. Please try again.');
        }
      } else {
        if (!formData.email || !formData.name || !formData.password) {
          setError('All fields are required');
          setLoading(false);
          return;
        }
        if (formData.password.length < 8) {
          setError('Password must be at least 8 characters');
          setLoading(false);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (!/[A-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
          setError('Password must contain at least one uppercase letter and one number');
          setLoading(false);
          return;
        }
        const res = await signup({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        });
        if (res.token && res.user) {
          navigate(getDashboardRoute(res.user), { replace: true });
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
    resetForm();
  };

  if (existingSession && !authLoading) {
    navigate(getDashboardRoute(user), { replace: true });
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <PosifyLogo size="lg" animated />
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            {isLogin ? 'Welcome Back' : 'Create Your Account'}
          </h1>
          <p className="text-center text-gray-600 text-sm mb-6">
            {isLogin ? 'Sign in to your POSify account' : 'Start your free trial today'}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm mb-4 flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 001.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="you@company.com"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {!isLogin && (
                <p className="text-xs text-gray-500 mt-1">
                  Min 8 characters, at least one uppercase letter and one number
                </p>
              )}
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              {' '}
              <button
                type="button"
                onClick={toggleMode}
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} POSify. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
