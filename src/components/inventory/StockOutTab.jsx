'use client';
import React, { useState } from 'react';
import { Search, Plus, ArrowUpRight, ChevronDown, ChevronUp } from 'lucide-react';
import { formatVND } from '@/lib/format';
import { useT } from '@/lib/i18n';
import StockOutModal from './StockOutModal';

export default function StockOutTab({ stockReceipts, products, onCreateReceipt }) {
  const { t } = useT();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  // Filter stock-out receipts only
  const outReceipts = (stockReceipts || []).filter(r => r.type === 'out');

  const filtered = outReceipts.filter(r => {
    const q = search.toLowerCase();
    return !q || (r.code || '').toLowerCase().includes(q) || (r.reason || '').toLowerCase().includes(q);
  });

  const totalValue = outReceipts.reduce((sum, r) => sum + (r.total_amount || 0), 0);

  const handleSave = (receiptData) => {
    onCreateReceipt(receiptData);
    setShowModal(false);
  };

  return (
    <div className="space-y-4 font-sans text-left">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <div className="text-xs text-slate-400 font-medium">{t('inventory.total_stock_out_receipts', 'Tổng Số Phiếu Xuất Kho')}</div>
          <div className="text-xl font-bold text-slate-800 mt-1">{outReceipts.length} {t('inventory.receipts_unit', 'phiếu')}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <div className="text-xs text-slate-400 font-medium">{t('inventory.total_stock_out_cost', 'Tổng Giá Trị Vốn Xuất Kho')}</div>
          <div className="text-xl font-bold text-orange-600 mt-1">{formatVND(totalValue)}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <div className="text-xs text-slate-400 font-medium">{t('inventory.stock_status_label', 'Trạng Thái Kho')}</div>
          <div className="text-xl font-bold text-slate-700 mt-1">{t('inventory.status_deducted_stock', 'Đã trừ tồn kho')}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-2xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('inventory.search_stock_out_placeholder', 'Tìm mã phiếu xuất, lý do xuất...')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-500 text-slate-800"
          />
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {t('inventory.btn_create_stock_out', 'Tạo Phiếu Xuất Kho')}
        </button>
      </div>

      {/* Table Stock Out Receipts */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
              <tr>
                <th className="py-3.5 px-4">{t('inventory.col_receipt_code', 'Mã Phiếu')}</th>
                <th className="py-3.5 px-4">{t('inventory.col_time', 'Thời gian')}</th>
                <th className="py-3.5 px-4">{t('inventory.col_reason_stock_out', 'Lý do xuất kho')}</th>
                <th className="py-3.5 px-4">{t('inventory.col_creator', 'Người tạo')}</th>
                <th className="py-3.5 px-4 text-right">{t('inventory.col_total_cost_out_vnd', 'Tổng vốn xuất (VNĐ)')}</th>
                <th className="py-3.5 px-4 text-center">{t('inventory.col_details', 'Chi tiết')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">{t('inventory.no_stock_out_receipts_found', 'Không tìm thấy phiếu xuất kho nào')}</td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const isExpanded = expandedId === r.id;
                  return (
                    <React.Fragment key={r.id}>
                      <tr className="hover:bg-orange-50/20 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-orange-600">
                          {r.code}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-normal">{r.date}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{r.reason}</td>
                        <td className="py-3.5 px-4 text-slate-600">{r.created_by}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-orange-600">{formatVND(r.total_amount)}</td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : r.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer inline-flex items-center gap-1 font-semibold text-[11px]"
                          >
                            <span>{(r.items || []).length} {t('inventory.items_summary', 'SP')}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Sub-table */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={6} className="p-4">
                            <div className="bg-white rounded-xl p-3 border border-slate-200/80 space-y-2">
                              <div className="text-xs font-bold text-slate-800">{t('inventory.stock_out_detail_title', 'Chi tiết sản phẩm xuất')} ({r.code}):</div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-[11px]">
                                  <thead className="bg-slate-100 font-bold text-slate-600 border-b border-slate-200">
                                    <tr>
                                      <th className="p-2">{t('inventory.col_product_name', 'Tên sản phẩm')}</th>
                                      <th className="p-2 text-center">{t('inventory.col_unit', 'ĐVT')}</th>
                                      <th className="p-2 text-center">{t('inventory.col_stock_out_qty', 'Số lượng xuất')}</th>
                                      <th className="p-2 text-right">{t('inventory.cost_price_label', 'Giá vốn')}</th>
                                      <th className="p-2 text-right">{t('inventory.total_cost_label', 'Tổng vốn')}</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {(r.items || []).map((it, idx) => (
                                      <tr key={idx}>
                                        <td className="p-2 font-bold text-slate-800">{it.product_name}</td>
                                        <td className="p-2 text-center text-slate-500">{it.unit}</td>
                                        <td className="p-2 text-center font-bold text-orange-600">-{it.qty}</td>
                                        <td className="p-2 text-right">{formatVND(it.unit_price)}</td>
                                        <td className="p-2 text-right font-bold">{formatVND(it.total_price)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Popup */}
      {showModal && (
        <StockOutModal
          products={products}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
