'use client';
import React from 'react';
import { Scissors, TrendingUp, DollarSign, Layers } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import KPICard from '../KPICard';
import DataTable from '../DataTable';
import { formatVND } from '@/lib/format';

export default function ServicesTab({ services = [], invoices = [] }) {
  const serviceStats = services.map(s => {
    let count = 0;
    let revenue = 0;

    invoices.forEach(inv => {
      (inv.items || []).forEach(it => {
        if (it.is_from_package) return;
        if (it.name === s.name || it.service_id === s.id) {
          const qty = it.qty || 1;
          count += qty;
          revenue += (it.price || 0) * qty;
        }
      });
    });

    return {
      id: s.id,
      name: s.name,
      category: s.category || s.group || 'Dịch vụ khác',
      price: s.price || 0,
      count,
      revenue
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const totalRev = serviceStats.reduce((s, x) => s + x.revenue, 0);
  const totalCount = serviceStats.reduce((s, x) => s + x.count, 0);

  const topChart = serviceStats.slice(0, 5);

  const columns = [
    { key: 'name', label: 'Tên Dịch vụ' },
    { key: 'category', label: 'Nhóm Dịch vụ' },
    { key: 'price', label: 'Đơn giá', align: 'right', render: (v) => formatVND(v) },
    { key: 'count', label: 'Số lượt thực hiện', align: 'right', render: (v) => <span className="font-semibold text-blue-600">{v} lượt</span> },
    { key: 'revenue', label: 'Tổng Doanh Số', align: 'right', render: (v) => <span className="font-bold text-emerald-600">{formatVND(v)}</span> }
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard title="Tổng Dịch Vụ Trong Menu" value={services.length} growth={0} icon={Scissors} color="blue" />
        <KPICard title="Tổng Số Lượt Phục Vụ" value={`${totalCount} lượt`} growth={12} icon={Layers} color="emerald" />
        <KPICard title="Tổng Doanh Số Dịch Vụ" value={formatVND(totalRev)} growth={15} icon={TrendingUp} color="purple" />
        <KPICard title="Doanh Thu TB / Lượt" value={formatVND(totalCount > 0 ? Math.round(totalRev / totalCount) : 0)} growth={4} icon={DollarSign} color="amber" />
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3 min-w-0">
        <h3 className="text-sm font-bold text-slate-800">Top 5 Dịch Vụ Mang Lại Doanh Thu Cao Nhất</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={topChart} layout="vertical" barSize={18}>
            <CartesianGrid horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" tickFormatter={(v) => v >= 1000000 ? (v / 1000000) + 'tr' : v} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} width={130} />
            <Tooltip formatter={(v) => [formatVND(v), 'Doanh số']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 11 }} />
            <Bar dataKey="revenue" name="Doanh số" radius={[0, 6, 6, 0]} fill="#8B5CF6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <DataTable columns={columns} data={serviceStats} emptyText="Không có dữ liệu dịch vụ" />
    </div>
  );
}
