'use client';
import React from 'react';
import { TrendingUp, DollarSign, PieChart as PieIcon, ArrowUpRight } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import KPICard from '../KPICard';
import AIInsightBox from '../AIInsightBox';
import DataTable from '../DataTable';
import { formatVND } from '@/lib/format';
import { generateAIInsights } from '@/lib/reportsEngine';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1'];

export default function RevenueTab({ invoices = [], onDrillDown }) {
  const totalRevenue = invoices.reduce((s, i) => s + (i.total || 0), 0);
  const totalDiscount = invoices.reduce((s, i) => s + (i.discount || 0), 0);
  const totalSubtotal = invoices.reduce((s, i) => s + (i.subtotal || 0), 0);
  const aov = invoices.length > 0 ? Math.round(totalRevenue / invoices.length) : 0;

  // Breakdown by Item Name
  const catBreakdown = {};
  invoices.forEach(inv => {
    (inv.items || []).forEach(it => {
      catBreakdown[it.name] = (catBreakdown[it.name] || 0) + (it.price || 0) * (it.qty || 1);
    });
  });
  const catData = Object.entries(catBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  const insights = generateAIInsights('revenue', { aov, topCategory: catData[0]?.name });

  const columns = [
    { key: 'invoice_code', label: 'Mã Hóa đơn' },
    { key: 'customer_name', label: 'Khách hàng' },
    { key: 'date', label: 'Ngày' },
    { key: 'subtotal', label: 'Tạm tính', align: 'right', render: (v) => formatVND(v) },
    { key: 'discount', label: 'Giảm giá', align: 'right', render: (v) => <span className="text-rose-500 font-semibold">-{formatVND(v)}</span> },
    { key: 'total', label: 'Thành tiền', align: 'right', render: (v) => <span className="font-bold text-emerald-600">{formatVND(v)}</span> }
  ];

  return (
    <div className="space-y-5">
      <AIInsightBox insights={insights} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard title="Tổng Doanh Thu Thuần" value={formatVND(totalRevenue)} growth={15} compareText="so với kỳ trước" icon={TrendingUp} color="emerald" />
        <KPICard title="Tổng Giá Trị Tạm Tính" value={formatVND(totalSubtotal)} growth={14} compareText="so với kỳ trước" icon={DollarSign} color="blue" />
        <KPICard title="Tổng Khấu Trừ / Giảm Giá" value={formatVND(totalDiscount)} growth={-4} compareText="so với kỳ trước" icon={PieIcon} color="rose" />
        <KPICard title="Giá Trị TB / Đơn (AOV)" value={formatVND(aov)} growth={6} compareText="so với kỳ trước" icon={ArrowUpRight} color="purple" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3 min-w-0">
          <h3 className="text-sm font-bold text-slate-800">Top 6 Dịch vụ & Sản phẩm Đóng góp Doanh thu</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={catData.length ? catData : [{ name: 'Không có', value: 1 }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
                {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => [formatVND(v), 'Doanh số']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 11 }} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 9 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3 min-w-0">
          <h3 className="text-sm font-bold text-slate-800">Cơ cấu Chi tiết Doanh số</h3>
          <div className="space-y-3 pt-2">
            {catData.map((c, i) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="truncate">{c.name}</span>
                </span>
                <span className="font-bold text-slate-900">{formatVND(c.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={invoices} emptyText="Không có hóa đơn trong kỳ" />
    </div>
  );
}
