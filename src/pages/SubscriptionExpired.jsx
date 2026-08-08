import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SubscriptionExpired() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            Trial Expired
          </h1>
          
          <p className="text-slate-500 mb-8 leading-relaxed">
            Your 30-day free trial has ended. Subscribe now to continue accessing all features and keep your data safe.
          </p>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8">
            <h3 className="font-bold text-slate-900 mb-2">What happens now?</h3>
            <ul className="text-sm text-slate-600 text-left space-y-2">
              <li>• Your data is securely preserved</li>
              <li>• Choose a plan that fits your business</li>
              <li>• Instant access after payment</li>
              <li>• No data loss during transition</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/choose-subscription')}
              className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-4"
            >
              Subscribe Now
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="btn-secondary inline-flex items-center justify-center gap-2 px-8 py-4"
            >
              <RefreshCw className="w-4 h-4" />
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
