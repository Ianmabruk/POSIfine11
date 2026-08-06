import { motion } from "framer-motion";
import { UserPlus, Settings, ShoppingCart, TrendingUp } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Sign Up",
    description: "Create your account in minutes with our simple onboarding process. No technical skills required.",
  },
  {
    number: "02",
    icon: Settings,
    title: "Set Up",
    description: "Configure your store, add products, and customize your POS settings to match your business needs.",
  },
  {
    number: "03",
    icon: ShoppingCart,
    title: "Start Selling",
    description: "Begin processing sales immediately with our intuitive point-of-sale interface and payment tools.",
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "Grow Business",
    description: "Use powerful analytics and insights to optimize operations and scale your business confidently.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 bg-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-cream-50/50 to-white pointer-events-none" />
      <div className="section-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-accent-50 text-accent-600 font-semibold text-sm rounded-full mb-4">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            Get up and running in{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent-600 via-orange-500 to-sage-500">
              minutes
            </span>
          </h2>
          <p className="text-lg text-slate-500 leading-relaxed">
            Four simple steps to transform your business operations with Posify.
          </p>
        </motion.div>

        <div className="relative">
          <div className="hidden lg:block absolute left-0 right-0 top-[4.5rem] h-1 mx-auto max-w-5xl">
            <div className="relative h-full bg-cream-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent-500 via-orange-500 to-sage-500 rounded-full origin-left"
                style={{ transformOrigin: "left" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  className="relative text-center lg:text-left"
                >
                  <div className="flex flex-col items-center lg:items-start">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="relative z-10 w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-lg shadow-accent-500/10 border border-cream-200 mb-6"
                    >
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-accent-500 to-orange-600 text-white text-xs font-bold rounded-xl flex items-center justify-center shadow-md">
                        {step.number}
                      </div>
                      <Icon className="w-8 h-8 text-accent-600" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-slate-500 leading-relaxed max-w-xs">
                      {step.description}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-[4.5rem] -right-4 w-8 h-8 z-10">
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: index * 0.15 + 0.3 }}
                        className="w-3 h-3 bg-gradient-to-br from-accent-500 to-orange-600 rounded-full mx-auto shadow-md shadow-accent-500/40"
                      />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
