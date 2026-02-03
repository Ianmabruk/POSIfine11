import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Building2, Hotel, Stethoscope, ShoppingCart, Utensils, Pill,
  Fuel, GraduationCap, Dumbbell, Scissors, Store, ArrowRight, Check
} from 'lucide-react';

/**
 * BusinessTypeSelector
 * 
 * Allows Pro/Custom plan admins to select their business type.
 * This component is shown after signup or when admin needs to configure business.
 */
export default function BusinessTypeSelector() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [businessTypes, setBusinessTypes] = useState([]);
  const [error, setError] = useState('');

  // Icon mapping
  const iconMap = {
    'Utensils': Utensils,
    'Hotel': Hotel,
    'Stethoscope': Stethoscope,
    'Building2': Building2,
    'ShoppingCart': ShoppingCart,
    'ChefHat': Utensils,
    'Pill': Pill,
    'Fuel': Fuel,
    'GraduationCap': GraduationCap,
    'Dumbbell': Dumbbell,
    'Scissors': Scissors,
    'Store': Store
  };

  useEffect(() => {
    // Verify user is on Pro/Custom plan
    if (!user || !['pro', 'custom'].includes(user.plan)) {
      navigate('/admin');
      return;
    }

    // If user already has business type, redirect to dashboard
    if (user.businessType || user.business_type) {
      navigate('/pro-dashboard');
      return;
    }

    loadBusinessTypes();
  }, [user, navigate]);

  const loadBusinessTypes = async () => {
    try {
      const data = await api.get('/business/business-types');
      if (data.success) {
        setBusinessTypes(data.businessTypes);
      }
    } catch (error) {
      console.error('Error loading business types:', error);
      setError('Failed to load business types. Please try again.');
    }
  };

  const handleSelectType = (businessType) => {
    setSelectedType(businessType);
  };

  const handleConfirm = async () => {
    if (!selectedType) {
      setError('Please select a business type');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await api.post('/business/select', {
        business_type: selectedType.id
      });

      if (data.success) {
        // Update user in localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          userData.businessType = selectedType.id;
          userData.business_type = selectedType.id;
          localStorage.setItem('user', JSON.stringify(userData));
        }

        // Store business type separately
        localStorage.setItem('businessType', selectedType.id);
        localStorage.setItem('selectedBusinessType', selectedType.id);

        // Redirect to pro dashboard
        console.log('✅ Business type selected:', selectedType.id);
        navigate('/pro-dashboard');
      } else {
        setError(data.error || 'Failed to set business type');
      }
    } catch (error) {
      console.error('Error setting business type:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Business Type
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select the business type that best describes your operation. This will customize your dashboard and features.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full">
            <Check className="w-5 h-5" />
            <span className="font-medium">Pro Plan Activated</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-center">
            {error}
          </div>
        )}

        {/* Business Type Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {businessTypes.map((type) => {
            const Icon = iconMap[type.icon] || Store;
            const isSelected = selectedType?.id === type.id;

            return (
              <button
                key={type.id}
                onClick={() => handleSelectType(type)}
                className={`relative p-6 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                }`}
              >
                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}

                {/* Icon */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  isSelected ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Icon className={`w-8 h-8 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{type.name}</h3>
                <p className="text-sm text-gray-600">{type.description}</p>
              </button>
            );
          })}
        </div>

        {/* Selected Type Details */}
        {selectedType && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 animate-fade-in">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {selectedType.name}
            </h3>
            <p className="text-gray-600 mb-4">{selectedType.description}</p>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Setting up...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Continue</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              <button
                onClick={() => setSelectedType(null)}
                disabled={loading}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Change Selection
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>You can change your business type later from the settings menu.</p>
        </div>
      </div>
    </div>
  );
}
