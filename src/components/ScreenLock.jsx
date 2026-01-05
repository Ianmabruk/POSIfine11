import { useState, useEffect } from 'react';
import { Lock, Shield, Eye, EyeOff } from 'lucide-react';
import { settings } from '../services/api';

export default function ScreenLock({ onUnlock, userType = 'user' }) {
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [unlockMethod, setUnlockMethod] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [screenLockPassword, setScreenLockPassword] = useState('2005');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    // Load screen lock password from settings
    const loadSettings = async () => {
      try {
        const settingsData = await settings.get();
        if (settingsData?.screenLockPassword) {
          setScreenLockPassword(settingsData.screenLockPassword);
        }
      } catch (error) {
        console.warn('Failed to load settings, using default password:', error);
        // Keep default password if settings fail to load
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const input = document.getElementById(unlockMethod === 'password' ? 'unlock-password' : 'unlock-pin');
    if (input) input.focus();
  }, [unlockMethod]);

  const handleUnlock = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setError('');

    try {
      if (unlockMethod === 'password') {
        if (password === screenLockPassword) {
          onUnlock();
        } else {
          throw new Error('Incorrect password');
        }
      } else if (unlockMethod === 'pin' && user.pin) {
        if (pin === user.pin) {
          onUnlock();
        } else {
          throw new Error('Incorrect PIN');
        }
      } else {
        throw new Error(`Please enter a valid ${unlockMethod}`);
      }
    } catch (error) {
      setError(error.message || 'Unlock failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (value) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 4);
    setPin(numericValue);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
            userType === 'main_admin' 
              ? 'bg-gradient-to-br from-red-600 to-orange-600'
              : 'bg-gradient-to-br from-blue-600 to-purple-600'
          }`}>
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Screen Locked</h2>
          <p className="text-gray-600">
            {userType === 'main_admin' ? 'Main Admin' : user.name || 'User'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Enter your {unlockMethod} to continue
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-6">
          {userType !== 'main_admin' && user.pin && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Unlock Method</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUnlockMethod('password');
                    setError('');
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    unlockMethod === 'password' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  🔑 Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUnlockMethod('pin');
                    setError('');
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    unlockMethod === 'pin' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  📱 PIN
                </button>
              </div>
            </div>
          )}

          {(unlockMethod === 'password' || userType === 'main_admin') && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="unlock-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          )}

          {unlockMethod === 'pin' && userType !== 'main_admin' && (
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="unlock-pin"
                type="text"
                placeholder="Enter 4-digit PIN"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-2xl tracking-widest"
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                maxLength={4}
                required
              />
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (unlockMethod === 'pin' && pin.length !== 4)}
            className={`w-full py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              userType === 'main_admin'
                ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
            }`}
          >
            {loading ? 'Unlocking...' : 'Unlock Screen'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Screen locked due to inactivity for security
          </p>
        </div>
      </div>
    </div>
  );
}