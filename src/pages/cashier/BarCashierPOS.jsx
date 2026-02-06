import React, { useMemo } from 'react';
import { Wine, Zap } from 'lucide-react';
import CashierPOS from '../CashierPOS';
import CashierPOSLayout from '../../components/cashier/CashierPOSLayout';
import { useDayStats } from '../../hooks/useDayStats';

const DEFAULT_STATS = { sales: 0, count: 0 };

export default function BarCashierPOS() {
  const { stats, error } = useDayStats(DEFAULT_STATS);
  const formatKes = useMemo(() => new Intl.NumberFormat('en-KE'), []);

  const categories = ['🍺 Beer', '🍷 Wine', '🥃 Spirits', '🧊 Mixers', '🍸 Cocktails'];

  return (
    <CashierPOSLayout
      title="Bar POS"
      subtitle="Drinks & Beverages"
      icon={Wine}
      theme={{
        pageBg: 'min-h-screen bg-gradient-to-br from-amber-900 to-amber-700',
        headerBg: 'bg-amber-900 text-white shadow-lg',
        iconWrap: 'w-12 h-12 rounded-xl bg-amber-800/80 flex items-center justify-center text-amber-200 shadow',
        titleClass: 'text-2xl font-bold text-white',
        subtitleClass: 'text-amber-200 text-sm',
        footerBg: 'bg-amber-900 text-white py-4 text-center'
      }}
      stats={{
        label: "Today's Sales",
        value: `${formatKes.format(stats.sales)} KES`,
        meta: `${stats.count} transactions`,
        valueClass: 'text-emerald-300'
      }}
      errorMessage={error}
      topSections={
        <div className="flex flex-wrap gap-3">
          {categories.map((category, index) => (
            <span
              key={category}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                index === 0
                  ? 'bg-amber-600 text-white border-amber-500'
                  : 'bg-amber-50 text-amber-900 border-amber-100'
              }`}
            >
              {category}
            </span>
          ))}
        </div>
      }
      footer={
        <div className="flex items-center justify-center gap-2">
          <Zap size={16} className="text-yellow-300" />
          <p className="text-sm">Fast checkout • Age verification on premium items • Real-time inventory</p>
        </div>
      }
    >
      <CashierPOS businessType="bar" />
    </CashierPOSLayout>
  );
}
