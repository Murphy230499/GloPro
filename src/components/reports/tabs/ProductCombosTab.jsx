'use client';
import React from 'react';
import { Package, Tag, DollarSign, ShoppingBag } from 'lucide-react';
import KPICard from '../KPICard';
import DataTable from '../DataTable';
import { formatVND } from '@/lib/format';
import { useT } from '@/lib/i18n';

export default function ProductCombosTab({ productCombos = [], invoices = [] }) {
  const t = useT();

  const comboStats = productCombos.map(pc => {
    let soldCount = 0;
    let revenue = 0;

    invoices.forEach(inv => {
      (inv.items || []).forEach(it => {
        if (it.name === pc.name || it.combo_id === pc.id) {
          soldCount += (it.qty || 1);
          revenue += (it.price || 0) * (it.qty || 1);
        }
      });
    });

    return {
      id: pc.id,
      name: pc.name,
      price: pc.price || 0,
      original_price: pc.original_price || (pc.price ? pc.price * 1.15 : 0),
      soldCount,
      revenue
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const totalRev = comboStats.reduce((s, x) => s + x.revenue, 0);
  const totalSold = comboStats.reduce((s, x) => s + x.soldCount, 0);

  const columns = [
    { key: 'name', label: t('reports.col_product_combo_name', 'Product Combo Set Name') },
    { key: 'original_price', label: t('reports.col_list_price', 'List Price'), align: 'right', render: (v) => <span className="line-through text-slate-400">{formatVND(v)}</span> },
    { key: 'price', label: t('reports.col_set_price', 'Special Set Price'), align: 'right', render: (v) => <span className="font-bold text-blue-600">{formatVND(v)}</span> },
    { key: 'soldCount', label: t('reports.col_retail_sold', 'Retail Sold'), align: 'right', render: (v) => <span className="font-semibold text-slate-700">{v} {t('reports.sets_unit', 'sets')}</span> },
    { key: 'revenue', label: t('reports.col_total_revenue', 'Total Revenue'), align: 'right', render: (v) => <span className="font-bold text-emerald-600">{formatVND(v)}</span> }
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard title={t('reports.kpi_product_combos', 'Product Combos (Homecare Sets)')} value={productCombos.length} growth={0} icon={Package} color="blue" />
        <KPICard title={t('reports.kpi_sets_sold', 'Sets Sold')} value={`${totalSold} ${t('reports.sets_unit', 'sets')}`} growth={14} icon={ShoppingBag} color="emerald" />
        <KPICard title={t('reports.kpi_prod_combo_rev', 'Product Combo Revenue')} value={formatVND(totalRev)} growth={22} icon={DollarSign} color="purple" />
        <KPICard title={t('reports.kpi_set_discount_rate', 'Set Discount Rate')} value="15%" growth={0} icon={Tag} color="amber" />
      </div>

      <DataTable columns={columns} data={comboStats} emptyText={t('reports.no_product_combos_data', 'No product combo data available')} />
    </div>
  );
}
