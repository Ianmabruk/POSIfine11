import React, { useMemo, useState } from 'react';
import { Banknote, BookOpen, Users } from 'lucide-react';
import CashierPOS from '../CashierPOS';
import CashierPOSLayout from '../../components/cashier/CashierPOSLayout';
import { useDayStats } from '../../hooks/useDayStats';

const DEFAULT_STATS = { feesCollected: 0, transactions: 0 };

export default function SchoolCashierPOS() {
  const [studentSearch, setStudentSearch] = useState('');
  const { stats, error } = useDayStats(DEFAULT_STATS);
  const formatKes = useMemo(() => new Intl.NumberFormat('en-KE'), []);
  const categories = ['💰 Term Fees', '🍽️ Canteen', '👕 Uniforms', '📚 Books', '✏️ Supplies'];

  return (
    <CashierPOSLayout
      title="School POS"
      subtitle="Student & Fee Management"
      icon={BookOpen}
      theme={{
        pageBg: 'min-h-screen bg-gradient-to-br from-blue-50 to-blue-100',
        headerBg: 'bg-blue-700 text-white shadow-lg',
        iconWrap: 'w-12 h-12 rounded-xl bg-blue-800/70 flex items-center justify-center text-blue-100 shadow',
        titleClass: 'text-2xl font-bold text-white',
        subtitleClass: 'text-blue-200 text-sm',
        footerBg: 'bg-blue-700 text-white py-4 text-center'
      }}
      stats={{
        label: 'Fees Collected Today',
        value: `${formatKes.format(stats.feesCollected)} KES`,
        meta: `${stats.transactions} transactions`,
        valueClass: 'text-emerald-200'
      }}
      errorMessage={error}
      topSections={
        <>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
            <div className="relative">
              <Users size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" />
              <input
                type="text"
                placeholder="Search student by name, admission number, or class..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition flex items-center justify-center gap-2">
              <Banknote size={18} />
              Fee Slip
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map((category, index) => (
              <span
                key={category}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                  index === 0
                    ? 'bg-blue-600 text-white border-blue-500'
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
        <p className="text-sm">Student records linked • Receipt generation • Year-end reports</p>
      }
    >
      <CashierPOS businessType="school" />
    </CashierPOSLayout>
  );
}
