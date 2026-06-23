import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: 999,
    period: "month",
    description: "Perfect for small shops getting started",
    features: [
      "Single User",
      "Basic Inventory",
      "Sales Tracking",
      "Daily Reports",
      "Email Support",
      "Cashier Dashboard",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    id: "business",
    name: "Business",
    price: 2499,
    period: "month",
    description: "For growing teams that need more power",
    features: [
      "Up to 5 Users",
      "Advanced Inventory",
      "Full Admin Dashboard",
      "CRM & Customer Profiles",
      "Advanced Analytics",
      "Priority Support",
      "Recipe / BOM Builder",
      "Expense Tracking",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 4999,
    period: "month",
    description: "For organizations that need everything",
    features: [
      "Unlimited Users",
      "Multi-Location Support",
      "Full CRM Suite",
      "AI-Powered Analytics",
      "Custom Integrations",
      "Dedicated Account Manager",
      "SLA Guarantee",
      "White-label Options",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function Pricing({ onGetStarted }) {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-12 sm:py-24 px-4 sm:px-6 md:px-12 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-16"
        >
          <span className="inline-block px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-700 mb-4 shadow-sm">
            Simple Pricing
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Start free, scale when ready
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto text-balance">
            Every plan includes a 15-day free trial. No credit card required. Cancel anytime.
          </p>
        </motion.div>

        <div className="grid grid-cols-3 gap-2 sm:gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -6 }}
               className={`relative rounded-2xl p-3 sm:p-6 lg:p-8 transition-all duration-300 ${
                plan.popular
                  ? "bg-white shadow-premium border-2 border-primary-500 scale-[1.02] z-10"
                  : "bg-white shadow-card border border-slate-100 hover:shadow-card-hover"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary-600 text-white text-xs font-bold rounded-full shadow-lg shadow-primary-500/25">
                  MOST POPULAR
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <p className="text-sm text-slate-500">{plan.description}</p>
              </div>

              <div className="mb-8">
                <span className="text-4xl font-bold text-slate-900">KES {plan.price.toLocaleString()}</span>
                <span className="text-slate-500 text-sm font-medium"> /{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-slate-600">
                    <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => onGetStarted ? onGetStarted(plan.id) : navigate('/choose-subscription')}
                className={`w-full py-3.5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  plan.popular
                    ? "bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/25 active:scale-[0.98]"
                    : "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]"
                }`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
