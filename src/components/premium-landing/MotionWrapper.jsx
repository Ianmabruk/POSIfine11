import { motion } from "framer-motion";

const directionVariants = {
  up: { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } },
  down: { hidden: { opacity: 0, y: -30 }, visible: { opacity: 1, y: 0 } },
  left: { hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0 } },
};

export default function MotionWrapper({ children, delay = 0, direction = "up", className = "", once = true, margin = "-100px" }) {
  const variants = directionVariants[direction] || directionVariants.up;

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin }}
      transition={{ duration: 0.6, delay }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
