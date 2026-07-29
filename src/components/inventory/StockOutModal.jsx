'use client';
import React, { useState } from 'react';
import { X, Plus, Trash2, ArrowUpRight, Calendar, FileText } from 'lucide-react';
import { formatVND, todayStr } from '@/lib/format';
import { toast } from '@/components/Layout';

const OUT_REASONS = [
  'Xuất sử dụng dịch vụ Salon / Spa',
  'Xuất hủy / Hàng bị hư hỏng / Hết hạn',
  'Xuất trả nhà cung cấp',
  'Xuất tiêu hao nội bộ / Đào tạo học viên'
];

export default function StockOutModal({ products, onClose, onSave }) {
  const [reason, setReason] = useState(OUT_REASONS[0]);
  const [note, setNote] = useState('');

  // Selected items list
  const [items, setItems] = useState([
    { product_id: products?.[0]?.id || '', qty: 1, unit_price: products?.[0]?.cost_price || products?.[0]?.price || 0 }
  ]);

  const handleAddItem = () => {
    const defaultProd = products?.[0];
    if (!defaultProd) return;
    setItems([...items, { product_id: defaultProd.id, qty: 1, unit_price: defaultProd.cost_price || defaultProd.price || 0 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return toast.error('Phiếu xuất phải có ít nhất 1 sản phẩm');
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    if (field === 'product_id') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        updated[index].unit_price = prod.cost_price || prod.price || 0;
      }
    }
    setItems(updated);
  };

  // Calculations
  const calculatedItems = items.map(it => {
    const prod = products.find(p => p.id === it.product_id);
    const qty = Number(it.qty) || 0;
    const unitPrice = Number(it.unit_price) || 0;
    return {
      product_id: it.product_id,
      product_name: prod?.name || 'Sản phẩm',
      unit: prod?.unit || 'Chai/Cái',
      qty,
      unit_price: unitPrice,
      total_price: qty * unitPrice
    };
  });

  const totalAmount = calculatedItems.reduce((sum, i) => sum + i.total_price, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (items.length === 0) return toast.error('Vui lòng chọn sản phẩm xuất kho');

    // Check stock availability
    for (const it of calculatedItems) {
      const prod = products.find(p => p.id === it.product_id);
      if (prod && (prod.stock || 0) < it.qty) {
        return toast.error(`Sản phẩm "${prod.name}" không đủ tồn kho (Còn ${prod.stock || 0}, yêu cầu xuất ${it.qty})`);
      }
    }

    const receiptData = {
      code: `XK-${todayStr().replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      type: 'out',
      supplier_id: '',
      supplier_name: reason,
      date: new Date().toLocaleString('vi-VN'),
      created_by: 'Quản lý kho',
      total_amount: totalAmount,
      paid_amount: 0,
      debt_amount: 0,
      reason,
      note,
      status: 'completed',
      items: calculatedItems
    };

    onSave(receiptData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative bg-white w-full max-w-3xl rounded-3xl p-6 shadow-2xl text-left flex flex-col max-h-[90vh] overflow-y-auto font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">Tạo Phiếu Xuất Kho</h3>
              <p className="text-xs text-slate-400 font-medium">Trừ tự động số lượng tồn kho sản phẩm</p>
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
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Lý do xuất kho <span className="text-red-500">*</span></label>
            <select 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white outline-none focus:border-purple-500"
              required
            >
              {OUT_REASONS.map((r, idx) => (
                <option key={idx} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Product Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">Danh sách sản phẩm xuất kho</label>
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
                    <th className="py-2.5 px-3 w-24 text-center">Số lượng xuất</th>
                    <th className="py-2.5 px-3 w-36 text-right">Giá vốn (VNĐ)</th>
                    <th className="py-2.5 px-3 w-36 text-right">Tổng vốn xuất</th>
                    <th className="py-2.5 px-2 w-10 text-center">#</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.map((it, idx) => {
                    const prod = products.find(p => p.id === it.product_id);
                    const lineTotal = (Number(it.qty) || 0) * (Number(it.unit_price) || 0);
                    return (
                      <tr key={idx}>
                        <td className="p-2">
                          <select
                            value={it.product_id}
                            onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 bg-white outline-none focus:border-purple-500"
                          >
                            {(products || []).map(p => (
                              <option key={p.id} value={p.id}>{p.name} (Hiện có: {p.stock || 0})</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input 
                            type="number"
                            min="1"
                            max={prod?.stock || 9999}
                            value={it.qty}
                            onChange={(e) => handleItemChange(idx, 'qty', Number(e.target.value) || 1)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-center font-bold text-orange-600 outline-none focus:border-purple-500"
                          />
                        </td>
                        <td className="p-2 text-right font-semibold text-slate-600">
                          {formatVND(it.unit_price)}
                        </td>
                        <td className="p-2 text-right font-bold text-slate-900">
                          {formatVND(lineTotal)}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú chi tiết</label>
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập lý do chi tiết hoặc số chứng từ xuất liên quan..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-500 text-slate-800 resize-none"
            />
          </div>

          {/* Summary Box */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex justify-between items-center text-xs">
            <span className="text-slate-600 font-bold">Tổng giá trị vốn xuất kho:</span>
            <span className="text-base font-bold text-orange-600">{formatVND(totalAmount)}</span>
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
              className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs shadow-sm transition-all"
            >
              Xác Nhận Xuất Kho
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
