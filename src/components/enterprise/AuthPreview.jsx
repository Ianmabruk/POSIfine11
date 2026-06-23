import { motion } from "framer-motion";
import { ArrowRight, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AuthPreview({ onOpenDemo }) {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-6 md:px-12 bg-white" id="demo">
      <div className="max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-slate-50 to-white rounded-[2.5rem] p-8 md:p-14 shadow-soft border border-slate-100">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <span className="inline-block px-4 py-2 bg-primary-50 text-primary-700 border border-primary-100 rounded-full text-sm font-bold mb-6">
                  See it in action
                </span>
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight leading-tight">
                  Ready to transform your business?
                </h2>
                <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                  Join thousands of businesses already using POSIFY to streamline operations, delight customers, and grow revenue.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => navigate('/choose-subscription')}
                    className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-base"
                  >
                    Start Free Trial
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={onOpenDemo}
                    className="btn-secondary inline-flex items-center gap-2 px-8 py-4 text-base"
                  >
                    Watch Demo
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Mini dashboard mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-white rounded-2xl shadow-premium border border-slate-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <div className="flex-1 h-5 bg-slate-50 rounded-md ml-3" />
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {['Revenue', 'Orders', 'Customers'].map((k, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-4">
                      <div className="text-xs text-slate-400 mb-1">{k}</div>
                      <div className="text-lg font-bold text-slate-800">KES {['45.2K','128','89'][i]}</div>
                      <div className="text-xs text-success font-medium mt-1">+{[24,12,8][i]}%</div>
                    </div>
                  ))}
                </div>
                <div className="h-40 bg-gradient-to-br from-primary-50 to-primary-100/30 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-16 h-16 text-primary-300" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}


