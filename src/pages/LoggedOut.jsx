import { Link } from 'react-router-dom';
import { LogIn, Home } from 'lucide-react';
import SEO from '../components/SEO';

export default function LoggedOut() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <SEO
        title="Logged Out - Posify POS"
        description="You have been securely logged out of your Posify account."
        canonical="https://posifine22.onrender.com/logged-out"
        noindex={true}
      />
      <div className="text-center max-w-md mx-auto">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 border border-green-200 mb-6">
          <LogIn className="w-8 h-8 text-success" />
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-3">You've been logged out</h1>
        <p className="text-slate-500 mb-8 text-sm leading-relaxed">
          Your session has ended securely. Thank you for using POSIFY.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/auth/login"
            className="btn-primary inline-flex items-center justify-center gap-2 text-sm"
          >
            <LogIn size={18} />
            Back to Login
          </Link>
          <Link
            to="/"
            className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
          >
            <Home size={18} />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
