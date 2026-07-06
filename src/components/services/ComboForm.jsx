import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/components/Layout';
import { formatVND } from '@/lib/format';
import ImageUpload from '@/components/ImageUpload';

export default function ComboForm({ item, services, onClose, onSave }) {
  const [f, setF] = useState({
    name: item.name || '',
    description: item.description || '',
    items: item.items || [],
    combo_price: item.combo_price || 0,
    is_active: item.is_active !== false,
    image_url: item.image_url || '',
  });
  const [selService, setSelService] = useState('');

  const originalPrice = f.items.reduce((s, x) => s + (x.price || 0), 0);
  const discount = originalPrice - (f.combo_price || 0);

  const addService = () => {
    const svc = services.find((s) => s.id === selService);
    if (!svc) return toast.error('Chọn dịch vụ');
    if (f.items.find((x) => x.service_id === selService)) return toast.error('Đã có dịch vụ này');
    setF({ ...f, items: [...f.items, { service_id: svc.id, service_name: svc.name, price: svc.price }] });
    setSelService('');
  };

  const removeService = (sid) => {
    setF({ ...f, items: f.items.filter((x) => x.service_id !== sid) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-full md:max-w-lg rounded-t-3xl md:rounded-3xl p-5 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{item.id ? 'Sửa gói dịch vụ' : 'Thêm gói dịch vụ'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Tên gói dịch vụ" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Mô tả" rows={2} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />

          <div>
            <label className="text-xs text-slate-400 font-semibold">Dịch vụ trong gói</label>
            <div className="flex gap-1.5 mt-1">
              <select value={selService} onChange={(e) => setSelService(e.target.value)} className="flex-1 px-2.5 py-2 rounded-xl border border-slate-200 text-sm">
                <option value="">— Chọn dịch vụ —</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name} — {formatVND(s.price)}</option>)}
              </select>
              <button type="button" onClick={addService} className="px-3 rounded-xl bg-slate-100 flex items-center justify-center"><Plus className="w-4 h-4" /></button>
            </div>
            {f.items.length > 0 && (
              <div className="mt-2 space-y-1">
                {f.items.map((it) => (
                  <div key={it.service_id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 text-sm">
                    <span className="flex-1 truncate">{it.service_name}</span>
                    <span className="text-xs text-slate-400">{formatVND(it.price)}</span>
                    <button type="button" onClick={() => removeService(it.service_id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-50 rounded-xl p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Giá gốc (tổng):</span>
              <span className="font-medium">{formatVND(originalPrice)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm text-slate-400 shrink-0">Giá combo:</label>
              <input type="number" value={f.combo_price || ''} onChange={(e) => setF({ ...f, combo_price: Number(e.target.value) || 0 })} className="w-32 px-2.5 py-2 rounded-xl border border-slate-200 text-sm text-right" />
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-semibold">
                <span>Tiết kiệm:</span>
                <span>{formatVND(discount)}</span>
              </div>
            )}
          </div>

          <ImageUpload value={f.image_url} onChange={(v) => setF({ ...f, image_url: v })} label="Hình minh hoạ" />
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 font-semibold text-sm">Hủy</button>
          <button onClick={() => (f.name ? onSave(f) : toast.error('Nhập tên gói'))} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm">Lưu</button>
        </div>
      </div>
    </div>
  );
}