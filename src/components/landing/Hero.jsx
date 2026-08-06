import { motion } from "framer-motion";
import { Play, ArrowRight, Check, BarChart3, Users, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Hero() {
  const navigate = useNavigate();

  const trustIndicators = [
    "15-Day Free Trial",
    "No Credit Card Required",
    "Easy Setup",
  ];

  return (
    <section id="home" className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-100 rounded-full">
              <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
              <span className="text-primary-700 font-semibold text-sm">Trusted by 2,000+ businesses</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-slate-900">
              Simplify Sales.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-600">
                Grow Your Business.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-500 leading-relaxed max-w-lg">
              Posify is the modern POS platform that streamlines operations, delights customers,
              and scales with your business across every industry.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate("/choose-subscription")}
                className="group px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-semibold shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all flex items-center justify-center gap-2 text-lg"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate("/choose-subscription")}
                className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 hover:border-primary-300 hover:bg-primary-50 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 text-lg"
              >
                <Play className="w-5 h-5 text-primary-500" />
                Watch Demo
              </button>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              {trustIndicators.map((indicator) => (
                <div key={indicator} className="flex items-center gap-2 text-sm text-slate-500">
                  <Check className="w-4 h-4 text-success-500" />
                  <span>{indicator}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative mx-auto max-w-lg lg:max-w-xl">
              <PosTerminalMockup />

              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 lg:-right-8 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Today&apos;s Sales</p>
                    <p className="text-lg font-bold text-slate-900">KES 124,500</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-4 -left-4 lg:-left-8 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success-50 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-success-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Active Customers</p>
                    <p className="text-lg font-bold text-slate-900">1,248</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute top-1/2 -right-12 lg:-right-16 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Inventory Status</p>
                    <p className="text-lg font-bold text-slate-900">98% In Stock</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function PosTerminalMockup() {
  return (
    <motion.div
      animate={{ y: [0, -15, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className="relative mx-auto"
    >
      <div className="bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl">
        <div className="bg-slate-800 rounded-[2rem] p-1">
          <div className="bg-white rounded-[1.8rem] overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">P</span>
                </div>
                <span className="font-bold text-slate-900 text-sm">Posify POS</span>
              </div>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-300 rounded-full" />
                <div className="w-2 h-2 bg-slate-300 rounded-full" />
                <div className="w-2 h-2 bg-slate-300 rounded-full" />
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="aspect-square bg-primary-50 rounded-xl flex items-center justify-center">
                  <div className="w-6 h-6 bg-primary-200 rounded-md" />
                </div>
                <div className="aspect-square bg-orange-50 rounded-xl flex items-center justify-center">
                  <div className="w-6 h-6 bg-orange-200 rounded-md" />
                </div>
                <div className="aspect-square bg-success-50 rounded-xl flex items-center justify-center">
                  <div className="w-6 h-6 bg-success-200 rounded-md" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-2 bg-slate-100 rounded-full" />
                <div className="w-4/5 h-2 bg-slate-100 rounded-full" />
                <div className="w-3/5 h-2 bg-slate-100 rounded-full" />
              </div>
              <div className="bg-primary-500 rounded-xl p-3 text-white">
                <div className="flex justify-between items-center">
                  <span className="text-xs opacity-80">Total</span>
                  <span className="font-bold text-lg">KES 2,450</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-slate-400">Items</p>
                  <p className="font-bold text-slate-700 text-sm">3</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-slate-400">Qty</p>
                  <p className="font-bold text-slate-700 text-sm">5</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
