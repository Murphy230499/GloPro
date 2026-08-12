'use client';
import React, { useState } from 'react';
import { useT } from '@/lib/i18n';
import { X, ChevronDown } from 'lucide-react';
import { toast } from '@/components/Layout';
import ImageUpload from '@/components/ImageUpload';

export default function ProductForm({ item,  groups, branches, onClose, onSave }) {
  const { t } = useT();
  const matchedGroup = (groups || []).find(g => 
    (item.group_id && g.id === item.group_id) || 
    (item.category && g.name === item.category) || 
    (item.group && g.name === item.group) ||
    (item.group_id && g.name === item.group_id)
  );

  const initialGroupVal = matchedGroup ? matchedGroup.id : (item.group_id || item.category || item.group || '');
  const initialCategoryVal = matchedGroup ? matchedGroup.name : (item.category || item.group || '');

  const [f, setF] = useState({
    name: item.name || '',
    branch_ids: item.branch_ids || [],
    group_id: initialGroupVal,
    category: initialCategoryVal,
    group: initialCategoryVal,
    price: item.price || 0,
    cost_price: item.cost_price || 0,
    stock: item.stock || 0,
    min_stock: item.min_stock || 0,
    unit: item.unit || '',
    sku: item.sku || '',
    is_active: item.is_active !== false,
    image_url: item.image_url || '',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs" />
      <div className="relative bg-white w-full mx-3 md:mx-0 md:max-w-md rounded-3xl p-6 shadow-2xl relative text-left flex flex-col max-h-[82vh] md:max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800 font-sans">{item.id ? t('catalog.title_edit_product', 'Sửa sản phẩm') : t('catalog.title_add_product', 'Thêm sản phẩm')}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder={t('catalog.ph_product_name', 'Tên sản phẩm')} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-500 text-slate-700 bg-white" />

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

          <div>
            <label className="block font-medium text-slate-500 mb-1 text-[11px]">{t('catalog.label_product_group', 'Nhóm sản phẩm')}</label>
            <div className="relative">
              <select
                value={f.group_id}
                onChange={(e) => {
                  const val = e.target.value;
                  const matchG = (groups || []).find(g => g.id === val || g.name === val);
                  const nameStr = matchG ? matchG.name : val;
                  setF({ ...f, group_id: val, category: nameStr, group: nameStr });
                }}
                className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs font-normal text-slate-700 outline-none focus:border-purple-500 bg-white appearance-none cursor-pointer"
              >
                <option value="">{t('catalog.select_product_group', '— Chọn nhóm sản phẩm —')}</option>
                {(groups || []).map((g) => <option key={g.id || g.name} value={g.id || g.name}>{g.name}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-500 mb-1 text-[11px]">{t('catalog.label_price', 'Giá bán')}</label>
              <input type="number" value={f.price || ''} onChange={(e) => setF({ ...f, price: Number(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-500 text-slate-700 bg-white" />
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1 text-[11px]">{t('catalog.cost_price_label', 'Giá vốn')}</label>
              <input type="number" value={f.cost_price || ''} onChange={(e) => setF({ ...f, cost_price: Number(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-500 text-slate-700 bg-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-500 mb-1 text-[11px]">{t('catalog.label_stock', 'Tồn kho')}</label>
              <input type="number" value={f.stock || ''} onChange={(e) => setF({ ...f, stock: Number(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-500 text-slate-700 bg-white" />
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1 text-[11px]">{t('catalog.min_stock_label', 'Tồn tối thiểu')}</label>
              <input type="number" value={f.min_stock || ''} onChange={(e) => setF({ ...f, min_stock: Number(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-500 text-slate-700 bg-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-500 mb-1 text-[11px]">{t('catalog.unit_label', 'Đơn vị')}</label>
              <input value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} placeholder={t('catalog.unit_placeholder', 'cái, chai, hộp...')} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-500 text-slate-700 bg-white" />
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1 text-[11px]">{t('catalog.sku_label', 'Mã SKU')}</label>
              <input value={f.sku} onChange={(e) => setF({ ...f, sku: e.target.value })} placeholder="SKU" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-500 text-slate-700 bg-white" />
            </div>
          </div>

          <ImageUpload value={f.image_url} onChange={(v) => setF({ ...f, image_url: v })} label={t('catalog.product_image_label', 'Hình sản phẩm')} />
        </div>
        <div className="flex gap-2 pt-4 border-t border-slate-150/50 mt-4 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-200/50 hover:bg-slate-250 transition-colors font-bold text-xs text-slate-600 font-sans">{t('catalog.btn_cancel', 'Hủy')}</button>
          <button onClick={() => (f.name ? onSave(f) : toast.error(t('catalog.err_enter_name', 'Nhập tên sản phẩm')))} className="flex-1 py-2.5 rounded-xl bg-purple-500 text-white font-bold text-xs shadow-sm hover:opacity-95 transition-all font-sans">{t('catalog.btn_save', 'Lưu')}</button>
        </div>
      </div>
    </div>
  );
}