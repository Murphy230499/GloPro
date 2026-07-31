'use client';
import React from 'react';
import { Layers, DollarSign, Tag, TrendingUp } from 'lucide-react';
import KPICard from '../KPICard';
import DataTable from '../DataTable';
import { formatVND } from '@/lib/format';

export default function ServiceCombosTab({ serviceCombos = [], invoices = [] }) {
  const comboStats = serviceCombos.map(sc => {
    let soldCount = 0;
    let revenue = 0;

    invoices.forEach(inv => {
      (inv.items || []).forEach(it => {
        if (it.name === sc.name || it.combo_id === sc.id) {
          soldCount += (it.qty || 1);
          revenue += (it.price || 0) * (it.qty || 1);
        }
      });
    });

    return {
      id: sc.id,
      name: sc.name,
      price: sc.price || 0,
      original_price: sc.original_price || (sc.price ? sc.price * 1.2 : 0),
      soldCount,
      revenue
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const totalRev = comboStats.reduce((s, x) => s + x.revenue, 0);
  const totalSold = comboStats.reduce((s, x) => s + x.soldCount, 0);

  const columns = [
    { key: 'name', label: 'Tên Combo Dịch vụ' },
    { key: 'original_price', label: 'Giá gốc dịch vụ', align: 'right', render: (v) => <span className="line-through text-slate-400">{formatVND(v)}</span> },
    { key: 'price', label: 'Giá ưu đãi Combo', align: 'right', render: (v) => <span className="font-bold text-blue-600">{formatVND(v)}</span> },
    { key: 'soldCount', label: 'Đã bán', align: 'right', render: (v) => <span className="font-semibold text-slate-700">{v} bộ</span> },
    { key: 'revenue', label: 'Tổng Doanh Thu', align: 'right', render: (v) => <span className="font-bold text-emerald-600">{formatVND(v)}</span> }
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard title="Combo Dịch Vụ Đang Chạy" value={serviceCombos.length} growth={0} icon={Layers} color="blue" />
        <KPICard title="Số Bộ Combo Đã Bán" value={`${totalSold} bộ`} growth={10} icon={Tag} color="emerald" />
        <KPICard title="Doanh Thu Combo Dịch Vụ" value={formatVND(totalRev)} growth={16} icon={DollarSign} color="purple" />
        <KPICard title="Tỷ Lệ Tiết Kiệm TB" value="18%" growth={2} icon={TrendingUp} color="amber" />
      </div>

      <DataTable columns={columns} data={comboStats} emptyText="Không có dữ liệu combo dịch vụ" />
    </div>
  );
}
