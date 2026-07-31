'use client';
import React from 'react';
import { CreditCard, Wallet, DollarSign, AlertCircle } from 'lucide-react';
import KPICard from '../KPICard';
import AlertBanner from '../AlertBanner';
import DataTable from '../DataTable';
import { formatVND } from '@/lib/format';
import { generateOperationalAlerts } from '@/lib/reportsEngine';

export default function PrepaidCardsTab({ prepaidCards = [] }) {
  const totalCards = prepaidCards.length;
  const totalBalance = prepaidCards.reduce((s, c) => s + (c.balance || c.initial_balance || 0), 0);
  const activeCards = prepaidCards.filter(c => (c.balance || c.initial_balance || 0) > 0).length;

  const alerts = generateOperationalAlerts([], [], prepaidCards);

  const columns = [
    { key: 'card_number', label: 'Số thẻ / Mã tài khoản', render: (v, r) => <span className="font-bold text-slate-800">{v || r.code || r.id}</span> },
    { key: 'customer_name', label: 'Tên chủ thẻ' },
    { key: 'initial_balance', label: 'Mệnh giá nạp', align: 'right', render: (v) => formatVND(v || 0) },
    { key: 'balance', label: 'Số dư hiện tại', align: 'right', render: (v, r) => <span className="font-bold text-emerald-600">{formatVND(v !== undefined ? v : r.initial_balance || 0)}</span> },
    { key: 'status', label: 'Trạng thái', render: (v) => <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[11px]">{v || 'Đang dùng'}</span> }
  ];

  return (
    <div className="space-y-5">
      <AlertBanner alerts={alerts} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard title="Tổng Tài Khoản Thẻ Tiền Mặt" value={totalCards} growth={8} icon={CreditCard} color="blue" />
        <KPICard title="Thẻ Đang Còn Số Dư" value={activeCards} growth={6} icon={Wallet} color="emerald" />
        <KPICard title="Tổng Số Dư Tiền Đã Cọc" value={formatVND(totalBalance)} growth={15} icon={DollarSign} color="purple" />
        <KPICard title="Mệnh Giá Nạp Trung Bình" value={formatVND(totalCards > 0 ? Math.round(totalBalance / totalCards) : 0)} growth={3} icon={AlertCircle} color="amber" />
      </div>

      <DataTable columns={columns} data={prepaidCards} emptyText="Không có dữ liệu thẻ tiền mặt" />
    </div>
  );
}
