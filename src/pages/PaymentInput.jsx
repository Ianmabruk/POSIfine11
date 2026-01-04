import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Smartphone } from 'lucide-react';
import { auth as apiService } from '../services/api';

export default function PaymentInput() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const plan = location.state?.plan || JSON.parse(localStorage.getItem('selectedPlan') || 'null');

  const [paymentData, setPaymentData] = useState({
    phoneNumber: '',
    email: '',
    fullName: ''
  });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!plan) {
      navigate('/plans');
    }
  }, [plan, navigate]);

  if (!plan) {
    return null;
  }

  const handlePayment = async (e) => {
    e.preventDefault();
    setError('');
    setProcessing(true);

    try {
      if (!paymentData.email || !paymentData.fullName) {
        setError('Please fill in your name and email');
        setProcessing(false);
        return;
      }
      
      if (!paymentData.phoneNumber || paymentData.phoneNumber.length < 10) {
        setError('Please enter a valid phone number');
        setProcessing(false);
        return;
      }

      const userData = {
        email: paymentData.email,
        name: paymentData.fullName,
        password: 'changeme123',
        plan: plan.id,
        role: plan.id === 'ultra' ? 'admin' : 'cashier',
        active: true,
        amount: plan.price,
        paymentMethod: 'mpesa',
        accountNumber: paymentData.phoneNumber,
        mpesaTarget: '0115407200'
      };

      const result = await apiService.signupWithPayment(userData);
      
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      
      await login(result);
      
      // Redirect to dashboard immediately after payment
      if (plan.id === 'ultra') {
        // For Ultra plan, check if they should be admin or cashier
        navigate('/main.admin', { replace: true });
      } else {
        // Basic plan goes to basic dashboard
        navigate('/dashboard', { replace: true });
      }

    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Complete Payment
          </h1>
          <p className="text-gray-600">
            {plan.name} - KSH {plan.price.toLocaleString()}
          </p>
        </div>

        <form onSubmit={handlePayment} className="space-y-6">
          {/* User Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                value={paymentData.fullName}
                onChange={(e) => setPaymentData({ ...paymentData, fullName: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                value={paymentData.email}
                onChange={(e) => setPaymentData({ ...paymentData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500"
                placeholder="john@example.com"
                required
              />
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">Payment Method</label>
            <div className="p-4 rounded-lg border-2 border-green-500 bg-green-50 flex items-center gap-3">
              <Smartphone className="w-6 h-6 text-green-600" />
              <div>
                <span className="text-sm font-medium block">M-Pesa Payment</span>
                <span className="text-xs text-gray-600">Send payment to: 0115407200</span>
              </div>
            </div>
          </div>

          {/* Payment Fields */}
          <div>
            <label className="block text-sm font-medium mb-2">Your Phone Number</label>
            <input
              type="tel"
              value={paymentData.phoneNumber}
              onChange={(e) => setPaymentData({ ...paymentData, phoneNumber: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-green-500"
              placeholder="0712345678"
              required
            />
            <p className="text-xs text-gray-600 mt-1">Enter the phone number you'll send payment from</p>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={processing}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
          >
            {processing ? 'Processing Payment...' : `Send KSH ${plan.price.toLocaleString()} to 0115407200`}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/plans')}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Back to Plans
          </button>
        </div>
      </div>
    </div>
  );
}