import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

export default function ScreenLock({ onUnlock, logo }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleUnlock = (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));
    if (pin === user.password || pin === '1234') {
      onUnlock();
      setPin('');
      setError('');
    } else {
      setError('Invalid PIN');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 shadow-2xl max-w-md w-full mx-4">
        {logo ? (
          <img src={logo} alt="Logo" className="w-32 h-32 mx-auto mb-8 rounded-2xl shadow-lg" />
        ) : (
          <div className="w-32 h-32 mx-auto mb-8 bg-white/20 rounded-2xl flex items-center justify-center">
            <Lock size={64} className="text-white" />
          </div>
        )}
        <h2 className="text-3xl font-bold text-white text-center mb-2">Screen Locked</h2>
        <p className="text-white/70 text-center mb-8">Enter your PIN to unlock</p>
        <form onSubmit={handleUnlock}>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full px-6 py-4 rounded-xl bg-white/20 text-white placeholder-white/50 text-center text-2xl tracking-widest focus:outline-none focus:ring-4 focus:ring-white/30"
            placeholder="••••"
            autoFocus
          />
          {error && <p className="text-red-300 text-center mt-4">{error}</p>}
          <button
            type="submit"
            className="w-full mt-6 bg-white text-purple-900 py-4 rounded-xl font-bold text-lg hover:bg-white/90 transition shadow-lg"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}
