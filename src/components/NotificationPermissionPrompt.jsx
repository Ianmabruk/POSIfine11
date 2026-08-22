import { useState, useEffect } from 'react';
import { Bell, X, Check, Smartphone, Monitor } from 'lucide-react';
import PushNotificationService from '../services/pushNotificationService';

export default function NotificationPermissionPrompt({ onClose }) {
  const [status, setStatus] = useState('checking');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const result = await PushNotificationService.getPermissionStatus();
    if (result === 'granted') {
      setStatus('granted');
    } else if (result === 'denied') {
      setStatus('denied');
    } else {
      setStatus('prompt');
    }
  };

  const handleEnable = async () => {
    setLoading(true);
    setError('');

    try {
      const initResult = await PushNotificationService.init();
      if (!initResult.supported) {
        setError('Push notifications are not supported in this browser.');
        setLoading(false);
        return;
      }

      const result = await PushNotificationService.enableNotifications();
      if (result.success) {
        setStatus('granted');
        onClose?.();
      } else {
        setError(result.error || 'Failed to enable notifications.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setStatus('dismissed');
    onClose?.();
  };

  if (status === 'granted') {
    return null;
  }

  if (status === 'denied') {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 text-sm">Notifications Disabled</h4>
            <p className="text-xs text-gray-600 mt-1">
              You've blocked notifications for POSify. To receive alerts for sales and low stock, enable notifications in your browser settings.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (status === 'dismissed') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
          <Bell className="w-5 h-5 text-primary-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 text-sm">Stay Updated with POSify</h4>
          <p className="text-xs text-gray-600 mt-1">
            Receive alerts for new sales, low stock, and important activity even when you're away from the dashboard.
          </p>
          {error && (
            <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded-lg">{error}</p>
          )}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleEnable}
              disabled={loading}
              className="flex-1 px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enabling...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Enable Notifications
                </>
              )}
            </button>
            <button
              onClick={handleDismiss}
              disabled={loading}
              className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
