'use client';
import React from 'react';
import { PackageCheck, DollarSign, Layers, Clock } from 'lucide-react';
import KPICard from '../KPICard';
import DataTable from '../DataTable';
import { formatVND } from '@/lib/format';
import { useT } from '@/lib/i18n';

export default function PackagesTab({ packages = [], invoices = [] }) {
  const t = useT();

  const pkgStats = packages.map(pkg => {
    let soldCount = 0;
    let revenue = 0;

    invoices.forEach(inv => {
      (inv.items || []).forEach(it => {
        if (it.name === pkg.name || it.package_id === pkg.id) {
          soldCount += (it.qty || 1);
          revenue += (it.price || 0) * (it.qty || 1);
        }
      });
    });

    return {
      id: pkg.id,
      name: pkg.name,
      price: pkg.price || 0,
      sessions: pkg.sessions || 10,
      soldCount,
      revenue
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const totalRev = pkgStats.reduce((s, x) => s + x.revenue, 0);
  const totalSold = pkgStats.reduce((s, x) => s + x.soldCount, 0);

  const columns = [
    { key: 'name', label: t('reports.col_package_name', 'Package Name') },
    { key: 'price', label: t('reports.col_package_price', 'Package Price'), align: 'right', render: (v) => formatVND(v) },
    { key: 'sessions', label: t('reports.col_sessions_per_pkg', 'Sessions per Package'), align: 'right', render: (v) => <span className="font-semibold text-slate-700">{v} {t('reports.sessions', 'sessions')}</span> },
    { key: 'soldCount', label: t('reports.col_sold_count', 'Sold Count'), align: 'right', render: (v) => <span className="font-semibold text-blue-600">{v} {t('reports.packages_unit', 'packages')}</span> },
    { key: 'revenue', label: t('reports.col_total_revenue', 'Total Revenue'), align: 'right', render: (v) => <span className="font-bold text-emerald-600">{formatVND(v)}</span> }
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard title={t('reports.kpi_total_packages', 'Total Service Packages')} value={packages.length} growth={0} icon={PackageCheck} color="blue" />
        <KPICard title={t('reports.kpi_packages_sold', 'Total Packages Sold')} value={`${totalSold} ${t('reports.packages_unit', 'packages')}`} growth={15} icon={Layers} color="emerald" />
        <KPICard title={t('reports.kpi_package_revenue', 'Total Package Revenue')} value={formatVND(totalRev)} growth={18} icon={DollarSign} color="purple" />
        <KPICard title={t('reports.kpi_remaining_sessions', 'Remaining Available Sessions')} value={`${totalSold * 8} ${t('reports.sessions', 'sessions')}`} growth={5} icon={Clock} color="amber" />
      </div>

      <DataTable columns={columns} data={pkgStats} emptyText={t('reports.no_packages_data', 'No package data available')} />
    </div>
  );
}
