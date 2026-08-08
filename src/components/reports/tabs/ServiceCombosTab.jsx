'use client';
import React from 'react';
import { Layers, DollarSign, Tag, TrendingUp } from 'lucide-react';
import KPICard from '../KPICard';
import DataTable from '../DataTable';
import { formatVND } from '@/lib/format';
import { useT } from '@/lib/i18n';

export default function ServiceCombosTab({ serviceCombos = [], invoices = [] }) {
  const t = useT();

  const comboStats = serviceCombos.map(sc => {
    let soldCount = 0;
    let revenue = 0;

    invoices.forEach(inv => {
      (inv.items || []).forEach(it => {
        if (it.name === sc.name || it.combo_id === sc.id) {
          soldCount += (it.qty || 1);
          revenue += (it.price || 0) * (it.qty || 1);
        }
      });
    });

    return {
      id: sc.id,
      name: sc.name,
      price: sc.price || 0,
      original_price: sc.original_price || (sc.price ? sc.price * 1.2 : 0),
      soldCount,
      revenue
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const totalRev = comboStats.reduce((s, x) => s + x.revenue, 0);
  const totalSold = comboStats.reduce((s, x) => s + x.soldCount, 0);

  const columns = [
    { key: 'name', label: t('reports.col_service_combo_name', 'Service Combo Name') },
    { key: 'original_price', label: t('reports.col_orig_price', 'Original Price'), align: 'right', render: (v) => <span className="line-through text-slate-400">{formatVND(v)}</span> },
    { key: 'price', label: t('reports.col_combo_price', 'Combo Special Price'), align: 'right', render: (v) => <span className="font-bold text-blue-600">{formatVND(v)}</span> },
    { key: 'soldCount', label: t('reports.col_sold_count', 'Sold Count'), align: 'right', render: (v) => <span className="font-semibold text-slate-700">{v} {t('reports.combos_unit', 'combos')}</span> },
    { key: 'revenue', label: t('reports.col_total_revenue', 'Total Revenue'), align: 'right', render: (v) => <span className="font-bold text-emerald-600">{formatVND(v)}</span> }
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard title={t('reports.kpi_active_service_combos', 'Active Service Combos')} value={serviceCombos.length} growth={0} icon={Layers} color="blue" />
        <KPICard title={t('reports.kpi_combos_sold', 'Combos Sold')} value={`${totalSold} ${t('reports.combos_unit', 'combos')}`} growth={10} icon={Tag} color="emerald" />
        <KPICard title={t('reports.kpi_service_combo_rev', 'Service Combo Revenue')} value={formatVND(totalRev)} growth={16} icon={DollarSign} color="purple" />
        <KPICard title={t('reports.kpi_avg_savings_ratio', 'Avg Savings Ratio')} value="18%" growth={2} icon={TrendingUp} color="amber" />
      </div>

      <DataTable columns={columns} data={comboStats} emptyText={t('reports.no_service_combos_data', 'No service combo data available')} />
    </div>
  );
}
