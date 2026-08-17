
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import { Bell, User, Shield, Check, Upload, Image as ImageIcon, Users, RefreshCw, Settings, Eye, EyeOff, Lock } from 'lucide-react';
import { settings as settingsApi, auth } from '../../services/api';


export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [appSettings, setAppSettings] = useState({});
  const [logoPreview, setLogoPreview] = useState(null);
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || null);
  
  // New settings for cashier user management and product sync
  const [cashierUserManagement, setCashierUserManagement] = useState(true);
  const [realTimeProductSync, setRealTimeProductSync] = useState(true);

  // Change password modal state
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);


  const loadSettings = async () => {
    try {
      const data = await settingsApi.get();
      setAppSettings(data);
      if (data.logo) setLogoPreview(data.logo);
      
      // Load new settings with defaults
      setCashierUserManagement(data.cashierUserManagement !== false); // Default to true
      setRealTimeProductSync(data.realTimeProductSync !== false); // Default to true
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      const updatedSettings = { ...appSettings, ...newSettings };
      await settingsApi.update(updatedSettings);
      setAppSettings(updatedSettings);
      if (updatedSettings.logo) {
        setLogoPreview(updatedSettings.logo);
        localStorage.setItem('appLogo', updatedSettings.logo);
      }
      window.dispatchEvent(new CustomEvent('settingsChanged', { detail: updatedSettings }));
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  };

  const handleToggleCashierUserManagement = async () => {
    const newValue = !cashierUserManagement;
    setCashierUserManagement(newValue);
    const success = await saveSettings({ cashierUserManagement: newValue });
    if (success) {
      // Broadcast change to other components
      window.dispatchEvent(new CustomEvent('settingsChanged', { 
        detail: { cashierUserManagement: newValue } 
      }));
      alert(`✅ Cashier User Management ${newValue ? 'ENABLED' : 'DISABLED'}`);
    } else {
      // Revert on failure
      setCashierUserManagement(!newValue);
      alert('❌ Failed to save setting. Please try again.');
    }
  };

  const handleToggleRealTimeProductSync = async () => {
    const newValue = !realTimeProductSync;
    setRealTimeProductSync(newValue);
    const success = await saveSettings({ realTimeProductSync: newValue });
    if (success) {
      window.dispatchEvent(new CustomEvent('settingsChanged', { 
        detail: { realTimeProductSync: newValue } 
      }));
      alert(`✅ Real-time Product Sync ${newValue ? 'ENABLED' : 'DISABLED'}`);
    } else {
      setRealTimeProductSync(!newValue);
      alert('❌ Failed to save setting. Please try again.');
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        setLogoPreview(base64);
        try {
          const nextSettings = { ...appSettings, logo: base64 };
          await settingsApi.update(nextSettings);
          setAppSettings(nextSettings);
          localStorage.setItem('appLogo', base64);
          window.dispatchEvent(new CustomEvent('settingsChanged', { detail: nextSettings }));
        } catch (error) {
          console.error('Failed to save logo:', error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        setProfilePicture(base64);
        try {
          const updated = { ...user, profilePicture: base64, profile_picture: base64 };
          await updateUser(updated);
          // Persist in localStorage so it survives page refreshes until next API load
          const cached = JSON.parse(localStorage.getItem('user') || '{}');
          cached.profilePicture = base64;
          cached.profile_picture = base64;
          localStorage.setItem('user', JSON.stringify(cached));
        } catch (error) {
          console.error('Failed to save profile picture:', error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordForm.currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    if (!passwordForm.newPassword) {
      setError('New password is required');
      return;
    }
    if (passwordForm.newPassword && passwordForm.newPassword.length < 4) {
      setPasswordError('New password must be at least 4 characters');
      return;
    }
    if (passwordForm.newPassword && passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (passwordForm.newPin && passwordForm.newPin.length < 4) {
      setPasswordError('PIN must be at least 4 digits');
      return;
    }

    setPasswordLoading(true);
    try {
      const result = await auth.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword || undefined,
        passwordForm.newPassword ? passwordForm.newPassword : undefined
      );
      const changedWhat = [];
      if (passwordForm.newPassword) changedWhat.push('Password');
      if (passwordForm.newPin) changedWhat.push('PIN');
      setPasswordSuccess(`${changedWhat.join(' and ')} changed successfully! Redirecting to login...`);
      // Wait 2 seconds so user sees notification, then logout and redirect
      setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-sm text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Info */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold">Account Information</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-700 transition">
                  <Upload className="w-3 h-3" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleProfilePictureUpload} />
                </label>
              </div>
              <div className="flex-1">
                <label className="text-sm text-gray-600">Name</label>
                <p className="font-medium">{user?.name}</p>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Role</label>
              <p className="font-medium capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

         {/* Notifications */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Notifications</h3>
          </div>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm">Email Notifications</span>
              <input type="checkbox" defaultChecked className="toggle" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm">Low Stock Alerts</span>
              <input type="checkbox" defaultChecked className="toggle" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm">Daily Sales Summary</span>
              <input type="checkbox" className="toggle" />
            </label>
          </div>
        </div>


        {/* Cashier User Management */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold">Cashier User Management</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Enable Cashier User Management</p>
                <p className="text-xs text-gray-500">Allow cashiers to add and remove users</p>
              </div>
              <button
                onClick={handleToggleCashierUserManagement}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  cashierUserManagement ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    cashierUserManagement ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className={`p-3 rounded-lg border ${
              cashierUserManagement 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <p className="text-xs">
                {cashierUserManagement 
                  ? '✅ Cashiers can add and remove users when enabled'
                  : '❌ Cashiers cannot add or remove users when disabled'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Product Sync */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">

            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold">Real-time Product Sync</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Enable Real-time Sync</p>
                <p className="text-xs text-gray-500">Automatically sync products between admin and cashier dashboards</p>
              </div>
              <button
                onClick={handleToggleRealTimeProductSync}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  realTimeProductSync ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    realTimeProductSync ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className={`p-3 rounded-lg border ${
              realTimeProductSync 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <p className="text-xs">
                {realTimeProductSync 
                  ? '✅ Products will sync in real-time across all dashboards'
                  : '❌ Products will not sync automatically across dashboards'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold">Security</h3>
          </div>
          <div className="space-y-3">
            <button onClick={() => { setShowChangePasswordModal(true); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setPasswordError(''); setPasswordSuccess(''); }} className="btn-secondary text-sm w-full">Change Password</button>
            <button className="btn-secondary text-sm w-full">Enable 2FA</button>
          </div>
        </div>

        {/* Screen Lock Logo */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold">Screen Lock Logo</h3>
          </div>
          <div className="space-y-3">
            {logoPreview && (
              <div className="flex justify-center">
                <img src={logoPreview} alt="Logo Preview" className="w-32 h-32 object-contain rounded-lg border-2 border-gray-200" />
              </div>
            )}
            <label className="btn-secondary text-sm w-full cursor-pointer flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Logo
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
            <p className="text-xs text-gray-500 text-center">This logo will appear on the screen lock</p>
          </div>
        </div>
      </div>

      {/* Change Password / PIN Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Lock className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-xl font-bold">Change Password / PIN</h3>
            </div>

            {passwordSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm font-medium">
                ✅ {passwordSuccess}
              </div>
            )}

            {passwordError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                ❌ {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Current Password *</label>
                <div className="relative mt-1">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg pr-10"
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">New Password</label>
                <div className="relative mt-1">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg pr-10"
                    placeholder="Enter new password (min 4 chars)"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg mt-1"
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                />
              </div>

              <p className="text-xs text-gray-500">Your email stays the same. All your data is preserved. You will be redirected to login after changing.</p>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={passwordLoading || !!passwordSuccess} className="btn-primary flex-1 disabled:opacity-50">
                  {passwordLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setShowChangePasswordModal(false)} disabled={!!passwordSuccess} className="btn-secondary disabled:opacity-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
