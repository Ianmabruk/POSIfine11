import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Crown, CreditCard, Calendar, X, Sparkles } from 'lucide-react';

export default function TrialExpiryModal() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [trialStatus, setTrialStatus] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    checkTrialStatus();
    
    // Check trial status every hour
    const interval = setInterval(checkTrialStatus, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user]);

  const checkTrialStatus = () => {
    if (!user || !user.trialEndDate) return;

    const now = new Date();
    const trialEnd = new Date(user.trialEndDate);
    const timeDiff = trialEnd.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    setDaysRemaining(daysDiff);

    if (daysDiff <= 0 && user.isTrialActive && !user.hasActiveSubscription) {
      // Trial has expired
      setTrialStatus('expired');
      setShowModal(true);
    } else if (daysDiff <= 3 && user.isTrialActive && !user.hasActiveSubscription) {
      // Trial expiring soon
      setTrialStatus('expiring');
      setShowModal(true);
    }
  };

  const handleUpgrade = () => {
    navigate('/choose-subscription', { 
      state: { 
        fromTrial: true,
        currentPlan: user.plan 
      } 
    });
  };

  const handleContinueTrial = () => {
    setShowModal(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!showModal || !trialStatus) return null;

  const isExpired = trialStatus === 'expired';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={isExpired ? undefined : () => setShowModal(false)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button - Only show if trial not expired */}
          {!isExpired && (
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                isExpired 
                  ? 'bg-gradient-to-br from-red-500 to-red-600' 
                  : 'bg-gradient-to-br from-yellow-500 to-orange-500'
              }`}>
                {isExpired ? (
                  <AlertTriangle className="w-8 h-8 text-white" />
                ) : (
                  <Calendar className="w-8 h-8 text-white" />
                )}
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isExpired ? 'Trial Expired' : 'Trial Ending Soon'}
              </h2>
              
              <p className="text-gray-600">
                {isExpired 
                  ? 'Your free trial has ended. Please subscribe to continue using POSiFine.'
                  : `Your free trial ends in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. Upgrade now to avoid interruption.`
                }
              </p>
            </div>

            {/* Trial Info */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Current Plan</span>
                <span className="text-sm font-bold text-gray-900 capitalize">{user.plan || 'Basic'}</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Trial Started</span>
                <span className="text-sm text-gray-700">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Trial Ends</span>
                <span className={`text-sm font-bold ${isExpired ? 'text-red-600' : 'text-orange-600'}`}>
                  {user.trialEndDate ? new Date(user.trialEndDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            {/* Benefits */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Continue enjoying:
              </h3>
              <div className="space-y-2">
                {[
                  'Ultra-fast <50ms checkout',
                  'Real-time inventory sync',
                  'Advanced analytics',
                  'Multi-user access',
                  'Industry-specific features'
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleUpgrade}
                className="w-full py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                <Crown className="w-5 h-5" />
                {isExpired ? 'Subscribe Now' : 'Upgrade Now'}
              </button>

              {!isExpired && (
                <button
                  onClick={handleContinueTrial}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Continue Trial
                </button>
              )}

              <button
                onClick={handleLogout}
                className="w-full py-3 text-gray-500 hover:text-gray-700 transition-colors text-sm"
              >
                Sign Out
              </button>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                No credit card required • Cancel anytime • Full feature access
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook to check trial status and show modal
export function useTrialStatus() {
  const { user } = useAuth();
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [isTrialExpired, setIsTrialExpired] = useState(false);

  useEffect(() => {
    if (!user || !user.trialEndDate) return;

    const checkStatus = () => {
      const now = new Date();
      const trialEnd = new Date(user.trialEndDate);
      const timeDiff = trialEnd.getTime() - now.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      const expired = daysDiff <= 0 && user.isTrialActive && !user.hasActiveSubscription;
      const expiringSoon = daysDiff <= 3 && user.isTrialActive && !user.hasActiveSubscription;

      setIsTrialExpired(expired);
      setShouldShowModal(expired || expiringSoon);
    };

    checkStatus();
    
    // Check every hour
    const interval = setInterval(checkStatus, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user]);

  return {
    shouldShowModal,
    isTrialExpired,
    daysRemaining: user?.trialEndDate ? Math.ceil((new Date(user.trialEndDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0
  };
}

// Component to wrap around protected routes
export function TrialProtectedRoute({ children }) {
  const { shouldShowModal, isTrialExpired } = useTrialStatus();

  return (
    <>
      {children}
      {shouldShowModal && <TrialExpiryModal />}
      {isTrialExpired && (
        <div className="fixed inset-0 z-[9998] bg-white/90 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center p-8">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Trial Expired</h2>
            <p className="text-gray-600 mb-4">Please subscribe to continue using POSiFine.</p>
          </div>
        </div>
      )}
    </>
  );
}