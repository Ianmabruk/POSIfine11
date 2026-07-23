import { motion } from "framer-motion";
import { Twitter, Facebook, Instagram, Linkedin } from "lucide-react";

const footerLinks = {
  Product: ["Features", "Pricing", "Industries", "Integrations"],
  Company: ["About", "Careers", "Press", "Contact"],
  Resources: ["Documentation", "API Reference", "Community", "Blog"],
  Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
};

const socialLinks = [
  { icon: Twitter, label: "Twitter" },
  { icon: Facebook, label: "Facebook" },
  { icon: Instagram, label: "Instagram" },
  { icon: Linkedin, label: "LinkedIn" },
];

export default function PremiumFooter() {
  return (
    <footer className="relative bg-slate-900 border-t border-slate-800 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-primary-900/20 via-transparent to-transparent opacity-80" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-brand-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">POSIFY</span>
            </div>
            <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-xs">
              The modern POS platform trusted by thousands of businesses across Kenya and beyond.
            </p>
            <div className="flex gap-3 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  className="w-10 h-10 rounded-xl border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-primary-500/50 hover:bg-primary-500/10 transition-all"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-white mb-4 text-sm">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-slate-400 hover:text-primary-400 text-sm transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} Posify. All rights reserved.
          </p>
          <div className="flex gap-6">
            {Object.entries(footerLinks.Legal).map((link) => (
              <a key={link} href="#" className="text-slate-500 hover:text-primary-400 text-sm transition-colors">
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
