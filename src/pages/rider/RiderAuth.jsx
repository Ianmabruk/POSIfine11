import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth as authApi, riders } from '../../services/api';

export default function RiderAuth() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const saveRiderSession = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('riderToken', data.token);
    if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await authApi.login({ email, password });
      if (res.user?.role !== 'rider') { setError('This account is not a rider account'); setLoading(false); return; }
      saveRiderSession(res);
      navigate('/rider');
    } catch (err) { setError(err.message || 'Login failed'); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await riders.register({ email, name, password, phone, vehicle_type: 'motorcycle' });
      saveRiderSession({ token: res.token, user: { ...res.user, rider: res.rider } });
      navigate('/rider');
    } catch (err) { setError(err.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-xl">🏍️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{mode === 'login' ? 'Rider Login' : 'Rider Registration'}</h1>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg mb-3">{error}</p>}

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
          {mode === 'register' && (
            <>
              <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)}
                required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              <input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            </>
          )}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium disabled:opacity-60">
            {loading ? 'Please wait...' : (mode === 'login' ? 'Log In' : 'Register')}
          </button>
        </form>

        <div className="text-center mt-5 text-sm">
          {mode === 'login' ? (
            <p>Dont have a rider account? <button onClick={() => setMode('register')} className="text-primary-600 font-medium">Register</button></p>
          ) : (
            <p>Already have an account? <button onClick={() => setMode('login')} className="text-primary-600 font-medium">Log In</button></p>
          )}
        </div>
      </div>
    </div>
  );
}
