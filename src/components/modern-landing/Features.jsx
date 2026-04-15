import { motion } from "framer-motion";
import { Sparkles, Activity, Shield, TrendingUp, Package, Users, BarChart3 } from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Forecasting",
      description: "GPT-4 powered sales predictions and intelligent business insights that help you plan ahead",
      badge: "NEW",
      gradient: "from-violet-500 to-purple-600"
    },
    {
      icon: Package,
      title: "Intelligent Inventory",
      description: "Track products and stock levels in real-time with smart reorder alerts",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Activity,
      title: "Real-Time Sync",
      description: "Monitor daily and monthly sales across all devices instantly with live updates",
      gradient: "from-emerald-500 to-teal-500"
    },
    {
      icon: BarChart3,
      title: "Smart Analytics",
      description: "Detailed charts, reports, and cost breakdowns with predictive insights",
      gradient: "from-indigo-500 to-blue-500"
    },
    {
      icon: TrendingUp,
      title: "Growth Optimization",
      description: "AI-driven revenue insights and profit margin analysis to boost your business",
      badge: "PRO",
      gradient: "from-orange-500 to-amber-500"
    },
    {
      icon: Shield,
      title: "Bank-Level Security",
      description: "Enterprise-grade encryption, role-based access, and secure authentication",
      gradient: "from-slate-600 to-slate-800"
    },
    {
      icon: Users,
      title: "Staff Performance",
      description: "Automated performance analysis, scoring, and actionable coaching insights",
      gradient: "from-pink-500 to-rose-500"
    }
  ];

  return (
    <section id="features" className="py-24 px-6 md:px-12 lg:px-20 bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-sm font-semibold text-blue-700 mb-4"
          >
            Powerful Features
          </motion.span>
          
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Built with cutting-edge AI technology to give your business the competitive edge
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ 
                y: -8,
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)"
              }}
              className="relative group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100"
            >
              {/* Badge */}
              {feature.badge && (
                <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold rounded-full shadow-sm">
                  {feature.badge}
                </div>
              )}

              {/* Icon */}
              <motion.div
                whileHover={{ rotate: 5, scale: 1.1 }}
                className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}
              >
                <feature.icon className="w-8 h-8 text-white" />
              </motion.div>

              {/* Content */}
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-700 transition-colors">
                {feature.title}
              </h3>
              <p className="text-slate-500 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Gradient Border */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-20"
        >
          {[
            { value: "99.9%", label: "Uptime SLA" },
            { value: "<50ms", label: "Response Time" },
            { value: "10K+", label: "Businesses" },
            { value: "24/7", label: "Support" }
          ].map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-2xl p-6 text-center shadow-lg border border-slate-100"
            >
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-slate-500 font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
