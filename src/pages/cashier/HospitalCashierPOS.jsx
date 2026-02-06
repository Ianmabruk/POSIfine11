import React, { useMemo, useState } from 'react';
import { Clock, Heart, Search } from 'lucide-react';
import CashierPOS from '../CashierPOS';
import CashierPOSLayout from '../../components/cashier/CashierPOSLayout';
import { useDayStats } from '../../hooks/useDayStats';

const DEFAULT_STATS = { revenue: 0, patients: 0 };

export default function HospitalCashierPOS() {
  const [patientId, setPatientId] = useState('');
  const { stats, error } = useDayStats(DEFAULT_STATS);
  const formatKes = useMemo(() => new Intl.NumberFormat('en-KE'), []);

  const categories = ['🏥 Services', '💊 Medicines', '🧪 Lab Tests', '📋 Procedures'];

  return (
    <CashierPOSLayout
      title="Hospital POS"
      subtitle="Patient Billing System"
      icon={Heart}
      theme={{
        pageBg: 'min-h-screen bg-gradient-to-br from-red-50 to-red-100',
        headerBg: 'bg-red-700 text-white shadow-lg',
        iconWrap: 'w-12 h-12 rounded-xl bg-red-800/70 flex items-center justify-center text-red-100 shadow',
        titleClass: 'text-2xl font-bold text-white',
        subtitleClass: 'text-red-200 text-sm',
        footerBg: 'bg-red-700 text-white py-4 text-center'
      }}
      stats={{
        label: 'Daily Revenue',
        value: `${formatKes.format(stats.revenue)} KES`,
        meta: `${stats.patients} patients served`,
        valueClass: 'text-emerald-200'
      }}
      errorMessage={error}
      topSections={
        <>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-red-300" />
              <input
                type="text"
                placeholder="Search patient by ID or name..."
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition flex items-center justify-center gap-2">
              <Clock size={18} />
              Recent Patients
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map((category, index) => (
              <span
                key={category}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                  index === 0
                    ? 'bg-red-600 text-white border-red-500'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                {category}
              </span>
            ))}
          </div>
        </>
      }
      footer={
        <p className="text-sm">Patient records integrated • Invoice generation • Real-time inventory tracking</p>
      }
    >
      <CashierPOS businessType="hospital" />
    </CashierPOSLayout>
  );
}
