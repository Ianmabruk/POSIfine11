import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Zap, Shield, TrendingUp, Users, Package, BarChart3, Layers, DollarSign, Crown, Star, X, Play } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const [showDemo, setShowDemo] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  const demoSteps = [
    {
      title: '1. Sign Up & Choose Plan',
      desc: 'Create your account and select between Basic (KSH 900) or Ultra (KSH 1,600) package',
      image: '📝',
      details: 'First user becomes Admin automatically. Choose Ultra for full features including Recipe Builder and User Management.'
    },
    {
      title: '2. Add Raw Materials',
      desc: 'Stock your inventory with raw ingredients like fish, oil, breadcrumbs, salt, etc.',
      image: '📦',
      details: 'Enter product name, cost, quantity, and unit. Mark items as "expense-only" to hide from cashiers.'
    },
    {
      title: '3. Create Recipes (Ultra Only)',
      desc: 'Build composite products using the Recipe/BOM Builder',
      image: '🍽️',
      details: 'Example: Fish Fingers = 0.02kg Nile Perch + 0.01L Oil + 0.004kg Breadcrumbs. System auto-calculates COGS and profit margin.'
    },
    {
      title: '4. Add Cashiers (Ultra Only)',
      desc: 'Invite team members and set their permissions',
      image: '👥',
      details: 'Enter name and email. Set permissions: View Sales, View Inventory, View Expenses, Manage Products. Default password: changeme123'
    },
    {
      title: '5. Make Sales',
      desc: 'Cashiers use the POS to sell products',
      image: '💰',
      details: 'Search products, add to cart, select payment method (Cash/M-Pesa/Card), complete sale. Stock automatically deducted!'
    },
    {
      title: '6. Automatic Stock Deduction',
      desc: 'When selling composite products, ingredients are auto-deducted',
      image: '⚡',
      details: 'Sell 1 Fish Finger → System deducts 0.02kg fish, 0.01L oil, 0.004kg breadcrumbs. COGS calculated automatically!'
    },
    {
      title: '7. Track Analytics',
      desc: 'Monitor sales, profit, expenses in real-time',
      image: '📊',
      details: 'View daily/weekly sales, gross profit, net profit, COGS breakdown. Admin sees full analytics, cashiers see limited data.'
    },
    {
      title: '8. Manage Expenses',
      desc: 'Track manual expenses and automatic ingredient costs',
      image: '💸',
      details: 'Add manual expenses (rent, utilities, salaries). System auto-creates expenses when expense-only items are used in recipes.'
    }
  ];

  const features = [
    { icon: Package, title: 'Smart Inventory', desc: 'Track raw materials & composite products with automatic stock deduction' },
    { icon: Layers, title: 'Recipe Builder', desc: 'Create bundled products with BOM and auto-calculate COGS' },
    { icon: TrendingUp, title: 'Real-time Analytics', desc: 'Monitor sales, profit margins, and expenses in real-time' },
    { icon: Users, title: 'User Management', desc: 'Add cashiers with custom permissions and role-based access' },
    { icon: Shield, title: 'Secure & Reliable', desc: 'JWT authentication with role-based security' },
    { icon: BarChart3, title: 'Advanced Reports', desc: 'Daily, weekly summaries with profit/loss tracking' }
  ];

  const plans = [
    {
      name: 'Basic',
      price: 900,
      icon: Zap,
      popular: false,
      features: [
        'Cashier Dashboard',
        'Basic Inventory',
        'Sales Tracking',
        'Daily/Weekly Reports',
        'Single User',
        'Email Support'
      ]
    },
    {
      name: 'Ultra',
      price: 1600,
      icon: Crown,
      popular: true,
      features: [
        'Admin + Cashier Dashboard',
        'Full Inventory Management',
        'Recipe/BOM Builder',
        'Auto Stock Deduction',
        'COGS Calculation',
        'User Management',
        'Permission Controls',
        'Expense Tracking',
        'Unlimited Users',
        'Priority Support'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        
        {/* Navbar */}
        <nav className="relative z-10 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">P</span>
              </div>
              <span className="text-2xl font-bold text-white">POSify</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/login')} className="text-white hover:text-blue-100 font-medium">
                Login
              </button>
              <button onClick={() => navigate('/signup')} className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all">
                Get Started
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium mb-6">
            <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
            Trusted by 500+ businesses
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Modern POS System<br />
            <span className="text-blue-200">Built for Growth</span>
          </h1>
          
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Complete inventory management with recipe builder, automatic stock deduction, and real-time analytics. Everything you need to run your business efficiently.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/signup')}
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transform hover:scale-105 transition-all flex items-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowDemo(true)}
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              Watch Demo
            </button>
          </div>

          <p className="text-blue-200 text-sm mt-4">No credit card required • 14-day free trial</p>
        </div>

        {/* Hero Image/Dashboard Preview */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 pb-20">
          <div className="bg-white rounded-2xl shadow-2xl p-2 transform hover:scale-105 transition-all duration-500">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 aspect-video flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-24 h-24 text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Dashboard Preview</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600">Powerful features to streamline your business operations</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all transform hover:-translate-y-2">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">Choose the plan that fits your business</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, idx) => {
              const Icon = plan.icon;
              return (
                <div 
                  key={idx}
                  className={`relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 ${
                    plan.popular ? 'ring-4 ring-blue-600' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      plan.popular ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-gradient-to-br from-green-600 to-teal-600'
                    }`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{plan.name}</h3>
                      <p className="text-gray-600 text-sm">Package</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <span className="text-5xl font-bold">KSH {plan.price}</span>
                    <span className="text-gray-600">/month</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => navigate('/signup')}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl transform hover:scale-105' 
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    Get Started
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 px-6 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-5xl font-bold mb-2">500+</div>
              <div className="text-blue-200">Active Businesses</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">50K+</div>
              <div className="text-blue-200">Transactions/Day</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">99.9%</div>
              <div className="text-blue-200">Uptime</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">24/7</div>
              <div className="text-blue-200">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join hundreds of businesses already using POSify to streamline their operations
          </p>
          <button 
            onClick={() => navigate('/signup')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transform hover:scale-105 transition-all inline-flex items-center gap-2"
          >
            Start Your Free Trial
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-gray-500 text-sm mt-4">No credit card required • Cancel anytime</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-white">P</span>
            </div>
            <span className="text-xl font-bold text-white">POSify</span>
          </div>
          <p className="mb-4">Modern POS System for Modern Businesses</p>
          <p className="text-sm">&copy; 2024 POSify. All rights reserved.</p>
        </div>
      </footer>

      {/* Demo Modal */}
      {showDemo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">How POSify Works</h2>
              <button onClick={() => { setShowDemo(false); setDemoStep(0); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Step {demoStep + 1} of {demoSteps.length}</span>
                  <span className="text-sm font-medium text-blue-600">{Math.round(((demoStep + 1) / demoSteps.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((demoStep + 1) / demoSteps.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Current Step */}
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">{demoSteps[demoStep].image}</div>
                <h3 className="text-3xl font-bold mb-3">{demoSteps[demoStep].title}</h3>
                <p className="text-xl text-gray-600 mb-4">{demoSteps[demoStep].desc}</p>
                <div className="bg-blue-50 rounded-xl p-6 text-left">
                  <p className="text-gray-700">{demoSteps[demoStep].details}</p>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={() => setDemoStep(Math.max(0, demoStep - 1))}
                  disabled={demoStep === 0}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {demoStep < demoSteps.length - 1 ? (
                  <button
                    onClick={() => setDemoStep(demoStep + 1)}
                    className="btn-primary flex items-center gap-2"
                  >
                    Next Step
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => { setShowDemo(false); setDemoStep(0); navigate('/signup'); }}
                    className="btn-primary bg-gradient-to-r from-blue-600 to-purple-600 flex items-center gap-2"
                  >
                    Get Started Now
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Step Indicators */}
              <div className="flex items-center justify-center gap-2 mt-8">
                {demoSteps.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setDemoStep(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === demoStep ? 'w-8 bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
