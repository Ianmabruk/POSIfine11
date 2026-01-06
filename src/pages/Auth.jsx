import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User } from 'lucide-react';

export default function Auth() {
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
        res = await auth.signup({
          ...formData,
          plan: selectedPlan?.id || 'basic'
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

      // Track authentication activity
      const authActivity = {
        id: Date.now(),
        type: isLogin ? 'login' : 'signup',
        user: {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role,
          plan: res.user.plan
        },
        timestamp: new Date().toISOString(),
        ip: 'Unknown', // Would be filled by backend in real implementation
        userAgent: navigator.userAgent
      };
      
      // Store activity in localStorage for main admin to see
      const activities = JSON.parse(localStorage.getItem('authActivities') || '[]');
      activities.unshift(authActivity); // Add to beginning
      activities.splice(50); // Keep only last 50 activities
      localStorage.setItem('authActivities', JSON.stringify(activities));

      await login(res);
      
        // Show success notification
        const action = isLogin ? 'logged in' : 'signed up';
        console.log(`✅ User ${res.user.name} ${action} successfully`);
        
        // Redirect based on user role and plan
        if (res.user.role === 'admin') {
          navigate('/admin');
        } else if (res.user.role === 'cashier') {
          navigate('/dashboard/cashier');
        } else {
          // Fallback based on plan
          if (res.user.plan === 'basic') {
            navigate('/dashboard/cashier');
          } else {
            navigate('/admin');
          }
        }

    } catch (err) {
      console.error('Authentication error:', err);
      
      let errorMessage = err.message || 'Authentication failed. Please try again.';
      if (err.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        errorMessage = 'Invalid credentials. Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">POS</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {isLogin ? 'Welcome Back' : 'Get Started'}
          </h1>
          <p className="text-gray-600">{isLogin ? 'Login to your account' : 'Create your account'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {needsPasswordSetup ? (
            <>
              <p className="text-sm text-gray-600 text-center mb-4">Please set your password to continue.</p>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  placeholder="New Password"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500"
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
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              {isLogin && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Login Method</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setLoginMethod('password')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        loginMethod === 'password' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Password
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginMethod('pin')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        loginMethod === 'pin' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      pin
                    </button>
                  </div>
                </div>
              )}

              {isLogin && loginMethod === 'password' && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    placeholder="Password"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              )}

              {isLogin && loginMethod === 'pin' && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="4-digit PIN"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    maxLength={4}
                    required
                  />
                </div>
              )}

              {!isLogin && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    placeholder="Password"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              )}
            </>
          )}

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
          >
            {loading ? 'Please wait...' : (needsPasswordSetup ? 'Set Password' : (isLogin ? 'Login' : 'Sign Up'))}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setNeedsPasswordSetup(false);
            }}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}


