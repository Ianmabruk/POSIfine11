import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PosifyLogo from "../PosifyLogo";

const navLinks = [
  { name: "Home", href: "#home" },
  { name: "Features", href: "#features" },
  { name: "How It Works", href: "#how-it-works" },
  { name: "Pricing", href: "#pricing" },
  { name: "Testimonials", href: "#testimonials" },
  { name: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      animate={{
        backgroundColor: scrolled ? "rgba(253, 251, 247, 0.92)" : "rgba(253, 251, 247, 0)",
        backdropFilter: scrolled ? "blur(18px)" : "blur(0px)",
        borderBottom: scrolled ? "1px solid rgba(0, 0, 0, 0.06)" : "1px solid transparent",
      }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className={`fixed top-0 left-0 right-0 z-50 ${scrolled ? "shadow-sm" : ""}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <motion.div
            whileHover={{ scale: 1.04 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="flex items-center"
          >
            <PosifyLogo size="md" animated />
          </motion.div>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`font-medium transition-colors duration-300 text-sm ${
                  scrolled ? "text-slate-600 hover:text-slate-900" : "text-slate-200 hover:text-white"
                }`}
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={() => navigate("/auth/login")}
              className={`font-medium text-sm transition-colors duration-300 ${
                scrolled ? "text-slate-600 hover:text-slate-900" : "text-slate-200 hover:text-white"
              }`}
            >
              Login
            </button>
            <motion.button
              onClick={() => navigate("/choose-subscription")}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-accent-500 to-orange-600 text-white shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40 transition-all duration-300"
            >
              Start Free Demo
            </motion.button>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`lg:hidden p-2 transition-colors duration-300 ${
              scrolled ? "text-slate-600" : "text-white"
            }`}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {scrolled && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-400/60 to-transparent" />
      )}

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden bg-cream-100/95 backdrop-blur-xl overflow-hidden border-b border-cream-200/60"
          >
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-slate-600 hover:text-slate-900 font-medium py-2 transition-colors duration-300"
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-4 border-t border-cream-300 space-y-3">
                <button
                  onClick={() => { navigate("/auth/login"); setMobileOpen(false); }}
                  className="w-full text-left text-slate-600 hover:text-slate-900 font-medium py-2 transition-colors duration-300"
                >
                  Login
                </button>
                <motion.button
                  onClick={() => { navigate("/choose-subscription"); setMobileOpen(false); }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-5 py-3 text-center font-semibold rounded-xl bg-gradient-to-r from-accent-500 to-orange-600 text-white shadow-lg shadow-accent-500/25"
                >
                  Start Free Demo
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
