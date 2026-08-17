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
      <svg viewBox="0 0 40 40" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="12" fill="#111111" />
        <path
          d="M12 10C12 8.34315 13.3431 7 15 7H28C29.6569 7 31 8.34315 31 10V30C31 31.6569 29.6569 33 28 33H15C13.3431 33 12 31.6569 12 30V10Z"
          fill="#111111"
        />
        <path
          d="M15 10C15 8.34315 16.3431 7 18 7H28C29.6569 7 31 8.34315 31 10V15H15V10Z"
          fill="#F1FEC8"
        />
        <path
          d="M15 7V30C15 31.6569 16.3431 33 18 33H12V7H15Z"
          fill="#F1FEC8"
        />
        <circle cx="20" cy="22" r="6" fill="#111111" />
        <circle cx="20" cy="22" r="3.5" fill="#F1FEC8" />
      </svg>
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
        <span className={`font-bold text-slate-900 tracking-tight ${textSizes[size]}`}>Possify</span>
      </motion.div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoIcon />
      <span className={`font-bold text-slate-900 tracking-tight ${textSizes[size]}`}>Possify</span>
    </div>
  );
}