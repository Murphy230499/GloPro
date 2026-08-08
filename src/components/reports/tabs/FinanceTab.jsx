'use client';
import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import KPICard from '../KPICard';
import { formatVND } from '@/lib/format';
import { useT } from '@/lib/i18n';

export default function FinanceTab({ invoices = [] }) {
  const t = useT();

  const grossRevenue = invoices.reduce((s, i) => s + (i.total || 0), 0);
  const cogs = Math.round(grossRevenue * 0.25);
  const payroll = Math.round(grossRevenue * 0.30);
  const opex = Math.round(grossRevenue * 0.15);
  const netProfit = grossRevenue - cogs - payroll - opex;
  const marginPercent = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard title={t('reports.kpi_total_net_rev', 'Total Net Revenue')} value={formatVND(grossRevenue)} growth={15} icon={DollarSign} color="emerald" />
        <KPICard title={t('reports.kpi_est_cogs', 'Est. Cost of Goods Sold (COGS)')} value={formatVND(cogs)} growth={4} icon={TrendingDown} color="amber" />
        <KPICard title={t('reports.kpi_net_profit', 'Net Profit')} value={formatVND(netProfit)} growth={20} icon={TrendingUp} color="blue" />
        <KPICard title={t('reports.kpi_net_margin', 'Net Profit Margin')} value={`${marginPercent}%`} growth={3} icon={PieChart} color="purple" />
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800">{t('reports.pnl_statement_title', 'Profit & Loss Statement (P&L)')}</h3>
        
        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-3 flex justify-between font-bold text-slate-900 text-sm">
            <span>{t('reports.pnl_line_1', '1. Total Net Revenue')}</span>
            <span className="text-emerald-600">{formatVND(grossRevenue)}</span>
          </div>
          <div className="py-2.5 flex justify-between font-medium text-slate-600 pl-4">
            <span>{t('reports.pnl_line_2', '2. Cost of Goods Sold & Supplies (COGS ~25%)')}</span>
            <span className="text-rose-500">-{formatVND(cogs)}</span>
          </div>
          <div className="py-2.5 flex justify-between font-medium text-slate-600 pl-4">
            <span>{t('reports.pnl_line_3', '3. Staff Salaries & Commissions (~30%)')}</span>
            <span className="text-rose-500">-{formatVND(payroll)}</span>
          </div>
          <div className="py-2.5 flex justify-between font-medium text-slate-600 pl-4">
            <span>{t('reports.pnl_line_4', '4. Rent & Operational OPEX (~15%)')}</span>
            <span className="text-rose-500">-{formatVND(opex)}</span>
          </div>
          <div className="py-3.5 flex justify-between font-extrabold text-slate-900 text-base border-t-2 border-slate-200">
            <span>{t('reports.pnl_line_5', '5. Net Profit')}</span>
            <span className="text-blue-600">{formatVND(netProfit)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
