import { motion, AnimatePresence } from "framer-motion";
import { Play, ArrowRight, Check, Monitor, Tablet, Smartphone, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import PosifyLogo from "../PosifyLogo";
import { lazy } from "react";

const SubscriptionEnterprise = lazy(() => import('../../pages/SubscriptionEnterprise'));

export default function Hero({ onOpenDemo }) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  const prefetchSubscription = useCallback(() => {
    import('../../pages/SubscriptionEnterprise');
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    "Inventory Management",
    "Multi-Store Management",
    "Real-Time Analytics",
    "Secure Cloud-Based Platform",
  ];

  const ProductShowcase = () => (
    <div className="relative w-full max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative lg:col-span-2"
        >
          <div className="relative flex items-center justify-center min-h-[500px]">
            <DesktopMockup />
            <TabletMockup />
            <PhoneMockup />
            <ReceiptPrinter />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full shadow-lg">
            <span className="w-2 h-2 bg-gradient-to-r from-[#2563EB] to-[#F59E0B] rounded-full animate-pulse" />
            <span className="text-slate-700 font-semibold text-sm">Cloud-Powered POS</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-[#2563EB] to-[#F59E0B] bg-clip-text text-transparent">
              Simplify Sales.
            </span>
            <br />
            <span className="text-slate-900">Scale Your Business.</span>
          </h1>

          <p className="text-lg text-slate-600 leading-relaxed">
            Posify is the smart, flexible, and powerful POS solution built to streamline operations,
            delight customers, and grow with your business.
          </p>

          <ul className="space-y-3">
            {features.map((feature, i) => (
              <motion.li
                key={feature}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="flex items-start gap-3"
              >
                <Check className="w-5 h-5 text-[#22C55E] mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">{feature}</span>
              </motion.li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(37, 99, 235, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { prefetchSubscription(); navigate('/choose-subscription'); }}
              className="group px-8 py-4 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2"
            >
              Start 15-Day Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenDemo}
              className="px-8 py-4 bg-white border-2 border-[#2563EB]/30 text-[#2563EB] rounded-2xl font-semibold hover:border-[#2563EB] hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Watch Demo
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );

  const DesktopMockup = () => (
    <motion.div
      className="absolute top-0 left-0 w-64 h-40 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-3 hidden lg:block"
      animate={{ y: [0, -15, 0], rotateY: [0, 5, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="bg-white rounded-lg h-full w-full p-4 overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-success rounded-full" />
          <div className="w-2 h-2 bg-amber-500 rounded-full" />
          <div className="w-2 h-2 bg-slate-300 rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="w-3/4 h-3 bg-slate-200 rounded" />
          <div className="w-1/2 h-3 bg-primary-200 rounded" />
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="h-8 bg-primary-100 rounded" />
            <div className="h-8 bg-amber-100 rounded" />
            <div className="h-8 bg-success/20 rounded" />
          </div>
        </div>
      </div>
    </motion.div>
  );

  const TabletMockup = () => (
    <motion.div
      className="absolute top-20 right-10 w-48 h-64 bg-gradient-to-br from-slate-700 to-slate-800 rounded-3xl shadow-2xl p-2 hidden md:block"
      animate={{ y: [0, 20, 0], rotateX: [0, -5, 0] }}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
    >
      <div className="bg-white rounded-2xl h-full w-full p-3 overflow-hidden">
        <div className="w-full h-2 bg-slate-300 rounded-full mb-3" />
        <div className="space-y-2">
          <div className="w-full h-3 bg-slate-200 rounded" />
          <div className="w-4/5 h-3 bg-primary-200 rounded" />
          <div className="flex items-center gap-2 mt-4">
            <div className="w-8 h-8 bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] rounded-lg" />
            <div className="flex-1 h-3 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    </motion.div>
  );

  const PhoneMockup = () => (
    <motion.div
      className="absolute bottom-0 left-20 w-32 h-64 bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] shadow-2xl p-2"
      animate={{ y: [0, -25, 0], rotate: [0, 3, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="bg-white rounded-[2rem] h-full w-full p-3 overflow-hidden">
        <div className="w-16 h-3 bg-slate-800 rounded-full mx-auto mb-3" />
        <div className="space-y-2">
          <div className="w-full h-2 bg-primary-200 rounded-full" />
          <div className="w-3/4 h-2 bg-success/30 rounded-full" />
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="h-10 bg-primary-50 rounded-lg" />
            <div className="h-10 bg-amber-50 rounded-lg" />
          </div>
        </div>
      </div>
    </motion.div>
  );

  const ReceiptPrinter = () => (
    <motion.div
      className="absolute bottom-10 right-0 w-24 h-32 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl shadow-2xl hidden sm:block"
      animate={{ y: [0, 10, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="bg-slate-100 rounded-lg h-full w-full p-2 relative overflow-hidden">
        <div className="w-full h-2 bg-slate-300 rounded mb-1" />
        <div className="space-y-1">
          <div className="w-full h-1.5 bg-slate-400 rounded" />
          <div className="w-3/4 h-1.5 bg-slate-400 rounded" />
          <div className="w-full h-1.5 bg-slate-400 rounded" />
        </div>
        <motion.div
          className="absolute top-2 right-2 w-8 h-8 bg-white rounded border-2 border-slate-300"
          animate={{ height: ["8px", "30px", "8px"] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
    </motion.div>
  );

  return (
    <section className="relative flex flex-col items-center min-h-screen px-6 md:px-12 lg:px-20 bg-gradient-to-br from-[#FFF8EC] via-white to-[#F8FAFC] overflow-hidden">
      <motion.header
        animate={{
          backgroundColor: scrolled ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.8)",
          backdropFilter: scrolled ? "blur(20px)" : "blur(10px)",
        }}
        className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 lg:px-20 transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto h-20 flex items-center justify-between">
          <PosifyLogo size="md" animated />

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Features</a>
            <a href="#solutions" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Solutions</a>
            <a href="#pricing" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Pricing</a>
            <a href="#modules" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Modules</a>
            <a href="#resources" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Resources</a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/auth/login')}
              className="px-5 py-2.5 rounded-full bg-white/80 border border-slate-200 text-slate-700 font-semibold shadow-sm hover:shadow-md hover:text-[#2563EB] transition-all"
            >
              Log In
            </button>
            <button
              onClick={() => navigate('/choose-subscription')}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </motion.header>

      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#2563EB]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#F59E0B]/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 max-w-7xl w-full mt-32 mb-12"
      >
        <ProductShowcase />
      </motion.div>
    </section>
  );
}