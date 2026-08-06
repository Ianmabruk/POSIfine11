import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PosifyLogo from "../PosifyLogo";
import { Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const navLinks = [
  { name: "Home", href: "#home" },
  { name: "Features", href: "#features" },
  { name: "Pricing", href: "#pricing" },
  { name: "Industries", href: "#industries" },
  { name: "Testimonials", href: "#testimonials" },
  { name: "Contact", href: "#contact" },
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
        backgroundColor: scrolled ? "rgba(255, 255, 255, 0.85)" : "rgba(255, 255, 255, 0.6)",
        backdropFilter: scrolled ? "blur(20px)" : "blur(12px)",
        borderBottom: scrolled ? "1px solid rgba(226, 232, 240, 0.6)" : "1px solid transparent",
      }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <PosifyLogo size="md" animated />

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors text-sm"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={() => navigate("/auth/login")}
              className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/choose-subscription")}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40"
            >
              Start Free Trial
            </button>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-slate-600"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100"
        >
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block text-slate-600 hover:text-slate-900 font-medium py-2"
              >
                {link.name}
              </a>
            ))}
            <button
              onClick={() => { navigate("/auth/login"); setMobileOpen(false); }}
              className="w-full text-left text-slate-600 hover:text-slate-900 font-medium py-2"
            >
              Login
            </button>
            <button
              onClick={() => { navigate("/choose-subscription"); setMobileOpen(false); }}
              className="w-full px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-sm transition-all"
            >
              Start Free Trial
            </button>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
