'use client';
import React, { useState } from 'react';
import { useT } from '@/lib/i18n';
import {  X, Plus, Trash2 , ChevronDown } from 'lucide-react';
import { toast } from '@/components/Layout';
import { formatVND } from '@/lib/format';
import ImageUpload from '@/components/ImageUpload';

export default function ProductComboForm({ item,  products, branches, onClose, onSave }) {
  const { t } = useT();
  const [f, setF] = useState({
    name: item.name || '',
    branch_ids: item.branch_ids || [],description: item.description || '',
    items: item.items || [],
    combo_price: item.combo_price || 0,
    is_active: item.is_active !== false,
    image_url: item.image_url || '',
  });
  const [selProduct, setSelProduct] = useState('');
  const [selQty, setSelQty] = useState(1);

  const originalPrice = f.items.reduce((s, x) => s + (x.price || 0) * (x.qty || 1), 0);
  const discount = originalPrice - (f.combo_price || 0);

  const addProduct = () => {
    const p = products.find((x) => x.id === selProduct);
    if (!p) return toast.error(t('catalog.err_select_product', 'Chọn sản phẩm'));
    if (f.items.find((x) => x.product_id === selProduct)) return toast.error(t('catalog.err_product_exists', 'Đã có sản phẩm này'));
    setF({ ...f, items: [...f.items, { product_id: p.id, product_name: p.name, price: p.price, qty: selQty }] });
    setSelProduct('');
    setSelQty(1);
  };

  const updateItem = (pid, field, value) => {
    setF({ ...f, items: f.items.map((x) => x.product_id === pid ? { ...x, [field]: value } : x) });
  };

  const removeProduct = (pid) => {
    setF({ ...f, items: f.items.filter((x) => x.product_id !== pid) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs" />
      <div className="relative bg-white w-full md:max-w-md rounded-3xl p-6 shadow-2xl relative text-left flex flex-col max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800 font-sans">{item.id ? t('catalog.title_edit_product_combo', 'Sửa combo sản phẩm') : t('catalog.title_add_product_combo', 'Thêm combo sản phẩm')}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder={t('catalog.ph_product_combo_name', 'Tên combo sản phẩm')} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-500 text-slate-700 bg-white" />

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <label className="block font-medium text-slate-700 mb-2 text-xs">{t('catalog.apply_branches', 'Áp dụng tại chi nhánh:')}</label>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={!f.branch_ids || f.branch_ids.length === 0} onChange={() => setF({...f, branch_ids: []})} className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 border-slate-300" />
                <span className="text-xs text-slate-600 font-medium">{t('catalog.all_branches', 'Tất cả')}</span>
              </label>
              {(branches || []).map(b => (
                <label key={b.id} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={(f.branch_ids || []).includes(b.id)} onChange={(e) => {
                    if (e.target.checked) {
                      setF({...f, branch_ids: [...(f.branch_ids || []), b.id]});
                    } else {
                      setF({...f, branch_ids: (f.branch_ids || []).filter(id => id !== b.id)});
                    }
                  }} className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 border-slate-300" />
                  <span className="text-xs text-slate-600">{b.name}</span>
                </label>
              ))}
            </div>
          </div>
          <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder={t('catalog.label_description', 'Mô tả')} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-500 text-slate-700 bg-white" />

          <div>
            <label className="block font-bold text-slate-500 mb-1 text-[11px]">{t('catalog.products_in_combo', 'Sản phẩm trong combo')}</label>
            <div className="flex gap-1.5 mt-1">
              <select value={selProduct} onChange={(e) => setSelProduct(e.target.value)} className="flex-1 px-2.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-500 text-slate-700 bg-white">
                <option value="">{t('catalog.select_product_placeholder', '— Chọn sản phẩm —')}</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} — {formatVND(p.price)}</option>)}
              </select>
              <input type="number" value={selQty} onChange={(e) => setSelQty(Number(e.target.value) || 1)} min="1" className="w-16 px-2 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-500 text-slate-700 text-center bg-white" />
              <button type="button" onClick={addProduct} className="px-3 rounded-xl bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"><Plus className="w-4 h-4" /></button>
            </div>
            {f.items.length > 0 && (
              <div className="mt-2 space-y-1">
                {f.items.map((it) => (
                  <div key={it.product_id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 text-sm">
                    <span className="flex-1 truncate">{it.product_name}</span>
                    <input type="number" value={it.qty || ''} onChange={(e) => updateItem(it.product_id, 'qty', Number(e.target.value) || 1)} min="1" className="w-12 px-1.5 py-1 rounded border border-slate-200 text-xs text-center" />
                    <span className="text-xs text-slate-400">{formatVND(it.price)}</span>
                    <button type="button" onClick={() => removeProduct(it.product_id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-50 rounded-xl p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">{t('catalog.original_total_label', 'Giá gốc (tổng):')}</span>
              <span className="font-medium">{formatVND(originalPrice)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm text-slate-400 shrink-0">{t('catalog.combo_price_label', 'Giá combo:')}</label>
              <input type="number" value={f.combo_price || ''} onChange={(e) => setF({ ...f, combo_price: Number(e.target.value) || 0 })} className="w-32 px-2.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-500 text-slate-700 bg-white text-right" />
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-semibold">
                <span>{t('catalog.savings_label', 'Tiết kiệm:')}</span>
                <span>{formatVND(discount)}</span>
              </div>
            )}
          </div>

          <ImageUpload value={f.image_url} onChange={(v) => setF({ ...f, image_url: v })} label={t('catalog.illustration_label', 'Hình minh hoạ')} />
        </div>
        <div className="flex gap-2 pt-4 border-t border-slate-150/50 mt-4 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-200/50 hover:bg-slate-250 transition-colors font-bold text-xs text-slate-600 font-sans">{t('catalog.btn_cancel', 'Hủy')}</button>
          <button onClick={() => (f.name ? onSave(f) : toast.error(t('catalog.err_enter_combo_name', 'Nhập tên combo')))} className="flex-1 py-2.5 rounded-xl bg-purple-500 text-white font-bold text-xs shadow-sm hover:opacity-95 transition-all font-sans">{t('catalog.btn_save', 'Lưu')}</button>
        </div>
      </div>
    </div>
  );
}