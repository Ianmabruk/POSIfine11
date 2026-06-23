import { useState } from "react";
import { motion } from "framer-motion";
import Hero3D from "./Hero3D";
import Industries from "./Industries";
import CRMFeatures from "./CRMFeatures";
import Pricing from "./Pricing";
import Footer from "./Footer";
import AuthPreview from "./AuthPreview";

export default function LandingEnterprise({ onOpenDemo }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="font-sans bg-white text-slate-900 min-h-screen overflow-x-hidden antialiased">
      <Hero3D onOpenDemo={() => setIsModalOpen(true)} />
      <Industries />
      <CRMFeatures />
      
      {/* Stats Section */}
      <section className="py-20 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '10,000+', label: 'Active Businesses' },
              { value: 'KES 2B+', label: 'Transactions Processed' },
              { value: '99.9%', label: 'Uptime SLA' },
              { value: '50+', label: 'Industry Templates' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-slate-900 mb-1">{stat.value}</div>
                <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Pricing onGetStarted={() => setIsModalOpen(true)} />
      <AuthPreview onOpenDemo={() => setIsModalOpen(true)} />
      <Footer />
    </div>
  );
}
