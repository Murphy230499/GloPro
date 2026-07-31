'use client';
import React from 'react';
import { Target, Users, DollarSign, Share2 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import KPICard from '../KPICard';
import DataTable from '../DataTable';
import { formatVND } from '@/lib/format';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

export default function MarketingTab({ customers = [] }) {
  const sources = {};
  customers.forEach(c => {
    const s = c.source || 'Walk-in (Khách vãng lai)';
    sources[s] = (sources[s] || 0) + 1;
  });

  const sourceData = Object.entries(sources).map(([name, value]) => ({ name, value }));

  const columns = [
    { key: 'name', label: 'Nguồn thu hút' },
    { key: 'value', label: 'Số lượng khách hàng', align: 'right', render: (v) => <span className="font-bold text-blue-600">{v} khách</span> },
    { key: 'ratio', label: 'Tỷ lệ %', align: 'right', render: (_, r) => <span className="font-semibold text-slate-700">{customers.length > 0 ? Math.round((r.value / customers.length) * 100) : 0}%</span> }
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard title="Khách Hàng Từ Mạng Xã Hội" value="42%" growth={8} icon={Share2} color="blue" />
        <KPICard title="Tỷ Lệ Giới Thiệu (Referral)" value="24%" growth={5} icon={Users} color="emerald" />
        <KPICard title="Chi Phí / 1 Khách Mới (CAC)" value={formatVND(85000)} growth={-6} icon={DollarSign} color="purple" />
        <KPICard title="Tỷ Lệ Chuyển Đổi Kênh" value="35%" growth={4} icon={Target} color="amber" />
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3 min-w-0">
        <h3 className="text-sm font-bold text-slate-800">Cơ Cấu Nguồn Khách Hàng Đến Salon</h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={sourceData.length ? sourceData : [{ name: 'Walk-in', value: 1 }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} innerRadius={55}>
              {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v) => [`${v}%`, 'Tỷ lệ']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 11 }} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 9 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <DataTable columns={columns} data={sourceData} emptyText="Không có dữ liệu nguồn khách hàng" />
    </div>
  );
}
