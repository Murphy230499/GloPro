'use client';
import React from 'react';
import { Gift, Users, TrendingUp, DollarSign, Star } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, AreaChart, Area, defs, linearGradient, stop
} from 'recharts';
import KPICard from '../KPICard';
import DataTable from '../DataTable';
import { formatVND } from '@/lib/format';
import { useT } from '@/lib/i18n';

export default function TipReportTab({ invoices = [], staff = [], searchQuery = '' }) {
  const t = useT();

  const invoicesWithTip = invoices.filter(i => i && (i.tip || 0) > 0);
  const totalTip = invoices.reduce((s, i) => s + (i?.tip || 0), 0);
  const totalRevenue = invoices.reduce((s, i) => s + (i?.total || 0), 0);
  const avgTipPerInvoice = invoicesWithTip.length > 0
    ? Math.round(totalTip / invoicesWithTip.length)
    : 0;
  const tipRate = totalRevenue > 0
    ? ((totalTip / totalRevenue) * 100).toFixed(1)
    : '0.0';

  const trendMap = {};
  invoices.forEach(i => {
    if (!i?.created_date) return;
    const day = i.created_date.substring(0, 10);
    trendMap[day] = (trendMap[day] || 0) + (i.tip || 0);
  });
  const trendData = Object.entries(trendMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, tip]) => ({ date: date.substring(5), tip }));

  const staffTipMap = {};
  invoices.forEach(inv => {
    if (!inv?.tip_splits?.length) return;
    inv.tip_splits.forEach(split => {
      if (!split?.staff_id) return;
      if (!staffTipMap[split.staff_id]) {
        staffTipMap[split.staff_id] = {
          id: split.staff_id,
          name: split.staff_name || t('reports.unknown', 'Unknown'),
          total: 0,
          count: 0
        };
      }
      staffTipMap[split.staff_id].total += (split.amount || 0);
      staffTipMap[split.staff_id].count += 1;
    });
  });

  const staffTipStats = Object.values(staffTipMap)
    .sort((a, b) => b.total - a.total);

  const topStaffChart = staffTipStats.slice(0, 10).map(s => ({
    name: s.name,
    tip: s.total
  }));

  const tableData = staffTipStats.map(s => ({
    name: s.name,
    count: s.count,
    total: s.total,
    avg: s.count > 0 ? Math.round(s.total / s.count) : 0,
    pct: totalTip > 0 ? ((s.total / totalTip) * 100).toFixed(1) : '0.0'
  })).filter(row =>
    !searchQuery || row.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    { key: 'name', label: t('reports.col_staff', 'Staff Member') },
    { key: 'count', label: t('reports.col_tip_count', 'Tip Count'), align: 'right', render: v => <span className="font-semibold text-slate-700">{v} {t('reports.times', 'times')}</span> },
    { key: 'total', label: t('reports.col_total_tips_rec', 'Total Tips Received'), align: 'right', render: v => <span className="font-bold text-emerald-600">{formatVND(v)}</span> },
    { key: 'avg', label: t('reports.col_avg_tip_time', 'Avg Tip / Time'), align: 'right', render: v => <span className="font-semibold text-blue-600">{formatVND(v)}</span> },
    { key: 'pct', label: t('reports.col_pct_total_tips', '% Total Tips'), align: 'right', render: v => (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold text-xs">
        {v}%
      </span>
    )}
  ];

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard title={t('reports.kpi_total_tips_received', 'Total Tips Received')} value={formatVND(totalTip)} growth={12} compareText={t('reports.vs_prev_period', 'vs previous period')} icon={Gift} color="amber" />
        <KPICard title={t('reports.kpi_invoices_with_tip', 'Invoices with Tips')} value={`${invoicesWithTip.length} ${t('reports.unit_invoices', 'invoices')}`} growth={8} compareText={t('reports.vs_prev_period', 'vs previous period')} icon={Star} color="blue" />
        <KPICard title={t('reports.kpi_avg_tip_invoice', 'Avg Tip / Invoice')} value={formatVND(avgTipPerInvoice)} growth={4} compareText={t('reports.vs_prev_period', 'vs previous period')} icon={DollarSign} color="emerald" />
        <KPICard title={t('reports.kpi_tip_rev_ratio', 'Tip / Revenue Ratio')} value={`${tipRate}%`} growth={2} compareText={t('reports.vs_prev_period', 'vs previous period')} icon={TrendingUp} color="purple" />
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Trend Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">{t('reports.daily_tip_trend', 'Daily Tip Trend')}</h3>
            <span className="text-[11px] text-slate-400 font-medium">{t('reports.last_30_days', 'Last 30 days')}</span>
          </div>
          {trendData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
              <Gift className="w-8 h-8 opacity-30" />
              <p className="text-xs">{t('reports.no_tip_data_period', 'No tip data in this period')}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="tipGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => v >= 1000000 ? (v / 1000000) + 'M' : v >= 1000 ? (v / 1000) + 'k' : v} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => [formatVND(v), t('reports.tip_label', 'Tips')]} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 11 }} />
                <Area type="monotone" dataKey="tip" name={t('reports.tip_label', 'Tips')} stroke="#F59E0B" strokeWidth={2.5} fillOpacity={1} fill="url(#tipGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Staff TIP Bar Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">{t('reports.top_staff_receiving_tips', 'Top Staff Receiving Tips')}</h3>
            <span className="text-[11px] text-slate-400 font-medium">Top 10</span>
          </div>
          {topStaffChart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
              <Users className="w-8 h-8 opacity-30" />
              <p className="text-xs">{t('reports.no_tip_alloc_staff', 'No tip allocations for staff yet')}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topStaffChart} layout="vertical" barSize={18}>
                <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tickFormatter={v => v >= 1000000 ? (v / 1000000) + 'M' : v >= 1000 ? (v / 1000) + 'k' : v} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} width={130} />
                <Tooltip formatter={v => [formatVND(v), t('reports.tip_label', 'Tips')]} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 11 }} />
                <Bar dataKey="tip" name={t('reports.tip_label', 'Tips')} radius={[0, 6, 6, 0]} fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* Summary Banner */}
      {totalTip > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/60 rounded-2xl px-5 py-4 flex flex-wrap items-center gap-4">
          <Gift className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">
              {t('reports.tip_summary_banner', 'Total {total} in tips recorded from {invCount} invoices and allocated to {staffCount} staff in the report period.', {
                total: formatVND(totalTip),
                invCount: invoicesWithTip.length,
                staffCount: staffTipStats.length
              })}
            </p>
          </div>
        </div>
      )}

      {/* Detail Table */}
      <DataTable
        columns={columns}
        data={tableData}
        emptyText={t('reports.no_tip_alloc_data', 'No tip allocation data in this period')}
      />
    </div>
  );
}
