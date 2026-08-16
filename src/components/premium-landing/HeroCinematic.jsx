import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, ChevronLeft, ChevronRight, BarChart3, Package, Users, Smartphone, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SCENES = [
  {
    id: "dashboard",
    headline: "Run Your Business Smarter.",
    description: "Everything you need to manage sales, inventory, payments and your team — in one powerful POS.",
    cta: "Get Started",
    ctaLink: "/choose-subscription",
    secondaryCta: "Explore POS",
    secondaryLink: "/plans",
    gradient: "from-primary-600 via-brand-600 to-primary-800",
    accent: "accent",
    Icon: BarChart3,
  },
  {
    id: "cashier",
    headline: "Sell Faster.",
    description: "Give your team a faster, simpler checkout experience. Process sales in seconds, not minutes.",
    cta: "Start Free Demo",
    ctaLink: "/choose-subscription",
    secondaryCta: "View Pricing",
    secondaryLink: "/plans",
    gradient: "from-sage-600 to-green-700",
    accent: "sage",
    Icon: Package,
  },
  {
    id: "inventory",
    headline: "Know Your Stock.",
    description: "Track inventory in real time and stay ahead of low-stock products with smart alerts.",
    cta: "Get Started",
    ctaLink: "/choose-subscription",
    secondaryCta: "Learn More",
    secondaryLink: "/plans",
    gradient: "from-brand-600 to-blue-800",
    accent: "brand",
    Icon: Package,
  },
  {
    id: "analytics",
    headline: "See Your Business Clearly.",
    description: "Turn everyday transactions into actionable business insights with powerful analytics.",
    cta: "Start Free Demo",
    ctaLink: "/choose-subscription",
    secondaryCta: "Explore POS",
    secondaryLink: "/plans",
    gradient: "from-accent-500 to-orange-700",
    accent: "accent",
    Icon: TrendingUp,
  },
  {
    id: "mobile",
    headline: "Your Business. Anywhere.",
    description: "Use your POS from your phone, tablet or desktop. Your business never stops, and neither do you.",
    cta: "Get Started",
    ctaLink: "/choose-subscription",
    secondaryCta: "View Pricing",
    secondaryLink: "/plans",
    gradient: "from-primary-600 via-brand-500 to-sage-600",
    accent: "primary",
    Icon: Smartphone,
  },
];

const SCENE_DURATION = 5000;
const TRANSITION_DURATION = 1.2;

export default function HeroCinematic() {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(1);
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!isPaused) {
      timerRef.current = setInterval(() => {
        setDirection(1);
        setCurrentScene((prev) => (prev + 1) % SCENES.length);
      }, SCENE_DURATION);
    }
  }, [isPaused]);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer, isPaused]);

  const goToScene = (index) => {
    setDirection(index > currentScene ? 1 : -1);
    setCurrentScene(index);
    resetTimer();
  };

  const nextScene = () => {
    setDirection(1);
    setCurrentScene((prev) => (prev + 1) % SCENES.length);
    resetTimer();
  };

  const prevScene = () => {
    setDirection(-1);
    setCurrentScene((prev) => (prev - 1 + SCENES.length) % SCENES.length);
    resetTimer();
  };

  const scene = SCENES[currentScene];

  const slideVariants = {
    enter: (dir) => ({
      opacity: 0,
      scale: dir > 0 ? 1.08 : 0.95,
      filter: dir > 0 ? "blur(8px)" : "blur(4px)",
    }),
    center: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
    },
    exit: (dir) => ({
      opacity: 0,
      scale: dir < 0 ? 1.08 : 0.95,
      filter: dir < 0 ? "blur(8px)" : "blur(4px)",
    }),
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-x-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => { setIsPaused(false); resetTimer(); }}
    >
      {/* Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${scene.gradient} transition-all duration-[1200ms]`} />
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center min-h-[70vh]">
          {/* Left: Text Content */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            key={`text-${scene.id}`}
          >
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.08] tracking-tight text-white"
            >
              {scene.headline}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-lg sm:text-xl text-white/80 leading-relaxed max-w-lg"
            >
              {scene.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(scene.ctaLink)}
                className="group px-8 py-4 bg-white text-slate-900 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2 text-lg"
              >
                {scene.cta}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(scene.secondaryLink)}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-lg backdrop-blur-sm"
              >
                {scene.secondaryCta}
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex flex-wrap gap-4 pt-2"
            >
              {["15-Day Free Trial", "No Credit Card Required", "Easy Setup"].map((indicator) => (
                <div key={indicator} className="flex items-center gap-2 text-sm text-white/70">
                  <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <span>{indicator}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Visual */}
          <motion.div
            className="relative hidden lg:block"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={scene.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  duration: TRANSITION_DURATION,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="relative"
              >
                <SceneVisual scene={scene} />
              </motion.div>
            </AnimatePresence>

            {/* Floating Analytics Cards */}
            <FloatingAnalyticsCard
              icon={BarChart3}
              label="Today's Sales"
              value="KES 124,500"
              change="+18.4%"
              position="top-4 right-4"
              delay={0}
            />
            <FloatingAnalyticsCard
              icon={Users}
              label="Active Customers"
              value="1,248"
              change="+12%"
              position="bottom-8 left-0"
              delay={1.5}
            />
            <FloatingAnalyticsCard
              icon={Package}
              label="Inventory Status"
              value="98% In Stock"
              change="Optimal"
              position="top-1/2 -right-4"
              delay={3}
            />
          </motion.div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-8 left-0 right-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Progress Indicators */}
            <div className="hidden sm:flex items-center gap-3">
              {SCENES.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => goToScene(i)}
                  className="group flex items-center gap-2"
                >
                  <div className="relative w-16 h-1 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-white rounded-full"
                      initial={{ scaleX: 0 }}
                      animate={{
                        scaleX: i === currentScene && !isPaused ? 1 : 0,
                      }}
                      transition={{
                        duration: i === currentScene && !isPaused ? SCENE_DURATION / 1000 : 0,
                        ease: "linear",
                      }}
                    />
                  </div>
                  <span className={`text-xs font-medium transition-colors ${i === currentScene ? "text-white" : "text-white/50"}`}>
                    {s.id}
                  </span>
                </button>
              ))}
            </div>

            {/* Mobile dots */}
            <div className="sm:hidden flex items-center gap-2">
              {SCENES.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => goToScene(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === currentScene ? "bg-white w-6" : "bg-white/40"}`}
                />
              ))}
            </div>

            {/* Navigation Arrows */}
            <div className="flex items-center gap-2">
              <button
                onClick={prevScene}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextScene}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SceneVisual({ scene }) {
  const Icon = scene.Icon;

  return (
    <div className="relative mx-auto max-w-lg lg:max-w-xl">
      {/* Main product card */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="glass-card-premium rounded-[1.5rem] p-6 sm:p-8 shadow-2xl border border-white/10 backdrop-blur-xl"
      >
        {/* Window controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-white/20 to-white/10 rounded-lg flex items-center justify-center">
              <Icon className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">Posify {scene.id.charAt(0).toUpperCase() + scene.id.slice(1)}</span>
          </div>
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-white/20 rounded-full" />
            <div className="w-3 h-3 bg-white/20 rounded-full" />
            <div className="w-3 h-3 bg-white/20 rounded-full" />
          </div>
        </div>

        {/* Scene-specific visual content */}
        <SceneContent sceneId={scene.id} />
      </motion.div>
    </div>
  );
}

function SceneContent({ sceneId }) {
  switch (sceneId) {
    case "dashboard":
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {["Sales", "Products", "Customers"].map((item, i) => (
              <div
                key={item}
                className={`rounded-xl p-4 flex flex-col items-center justify-center gap-2 border border-white/10 ${
                  i === 0 ? "bg-white/10" : i === 1 ? "bg-white/5" : "bg-white/5"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white text-xs font-bold">
                  {item[0]}
                </div>
                <span className="text-xs text-white/70 font-medium">{item}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="w-full h-2 bg-white/10 rounded-full" />
            <div className="w-4/5 h-2 bg-white/10 rounded-full" />
            <div className="w-3/5 h-2 bg-white/10 rounded-full" />
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-white border border-white/5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Total Revenue</span>
              <span className="font-bold text-lg text-white">KES 2,450</span>
            </div>
          </div>
        </div>
      );

    case "cashier":
      return (
        <div className="space-y-4">
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-white/60">Current Order</span>
              <span className="text-xs bg-accent-500/20 text-accent-300 px-2 py-1 rounded-full">3 items</span>
            </div>
            <div className="space-y-2">
              {["Product A - KES 500", "Product B - KES 350", "Product C - KES 200"].map((item) => (
                <div key={item} className="flex justify-between text-sm">
                  <span className="text-white/80">{item.split(" - ")[0]}</span>
                  <span className="text-white font-medium">{item.split(" - ")[1]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-sm text-white/60">Total</span>
            <span className="text-xl font-bold text-white">KES 1,050</span>
          </div>
          <button className="w-full py-3 bg-accent-500 hover:bg-accent-600 text-white rounded-xl font-semibold transition-colors">
            Checkout
          </button>
        </div>
      );

    case "inventory":
      return (
        <div className="space-y-3">
          {[
            { name: "Product A", stock: 45, status: "In Stock" },
            { name: "Product B", stock: 8, status: "Low Stock" },
            { name: "Product C", stock: 120, status: "In Stock" },
            { name: "Product D", stock: 3, status: "Low Stock" },
          ].map((item) => (
            <div key={item.name} className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/5">
              <div>
                <p className="text-sm font-medium text-white">{item.name}</p>
                <p className="text-xs text-white/50">Stock: {item.stock}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                item.status === "In Stock" ? "bg-sage-500/20 text-sage-300" : "bg-accent-500/20 text-accent-300"
              }`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      );

    case "analytics":
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <p className="text-xs text-white/50 mb-1">Today's Sales</p>
              <p className="text-2xl font-bold text-white">KES 45K</p>
              <p className="text-xs text-sage-400 mt-1">+12.5%</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <p className="text-xs text-white/50 mb-1">Orders</p>
              <p className="text-2xl font-bold text-white">128</p>
              <p className="text-xs text-sage-400 mt-1">+8.2%</p>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <p className="text-xs text-white/50 mb-3">Weekly Revenue</p>
            <div className="flex items-end gap-2 h-24">
              {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                <div key={i} className="flex-1 bg-gradient-to-t from-primary-500/40 to-primary-500/20 rounded-t-lg" style={{ height: `${height}%` }} />
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <span key={day} className="text-[10px] text-white/40">{day}</span>
              ))}
            </div>
          </div>
        </div>
      );

    case "mobile":
      return (
        <div className="space-y-4">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5 max-w-[200px] mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-brand-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">P</span>
                </div>
                <span className="text-xs font-bold text-white">Posify</span>
              </div>
            </div>
            <div className="space-y-2">
              {["New Sale", "Products", "History"].map((item) => (
                <div key={item} className="bg-white/5 rounded-lg p-3 text-center border border-white/5">
                  <span className="text-xs text-white/70">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex justify-between text-xs">
                <span className="text-white/50">Today</span>
                <span className="text-white font-medium">KES 12,400</span>
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}

function FloatingAnalyticsCard({ icon: Icon, label, value, change, position, delay }) {
  return (
    <motion.div
      animate={{
        y: [0, -10, 0],
      }}
      transition={{
        duration: 5 + delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={`absolute ${position} z-20`}
    >
      <div className="glass-card rounded-2xl p-4 shadow-lg border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-white/60 font-medium leading-tight">{label}</p>
            <p className="text-sm font-bold text-white leading-tight">{value}</p>
            <p className="text-[10px] text-sage-400 font-medium">{change}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
