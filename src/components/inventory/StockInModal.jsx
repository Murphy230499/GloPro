'use client';
import React, { useState } from 'react';
import { X, Plus, Trash2, ArrowDownLeft, Calendar, FileText, UserCheck, DollarSign } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { formatVND, todayStr } from '@/lib/format';
import { toast } from '@/components/Layout';
import { createExpenseVoucher } from '@/lib/cashFlowHelper';

export default function StockInModal({ suppliers, products, onClose, onSave }) {
  const { t } = useT();
  const [supplierId, setSupplierId] = useState(suppliers?.[0]?.id || '');
  const [reason, setReason] = useState('Nhập hàng sản phẩm/vật tư định kỳ');
  const [paidAmount, setPaidAmount] = useState('');
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
    if (items.length <= 1) return toast.error(t('inventory.err_at_least_one_item', 'Phiếu nhập phải có ít nhất 1 sản phẩm'));
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
  const paid = paidAmount !== '' ? Number(paidAmount) : totalAmount;
  const debt = Math.max(0, totalAmount - paid);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (items.length === 0) return toast.error(t('inventory.err_select_stock_in_products', 'Vui lòng chọn sản phẩm nhập kho'));

    const selectedSupplier = suppliers.find(s => s.id === supplierId);
    
    const receiptData = {
      code: `NK-${todayStr().replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      type: 'in',
      supplier_id: supplierId,
      supplier_name: selectedSupplier?.name || 'Nhà cung cấp',
      date: new Date().toLocaleString('vi-VN'),
      created_by: 'Quản lý kho',
      total_amount: totalAmount,
      paid_amount: paid,
      debt_amount: debt,
      reason,
      note,
      status: 'completed',
      items: calculatedItems
    };

    onSave(receiptData);

    // ── Auto cash flow: Phiếu Chi Nhập hàng ────────────────────────────
    if (paid > 0) {
      createExpenseVoucher({
        typeCode: 'stock_purchase',
        typeName: 'Nhập hàng',
        amount: paid,
        description: `Nhập kho: ${receiptData.code} - ${selectedSupplier?.name || 'Nhà cung cấp'}`,
        note: note || '',
        paymentMethod: 'cash',
        refCode: receiptData.code,
      }).catch(e => console.warn('[CashFlow] Stock expense voucher failed:', e.message));
    }
    // ─────────────────────────────────────────────────────────
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
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">{t('inventory.title_create_stock_in', 'Tạo Phiếu Nhập Kho')}</h3>
              <p className="text-xs text-slate-400 font-medium">{t('inventory.stock_in_subtitle', 'Cộng dồn số lượng tồn kho & tự động tính giá vốn')}</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('inventory.select_supplier_label', 'Chọn Nhà Cung Cấp')} <span className="text-red-500">*</span></label>
              <select 
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white outline-none focus:border-purple-500"
                required
              >
                {(suppliers || []).map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('inventory.reason_import_label', 'Lý do nhập kho')}</label>
              <input 
                type="text" 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-500 text-slate-800"
              />
            </div>
          </div>

          {/* Product Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">{t('inventory.list_import_products', 'Danh sách sản phẩm nhập kho')}</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 font-bold text-[11px] flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" /> {t('inventory.btn_add_product', 'Thêm sản phẩm')}
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3">{t('inventory.col_product', 'Sản phẩm')}</th>
                    <th className="py-2.5 px-3 w-24 text-center">{t('inventory.col_quantity', 'Số lượng')}</th>
                    <th className="py-2.5 px-3 w-36 text-right">{t('inventory.col_unit_price_vnd', 'Đơn giá nhập (VNĐ)')}</th>
                    <th className="py-2.5 px-3 w-36 text-right">{t('inventory.col_amount', 'Thành tiền')}</th>
                    <th className="py-2.5 px-2 w-10 text-center">#</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.map((it, idx) => {
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
                              <option key={p.id} value={p.id}>{p.name} (Tồn: {p.stock || 0})</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input 
                            type="number"
                            min="1"
                            value={it.qty}
                            onChange={(e) => handleItemChange(idx, 'qty', Number(e.target.value) || 1)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-center font-bold text-slate-800 outline-none focus:border-purple-500"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number"
                            value={it.unit_price}
                            onChange={(e) => handleItemChange(idx, 'unit_price', Number(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-right font-semibold text-slate-800 outline-none focus:border-purple-500"
                          />
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

          {/* Payment & Debt Summary Box */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">{t('inventory.total_receipt_value', 'Tổng giá trị đơn nhập:')}</span>
              <span className="text-base font-bold text-slate-900">{formatVND(totalAmount)}</span>
            </div>

            <div className="flex justify-between items-center gap-3">
              <span className="text-xs text-slate-600 font-bold">{t('inventory.payment_to_supplier', 'Thanh toán cho Nhà cung cấp (VNĐ):')}</span>
              <input 
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder={`Mặc định: ${formatVND(totalAmount)}`}
                className="w-48 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-right text-emerald-700 bg-white outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200">
              <span className="text-slate-500 font-medium">{t('inventory.record_debt_supplier', 'Ghi nợ vào công nợ NCC:')}</span>
              <span className={`font-bold ${debt > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                {formatVND(debt)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              {t('inventory.btn_cancel', 'Hủy')}
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm transition-all"
            >
              {t('inventory.btn_confirm_stock_in', 'Xác Nhận Nhập Kho')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
