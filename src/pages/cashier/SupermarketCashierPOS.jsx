import React, { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Barcode, ShoppingCart } from 'lucide-react';
import CashierPOS from '../CashierPOS';
import CashierPOSLayout from '../../components/cashier/CashierPOSLayout';
import { useDayStats } from '../../hooks/useDayStats';

const DEFAULT_STATS = { sales: 0, count: 0 };
const DEFAULT_PERFORMANCE = { avgCheckout: 0, successRate: 100 };

const safeTrack = (type, name, payload) => {
  if (!window?.frontendMonitor) return;
  const monitor = window.frontendMonitor;
  if (type === 'metric') monitor.trackMetric?.(name, payload);
  if (type === 'action') monitor.trackUserAction?.(name, payload);
  if (type === 'error') monitor.trackError?.(name, payload);
};

export default function SupermarketCashierPOS() {
  const { stats, error } = useDayStats(DEFAULT_STATS);
  const [performanceStats, setPerformanceStats] = useState(DEFAULT_PERFORMANCE);
  const [perfError, setPerfError] = useState('');
  const formatKes = useMemo(() => new Intl.NumberFormat('en-KE'), []);

  useEffect(() => {
    safeTrack('action', 'page_view', { page: 'supermarket_pos' });

    const perfStart = performance.now();
    try {
      const metrics = window.__transactionMetrics?.getStats?.('sales');
      if (metrics?.count > 0) {
        setPerformanceStats({
          avgCheckout: Math.round(metrics.avg || 0),
          successRate: 100
        });
      } else {
        setPerformanceStats(DEFAULT_PERFORMANCE);
      }
      safeTrack('metric', 'load_pos_performance', {
        durationMs: performance.now() - perfStart,
        success: true
      });
      setPerfError('');
    } catch (err) {
      setPerformanceStats(DEFAULT_PERFORMANCE);
      setPerfError('Performance metrics unavailable');
      safeTrack('error', 'performance_metrics_error', { message: err?.message });
      safeTrack('metric', 'load_pos_performance', {
        durationMs: performance.now() - perfStart,
        success: false
      });
    }
  }, []);

  return (
    <CashierPOSLayout
      title="Supermarket POS"
      subtitle="Barcode • Bulk • Fast checkout"
      icon={ShoppingCart}
      theme={{
        pageBg: 'min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50',
        headerBg: 'bg-white/90 backdrop-blur border-b border-slate-200',
        iconWrap: 'w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center text-white shadow'
      }}
      stats={{
        label: "Today's Sales",
        value: `${formatKes.format(stats.sales)} KES`,
        meta: `${stats.count} transactions`,
        metaSecondary: `Avg: ${performanceStats.avgCheckout}ms • ${performanceStats.successRate}% success`,
        valueClass: 'text-emerald-600'
      }}
      errorMessage={error || perfError}
      footer={
        <div className="flex items-center justify-center gap-2 text-sm">
          <Barcode size={16} className="text-amber-300" />
          <span>Scan ready • Fast lanes • Real-time inventory</span>
          <BadgeCheck size={16} className="text-emerald-300" />
        </div>
      }
    >
      <CashierPOS businessType="supermarket" />
    </CashierPOSLayout>
  );
}
