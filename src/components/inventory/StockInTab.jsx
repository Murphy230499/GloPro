'use client';
import React, { useState } from 'react';
import { Search, Plus, ArrowDownLeft, Calendar, FileText, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatVND } from '@/lib/format';
import StockInModal from './StockInModal';

export default function StockInTab({ stockReceipts, suppliers, products, onCreateReceipt }) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  // Filter stock-in receipts only
  const inReceipts = (stockReceipts || []).filter(r => r.type === 'in');

  const filtered = inReceipts.filter(r => {
    const q = search.toLowerCase();
    return !q || (r.code || '').toLowerCase().includes(q) || (r.supplier_name || '').toLowerCase().includes(q) || (r.reason || '').toLowerCase().includes(q);
  });

  const totalValue = inReceipts.reduce((sum, r) => sum + (r.total_amount || 0), 0);

  const handleSave = (receiptData) => {
    onCreateReceipt(receiptData);
    setShowModal(false);
  };

  return (
    <div className="space-y-4 font-sans text-left">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <div className="text-xs text-slate-400 font-medium">Tổng Số Phiếu Nhập Kho</div>
          <div className="text-xl font-bold text-slate-800 mt-1">{inReceipts.length} phiếu</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <div className="text-xs text-slate-400 font-medium">Tổng Giá Trị Nhập Hàng</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{formatVND(totalValue)}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <div className="text-xs text-slate-400 font-medium">Trạng Thái</div>
          <div className="text-xl font-bold text-purple-600 mt-1">Đã cập nhật tồn kho</div>
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
            placeholder="Tìm mã phiếu, nhà cung cấp, lý do..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-500 text-slate-800"
          />
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Tạo Phiếu Nhập Kho
        </button>
      </div>

      {/* Table Stock In Receipts */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
              <tr>
                <th className="py-3.5 px-4">Mã Phiếu</th>
                <th className="py-3.5 px-4">Thời gian</th>
                <th className="py-3.5 px-4">Nhà cung cấp</th>
                <th className="py-3.5 px-4">Lý do nhập</th>
                <th className="py-3.5 px-4 text-right">Tổng tiền (VNĐ)</th>
                <th className="py-3.5 px-4 text-right">Thanh toán</th>
                <th className="py-3.5 px-4 text-center">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">Không tìm thấy phiếu nhập kho nào</td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const isExpanded = expandedId === r.id;
                  return (
                    <React.Fragment key={r.id}>
                      <tr className="hover:bg-purple-50/20 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-purple-700">
                          {r.code}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-normal">{r.date}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{r.supplier_name}</td>
                        <td className="py-3.5 px-4 text-slate-600">{r.reason}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">{formatVND(r.total_amount)}</td>
                        <td className="py-3.5 px-4 text-right">
                          <span className={`font-semibold ${r.debt_amount > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                            {formatVND(r.paid_amount)}
                          </span>
                          {r.debt_amount > 0 && (
                            <div className="text-[10px] text-red-500 font-normal">Nợ: {formatVND(r.debt_amount)}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : r.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer inline-flex items-center gap-1 font-semibold text-[11px]"
                          >
                            <span>{(r.items || []).length} SP</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Sub-table */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={7} className="p-4">
                            <div className="bg-white rounded-xl p-3 border border-slate-200/80 space-y-2">
                              <div className="text-xs font-bold text-slate-800">Chi tiết sản phẩm nhập ({r.code}):</div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-[11px]">
                                  <thead className="bg-slate-100 font-bold text-slate-600 border-b border-slate-200">
                                    <tr>
                                      <th className="p-2">Tên sản phẩm</th>
                                      <th className="p-2 text-center">ĐVT</th>
                                      <th className="p-2 text-center">Số lượng</th>
                                      <th className="p-2 text-right">Đơn giá nhập</th>
                                      <th className="p-2 text-right">Thành tiền</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {(r.items || []).map((it, idx) => (
                                      <tr key={idx}>
                                        <td className="p-2 font-bold text-slate-800">{it.product_name}</td>
                                        <td className="p-2 text-center text-slate-500">{it.unit}</td>
                                        <td className="p-2 text-center font-bold text-purple-700">+{it.qty}</td>
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
        <StockInModal
          suppliers={suppliers}
          products={products}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
