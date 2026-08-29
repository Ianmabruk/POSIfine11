import { motion } from "framer-motion";

export default function PosifyLogo({ size = "md", animated = false, className = "" }) {
  const sizes = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const textSizes = {
    xs: "text-lg",
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
  };

  const LogoIcon = () => (
    <div className={`${sizes[size]} rounded-xl flex items-center justify-center relative overflow-hidden bg-vanilla-200`}>
      <img src="/posifine-logo.png" alt="POSIFINE logo" className="w-full h-full object-cover" />
    </div>
  );

  if (animated) {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.3 }}
        className={`flex items-center gap-2 ${className}`}
      >
        <LogoIcon />
        <span className={`font-bold text-slate-900 tracking-tight ${textSizes[size]}`}>PosiFine</span>
      </motion.div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoIcon />
      <span className={`font-bold text-slate-900 tracking-tight ${textSizes[size]}`}>PosiFine</span>
    </div>
  );
}