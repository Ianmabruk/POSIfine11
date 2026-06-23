import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  UserCircle2,
  ShoppingCart,
  FileText,
  Gift,
  Users2,
  BarChart3,
  MessageSquare,
  TrendingUp,
  UserPlus,
  ClipboardList,
  Award,
  Target,
  Mail,
  Phone,
  CalendarCheck,
  Heart,
  ArrowRight,
} from "lucide-react";

const crmFeatures = [
  {
    icon: UserCircle2,
    title: "Customer Profiles",
    desc: "Complete customer profiles with contact info, preferences, and purchase history in one place.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: ShoppingCart,
    title: "Purchase History",
    desc: "Track every transaction, return, and exchange. Understand what each customer truly values.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: FileText,
    title: "Customer Notes",
    desc: "Add private notes, preferences, allergies, and special requests for personalized service.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: Gift,
    title: "Loyalty & Rewards",
    desc: "Automated points systems, tiered rewards, birthday perks, and referral bonuses.",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: Users2,
    title: "Customer Segmentation",
    desc: "Group customers by behavior, spend, frequency, or custom tags for targeted campaigns.",
    color: "text-pink-600",
    bg: "bg-pink-50",
  },
  {
    icon: BarChart3,
    title: "Customer Analytics",
    desc: "LTV, churn risk, RFM scores, and cohort analysis—all visualized in beautiful dashboards.",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
  },
  {
    icon: MessageSquare,
    title: "Communication Logs",
    desc: "All SMS, email, and in-app conversations logged per customer for complete context.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    icon: TrendingUp,
    title: "Retention Metrics",
    desc: "Churn rate, repeat purchase rate, and reactivation campaigns to keep customers coming back.",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  {
    icon: Target,
    title: "Lead Tracking",
    desc: "Pipeline management from inquiry to first purchase with automated follow-up reminders.",
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
  {
    icon: ClipboardList,
    title: "Customer Collections",
    desc: "Track credit accounts, payment due dates, and outstanding balances with dunning automation.",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    icon: CalendarCheck,
    title: "Automated Follow-ups",
    desc: "Birthday greetings, reorder reminders, win-back campaigns, and review requests on autopilot.",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    icon: Award,
    title: "Lifetime Value",
    desc: "Predict future revenue per customer and identify your most valuable relationships.",
    color: "text-fuchsia-600",
    bg: "bg-fuchsia-50",
  },
];

export default function CRMFeatures() {
  const navigate = useNavigate();

  return (
    <section className="py-12 sm:py-24 px-4 sm:px-6 md:px-12 bg-white" id="crm">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-16"
        >
          <span className="inline-block px-4 py-2 bg-primary-50 text-primary-700 border border-primary-100 rounded-full text-sm font-bold mb-4">
            CRM & Customer Intelligence
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Know your customers better than ever
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto text-balance">
            From first greeting to lifelong loyalty—POSIFY gives you the tools to build lasting relationships.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {crmFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.04 }}
              className="group relative bg-white rounded-2xl p-6 border border-slate-100 shadow-soft hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-11 h-11 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-5 h-5 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <button
            onClick={() => navigate('/choose-subscription')}
            className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-base"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="mt-4 text-sm text-slate-400">No credit card required. 15-day free trial.</p>
        </motion.div>
      </div>
    </section>
  );
}


