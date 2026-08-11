import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowLeft, CreditCard, Smartphone, Building2, Globe, Lock, Sparkles, Crown, Zap, ArrowRight, Star } from 'lucide-react';
import api from '../services/apiClient';
import CustomRequestForm from '../components/modern-landing/CustomRequestForm';
import SEO from '../components/SEO';

const plans = [
  {
    id: 'starter',
    name: 'STARTER',
    price: 999,
    icon: Zap,
    gradient: 'from-slate-500 to-slate-600',
    light: 'bg-slate-50',
     description: 'Small businesses. Limited users. Core modules. 30-Day Trial.',
    features: ['Single user access', 'Basic inventory tracking', 'Sales & order management', 'Daily reports & insights', 'Email support', 'Cashier POS dashboard'],
  },
  {
    id: 'business',
    name: 'BUSINESS',
    price: 2499,
    icon: Zap,
    gradient: 'from-primary-500 to-brand-500',
    light: 'bg-primary-50',
     description: 'Growing companies. More users. Multi-branch. Advanced reports. 30-Day Trial.',
    features: ['Up to 10 users', 'Advanced inventory & recipes', 'Full admin dashboard', 'CRM & customer profiles', 'Advanced analytics', 'Priority support', 'Expense tracking', 'Service fees & discounts'],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'ENTERPRISE',
    price: 4999,
    icon: Crown,
    gradient: 'from-accent-500 to-accent-600',
    light: 'bg-accent-50',
     description: 'Unlimited users. Unlimited branches. Priority support. Advanced analytics. 30-Day Trial.',
    features: ['Unlimited users', 'Multi-location support', 'Full CRM suite', 'AI-powered insights', 'Custom integrations', 'Dedicated account manager', '99.9% uptime SLA', 'White-label options'],
  },
  {
    id: 'custom',
    name: 'CUSTOM',
    price: null,
    icon: Sparkles,
    gradient: 'from-brand-500 to-success-500',
    light: 'bg-brand-50',
    description: 'Specialized workflows for hospitals, schools, manufacturers, and warehouses.',
    features: ['Custom business type setup', 'Specialized modules', 'Industry-specific features', 'Custom reporting', 'Priority support', 'Custom invoice generation'],
    custom: true,
  },
];

const paymentMethods = [
  { id: 'visa', name: 'Visa', icon: CreditCard, desc: 'Credit / Debit card' },
  { id: 'mastercard', name: 'Mastercard', icon: CreditCard, desc: 'Credit / Debit card' },
  { id: 'paypal', name: 'PayPal', icon: Globe, desc: 'Pay with PayPal' },
  { id: 'bank', name: 'Bank Transfer', icon: Building2, desc: 'Direct bank transfer' },
];

const stepLabels = ['Select Plan', 'Payment', 'Confirmed'];

export default function SubscriptionEnterprise() {
  const navigate = useNavigate();
  const [step, setStep] = useState('plan');
  const [selectedPlan, setSelectedPlan] = useState('business');
  const [paymentMethod, setPaymentMethod] = useState('visa');
  const [paymentDetails, setPaymentDetails] = useState({ phone: '', cardNumber: '', expiry: '', cvv: '', accountName: '', bankName: '' });
  const [processing, setProcessing] = useState(false);
  const [trialStarted, setTrialStarted] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);

  const selected = plans.find(p => p.id === selectedPlan);

  const handleStartTrial = async () => {
    const planData = { id: selected?.id, name: selected?.name, price: selected?.price };
    localStorage.setItem('selectedPlan', JSON.stringify(planData));
    localStorage.setItem('planId', selectedPlan);
    
    try {
      await api.createTrial(selectedPlan);
      setTrialStarted(true);
      setStep('success');
    } catch (error) {
      console.error('Failed to create trial:', error);
      localStorage.setItem('isTrial', 'true');
      localStorage.setItem('trialEndsAt', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
      setTrialStarted(true);
      setStep('success');
    }
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      await api.createSubscription(selectedPlan, selected?.price);
      localStorage.removeItem('isTrial');
      localStorage.removeItem('trialEndsAt');
      setStep('success');
    } catch (e) {
      alert('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    const storedTrial = localStorage.getItem('isTrial');
    const trialEnd = localStorage.getItem('trialEndsAt');
    if (storedTrial && trialEnd && new Date(trialEnd) < new Date()) {
      localStorage.removeItem('isTrial');
      localStorage.removeItem('trialEndsAt');
    }
  }, []);

  const currentStepIndex = useMemo(() => {
    if (step === 'plan') return 0;
    if (step === 'payment') return 1;
    return 2;
  }, [step]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <SEO
        title="Choose Your Plan - Posify POS Pricing"
        description="Choose the right Posify plan for your business. Starter, Professional, Enterprise, and Custom plans available. 15-day free trial."
        canonical="https://posifine22.onrender.com/choose-subscription"
      />
      {/* Premium abstract gradient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-primary-50/30" />
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-primary-400/10 rounded-full blur-[120px] gpu-accelerated" style={{ transform: 'translateZ(0)' }} />
        <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] bg-brand-400/10 rounded-full blur-[100px] gpu-accelerated" style={{ transform: 'translateZ(0)' }} />
        <div className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] bg-accent-400/8 rounded-full blur-[120px] gpu-accelerated" style={{ transform: 'translateZ(0)' }} />
        <div className="absolute inset-0 bg-dot-pattern opacity-[0.3]" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mt-4 glass-card px-6 py-3.5 flex items-center justify-between gpu-accelerated">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 group focus-visible-ring rounded-xl"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-brand-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-primary-500/20">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-base font-bold text-slate-900 tracking-tight">POSIFY</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="btn-ghost text-sm"
            >
              Back to Home
            </button>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10 pt-28 sm:pt-32 pb-12 sm:pb-16 px-3 sm:px-6">
        <div className="section-container">
          {/* Progress Indicator */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center mb-12 sm:mb-16"
          >
            <div className="glass-card px-6 py-4 sm:px-8 sm:py-5 inline-flex items-center gap-4 sm:gap-6">
              {stepLabels.map((label, i) => {
                const isCompleted = currentStepIndex > i;
                const isCurrent = currentStepIndex === i;
                return (
                  <div key={label} className="flex items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-2.5">
                      <motion.div
                        animate={{
                          scale: isCurrent ? 1.1 : 1,
                          backgroundColor: isCurrent ? '#7B61FF' : isCompleted ? '#22C55E' : '#F1F5F9',
                        }}
                        transition={{ duration: 0.3 }}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 gpu-accelerated ${
                          isCurrent ? 'text-white shadow-lg shadow-primary-500/30' : isCompleted ? 'text-white' : 'text-slate-400'
                        }`}
                        style={{ transform: 'translateZ(0)' }}
                      >
                        {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
                      </motion.div>
                      <span className={`text-xs sm:text-sm font-medium hidden sm:block ${
                        isCurrent ? 'text-slate-900' : isCompleted ? 'text-slate-600' : 'text-slate-400'
                      }`}>
                        {label}
                      </span>
                    </div>
                    {i < 2 && (
                      <motion.div
                        animate={{ backgroundColor: isCompleted ? '#22C55E' : '#E2E8F0' }}
                        transition={{ duration: 0.3 }}
                        className="w-8 sm:w-12 h-0.5 rounded-full flex-shrink-0"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {step === 'plan' && (
              <motion.div
                key="plan"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="gpu-accelerated"
                style={{ transform: 'translateZ(0)' }}
              >
                <div className="text-center mb-10 sm:mb-12">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
                    Choose your plan
                  </h1>
                  <p className="text-slate-500 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
                     Start with a 30-day free trial. No credit card required. Cancel anytime.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6 mb-10 sm:mb-12">
                  {plans.map((plan, index) => {
                    const Icon = plan.icon;
                    const isSelected = selectedPlan === plan.id;
                    return (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
                        whileHover={{ y: -8, transition: { duration: 0.3, ease: 'easeOut' } }}
                        onClick={() => setSelectedPlan(plan.id)}
                        className={`relative rounded-3xl p-6 sm:p-7 cursor-pointer transition-all duration-300 border gpu-accelerated ${
                          isSelected
                            ? 'border-primary-500/50 bg-white/90 scale-[1.02] shadow-premium'
                            : 'border-slate-100/80 bg-white/70 shadow-soft hover:shadow-premium'
                        }`}
                        style={{ transform: 'translateZ(0)' }}
                      >
                        {plan.popular && (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                            className="absolute -top-3 left-1/2 -translate-x-1/2"
                          >
                            <span className="px-4 py-1.5 bg-gradient-to-r from-primary-500 to-brand-500 text-white text-xs font-bold rounded-full shadow-lg animate-gradient">
                              MOST POPULAR
                            </span>
                          </motion.div>
                        )}

                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-5 ${isSelected ? 'shadow-lg shadow-primary-500/30' : 'shadow-md'}`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 mb-1.5 tracking-tight">{plan.name}</h3>
                        <p className="text-sm text-slate-500 mb-5 leading-relaxed line-clamp-2">{plan.description}</p>

                        <div className="mb-5 min-h-[3rem]">
                          {plan.price ? (
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-bold text-slate-900 tracking-tight">KES {plan.price.toLocaleString()}</span>
                              <span className="text-slate-400 text-sm">/month</span>
                            </div>
                           ) : (
                             <span className="text-xl font-bold text-success">30-Day Free Trial</span>
                           )}
                        </div>

                        <ul className="space-y-2.5 mb-2">
                          {plan.features.map((f) => (
                            <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                              <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>

                         {isSelected && (
                           <motion.div
                             layoutId="selected-indicator"
                             className="mt-5 pt-4 border-t border-primary-100"
                           >
                             <span className="text-xs font-semibold text-primary-600 flex items-center gap-1.5">
                               <Check className="w-3.5 h-3.5" /> Selected
                             </span>
                           </motion.div>
                         )}

                         <div className="mt-5">
                           {plan.custom ? (
                             <motion.button
                               whileHover={{ scale: 1.02 }}
                               whileTap={{ scale: 0.98 }}
                               onClick={(e) => { e.stopPropagation(); setShowCustomForm(true); }}
                               className="w-full btn-primary inline-flex items-center justify-center gap-2.5 px-6 py-3 text-sm"
                             >
                               Request Custom Solution <ArrowRight className="w-4 h-4" />
                             </motion.button>
                           ) : (
                             <motion.button
                               whileHover={{ scale: 1.02 }}
                               whileTap={{ scale: 0.98 }}
                               onClick={(e) => { e.stopPropagation(); setSelectedPlan(plan.id); handleStartTrial(); }}
                               className="w-full btn-primary inline-flex items-center justify-center gap-2.5 px-6 py-3 text-sm"
                             >
                                Select Plan <ArrowRight className="w-4 h-4" />
                             </motion.button>
                           )}
                         </div>
                       </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 'payment' && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="gpu-accelerated"
                style={{ transform: 'translateZ(0)' }}
              >
                <button
                  onClick={() => setStep('plan')}
                  className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-8 transition-colors duration-300 btn-ghost"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to plans
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                  <div className="lg:col-span-7">
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2 tracking-tight">Payment Details</h1>
                    <p className="text-slate-500 mb-8 text-base">Complete your subscription to continue after your trial.</p>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="glass-card p-6 sm:p-8"
                    >
                      <label className="input-label text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Payment Method</label>
                      <div className="flex gap-3 overflow-x-auto no-scrollbar sm:grid sm:grid-cols-3 mb-8 pb-2 sm:pb-0">
                        {paymentMethods.map((pm) => {
                          const Icon = pm.icon;
                          return (
                            <motion.button
                              key={pm.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setPaymentMethod(pm.id)}
                              className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-300 whitespace-nowrap min-w-[140px] sm:min-w-0 focus-visible-ring ${
                                paymentMethod === pm.id
                                  ? 'border-primary-500 bg-primary-50/80 shadow-lg shadow-primary-500/10'
                                  : 'border-slate-100 hover:border-slate-200 bg-white/50'
                              }`}
                            >
                              <Icon className={`w-5 h-5 ${paymentMethod === pm.id ? 'text-primary-600' : 'text-slate-400'}`} />
                              <span className={`text-sm font-semibold ${paymentMethod === pm.id ? 'text-primary-700' : 'text-slate-700'}`}>{pm.name}</span>
                            </motion.button>
                          );
                        })}
                      </div>

                      <div className="space-y-5">
                        <AnimatePresence mode="wait">
                          {(paymentMethod === 'visa' || paymentMethod === 'mastercard') && (
                            <motion.div
                              key="card-form"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.3 }}
                              className="space-y-5"
                            >
                              <div>
                                <label className="input-label">Card Number</label>
                                <div className="relative">
                                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                  <input
                                    type="text"
                                    placeholder="1234 5678 9012 3456"
                                    className="input pl-11"
                                    value={paymentDetails.cardNumber}
                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, cardNumber: e.target.value })}
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="input-label">Expiry Date</label>
                                  <input
                                    type="text"
                                    placeholder="MM/YY"
                                    className="input"
                                    value={paymentDetails.expiry}
                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, expiry: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <label className="input-label">CVV</label>
                                  <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                      type="text"
                                      placeholder="123"
                                      className="input pl-11"
                                      value={paymentDetails.cvv}
                                      onChange={(e) => setPaymentDetails({ ...paymentDetails, cvv: e.target.value })}
                                    />
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {paymentMethod === 'paypal' && (
                            <motion.div
                              key="paypal-form"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.3 }}
                              className="bg-brand-50/80 border border-brand-100 rounded-2xl p-5"
                            >
                              <p className="text-sm text-brand-800 font-medium">You will be redirected to PayPal to complete payment.</p>
                            </motion.div>
                          )}

                          {paymentMethod === 'bank' && (
                            <motion.div
                              key="bank-form"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.3 }}
                              className="space-y-5"
                            >
                              <div>
                                <label className="input-label">Account Name</label>
                                <input
                                  type="text"
                                  placeholder="Full name on account"
                                  className="input"
                                  value={paymentDetails.accountName}
                                  onChange={(e) => setPaymentDetails({ ...paymentDetails, accountName: e.target.value })}
                                />
                              </div>
                              <div>
                                <label className="input-label">Bank Name</label>
                                <input
                                  type="text"
                                  placeholder="Your bank name"
                                  className="input"
                                  value={paymentDetails.bankName}
                                  onChange={(e) => setPaymentDetails({ ...paymentDetails, bankName: e.target.value })}
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="pt-4 border-t border-slate-100 flex items-center gap-2.5 text-xs text-slate-400">
                          <Lock className="w-3.5 h-3.5" />
                          Payments are secured with 256-bit SSL encryption
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handlePayment}
                        disabled={processing}
                        className="btn-primary w-full mt-8 py-4 text-base flex items-center justify-center gap-2"
                      >
                        {processing ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                          </span>
                        ) : `Pay KES ${selected?.price?.toLocaleString()}/month`}
                      </motion.button>
                    </motion.div>
                  </div>

                  {/* Order Summary */}
                  <div className="lg:col-span-5">
                    <div className="lg:sticky lg:top-32">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="glass-card p-6 sm:p-8"
                      >
                        <h3 className="text-lg font-bold text-slate-900 mb-5 tracking-tight">Order Summary</h3>
                        <div className="bg-white/80 rounded-2xl p-5 border border-slate-100 mb-5">
                          <div className="flex items-center gap-3.5 mb-4">
                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${selected?.gradient} flex items-center justify-center shadow-md`}>
                              <selected.icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{selected?.name}</div>
                              <div className="text-xs text-slate-500">Monthly subscription</div>
                            </div>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold text-slate-900">KES {selected?.price?.toLocaleString()}</span>
                            <span className="text-sm text-slate-400">/month</span>
                          </div>
                        </div>
                        <div className="space-y-2.5 text-sm text-slate-500 mb-6">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="font-medium text-slate-700">KES {selected?.price?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tax</span>
                            <span className="font-medium text-slate-700">KES 0</span>
                          </div>
                          <div className="border-t border-slate-200 pt-2.5 flex justify-between font-bold text-slate-900">
                            <span>Total</span>
                            <span>KES {selected?.price?.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="bg-amber-50/80 border border-amber-100 rounded-2xl p-4">
                           <p className="text-xs text-amber-800 font-medium leading-relaxed">
                             Your 30-day free trial starts now. You won't be charged until the trial ends.
                           </p>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'success' && !showCustomForm && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="text-center py-12 sm:py-16"
              >
                <div className="glass-card max-w-lg mx-auto p-8 sm:p-12">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
                    className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-success to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-lg shadow-success/30"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 15 }}
                      className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center"
                    >
                      <Check className="w-5 h-5 sm:w-6 sm:h-6 text-success" strokeWidth={3} />
                    </motion.div>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 tracking-tight"
                  >
                    You're all set!
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-slate-500 max-w-md mx-auto mb-8 leading-relaxed"
                  >
                     {trialStarted
                       ? 'Your 30-day free trial has started. Explore all features with no commitment.'
                       : 'Your subscription has been activated successfully. Welcome to POSIFY!'}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="bg-white/80 rounded-2xl p-6 border border-slate-100 mb-8 inline-block min-w-[280px]"
                  >
                    <div className="text-sm text-slate-500 mb-1">Current Plan</div>
                    <div className="text-2xl font-bold text-slate-900 capitalize">{selected?.name}</div>
                    {selected?.price && (
                      <div className="text-sm text-slate-500 mt-1">KES {selected?.price?.toLocaleString()}/month</div>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-3"
                  >
                    <button onClick={() => navigate('/auth/signup')} className="btn-primary inline-flex items-center gap-2 px-8 py-4">
                      Create Account <ArrowRight className="w-5 h-5" />
                    </button>
                    <button onClick={() => navigate('/')} className="btn-secondary inline-flex items-center gap-2 px-8 py-4">
                      Back to Home
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <CustomRequestForm
            isOpen={showCustomForm}
            onClose={() => {
              setShowCustomForm(false);
              setStep('success');
            }}
            onSubmit={(data) => {
              console.log('Custom request submitted:', data);
            }}
          />
        </div>
      </main>
    </div>
  );
}
