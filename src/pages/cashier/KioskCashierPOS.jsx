import React, { useMemo } from 'react';
import { AlertCircle, Store, Zap } from 'lucide-react';
import CashierPOS from '../CashierPOS';
import CashierPOSLayout from '../../components/cashier/CashierPOSLayout';
import { useDayStats } from '../../hooks/useDayStats';

const DEFAULT_STATS = { sales: 0, itemsSold: 0, lowStockItems: 0 };

export default function KioskCashierPOS() {
  const { stats, error } = useDayStats(DEFAULT_STATS);
  const formatKes = useMemo(() => new Intl.NumberFormat('en-KE'), []);
  const categories = ['🏪 All Items', '🔌 Electronics', '🍪 Food', '🥤 Drinks', '🛒 Supplies'];

  return (
    <CashierPOSLayout
      title="Kiosk POS"
      subtitle="Fast & Simple Checkout"
      icon={Store}
      theme={{
        pageBg: 'min-h-screen bg-gradient-to-br from-green-50 to-green-100',
        headerBg: 'bg-green-700 text-white shadow-lg',
        iconWrap: 'w-12 h-12 rounded-xl bg-green-800/70 flex items-center justify-center text-green-100 shadow',
        titleClass: 'text-2xl font-bold text-white',
        subtitleClass: 'text-green-200 text-sm',
        footerBg: 'bg-green-700 text-white py-4 text-center'
      }}
      stats={{
        label: "Today's Revenue",
        value: `${formatKes.format(stats.sales)} KES`,
        meta: `${stats.itemsSold} items sold`,
        valueClass: 'text-yellow-300'
      }}
      errorMessage={error}
      alert={
        stats.lowStockItems > 0 ? (
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle size={20} />
            <span className="font-semibold">{stats.lowStockItems} items running low on stock</span>
          </div>
        ) : null
      }
      topSections={
        <div className="flex flex-wrap gap-3">
          {categories.map((category, index) => (
            <span
              key={category}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                index === 0
                  ? 'bg-green-600 text-white border-green-500'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              {category}
            </span>
          ))}
        </div>
      }
      footer={
        <div className="flex items-center justify-center gap-2">
          <Zap size={18} className="text-yellow-300" />
          <p className="text-sm">Lightning-fast checkout • Low stock alerts • Real-time updates</p>
        </div>
      }
    >
      <CashierPOS businessType="kiosk" />
    </CashierPOSLayout>
  );
}
