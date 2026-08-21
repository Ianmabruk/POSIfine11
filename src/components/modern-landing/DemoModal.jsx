import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { X, Play, CheckCircle2, UserPlus, Store, Users, ShoppingCart, BarChart3, Send, Package, Building2, Receipt, TrendingUp, FileText, Settings, Mail, Phone, Building } from "lucide-react";

const demoSteps = [
  {
    id: 'signup',
    title: 'Create Account',
    description: 'Enter your business details to get started',
    icon: UserPlus,
    color: 'from-[#2563EB] to-[#3B82F6]',
  },
  {
    id: 'business',
    title: 'Add Business',
    description: 'Configure your business profile and settings',
    icon: Building2,
    color: 'from-[#2563EB] to-[#3B82F6]',
  },
  {
    id: 'branches',
    title: 'Add Branches',
    description: 'Set up multiple locations if needed',
    icon: Store,
    color: 'from-[#F59E0B] to-[#FBBF24]',
  },
  {
    id: 'admins',
    title: 'Add Admins',
    description: 'Create admin users to manage your team',
    icon: Users,
    color: 'from-[#2563EB] to-[#3B82F6]',
  },
  {
    id: 'inventory',
    title: 'Add Inventory',
    description: 'Import or add your products and stock',
    icon: Package,
    color: 'from-[#22C55E] to-[#16A34A]',
  },
  {
    id: 'vendors',
    title: 'Add Vendors',
    description: 'Connect with suppliers and track purchases',
    icon: ShoppingCart,
    color: 'from-[#F59E0B] to-[#FBBF24]',
  },
  {
    id: 'sales',
    title: 'Process Sales',
    description: 'Start selling with the intuitive POS interface',
    icon: Receipt,
    color: 'from-[#2563EB] to-[#3B82F6]',
  },
  {
    id: 'reports',
    title: 'Generate Reports',
    description: 'Get insights with real-time analytics',
    icon: BarChart3,
    color: 'from-[#22C55E] to-[#16A34A]',
  },
];

export default function DemoModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Watch Demo</h2>
                  <p className="text-sm text-slate-500 mt-1">See how Posify transforms your business in minutes</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="p-6 overflow-y-auto">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {demoSteps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg transition-all cursor-pointer group"
                      >
                        <div className={`w-12 h-12 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-bold text-slate-900 mb-1">{step.title}</h3>
                        <p className="text-sm text-slate-500">{step.description}</p>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <div className="aspect-video bg-white rounded-xl border border-slate-200 flex items-center justify-center">
                    <div className="text-center">
                      <Play className="w-16 h-16 text-[#2563EB] mx-auto mb-4" />
                      <p className="text-slate-600 font-medium">Click to play interactive demo</p>
                      <p className="text-sm text-slate-400 mt-2">Step-by-step walkthrough of the entire platform</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-white">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-500">
                    Ready to get started?
                  </div>
                  <button
                    onClick={() => { onClose(); navigate('/choose-subscription'); }}
                    className="px-6 py-3 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                  >
                    Start Free Trial <Play className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}