import { useMemo } from "react";
import { motion, useSpring } from "framer-motion";
import { ArrowRight, Check, BarChart3, Users, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FloatingStats from "./FloatingStats";
import ProductShowcase from "./ProductShowcase";

const trustIndicators = ["15-Day Free Trial", "No Credit Card Required", "Easy Setup"];

export default function Hero() {
  const navigate = useNavigate();

  const mouseX = useSpring(0, { stiffness: 120, damping: 18 });
  const mouseY = useSpring(0, { stiffness: 120, damping: 18 });

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    mouseX.set((clientX - centerX) / centerX);
    mouseY.set((clientY - centerY) / centerY);
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center pt-20 overflow-x-hidden gpu-accelerated"
      onMouseMove={handleMouseMove}
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1762195954150-5db56b1d3a19?auto=format&fit=crop&w=1920&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-slate-900/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-slate-900/60" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold leading-[1.1] tracking-tight text-white">
              Run Your Business{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent-400 via-orange-300 to-sage-400">
                Smarter
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-200 leading-relaxed max-w-lg">
              Sales, Inventory, Staff, Reports, and Analytics — all in one place.
              Built for the way African businesses actually work.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                onClick={() => navigate("/choose-subscription")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group px-8 py-4 bg-gradient-to-r from-accent-500 to-orange-600 text-white rounded-2xl font-semibold shadow-xl shadow-accent-500/25 hover:shadow-accent-500/40 transition-all duration-300 flex items-center justify-center gap-2 text-lg"
              >
                Start Free Demo
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <motion.button
                onClick={() => navigate("/plans")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-lg backdrop-blur-sm"
              >
                View Pricing
              </motion.button>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              {trustIndicators.map((indicator) => (
                <div key={indicator} className="flex items-center gap-2 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-accent-400" />
                  <span>{indicator}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ x: mouseX, y: mouseY }}
            className="relative hidden lg:block"
          >
            <ProductShowcase />
            <div className="absolute -top-4 right-4">
              <FloatingStats icon={BarChart3} label="Today's sales" value="KES 124,500" color="accent" />
            </div>
            <div className="absolute -bottom-4 left-4">
              <FloatingStats icon={Users} label="Active Customers" value="1,248" color="sage" />
            </div>
            <div className="absolute top-1/2 -right-8">
              <FloatingStats icon={Package} label="Inventory Status" value="98% In Stock" color="primary" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
