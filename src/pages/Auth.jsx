export { default } from './AuthNew';
/* Legacy auth screen (deprecated)
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User } from 'lucide-react';
import { getDashboardRoute, debugRoutingDecision } from '../utils/dashboardRouting';

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
  // Legacy auth screen retained only for backward compatibility.
  // Use AuthNew as the single source of truth.
  export { default } from './AuthNew';
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
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="Email address"
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
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
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
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
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
          <p className="text-sm text-gray-600">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            {' '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setNeedsPasswordSetup(false);
              }}
              className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
*/


