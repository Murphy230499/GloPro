'use client';
import React from 'react';
import { Package, Tag, DollarSign, ShoppingBag } from 'lucide-react';
import KPICard from '../KPICard';
import DataTable from '../DataTable';
import { formatVND } from '@/lib/format';

export default function ProductCombosTab({ productCombos = [], invoices = [] }) {
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
    { key: 'name', label: 'Tên Set Combo Sản phẩm' },
    { key: 'original_price', label: 'Giá niêm yết', align: 'right', render: (v) => <span className="line-through text-slate-400">{formatVND(v)}</span> },
    { key: 'price', label: 'Giá ưu đãi Set', align: 'right', render: (v) => <span className="font-bold text-blue-600">{formatVND(v)}</span> },
    { key: 'soldCount', label: 'Đã bán lẻ', align: 'right', render: (v) => <span className="font-semibold text-slate-700">{v} set</span> },
    { key: 'revenue', label: 'Tổng Doanh Số', align: 'right', render: (v) => <span className="font-bold text-emerald-600">{formatVND(v)}</span> }
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard title="Combo Sản Phẩm (Set Homecare)" value={productCombos.length} growth={0} icon={Package} color="blue" />
        <KPICard title="Số Set Đã Bán" value={`${totalSold} set`} growth={14} icon={ShoppingBag} color="emerald" />
        <KPICard title="Doanh Thu Combo Sản Phẩm" value={formatVND(totalRev)} growth={22} icon={DollarSign} color="purple" />
        <KPICard title="Tỷ Lệ Giảm Giá Set" value="15%" growth={0} icon={Tag} color="amber" />
      </div>

      <DataTable columns={columns} data={comboStats} emptyText="Không có dữ liệu combo sản phẩm" />
    </div>
  );
}
