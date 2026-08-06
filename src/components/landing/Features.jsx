import { motion } from "framer-motion";
import {
  BarChart3,
  Package,
  Users,
  Shield,
  TrendingUp,
  Smartphone,
  ScanLine,
  WifiOff,
  Building2,
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Sales Management",
    description: "Process transactions quickly with an intuitive interface designed for speed and accuracy.",
    color: "bg-primary-500",
    lightColor: "bg-primary-50",
    textColor: "text-primary-600",
  },
  {
    icon: Package,
    title: "Inventory Tracking",
    description: "Real-time stock monitoring with automatic low-stock alerts and reorder management.",
    color: "bg-orange-500",
    lightColor: "bg-orange-50",
    textColor: "text-orange-600",
  },
  {
    icon: Users,
    title: "Customer Management",
    description: "Build lasting relationships with detailed customer profiles and purchase history.",
    color: "bg-primary-500",
    lightColor: "bg-primary-50",
    textColor: "text-primary-600",
  },
  {
    icon: Shield,
    title: "Staff Management",
    description: "Role-based access control, time tracking, and performance analytics for your team.",
    color: "bg-orange-500",
    lightColor: "bg-orange-50",
    textColor: "text-orange-600",
  },
  {
    icon: TrendingUp,
    title: "Reporting & Analytics",
    description: "Make data-driven decisions with comprehensive sales reports and trend analysis.",
    color: "bg-primary-500",
    lightColor: "bg-primary-50",
    textColor: "text-primary-600",
  },
  {
    icon: Building2,
    title: "Multi-Branch Support",
    description: "Manage multiple locations from a single dashboard with centralized control.",
    color: "bg-orange-500",
    lightColor: "bg-orange-50",
    textColor: "text-orange-600",
  },
  {
    icon: ScanLine,
    title: "Barcode Scanning",
    description: "Fast product lookup with barcode scanner support for seamless checkout.",
    color: "bg-primary-500",
    lightColor: "bg-primary-50",
    textColor: "text-primary-600",
  },
  {
    icon: WifiOff,
    title: "Offline Mode",
    description: "Keep selling even when internet is down. Data syncs automatically when reconnected.",
    color: "bg-orange-500",
    lightColor: "bg-orange-50",
    textColor: "text-orange-600",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            Everything you need to run your business
          </h2>
          <p className="text-lg text-slate-500 leading-relaxed">
            Powerful tools designed to help you manage sales, inventory, customers, and staff
            all in one place.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="group bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300"
            >
              <div className={`w-12 h-12 ${feature.lightColor} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-6 h-6 ${feature.textColor}`} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
