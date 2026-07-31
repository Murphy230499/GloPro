'use client';
import React from 'react';
import { Activity, DollarSign, CheckCircle, Clock } from 'lucide-react';
import KPICard from '../KPICard';
import DataTable from '../DataTable';
import { formatVND } from '@/lib/format';

export default function TreatmentsTab({ treatments = [], invoices = [] }) {
  const trtStats = treatments.map(trt => {
    let soldCount = 0;
    let revenue = 0;

    invoices.forEach(inv => {
      (inv.items || []).forEach(it => {
        if (it.name === trt.name || it.treatment_id === trt.id) {
          soldCount += (it.qty || 1);
          revenue += (it.price || 0) * (it.qty || 1);
        }
      });
    });

    return {
      id: trt.id,
      name: trt.name,
      price: trt.price || 0,
      sessions: trt.sessions || 5,
      soldCount,
      revenue
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const totalRev = trtStats.reduce((s, x) => s + x.revenue, 0);
  const totalSold = trtStats.reduce((s, x) => s + x.soldCount, 0);

  const columns = [
    { key: 'name', label: 'Tên Liệu trình chuyên sâu' },
    { key: 'price', label: 'Giá trọn gói', align: 'right', render: (v) => formatVND(v) },
    { key: 'sessions', label: 'Quy trình chuẩn', align: 'right', render: (v) => <span className="font-semibold text-slate-700">{v} buổi</span> },
    { key: 'soldCount', label: 'Đã phát hành', align: 'right', render: (v) => <span className="font-semibold text-blue-600">{v} liệu trình</span> },
    { key: 'revenue', label: 'Tổng Doanh Thu', align: 'right', render: (v) => <span className="font-bold text-emerald-600">{formatVND(v)}</span> }
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard title="Liệu Trình Đang Quản Lý" value={treatments.length} growth={0} icon={Activity} color="blue" />
        <KPICard title="Liệu Trình Đã Phát Hành" value={`${totalSold} bộ`} growth={12} icon={CheckCircle} color="emerald" />
        <KPICard title="Doanh Thu Liệu Trình" value={formatVND(totalRev)} growth={20} icon={DollarSign} color="purple" />
        <KPICard title="Tỷ Lệ Hoàn Thành" value="78%" growth={4} icon={Clock} color="amber" />
      </div>

      <DataTable columns={columns} data={trtStats} emptyText="Không có dữ liệu liệu trình" />
    </div>
  );
}
