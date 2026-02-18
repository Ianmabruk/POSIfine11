import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

export default function MainAdminLanding() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('ownerToken') || localStorage.getItem('mainAdminToken') || localStorage.getItem('token');
    const userStr = localStorage.getItem('ownerUser') || localStorage.getItem('mainAdminUser') || localStorage.getItem('user');

    if (!token || !userStr) {
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      if (userData?.role === 'main_admin') {
        navigate('/main.admin/dashboard', { replace: true });
      }
    } catch (error) {
      // If parsing fails, stay on landing and allow login
    }
  }, [navigate]);

  const handleAccessConsole = () => {
    const token = localStorage.getItem('ownerToken') || localStorage.getItem('mainAdminToken') || localStorage.getItem('token');
    const userStr = localStorage.getItem('ownerUser') || localStorage.getItem('mainAdminUser') || localStorage.getItem('user');

    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr);
        if (userData?.role === 'main_admin') {
          navigate('/main.admin/dashboard');
          return;
        }
      } catch (error) {
        // fall through to login
      }
    }

    navigate('/main.admin/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0a0f] via-[#1a0f1f] to-[#0b0a0f] text-white flex items-center justify-center px-6 py-16">
      <div className="max-w-5xl w-full grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm tracking-wide">
            <Sparkles className="w-4 h-4 text-pink-300" />
            Main.admin Secure Console
          </div>

          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300">main.admin</span>
          </h1>

          <p className="text-lg text-white/70">
            The unified control room for system health, business visibility, and account management.
          </p>

          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-6 py-5">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10" />
            <div className="relative">
              <p className="text-sm uppercase tracking-[0.4em] text-white/60 mb-3">Live Access</p>
              <div className="mainadmin-motion text-3xl md:text-4xl font-semibold">
                <span className="word">Observe</span>
                <span className="word">Secure</span>
                <span className="word">Accelerate</span>
                <span className="word">Scale</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleAccessConsole}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-purple-500/20"
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/auth/login')}
              className="px-6 py-3 rounded-xl border border-white/20 text-white/80 hover:text-white transition"
            >
              Back to POS Login
            </button>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">System Ready</h2>
              <p className="text-sm text-white/60">Real-time insights and secure control.</p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-white/70">
            <div className="flex items-center justify-between">
              <span>Access Mode</span>
              <span className="text-white">Owner / Admin</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Realtime Monitoring</span>
              <span className="text-white">Enabled</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Security Layer</span>
              <span className="text-white">Active</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .mainadmin-motion {
          display: grid;
          gap: 8px;
        }
        .mainadmin-motion .word {
          display: inline-block;
          background: linear-gradient(90deg, #f472b6, #c084fc, #60a5fa);
          -webkit-background-clip: text;
          color: transparent;
          animation: floatWord 6s ease-in-out infinite;
        }
        .mainadmin-motion .word:nth-child(2) {
          animation-delay: 1s;
        }
        .mainadmin-motion .word:nth-child(3) {
          animation-delay: 2s;
        }
        .mainadmin-motion .word:nth-child(4) {
          animation-delay: 3s;
        }
        @keyframes floatWord {
          0% { transform: translateY(0); opacity: 0.7; }
          50% { transform: translateY(-6px); opacity: 1; }
          100% { transform: translateY(0); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
