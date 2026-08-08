'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatVND } from '@/lib/format';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { useT } from '@/lib/i18n';

const getDateRange = (preset, customRange) => {
  const now = new Date();
  if (preset === 'custom' && customRange?.startDate && customRange?.endDate) {
    return { from: customRange.startDate, to: customRange.endDate };
  }
  const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[preset] || 30;
  const from = new Date(now);
  from.setDate(from.getDate() - days);
  return {
    from: from.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
};

const formatCurrency = (v) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return String(v);
};

export default function CashFlowReportTab({ datePreset = '30d', customRange }) {
  const t = useT();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  const translateTypeName = (typeName) => {
    if (!typeName) return t('reports.other', 'Other');
    const mapping = {
      'Bán gói / Thẻ': t('reports.type_sell_package_card', 'Package / Card Sale'),
      'Đặt cọc': t('reports.type_deposit', 'Deposit'),
      'Bán hàng / Dịch vụ': t('reports.type_sale_service', 'Sales / Service'),
      'Tiền TIP': t('reports.type_tip', 'Tips'),
      'Chi phí vận hành': t('reports.type_opex', 'Operating Expense'),
      'Chi phí lương': t('reports.type_salary', 'Salary Expense'),
      'Chi phí nguyên liệu': t('reports.type_materials', 'Material Cost'),
      'Nhập hàng': t('reports.type_stock_import', 'Stock Import'),
      'Khác': t('reports.other', 'Other')
    };
    return mapping[typeName] || typeName;
  };

  const translateDescription = (desc) => {
    if (!desc) return '';
    if (desc === 'Tiền điện') return t('reports.desc_electricity', 'Electricity bill');
    if (desc.startsWith('Thanh toán hoá đơn ')) {
      return desc.replace('Thanh toán hoá đơn ', t('reports.desc_invoice_payment_prefix', 'Invoice payment '));
    }
    if (desc.startsWith('Tiền TIP hoá đơn ')) {
      return desc.replace('Tiền TIP hoá đơn ', t('reports.desc_tip_payment_prefix', 'Tip for invoice '));
    }
    if (desc.startsWith('Thu tiền cọc phiếu ')) {
      return desc.replace('Thu tiền cọc phiếu ', t('reports.desc_deposit_receipt_prefix', 'Deposit receipt '));
    }
    return desc;
  };

  useEffect(() => {
    base44.entities.CashVoucher.list()
      .then(v => setVouchers(v || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const { from, to } = getDateRange(datePreset, customRange);

  const filtered = useMemo(() =>
    vouchers.filter(v => v.date >= from && v.date <= to),
    [vouchers, from, to]
  );

  const totalIncome = filtered.filter(v => v.flow === 'income').reduce((s, v) => s + (Number(v.amount) || 0), 0);
  const totalExpense = filtered.filter(v => v.flow === 'expense').reduce((s, v) => s + (Number(v.amount) || 0), 0);
  const netProfit = totalIncome - totalExpense;

  const chartData = useMemo(() => {
    const days = {};
    filtered.forEach(v => {
      if (!days[v.date]) days[v.date] = { date: v.date, income: 0, expense: 0 };
      if (v.flow === 'income') days[v.date].income += Number(v.amount) || 0;
      else days[v.date].expense += Number(v.amount) || 0;
    });
    return Object.values(days).sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

  const incomeByType = useMemo(() => {
    const map = {};
    filtered.filter(v => v.flow === 'income').forEach(v => {
      const label = translateTypeName(v.type_name);
      map[label] = (map[label] || 0) + (Number(v.amount) || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered, t]);

  const expenseByType = useMemo(() => {
    const map = {};
    filtered.filter(v => v.flow === 'expense').forEach(v => {
      const label = translateTypeName(v.type_name);
      map[label] = (map[label] || 0) + (Number(v.amount) || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered, t]);

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Income */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-5 text-white shadow-lg shadow-emerald-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">{t('reports.kpi_total_income', 'Total Income')}</p>
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold">{formatVND(totalIncome)}</p>
          <p className="text-emerald-200 text-xs mt-1">{filtered.filter(v => v.flow === 'income').length} {t('reports.unit_income_receipts', 'income receipts')}</p>
        </div>

        {/* Total Expense */}
        <div className="bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl p-5 text-white shadow-lg shadow-red-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-red-100 text-xs font-semibold uppercase tracking-wider">{t('reports.kpi_total_expense', 'Total Expense')}</p>
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold">{formatVND(totalExpense)}</p>
          <p className="text-red-200 text-xs mt-1">{filtered.filter(v => v.flow === 'expense').length} {t('reports.unit_expense_receipts', 'expense receipts')}</p>
        </div>

        {/* Net */}
        <div className={`rounded-2xl p-5 text-white shadow-lg ${netProfit >= 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-500 shadow-blue-100' : 'bg-gradient-to-br from-slate-600 to-slate-700'}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider">{t('reports.kpi_net_cash_flow', 'Net Cash Flow')}</p>
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold">{netProfit >= 0 ? '+' : ''}{formatVND(netProfit)}</p>
          <p className="text-blue-200 text-xs mt-1 flex items-center gap-1">
            {netProfit >= 0
              ? <><ArrowUpRight className="w-3 h-3" /> {t('reports.positive_cash_flow', 'Positive Cash Flow')}</>
              : <><ArrowDownRight className="w-3 h-3" /> {t('reports.negative_cash_flow', 'Negative Cash Flow')}</>
            }
          </p>
        </div>
      </div>

      {/* Line Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4">{t('reports.daily_cashflow_chart', 'Daily Cash Flow Chart')}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(v, name) => [formatVND(v), name === 'income' ? t('reports.income', 'Income') : t('reports.expense', 'Expense')]}
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Legend formatter={v => v === 'income' ? t('reports.income', 'Income') : t('reports.expense', 'Expense')} />
              <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2.5} dot={false} name="income" />
              <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2.5} dot={false} name="expense" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Breakdown by Type */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Income breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> {t('reports.income_receipts_breakdown', 'Income Receipts Breakdown')}
          </h3>
          {incomeByType.length === 0 ? (
            <p className="text-slate-400 text-xs text-center py-6">{t('reports.no_data', 'No data available')}</p>
          ) : (
            <div className="space-y-2">
              {incomeByType.map(([name, amount]) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 w-32 truncate">{name}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${Math.min(100, (amount / totalIncome) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-emerald-600 w-24 text-right">{formatVND(amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expense breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-500" /> {t('reports.expense_receipts_breakdown', 'Expense Receipts Breakdown')}
          </h3>
          {expenseByType.length === 0 ? (
            <p className="text-slate-400 text-xs text-center py-6">{t('reports.no_data', 'No data available')}</p>
          ) : (
            <div className="space-y-2">
              {expenseByType.map(([name, amount]) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 w-32 truncate">{name}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-red-400 rounded-full"
                      style={{ width: `${Math.min(100, (amount / totalExpense) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-red-500 w-24 text-right">{formatVND(amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Voucher detail table */}
      {filtered.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">{t('reports.trans_details', 'Transaction Details')}</h3>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500">{t('reports.col_voucher_code', 'Voucher Code')}</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500">{t('reports.col_date', 'Date')}</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500">{t('reports.col_category', 'Category')}</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500">{t('reports.col_description', 'Description')}</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-slate-500">{t('reports.col_amount', 'Amount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[...filtered].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 100).map(v => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-mono">{v.code}</td>
                    <td className="px-4 py-2 text-slate-500">{v.date}</td>
                    <td className="px-4 py-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${v.flow === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
                        {translateTypeName(v.type_name)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-500 max-w-[160px] truncate">{translateDescription(v.description)}</td>
                    <td className={`px-4 py-2 text-right font-bold ${v.flow === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {v.flow === 'income' ? '+' : '-'}{formatVND(v.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center">
          <Wallet className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-medium">{t('reports.no_cashflow_data_period', 'No cash flow data in this period')}</p>
          <p className="text-slate-300 text-xs mt-1">{t('reports.cashflow_hint', 'Please complete invoices or record income/expense receipts manually.')}</p>
        </div>
      )}
    </div>
  );
}
