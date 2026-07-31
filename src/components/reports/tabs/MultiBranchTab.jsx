'use client';
import React from 'react';
import { Building2, TrendingUp, Award, Layers } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import KPICard from '../KPICard';
import DataTable from '../DataTable';
import { formatVND } from '@/lib/format';

export default function MultiBranchTab({ branches = [], invoices = [] }) {
  const branchStats = branches.map(b => {
    const branchInvoices = invoices.filter(i => i.branch_id === b.id);
    const rev = branchInvoices.reduce((s, i) => s + (i.total || 0), 0);
    const count = branchInvoices.length;

    return {
      id: b.id,
      name: b.name,
      address: b.address || 'Hệ thống GloPro',
      count,
      revenue: rev
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const totalChainRev = branchStats.reduce((s, x) => s + x.revenue, 0);

  const columns = [
    { key: 'name', label: 'Tên Chi nhánh' },
    { key: 'address', label: 'Địa chỉ cơ sở' },
    { key: 'count', label: 'Số lượng hóa đơn', align: 'right', render: (v) => <span className="font-semibold text-blue-600">{v} hóa đơn</span> },
    { key: 'revenue', label: 'Doanh Thu Cơ Sở', align: 'right', render: (v) => <span className="font-bold text-emerald-600">{formatVND(v)}</span> }
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard title="Tổng Số Chi Nhánh" value={branches.length || 1} growth={0} icon={Building2} color="blue" />
        <KPICard title="Doanh Thu Toàn Chuỗi" value={formatVND(totalChainRev)} growth={18} icon={TrendingUp} color="emerald" />
        <KPICard title="Cơ Sở Dẫn Đầu" value={branchStats[0]?.name || 'Cơ sở 1'} growth={12} icon={Award} color="amber" />
        <KPICard title="Doanh Thu Trung Bình / Cơ Sở" value={formatVND(branches.length > 0 ? Math.round(totalChainRev / branches.length) : totalChainRev)} growth={5} icon={Layers} color="purple" />
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3 min-w-0">
        <h3 className="text-sm font-bold text-slate-800">So Sánh Doanh Thu Giữa Các Chi Nhánh</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={branchStats} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => v >= 1000000 ? (v / 1000000) + 'tr' : v} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => [formatVND(v), 'Doanh thu']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 11 }} />
            <Bar dataKey="revenue" name="Doanh thu" radius={[6, 6, 0, 0]} fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <DataTable columns={columns} data={branchStats} emptyText="Không có dữ liệu chuỗi chi nhánh" />
    </div>
  );
}
