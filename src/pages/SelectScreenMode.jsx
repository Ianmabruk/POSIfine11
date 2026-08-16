import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Monitor, ArrowRight, Check } from 'lucide-react';

export default function SelectScreenMode() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const handleContinue = () => {
    if (!selected) return;
    localStorage.setItem('screenMode', selected);
    navigate('/auth/signup');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/30 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">How will you use Posify?</h1>
          <p className="text-slate-500 text-base sm:text-lg">Choose your preferred experience. You can change this later in settings.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
          <button
            onClick={() => setSelected('phone')}
            className={`relative rounded-3xl p-6 sm:p-8 text-left transition-all duration-300 border-2 ${
              selected === 'phone'
                ? 'border-primary-500 bg-white/90 shadow-premium scale-[1.02]'
                : 'border-slate-100 bg-white/70 shadow-soft hover:shadow-premium'
            }`}
          >
            {selected === 'phone' && (
              <div className="absolute top-4 right-4 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-brand-500 flex items-center justify-center mb-5 shadow-lg">
              <Smartphone className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Phone</h3>
            <p className="text-sm text-slate-500 leading-relaxed">Optimized mobile POS experience. Touch-friendly interface designed for phones and small screens.</p>
          </button>

          <button
            onClick={() => setSelected('desktop')}
            className={`relative rounded-3xl p-6 sm:p-8 text-left transition-all duration-300 border-2 ${
              selected === 'desktop'
                ? 'border-primary-500 bg-white/90 shadow-premium scale-[1.02]'
                : 'border-slate-100 bg-white/70 shadow-soft hover:shadow-premium'
            }`}
          >
            {selected === 'desktop' && (
              <div className="absolute top-4 right-4 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-success-500 flex items-center justify-center mb-5 shadow-lg">
              <Monitor className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Desktop</h3>
            <p className="text-sm text-slate-500 leading-relaxed">Full desktop POS experience. Advanced features, larger screens, and complete management tools.</p>
          </button>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!selected}
            className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
