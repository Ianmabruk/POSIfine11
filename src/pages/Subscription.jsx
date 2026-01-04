import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Check, Crown, Zap } from 'lucide-react';

export default function Subscription() {
  const [selected, setSelected] = useState('ultra');
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const plans = [
    {
      id: 'basic',
      name: 'Basic Package',
      price: 900,
      icon: Zap,
      color: 'from-green-500 to-teal-600',
      features: [
        'Cashier Dashboard Only',
        'Basic Inventory Management',
        'Sales Tracking',
        'Daily/Weekly Sales Summaries',
        'Basic Profit/Loss View',
        'Limited Email Notifications',
        'Record Products Sold',
        'Single User Access'
      ]
    },
    {
      id: 'ultra',
      name: 'Ultra Package',
      price: 1600,
      icon: Crown,
      color: 'from-blue-600 to-purple-600',
      popular: true,
      features: [
        'Admin Dashboard + Cashier POS',
        'Full Inventory Management',
        'Recipe/BOM Builder',
        'Composite Products Support',
        'Automatic Stock Deduction',
        'COGS Calculation',
        'User Management',
        'Permission Controls',
        'Expense Tracking',
        'Advanced Analytics',
        'Unlimited Users'
      ]
    }
  ];



  const handleSubscribe = async () => {
    try {
      const plan = plans.find(p => p.id === selected);
      
      // Step 1: Create updated user object
      const updatedUser = { 
        ...user, 
        role: selected === 'ultra' ? 'admin' : 'cashier', 
        plan: selected, 
        price: plan.price, 
        active: true,
        packageType: selected // Store package type for reference
      };

      // Step 2: Update localStorage synchronously FIRST
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Step 3: Force trigger storage event to update all contexts
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('localStorageUpdated'));
      
      // Step 4: Update auth context
      await updateUser(updatedUser).catch(err => {
        console.warn('Auth context update failed, but localStorage updated:', err);
      });
      
      // Step 5: Add delay for state sync
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 6: Navigate to appropriate dashboard based on package
      let targetPath;
      if (selected === 'ultra') {
        // Ultra package: Admin dashboard first
        targetPath = '/admin';
      } else {
        // Basic package: Direct to cashier dashboard
        targetPath = '/cashier';
      }
      
      // Use window.location.href for more reliable redirect in production
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        window.location.href = targetPath;
      } else {
        navigate(targetPath, { replace: true });
      }
      
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to update subscription. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-6 md:py-12 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 md:mb-12 animate-fade-in">
          <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-gray-600 text-base md:text-lg">Select the perfect plan for your business needs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                className={`card cursor-pointer transition-all transform hover:scale-105 relative ${
                  selected === plan.id 
                    ? 'ring-4 ring-blue-600 shadow-2xl bg-gradient-to-br from-blue-50 to-purple-50' 
                    : 'hover:shadow-xl'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-3 mb-3 md:mb-4">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold">{plan.name}</h3>
                </div>
                
                <div className="mb-4 md:mb-6">
                  <span className="text-3xl md:text-4xl font-bold">KSH {plan.price}</span>
                  <span className="text-gray-600 text-sm md:text-base">/month</span>
                </div>
                
                <ul className="space-y-2 md:space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-xs md:text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="text-center animate-fade-in">
          <button 
            onClick={handleSubscribe} 
            className="btn-primary w-full md:w-auto px-8 md:px-12 py-3 md:py-4 text-base md:text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
          >
            Continue to Dashboard
          </button>
          <p className="text-xs md:text-sm text-gray-500 mt-3 md:mt-4">Start your journey today • Cancel anytime</p>
        </div>
      </div>
    </div>
  );
}
