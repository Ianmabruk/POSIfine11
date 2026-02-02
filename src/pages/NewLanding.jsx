import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Zap, Shield, TrendingUp, Users, Package, BarChart3, Play, Activity, ChevronRight, Sparkles, Layers, DollarSign, X, Star, Globe, Clock, Award } from 'lucide-react';

export default function NewLanding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const { scrollY } = useScroll();
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  
  // Parallax transforms
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const meshY = useTransform(scrollY, [0, 800], [0, 200]);
  
  // Mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX - window.innerWidth / 2) / 50,
        y: (e.clientY - window.innerHeight / 2) / 50
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Analytics',
      description: 'Smart insights and predictions powered by advanced machine learning algorithms',
      color: 'from-blue-500 to-blue-600',
      badge: 'NEW'
    },
    {
      icon: Activity,
      title: 'Real-Time Sync',
      description: 'Instant updates across all devices with WebSocket technology',
      color: 'from-pink-500 to-pink-600'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level encryption and multi-tenant data isolation',
      color: 'from-blue-600 to-blue-700'
    },
    {
      icon: TrendingUp,
      title: 'Smart Forecasting',
      description: 'Predict sales trends and optimize inventory automatically',
      color: 'from-pink-600 to-red-500'
    },
    {
      icon: Package,
      title: 'Inventory Management',
      description: 'Complete stock control with batch tracking and alerts',
      color: 'from-blue-500 to-pink-500'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Multi-user access with role-based permissions',
      color: 'from-pink-500 to-red-600'
    }
  ];

  const industries = [
    { name: 'Retail', icon: '🛍️', description: 'Complete retail management' },
    { name: 'Bar', icon: '🍺', description: 'Table service & inventory' },
    { name: 'Clinic', icon: '🏥', description: 'Patient & prescription management' },
    { name: 'Hotel', icon: '🏨', description: 'Room booking & housekeeping' },
    { name: 'Pharmacy', icon: '💊', description: 'Medicine dispensing system' },
    { name: 'Petroleum', icon: '⛽', description: 'Fuel station management' }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Store Manager',
      company: 'Fresh Market',
      content: 'POSiFine transformed our checkout process. Sales completion in under 50ms is incredible!',
      rating: 5
    },
    {
      name: 'Dr. Michael Chen',
      role: 'Clinic Director', 
      company: 'HealthCare Plus',
      content: 'The medical dashboard streamlined our patient management completely.',
      rating: 5
    },
    {
      name: 'James Wilson',
      role: 'Bar Owner',
      company: 'The Local Pub',
      content: 'Table management and inventory tracking made our operations so much smoother.',
      rating: 5
    }
  ];

  const demoSteps = [
    { title: 'Login', description: 'Secure authentication with role-based access' },
    { title: 'Admin Dashboard', description: 'Real-time analytics and business insights' },
    { title: 'Cashier POS', description: 'Ultra-fast checkout in under 50ms' },
    { title: 'Sales Analytics', description: 'Comprehensive reporting and forecasting' },
    { title: 'Inventory Control', description: 'Smart stock management with alerts' },
    { title: 'Team Management', description: 'Staff tracking and performance metrics' }
  ];

  const startDemo = () => {
    setShowDemoModal(true);
    setDemoStep(0);
    
    // Auto-advance demo steps
    const interval = setInterval(() => {
      setDemoStep(prev => {
        if (prev >= demoSteps.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 overflow-hidden relative">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <motion.div
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23dc2626' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Floating Orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 via-pink-400/10 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-pink-400/20 via-red-400/10 to-transparent rounded-full blur-3xl"
        />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-blue-100/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-pink-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
              POSiFine
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-6"
          >
            <a href="#features" className="text-gray-700 hover:text-blue-600 font-medium transition-colors hidden md:block">
              Features
            </a>
            <a href="#industries" className="text-gray-700 hover:text-blue-600 font-medium transition-colors hidden md:block">
              Industries
            </a>
            <a href="#pricing" className="text-gray-700 hover:text-blue-600 font-medium transition-colors hidden md:block">
              Pricing
            </a>
            <button
              onClick={() => navigate('/auth/login')}
              className="px-6 py-2.5 text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/choose-subscription')}
              className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Get Started Free
            </button>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative z-10 pt-20 pb-32 px-6"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text Content */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-block px-4 py-2 bg-gradient-to-r from-blue-100 to-pink-100 border border-blue-200 rounded-full text-sm font-medium mb-6"
                >
                  <span className="bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent">
                    🚀 Ultra-Fast POS • <50ms Checkout
                  </span>
                </motion.span>

                <h1 className="text-6xl lg:text-7xl font-bold leading-tight mb-6">
                  <span className="text-gray-900">Transform Your</span>
                  <br />
                  <span className="bg-gradient-to-r from-blue-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
                    Business Today
                  </span>
                </h1>

                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  Experience the future of point-of-sale with <span className="font-semibold text-blue-600">lightning-fast performance</span>.
                  Complete sales in under 50ms, manage inventory in real-time, and scale across multiple industries.
                </p>

                <div className="flex flex-wrap gap-4 mb-12">
                  <motion.button
                    onClick={() => navigate('/choose-subscription')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-semibold shadow-xl hover:shadow-2xl transition-all flex items-center gap-2"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>

                  <motion.button
                    onClick={startDemo}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-white/80 backdrop-blur-xl border-2 border-blue-200 text-gray-700 rounded-full font-semibold hover:border-pink-300 transition-all flex items-center gap-2 group"
                  >
                    <Play className="w-5 h-5 text-blue-600" />
                    Watch Demo
                  </motion.button>
                </div>

                {/* Trust Indicators */}
                <div className="flex items-center gap-8 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>15-day free trial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>Cancel anytime</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right: Animated Dashboard Preview */}
            <div className="relative">
              <motion.div
                style={{
                  x: mousePosition.x,
                  y: mousePosition.y
                }}
                className="relative"
              >
                {/* Main Dashboard Panel */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-blue-100"
                >
                  {/* Mock Dashboard Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-pink-600 rounded-xl" />
                      <div>
                        <div className="h-3 w-24 bg-gray-200 rounded" />
                        <div className="h-2 w-16 bg-gray-100 rounded mt-1" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg" />
                      <div className="w-8 h-8 bg-gray-100 rounded-lg" />
                    </div>
                  </div>

                  {/* Mock Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200"
                    >
                      <div className="text-xs text-blue-600 mb-1">Revenue</div>
                      <div className="text-2xl font-bold text-blue-700">
                        $12,450
                      </div>
                      <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>+12.5%</span>
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-4 border border-pink-200"
                    >
                      <div className="text-xs text-pink-600 mb-1">Orders</div>
                      <div className="text-2xl font-bold text-pink-700">
                        1,247
                      </div>
                      <div className="flex items-center gap-1 text-xs text-pink-600 mt-1">
                        <Activity className="w-3 h-3" />
                        <span>Live</span>
                      </div>
                    </motion.div>
                  </div>

                  {/* Mock Chart */}
                  <div className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 400 100">
                      <motion.path
                        d="M 0 80 Q 50 60, 100 70 T 200 65 T 300 55 T 400 50"
                        fill="none"
                        stroke="url(#heroChartGradient)"
                        strokeWidth="3"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                      />
                      <defs>
                        <linearGradient id="heroChartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="50%" stopColor="#ec4899" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </motion.div>

                {/* Floating Performance Badge */}
                <motion.div
                  initial={{ opacity: 0, x: 20, y: -20 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="absolute -top-8 -right-8 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-4 shadow-xl"
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold">< 50ms</div>
                    <div className="text-xs opacity-90">Checkout Speed</div>
                  </div>
                </motion.div>

                {/* Floating Security Badge */}
                <motion.div
                  initial={{ opacity: 0, x: -20, y: 20 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="absolute -bottom-8 -left-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-4 shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6" />
                    <div>
                      <div className="text-sm font-bold">Enterprise</div>
                      <div className="text-xs opacity-90">Security</div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Demo Modal */}
      <AnimatePresence>
        {showDemoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowDemoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowDemoModal(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Demo Content */}
              <div className="p-8">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    POSiFine Demo Walkthrough
                  </h2>
                  <p className="text-gray-600">
                    See how our platform transforms business operations
                  </p>
                </div>

                {/* Demo Steps */}
                <div className="grid grid-cols-6 gap-4 mb-8">
                  {demoSteps.map((step, index) => (
                    <motion.div
                      key={index}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        index === demoStep
                          ? 'border-blue-500 bg-blue-50'
                          : index < demoStep
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                      animate={{
                        scale: index === demoStep ? 1.05 : 1
                      }}
                    >
                      <div className="text-center">
                        <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === demoStep
                            ? 'bg-blue-500 text-white'
                            : index < demoStep
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {index < demoStep ? <Check className="w-4 h-4" /> : index + 1}
                        </div>
                        <div className="text-xs font-medium text-gray-700">{step.title}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Current Step Details */}
                <div className="bg-gradient-to-r from-blue-50 to-pink-50 rounded-2xl p-6 mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {demoSteps[demoStep]?.title}
                  </h3>
                  <p className="text-gray-600">
                    {demoSteps[demoStep]?.description}
                  </p>
                </div>

                {/* CTA */}
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setShowDemoModal(false);
                      navigate('/choose-subscription');
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  >
                    Start Free Trial
                  </button>
                  <button
                    onClick={() => setShowDemoModal(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                  >
                    Close Demo
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Features Section */}
      <section id="features" ref={featuresRef} className="relative z-10 py-32 px-6 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-100 to-pink-100 border border-blue-200 rounded-full text-sm font-medium mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent">
                Powerful Features
              </span>
            </span>
            <h2 className="text-5xl font-bold mb-6">
              <span className="text-gray-900">Everything You Need</span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
                In One Platform
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive business management tools designed for modern enterprises
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300"
              >
                {feature.badge && (
                  <div className="absolute -top-3 -right-3 px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full shadow-lg">
                    {feature.badge}
                  </div>
                )}

                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>

                <div className="mt-6 flex items-center gap-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-blue-600">Learn more</span>
                  <ChevronRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section id="industries" className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-6">
              <span className="text-gray-900">Built for Every</span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
                Industry
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Specialized dashboards and features for different business types
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {industries.map((industry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer"
              >
                <div className="text-4xl mb-4">{industry.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{industry.name}</h3>
                <p className="text-gray-600">{industry.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 py-32 px-6 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-6">
              <span className="text-gray-900">Loved by</span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
                Businesses
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-bold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.role}, {testimonial.company}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-r from-blue-600 via-pink-600 to-red-600 rounded-[3rem] p-16 overflow-hidden shadow-2xl"
          >
            <div className="relative z-10 text-center text-white">
              <h2 className="text-5xl font-bold mb-6">
                Ready to Transform Your Business?
              </h2>
              <p className="text-xl mb-10 max-w-2xl mx-auto opacity-90">
                Join thousands of businesses using POSiFine to streamline operations and boost revenue
              </p>

              <div className="flex flex-wrap gap-4 justify-center">
                <motion.button
                  onClick={() => navigate('/choose-subscription')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-5 bg-white text-blue-600 rounded-full font-bold text-lg shadow-2xl hover:shadow-3xl transition-all flex items-center gap-2"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </motion.button>

                <motion.button
                  onClick={startDemo}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-5 bg-white/10 backdrop-blur-xl text-white border-2 border-white/30 rounded-full font-bold text-lg hover:bg-white/20 transition-all flex items-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Watch Demo
                </motion.button>
              </div>

              <p className="text-white/80 text-sm mt-8">
                No credit card required • 15-day free trial • Cancel anytime
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-pink-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">POSiFine</span>
            </div>

            <p className="text-gray-400 text-sm">
              © 2024 POSiFine. All rights reserved.
            </p>

            <div className="flex items-center gap-6 text-sm text-gray-400">
              <button onClick={() => navigate('/choose-subscription')} className="hover:text-white transition-colors">
                Pricing
              </button>
              <button onClick={() => navigate('/auth/login')} className="hover:text-white transition-colors">
                Login
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}