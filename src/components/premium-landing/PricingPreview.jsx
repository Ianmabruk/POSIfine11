import { motion } from "framer-motion";
import { Zap, Crown, ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    id: "starter",
    name: "STARTER",
    icon: Zap,
    color: "from-sage-500 to-green-600",
    bgColor: "bg-sage-50",
    price: "KES 999",
    period: "/month",
    description: "Perfect for small businesses just getting started.",
    features: [
      "Single business location",
      "1 Admin, 2 Cashiers",
      "Basic inventory management",
      "Sales & orders",
      "Daily reports",
      "Email support",
      "15-Day Free Trial",
    ],
  },
  {
    id: "business",
    name: "PROFESSIONAL",
    icon: Zap,
    color: "from-accent-500 to-orange-600",
    bgColor: "bg-accent-50",
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
      "15-Day Free Trial",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "ENTERPRISE",
    icon: Crown,
    color: "from-primary-500 to-brand-600",
    bgColor: "bg-primary-50",
    price: "KES 4,999",
    period: "/month",
    description: "For large organizations that need full control.",
    features: [
      "Unlimited branches",
      "Unlimited users",
      "Full POS features",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
      "99.9% SLA",
      "15-Day Free Trial",
    ],
  },
];

export default function PricingPreview() {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="relative py-24 bg-cream-50 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-cream-200/60 via-cream-50 to-cream-50 opacity-70" />
      <div className="section-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-accent-50 text-accent-600 font-semibold text-sm rounded-full mb-4">
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-accent-600 via-orange-500 to-sage-500 bg-clip-text text-transparent mb-6">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-slate-500 leading-relaxed">
            Choose the plan that fits your business. Upgrade or downgrade at any time.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className={`relative ${
                plan.popular
                  ? "rounded-3xl bg-gradient-to-br from-accent-500 to-orange-600 p-[1px]"
                  : ""
              }`}
            >
              <div
                className={`relative rounded-3xl p-8 border transition-all duration-300 ${
                  plan.popular
                    ? "bg-white shadow-xl scale-105 z-10 border-transparent"
                    : "bg-white shadow-md hover:shadow-xl border-cream-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 bg-gradient-to-r from-accent-500 to-orange-600 text-white text-xs font-bold rounded-full shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 bg-gradient-to-br ${plan.color}`}>
                    <plan.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    {plan.price ? (
                      <>
                        <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                        <span className="text-slate-500 text-sm">{plan.period}</span>
                      </>
                    ) : (
                      <span className="text-4xl font-bold text-slate-900">Free</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-2">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-slate-600">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-accent-500 to-orange-600 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate("/choose-subscription")}
                  className={`w-full py-3.5 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                    plan.popular
                      ? "bg-gradient-to-r from-accent-600 to-orange-600 text-white shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40"
                      : "bg-white text-slate-700 border border-cream-300 hover:bg-cream-100 hover:border-accent-300"
                  }`}
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
