'use client';
import React from 'react';
import { CreditCard, Wallet, QrCode, Banknote } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import KPICard from '../KPICard';
import DataTable from '../DataTable';
import { formatVND } from '@/lib/format';
import { useT } from '@/lib/i18n';

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'];

export default function PosCashierTab({ invoices = [] }) {
  const t = useT();
  let cash = 0;
  let bank = 0;
  let card = 0;
  let prepaid = 0;

  invoices.forEach(inv => {
    const total = inv.total || 0;
    const method = (inv.payment_method || 'cash').toLowerCase();
    if (method.includes('cash') || method.includes('tiền mặt')) cash += total;
    else if (method.includes('bank') || method.includes('chuyển khoản') || method.includes('qr')) bank += total;
    else if (method.includes('card') || method.includes('thẻ pos')) card += total;
    else prepaid += total;
  });

  const totalCollected = cash + bank + card + prepaid;

  const paymentData = [
    { name: t('reports.pm_cash', 'Cash'), value: cash },
    { name: t('reports.pm_bank', 'Bank Transfer / QR'), value: bank },
    { name: t('reports.pm_card', 'Credit Card / POS'), value: card },
    { name: t('reports.pm_prepaid', 'Prepaid Card Deduction'), value: prepaid }
  ];

  const columns = [
    { key: 'invoice_code', label: t('reports.col_invoice_code', 'Invoice Code') },
    { key: 'customer_name', label: t('reports.col_customer', 'Customer') },
    { key: 'payment_method', label: t('reports.col_method', 'Payment Method'), render: (v) => <span className="px-2 font-semibold text-slate-700">{v || t('reports.pm_cash', 'Cash')}</span> },
    { key: 'date', label: t('reports.col_payment_date', 'Payment Date') },
    { key: 'total', label: t('reports.col_total_amount', 'Total Amount'), align: 'right', render: (v) => <span className="font-bold text-emerald-600">{formatVND(v)}</span> }
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard title={t('reports.kpi_cash_in_hand', 'Cash in Hand')} value={formatVND(cash)} growth={5} icon={Banknote} color="emerald" />
        <KPICard title={t('reports.kpi_bank_qr', 'Bank Transfer / QR')} value={formatVND(bank)} growth={22} icon={QrCode} color="blue" />
        <KPICard title={t('reports.kpi_pos_card', 'POS Card Swipe')} value={formatVND(card)} growth={10} icon={CreditCard} color="purple" />
        <KPICard title={t('reports.kpi_prepaid_deduction', 'Prepaid Card Deductions')} value={formatVND(prepaid)} growth={8} icon={Wallet} color="amber" />
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3 min-w-0">
        <h3 className="text-sm font-bold text-slate-800">{t('reports.cashier_payment_breakdown', 'Cashier Payment Method Breakdown')}</h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={paymentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} innerRadius={55}>
              {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v) => [formatVND(v), t('reports.amount_label', 'Amount')]} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 11 }} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 9 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <DataTable columns={columns} data={invoices} emptyText={t('reports.no_cashier_transactions', 'No cashier transactions')} />
    </div>
  );
}
