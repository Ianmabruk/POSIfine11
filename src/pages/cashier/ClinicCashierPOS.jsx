import React, { useMemo } from 'react';
import { HeartPulse, Stethoscope } from 'lucide-react';
import CashierPOS from '../CashierPOS';
import CashierPOSLayout from '../../components/cashier/CashierPOSLayout';
import { useDayStats } from '../../hooks/useDayStats';

const DEFAULT_STATS = { sales: 0, count: 0 };

export default function ClinicCashierPOS() {
  const { stats, error } = useDayStats(DEFAULT_STATS);
  const formatKes = useMemo(() => new Intl.NumberFormat('en-KE'), []);

  return (
    <CashierPOSLayout
      title="Clinic POS"
      subtitle="Patients • Invoices • Pharmacy"
      icon={Stethoscope}
      theme={{
        pageBg: 'min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50',
        headerBg: 'bg-white/90 backdrop-blur border-b border-slate-200',
        iconWrap: 'w-12 h-12 rounded-xl bg-gradient-to-br from-[#2d4cff] to-[#22c55e] flex items-center justify-center text-white shadow'
      }}
      stats={{
        label: "Today's Sales",
        value: `${formatKes.format(stats.sales)} KES`,
        meta: `${stats.count} transactions`,
        valueClass: 'text-emerald-600'
      }}
      errorMessage={error}
      footer={
        <div className="flex items-center justify-center gap-2 text-sm">
          <HeartPulse size={16} className="text-emerald-400" />
          Fast billing • Patient-friendly receipts • Real-time inventory
        </div>
      }
    >
      <CashierPOS businessType="clinic" />
    </CashierPOSLayout>
  );
}
