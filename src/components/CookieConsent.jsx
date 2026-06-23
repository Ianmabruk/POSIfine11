import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

const CONSENT_KEY = 'cookieConsent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      setVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6"
        >
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-premium border border-slate-100 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Cookie Preferences</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                We use cookies and local storage to keep you signed in and preserve your data between sessions. By continuing, you agree to our use of cookies.
              </p>
            </div>
            <button
              onClick={acceptCookies}
              className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm whitespace-nowrap"
            >
              <Check className="w-4 h-4" />
              Accept All
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
