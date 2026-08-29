import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PosifyLogo from "../components/PosifyLogo";
import SEO from "../components/SEO";
import { TrendingUp, Package, BarChart3, Shield, ArrowRight, Menu, X } from "lucide-react";

const stats = [
  { label: "Business Control", value: "Real-time visibility", icon: BarChart3 },
  { label: "Smart Inventory", value: "Know what's selling", icon: Package },
  { label: "Real Profit", value: "Understand your margins", icon: TrendingUp },
  { label: "Secure & Reliable", value: "Enterprise-grade security", icon: Shield },
];

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-slate-950 text-white antialiased overflow-x-hidden">
      <SEO
        title="POSIFY - Run your business beautifully"
        description="Simple, modern POS for African businesses. Inventory, sales, payments, and analytics in one place."
        canonical="https://posifine22.onrender.com/"
      />

      {/* Hero with pyramid background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=1920&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, rgba(4,10,16,0.92) 0%, rgba(4,10,16,0.75) 50%, rgba(4,10,16,0.88) 100%)',
          }}
        />
      </div>

      {/* Floating glass cards */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[15%] right-[5%] w-64 bg-white/8 backdrop-blur-xl border border-white/12 rounded-2xl p-5 shadow-2xl hidden lg:block"
        >
          <p className="text-xs text-white/60 font-medium mb-1">Today's Sales</p>
          <p className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>KSh 84,250</p>
          <p className="text-xs text-green-400 font-medium">+18.4%</p>
        </motion.div>
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[25%] left-[3%] w-56 bg-white/8 backdrop-blur-xl border border-white/12 rounded-2xl p-5 shadow-2xl hidden lg:block"
        >
          <p className="text-xs text-white/60 font-medium mb-1">Inventory</p>
          <p className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>1,284</p>
          <p className="text-xs text-orange-400 font-medium">12 Low Stock</p>
        </motion.div>
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[30%] right-[8%] w-60 bg-white/8 backdrop-blur-xl border border-white/12 rounded-2xl p-5 shadow-2xl hidden lg:block"
        >
          <p className="text-xs text-white/60 font-medium mb-1">Real Profit</p>
          <p className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>KSh 42,800</p>
          <p className="text-xs text-green-400 font-medium">+12.8%</p>
        </motion.div>
        <motion.div
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute bottom-[20%] left-[5%] w-52 bg-white/8 backdrop-blur-xl border border-white/12 rounded-2xl p-5 shadow-2xl hidden lg:block"
        >
          <p className="text-xs text-white/60 font-medium mb-1">Business Health</p>
          <p className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Excellent</p>
          <p className="text-xs text-blue-400 font-medium">All systems optimal</p>
        </motion.div>
      </div>

      {/* Navigation */}
      <header className="relative z-50 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto mt-4">
          <div className="bg-white/8 backdrop-blur-2xl border border-white/12 rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2.5 focus-visible-ring rounded-xl"
            >
              <PosifyLogo size="sm" />
            </button>

            <nav className="hidden md:flex items-center gap-1">
              {['Features', 'Solutions', 'Pricing', 'About'].map((item) => (
                <button
                  key={item}
                  onClick={() => navigate("/choose-subscription")}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {item}
                </button>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => navigate("/auth/login")}
                className="px-5 py-2 rounded-xl text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => { prefetchSubscription(); navigate("/choose-subscription"); }}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-white text-slate-900 hover:bg-white/90 transition-colors shadow-lg"
              >
                Get Started
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white/80 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="md:hidden mt-2 bg-white/10 backdrop-blur-2xl border border-white/12 rounded-2xl p-4 space-y-2"
              >
                {['Features', 'Solutions', 'Pricing', 'About'].map((item) => (
                  <button
                    key={item}
                    onClick={() => { setMobileMenuOpen(false); navigate("/choose-subscription"); }}
                    className="w-full text-left px-4 py-2 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    {item}
                  </button>
                ))}
                <button
                  onClick={() => { setMobileMenuOpen(false); navigate("/auth/login"); }}
                  className="w-full text-left px-4 py-2 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); prefetchSubscription(); navigate("/choose-subscription"); }}
                  className="w-full px-5 py-2.5 rounded-xl text-sm font-semibold bg-white text-slate-900 hover:bg-white/90 transition-colors"
                >
                  Get Started
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Hero Content */}
      <main className="relative z-10 flex items-center justify-center px-4 sm:px-6 min-h-screen">
        <div className="w-full max-w-4xl pt-20 sm:pt-24 pb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-white/60 mb-6 sm:mb-8">
              POS &middot; Inventory &middot; Payments
            </p>

            <h1
              className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.05] mb-6 sm:mb-8"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Run your business.<br />
              <span className="text-white/90">Know where your money goes.</span>
            </h1>

            <p className="text-base sm:text-lg text-white/70 max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed">
              Sales management, inventory control, profit tracking, and cashier management — all in one intelligent platform built for African businesses.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={() => { prefetchSubscription(); navigate("/choose-subscription"); }}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-slate-900 font-semibold hover:bg-white/90 transition-all shadow-2xl flex items-center justify-center gap-2 group"
              >
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate("/auth/login")}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-white/20 text-white font-semibold hover:bg-white/10 transition-colors"
              >
                Explore POSIFY
              </button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 sm:mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6"
          >
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="bg-white/8 backdrop-blur-xl border border-white/12 rounded-2xl p-5 sm:p-6 text-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5 text-white/80" />
                  </div>
                  <p
                    className="text-2xl sm:text-3xl font-bold text-white mb-1"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs text-white/50 font-medium uppercase tracking-wider">{stat.label}</p>
                </div>
              );
            })}
          </motion.div>

          {/* Testimonials */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-12 sm:mt-16"
          >
            <div className="bg-white/8 backdrop-blur-xl border border-white/12 rounded-2xl p-6 sm:p-8 relative overflow-hidden max-w-2xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4 }}
                  className="text-center"
                >
                  <p className="text-sm sm:text-base text-white/80 leading-relaxed mb-4">
                    &ldquo;{testimonials[current].quote}&rdquo;
                  </p>
                  <div>
                    <p className="text-sm font-bold text-white">{testimonials[current].author}</p>
                    <p className="text-xs text-white/50">{testimonials[current].role}</p>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="mt-5 flex items-center justify-center gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/50'
                    }`}
                    aria-label={`Testimonial ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-4 sm:px-6 pb-8 sm:pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/8 backdrop-blur-xl border border-white/12 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col items-center text-center gap-3">
              <PosifyLogo size="sm" />
              <p className="text-xs sm:text-sm text-white/50">
                Built by Mabricksel Technologies
              </p>
              <p className="text-xs text-white/40">
                &copy; 2026 Mabricksel Technologies. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
