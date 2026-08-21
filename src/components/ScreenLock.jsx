import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { settings } from '../services/api';
import { refreshAuthSession } from '../utils/authRefresh';

export default function ScreenLock({ onUnlock, userType = 'user', logo = '' }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resolvedLogo, setResolvedLogo] = useState(logo || '');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsData = await settings.get();
        if (!logo && settingsData?.logo) {
          setResolvedLogo(settingsData.logo);
        }
      } catch (error) {
        console.warn('Failed to load screen lock branding:', error);
      }
    };
    loadSettings();
  }, [logo]);

  useEffect(() => {
    const input = document.getElementById('unlock-pin');
    if (input) input.focus();
  }, []);

  const handleUnlock = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return null;
      }

      const doUnlock = async (authToken) => {
        const response = await fetch(`${import.meta.env.VITE_API_BASE || 'https://posifine22.onrender.com/api'}/auth/unlock-screen`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ pin })
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 429) {
            throw new Error(errorData.message || 'Too many failed attempts. Try again later.');
          } else if (response.status === 401) {
            throw new Error(errorData.message || 'Incorrect PIN');
          } else {
            throw new Error(errorData.message || 'Unlock failed');
          }
        }

        const data = await response.json();
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        return data;
      };

      let data = await doUnlock(token);
      setPin('');
      onUnlock(data);
    } catch (error) {
      if (error.message.includes('Incorrect PIN') || error.message.includes('Token expired')) {
        const refreshed = await refreshAuthSession();
        if (refreshed?.token) {
          try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE || 'https://posifine22.onrender.com/api'}/auth/unlock-screen`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${refreshed.token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ pin })
            });
            if (response.ok) {
              const data = await response.json();
              if (data.token) {
                localStorage.setItem('token', data.token);
              }
              setPin('');
              onUnlock(data);
              return;
            }
          } catch {
            // fall through to error display
          }
        }
      }
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
          {resolvedLogo || user?.business_logo ? (
            <img
              src={resolvedLogo || user?.business_logo}
              alt="Business logo"
              className="w-20 h-20 rounded-3xl mx-auto mb-4 object-cover border border-gray-200 shadow-sm"
            />
          ) : null}
          <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
            userType === 'main_admin' 
              ? 'bg-gradient-to-br from-red-600 to-orange-600'
              : 'bg-gradient-to-br from-blue-600 to-purple-600'
          }`}>
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Screen Locked</h2>
          <div className="flex flex-col items-center gap-2">
            {user?.profile_picture || user?.profilePicture ? (
              <img
                src={user?.profile_picture || user?.profilePicture}
                alt={user.name || 'User'}
                className="w-14 h-14 rounded-full object-cover border border-gray-200"
              />
            ) : null}
            <p className="text-gray-600">
              {userType === 'main_admin' ? 'Main Admin' : user.name || 'User'}
            </p>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Enter your PIN to continue
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-6">
          {/* PIN Input - Only method now (backend validates) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Enter PIN to unlock</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                id="unlock-pin"
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                placeholder="0000"
                maxLength="4"
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-center tracking-widest text-2xl"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">🔒 PIN validated securely on server</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm font-medium">
                {error.includes('Too many') ? '❌ ' : '⚠️ '}
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Verifying...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Unlock Screen
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}