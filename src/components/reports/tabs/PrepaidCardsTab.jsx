'use client';
import React from 'react';
import { CreditCard, Wallet, DollarSign, AlertCircle } from 'lucide-react';
import KPICard from '../KPICard';
import AlertBanner from '../AlertBanner';
import DataTable from '../DataTable';
import { formatVND } from '@/lib/format';
import { generateOperationalAlerts } from '@/lib/reportsEngine';
import { useT } from '@/lib/i18n';

export default function PrepaidCardsTab({ prepaidCards = [] }) {
  const t = useT();
  const totalCards = prepaidCards.length;
  const totalBalance = prepaidCards.reduce((s, c) => s + (c.balance || c.initial_balance || 0), 0);
  const activeCards = prepaidCards.filter(c => (c.balance || c.initial_balance || 0) > 0).length;

  const alerts = generateOperationalAlerts([], [], prepaidCards);

  const columns = [
    { key: 'card_number', label: t('reports.col_card_no', 'Card / Account No.'), render: (v, r) => <span className="font-bold text-slate-800">{v || r.code || r.id}</span> },
    { key: 'customer_name', label: t('reports.col_cardholder', 'Cardholder Name') },
    { key: 'initial_balance', label: t('reports.col_initial_topup', 'Initial Top-up'), align: 'right', render: (v) => formatVND(v || 0) },
    { key: 'balance', label: t('reports.col_current_balance', 'Current Balance'), align: 'right', render: (v, r) => <span className="font-bold text-emerald-600">{formatVND(v !== undefined ? v : r.initial_balance || 0)}</span> },
    { key: 'status', label: t('reports.col_status', 'Status'), render: (v) => <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[11px]">{v || t('reports.status_active', 'Active')}</span> }
  ];

  return (
    <div className="space-y-5">
      <AlertBanner alerts={alerts} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard title={t('reports.kpi_total_prepaid_accounts', 'Total Prepaid Card Accounts')} value={totalCards} growth={8} icon={CreditCard} color="blue" />
        <KPICard title={t('reports.kpi_active_cards_bal', 'Active Cards with Balance')} value={activeCards} growth={6} icon={Wallet} color="emerald" />
        <KPICard title={t('reports.kpi_total_dep_bal', 'Total Deposited Balance')} value={formatVND(totalBalance)} growth={15} icon={DollarSign} color="purple" />
        <KPICard title={t('reports.kpi_avg_topup_amt', 'Avg Top-up Amount')} value={formatVND(totalCards > 0 ? Math.round(totalBalance / totalCards) : 0)} growth={3} icon={AlertCircle} color="amber" />
      </div>

      <DataTable columns={columns} data={prepaidCards} emptyText={t('reports.no_prepaid_cards_data', 'No prepaid card data available')} />
    </div>
  );
}
