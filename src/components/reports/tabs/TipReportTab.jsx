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

export default function TipReportTab({ invoices = [], staff = [], searchQuery = '' }) {
  // ── Tổng hợp từ invoice.tip ──────────────────────────────────────────────
  const invoicesWithTip = invoices.filter(i => i && (i.tip || 0) > 0);
  const totalTip = invoices.reduce((s, i) => s + (i?.tip || 0), 0);
  const totalRevenue = invoices.reduce((s, i) => s + (i?.total || 0), 0);
  const avgTipPerInvoice = invoicesWithTip.length > 0
    ? Math.round(totalTip / invoicesWithTip.length)
    : 0;
  const tipRate = totalRevenue > 0
    ? ((totalTip / totalRevenue) * 100).toFixed(1)
    : '0.0';

  // ── Xu hướng TIP theo ngày ───────────────────────────────────────────────
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

  // ── Phân bổ TIP theo nhân viên (từ tip_splits) ───────────────────────────
  const staffTipMap = {};
  invoices.forEach(inv => {
    if (!inv?.tip_splits?.length) return;
    inv.tip_splits.forEach(split => {
      if (!split?.staff_id) return;
      if (!staffTipMap[split.staff_id]) {
        staffTipMap[split.staff_id] = {
          id: split.staff_id,
          name: split.staff_name || 'Không rõ',
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

  // ── Bảng chi tiết ────────────────────────────────────────────────────────
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
    { key: 'name', label: 'Nhân viên' },
    { key: 'count', label: 'Số lần nhận', align: 'right', render: v => <span className="font-semibold text-slate-700">{v} lần</span> },
    { key: 'total', label: 'Tổng TIP nhận', align: 'right', render: v => <span className="font-bold text-emerald-600">{formatVND(v)}</span> },
    { key: 'avg', label: 'TIP TB / lần', align: 'right', render: v => <span className="font-semibold text-blue-600">{formatVND(v)}</span> },
    { key: 'pct', label: '% Tổng TIP', align: 'right', render: v => (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold text-xs">
        {v}%
      </span>
    )}
  ];

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard title="Tổng Tiền TIP Nhận" value={formatVND(totalTip)} growth={12} compareText="so với kỳ trước" icon={Gift} color="amber" />
        <KPICard title="Hóa Đơn Có TIP" value={`${invoicesWithTip.length} đơn`} growth={8} compareText="so với kỳ trước" icon={Star} color="blue" />
        <KPICard title="TIP Trung Bình / Đơn" value={formatVND(avgTipPerInvoice)} growth={4} compareText="so với kỳ trước" icon={DollarSign} color="emerald" />
        <KPICard title="Tỷ Lệ TIP / Doanh Thu" value={`${tipRate}%`} growth={2} compareText="so với kỳ trước" icon={TrendingUp} color="purple" />
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Trend Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Xu Hướng Tiền TIP Theo Ngày</h3>
            <span className="text-[11px] text-slate-400 font-medium">30 ngày gần nhất</span>
          </div>
          {trendData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
              <Gift className="w-8 h-8 opacity-30" />
              <p className="text-xs">Chưa có dữ liệu TIP trong kỳ này</p>
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
                <YAxis tickFormatter={v => v >= 1000000 ? (v / 1000000) + 'tr' : v >= 1000 ? (v / 1000) + 'k' : v} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => [formatVND(v), 'Tiền TIP']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 11 }} />
                <Area type="monotone" dataKey="tip" name="Tiền TIP" stroke="#F59E0B" strokeWidth={2.5} fillOpacity={1} fill="url(#tipGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Staff TIP Bar Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Top Nhân Viên Nhận TIP Cao Nhất</h3>
            <span className="text-[11px] text-slate-400 font-medium">Top 10</span>
          </div>
          {topStaffChart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
              <Users className="w-8 h-8 opacity-30" />
              <p className="text-xs">Chưa có phân bổ TIP cho nhân viên</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topStaffChart} layout="vertical" barSize={18}>
                <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tickFormatter={v => v >= 1000000 ? (v / 1000000) + 'tr' : v >= 1000 ? (v / 1000) + 'k' : v} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} width={130} />
                <Tooltip formatter={v => [formatVND(v), 'Tiền TIP']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 11 }} />
                <Bar dataKey="tip" name="Tiền TIP" radius={[0, 6, 6, 0]} fill="#F59E0B" />
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
              Tổng <span className="text-amber-600">{formatVND(totalTip)}</span> tiền TIP đã được ghi nhận từ <span className="text-amber-600">{invoicesWithTip.length}</span> hóa đơn và phân bổ cho <span className="text-amber-600">{staffTipStats.length}</span> nhân viên trong kỳ báo cáo.
            </p>
          </div>
        </div>
      )}

      {/* Detail Table */}
      <DataTable
        columns={columns}
        data={tableData}
        emptyText="Chưa có dữ liệu phân bổ TIP trong kỳ này"
      />
    </div>
  );
}
