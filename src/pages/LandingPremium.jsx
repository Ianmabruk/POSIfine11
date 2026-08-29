import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PosifyLogo from "../components/PosifyLogo";
import SEO from "../components/SEO";
import { TrendingUp, Package, BarChart3, Shield, ArrowRight, Menu, X, Check, Play } from "lucide-react";

const features = [
  {
    icon: Package,
    title: "Inventory Management",
    description: "Track products and stock levels in real-time with smart reorder alerts and batch tracking.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Monitor daily and monthly sales across all devices instantly with live updates and reports.",
  },
  {
    icon: TrendingUp,
    title: "Profit Tracking",
    description: "Understand your margins with detailed cost breakdowns and profit analysis per product.",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description: "Enterprise-grade security, role-based access, and secure cloud-based authentication.",
  },
];

export default function LandingPremium() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const prefetchSubscription = useCallback(() => {
    import('../pages/SubscriptionEnterprise');
  }, []);

  return (
    <div className="min-h-screen bg-vanilla-200 text-slate-900 antialiased overflow-x-hidden">
      <SEO
        title="POSIFY - Run your business beautifully"
        description="Simple, modern POS for African businesses. Inventory, sales, payments, and analytics in one place."
        canonical="https://posifine22.onrender.com/"
      />

      {/* Navigation */}
      <header className="relative z-50 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto mt-4">
          <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2.5 focus-visible-ring rounded-xl"
            >
              <PosifyLogo size="sm" />
            </button>

            <nav className="hidden md:flex items-center gap-1">
              {['Features', 'Pricing', 'About'].map((item) => (
                <button
                  key={item}
                  onClick={() => navigate("/choose-subscription")}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  {item}
                </button>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => navigate("/auth/login")}
                className="px-5 py-2 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => { prefetchSubscription(); navigate("/choose-subscription"); }}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 transition-all shadow-md"
              >
                Get Started
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden mt-2 bg-white/90 backdrop-blur-xl border border-white/60 rounded-2xl p-4 space-y-2 shadow-sm"
            >
              {['Features', 'Pricing', 'About'].map((item) => (
                <button
                  key={item}
                  onClick={() => { setMobileMenuOpen(false); navigate("/choose-subscription"); }}
                  className="w-full text-left px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  {item}
                </button>
              ))}
              <button
                onClick={() => { setMobileMenuOpen(false); navigate("/auth/login"); }}
                className="w-full text-left px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); prefetchSubscription(); navigate("/choose-subscription"); }}
                className="w-full px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 transition-all shadow-md"
              >
                Get Started
              </button>
            </motion.div>
          )}
        </div>
      </header>

      {/* Hero Content */}
      <main className="relative px-4 sm:px-6">
        <div className="max-w-4xl mx-auto pt-12 sm:pt-20 pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-green-700 mb-6 sm:mb-8">
              POS &middot; Inventory &middot; Payments
            </p>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-6 sm:mb-8">
              Run your business.<br />
              <span className="bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">Know where your money goes.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
              Sales management, inventory control, profit tracking, and cashier management — all in one intelligent platform built for African businesses.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={() => { prefetchSubscription(); navigate("/choose-subscription"); }}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-lg flex items-center justify-center gap-2 group"
              >
                Start 15-Day Free Trial
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate("/auth/login")}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl border-2 border-green-200 text-green-700 font-semibold hover:bg-green-50 transition-colors"
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
            {[
              { label: "Business Control", value: "Real-time visibility", icon: BarChart3 },
              { label: "Smart Inventory", value: "Know what's selling", icon: Package },
              { label: "Real Profit", value: "Understand margins", icon: TrendingUp },
              { label: "Secure & Reliable", value: "Enterprise-grade security", icon: Shield },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="bg-white rounded-2xl p-5 sm:p-6 text-center shadow-sm border border-slate-100"
                >
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
                    {stat.value}
                  </p>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{stat.label}</p>
                </div>
              );
            })}
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 sm:mt-24"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Everything You Need to Succeed
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Built to streamline operations, delight customers, and grow with your business.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-16 sm:mt-24"
          >
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-3xl p-8 sm:p-12 text-center shadow-xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Ready to transform your business?
              </h2>
              <p className="text-green-100 mb-8 max-w-xl mx-auto">
                Join thousands of African businesses already using Posify to manage sales, inventory, and profits.
              </p>
              <button
                onClick={() => { prefetchSubscription(); navigate("/choose-subscription"); }}
                className="px-8 py-4 rounded-2xl bg-white text-green-700 font-semibold hover:bg-green-50 transition-all shadow-lg flex items-center justify-center gap-2 mx-auto"
              >
                Start Your Free Trial
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-4 sm:px-6 pb-8 sm:pb-12 mt-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
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
