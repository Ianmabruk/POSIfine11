import { useState, useEffect } from 'react';
import { BASE_API_URL } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Check, Crown, Zap, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Subscription() {
  const [selected, setSelected] = useState('ultra');
  const [showDemoForm, setShowDemoForm] = useState(false);
  const [demoData, setDemoData] = useState({ name: '', email: '', company: '' });
  const navigate = useNavigate();
  
  console.log(' Subscription component mounted, navigate available:', typeof navigate);

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 1000,
      icon: Zap,
      color: 'from-[#22c55e] to-[#16a34a]',
      popular: false,
      features: [
        '✓ Admin Dashboard + Cashier POS',
        '✓ Basic Inventory Management',
        '✓ Sales Tracking',
        '✓ Daily/Weekly Reports',
        '✓ Basic Profit/Loss View',
        '✓ Email Support',
        '✓ 1 Cashier Only'
      ]
    },
    {
      id: 'ultra',
      name: 'Ultra',
      price: 2500,
      icon: Crown,
      color: 'from-[#2d4cff] to-[#3b82f6]',
      popular: true,
      features: [
        '✓ Admin Dashboard + Cashier POS',
        '✓ Full Inventory Management',
        '✓ Automatic Stock Deduction',
        '✓ User Management (Unlimited)',
        '✓ Permission Controls',
        '✓ Expense Tracking',
        '✓ Advanced Analytics',
        '✓ Priority Support'
      ]
    }
  ];

  const handleGetStarted = (e) => {
    e?.preventDefault?.();
    console.log('[BUTTON] Get Started clicked, selected plan:', selected);
    
    const plan = plans.find(p => p.id === selected);
    console.log('[BUTTON] Found plan:', plan);
    
    if (!plan) {
      console.error('[BUTTON] Plan not found!');
      alert('Please select a plan first');
      return;
    }
    
    try {
      // Store plan data (without icon which can't be serialized)
      const planData = {
        id: plan.id,
        name: plan.name,
        price: plan.price
      };
      
      localStorage.setItem('selectedPlan', JSON.stringify(planData));
      localStorage.setItem('planId', selected);
      console.log('[BUTTON] Stored to localStorage, navigating...');
      
      // All plans go directly to signup
      console.log('[BUTTON] Going to /auth/signup');
      navigate('/auth/signup');
    } catch (error) {
      console.error('[BUTTON] Error:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleDemoRequest = async (e) => {
    e.preventDefault();
    try {
      const API_URL = BASE_API_URL;
      await fetch(`${API_URL}/demo-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demoData)
      });
      alert('Demo request submitted! Admin will review and contact you.');
      setShowDemoForm(false);
      setDemoData({ name: '', email: '', company: '' });
    } catch (error) {
      console.error('Demo request failed:', error);
      alert('Failed to submit demo request. Please try again.');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-white via-[#f5f7fb] to-white py-6 md:py-12 px-4 md:px-6">
      <div className="absolute -top-24 -left-20 w-72 h-72 bg-[#2d4cff]/10 blur-3xl rounded-full" />
      <div className="absolute -bottom-24 -right-20 w-80 h-80 bg-[#22c55e]/10 blur-3xl rounded-full" />
      <div className="max-w-7xl mx-auto relative">
        {/* Header with Logo */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Home</span>
          </button>
          
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-[#2d4cff] via-[#3b82f6] to-[#22c55e] rounded-2xl flex items-center justify-center font-bold text-white text-xl shadow-lg">
              P
            </div>
            <span className="text-2xl font-bold text-[#2d4cff]">
              Posifine
            </span>
          </motion.div>
        </div>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-3xl md:text-5xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-[#2d4cff] via-[#3b82f6] to-[#22c55e] bg-clip-text text-transparent"
          >
            Choose Your Plan
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-slate-600 text-base md:text-lg"
          >
            Pick the perfect plan and unlock your POS potential
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8 md:mb-12 max-w-5xl mx-auto">{plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                onClick={() => setSelected(plan.id)}
                className={`card cursor-pointer transition-all transform ${
                  selected === plan.id 
                    ? 'ring-4 ring-[#2d4cff]/60 shadow-2xl scale-105 bg-gradient-to-br from-[#2d4cff] via-[#3b82f6] to-[#22c55e] text-white' 
                    : 'bg-white/90 backdrop-blur border border-slate-200 hover:shadow-xl hover:scale-102 hover:border-[#2d4cff]'
                } relative`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-[#2d4cff] to-[#22c55e] text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selected === plan.id ? 'from-white/20 to-white/10' : plan.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className={`text-lg md:text-xl font-bold ${selected === plan.id ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                </div>
                
                <div className="mb-4">
                  <span className="text-2xl md:text-3xl font-bold">KES {plan.price.toLocaleString()}</span>
                  <span className={`text-xs md:text-sm ${selected === plan.id ? 'text-white/80' : 'text-slate-500'}`}>/month</span>
                </div>
                
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs md:text-sm">
                      <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${selected === plan.id ? 'text-[#22c55e]' : 'text-green-600'}`} />
                      <span className={selected === plan.id ? 'text-white' : 'text-slate-700'}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col md:flex-row gap-4 items-center justify-center mt-8"
        >
          <motion.button 
            type="button"
            onClick={handleGetStarted}
            whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(107, 76, 59, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer px-8 md:px-12 py-3 md:py-4 text-base md:text-lg font-bold bg-gradient-to-r from-[#2d4cff] via-[#3b82f6] to-[#22c55e] text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all"
          >
            Get Started
          </motion.button>
          <motion.button 
            type="button"
            onClick={() => setShowDemoForm(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer px-8 md:px-12 py-3 md:py-4 text-base md:text-lg font-bold border-2 border-slate-200 bg-white text-slate-700 rounded-2xl hover:border-[#2d4cff] transition-all"
          >
            Request Free Demo
          </motion.button>
        </motion.div>
        <p className="text-xs md:text-sm text-slate-500 mt-4 text-center">Secure payment • Cancel anytime</p>

        {/* Demo Request Modal */}
        {showDemoForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 text-white rounded-t-2xl">
                <h2 className="text-2xl font-bold">Request Free Demo</h2>
                <p className="text-green-100 text-sm mt-1">We'll contact you to schedule a demo</p>
              </div>
              <form onSubmit={handleDemoRequest} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    value={demoData.name}
                    onChange={(e) => setDemoData({ ...demoData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email Address</label>
                  <input
                    type="email"
                    value={demoData.email}
                    onChange={(e) => setDemoData({ ...demoData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Company Name</label>
                  <input
                    type="text"
                    value={demoData.company}
                    onChange={(e) => setDemoData({ ...demoData, company: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-green-500"
                    placeholder="Optional"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition"
                  >
                    Submit Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDemoForm(false)}
                    className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 pt-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © 2026 Mabrixel Technologies. All rights reserved.
            </p>
            <button 
              onClick={() => navigate('/auth/login')}
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              Already have an account? Login
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
