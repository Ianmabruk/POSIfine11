import { motion } from "framer-motion";
import { Check, Zap, Crown, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    id: "starter",
    name: "STARTER",
    icon: Zap,
    color: "from-slate-500 to-slate-600",
    bgColor: "bg-slate-50",
    price: null,
    description: "Perfect for small businesses just getting started.",
    features: [
      "Single business location",
      "Up to 3 users",
      "Basic inventory management",
      "Sales & orders",
      "Daily reports",
      "Email support",
    ],
  },
  {
    id: "business",
    name: "BUSINESS",
    icon: Zap,
    color: "from-primary-500 to-primary-600",
    bgColor: "bg-primary-50",
    price: "KES 2,499",
    period: "/month",
    description: "For growing businesses that need more power.",
    features: [
      "Up to 10 branches",
      "Up to 10 users",
      "Advanced inventory & recipes",
      "Full admin dashboard",
      "CRM & customer profiles",
      "Advanced analytics",
      "Priority support",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "ENTERPRISE",
    icon: Crown,
    color: "from-orange-500 to-orange-600",
    bgColor: "bg-orange-50",
    price: "KES 4,999",
    period: "/month",
    description: "For large organizations with advanced needs.",
    features: [
      "Unlimited branches",
      "Unlimited users",
      "Advanced inventory & recipes",
      "Full admin dashboard",
      "CRM & customer profiles",
      "Advanced analytics",
      "Priority support",
      "Custom integrations",
      "Dedicated account manager",
    ],
  },
];

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-primary-50 text-primary-600 font-semibold text-sm rounded-full mb-4">
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-slate-500 leading-relaxed">
            Start with a 15-day free trial. No credit card required. Upgrade when you are ready.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className={`relative rounded-3xl p-8 ${
                plan.popular
                  ? "bg-white border-2 border-primary-500 shadow-xl shadow-primary-500/10 scale-105"
                  : "bg-white border border-slate-100 shadow-sm hover:shadow-xl"
              } transition-all duration-300`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold rounded-full shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className={`w-12 h-12 ${plan.bgColor} rounded-2xl flex items-center justify-center mb-6`}>
                <plan.icon className={`w-6 h-6 bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`} />
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
              <p className="text-slate-500 text-sm mb-6">{plan.description}</p>

              <div className="mb-6">
                {plan.price ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-slate-400 text-sm">{plan.period}</span>
                  </div>
                ) : (
                  <span className="text-4xl font-bold text-slate-900">Free</span>
                )}
              </div>

              <button
                onClick={() => navigate("/choose-subscription")}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  plan.popular
                    ? "bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/25"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Start Free Trial
                <ChevronRight className="w-4 h-4" />
              </button>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
