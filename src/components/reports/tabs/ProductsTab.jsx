'use client';
import React from 'react';
import { Package, TrendingUp, DollarSign, ShoppingBag } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import KPICard from '../KPICard';
import DataTable from '../DataTable';
import { formatVND } from '@/lib/format';

export default function ProductsTab({ products = [], invoices = [] }) {
  const prodStats = products.map(p => {
    let count = 0;
    let revenue = 0;

    invoices.forEach(inv => {
      (inv.items || []).forEach(it => {
        if (it.type === 'product' && (it.name === p.name || it.product_id === p.id)) {
          const qty = it.qty || 1;
          count += qty;
          revenue += (it.price || 0) * qty;
        }
      });
    });

    return {
      id: p.id,
      name: p.name,
      category: p.category || 'Mỹ phẩm',
      price: p.price || 0,
      stock: p.stock || 0,
      count,
      revenue
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const totalRev = prodStats.reduce((s, x) => s + x.revenue, 0);
  const totalCount = prodStats.reduce((s, x) => s + x.count, 0);

  const topChart = prodStats.slice(0, 5);

  const columns = [
    { key: 'name', label: 'Tên Sản phẩm' },
    { key: 'category', label: 'Phân loại' },
    { key: 'price', label: 'Giá bán lẻ', align: 'right', render: (v) => formatVND(v) },
    { key: 'stock', label: 'Tồn kho hiện tại', align: 'right', render: (v) => <span className="font-semibold text-slate-700">{v} chai/hũ</span> },
    { key: 'count', label: 'Đã bán lẻ', align: 'right', render: (v) => <span className="font-semibold text-blue-600">{v} sp</span> },
    { key: 'revenue', label: 'Tổng Doanh Số', align: 'right', render: (v) => <span className="font-bold text-emerald-600">{formatVND(v)}</span> }
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard title="Tổng Mã Sản Phẩm" value={products.length} growth={0} icon={Package} color="blue" />
        <KPICard title="Số Lượng Đã Bán Lẻ" value={`${totalCount} sp`} growth={18} icon={ShoppingBag} color="emerald" />
        <KPICard title="Tổng Doanh Số Bán Lẻ" value={formatVND(totalRev)} growth={20} icon={TrendingUp} color="purple" />
        <KPICard title="Doanh Thu TB / Sản Phẩm" value={formatVND(totalCount > 0 ? Math.round(totalRev / totalCount) : 0)} growth={2} icon={DollarSign} color="amber" />
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3 min-w-0">
        <h3 className="text-sm font-bold text-slate-800">Top 5 Sản Phẩm Mỹ Phẩm Bán Chạy Nhất</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={topChart} layout="vertical" barSize={18}>
            <CartesianGrid horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" tickFormatter={(v) => v >= 1000000 ? (v / 1000000) + 'tr' : v} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} width={130} />
            <Tooltip formatter={(v) => [formatVND(v), 'Doanh số']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 11 }} />
            <Bar dataKey="revenue" name="Doanh số" radius={[0, 6, 6, 0]} fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <DataTable columns={columns} data={prodStats} emptyText="Không có dữ liệu sản phẩm" />
    </div>
  );
}
