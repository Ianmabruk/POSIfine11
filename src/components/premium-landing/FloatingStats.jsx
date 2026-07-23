import { motion } from "framer-motion";

const colorMap = {
  primary: { bg: "bg-primary-500", text: "text-white" },
  orange: { bg: "bg-accent-500", text: "text-white" },
  success: { bg: "bg-success-500", text: "text-white" },
};

export default function FloatingStats({ icon: Icon, label, value, color = "primary" }) {
  const colors = colorMap[color] || colorMap.primary;

  return (
    <motion.div
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      className="relative gpu-accelerated"
      style={{ willChange: "transform" }}
    >
      <div className="glass-card rounded-2xl p-4 shadow-lg border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
            <Icon className={`w-5 h-5 ${colors.text}`} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium leading-tight">{label}</p>
            <p className="text-base font-bold text-white leading-tight">{value}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
