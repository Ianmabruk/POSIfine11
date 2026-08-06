import { motion } from "framer-motion";
import { BarChart3, TrendingUp, ShoppingCart, Users } from "lucide-react";

export default function DashboardPreview() {
  return (
    <section className="py-24 bg-cream-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-sage-50 text-sage-600 font-semibold text-sm rounded-full mb-4">
            Dashboard
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            Powerful insights at your{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent-600 via-orange-500 to-sage-500">
              fingertips
            </span>
          </h2>
          <p className="text-lg text-slate-500 leading-relaxed">
            Monitor every aspect of your business with our intuitive dashboard.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="relative mx-auto max-w-5xl"
        >
          <div className="bg-slate-900 rounded-3xl p-2 shadow-2xl">
            <div className="bg-slate-800 rounded-[1.8rem] overflow-hidden">
              <div className="bg-cream-50 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">P</span>
                    </div>
                    <span className="font-bold text-slate-900">Dashboard</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-cream-300 rounded-full" />
                    <div className="w-3 h-3 bg-cream-300 rounded-full" />
                    <div className="w-3 h-3 bg-cream-300 rounded-full" />
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Revenue", value: "KES 2.4M", icon: TrendingUp, color: "bg-sage-500" },
                    { label: "Orders", value: "1,284", icon: ShoppingCart, color: "bg-accent-500" },
                    { label: "Customers", value: "892", icon: Users, color: "bg-accent-500" },
                    { label: "Growth", value: "+24%", icon: BarChart3, color: "bg-sage-500" },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 border border-cream-200 shadow-sm">
                      <div className={`w-8 h-8 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
                        <stat.icon className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
                      <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-xl p-5 border border-cream-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-900">Revenue Overview</h4>
                    <span className="text-xs text-slate-400">Last 7 days</span>
                  </div>
                  <div className="flex items-end gap-2 h-32">
                    {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                      <div key={i} className="flex-1 bg-accent-100 rounded-t-lg relative overflow-hidden">
                        <motion.div
                          initial={{ height: 0 }}
                          whileInView={{ height: `${h}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-accent-500 to-orange-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
