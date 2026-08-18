import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { settings as settingsApi } from '../../services/api';
import { Settings, LogOut, Shield, Bell, ArrowLeft, Save, Loader2 } from 'lucide-react';

export default function MobileAdminSettings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cashierUserManagement, setCashierUserManagement] = useState(true);
  const [realTimeProductSync, setRealTimeProductSync] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsApi.get();
      setSettings(data || {});
      setCashierUserManagement(data?.cashierUserManagement !== false);
      setRealTimeProductSync(data?.realTimeProductSync !== false);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (key, value) => {
    setSaving(true);
    setMessage('');
    try {
      const next = { ...settings, [key]: value };
      await settingsApi.update(next);
      setSettings(next);
      setMessage('Settings saved');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/mobile')} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        </div>
        <div className="text-center py-8 text-gray-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/mobile')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
      </div>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-sm">
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Cashier User Management</p>
                <p className="text-sm text-gray-500">Allow managing cashier accounts</p>
              </div>
            </div>
            <button
              onClick={() => {
                const next = !cashierUserManagement;
                setCashierUserManagement(next);
                saveSettings('cashierUserManagement', next);
              }}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${cashierUserManagement ? 'bg-primary-600' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${cashierUserManagement ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Real-time Product Sync</p>
                <p className="text-sm text-gray-500">Sync product updates across devices</p>
              </div>
            </div>
            <button
              onClick={() => {
                const next = !realTimeProductSync;
                setRealTimeProductSync(next);
                saveSettings('realTimeProductSync', next);
              }}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${realTimeProductSync ? 'bg-primary-600' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${realTimeProductSync ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <Bell className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Notifications</p>
                <p className="text-sm text-gray-500">Alerts and reminders</p>
              </div>
            </div>
            <button
              onClick={() => saveSettings('notifications', !settings.notifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.notifications !== false ? 'bg-primary-600' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.notifications !== false ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        <div className="px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Security</p>
            <p className="text-sm text-gray-500">Password and access control</p>
          </div>
        </div>
        <div className="px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <Settings className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">General Settings</p>
            <p className="text-sm text-gray-500">Business profile and preferences</p>
          </div>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 rounded-xl p-4 font-medium hover:bg-red-100 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </button>
    </div>
  );
}
