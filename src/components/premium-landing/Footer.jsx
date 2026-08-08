import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="section-container py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">POSIFY</span>
            </div>
            <p className="text-slate-400 leading-relaxed max-w-md">
              The modern POS platform built for African businesses. Manage sales, inventory, staff, and analytics from one beautifully crafted system.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              {["Features", "Pricing", "Integrations", "Updates"].map((item) => (
                <li key={item}>
                  <a href={`#${item.toLowerCase()}`} className="text-slate-400 hover:text-white transition-colors duration-300 text-sm">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {["About", "Careers", "Contact", "Privacy"].map((item) => (
                <li key={item}>
                  <a href={`#${item.toLowerCase()}`} className="text-slate-400 hover:text-white transition-colors duration-300 text-sm">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">  2025 Posify. All rights reserved.</p>
          <div className="flex gap-6">
            {["Terms", "Privacy", "Cookies"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-slate-500 hover:text-white transition-colors duration-300 text-sm">{item}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
