import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PosifyLogo from "../components/PosifyLogo";
import SEO from "../components/SEO";

const testimonials = [
  {
    quote: "Possify transformed how we manage our shop. Sales are up and inventory is finally under control.",
    author: "James M.",
    role: "Retail Store Owner",
  },
  {
    quote: "The mobile dashboard is a game changer. I can track everything from my phone while on the go.",
    author: "Grace K.",
    role: "Cafe Manager",
  },
  {
    quote: "Switched from a complicated system to Possify and never looked back. Simple, fast, reliable.",
    author: "David O.",
    role: "Supermarket Operator",
  },
];

export default function LandingPremium() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);

  const prefetchSubscription = useCallback(() => {
    import('../pages/SubscriptionEnterprise');
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-vanilla-200 text-slate-900 antialiased overflow-x-hidden">
      <SEO
        title="POSIFY - Run your business beautifully"
        description="Simple, modern POS for African businesses. Inventory, sales, payments, and analytics in one place."
        canonical="https://posifine22.onrender.com/"
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto mt-4">
          <div className="glass-vanilla rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2.5 focus-visible-ring rounded-xl"
            >
              <PosifyLogo size="sm" />
            </button>

            <nav className="hidden sm:flex items-center gap-1">
              <button
                onClick={() => navigate("/choose-subscription")}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white/40 transition-colors"
              >
                Plans
              </button>
              <button
                onClick={() => navigate("/auth/login")}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white/40 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => { prefetchSubscription(); navigate("/choose-subscription"); }}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-slate-900 text-vanilla-200 hover:bg-slate-800 transition-colors"
              >
                Get Started
              </button>
            </nav>

            <div className="flex sm:hidden items-center gap-2">
              <button
                onClick={() => navigate("/auth/login")}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-white/40 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => { prefetchSubscription(); navigate("/choose-subscription"); }}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-900 text-vanilla-200 hover:bg-slate-800 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-3xl pt-24 sm:pt-28 pb-12">
          <div className="glass-vanilla rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-12 md:p-16 text-center">
            <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-slate-500 mb-4 sm:mb-6">
              POS &middot; Inventory &middot; Payments
            </p>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-4 sm:mb-6">
              Run your business beautifully.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-lg mx-auto mb-8 sm:mb-10 leading-relaxed">
              A minimal, modern point-of-sale platform for African businesses.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={() => { prefetchSubscription(); navigate("/choose-subscription"); }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-900 text-vanilla-200 font-semibold hover:bg-slate-800 transition-colors"
              >
                Get Started
              </button>
              <button
                onClick={() => navigate("/auth/login")}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl border border-white/55 text-slate-700 font-semibold hover:bg-white/40 transition-colors"
              >
                Login
              </button>
            </div>
          </div>

          {/* Testimonials */}
          <div className="mt-8 sm:mt-10">
            <div className="glass-vanilla rounded-2xl p-6 sm:p-8 relative overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4 }}
                  className="text-center"
                >
                    <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-4">
                      "{testimonials[current].quote}"
                    </p>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{testimonials[current].author}</p>
                      <p className="text-xs text-slate-500">{testimonials[current].role}</p>
                    </div>
                </motion.div>
              </AnimatePresence>

              <div className="mt-5 flex items-center justify-center gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === current ? 'w-6 bg-slate-900' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                    }`}
                    aria-label={`Testimonial ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-4 sm:px-6 pb-8 sm:pb-12">
        <div className="max-w-3xl mx-auto">
          <div className="glass-vanilla rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col items-center text-center gap-3">
              <PosifyLogo size="sm" />
              <p className="text-xs sm:text-sm text-slate-500">
                Built by Mabricksel Technologies
              </p>
              <p className="text-xs text-slate-400">
                &copy; 2026 Mabricksel Technologies. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
