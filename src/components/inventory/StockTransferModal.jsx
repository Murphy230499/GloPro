'use client';
import React, { useState } from 'react';
import { X, Plus, Trash2, ArrowRightLeft, Building2 } from 'lucide-react';
import { todayStr } from '@/lib/format';
import { toast } from '@/components/Layout';

import { useBranch } from '@/lib/BranchContext';

const DEFAULT_BRANCHES = [
  { id: 'branch_q1', name: 'Chi nhánh 1 (Quận 1 - Trụ sở chính)' },
  { id: 'branch_q3', name: 'Chi nhánh 2 (Quận 3 - Spa VIP)' },
  { id: 'branch_bt', name: 'Chi nhánh 3 (Bình Thạnh - Beauty)' }
];

export default function StockTransferModal({ products, onClose, onSave }) {
  const { branches: contextBranches } = useBranch();
  const branchList = (contextBranches && contextBranches.length > 0) ? contextBranches : DEFAULT_BRANCHES;

  const [fromBranchId, setFromBranchId] = useState(branchList[0]?.id || '');
  const [toBranchId, setToBranchId] = useState(branchList[1]?.id || branchList[0]?.id || '');
  const [note, setNote] = useState('');

  // Selected items
  const [items, setItems] = useState([
    { product_id: products?.[0]?.id || '', qty: 1 }
  ]);

  const handleAddItem = () => {
    const defaultProd = products?.[0];
    if (!defaultProd) return;
    setItems([...items, { product_id: defaultProd.id, qty: 1 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return toast.error('Phiếu chuyển kho phải có ít nhất 1 sản phẩm');
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (fromBranchId === toBranchId) {
      return toast.error('Kho xuất và Kho nhận không thể là cùng 1 chi nhánh');
    }

    if (items.length === 0) return toast.error('Vui lòng chọn sản phẩm cần điều chuyển');

    const fromBranch = branchList.find(b => b.id === fromBranchId);
    const toBranch = branchList.find(b => b.id === toBranchId);

    const calculatedItems = items.map(it => {
      const prod = products.find(p => p.id === it.product_id);
      return {
        product_id: it.product_id,
        product_name: prod?.name || 'Sản phẩm',
        unit: prod?.unit || 'Chai/Cái',
        qty: Number(it.qty) || 1
      };
    });

    const transferData = {
      code: `CK-${todayStr().replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      from_branch_id: fromBranchId,
      from_branch_name: fromBranch?.name || 'Kho xuất',
      to_branch_id: toBranchId,
      to_branch_name: toBranch?.name || 'Kho nhận',
      date: new Date().toLocaleString('vi-VN'),
      created_by: 'Quản lý kho',
      status: 'pending', // 'pending' (Đang vận chuyển), 'transferred' (Đã nhận hàng)
      note,
      items: calculatedItems
    };

    onSave(transferData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative bg-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl text-left flex flex-col max-h-[90vh] overflow-y-auto font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">Tạo Phiếu Điều Chuyển Kho</h3>
              <p className="text-xs text-slate-400 font-medium">Chuyển sản phẩm / vật tư giữa các chi nhánh salon</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kho xuất (Chi nhánh đi) <span className="text-red-500">*</span></label>
              <select 
                value={fromBranchId}
                onChange={(e) => setFromBranchId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white outline-none focus:border-purple-500"
              >
                {branchList.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kho nhận (Chi nhánh đến) <span className="text-red-500">*</span></label>
              <select 
                value={toBranchId}
                onChange={(e) => setToBranchId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-indigo-700 bg-white outline-none focus:border-purple-500"
              >
                {branchList.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">Danh sách sản phẩm điều chuyển</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 font-bold text-[11px] flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" /> Thêm sản phẩm
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3">Sản phẩm</th>
                    <th className="py-2.5 px-3 w-32 text-center">Số lượng chuyển</th>
                    <th className="py-2.5 px-2 w-10 text-center">#</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2">
                        <select
                          value={it.product_id}
                          onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 bg-white outline-none focus:border-purple-500"
                        >
                          {(products || []).map(p => (
                            <option key={p.id} value={p.id}>{p.name} (Tồn kho: {p.stock || 0})</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <input 
                          type="number"
                          min="1"
                          value={it.qty}
                          onChange={(e) => handleItemChange(idx, 'qty', Number(e.target.value) || 1)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-center font-bold text-indigo-700 outline-none focus:border-purple-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú điều chuyển</label>
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú lý do điều chuyển hàng..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-500 text-slate-800 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all"
            >
              Tạo Phiếu Chuyển Kho
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
