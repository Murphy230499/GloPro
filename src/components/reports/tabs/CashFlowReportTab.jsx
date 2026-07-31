'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatVND } from '@/lib/format';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar
} from 'recharts';

// Parse date range from preset string (matches FilterBar logic)
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
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}tr`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return String(v);
};

export default function CashFlowReportTab({ datePreset = '30d', customRange }) {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Build daily chart data
  const chartData = useMemo(() => {
    const days = {};
    filtered.forEach(v => {
      if (!days[v.date]) days[v.date] = { date: v.date, income: 0, expense: 0 };
      if (v.flow === 'income') days[v.date].income += Number(v.amount) || 0;
      else days[v.date].expense += Number(v.amount) || 0;
    });
    return Object.values(days).sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

  // Build type breakdown
  const incomeByType = useMemo(() => {
    const map = {};
    filtered.filter(v => v.flow === 'income').forEach(v => {
      const k = v.type_name || 'Khác';
      map[k] = (map[k] || 0) + (Number(v.amount) || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const expenseByType = useMemo(() => {
    const map = {};
    filtered.filter(v => v.flow === 'expense').forEach(v => {
      const k = v.type_name || 'Khác';
      map[k] = (map[k] || 0) + (Number(v.amount) || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

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
            <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Tổng Thu</p>
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold">{formatVND(totalIncome)}</p>
          <p className="text-emerald-200 text-xs mt-1">{filtered.filter(v => v.flow === 'income').length} phiếu thu</p>
        </div>

        {/* Total Expense */}
        <div className="bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl p-5 text-white shadow-lg shadow-red-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-red-100 text-xs font-semibold uppercase tracking-wider">Tổng Chi</p>
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold">{formatVND(totalExpense)}</p>
          <p className="text-red-200 text-xs mt-1">{filtered.filter(v => v.flow === 'expense').length} phiếu chi</p>
        </div>

        {/* Net */}
        <div className={`rounded-2xl p-5 text-white shadow-lg ${netProfit >= 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-500 shadow-blue-100' : 'bg-gradient-to-br from-slate-600 to-slate-700'}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider">Lợi nhuận thuần</p>
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold">{netProfit >= 0 ? '+' : ''}{formatVND(netProfit)}</p>
          <p className="text-blue-200 text-xs mt-1 flex items-center gap-1">
            {netProfit >= 0
              ? <><ArrowUpRight className="w-3 h-3" /> Dòng tiền dương</>
              : <><ArrowDownRight className="w-3 h-3" /> Dòng tiền âm</>
            }
          </p>
        </div>
      </div>

      {/* Line Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Biểu đồ Thu Chi theo ngày</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(v, name) => [formatVND(v), name === 'income' ? 'Thu' : 'Chi']}
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Legend formatter={v => v === 'income' ? 'Thu' : 'Chi'} />
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
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Cơ cấu phiếu thu
          </h3>
          {incomeByType.length === 0 ? (
            <p className="text-slate-400 text-xs text-center py-6">Chưa có dữ liệu</p>
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
            <TrendingDown className="w-4 h-4 text-red-500" /> Cơ cấu phiếu chi
          </h3>
          {expenseByType.length === 0 ? (
            <p className="text-slate-400 text-xs text-center py-6">Chưa có dữ liệu</p>
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
            <h3 className="text-sm font-bold text-slate-800">Chi tiết giao dịch</h3>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Mã phiếu</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Ngày</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Loại</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Mô tả</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-slate-500">Số tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[...filtered].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 100).map(v => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-mono">{v.code}</td>
                    <td className="px-4 py-2 text-slate-500">{v.date}</td>
                    <td className="px-4 py-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${v.flow === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
                        {v.type_name}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-500 max-w-[160px] truncate">{v.description}</td>
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
          <p className="text-slate-400 text-sm font-medium">Chưa có dữ liệu dòng tiền trong kỳ này</p>
          <p className="text-slate-300 text-xs mt-1">Hãy thanh toán hoá đơn hoặc tạo phiếu thu/chi thủ công</p>
        </div>
      )}
    </div>
  );
}
