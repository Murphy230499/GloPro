'use client';
import React, { useState } from 'react';
import { useT } from '@/lib/i18n';
import { X, Plus, Trash2, ChevronDown } from 'lucide-react';
import { toast } from '@/components/Layout';
import ImageUpload from '@/components/ImageUpload';

export default function ServiceForm({ item,  groups, products, branches, onClose, onSave }) {
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
    price_from: item.price_from || 0,
    cost: item.cost || 0,
    duration_minutes: item.duration_minutes || 60,
    description: item.description || '',
    is_active: item.is_active !== false,
    image_url: item.image_url || '',
    accompanied_products: item.accompanied_products || [],
  });
  const [accProduct, setAccProduct] = useState('');
  const [accQty, setAccQty] = useState(1);

  const addAccProduct = () => {
    const p = products.find((x) => x.id === accProduct);
    if (!p) return toast.error('Chọn sản phẩm');
    if (f.accompanied_products.find((x) => x.product_id === accProduct)) return toast.error('Đã có sản phẩm này');
    setF({ ...f, accompanied_products: [...f.accompanied_products, { product_id: p.id, product_name: p.name, quantity: accQty }] });
    setAccProduct('');
    setAccQty(1);
  };

  const removeAccProduct = (pid) => {
    setF({ ...f, accompanied_products: f.accompanied_products.filter((x) => x.product_id !== pid) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs" />
      <div className="relative bg-white w-full md:max-w-md rounded-3xl p-6 shadow-2xl relative text-left flex flex-col max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800 font-sans">{item.id ? t('catalog.title_edit_service', 'Sửa dịch vụ') : t('catalog.title_add_service', 'Thêm dịch vụ')}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder={t('catalog.ph_service_name', 'Tên dịch vụ')} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-400 text-slate-700 bg-white" />

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
            <label className="block font-medium text-slate-500 mb-1 text-[11px]">{t('catalog.label_service_group', 'Nhóm dịch vụ')}</label>
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
                <option value="">{t('catalog.select_service_group', '— Chọn nhóm dịch vụ —')}</option>
                {(groups || []).map((g) => <option key={g.id || g.name} value={g.id || g.name}>{g.name}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-slate-500 mb-1 text-[11px]">{t('catalog.price_from_label', 'Giá từ (VNĐ)')}</label>
              <input type="number" value={f.price_from || ''} onChange={(e) => setF({ ...f, price_from: Number(e.target.value) || 0 })} placeholder="0" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-400 text-slate-700 bg-white" />
            </div>
            <div>
              <label className="block font-medium text-slate-500 mb-1 text-[11px]">{t('catalog.price_fixed_label', 'Giá cố định (VNĐ)')}</label>
              <input type="number" value={f.price || ''} onChange={(e) => setF({ ...f, price: Number(e.target.value) || 0 })} placeholder="0" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-400 text-slate-700 bg-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-slate-500 mb-1 text-[11px]">{t('catalog.service_cost_label', 'Chi phí dịch vụ (VNĐ)')}</label>
              <input type="number" value={f.cost || ''} onChange={(e) => setF({ ...f, cost: Number(e.target.value) || 0 })} placeholder="0" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-400 text-slate-700 bg-white" />
            </div>
            <div>
              <label className="block font-medium text-slate-500 mb-1 text-[11px]">{t('catalog.duration_label', 'Thời gian (phút)')}</label>
              <input type="number" value={f.duration_minutes || ''} onChange={(e) => setF({ ...f, duration_minutes: Number(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-400 text-slate-700 bg-white" />
            </div>
          </div>

          <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder={t('catalog.label_description', 'Mô tả')} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-400 text-slate-700 bg-white" />

          <ImageUpload value={f.image_url} onChange={(v) => setF({ ...f, image_url: v })} label={t('catalog.illustration_label', 'Hình minh hoạ')} />

          {/* Accompanied products */}
          <div>
            <label className="block font-medium text-slate-500 mb-1 text-[11px]">{t('catalog.accompanied_products_label', 'Sản phẩm đi kèm (tự trừ kho khi bán)')}</label>
            <div className="flex gap-1.5 mt-1">
              <div className="relative flex-1">
                <select
                  value={accProduct}
                  onChange={(e) => setAccProduct(e.target.value)}
                  className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs font-normal text-slate-700 outline-none focus:border-purple-500 bg-white appearance-none cursor-pointer"
                >
                  <option value="">{t('catalog.select_product_placeholder', '— Chọn sản phẩm —')}</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <input type="number" value={accQty} onChange={(e) => setAccQty(Number(e.target.value) || 1)} min="1" className="w-16 px-2 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-400 text-slate-700 text-center bg-white" />
              <button type="button" onClick={addAccProduct} className="px-3 rounded-xl bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"><Plus className="w-4 h-4" /></button>
            </div>
            {f.accompanied_products.length > 0 && (
              <div className="mt-2 space-y-1">
                {f.accompanied_products.map((ap) => (
                  <div key={ap.product_id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 text-xs text-slate-600 font-normal">
                    <span className="flex-1 truncate">{ap.product_name}</span>
                    <span className="font-normal text-slate-500 text-[11px]">{t('catalog.qty_label', 'SL:')} {ap.quantity}</span>
                    <button type="button" onClick={() => removeAccProduct(ap.product_id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 pt-4 border-t border-slate-150/50 mt-4 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-200/50 hover:bg-slate-250 transition-colors font-bold text-xs text-slate-600 font-sans">{t('catalog.btn_cancel', 'Hủy')}</button>
          <button onClick={() => (f.name ? onSave(f) : toast.error(t('catalog.err_enter_service_name', 'Nhập tên dịch vụ')))} className="flex-1 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs shadow-sm transition-all font-sans">{t('catalog.btn_save', 'Lưu')}</button>
        </div>
      </div>
    </div>
  );
}