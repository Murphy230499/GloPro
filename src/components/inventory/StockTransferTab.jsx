'use client';
import React, { useState } from 'react';
import { Search, Plus, ArrowRightLeft, CheckCircle2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from '@/components/Layout';
import { useT } from '@/lib/i18n';
import StockTransferModal from './StockTransferModal';

export default function StockTransferTab({ stockTransfers, products, onCreateTransfer, onConfirmReceiveTransfer }) {
  const { t } = useT();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const filtered = (stockTransfers || []).filter(t => {
    const q = search.toLowerCase();
    return !q || (t.code || '').toLowerCase().includes(q) || (t.from_branch_name || '').toLowerCase().includes(q) || (t.to_branch_name || '').toLowerCase().includes(q);
  });

  const pendingCount = (stockTransfers || []).filter(t => t.status === 'pending').length;
  const completedCount = (stockTransfers || []).filter(t => t.status === 'transferred').length;

  const handleSave = (transferData) => {
    onCreateTransfer(transferData);
    setShowModal(false);
  };

  return (
    <div className="space-y-4 font-sans text-left">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <div className="text-xs text-slate-400 font-medium">{t('inventory.total_transfer_batches', 'Tổng Đợt Điều Chuyển Kho')}</div>
          <div className="text-xl font-bold text-slate-800 mt-1">{stockTransfers.length} {t('inventory.receipts_unit', 'phiếu')}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <div className="text-xs text-slate-400 font-medium">{t('inventory.in_transit', 'Đang Vận Chuyển')}</div>
          <div className="text-xl font-bold text-amber-600 mt-1">{pendingCount} {t('inventory.receipts_unit', 'phiếu')}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <div className="text-xs text-slate-400 font-medium">{t('inventory.transfer_completed', 'Đã Nhận Hàng Hoàn Tất')}</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{completedCount} {t('inventory.receipts_unit', 'phiếu')}</div>
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
            placeholder={t('inventory.search_transfer_placeholder', 'Tìm mã phiếu chuyển, chi nhánh xuất, chi nhánh nhận...')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-500 text-slate-800"
          />
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {t('inventory.btn_create_transfer', 'Tạo Phiếu Chuyển Kho')}
        </button>
      </div>

      {/* Table Stock Transfers */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
              <tr>
                <th className="py-3.5 px-4">{t('inventory.col_receipt_code', 'Mã Phiếu')}</th>
                <th className="py-3.5 px-4">{t('inventory.col_time', 'Thời gian')}</th>
                <th className="py-3.5 px-4">{t('inventory.col_from_branch', 'Kho xuất (Chi nhánh đi)')}</th>
                <th className="py-3.5 px-4">{t('inventory.col_to_branch', 'Kho nhận (Chi nhánh đến)')}</th>
                <th className="py-3.5 px-4 text-center">{t('inventory.col_status', 'Trạng thái')}</th>
                <th className="py-3.5 px-4 text-center">{t('inventory.col_actions', 'Hành động')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">{t('inventory.no_transfers_found', 'Không tìm thấy phiếu điều chuyển kho nào')}</td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isExpanded = expandedId === item.id;
                  const isPending = item.status === 'pending';
                  return (
                    <React.Fragment key={item.id}>
                      <tr className="hover:bg-indigo-50/20 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-indigo-700">
                          {item.code}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-normal">{item.date}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">{item.from_branch_name}</td>
                        <td className="py-3.5 px-4 font-bold text-indigo-900">{item.to_branch_name}</td>
                        <td className="py-3.5 px-4 text-center">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" /> {t('inventory.status_in_transit', 'Đang vận chuyển')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> {t('inventory.status_received', 'Đã nhận hàng')}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {isPending && (
                              <button
                                onClick={() => onConfirmReceiveTransfer(item.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition-colors cursor-pointer"
                              >
                                {t('inventory.btn_confirm_receive', 'Xác nhận đã nhận')}
                              </button>
                            )}

                            <button
                              onClick={() => setExpandedId(isExpanded ? null : item.id)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer inline-flex items-center gap-1 font-semibold text-[11px]"
                            >
                              <span>{(item.items || []).length} {t('inventory.items_summary', 'SP')}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Sub-table */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={6} className="p-4">
                            <div className="bg-white rounded-xl p-3 border border-slate-200/80 space-y-2">
                              <div className="text-xs font-bold text-slate-800">{t('inventory.transfer_detail_title', 'Chi tiết sản phẩm điều chuyển')} ({item.code}):</div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-[11px]">
                                  <thead className="bg-slate-100 font-bold text-slate-600 border-b border-slate-200">
                                    <tr>
                                      <th className="p-2">{t('inventory.col_product_name', 'Tên sản phẩm')}</th>
                                      <th className="p-2 text-center">{t('inventory.col_unit', 'ĐVT')}</th>
                                      <th className="p-2 text-center">{t('inventory.col_transfer_qty', 'Số lượng điều chuyển')}</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {(item.items || []).map((it, idx) => (
                                      <tr key={idx}>
                                        <td className="p-2 font-bold text-slate-800">{it.product_name}</td>
                                        <td className="p-2 text-center text-slate-500">{it.unit}</td>
                                        <td className="p-2 text-center font-bold text-indigo-700">{it.qty}</td>
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
        <StockTransferModal
          products={products}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
