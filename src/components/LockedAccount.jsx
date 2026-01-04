import { Lock, Mail, Phone } from 'lucide-react';

export default function LockedAccount() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center border border-red-200">
        <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full mx-auto mb-6 flex items-center justify-center">
          <Lock className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-2xl font-bold text-red-600 mb-4">Account Suspended</h1>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 font-medium mb-2">Out of credit</p>
          <p className="text-red-600 text-sm">
            Your account has been temporarily suspended. Please reach out to the developer to resolve this issue.
          </p>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Mail className="w-4 h-4" />
            <span className="text-sm">Contact: support@universal.com</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Phone className="w-4 h-4" />
            <span className="text-sm">Phone: +254 XXX XXX XXX</span>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Account ID: {localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : 'Unknown'}
          </p>
        </div>
      </div>
    </div>
  );
}