import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="bg-slate-900 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-xl font-bold text-white">POSIFY</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-6">
              Enterprise-grade POS, CRM, and business management platform. Trusted by over 10,000 businesses worldwide.
            </p>
            <div className="flex gap-3">
              {['Twitter', 'LinkedIn', 'Instagram', 'Facebook'].map((social) => (
                <div key={social} className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs text-slate-400 hover:text-white transition-all cursor-pointer">
                  {social[0]}
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            { title: 'Product', links: ['Features', 'Pricing', 'Integrations', 'Updates'] },
            { title: 'Company', links: ['About', 'Careers', 'Blog', 'Press'] },
            { title: 'Support', links: ['Help Center', 'Contact', 'API Docs', 'Status'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold text-white mb-4 text-sm">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <span className="text-slate-400 hover:text-white text-sm cursor-pointer transition-colors">{link}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} POSIFY. All rights reserved.</p>
          <div className="flex gap-6">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
              <span key={item} className="text-slate-500 hover:text-white text-sm cursor-pointer transition-colors">{item}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
