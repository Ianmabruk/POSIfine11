import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bell, CreditCard, User, Shield, Check, Upload, Image as ImageIcon } from 'lucide-react';
import { settings as settingsApi } from '../../services/api';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(user?.plan || 'ultra');
  const [appSettings, setAppSettings] = useState({});
  const [logoPreview, setLogoPreview] = useState(null);
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsApi.get();
      setAppSettings(data);
      if (data.logo) setLogoPreview(data.logo);
    } catch (error) {
      console.error('Failed to load settings:', error);
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
          await settingsApi.update({ ...appSettings, logo: base64 });
          setAppSettings({ ...appSettings, logo: base64 });
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
          await updateUser({ ...user, profilePicture: base64 });
        } catch (error) {
          console.error('Failed to save profile picture:', error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const plans = [
    { id: 'basic', name: 'Basic Package', price: 900, features: ['Cashier Dashboard', 'Sales Tracking', 'Product Management', 'Basic Reports'] },
    { id: 'ultra', name: 'Ultra Package', price: 1600, features: ['Admin Dashboard', 'Recipe Builder', 'User Management', 'Advanced Analytics', 'Expense Tracking'] }
  ];

  const handleChangePlan = async () => {
    const plan = plans.find(p => p.id === selectedPlan);
    const role = selectedPlan === 'ultra' ? 'admin' : 'cashier';
    await updateUser({ ...user, role, plan: selectedPlan, price: plan.price });
    setShowPlanModal(false);
    setTimeout(() => window.location.href = role === 'admin' ? '/admin' : '/cashier', 500);
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

        {/* Subscription */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold">Subscription</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Current Plan</label>
              <p className="font-medium capitalize">{user?.plan || 'Ultra'} Package</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Price</label>
              <p className="font-medium">KSH {user?.price || 1600}/month</p>
            </div>
            <button onClick={() => setShowPlanModal(true)} className="btn-secondary text-sm">Change Plan</button>
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

        {/* Security */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold">Security</h3>
          </div>
          <div className="space-y-3">
            <button className="btn-secondary text-sm w-full">Change Password</button>
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

      {/* Change Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">Change Your Plan</h3>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`card cursor-pointer transition-all ${
                    selectedPlan === plan.id ? 'ring-4 ring-blue-600 bg-blue-50' : 'hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xl font-bold">{plan.name}</h4>
                    {selectedPlan === plan.id && <Check className="w-6 h-6 text-blue-600" />}
                  </div>
                  <p className="text-3xl font-bold mb-4">KSH {plan.price}<span className="text-sm text-gray-600">/month</span></p>
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={handleChangePlan} className="btn-primary flex-1">Confirm Change</button>
              <button onClick={() => setShowPlanModal(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
