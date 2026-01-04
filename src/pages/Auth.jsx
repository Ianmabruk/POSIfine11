import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { syncUserToBackend, isBackendAvailable } from '../utils/dataSync';
import { Mail, Lock, User } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (needsPasswordSetup) {
        // Setting up password for first time
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
          login(res.token, res.user);
          // Force redirect to cashier dashboard
          window.location.href = '/cashier';
        }
        return;
      }

      let res;
      try {
        res = isLogin 
          ? await auth.login({ email: formData.email, password: formData.password })
          : await auth.signup(formData);
      } catch (apiError) {
        // Backend not available - use client-side auth for demo
        console.warn('Backend not available, using client-side auth');
        
        if (isLogin) {
          // Check localStorage for existing user
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const user = JSON.parse(storedUser);
            if (user.email === formData.email) {
              const mockToken = btoa(JSON.stringify({ id: user.id, email: user.email, role: user.role }));
              res = { token: mockToken, user };
            } else {
              throw new Error('Invalid credentials');
            }
          } else {
            throw new Error('No account found. Please sign up first.');
          }
        } else {
          // Create new user client-side
          const newUser = {
            id: Date.now(),
            email: formData.email,
            password: formData.password,
            name: formData.name || formData.email.split('@')[0],
            role: 'admin', // First user is admin
            plan: null,
            price: null,
            active: false,
            createdAt: new Date().toISOString()
          };
          const mockToken = btoa(JSON.stringify({ id: newUser.id, email: newUser.email, role: newUser.role }));
          res = { token: mockToken, user: newUser };
        }
      }
      
      // Check if user needs to set password
      if (res.needsPasswordSetup) {
        setNeedsPasswordSetup(true);
        setFormData({ ...formData, email: res.email });
        setError('');
        setLoading(false);
        return;
      }

      // Ensure we have valid user data before proceeding
      if (!res || !res.user) {
        console.error('Invalid response:', res);
        throw new Error('Authentication failed. Please try again.');
      }
      

      // If no token, this might be client-side auth, generate one
      const token = res.token || btoa(JSON.stringify({
        id: res.user.id,
        email: res.user.email,
        role: res.user.role,
        plan: res.user.plan
      }));

      login(token, res.user);

      // Try to sync user data to backend if available
      if (!res.token) {
        // This was client-side auth, try to sync to backend
        setTimeout(async () => {
          const backendAvailable = await isBackendAvailable();
          if (backendAvailable) {
            await syncUserToBackend(res.user);
          }
        }, 1000); // Delay to allow login to complete
      }
      
      // Handle different authentication flows
      if (res.user.needsPasswordSetup) {
        // User needs to set password (cashier added by admin)
        setNeedsPasswordSetup(true);
        setFormData({ ...formData, email: res.user.email });
        setError('');
        setLoading(false);
        return;
      }
      
      // Cashiers added by admin go directly to cashier dashboard
      if (res.user.role === 'cashier' && res.user.addedByAdmin) {
        window.location.href = '/cashier';
        return;
      }
      
      // Users without active plan must choose subscription
      if (!res.user.active || !res.user.plan) {
        navigate('/subscription');
      } else if (res.user.role === 'admin') {
        // Admin always goes to admin dashboard
        navigate('/admin');
      } else if (res.user.role === 'cashier') {
        // Cashiers go to cashier dashboard
        navigate('/cashier');
      } else {
        // Fallback for unknown roles
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="card w-full max-w-md shadow-2xl backdrop-blur-sm bg-white/95 border-0 animate-fade-in relative z-10">
        <div className="text-center mb-6 md:mb-8">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mx-auto mb-3 md:mb-4 flex items-center justify-center shadow-lg">
            <span className="text-xl md:text-2xl font-bold text-white">POS</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {isLogin ? 'Welcome Back' : 'Get Started'}
          </h1>
          <p className="text-gray-600 text-xs md:text-sm">{isLogin ? 'Login to your account' : 'Create your account to continue'}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {needsPasswordSetup ? (
            // Password setup for cashiers added by admin
            <>
              <p className="text-sm text-gray-600 text-center mb-4">Welcome! Please set your password to continue.</p>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  placeholder="New Password"
                  className="input pl-10"
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
                  className="input pl-10"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </>
          ) : (
            // Normal signup/login
            <>
              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="input pl-10"
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
                  className="input pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  placeholder="Password"
                  className="input pl-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </>
          )}

          {error && <div className="text-red-600 text-sm text-center">{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary w-full text-base md:text-lg py-2.5 md:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : needsPasswordSetup ? 'Set Password' : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        {!needsPasswordSetup && (
          <div className="text-center mt-6">
            <button onClick={() => setIsLogin(!isLogin)} className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm font-semibold transition-all">
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}