import { motion } from "framer-motion";
import { Check, Zap, Crown, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PosifyLogo from "../PosifyLogo";

const plans = [
  {
    id: 'starter',
    name: 'STARTER',
    icon: Zap,
    color: 'from-slate-500 to-slate-600',
    price: null,
    description: 'Small businesses. Limited users. Core modules. 15-Day Trial.',
    features: [
      'Single business location',
      'Up to 3 users',
      'Basic inventory management',
      'Sales & orders',
      'Daily reports',
      'Email support',
    ],
  },
  {
    id: 'business',
    name: 'BUSINESS',
    icon: Zap,
    color: 'from-primary-500 to-primary-600',
    price: 'KES 2,499',
    description: 'Growing companies. More users. Multi-branch. Advanced reports. 15-Day Trial.',
    features: [
      'Up to 10 branches',
      'Up to 10 users',
      'Advanced inventory & recipes',
      'Full admin dashboard',
      'CRM & customer profiles',
      'Advanced analytics',
      'Priority support',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'ENTERPRISE',
    icon: Crown,
    color: 'from-amber-500 to-amber-600',
    price: 'KES 4,999',
    description: 'Unlimited users. Unlimited branches. Priority support. Advanced analytics. 15-Day Trial.',
    features: [
      'Unlimited branches',
      'Unlimited users',
      'Multi-location support',
      'Full CRM suite',
      'AI-powered insights',
      'Custom integrations',
      'Dedicated account manager',
      '99.9% uptime SLA',
    ],
  },
  {
    id: 'custom',
    name: 'CUSTOM',
    icon: ChevronRight,
    color: 'from-success to-emerald-600',
    price: null,
    description: 'Specialized workflows for hospitals, schools, manufacturers, and warehouses.',
    features: [
      'Custom business type setup',
      'Specialized modules',
      'Industry-specific features',
      'Custom reporting',
      'Priority support',
      'Custom invoice generation',
    ],
    custom: true,
  },
];

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-24 px-6 md:px-12 lg:px-20 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Start with a 30-day free trial. No credit card required. Cancel anytime.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className={`relative rounded-3xl p-8 transition-all duration-300 flex flex-col ${
                  plan.popular
                    ? "bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 text-white shadow-2xl scale-105"
                    : plan.custom
                    ? "bg-gradient-to-br from-success to-emerald-600 text-white shadow-2xl"
                    : "bg-white shadow-xl hover:shadow-2xl border border-slate-100"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-white text-primary-700 text-xs font-bold rounded-full shadow-lg">
                    MOST POPULAR
                  </div>
                )}

                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4 ${
                  !plan.popular && !plan.custom ? "bg-slate-100" : ""
                }`}>
                  <Icon className={`w-6 h-6 ${plan.popular || plan.custom ? "text-white" : "text-slate-600"}`} />
                </div>

                <h3 className={`text-xl font-bold mb-2 ${
                  plan.popular || plan.custom ? "text-white" : "text-slate-900"
                }`}>
                  {plan.name}
                </h3>

                <p className={`text-sm mb-4 ${
                  plan.popular || plan.custom ? "text-white/80" : "text-slate-500"
                }`}>
                  {plan.description}
                </p>

                {plan.price && (
                  <div className="mb-6">
                    <span className={`text-3xl font-bold ${
                      plan.popular || plan.custom ? "text-white" : "text-slate-900"
                    }`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm ${
                      plan.popular || plan.custom ? "text-white/70" : "text-slate-400"
                    }`}>
                      /month
                    </span>
                  </div>
                )}

                {!plan.price && !plan.custom && (
                  <div className="mb-6 text-center">
                    <span className={`text-3xl font-bold ${
                      plan.popular || plan.custom ? "text-white" : "text-slate-900"
                    }`}>
                      15-Day Free Trial
                    </span>
                  </div>
                )}

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        plan.popular || plan.custom ? "text-white" : "text-success"
                      }`} />
                      <span className={`text-sm ${
                        plan.popular || plan.custom ? "text-white/90" : "text-slate-600"
                      }`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {plan.custom ? (
                  <button className="w-full py-4 bg-white text-emerald-700 rounded-2xl font-bold hover:shadow-lg transition-all">
                    Request Custom Solution
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/auth/signup')}
                    className={`w-full py-4 rounded-2xl font-bold transition-all ${
                      plan.popular || plan.custom
                        ? "bg-white text-primary-700 hover:shadow-lg"
                        : "bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:shadow-lg"
                    }`}
                  >
                    {plan.popular || plan.custom ? "Get Started" : "Start Free Trial"}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-16"
        >
          <p className="text-slate-500 mb-6">
            Join thousands of businesses already using POSIFY
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-70">
            <span className="text-slate-700 font-semibold">Trusted by 10K+ businesses</span>
            <span className="text-slate-700 font-semibold">4.9/5 rating</span>
            <span className="text-slate-700 font-semibold">99.9% uptime</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}