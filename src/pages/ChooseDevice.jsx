import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Smartphone, Monitor, ArrowRight } from 'lucide-react';
import { useDeviceMode } from '../context/DeviceModeContext';
import SEO from '../components/SEO';

export default function ChooseDevice() {
  const navigate = useNavigate();
  const { setTempDeviceMode } = useDeviceMode();
  const [selected, setSelected] = useState(null);

  const handleContinue = () => {
    if (!selected) return;
    setTempDeviceMode(selected);
    navigate('/auth/signup');
  };

  return (
    <div className="min-h-screen bg-vanilla-200 relative overflow-x-hidden">
      <SEO
        title="Choose Your Device - Possify POS"
        description="Choose whether you'll use Possify on your phone or desktop."
        canonical="https://posifine22.onrender.com/choose-device"
      />

      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
              How will you use Possify?
            </h1>
            <p className="text-slate-500 text-base sm:text-lg">
              Choose your preferred device. You can change this later in settings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected('mobile')}
              className={`relative rounded-3xl p-6 sm:p-8 text-left transition-all duration-300 border ${
                selected === 'mobile'
                  ? 'glass-vanilla-strong border-white/70 shadow-lg'
                  : 'glass-vanilla border-white/40 hover:border-white/60'
              }`}
            >
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-4 ${
                selected === 'mobile' ? 'bg-slate-900' : 'bg-slate-900/80'
              }`}>
                <Smartphone className="w-6 h-6 sm:w-7 sm:h-7 text-vanilla-200" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">Phone</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Optimized for mobile POS. Take orders, manage inventory, and track sales from your phone.
              </p>
              {selected === 'mobile' && (
                <motion.div
                  layoutId="device-selected"
                  className="mt-4 pt-3 border-t border-white/50"
                >
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    Selected
                  </span>
                </motion.div>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected('desktop')}
              className={`relative rounded-3xl p-6 sm:p-8 text-left transition-all duration-300 border ${
                selected === 'desktop'
                  ? 'glass-vanilla-strong border-white/70 shadow-lg'
                  : 'glass-vanilla border-white/40 hover:border-white/60'
              }`}
            >
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-4 ${
                selected === 'desktop' ? 'bg-slate-900' : 'bg-slate-900/80'
              }`}>
                <Monitor className="w-6 h-6 sm:w-7 sm:h-7 text-vanilla-200" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">Desktop</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Full dashboard experience. Advanced analytics, reports, and complete management tools.
              </p>
              {selected === 'desktop' && (
                <motion.div
                  layoutId="device-selected"
                  className="mt-4 pt-3 border-t border-white/50"
                >
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    Selected
                  </span>
                </motion.div>
              )}
            </motion.button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate('/choose-subscription')}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-white/55 text-slate-700 font-semibold hover:bg-white/40 transition-colors"
            >
              Back
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleContinue}
              disabled={!selected}
              className="flex-1 sm:flex-none py-3 rounded-2xl bg-slate-900 text-vanilla-200 font-semibold text-base flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
