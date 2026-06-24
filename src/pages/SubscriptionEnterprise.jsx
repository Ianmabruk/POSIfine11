import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowLeft, CreditCard, Smartphone, Building2, Globe, Lock, Sparkles, Crown, Zap, ArrowRight } from 'lucide-react';
import CustomRequestForm from '../components/modern-landing/CustomRequestForm';

const plans = [
  {
    id: 'starter',
    name: 'STARTER',
    price: 999,
    icon: Zap,
    color: 'from-slate-500 to-slate-600',
    description: 'Small businesses. Limited users. Core modules. 15-Day Trial.',
    features: ['Single user access', 'Basic inventory tracking', 'Sales & order management', 'Daily reports & insights', 'Email support', 'Cashier POS dashboard'],
  },
  {
    id: 'business',
    name: 'BUSINESS',
    price: 2499,
    icon: Zap,
    color: 'from-primary-500 to-primary-600',
    description: 'Growing companies. More users. Multi-branch. Advanced reports. 15-Day Trial.',
    features: ['Up to 10 users', 'Advanced inventory & recipes', 'Full admin dashboard', 'CRM & customer profiles', 'Advanced analytics', 'Priority support', 'Expense tracking', 'Service fees & discounts'],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'ENTERPRISE',
    price: 4999,
    icon: Crown,
    color: 'from-amber-500 to-amber-600',
    description: 'Unlimited users. Unlimited branches. Priority support. Advanced analytics. 15-Day Trial.',
    features: ['Unlimited users', 'Multi-location support', 'Full CRM suite', 'AI-powered insights', 'Custom integrations', 'Dedicated account manager', '99.9% uptime SLA', 'White-label options'],
  },
  {
    id: 'custom',
    name: 'CUSTOM',
    price: null,
    icon: Sparkles,
    color: 'from-success to-emerald-600',
    description: 'Specialized workflows for hospitals, schools, manufacturers, and warehouses.',
    features: ['Custom business type setup', 'Specialized modules', 'Industry-specific features', 'Custom reporting', 'Priority support', 'Custom invoice generation'],
    custom: true,
  },
];

const paymentMethods = [
  { id: 'mpesa', name: 'M-Pesa', icon: Smartphone, desc: 'Pay with M-Pesa' },
  { id: 'visa', name: 'Visa', icon: CreditCard, desc: 'Credit / Debit card' },
  { id: 'mastercard', name: 'Mastercard', icon: CreditCard, desc: 'Credit / Debit card' },
  { id: 'paypal', name: 'PayPal', icon: Globe, desc: 'Pay with PayPal' },
  { id: 'bank', name: 'Bank Transfer', icon: Building2, desc: 'Direct bank transfer' },
];

export default function SubscriptionEnterprise() {
  const navigate = useNavigate();
  const [step, setStep] = useState('plan');
  const [selectedPlan, setSelectedPlan] = useState('business');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [paymentDetails, setPaymentDetails] = useState({ phone: '', cardNumber: '', expiry: '', cvv: '', accountName: '', bankName: '' });
  const [processing, setProcessing] = useState(false);
  const [trialStarted, setTrialStarted] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);

  const selected = plans.find(p => p.id === selectedPlan);

  const handleStartTrial = () => {
    const planData = { id: selected?.id, name: selected?.name, price: selected?.price };
    localStorage.setItem('selectedPlan', JSON.stringify(planData));
    localStorage.setItem('planId', selectedPlan);
    localStorage.setItem('isTrial', 'true');
    localStorage.setItem('trialEndsAt', new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString());
    
    setTrialStarted(true);
    setStep('success');
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      await new Promise(r => setTimeout(r, 2000));
      localStorage.removeItem('isTrial');
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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-xs sm:text-sm">P</span>
            </div>
            <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">POSIFY</span>
          </button>
          <button onClick={() => navigate('/')} className="text-xs sm:text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors">
            Back to Home
          </button>
        </div>
      </header>

      <main className="pt-20 sm:pt-24 pb-12 sm:pb-16 px-3 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Progress */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-10 sm:mb-12 overflow-x-auto">
            {['plan', 'payment', 'success'].map((s, i) => (
              <div key={s} className="flex items-center gap-2 sm:gap-3">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  step === s ? 'bg-primary-600 text-white' : 
                  ['plan','payment','success'].indexOf(step) > i ? 'bg-success text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  {['plan','payment','success'].indexOf(step) > i ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : i + 1}
                </div>
                {i < 2 && <div className={`w-10 sm:w-16 h-0.5 rounded flex-shrink-0 ${['plan','payment','success'].indexOf(step) > i ? 'bg-success' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 'plan' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="text-center mb-10">
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Choose your plan</h1>
                  <p className="text-slate-500 max-w-lg mx-auto">Start with a 15-day free trial. No credit card required. Cancel anytime.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-10">
                  {plans.map((plan) => {
                    const Icon = plan.icon;
                    const isSelected = selectedPlan === plan.id;
                    return (
                      <motion.div
                        key={plan.id}
                        whileHover={{ y: -4 }}
                        onClick={() => setSelectedPlan(plan.id)}
                        className={`relative rounded-3xl p-6 cursor-pointer transition-all duration-300 border-2 ${
                          isSelected ? 'border-primary-500 shadow-glow bg-white' : 'border-slate-100 hover:border-slate-200 bg-white shadow-soft hover:shadow-card-hover'
                        }`}
                      >
                        {plan.popular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-600 text-white text-xs font-bold rounded-full shadow-lg">
                            MOST POPULAR
                          </div>
                        )}
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4 ${isSelected ? 'shadow-lg' : ''}`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h3>
                        <p className="text-sm text-slate-500 mb-4 leading-relaxed">{plan.description}</p>
                        <div className="mb-5">
                          {plan.price ? (
                            <>
                              <span className="text-3xl font-bold text-slate-900">KES {plan.price.toLocaleString()}</span>
                              <span className="text-slate-400 text-sm">/month</span>
                            </>
                          ) : (
                            <span className="text-xl font-bold text-success">15-Day Free Trial</span>
                          )}
                        </div>
                        <ul className="space-y-2.5">
                          {plan.features.map((f) => (
                            <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                              <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="flex justify-center">
                  <button onClick={() => {
                    if (selected?.custom) {
                      setShowCustomForm(true);
                    } else {
                      handleStartTrial();
                    }
                  }} className="btn-primary inline-flex items-center gap-2 px-10 py-4 text-base">
                    {selected?.custom ? "Request Custom Solution" : "Start 15-Day Free Trial"}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'payment' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <button onClick={() => setStep('plan')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-8 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to plans
                </button>
                
                <div className="grid lg:grid-cols-5 gap-8">
                  <div className="lg:col-span-3">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Payment Details</h1>
                    <p className="text-slate-500 mb-8">Complete your subscription to continue after your trial.</p>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6 md:p-8">
                      <label className="input-label mb-3">Payment Method</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                        {paymentMethods.map((pm) => {
                          const Icon = pm.icon;
                          return (
                            <button
                              key={pm.id}
                              onClick={() => setPaymentMethod(pm.id)}
                              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                paymentMethod === pm.id ? 'border-primary-500 bg-primary-50 shadow-sm' : 'border-slate-100 hover:border-slate-200'
                              }`}
                            >
                              <Icon className={`w-5 h-5 ${paymentMethod === pm.id ? 'text-primary-600' : 'text-slate-400'}`} />
                              <span className="text-sm font-semibold text-slate-700">{pm.name}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="space-y-4">
                        {paymentMethod === 'mpesa' && (
                          <div>
                            <label className="input-label">M-Pesa Phone Number</label>
                            <div className="relative">
                              <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input
                                type="tel"
                                placeholder="+254 7XX XXX XXX"
                                className="input pl-10"
                                value={paymentDetails.phone}
                                onChange={(e) => setPaymentDetails({ ...paymentDetails, phone: e.target.value })}
                              />
                            </div>
                          </div>
                        )}

                        {(paymentMethod === 'visa' || paymentMethod === 'mastercard') && (
                          <>
                            <div>
                              <label className="input-label">Card Number</label>
                              <div className="relative">
                                <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                  type="text"
                                  placeholder="1234 5678 9012 3456"
                                  className="input pl-10"
                                  value={paymentDetails.cardNumber}
                                  onChange={(e) => setPaymentDetails({ ...paymentDetails, cardNumber: e.target.value })}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
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
                                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                  <input
                                    type="text"
                                    placeholder="123"
                                    className="input pl-10"
                                    value={paymentDetails.cvv}
                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, cvv: e.target.value })}
                                  />
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {paymentMethod === 'paypal' && (
                          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <p className="text-sm text-blue-800">You will be redirected to PayPal to complete payment.</p>
                          </div>
                        )}

                        {paymentMethod === 'bank' && (
                          <>
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
                          </>
                        )}

                        <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
                          <Lock className="w-3.5 h-3.5" />
                          Payments are secured with 256-bit SSL encryption
                        </div>
                      </div>

                      <button
                        onClick={handlePayment}
                        disabled={processing}
                        className="w-full mt-8 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {processing ? (
                          <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</span>
                        ) : `Pay KES ${selected?.price?.toLocaleString()}/month`}
                      </button>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="lg:col-span-2">
                    <div className="bg-slate-50 rounded-3xl p-6 md:p-8 border border-slate-100 sticky top-24">
                      <h3 className="font-bold text-slate-900 mb-4">Order Summary</h3>
                      <div className="bg-white rounded-2xl p-5 border border-slate-100 mb-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selected?.color} flex items-center justify-center`}>
                            <selected.icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{selected?.name}</div>
                            <div className="text-xs text-slate-500">Monthly subscription</div>
                          </div>
                        </div>
                        <div className="flex items-baseline gap-1 mb-1">
                          <span className="text-2xl font-bold text-slate-900">KES {selected?.price?.toLocaleString()}</span>
                          <span className="text-sm text-slate-400">/month</span>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-slate-500 mb-6">
                        <div className="flex justify-between"><span>Subtotal</span><span>KES {selected?.price?.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Tax</span><span>KES 0</span></div>
                        <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
                          <span>Total</span><span>KES {selected?.price?.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                        <p className="text-xs text-amber-800 font-medium">Your 15-day free trial starts now. You won't be charged until the trial ends.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'success' && !showCustomForm && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-success" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-3">You're all set!</h1>
                <p className="text-slate-500 max-w-md mx-auto mb-8">
                  {trialStarted 
                    ? 'Your 15-day free trial has started. Explore all features with no commitment.'
                    : 'Your subscription has been activated successfully. Welcome to POSIFY!'}
                </p>
                <div className="bg-slate-50 rounded-2xl p-6 max-w-sm mx-auto mb-8 border border-slate-100">
                  <div className="text-sm text-slate-500 mb-1">Current Plan</div>
                  <div className="text-xl font-bold text-slate-900 capitalize">{selected?.name}</div>
                  {selected?.price && (
                    <div className="text-sm text-slate-500 mt-1">KES {selected?.price?.toLocaleString()}/month</div>
                  )}
                </div>
                <button onClick={() => navigate('/auth/signup')} className="btn-primary inline-flex items-center gap-2 px-8 py-4">
                  Get Started <ArrowRight className="w-5 h-5" />
                </button>
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


