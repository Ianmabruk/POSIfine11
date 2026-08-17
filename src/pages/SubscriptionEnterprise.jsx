import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowLeft, CreditCard, Smartphone, Building2, Globe, Lock, Sparkles, Crown, ArrowRight } from 'lucide-react';
import api from '../services/apiClient';
import CustomRequestForm from '../components/modern-landing/CustomRequestForm';
import SEO from '../components/SEO';

const plans = [
  {
    id: 'starter',
    name: 'STARTER',
    price: 1000,
    icon: Crown,
    description: 'Small businesses. 1 Admin + 1 Cashier. Core POS modules. 30-Day Trial.',
    features: ['1 Admin account', '1 Cashier account', 'Basic inventory tracking', 'Sales & order management', 'Daily reports & insights', 'Email support', 'Cashier POS dashboard'],
  },
  {
    id: 'business',
    name: 'BUSINESS',
    price: 1500,
    icon: Crown,
    description: 'Growing companies. Multiple Admins + Multiple Cashiers. Advanced reports. 30-Day Trial.',
    features: ['Multiple Admin accounts', 'Multiple Cashier accounts', 'Advanced inventory & recipes', 'Full admin dashboard', 'CRM & customer profiles', 'Advanced analytics', 'Priority support', 'Expense tracking', 'Service fees & discounts'],
    popular: true,
  },
  {
    id: 'custom',
    name: 'CUSTOM',
    price: null,
    icon: Sparkles,
    description: 'A customized POS/web solution based on your requirements.',
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
    } catch (error) {
      console.error('Failed to create trial:', error);
      localStorage.setItem('isTrial', 'true');
      localStorage.setItem('trialEndsAt', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
    }
    navigate('/');
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
    <div className="min-h-screen bg-vanilla-200 relative overflow-x-hidden">
      <SEO
        title="Choose Your Plan - Possify POS Pricing"
        description="Choose the right Possify plan for your business. Starter and Business plans available. 30-day free trial."
        canonical="https://posifine22.onrender.com/choose-subscription"
      />

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6"
      >
        <div className="max-w-5xl mx-auto mt-4">
          <div className="glass-vanilla rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 focus-visible-ring rounded-xl"
            >
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="12" fill="#111111" />
                <path d="M12 10C12 8.34315 13.3431 7 15 7H28C29.6569 7 31 8.34315 31 10V30C31 31.6569 29.6569 33 28 33H15C13.3431 33 12 31.6569 12 30V10Z" fill="#111111" />
                <path d="M15 10C15 8.34315 16.3431 7 18 7H28C29.6569 7 31 8.34315 31 10V15H15V10Z" fill="#F1FEC8" />
                <path d="M15 7V30C15 31.6569 16.3431 33 18 33H12V7H15Z" fill="#F1FEC8" />
                <circle cx="20" cy="22" r="6" fill="#111111" />
                <circle cx="20" cy="22" r="3.5" fill="#F1FEC8" />
              </svg>
              <span className="text-base font-bold text-slate-900 tracking-tight">Possify</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10 pt-28 sm:pt-32 pb-12 sm:pb-16 px-3 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Progress */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center mb-10 sm:mb-14"
          >
            <div className="glass-vanilla inline-flex items-center gap-3 sm:gap-5 px-5 sm:px-7 py-3.5 sm:py-4">
              {stepLabels.map((label, i) => {
                const isCompleted = currentStepIndex > i;
                const isCurrent = currentStepIndex === i;
                return (
                  <div key={label} className="flex items-center gap-2.5 sm:gap-3.5">
                    <div className="flex items-center gap-2.5">
                      <motion.div
                        animate={{
                          scale: isCurrent ? 1.1 : 1,
                          backgroundColor: isCurrent ? '#111111' : isCompleted ? '#16a34a' : '#F1F5F9',
                        }}
                        transition={{ duration: 0.3 }}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold`}
                      >
                        {isCompleted ? <Check className="w-3.5 h-3.5 text-white" /> : <span className={isCurrent ? 'text-white' : 'text-slate-400'}>{i + 1}</span>}
                      </motion.div>
                      <span className={`text-xs sm:text-sm font-medium hidden sm:block ${isCurrent ? 'text-slate-900' : isCompleted ? 'text-slate-600' : 'text-slate-400'}`}>
                        {label}
                      </span>
                    </div>
                    {i < 2 && (
                      <motion.div
                        animate={{ backgroundColor: isCompleted ? '#16a34a' : '#E2E8F0' }}
                        transition={{ duration: 0.3 }}
                        className="w-6 sm:w-10 h-0.5 rounded-full"
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
                transition={{ duration: 0.4 }}
              >
                <div className="text-center mb-10 sm:mb-12">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 tracking-tight">
                    Choose your plan
                  </h1>
                  <p className="text-slate-500 max-w-xl mx-auto text-base sm:text-lg">
                    Start with a 30-day free trial. No credit card required. Cancel anytime.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10 max-w-5xl mx-auto">
                  {plans.map((plan, index) => {
                    const Icon = plan.icon;
                    const isSelected = selectedPlan === plan.id;
                    return (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        onClick={() => setSelectedPlan(plan.id)}
                        className={`relative rounded-3xl p-6 sm:p-7 cursor-pointer transition-all duration-300 border ${
                          isSelected
                            ? 'glass-vanilla-strong border-white/70 scale-[1.01]'
                            : 'glass-vanilla border-white/40 hover:border-white/60'
                        }`}
                      >
                        {plan.popular && (
                          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                            <span className="px-3 py-1 bg-slate-900 text-white text-[11px] font-bold rounded-full">
                              MOST POPULAR
                            </span>
                          </div>
                        )}

                        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-900 flex items-center justify-center mb-4 ${isSelected ? 'shadow-lg' : ''}`}>
                          <Icon className="w-5 h-5 text-vanilla-200" />
                        </div>

                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 tracking-tight">{plan.name}</h3>
                        <p className="text-xs sm:text-sm text-slate-500 mb-4 leading-relaxed">{plan.description}</p>

                        <div className="mb-4 min-h-[3rem] flex items-baseline">
                          {plan.price ? (
                            <>
                              <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">KES {plan.price.toLocaleString()}</span>
                              <span className="text-xs sm:text-sm text-slate-400 ml-1">/month</span>
                            </>
                          ) : (
                            <span className="text-lg sm:text-xl font-bold text-slate-900">30-Day Free Trial</span>
                          )}
                        </div>

                        <ul className="space-y-2 mb-2">
                          {plan.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600">
                              <Check className="w-4 h-4 text-slate-900 mt-0.5 flex-shrink-0" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>

                        {isSelected && (
                          <motion.div
                            layoutId="selected-indicator"
                            className="mt-4 pt-4 border-t border-white/50"
                          >
                            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5" /> Selected
                            </span>
                          </motion.div>
                        )}

                        <div className="mt-4">
                          {plan.custom ? (
                            <motion.button
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={(e) => { e.stopPropagation(); setShowCustomForm(true); }}
                              className="w-full py-3 rounded-2xl border border-white/55 bg-white/40 text-slate-900 font-semibold text-sm hover:bg-white/60 transition-colors inline-flex items-center justify-center gap-2"
                            >
                              Request Custom Solution <ArrowRight className="w-4 h-4" />
                            </motion.button>
                          ) : (
                            <motion.button
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={(e) => { e.stopPropagation(); setSelectedPlan(plan.id); handleStartTrial(); }}
                              className="w-full py-3 rounded-2xl bg-slate-900 text-vanilla-200 font-semibold text-sm hover:bg-slate-800 transition-colors inline-flex items-center justify-center gap-2"
                            >
                              Start Trial <ArrowRight className="w-4 h-4" />
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
                transition={{ duration: 0.4 }}
              >
                <button
                  onClick={() => setStep('plan')}
                  className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-8 transition-colors"
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
                      className="glass-vanilla p-6 sm:p-8"
                    >
                      <p className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Payment Method</p>
                      <div className="flex gap-3 overflow-x-auto no-scrollbar sm:grid sm:grid-cols-3 mb-8 pb-2 sm:pb-0">
                        {paymentMethods.map((pm) => {
                          const Icon = pm.icon;
                          return (
                            <motion.button
                              key={pm.id}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => setPaymentMethod(pm.id)}
                              className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-300 whitespace-nowrap min-w-[130px] sm:min-w-0 ${
                                paymentMethod === pm.id
                                  ? 'border-slate-900 bg-white/60'
                                  : 'border-white/40 bg-white/30 hover:bg-white/50'
                              }`}
                            >
                              <Icon className={`w-5 h-5 ${paymentMethod === pm.id ? 'text-slate-900' : 'text-slate-400'}`} />
                              <span className={`text-sm font-semibold ${paymentMethod === pm.id ? 'text-slate-900' : 'text-slate-700'}`}>{pm.name}</span>
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
                                <label className="input-label text-sm font-medium text-slate-700 mb-1.5">Card Number</label>
                                <div className="relative">
                                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                  <input
                                    type="text"
                                    placeholder="1234 5678 9012 3456"
                                    className="input pl-11 glass-vanilla-input"
                                    value={paymentDetails.cardNumber}
                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, cardNumber: e.target.value })}
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="input-label text-sm font-medium text-slate-700 mb-1.5">Expiry Date</label>
                                  <input
                                    type="text"
                                    placeholder="MM/YY"
                                    className="input glass-vanilla-input"
                                    value={paymentDetails.expiry}
                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, expiry: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <label className="input-label text-sm font-medium text-slate-700 mb-1.5">CVV</label>
                                  <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                      type="text"
                                      placeholder="123"
                                      className="input pl-11 glass-vanilla-input"
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
                              className="bg-white/60 rounded-2xl p-5 border border-white/50"
                            >
                              <p className="text-sm text-slate-700 font-medium">You will be redirected to PayPal to complete payment.</p>
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
                                <label className="input-label text-sm font-medium text-slate-700 mb-1.5">Account Name</label>
                                <input
                                  type="text"
                                  placeholder="Full name on account"
                                  className="input glass-vanilla-input"
                                  value={paymentDetails.accountName}
                                  onChange={(e) => setPaymentDetails({ ...paymentDetails, accountName: e.target.value })}
                                />
                              </div>
                              <div>
                                <label className="input-label text-sm font-medium text-slate-700 mb-1.5">Bank Name</label>
                                <input
                                  type="text"
                                  placeholder="Your bank name"
                                  className="input glass-vanilla-input"
                                  value={paymentDetails.bankName}
                                  onChange={(e) => setPaymentDetails({ ...paymentDetails, bankName: e.target.value })}
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="pt-4 border-t border-white/40 flex items-center gap-2.5 text-xs text-slate-500">
                          <Lock className="w-3.5 h-3.5" />
                          Payments are secured with 256-bit SSL encryption
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handlePayment}
                        disabled={processing}
                        className="w-full mt-8 py-4 rounded-2xl bg-slate-900 text-vanilla-200 font-semibold text-base flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50"
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
                        className="glass-vanilla p-6 sm:p-8"
                      >
                        <h3 className="text-lg font-bold text-slate-900 mb-5 tracking-tight">Order Summary</h3>
                        <div className="bg-white/80 rounded-2xl p-5 border border-white/50 mb-5">
                          <div className="flex items-center gap-3.5 mb-4">
                            <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center">
                              <Crown className="w-5 h-5 text-vanilla-200" />
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
                          <div className="border-t border-white/40 pt-2.5 flex justify-between font-bold text-slate-900">
                            <span>Total</span>
                            <span>KES {selected?.price?.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="bg-vanilla-200/80 rounded-2xl p-4 border border-vanilla-300/60">
                          <p className="text-xs text-slate-700 font-medium leading-relaxed">
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
                transition={{ duration: 0.5 }}
                className="text-center py-12 sm:py-16"
              >
                <div className="glass-vanilla max-w-lg mx-auto p-8 sm:p-12">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
                    className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 15 }}
                      className="w-10 h-10 sm:w-12 sm:h-12 bg-vanilla-200 rounded-full flex items-center justify-center"
                    >
                      <Check className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900" strokeWidth={3} />
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
                        : 'Your subscription has been activated successfully. Welcome to Possify!'}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="bg-white/80 rounded-2xl p-6 border border-white/50 mb-8 inline-block min-w-[280px]"
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
                    <button onClick={() => navigate('/')} className="px-8 py-4 rounded-2xl bg-slate-900 text-vanilla-200 font-semibold inline-flex items-center gap-2 hover:bg-slate-800 transition-colors">
                      Go to Dashboard <ArrowRight className="w-5 h-5" />
                    </button>
                    <button onClick={() => navigate('/')} className="px-8 py-4 rounded-2xl border border-white/55 text-slate-700 font-semibold inline-flex items-center gap-2 hover:bg-white/40 transition-colors">
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
