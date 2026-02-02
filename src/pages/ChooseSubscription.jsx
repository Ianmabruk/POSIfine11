import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Crown, Zap, Shield, TrendingUp, Users, Package, BarChart3, Star, ArrowRight, Sparkles } from 'lucide-react';

export default function ChooseSubscription() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('basic');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');

  const plans = {
    basic: {
      name: 'Basic',
      price: { monthly: 1200, yearly: 12000 },
      description: 'Perfect for small businesses getting started',
      features: [
        'Admin Dashboard with real-time analytics',
        'Add unlimited cashiers',
        'Basic inventory management',
        'Sales tracking and reporting',
        'Customer support',
        'Mobile responsive design',
        'Secure data backup',
        'Basic integrations'
      ],
      color: 'from-blue-500 to-blue-600',
      icon: Package,
      popular: false
    },
    ultra: {
      name: 'Ultra',
      price: { monthly: 2400, yearly: 24000 },
      description: 'Advanced features for growing businesses',
      features: [
        'Everything in Basic',
        'Advanced analytics & forecasting',
        'Multi-location support',
        'Advanced inventory alerts',
        'Custom reporting dashboard',
        'Priority customer support',
        'API access for integrations',
        'Advanced user permissions',
        'Bulk operations',
        'Export data capabilities'
      ],
      color: 'from-pink-500 to-pink-600',
      icon: TrendingUp,
      popular: true
    },
    pro: {
      name: 'Pro',
      price: { monthly: 3600, yearly: 36000 },
      description: 'Industry-specific solutions for enterprises',
      features: [
        'Everything in Ultra',
        'Industry-specific dashboards',
        'Custom business workflows',
        'Advanced AI insights',
        'White-label options',
        'Dedicated account manager',
        'Custom integrations',
        'Advanced security features',
        'Compliance tools',
        'Custom training sessions'
      ],
      color: 'from-red-500 to-red-600',
      icon: Crown,
      popular: false,
      requiresIndustry: true
    }
  };

  const industries = [
    {
      id: 'retail',
      name: 'Retail Store',
      icon: '🛍️',
      description: 'Complete retail management with inventory tracking',
      features: ['Product catalog', 'Barcode scanning', 'Customer loyalty', 'Promotions']
    },
    {
      id: 'bar',
      name: 'Bar & Restaurant',
      icon: '🍺',
      description: 'Table service, menu management, and staff coordination',
      features: ['Table management', 'Menu builder', 'Kitchen orders', 'Staff shifts']
    },
    {
      id: 'clinic',
      name: 'Medical Clinic',
      icon: '🏥',
      description: 'Patient management and prescription tracking',
      features: ['Patient records', 'Appointments', 'Prescriptions', 'Doctor dashboard']
    },
    {
      id: 'hotel',
      name: 'Hotel',
      icon: '🏨',
      description: 'Room booking and housekeeping management',
      features: ['Room booking', 'Guest management', 'Housekeeping', 'Billing']
    },
    {
      id: 'pharmacy',
      name: 'Pharmacy',
      icon: '💊',
      description: 'Medicine inventory and prescription dispensing',
      features: ['Medicine catalog', 'Prescription tracking', 'Expiry alerts', 'Insurance']
    },
    {
      id: 'petroleum',
      name: 'Petroleum Station',
      icon: '⛽',
      description: 'Fuel management and pump operations',
      features: ['Fuel tanks', 'Pump management', 'Staff tracking', 'Fuel reports']
    }
  ];

  const handlePlanSelect = (planKey) => {
    setSelectedPlan(planKey);
    
    if (plans[planKey].requiresIndustry) {
      setShowIndustryModal(true);
    }
  };

  const handleStartTrial = async () => {
    try {
      const planData = {
        plan: selectedPlan,
        billingCycle,
        industry: selectedIndustry,
        trialDays: 15
      };

      // Navigate to signup with plan data
      navigate('/auth/signup', { 
        state: { 
          planData,
          fromSubscription: true 
        } 
      });
    } catch (error) {
      console.error('Error starting trial:', error);
      alert('Failed to start trial. Please try again.');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-pink-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
              POSiFine
            </span>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-100 to-pink-100 border border-blue-200 rounded-full text-sm font-medium mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent">
                🎉 15-Day Free Trial • No Credit Card Required
              </span>
            </span>
            <h1 className="text-5xl font-bold mb-4">
              <span className="text-gray-900">Choose Your</span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
                Perfect Plan
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start with a 15-day free trial. Upgrade, downgrade, or cancel anytime.
            </p>
          </motion.div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                billingCycle === 'yearly' ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                billingCycle === 'yearly' ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Yearly
            </span>
            {billingCycle === 'yearly' && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                Save 17%
              </span>
            )}
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {Object.entries(plans).map(([key, plan]) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === key;
            
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Object.keys(plans).indexOf(key) * 0.1 }}
                className={`relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-lg border-2 transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-blue-500 shadow-2xl scale-105' 
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-xl'
                } ${plan.popular ? 'ring-2 ring-pink-500 ring-opacity-50' : ''}`}
                onClick={() => handlePlanSelect(key)}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  
                  <div className="mb-4">
                    <div className="text-4xl font-bold text-gray-900">
                      {formatPrice(plan.price[billingCycle])}
                    </div>
                    <div className="text-sm text-gray-500">
                      per {billingCycle === 'monthly' ? 'month' : 'year'}
                    </div>
                    {billingCycle === 'yearly' && (
                      <div className="text-xs text-green-600 font-medium">
                        Save {formatPrice(plan.price.monthly * 12 - plan.price.yearly)} annually
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    isSelected
                      ? `bg-gradient-to-r ${plan.color} text-white shadow-lg`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Select Plan'}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Selected Plan Summary */}
        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-gray-200 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {plans[selectedPlan].name} Plan Selected
                </h3>
                <p className="text-gray-600">
                  {selectedIndustry && `${industries.find(i => i.id === selectedIndustry)?.name} • `}
                  15-day free trial, then {formatPrice(plans[selectedPlan].price[billingCycle])} {billingCycle === 'monthly' ? 'per month' : 'per year'}
                </p>
              </div>
              <div className={`w-16 h-16 bg-gradient-to-br ${plans[selectedPlan].color} rounded-2xl flex items-center justify-center shadow-lg`}>
                <plans[selectedPlan].icon className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-2xl font-bold text-blue-600">15 Days</div>
                <div className="text-sm text-blue-700">Free Trial</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-2xl font-bold text-green-600">No Risk</div>
                <div className="text-sm text-green-700">Cancel Anytime</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <div className="text-2xl font-bold text-purple-600">Full Access</div>
                <div className="text-sm text-purple-700">All Features</div>
              </div>
            </div>

            <button
              onClick={handleStartTrial}
              className="w-full py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              Start 15-Day Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* Trust Indicators */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-8 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>Full feature access</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Your trial will automatically expire after 15 days. You can upgrade to continue using POSiFine.
          </p>
        </div>
      </div>

      {/* Industry Selection Modal */}
      <AnimatePresence>
        {showIndustryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowIndustryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowIndustryModal(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Choose Your Industry
                  </h2>
                  <p className="text-gray-600">
                    Select your business type to get a customized dashboard and features
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {industries.map((industry) => (
                    <motion.div
                      key={industry.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                        selectedIndustry === industry.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 bg-white'
                      }`}
                      onClick={() => setSelectedIndustry(industry.id)}
                    >
                      <div className="text-4xl mb-4">{industry.icon}</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{industry.name}</h3>
                      <p className="text-gray-600 text-sm mb-4">{industry.description}</p>
                      
                      <div className="space-y-2">
                        {industry.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            <span className="text-xs text-gray-600">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8 flex gap-4">
                  <button
                    onClick={() => setShowIndustryModal(false)}
                    disabled={!selectedIndustry}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                      selectedIndustry
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Continue with {selectedIndustry ? industries.find(i => i.id === selectedIndustry)?.name : 'Selection'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedIndustry('');
                      setShowIndustryModal(false);
                      setSelectedPlan('ultra');
                    }}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                  >
                    Skip
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}