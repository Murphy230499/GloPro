'use client';
import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import KPICard from '../KPICard';
import { formatVND } from '@/lib/format';

export default function FinanceTab({ invoices = [] }) {
  const grossRevenue = invoices.reduce((s, i) => s + (i.total || 0), 0);
  const cogs = Math.round(grossRevenue * 0.25); // 25% cost of goods
  const payroll = Math.round(grossRevenue * 0.30); // 30% staff salary & commission
  const opex = Math.round(grossRevenue * 0.15); // 15% rent, utilities, marketing
  const netProfit = grossRevenue - cogs - payroll - opex;
  const marginPercent = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard title="Tổng Doanh Thu Thuần" value={formatVND(grossRevenue)} growth={15} icon={DollarSign} color="emerald" />
        <KPICard title="Ước Tính Giá Vốn (COGS)" value={formatVND(cogs)} growth={4} icon={TrendingDown} color="amber" />
        <KPICard title="Lợi Nhuận Ròng (Net Profit)" value={formatVND(netProfit)} growth={20} icon={TrendingUp} color="blue" />
        <KPICard title="Biên Lợi Nhuận Ròng" value={`${marginPercent}%`} growth={3} icon={PieChart} color="purple" />
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Báo Cáo Kết Quả Hoạt Động Kinh Doanh (P&L - Profit & Loss)</h3>
        
        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-3 flex justify-between font-bold text-slate-900 text-sm">
            <span>1. Tổng Doanh Thu Thuần</span>
            <span className="text-emerald-600">{formatVND(grossRevenue)}</span>
          </div>
          <div className="py-2.5 flex justify-between font-medium text-slate-600 pl-4">
            <span>2. Giá vốn hàng bán & vật tư (COGS ~25%)</span>
            <span className="text-rose-500">-{formatVND(cogs)}</span>
          </div>
          <div className="py-2.5 flex justify-between font-medium text-slate-600 pl-4">
            <span>3. Lương & Hoa hồng nhân viên (~30%)</span>
            <span className="text-rose-500">-{formatVND(payroll)}</span>
          </div>
          <div className="py-2.5 flex justify-between font-medium text-slate-600 pl-4">
            <span>4. Chi phí mặt bằng & vận hành (~15%)</span>
            <span className="text-rose-500">-{formatVND(opex)}</span>
          </div>
          <div className="py-3.5 flex justify-between font-extrabold text-slate-900 text-base border-t-2 border-slate-200">
            <span>5. Lợi Nhuận Ròng Trước Thẻ (Net Profit)</span>
            <span className="text-blue-600">{formatVND(netProfit)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
