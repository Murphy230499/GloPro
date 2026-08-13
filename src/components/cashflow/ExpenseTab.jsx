'use client';
import React, { useState, useEffect } from 'react';
import { TrendingDown, Search, ExternalLink, ChevronDown } from 'lucide-react';
import DateRangeFilter from '@/components/ui/DateRangeFilter';
import { base44 } from '@/api/base44Client';
import { formatVND } from '@/lib/format';
import { getPaymentMethodLabel } from '@/lib/cashFlowHelper';

const SOURCE_LABELS = { auto: '⚡ Tự động', manual: '✏️ Thủ công' };
const SOURCE_COLORS = { auto: 'bg-blue-50 text-blue-600', manual: 'bg-slate-100 text-slate-500' };

import { useT } from '@/lib/i18n';

export default function ExpenseTab({ branchId, onReload }) {
  const { t } = useT();
  const [vouchers, setVouchers] = useState([]);
  const [types, setTypes] = useState([]);
  const [mobileTypeOpen, setMobileTypeOpen] = useState(false);
  const [mobileSourceOpen, setMobileSourceOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const SOURCE_LABELS = { auto: `⚡ ${t('cashflow.source_auto', 'Tự động')}`, manual: `✏️ ${t('cashflow.source_manual', 'Thủ công')}` };
  const SOURCE_COLORS = { auto: 'bg-blue-50 text-blue-600', manual: 'bg-slate-100 text-slate-500' };

  const load = async () => {
    setLoading(true);
    try {
      const [v, tData] = await Promise.all([
        base44.entities.CashVoucher.list(),
        base44.entities.CashVoucherType.list(),
      ]);
      setVouchers((v || []).filter(x => x.flow === 'expense'));
      setTypes((tData || []).filter(x => x.flow === 'expense'));
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

  const translateVoucherDescription = (desc) => {
    if (!desc) return '—';
    if (desc.startsWith('Thanh toán hoá đơn #')) {
      return desc.replace('Thanh toán hoá đơn #', `${t('cashflow.desc_invoice_payment', 'Payment for invoice')} #`);
    }
    if (desc.startsWith('Tiền TIP hoá đơn #')) {
      return desc.replace('Tiền TIP hoá đơn #', `${t('cashflow.desc_tip_payment', 'Tip for invoice')} #`);
    }
    if (desc.startsWith('Thu tiền cọc phiếu ')) {
      return desc.replace('Thu tiền cọc phiếu ', `${t('cashflow.desc_deposit_payment', 'Deposit payment for')} `);
    }
    if (desc.startsWith('Thanh toán đơn hàng #')) {
      return desc.replace('Thanh toán đơn hàng #', `${t('cashflow.desc_order_payment', 'Payment for order')} #`);
    }
    return desc;
  };

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl p-5 text-white flex items-center justify-between shadow-lg shadow-red-100">
        <div>
          <p className="text-red-100 text-xs font-semibold uppercase tracking-wider mb-1">{t('cashflow.total_expense_title', 'Tổng phiếu chi')}</p>
          <p className="text-2xl font-bold">{formatVND(totalAmount)}</p>
          <p className="text-red-200 text-xs mt-0.5">{filtered.length} {t('cashflow.voucher_unit', 'phiếu')}</p>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
          <TrendingDown className="w-6 h-6" />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('cashflow.search_voucher_ph', 'Tìm mã phiếu, mô tả...')}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-red-400"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Mobile Custom Select for Type */}
            <div className="relative block sm:hidden w-full">
              <button
                type="button"
                onClick={() => { setMobileTypeOpen(!mobileTypeOpen); setMobileSourceOpen(false); }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 bg-white shadow-2xs"
              >
                <span>{filterType === 'all' ? t('cashflow.filter_all_types', 'Tất cả loại') : types.find(tItem => tItem.code === filterType)?.name || filterType}</span>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
              {mobileTypeOpen && (
                <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-xl border border-slate-200 shadow-xl z-50 py-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                  <button onClick={() => { setFilterType('all'); setMobileTypeOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0">
                    {t('cashflow.filter_all_types', 'Tất cả loại')}
                  </button>
                  {types.map(typeItem => (
                    <button key={typeItem.code} onClick={() => { setFilterType(typeItem.code); setMobileTypeOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0">
                      {typeItem.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Desktop Native Select for Type */}
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="hidden sm:block w-full sm:w-auto flex-1 px-3 pr-8 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-red-400 bg-white"
            >
              <option value="all">{t('cashflow.filter_all_types', 'Tất cả loại')}</option>
              {types.map(typeItem => (
                <option key={typeItem.code} value={typeItem.code}>
                  {typeItem.name}
                </option>
              ))}
            </select>

            {/* Mobile Custom Select for Source */}
            <div className="relative block sm:hidden w-full">
              <button
                type="button"
                onClick={() => { setMobileSourceOpen(!mobileSourceOpen); setMobileTypeOpen(false); }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 bg-white shadow-2xs"
              >
                <span>
                  {filterSource === 'all' && t('cashflow.filter_all_sources', 'Tất cả nguồn')}
                  {filterSource === 'auto' && `⚡ ${t('cashflow.source_auto', 'Tự động')}`}
                  {filterSource === 'manual' && `✏️ ${t('cashflow.source_manual', 'Thủ công')}`}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
              {mobileSourceOpen && (
                <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-xl border border-slate-200 shadow-xl z-50 py-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                  <button onClick={() => { setFilterSource('all'); setMobileSourceOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-100">
                    {t('cashflow.filter_all_sources', 'Tất cả nguồn')}
                  </button>
                  <button onClick={() => { setFilterSource('auto'); setMobileSourceOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-100">
                    ⚡ {t('cashflow.source_auto', 'Tự động')}
                  </button>
                  <button onClick={() => { setFilterSource('manual'); setMobileSourceOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">
                    ✏️ {t('cashflow.source_manual', 'Thủ công')}
                  </button>
                </div>
              )}
            </div>
            {/* Desktop Native Select for Source */}
            <select
              value={filterSource}
              onChange={e => setFilterSource(e.target.value)}
              className="hidden sm:block w-full sm:w-auto flex-1 px-3 pr-8 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-red-400 bg-white"
            >
              <option value="all">{t('cashflow.filter_all_sources', 'Tất cả nguồn')}</option>
              <option value="auto">⚡ {t('cashflow.source_auto', 'Tự động')}</option>
              <option value="manual">✏️ {t('cashflow.source_manual', 'Thủ công')}</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full sm:w-auto">
          <div className="w-full sm:w-auto sm:flex-none">
            <DateRangeFilter
              startDate={dateFrom}
              endDate={dateTo}
              onStartDateChange={setDateFrom}
              onEndDateChange={setDateTo}
              color="red"
            />
          </div>
          {(dateFrom || dateTo || filterType !== 'all' || filterSource !== 'all' || search) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); setFilterType('all'); setFilterSource('all'); setSearch(''); }} className="text-xs text-red-500 hover:text-red-600 font-medium px-2 self-end sm:self-auto pb-1 sm:pb-0">
              {t('cashflow.clear_filter', 'Xoá lọc')}
            </button>
          )}
        </div>
      </div>

      {/* Table & Cards */}
      <div className="overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
            <TrendingDown className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">{t('cashflow.no_expense_vouchers', 'Chưa có phiếu chi nào')}</p>
          </div>
        ) : (
          <>
            {/* Mobile View (Cards) */}
            <div className="md:hidden flex flex-col gap-3">
              {filtered.map(v => {
                const typeObj = types.find(t => t.code === v.type_code);
                return (
                  <div key={v.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="font-mono text-sm font-bold text-slate-800">{v.code}</div>
                        <div className="text-xs text-slate-500 mt-1">{v.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-500 text-sm">{formatVND(v.amount)}</div>
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-full text-[10px] font-semibold text-white shadow-2xs"
                          style={{ background: typeObj?.color || '#94A3B8' }}
                        >
                          {typeObj?.name || v.type_name || 'Khác'}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-slate-600 font-medium">
                      {translateVoucherDescription(v.description)}
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${SOURCE_COLORS[v.source] || SOURCE_COLORS.manual}`}>
                        {SOURCE_LABELS[v.source] || v.source}
                      </span>
                      <span className="text-slate-500 font-medium bg-slate-50 px-2 py-1 rounded-lg">
                        {t(`cashflow.pm_${v.payment_method}`, getPaymentMethodLabel(v.payment_method))}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex justify-between items-center mt-1 shadow-sm">
                <span className="text-xs font-bold text-red-700 uppercase tracking-wider">{t('cashflow.total_summary_prefix', 'Tổng cộng')} ({filtered.length})</span>
                <span className="font-bold text-red-700 text-sm">{formatVND(totalAmount)}</span>
              </div>
            </div>

            {/* Desktop View (Table) */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-2xs">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">{t('cashflow.col_voucher_code', 'Mã phiếu')}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">{t('cashflow.col_date', 'Ngày')}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">{t('cashflow.col_type', 'Loại')}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">{t('cashflow.col_description', 'Mô tả')}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">{t('cashflow.col_method', 'P.thức')}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">{t('cashflow.col_source', 'Nguồn')}</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">{t('cashflow.col_amount', 'Số tiền')}</th>
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
                            {typeObj?.name || v.type_name || 'Khác'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 max-w-[200px] truncate">
                          {translateVoucherDescription(v.description)}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {t(`cashflow.pm_${v.payment_method}`, getPaymentMethodLabel(v.payment_method))}
                        </td>
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
                    <td colSpan={6} className="px-4 py-3 text-xs font-bold text-red-700">{t('cashflow.total_summary_prefix', 'Tổng cộng')} ({filtered.length} {t('cashflow.voucher_unit', 'phiếu')})</td>
                    <td className="px-4 py-3 text-right font-bold text-red-700 text-sm">{formatVND(totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
