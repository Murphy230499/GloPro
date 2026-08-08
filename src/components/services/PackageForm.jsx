'use client';
import React, { useState } from 'react';
import { useT } from '@/lib/i18n';
import { X, Plus, Trash2, ChevronDown } from 'lucide-react';
import { toast } from '@/components/Layout';
import ImageUpload from '@/components/ImageUpload';

export default function PackageForm({ item,  groups, services, branches, onClose, onSave }) {
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
    usage_count: item.usage_count || 1,
    expiry_months: item.expiry_months || 0,
    expiry_days: item.expiry_days || 0,
    price: item.price || 0,
    services: item.services || [],
    description: item.description || '',
    is_active: item.is_active !== false,
    image_url: item.image_url || '',
  });
  const [selService, setSelService] = useState('');

  const addService = () => {
    const svc = services.find((s) => s.id === selService);
    if (!svc) return toast.error(t('catalog.err_select_service', 'Chọn dịch vụ'));
    if (f.services.find((x) => x.service_id === selService)) return toast.error(t('catalog.err_service_exists', 'Đã có dịch vụ này'));
    setF({ ...f, services: [...f.services, { service_id: svc.id, service_name: svc.name }] });
    setSelService('');
  };

  const removeService = (sid) => {
    setF({ ...f, services: f.services.filter((x) => x.service_id !== sid) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs" />
      <div className="relative bg-white w-full md:max-w-md rounded-3xl p-6 shadow-2xl relative text-left flex flex-col max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800 font-sans">{item.id ? t('catalog.title_edit_package', 'Sửa gói dịch vụ') : t('catalog.title_add_package', 'Thêm gói dịch vụ')}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder={t('catalog.ph_package_name', 'Tên gói dịch vụ')} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-500 text-slate-700 bg-white" />

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
            <label className="block font-medium text-slate-500 mb-1 text-[11px]">{t('catalog.label_package_group', 'Nhóm gói dịch vụ')}</label>
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
                <option value="">{t('catalog.select_package_group', '— Chọn nhóm gói dịch vụ —')}</option>
                {(groups || []).map((g) => <option key={g.id || g.name} value={g.id || g.name}>{g.name}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-slate-500 mb-1 text-[11px]">{t('catalog.package_price_label', 'Giá gói (VNĐ)')}</label>
              <input type="number" value={f.price || ''} onChange={(e) => setF({ ...f, price: Number(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-500 text-slate-700 bg-white" />
            </div>
            <div>
              <label className="block font-medium text-slate-500 mb-1 text-[11px]">{t('catalog.usage_count_label', 'Số lần sử dụng')}</label>
              <input type="number" value={f.usage_count || ''} onChange={(e) => setF({ ...f, usage_count: Number(e.target.value) || 1 })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-500 text-slate-700 bg-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-slate-500 mb-1 text-[11px]">{t('catalog.expiry_months_label', 'Hạn dùng (tháng)')}</label>
              <input type="number" value={f.expiry_months || ''} onChange={(e) => setF({ ...f, expiry_months: Number(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-500 text-slate-700 bg-white" />
            </div>
            <div>
              <label className="block font-medium text-slate-500 mb-1 text-[11px]">{t('catalog.expiry_days_label', 'Hạn dùng (ngày)')}</label>
              <input type="number" value={f.expiry_days || ''} onChange={(e) => setF({ ...f, expiry_days: Number(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-500 text-slate-700 bg-white" />
            </div>
          </div>

          <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder={t('catalog.label_description', 'Mô tả')} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-500 text-slate-700 bg-white" />

          <div>
            <label className="block font-medium text-slate-500 mb-1 text-[11px]">{t('catalog.services_in_package', 'Dịch vụ trong gói')}</label>
            <div className="flex gap-1.5 mt-1">
              <div className="relative flex-1">
                <select
                  value={selService}
                  onChange={(e) => setSelService(e.target.value)}
                  className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs font-normal text-slate-700 outline-none focus:border-purple-500 bg-white appearance-none cursor-pointer"
                >
                  <option value="">{t('catalog.select_service_placeholder', '— Chọn dịch vụ —')}</option>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <button type="button" onClick={addService} className="px-3 rounded-xl bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"><Plus className="w-4 h-4" /></button>
            </div>
            {f.services.length > 0 && (
              <div className="mt-2 space-y-1">
                {f.services.map((it) => (
                  <div key={it.service_id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 text-sm">
                    <span className="flex-1 truncate">{it.service_name}</span>
                    <button type="button" onClick={() => removeService(it.service_id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <ImageUpload value={f.image_url} onChange={(v) => setF({ ...f, image_url: v })} label={t('catalog.illustration_label', 'Hình minh hoạ')} />
        </div>
        <div className="flex gap-2 pt-4 border-t border-slate-150/50 mt-4 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-200/50 hover:bg-slate-250 transition-colors font-bold text-xs text-slate-600 font-sans">{t('catalog.btn_cancel', 'Hủy')}</button>
          <button onClick={() => {
            if (!f.name) return toast.error(t('catalog.err_enter_package_name', 'Nhập tên gói'));
            const payload = { ...f };
            delete payload.group;
            onSave(payload);
          }} className="flex-1 py-2.5 rounded-xl bg-purple-500 text-white font-bold text-xs shadow-sm hover:opacity-95 transition-all font-sans">{t('catalog.btn_save', 'Lưu')}</button>
        </div>
      </div>
    </div>
  );
}