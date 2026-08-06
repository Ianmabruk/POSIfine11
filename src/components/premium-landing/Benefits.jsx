import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { TrendingUp, Clock, BarChart3, Users } from "lucide-react";

const benefits = [
  {
    icon: TrendingUp,
    title: "Business Growth",
    description: "Scale your operations with confidence using tools designed to support expansion across multiple locations.",
    gradient: "from-accent-500 to-orange-600",
    light: "bg-accent-50",
  },
  {
    icon: Clock,
    title: "Time Saving",
    description: "Automate repetitive tasks and streamline workflows so you can focus on what matters most — growing your business.",
    gradient: "from-sage-500 to-green-600",
    light: "bg-sage-50",
  },
  {
    icon: BarChart3,
    title: "Profit Tracking",
    description: "Monitor margins, expenses, and profitability in real-time with intelligent financial dashboards and reports.",
    gradient: "from-primary-500 to-brand-600",
    light: "bg-primary-50",
  },
  {
    icon: Users,
    title: "Multi-User Access",
    description: "Give your team secure role-based access with granular permissions and complete audit trails.",
    gradient: "from-accent-500 to-orange-600",
    light: "bg-accent-50",
  },
];

function TiltCard({ children, className = "" }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 400, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 400, damping: 30 });

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const centerX = rect.left + width / 2;
    const centerY = rect.top + height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    x.set(mouseX / (width / 2));
    y.set(mouseY / (height / 2));
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", willChange: "transform" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Benefits() {
  return (
    <section id="benefits" className="relative py-24 bg-cream-50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-sage-100/40 via-transparent to-accent-50/30 pointer-events-none" />
      <div className="section-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-accent-50 text-accent-600 font-semibold text-sm rounded-full mb-4">
            Benefits
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            Why businesses choose{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent-600 via-orange-500 to-sage-500">
              Posify
            </span>
          </h2>
          <p className="text-lg text-slate-500 leading-relaxed">
            Built with modern businesses in mind. Experience the advantages that set Posify apart.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <TiltCard>
                  <div className="bg-white rounded-3xl border border-cream-200 p-8 h-full tilt-card cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-cream-300/50">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">
                      {benefit.title}
                    </h3>
                    <p className="text-slate-500 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </TiltCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
