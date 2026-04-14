import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Twitter, Facebook, Instagram, Linkedin, ArrowRight, Zap } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Product: [
      { name: "Features", href: "#features" },
      { name: "Pricing", href: "#pricing" },
      { name: "Security", href: "#security" },
      { name: "Roadmap", href: "#" }
    ],
    Company: [
      { name: "About Us", href: "#company" },
      { name: "Careers", href: "#" },
      { name: "Blog", href: "#" },
      { name: "Press Kit", href: "#" }
    ],
    Support: [
      { name: "Help Center", href: "#" },
      { name: "Contact", href: "#contact-info" },
      { name: "API Docs", href: "#" },
      { name: "Status", href: "#" }
    ],
    Legal: [
      { name: "Privacy", href: "#" },
      { name: "Terms", href: "#" },
      { name: "Cookie Policy", href: "#" },
      { name: "Licenses", href: "#" }
    ]
  };

  const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter", color: "hover:bg-sky-500/20 hover:text-sky-400" },
    { icon: Facebook, href: "#", label: "Facebook", color: "hover:bg-blue-600/20 hover:text-blue-400" },
    { icon: Instagram, href: "#", label: "Instagram", color: "hover:bg-pink-500/20 hover:text-pink-400" },
    { icon: Linkedin, href: "#", label: "LinkedIn", color: "hover:bg-blue-500/20 hover:text-blue-400" }
  ];

  return (
    <footer className="relative bg-[#0a0a1a] text-white overflow-hidden">
      {/* Ambient glow accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* CTA Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-14 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-[#00ff88]" />
              <span className="text-[#00ff88] text-sm font-semibold uppercase tracking-widest">Ready to get started?</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
              Run your business smarter<br />
              <span className="bg-gradient-to-r from-[#a78bfa] via-[#60a5fa] to-[#34d399] bg-clip-text text-transparent">
                starting today.
              </span>
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <a
              href="/auth/signup"
              className="flex items-center gap-2 bg-gradient-to-r from-[#7c3aed] to-[#2563eb] hover:from-[#6d28d9] hover:to-[#1d4ed8] text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-purple-900/40 hover:shadow-purple-900/60"
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/auth/login"
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-6 py-3 rounded-xl transition-all"
            >
              Sign In
            </a>
          </div>
        </div>
      </motion.div>

      {/* Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10 mb-14">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 bg-gradient-to-br from-[#7c3aed] to-[#2563eb] rounded-2xl flex items-center justify-center font-extrabold text-white shadow-xl shadow-purple-900/40 text-lg">
                  P
                </div>
                <span className="text-2xl font-extrabold tracking-tight">PosiFine</span>
              </div>
              <p className="text-white/50 mb-6 leading-relaxed text-sm max-w-xs">
                Next-generation AI-powered POS system. Manage your business smarter, faster, and more efficiently from any device.
              </p>

              {/* Contact Info */}
              <div id="contact-info" className="space-y-3">
                {[
                  { icon: Mail, text: "ianmabruk3@gmail.com" },
                  { icon: Phone, text: "0115407200" },
                  { icon: MapPin, text: "Nairobi, Kenya" }
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 text-white/40 hover:text-white/80 transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm">{text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links], index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.08 }}
            >
              <h3 className="font-bold text-sm uppercase tracking-widest text-white/30 mb-5">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-white/50 hover:text-white transition-colors text-sm flex items-center gap-1.5 group"
                    >
                      <span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-[#00ff88] transition-colors flex-shrink-0" />
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/5 mb-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-white/30 text-sm"
          >
            © {currentYear} PosiFine. All rights reserved.
          </motion.p>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center gap-2"
          >
            {socialLinks.map((social) => (
              <motion.a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`w-10 h-10 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-white/40 transition-all ${social.color}`}
              >
                <social.icon className="w-4 h-4" />
              </motion.a>
            ))}
          </motion.div>
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 pt-8 border-t border-white/5 flex flex-wrap justify-center items-center gap-8 text-white/20 text-xs"
        >
          {[
            "256-bit SSL Secure",
            "GDPR Compliant",
            "ISO 27001 Certified",
            "SOC 2 Type II"
          ].map(badge => (
            <div key={badge} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-[#00ff88] rounded-full animate-pulse flex-shrink-0" />
              <span>{badge}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </footer>
  );
}

