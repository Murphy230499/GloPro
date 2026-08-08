'use client';
import React from 'react';
import { Activity, DollarSign, CheckCircle, Clock } from 'lucide-react';
import KPICard from '../KPICard';
import DataTable from '../DataTable';
import { formatVND } from '@/lib/format';
import { useT } from '@/lib/i18n';

export default function TreatmentsTab({ treatments = [], invoices = [] }) {
  const t = useT();

  const trtStats = treatments.map(trt => {
    let soldCount = 0;
    let revenue = 0;

    invoices.forEach(inv => {
      (inv.items || []).forEach(it => {
        if (it.name === trt.name || it.treatment_id === trt.id) {
          soldCount += (it.qty || 1);
          revenue += (it.price || 0) * (it.qty || 1);
        }
      });
    });

    return {
      id: trt.id,
      name: trt.name,
      price: trt.price || 0,
      sessions: trt.sessions || 5,
      soldCount,
      revenue
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const totalRev = trtStats.reduce((s, x) => s + x.revenue, 0);
  const totalSold = trtStats.reduce((s, x) => s + x.soldCount, 0);

  const columns = [
    { key: 'name', label: t('reports.col_treatment_name', 'Treatment Plan Name') },
    { key: 'price', label: t('reports.col_package_price', 'Package Price'), align: 'right', render: (v) => formatVND(v) },
    { key: 'sessions', label: t('reports.col_std_sessions', 'Standard Sessions'), align: 'right', render: (v) => <span className="font-semibold text-slate-700">{v} {t('reports.sessions', 'sessions')}</span> },
    { key: 'soldCount', label: t('reports.col_issued_count', 'Issued Count'), align: 'right', render: (v) => <span className="font-semibold text-blue-600">{v} {t('reports.unit_treatments', 'treatments')}</span> },
    { key: 'revenue', label: t('reports.col_total_revenue', 'Total Revenue'), align: 'right', render: (v) => <span className="font-bold text-emerald-600">{formatVND(v)}</span> }
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard title={t('reports.kpi_managed_treatments', 'Managed Treatment Plans')} value={treatments.length} growth={0} icon={Activity} color="blue" />
        <KPICard title={t('reports.kpi_issued_treatments', 'Issued Treatments')} value={`${totalSold} ${t('reports.unit_sets', 'sets')}`} growth={12} icon={CheckCircle} color="emerald" />
        <KPICard title={t('reports.kpi_treatment_rev', 'Treatment Revenue')} value={formatVND(totalRev)} growth={20} icon={DollarSign} color="purple" />
        <KPICard title={t('reports.kpi_completion_rate', 'Completion Rate')} value="78%" growth={4} icon={Clock} color="amber" />
      </div>

      <DataTable columns={columns} data={trtStats} emptyText={t('reports.no_treatments_data', 'No treatment data available')} />
    </div>
  );
}
