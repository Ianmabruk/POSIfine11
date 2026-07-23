import { motion } from "framer-motion";
import { Package, BarChart3, Smartphone, Users, TrendingUp, Bell } from "lucide-react";

const features = [
  {
    icon: Package,
    title: "Inventory Management",
    description: "Track stock levels in real-time across all locations with automatic reorder alerts and expiry tracking.",
    gradient: "from-primary-500 to-brand-500",
    light: "bg-primary-50",
    iconColor: "text-primary-600",
  },
  {
    icon: BarChart3,
    title: "Sales Tracking",
    description: "Monitor every transaction with detailed sales reports, trends, and performance metrics at a glance.",
    gradient: "from-accent-500 to-accent-600",
    light: "bg-accent-50",
    iconColor: "text-accent-600",
  },
  {
    icon: Smartphone,
    title: "MPESA Integration",
    description: "Seamlessly accept M-PESA payments directly in your POS with automatic reconciliation and receipts.",
    gradient: "from-brand-500 to-brand-600",
    light: "bg-brand-50",
    iconColor: "text-brand-600",
  },
  {
    icon: Users,
    title: "Cashier Management",
    description: "Manage staff roles, permissions, and schedules with built-in time tracking and performance insights.",
    gradient: "from-primary-500 to-brand-500",
    light: "bg-primary-50",
    iconColor: "text-primary-600",
  },
  {
    icon: TrendingUp,
    title: "Reporting & Analytics",
    description: "Make data-driven decisions with comprehensive dashboards showing revenue, profit, and growth trends.",
    gradient: "from-brand-500 to-primary-500",
    light: "bg-brand-50",
    iconColor: "text-brand-600",
  },
  {
    icon: Bell,
    title: "Stock Alerts",
    description: "Never run out of stock with smart low-stock notifications and automated reorder recommendations.",
    gradient: "from-accent-500 to-primary-500",
    light: "bg-accent-50",
    iconColor: "text-accent-600",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative py-24 bg-white overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-primary-200/20 via-brand-200/10 to-accent-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="section-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-primary-50 text-primary-600 font-semibold text-sm rounded-full mb-4">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            Everything you need to{" "}
            <span className="gradient-text">run your business</span>
          </h2>
          <p className="text-lg text-slate-500 leading-relaxed">
            Powerful tools designed to help you manage sales, inventory, customers, and staff all in one place.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group relative glass-card p-8 rounded-3xl border-shimmer hover:shadow-premium transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-slate-500 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
