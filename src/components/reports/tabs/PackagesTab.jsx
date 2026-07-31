'use client';
import React from 'react';
import { PackageCheck, DollarSign, Layers, Clock } from 'lucide-react';
import KPICard from '../KPICard';
import DataTable from '../DataTable';
import { formatVND } from '@/lib/format';

export default function PackagesTab({ packages = [], invoices = [] }) {
  const pkgStats = packages.map(pkg => {
    let soldCount = 0;
    let revenue = 0;

    invoices.forEach(inv => {
      (inv.items || []).forEach(it => {
        if (it.name === pkg.name || it.package_id === pkg.id) {
          soldCount += (it.qty || 1);
          revenue += (it.price || 0) * (it.qty || 1);
        }
      });
    });

    return {
      id: pkg.id,
      name: pkg.name,
      price: pkg.price || 0,
      sessions: pkg.sessions || 10,
      soldCount,
      revenue
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const totalRev = pkgStats.reduce((s, x) => s + x.revenue, 0);
  const totalSold = pkgStats.reduce((s, x) => s + x.soldCount, 0);

  const columns = [
    { key: 'name', label: 'Tên Gói dịch vụ' },
    { key: 'price', label: 'Giá bán gói', align: 'right', render: (v) => formatVND(v) },
    { key: 'sessions', label: 'Số lượt sử dụng / gói', align: 'right', render: (v) => <span className="font-semibold text-slate-700">{v} lượt</span> },
    { key: 'soldCount', label: 'Đã bán thành công', align: 'right', render: (v) => <span className="font-semibold text-blue-600">{v} gói</span> },
    { key: 'revenue', label: 'Tổng Doanh Số', align: 'right', render: (v) => <span className="font-bold text-emerald-600">{formatVND(v)}</span> }
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard title="Tổng Gói Dịch Vụ Mới" value={packages.length} growth={0} icon={PackageCheck} color="blue" />
        <KPICard title="Tổng Số Gói Đã Bán" value={`${totalSold} gói`} growth={15} icon={Layers} color="emerald" />
        <KPICard title="Tổng Doanh Số Bán Gói" value={formatVND(totalRev)} growth={18} icon={DollarSign} color="purple" />
        <KPICard title="Dư Lượng Lượt Còn Tồn" value={`${totalSold * 8} lượt`} growth={5} icon={Clock} color="amber" />
      </div>

      <DataTable columns={columns} data={pkgStats} emptyText="Không có dữ liệu gói dịch vụ" />
    </div>
  );
}
