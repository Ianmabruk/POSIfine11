import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import SEO from "../SEO";

const faqs = [
  {
    question: "How much does Posify cost?",
    answer: "Posify offers flexible pricing starting with the Starter plan at KES 1,000/month for small businesses. The Business plan is KES 1,500/month for growing teams. All plans include a 30-day free trial with no credit card required.",
  },
  {
    question: "How does MPESA integration work?",
    answer: "Our MPESA integration allows you to accept M-PESA payments directly in your POS with automatic reconciliation, receipt generation, and daily summaries. Setup takes less than 5 minutes and works seamlessly with your existing M-PESA account.",
  },
  {
    question: "Can I manage multiple cashiers?",
    answer: "Yes, the Starter plan includes 1 cashier, while the Business plan supports multiple cashiers. Admins can create and manage cashiers, and all sales are recorded and visible in the admin dashboard.",
  },
  {
    question: "Does Posify work offline?",
    answer: "Absolutely. Posify is designed for businesses with inconsistent internet. All data is stored locally and automatically syncs with the cloud once your connection is restored. You never miss a sale due to connectivity issues.",
  },
  {
    question: "What kind of support do you offer?",
    answer: "We offer email support for all plans and priority support for Business customers. Our average response time is under 2 hours during business hours.",
  },
  {
    question: "How secure is my business data?",
    answer: "We take security seriously. All data is encrypted in transit and at rest using industry-standard encryption. Our infrastructure is hosted on secure cloud servers with daily automated backups, disaster recovery, and 99.9% uptime SLA.",
  },
  {
    question: "How long is the free trial?",
    answer: "Our free trial lasts for 30 days and gives you full access to your selected plan features. No credit card is required to sign up, and you won't be charged unless you choose to subscribe.",
  },
  {
    question: "Can I customize the POS for my business?",
    answer: "Yes, Posify is highly customizable. You can configure receipts, add custom fields to products, set up role-based permissions, and create custom reports. Custom plan customers also get dedicated support for deeper integrations.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((item) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  return (
    <section id="faq" className="py-16 sm:py-24 bg-cream-50">
      <SEO
        title="Frequently Asked Questions - Posify POS"
        description="Get answers to common questions about Posify POS. Learn about pricing, M-PESA integration, multi-branch support, offline mode, and security."
        canonical="https://posifine22.onrender.com/#faq"
        jsonLd={faqJsonLd}
      />
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-accent-50 text-accent-600 font-semibold text-sm rounded-full mb-4">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-accent-600 via-orange-500 to-sage-500 bg-clip-text text-transparent mb-6">
            Frequently asked questions
          </h2>
          <p className="text-lg text-slate-500 leading-relaxed">
            Everything you need to know about Posify. Can not find the answer you are looking for? Reach out to our support team.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto bg-white rounded-3xl border border-cream-200 divide-y divide-cream-100"
        >
          {faqs.map((faq, index) => (
            <div key={index}>
               <button
                onClick={() => toggle(index)}
                className="w-full flex items-center justify-between py-4 sm:py-5 px-4 sm:px-6 text-left min-h-[44px] transition-colors duration-300 hover:bg-cream-50 focus:outline-none focus-visible-ring rounded-xl"
                aria-expanded={openIndex === index}
              >
                <span className="font-semibold text-slate-900 pr-4">{faq.question}</span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                     <div className="px-4 sm:px-6 pb-4 sm:pb-5 text-slate-500 leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
