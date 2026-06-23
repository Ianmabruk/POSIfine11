import { AlertCircle, X } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function SubscriptionReminderBar({ user }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !user) return null;

  const startDate = user?.serviceStartDate ? new Date(user.serviceStartDate) : null;
  const daysUsed = user?.daysUsed || 0;
  const plan = user?.plan || '';
  const trialDays = 30;
  const daysRemaining = Math.max(0, trialDays - daysUsed);
  
  if (daysRemaining > 7) return null;

  const isExpired = daysRemaining === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full px-4 py-3 flex items-start justify-between gap-3 ${
        isExpired 
          ? 'bg-red-50 border-b border-red-100' 
          : 'bg-amber-50 border-b border-amber-100'
      }`}
    >
      <div className="flex items-start gap-3 flex-1 max-w-7xl mx-auto">
        <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isExpired ? 'text-red-500' : 'text-amber-500'}`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${isExpired ? 'text-red-900' : 'text-amber-900'}`}>
            {isExpired 
              ? `Your ${plan} plan has expired. Please renew to continue.`
              : `Your ${plan} plan expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Consider upgrading.`
            }
          </p>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className={`flex-shrink-0 ${isExpired ? 'text-red-400 hover:text-red-600' : 'text-amber-400 hover:text-amber-600'}`}
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
