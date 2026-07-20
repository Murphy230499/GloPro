'use client';
import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/components/Layout';
import { formatVND } from '@/lib/format';
import ImageUpload from '@/components/ImageUpload';

export default function TreatmentForm({ item, groups, services, onClose, onSave }) {
  const [f, setF] = useState({
    name: item.name || '',
    group_id: item.group_id || '',
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
    if (!svc) return toast.error('Chọn dịch vụ');
    if (f.services.find((x) => x.service_id === selService)) return toast.error('Đã có dịch vụ này');
    setF({
      ...f,
      services: [...f.services, {
        service_id: svc.id,
        service_name: svc.name,
        sessions: 1,
        unit_price_retail: svc.price || 0,
        unit_price_in_treatment: svc.price || 0,
      }],
    });
    setSelService('');
  };

  const updateService = (sid, field, value) => {
    setF({ ...f, services: f.services.map((x) => x.service_id === sid ? { ...x, [field]: value } : x) });
  };

  const removeService = (sid) => {
    setF({ ...f, services: f.services.filter((x) => x.service_id !== sid) });
  };

  const totalRetail = f.services.reduce((s, x) => s + (x.unit_price_retail || 0) * (x.sessions || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs" />
      <div className="relative bg-white w-full md:max-w-md rounded-3xl p-6 shadow-2xl relative text-left flex flex-col max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800 font-sans">{item.id ? 'Sửa liệu trình' : 'Thêm liệu trình'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Tên liệu trình" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" />

          <div>
            <label className="block font-bold text-slate-500 mb-1 text-[11px]">Nhóm liệu trình</label>
            <select value={f.group_id} onChange={(e) => setF({ ...f, group_id: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white">
              <option value="">— Chọn nhóm —</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-bold text-slate-500 mb-1 text-[11px]">Giá bán (VNĐ)</label>
              <input type="number" value={f.price || ''} onChange={(e) => setF({ ...f, price: Number(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" />
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1 text-[11px]">Hạn dùng (tháng)</label>
              <input type="number" value={f.expiry_months || ''} onChange={(e) => setF({ ...f, expiry_months: Number(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" />
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1 text-[11px]">Hạn dùng (ngày)</label>
              <input type="number" value={f.expiry_days || ''} onChange={(e) => setF({ ...f, expiry_days: Number(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" />
            </div>
          </div>

          <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Mô tả" rows={2} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" />

          <div>
            <label className="block font-bold text-slate-500 mb-1 text-[11px]">Dịch vụ trong liệu trình</label>
            <div className="flex gap-1.5 mt-1">
              <select value={selService} onChange={(e) => setSelService(e.target.value)} className="flex-1 px-2.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white">
                <option value="">— Chọn dịch vụ —</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button type="button" onClick={addService} className="px-3 rounded-xl bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"><Plus className="w-4 h-4" /></button>
            </div>
            {f.services.length > 0 && (
              <div className="mt-2 space-y-2">
                {f.services.map((it) => (
                  <div key={it.service_id} className="p-2.5 rounded-xl bg-slate-50 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="flex-1 text-sm font-medium truncate">{it.service_name}</span>
                      <button type="button" onClick={() => removeService(it.service_id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <div>
                        <label className="text-[10px] text-slate-400">Số lần</label>
                        <input type="number" value={it.sessions || ''} onChange={(e) => updateService(it.service_id, 'sessions', Number(e.target.value) || 0)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400">Đơn giá lẻ</label>
                        <input type="number" value={it.unit_price_retail || ''} onChange={(e) => updateService(it.service_id, 'unit_price_retail', Number(e.target.value) || 0)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400">Đơn giá trong LT</label>
                        <input type="number" value={it.unit_price_in_treatment || ''} onChange={(e) => updateService(it.service_id, 'unit_price_in_treatment', Number(e.target.value) || 0)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs" />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between text-xs text-slate-500 px-1">
                  <span>Tổng giá lẻ: <b className="text-slate-700">{formatVND(totalRetail)}</b></span>
                  <span>Giá bán LT: <b className="text-pink-600">{formatVND(f.price)}</b></span>
                </div>
              </div>
            )}
          </div>

          <ImageUpload value={f.image_url} onChange={(v) => setF({ ...f, image_url: v })} label="Hình minh hoạ" />
        </div>
        <div className="flex gap-2 pt-4 border-t border-slate-150/50 mt-4 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-200/50 hover:bg-slate-250 transition-colors font-bold text-xs text-slate-600 font-sans">Hủy</button>
          <button onClick={() => (f.name ? onSave(f) : toast.error('Nhập tên liệu trình'))} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-sm hover:opacity-95 transition-all font-sans">Lưu</button>
        </div>
      </div>
    </div>
  );
}