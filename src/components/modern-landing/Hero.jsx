import { motion, AnimatePresence } from "framer-motion";
import { Play, ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Hero({ onOpenDemo }) {
  const navigate = useNavigate();
  const [currentBusiness, setCurrentBusiness] = useState(0);
  const [demoClicked, setDemoClicked] = useState(false);
  const businesses = ["Clinic", "Bar", "Shop", "Hotel", "Restaurant", "Pharmacy"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBusiness((prev) => (prev + 1) % businesses.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!demoClicked) return;
    const timer = setTimeout(() => setDemoClicked(false), 1200);
    return () => clearTimeout(timer);
  }, [demoClicked]);

  return (
    <section className="relative flex flex-col items-center min-h-screen px-6 md:px-12 lg:px-20 bg-gradient-to-br from-white via-[#f5f7fb] to-white overflow-hidden">
      {/* Logo - Top Left */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-8 left-6 md:left-12 z-50 flex items-center gap-3"
      >
        <div className="w-12 h-12 bg-gradient-to-br from-[#2d4cff] via-[#3b82f6] to-[#22c55e] rounded-2xl flex items-center justify-center font-bold text-white text-2xl shadow-lg transform hover:scale-110 transition-transform">
          P
        </div>
        <span className="text-2xl font-bold text-[#2d4cff]">Posify</span>
      </motion.div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#2d4cff]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#f59e0b]/10 rounded-full blur-3xl" />
      </div>

      {/* Animated Header - Top Center */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute top-24 md:top-32 z-10 text-center w-full px-6"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-[#0f172a] mb-2">
          Streamline Your Business with Posifine
        </h2>
        <div className="flex items-center justify-center gap-2 text-xl md:text-2xl font-semibold">
          <span className="text-slate-600">Perfect for</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={currentBusiness}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-[#22c55e] font-bold min-w-[150px] inline-block"
            >
              {businesses[currentBusiness]}
            </motion.span>
          </AnimatePresence>
        </div>
        <p className="text-slate-500 mt-2 text-lg">We got your back!</p>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="z-10 max-w-4xl text-center mt-48 md:mt-56 mb-12"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full shadow-lg mb-6"
        >
          <span className="w-2 h-2 bg-gradient-to-r from-[#2d4cff] to-[#22c55e] rounded-full animate-pulse" />
          <span className="text-slate-700 font-semibold text-sm">
            AI-Powered POS • GPT-4 Integration
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
        >
          <span className="bg-gradient-to-r from-[#2d4cff] via-[#3b82f6] to-[#22c55e] bg-clip-text text-transparent">
            Streamline Your Business
          </span>
          <br />
          <span className="text-slate-900">with Posifine</span>
        </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0"
          >
            Manage inventory, track sales, and forecast growth effortlessly with{" "}
            <span className="font-semibold text-slate-900">AI-powered insights</span>. 
            Built for modern businesses that demand excellence.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(107, 76, 59, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/choose-subscription')}
              className="group px-8 py-4 bg-gradient-to-r from-[#2d4cff] via-[#3b82f6] to-[#22c55e] text-white rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2"
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={demoClicked ? { scale: [1, 1.08, 1], boxShadow: ["0 0 0 rgba(45, 76, 255, 0)", "0 0 40px rgba(45, 76, 255, 0.35)", "0 0 0 rgba(45, 76, 255, 0)"] } : {}}
              onClick={() => {
                setDemoClicked(true);
                onOpenDemo();
              }}
              className="px-8 py-4 bg-white border-2 border-[#2d4cff]/30 text-[#2d4cff] rounded-2xl font-semibold hover:border-[#2d4cff] hover:bg-[#f5f7fb] transition-all flex items-center justify-center gap-2 group"
            >
              <Play className="w-5 h-5 text-[#2d4cff] group-hover:scale-110 transition-transform" />
              Watch Demo
            </motion.button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-slate-500"
          >
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-[#22c55e]" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-[#22c55e]" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-[#22c55e]" />
              <span>Cancel anytime</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Right: Animated POS Mockup */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10"
        >
          <motion.div
            animate={{
              y: [0, -20, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative"
          >
            {/* Phone Mockup */}
            <div className="relative w-72 md:w-96 mx-auto">
              <div className="bg-gradient-to-br from-[#6b4c3b] to-[#8b5a2b] rounded-[3rem] p-3 shadow-2xl">
                <div className="bg-white rounded-[2.5rem] overflow-hidden">
                  {/* Notch */}
                  <div className="h-8 bg-gradient-to-r from-[#fef8f0] to-[#f5efe6] flex items-center justify-center">
                    <div className="w-32 h-6 bg-[#6b4c3b] rounded-full" />
                  </div>
                  
                  {/* Screen Content - POS Dashboard */}
                  <div className="bg-gradient-to-br from-[#fef8f0] to-[#f5efe6] p-6 h-[600px]">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="w-24 h-6 bg-[#6b4c3b]/20 rounded-lg mb-2" />
                          <div className="w-32 h-4 bg-[#8b5a2b]/10 rounded" />
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-br from-[#cd853f] to-[#8b5a2b] rounded-xl" />
                      </div>

                      {/* Stats Cards */}
                      <div className="grid grid-cols-2 gap-3">
                        {[1, 2, 3, 4].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ scale: [1, 1.02, 1] }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                            className="bg-white rounded-xl p-4 shadow-lg"
                          >
                            <div className="w-16 h-3 bg-[#8b5a2b]/20 rounded mb-2" />
                            <div className="w-20 h-6 bg-gradient-to-r from-[#cd853f] to-[#8b5a2b] rounded" />
                          </motion.div>
                        ))}
                      </div>

                      {/* Chart Area */}
                      <div className="bg-white rounded-xl p-4 shadow-lg">
                        <div className="w-24 h-3 bg-[#6b4c3b]/20 rounded mb-3" />
                        <div className="flex items-end gap-2 h-32">
                          {[60, 80, 40, 90, 70, 85].map((height, i) => (
                            <motion.div
                              key={i}
                              initial={{ height: 0 }}
                              animate={{ height: `${height}%` }}
                              transition={{ duration: 1, delay: 0.8 + i * 0.1 }}
                              className="flex-1 bg-gradient-to-t from-[#8b5a2b] to-[#cd853f] rounded-t-lg"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Stats */}
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-8 -left-8 bg-white rounded-2xl shadow-2xl p-4 border border-[#cd853f]/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#00ff88] to-[#8b5a2b] rounded-lg" />
                  <div>
                    <div className="text-xs text-[#8b5a2b]">Today's Sales</div>
                    <div className="text-xl font-bold text-[#6b4c3b]">$12,450</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{
                  y: [0, 10, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -bottom-8 -right-8 bg-white rounded-2xl shadow-2xl p-4 border border-[#cd853f]/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#cd853f] to-[#8b5a2b] rounded-lg" />
                  <div>
                    <div className="text-xs text-[#8b5a2b]">AI Forecast</div>
                    <div className="text-xl font-bold text-[#6b4c3b]">+23%</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </section>
  );
}
