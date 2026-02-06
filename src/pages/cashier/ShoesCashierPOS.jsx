import React, { useMemo, useState } from 'react';
import { Grid3x3, Package } from 'lucide-react';
import CashierPOS from '../CashierPOS';
import CashierPOSLayout from '../../components/cashier/CashierPOSLayout';
import { useDayStats } from '../../hooks/useDayStats';

const DEFAULT_STATS = { sales: 0, pairs: 0, topSize: '' };

export default function ShoesCashierPOS() {
  const [filters, setFilters] = useState({ size: '', color: '' });
  const { stats, error } = useDayStats(DEFAULT_STATS);
  const formatKes = useMemo(() => new Intl.NumberFormat('en-KE'), []);

  const sizes = ['5', '6', '7', '8', '9', '10', '11', '12', '13'];
  const colors = ['Black', 'White', 'Brown', 'Blue', 'Red', 'Green', 'Pink', 'Gray'];
  const categories = ['👟 All Shoes', '🏃 Sports', '👞 Formal', '👠 Casual', '👢 Boots'];

  return (
    <CashierPOSLayout
      title="Shoes POS"
      subtitle="Footwear & Variants"
      icon={({ className }) => <span className={className}>👟</span>}
      theme={{
        pageBg: 'min-h-screen bg-gradient-to-br from-purple-50 to-purple-100',
        headerBg: 'bg-purple-700 text-white shadow-lg',
        iconWrap: 'w-12 h-12 rounded-xl bg-purple-800/70 flex items-center justify-center text-purple-100 shadow',
        iconClass: 'text-2xl',
        titleClass: 'text-2xl font-bold text-white',
        subtitleClass: 'text-purple-200 text-sm',
        footerBg: 'bg-purple-700 text-white py-4 text-center'
      }}
      stats={{
        label: 'Daily Sales',
        value: `${formatKes.format(stats.sales)} KES`,
        meta: `${stats.pairs} pairs sold • Top: Size ${stats.topSize || '—'}`,
        valueClass: 'text-emerald-200'
      }}
      errorMessage={error}
      topSections={
        <>
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Grid3x3 size={18} className="inline mr-2" />
                Filter by Size
              </label>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setFilters({ ...filters, size: size === filters.size ? '' : size })}
                    className={`w-10 h-10 rounded-lg font-bold transition ${
                      filters.size === size
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-purple-700 border border-purple-100 hover:bg-purple-50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Package size={18} className="inline mr-2" />
                Filter by Color
              </label>
              <select
                value={filters.color}
                onChange={(e) => setFilters({ ...filters, color: e.target.value })}
                className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Colors</option>
                {colors.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map((category, index) => (
              <span
                key={category}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                  index === 0
                    ? 'bg-purple-600 text-white border-purple-500'
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
        <p className="text-sm">Variant management • Size & color tracking • Stock by variant • Real-time availability</p>
      }
    >
      <CashierPOS businessType="shoes" filters={filters} />
    </CashierPOSLayout>
  );
}
