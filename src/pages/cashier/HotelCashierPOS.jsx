import React, { useMemo } from 'react';
import { ConciergeBell, Hotel } from 'lucide-react';
import CashierPOS from '../CashierPOS';
import CashierPOSLayout from '../../components/cashier/CashierPOSLayout';
import { useDayStats } from '../../hooks/useDayStats';

const DEFAULT_STATS = { sales: 0, count: 0 };

export default function HotelCashierPOS() {
  const { stats, error } = useDayStats(DEFAULT_STATS);
  const formatKes = useMemo(() => new Intl.NumberFormat('en-KE'), []);

  return (
    <CashierPOSLayout
      title="Hotel POS"
      subtitle="Rooms • Services • Dining"
      icon={Hotel}
      theme={{
        pageBg: 'min-h-screen bg-gradient-to-br from-rose-50 via-white to-slate-50',
        headerBg: 'bg-white/90 backdrop-blur border-b border-slate-200',
        iconWrap: 'w-12 h-12 rounded-xl bg-gradient-to-br from-[#f43f5e] to-[#fb7185] flex items-center justify-center text-white shadow'
      }}
      stats={{
        label: "Today's Sales",
        value: `${formatKes.format(stats.sales)} KES`,
        meta: `${stats.count} transactions`,
        valueClass: 'text-rose-600'
      }}
      errorMessage={error}
      footer={
        <div className="flex items-center justify-center gap-2 text-sm">
          <ConciergeBell size={16} className="text-rose-300" />
          Seamless check-out • Service bundles • Real-time inventory
        </div>
      }
    >
      <CashierPOS businessType="hotel" />
    </CashierPOSLayout>
  );
}
