import { useMemo } from "react";
import { motion, useSpring } from "framer-motion";
import { Play, ArrowRight, Check, BarChart3, Users, Package } from "lucide-react";
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

  const gradientOrbs = useMemo(
    () => [
      {
        className: "absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary-600/25 rounded-full blur-[100px]",
        style: { willChange: "transform" },
      },
        {
          className: "absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-brand-600/25 rounded-full blur-[100px]",
          style: { willChange: "transform" },
        },
    ],
    []
  );

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-slate-900 gpu-accelerated"
      onMouseMove={handleMouseMove}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {gradientOrbs.map((orb, i) => (
          <div key={i} className={orb.className} style={orb.style} />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/0 via-slate-900/40 to-slate-900 pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm">
              <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
              <span className="text-primary-300 font-semibold text-sm">Trusted by 2,000+ businesses</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-white">
              Simplify Sales.
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 via-primary-300 to-blue-400">
                Grow Your Business.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 leading-relaxed max-w-lg">
              Posify is the modern POS platform that streamlines operations, delights customers,
              and scales with your business across every industry.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                onClick={() => navigate("/choose-subscription")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-semibold shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 flex items-center justify-center gap-2 text-lg"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <motion.button
                onClick={() => navigate("/choose-subscription")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-lg backdrop-blur-sm"
              >
                <Play className="w-5 h-5 text-primary-400" />
                Watch Demo
              </motion.button>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              {trustIndicators.map((indicator) => (
                <div key={indicator} className="flex items-center gap-2 text-sm text-slate-400">
                  <Check className="w-4 h-4 text-primary-400" />
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
              <FloatingStats icon={BarChart3} label="Today's sales" value="KES 124,500" color="primary" />
            </div>
            <div className="absolute -bottom-4 left-4">
              <FloatingStats icon={Users} label="Active Customers" value="1,248" color="orange" />
            </div>
            <div className="absolute top-1/2 -right-8">
              <FloatingStats icon={Package} label="Inventory Status" value="98% In Stock" color="success" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
