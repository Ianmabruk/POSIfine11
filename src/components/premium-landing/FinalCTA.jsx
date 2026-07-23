import { motion } from "framer-motion";
import { ArrowRight, Shield, Clock, Check } from "lucide-react";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function FinalCTA() {
  return (
    <section className="relative py-24 bg-gradient-to-b from-slate-900 to-purple-950 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -left-20 w-[400px] h-[400px] bg-primary-600/20 rounded-full blur-3xl gpu-accelerated"
          style={{ transform: "translateZ(0)" }}
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-orange-600/20 rounded-full blur-3xl gpu-accelerated"
          style={{ transform: "translateZ(0)" }}
        />
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-brand-600/15 rounded-full blur-3xl gpu-accelerated"
          style={{ transform: "translateZ(0)" }}
        />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="section-container relative z-10"
      >
        <div className="max-w-3xl mx-auto text-center mb-12">
          <motion.h2
            variants={itemVariants}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary-400 via-brand-400 to-orange-400 bg-clip-text text-transparent mb-6 leading-tight"
          >
            Ready to transform your business?
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-lg text-slate-400 leading-relaxed"
          >
            Join 2,000+ businesses already using Posify. Start your free trial today and see the difference.
          </motion.p>
        </div>

        <motion.div
          variants={itemVariants}
          className="max-w-xl mx-auto glass-card p-8 sm:p-10 shadow-premium"
        >
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="text-left">
                <label className="block text-sm font-medium text-slate-700 mb-2">Business Name</label>
                <input
                  type="text"
                  placeholder="Enter your business name"
                  className="input"
                />
              </div>
              <div className="text-left">
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+254 700 000 000"
                  className="input"
                />
              </div>
            </div>
            <div className="text-left">
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="input"
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-2xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 flex items-center justify-center gap-2 text-lg"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex flex-wrap justify-center gap-8 mt-12"
        >
          {[
            { icon: Shield, text: "No credit card required" },
            { icon: Clock, text: "15-day free trial" },
            { icon: Check, text: "Setup in 5 minutes" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-slate-400">
              <item.icon className="w-4 h-4 text-primary-400" />
              <span className="text-sm">{item.text}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
