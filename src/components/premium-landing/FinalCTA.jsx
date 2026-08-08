import { motion } from "framer-motion";

export default function FinalCTA() {
  return (
    <section className="relative py-16 sm:py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-accent-500/15 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-sage-500/10 rounded-full blur-[100px]" />
      <div className="section-container relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to transform your business?
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed mb-10">
            Join thousands of African businesses already using Posify to streamline operations, delight customers, and grow revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 bg-gradient-to-r from-accent-500 to-orange-600 text-white rounded-2xl font-semibold shadow-xl shadow-accent-500/25 hover:shadow-accent-500/40 transition-all duration-300 flex items-center justify-center gap-2 text-lg"
            >
              Start Free Demo
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-lg backdrop-blur-sm"
            >
              Contact Sales
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
