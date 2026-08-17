import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, Shield, Bell, ArrowLeft } from 'lucide-react';

export default function MobileCashierSettings() {
  const navigate = useNavigate();

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/mobile/cashier')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        <button className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <Settings className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Preferences</p>
            <p className="text-sm text-gray-500">Display and sound settings</p>
          </div>
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <Bell className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Notifications</p>
            <p className="text-sm text-gray-500">Alert preferences</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/auth/login')}
          className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-red-50 transition-colors text-red-600"
        >
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="font-medium">Logout</p>
            <p className="text-sm text-red-500">Sign out of your account</p>
          </div>
        </button>
      </div>
    </div>
  );
}
