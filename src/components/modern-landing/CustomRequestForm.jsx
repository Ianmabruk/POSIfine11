import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export default function CustomRequestForm({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    businessName: '',
    industry: '',
    email: '',
    phone: '',
    expectedUsers: '',
    expectedBranches: '',
    featuresNeeded: '',
    additionalNotes: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const industries = [
    'Hospital',
    'School',
    'Manufacturer',
    'Government Institution',
    'Warehouse',
    'Hardware Store',
    'Electronics Store',
    'Supermarket',
    'Restaurant',
    'Hotel',
    'Pharmacy',
    'Other',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        businessName: formData.businessName,
        contactName: formData.businessName,
        email: formData.email,
        phone: formData.phone,
        industry: formData.industry,
        expectedUsers: formData.expectedUsers ? Number(formData.expectedUsers) : undefined,
        expectedBranches: formData.expectedBranches ? Number(formData.expectedBranches) : undefined,
        featuresNeeded: formData.featuresNeeded,
        additionalNotes: formData.additionalNotes,
      };
      const response = await api.auth.customPlanRequest(payload);
      setSuccess(true);
      setTimeout(() => {
        if (onSubmit) onSubmit(response.data);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-success to-emerald-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Request Custom Solution</h2>
              <p className="text-sm text-slate-500">For specialized business workflows</p>
            </div>
          </div>

          {success ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Request Submitted!</h3>
              <p className="text-slate-600">Our team will contact you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="input-label">Business Name *</label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="input"
                    placeholder="Your Business Name"
                    required
                  />
                </div>

                <div>
                  <label className="input-label">Industry *</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select Industry</option>
                    {industries.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="input-label">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                    placeholder="contact@business.com"
                    required
                  />
                </div>

                <div>
                  <label className="input-label">Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                    placeholder="+254 7XX XXX XXX"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="input-label">Expected Users</label>
                  <input
                    type="number"
                    value={formData.expectedUsers}
                    onChange={(e) => setFormData({ ...formData, expectedUsers: e.target.value })}
                    className="input"
                    placeholder="10"
                  />
                </div>

                <div>
                  <label className="input-label">Expected Branches</label>
                  <input
                    type="number"
                    value={formData.expectedBranches}
                    onChange={(e) => setFormData({ ...formData, expectedBranches: e.target.value })}
                    className="input"
                    placeholder="2"
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Features Needed</label>
                <textarea
                  value={formData.featuresNeeded}
                  onChange={(e) => setFormData({ ...formData, featuresNeeded: e.target.value })}
                  className="input min-h-[100px] resize-none"
                  placeholder="List the features you need for your business..."
                />
              </div>

              <div>
                <label className="input-label">Additional Notes</label>
                <textarea
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                  className="input min-h-[80px] resize-none"
                  placeholder="Any other requirements or questions..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-success to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Submit Request <Send className="w-4 h-4" />
                    </span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}