import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Play, Check, TrendingUp, Users, ShoppingCart, BarChart3, Smartphone, Tablet, Monitor, Zap } from "lucide-react";

function FloatingCard({ children, className, delay = 0, speed = 6 }) {
  return (
    <motion.div
      animate={{
        y: [0, -16, 0],
        rotateZ: [-1, 1, -1],
      }}
      transition={{
        duration: speed,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Hero3D({ onOpenDemo }) {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-6 md:px-12 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/60 to-white" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-20 left-[10%] w-72 h-72 bg-primary-500/[0.03] rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-[10%] w-96 h-96 bg-orange-500/[0.03] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-12 w-full">
        <div className="grid grid-cols-2 gap-6 lg:gap-8 items-center">
          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-soft mb-8"
            >
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-slate-700">Enterprise-Grade POS Platform</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-6"
            >
              Run Your Entire Business{" "}
              <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                From One Platform
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl text-slate-500 leading-relaxed mb-10 max-w-xl text-balance"
            >
              POSIFY helps businesses manage sales, inventory, CRM, employees, reports, subscriptions, and analytics from anywhere.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 mb-12"
            >
              <button
                onClick={() => navigate('/choose-subscription')}
                className="btn-primary inline-flex items-center justify-center gap-2 text-base px-8 py-4"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-secondary inline-flex items-center justify-center gap-2 text-base px-8 py-4"
              >
                <Play className="w-5 h-5 text-primary-600" />
                Watch Demo
              </button>
            </motion.div>

            {/* Trust */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap items-center gap-6 text-sm text-slate-500"
            >
              {['No credit card required', '15-day free trial', 'Cancel anytime', 'GDPR compliant'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>{item}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

           {/* Right: Floating 3D Dashboard Scene */}
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 1, delay: 0.3 }}
             className="relative h-[400px] sm:h-[500px] lg:h-[600px]"
             style={{ perspective: 1200 }}
           >
            <motion.div
              animate={{ rotateX: [0, 5, 0], rotateY: [0, -5, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-full h-full"
            >
              {/* POS Dashboard */}
              <FloatingCard delay={0} speed={7} className="absolute top-4 left-0 w-[200px] sm:w-[240px] lg:w-[280px] bg-white rounded-2xl shadow-premium border border-slate-100 p-3 sm:p-4 lg:p-5 z-30">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="h-3 w-20 bg-slate-200 rounded mb-2" />
                    <div className="h-2 w-14 bg-slate-100 rounded" />
                  </div>
                  <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                    <Monitor className="w-4 h-4 text-primary-600" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {['Today\'s Sales', 'Orders', 'Customers', 'Revenue'].map((label, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-3">
                      <div className="h-2 w-10 bg-slate-200 rounded mb-2" />
                      <div className="h-5 w-14 bg-primary-100 rounded" />
                      <div className="text-[10px] text-slate-400 mt-1">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 h-16 bg-gradient-to-r from-primary-50 to-primary-100/50 rounded-xl flex items-end p-2 gap-1">
                  {[40,70,45,80,55,90,60,75].map((h,i) => (
                    <div key={i} className="flex-1 bg-primary-500/20 rounded-t" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </FloatingCard>

              {/* CRM Card */}
              <FloatingCard delay={1.5} speed={8} className="absolute top-2 right-0 w-[180px] sm:w-[220px] lg:w-[260px] bg-white rounded-2xl shadow-premium border border-slate-100 p-3 sm:p-4 lg:p-5 z-20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <div className="h-3 w-16 bg-slate-200 rounded mb-1.5" />
                    <div className="h-2 w-12 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="space-y-3">
                  {[{name: 'Grace M.', spent: 'KES 12,400', avatar: 'GM'}, {name: 'John D.', spent: 'KES 8,200', avatar: 'JD'}].map((c, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-600">{c.avatar}</div>
                        <div>
                          <div className="h-2.5 w-14 bg-slate-200 rounded" />
                          <div className="h-1.5 w-10 bg-slate-100 rounded mt-1" />
                        </div>
                      </div>
                      <div className="h-2.5 w-12 bg-slate-200 rounded ml-auto" />
                    </div>
                  ))}
                </div>
              </FloatingCard>

              {/* Inventory / Analytics */}
              <FloatingCard delay={0.8} speed={9} className="absolute bottom-12 left-0 w-[180px] sm:w-[200px] lg:w-[240px] bg-white rounded-2xl shadow-premium border border-slate-100 p-3 sm:p-4 lg:p-5 z-10">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-primary-600" />
                  <div className="h-3 w-20 bg-slate-200 rounded" />
                </div>
                <div className="flex items-end gap-2 h-24">
                  {[35,55,40,70,50,80,65,90,45,60,75,85].map((h,i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-md" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-slate-500">Revenue Trend</div>
                  <div className="text-xs font-semibold text-success flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> +24%
                  </div>
                </div>
              </FloatingCard>

              {/* Mobile App */}
              <FloatingCard delay={2.2} speed={10} className="absolute bottom-8 right-4 w-[100px] sm:w-[120px] lg:w-[140px] bg-white rounded-[2rem] shadow-premium border border-slate-200 p-2 sm:p-2.5 lg:p-3 z-40">
                <div className="bg-slate-50 rounded-[1.5rem] p-2">
                  <div className="h-2 w-12 bg-slate-200 rounded mx-auto mb-3" />
                  <div className="space-y-2">
                    <div className="h-16 bg-white rounded-xl shadow-sm p-2">
                      <div className="h-2 w-10 bg-slate-100 rounded mb-1.5" />
                      <div className="h-6 w-full bg-primary-50 rounded-lg" />
                    </div>
                    <div className="h-16 bg-white rounded-xl shadow-sm p-2">
                      <div className="h-2 w-10 bg-slate-100 rounded mb-1.5" />
                      <div className="h-6 w-full bg-orange-50 rounded-lg" />
                    </div>
                  </div>
                </div>
              </FloatingCard>

              {/* Tablet */}
              <FloatingCard delay={1} speed={11} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140px] sm:w-[180px] lg:w-[200px] bg-white rounded-3xl shadow-premium border border-slate-200 p-3 sm:p-4 z-0 opacity-40 sm:opacity-60 scale-75 sm:scale-90">
                <div className="bg-slate-50 rounded-2xl p-3">
                  <div className="flex gap-2 mb-3">
                    <div className="h-2 w-8 bg-slate-200 rounded" />
                    <div className="h-2 w-8 bg-slate-200 rounded" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-12 bg-white rounded-lg shadow-sm" />
                    <div className="h-12 bg-white rounded-lg shadow-sm" />
                    <div className="h-12 bg-white rounded-lg shadow-sm" />
                    <div className="h-12 bg-white rounded-lg shadow-sm" />
                  </div>
                </div>
              </FloatingCard>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
