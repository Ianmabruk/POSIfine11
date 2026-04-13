import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Twitter, Facebook, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Product: [
      { name: "Features", href: "#features" },
      { name: "Advantages", href: "#advantages" },
      { name: "Pricing", href: "#pricing" },
      { name: "Security", href: "#security" },
      { name: "Roadmap", href: "#roadmap" }
    ],
    Company: [
      { name: "About Us", href: "#company" },
      { name: "Careers", href: "#" },
      { name: "Blog", href: "#blogs" },
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
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" }
  ];

  return (
    <footer className="bg-gradient-to-br from-[#6b4c3b] via-[#8b5a2b] to-[#6b4c3b] text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#00ff88] to-[#cd853f] rounded-xl flex items-center justify-center font-bold text-[#6b4c3b] shadow-lg">
                  P
                </div>
                <span className="text-2xl font-bold">PosiFine</span>
              </div>
              <p className="text-white/80 mb-6 leading-relaxed">
                Next-generation POS system powered by AI. Manage your business smarter, faster, and more efficiently.
              </p>
              
              {/* Contact Info */}
              <div id="contact-info" className="space-y-3">
                <div className="flex items-center gap-3 text-white/70 hover:text-white transition-colors">
                  <Mail className="w-5 h-5" />
                  <span className="text-sm">ianmabruk3@gmail.com</span>
                </div>
                <div className="flex items-center gap-3 text-white/70 hover:text-white transition-colors">
                  <Phone className="w-5 h-5" />
                  <span className="text-sm">0115407200</span>
                </div>
                <div className="flex items-center gap-3 text-white/70 hover:text-white transition-colors">
                  <MapPin className="w-5 h-5" />
                  <span className="text-sm">Nairobi, Kenya</span>
                </div>
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
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <h3 className="font-bold text-lg mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-white/70 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mb-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Copyright */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-white/60 text-sm"
          >
            © {currentYear} PosiFine. All rights reserved.
          </motion.p>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center gap-4"
          >
            {socialLinks.map((social) => (
              <motion.a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <social.icon className="w-5 h-5" />
              </motion.a>
            ))}
          </motion.div>
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 pt-8 border-t border-white/10 flex flex-wrap justify-center items-center gap-6 text-white/40 text-sm"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse" />
            <span>256-bit SSL Secure</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse" />
            <span>GDPR Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse" />
            <span>ISO 27001 Certified</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse" />
            <span>SOC 2 Type II</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
