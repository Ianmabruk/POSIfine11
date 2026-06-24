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
    <div className={`${sizes[size]} rounded-xl flex items-center justify-center relative overflow-hidden`}>
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <defs>
          <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>
          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
        </defs>
        <path
          d="M20 4a16 16 0 0 1 16 16v16a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V20A16 16 0 0 1 20 4z"
          fill="url(#blueGradient)"
          stroke="none"
        />
        <path
          d="M20 4a16 16 0 0 1 16 16V8a4 4 0 0 0-4-4H20a4 4 0 0 0-4 4v12a4 4 0 0 0 4 4h12"
          fill="url(#orangeGradient)"
          stroke="none"
        />
        <text
          x="20"
          y="26"
          fontSize="18"
          fontWeight="800"
          fill="#0F172A"
          textAnchor="middle"
          fontFamily="Inter, system-ui, sans-serif"
        >
          P
        </text>
      </svg>
    </div>
  );

  if (animated) {
    return (
      <motion.div
        whileHover={{ scale: 1.05, rotate: [0, 5, -5, 0] }}
        transition={{ duration: 0.5 }}
        className={`flex items-center gap-2 ${className}`}
      >
        <LogoIcon />
        <span className={`font-bold text-slate-900 ${textSizes[size]}`}>POSIFY</span>
      </motion.div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoIcon />
      <span className={`font-bold text-slate-900 ${textSizes[size]}`}>POSIFY</span>
    </div>
  );
}