import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Eye, EyeOff } from 'lucide-react';

export default function ScreenLockPin({ isLocked, onUnlock, userPin = '1234', userName, businessLogo }) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeLeft, setBlockTimeLeft] = useState(0);

  // Auto-lock after inactivity
  useEffect(() => {
    if (!isLocked) {
      let inactivityTimer;
      let warningTimer;
      let showWarning = false;

      const resetTimer = () => {
        clearTimeout(inactivityTimer);
        clearTimeout(warningTimer);
        
        // Show warning after 90 seconds of inactivity
        warningTimer = setTimeout(() => {
          if (!showWarning) {
            showWarning = true;
            const shouldLock = confirm('⚠️ Screen will lock in 30 seconds due to inactivity.\n\nClick OK to stay active or Cancel to lock now.');
            if (!shouldLock) {
              window.dispatchEvent(new CustomEvent('lockScreen'));
            } else {
              showWarning = false;
              resetTimer(); // Reset if user chooses to stay active
            }
          }
        }, 90000); // 90 seconds

        // Auto-lock after 2 minutes total
        inactivityTimer = setTimeout(() => {
          console.log('🔒 Auto-locking screen due to inactivity');
          window.dispatchEvent(new CustomEvent('lockScreen'));
        }, 120000); // 2 minutes
      };

      const handleActivity = () => {
        if (!showWarning) {
          resetTimer();
        }
      };

      // Listen for user activity
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      events.forEach(event => {
        document.addEventListener(event, handleActivity, true);
      });

      resetTimer();

      return () => {
        clearTimeout(inactivityTimer);
        clearTimeout(warningTimer);
        events.forEach(event => {
          document.removeEventListener(event, handleActivity, true);
        });
      };
    }
  }, [isLocked]);

  // Handle blocking countdown
  useEffect(() => {
    if (isBlocked && blockTimeLeft > 0) {
      const timer = setTimeout(() => {
        setBlockTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isBlocked && blockTimeLeft === 0) {
      setIsBlocked(false);
      setAttempts(0);
      setError('');
    }
  }, [isBlocked, blockTimeLeft]);

  const handlePinSubmit = async (e) => {
    e.preventDefault();

    if (isBlocked) {
      setError(`Too many attempts. Try again in ${blockTimeLeft} seconds.`);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE || 'https://posifine22.onrender.com/api'}/auth/unlock-screen`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.token) localStorage.setItem('token', data.token);
        setPin('');
        setError('');
        setAttempts(0);
        onUnlock(data);
      } else {
        if (response.status === 429) {
          setIsBlocked(true);
          setBlockTimeLeft(30);
          setError('Too many failed attempts. Blocked for 30 seconds.');
        } else {
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          setPin('');
          if (newAttempts >= 3) {
            setIsBlocked(true);
            setBlockTimeLeft(30);
            setError('Too many failed attempts. Blocked for 30 seconds.');
          } else {
            setError(`Incorrect PIN. ${3 - newAttempts} attempts remaining.`);
          }
        }
      }
    } catch {
      setError('Network error. Please try again.');
    }
  };

  const handlePinChange = (value) => {
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setPin(value);
      if (error && !isBlocked) {
        setError('');
      }
    }
  };

  if (!isLocked) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20" />
        <svg className="w-full h-full">
          <defs>
            <pattern id="lockPattern" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="2" fill="rgba(255,255,255,0.1)" />
              <circle cx="10" cy="10" r="1" fill="rgba(255,255,255,0.05)" />
              <circle cx="50" cy="10" r="1" fill="rgba(255,255,255,0.05)" />
              <circle cx="10" cy="50" r="1" fill="rgba(255,255,255,0.05)" />
              <circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.05)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lockPattern)" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Business Logo */}
        {businessLogo && (
          <div className="text-center mb-8">
            <img 
              src={businessLogo} 
              alt="Business Logo" 
              className="w-24 h-24 mx-auto rounded-2xl shadow-2xl border-4 border-white/20"
            />
          </div>
        )}

        {/* Lock Screen Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Screen Locked</h2>
            <p className="text-slate-300">
              {userName ? `Welcome back, ${userName}` : 'Enter your PIN to continue'}
            </p>
          </div>

          {/* PIN Form */}
          <form onSubmit={handlePinSubmit} className="space-y-6">
            {/* PIN Input */}
            <div className="relative">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Enter 4-digit PIN
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => handlePinChange(e.target.value)}
                  className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white text-center text-2xl font-mono tracking-widest placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••"
                  maxLength={4}
                  disabled={isBlocked}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  disabled={isBlocked}
                >
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm text-center">
                {error}
              </div>
            )}

            {/* Unlock Button */}
            <button
              type="submit"
              disabled={pin.length !== 4 || isBlocked}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isBlocked ? (
                <>
                  <Lock className="w-5 h-5" />
                  Blocked ({blockTimeLeft}s)
                </>
              ) : (
                <>
                  <Unlock className="w-5 h-5" />
                  Unlock Screen
                </>
              )}
            </button>
          </form>

          {/* PIN Hint */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Forgot your PIN? Contact your administrator
            </p>
          </div>

          {/* Security Info */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Secure Session</span>
              </div>
              <div className="flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Auto-lock: 2min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-500">
            Screen locked automatically for security
          </p>
        </div>
      </div>
    </div>
  );
}