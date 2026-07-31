'use client';
import React, { useState, useEffect } from 'react';
import { TrendingDown, Search, ExternalLink } from 'lucide-react';
import DateRangeFilter from '@/components/ui/DateRangeFilter';
import { base44 } from '@/api/base44Client';
import { formatVND } from '@/lib/format';
import { getPaymentMethodLabel } from '@/lib/cashFlowHelper';

const SOURCE_LABELS = { auto: '⚡ Tự động', manual: '✏️ Thủ công' };
const SOURCE_COLORS = { auto: 'bg-blue-50 text-blue-600', manual: 'bg-slate-100 text-slate-500' };

export default function ExpenseTab({ branchId, onReload }) {
  const [vouchers, setVouchers] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [v, t] = await Promise.all([
        base44.entities.CashVoucher.list(),
        base44.entities.CashVoucherType.list(),
      ]);
      setVouchers((v || []).filter(x => x.flow === 'expense'));
      setTypes((t || []).filter(x => x.flow === 'expense'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [branchId, onReload]);

  const filtered = vouchers.filter(v => {
    if (filterType !== 'all' && v.type_code !== filterType) return false;
    if (filterSource !== 'all' && v.source !== filterSource) return false;
    if (dateFrom && v.date < dateFrom) return false;
    if (dateTo && v.date > dateTo) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        v.code?.toLowerCase().includes(q) ||
        v.description?.toLowerCase().includes(q) ||
        v.type_name?.toLowerCase().includes(q) ||
        v.ref_code?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalAmount = filtered.reduce((s, v) => s + (Number(v.amount) || 0), 0);

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-3 border-red-200 border-t-red-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl p-5 text-white flex items-center justify-between shadow-lg shadow-red-100">
        <div>
          <p className="text-red-100 text-xs font-semibold uppercase tracking-wider mb-1">Tổng phiếu chi</p>
          <p className="text-2xl font-bold">{formatVND(totalAmount)}</p>
          <p className="text-red-200 text-xs mt-0.5">{filtered.length} phiếu</p>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
          <TrendingDown className="w-6 h-6" />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm mã phiếu, mô tả..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-red-400"
            />
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-red-400 bg-white"
          >
            <option value="all">Tất cả loại</option>
            {types.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
          </select>
          <select
            value={filterSource}
            onChange={e => setFilterSource(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-red-400 bg-white"
          >
            <option value="all">Tất cả nguồn</option>
            <option value="auto">⚡ Tự động</option>
            <option value="manual">✏️ Thủ công</option>
          </select>
        </div>
        <div className="flex gap-2 items-center">
          <DateRangeFilter
            startDate={dateFrom}
            endDate={dateTo}
            onStartDateChange={setDateFrom}
            onEndDateChange={setDateTo}
            color="red"
          />
          {(dateFrom || dateTo || filterType !== 'all' || filterSource !== 'all' || search) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); setFilterType('all'); setFilterSource('all'); setSearch(''); }}
              className="text-xs text-red-500 hover:text-red-600 font-medium px-2"
            >
              Xoá lọc
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <TrendingDown className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Chưa có phiếu chi nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Mã phiếu</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Ngày</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Loại</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Mô tả</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">P.thức</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Nguồn</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Số tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(v => {
                  const typeObj = types.find(t => t.code === v.type_code);
                  return (
                    <tr key={v.id} className="hover:bg-red-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-slate-700">{v.code}</span>
                        {v.ref_code && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <ExternalLink className="w-2.5 h-2.5" /> {v.ref_code}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{v.date}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                          style={{ background: typeObj?.color || '#94A3B8' }}
                        >
                          {v.type_name || 'Khác'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-[200px] truncate">{v.description || '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{getPaymentMethodLabel(v.payment_method)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${SOURCE_COLORS[v.source] || SOURCE_COLORS.manual}`}>
                          {SOURCE_LABELS[v.source] || v.source}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-red-500">{formatVND(v.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-red-50 border-t-2 border-red-100">
                  <td colSpan={6} className="px-4 py-3 text-xs font-bold text-red-700">Tổng cộng ({filtered.length} phiếu)</td>
                  <td className="px-4 py-3 text-right font-bold text-red-700 text-sm">{formatVND(totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
