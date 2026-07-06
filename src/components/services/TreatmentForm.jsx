import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from '@/components/Layout';
import ImageUpload from '@/components/ImageUpload';

export default function TreatmentForm({ item, onClose, onSave }) {
  const [f, setF] = useState({
    name: item.name || '',
    description: item.description || '',
    total_sessions: item.total_sessions || 1,
    price: item.price || 0,
    duration_days: item.duration_days || 30,
    is_active: item.is_active !== false,
    image_url: item.image_url || '',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-5 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{item.id ? 'Sửa liệu trình' : 'Thêm liệu trình'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Tên liệu trình" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Mô tả" rows={2} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400">Giá (VNĐ)</label>
              <input type="number" value={f.price || ''} onChange={(e) => setF({ ...f, price: Number(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400">Số buổi</label>
              <input type="number" value={f.total_sessions || ''} onChange={(e) => setF({ ...f, total_sessions: Number(e.target.value) || 1 })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400">Thời hạn (ngày)</label>
            <input type="number" value={f.duration_days || ''} onChange={(e) => setF({ ...f, duration_days: Number(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
          <ImageUpload value={f.image_url} onChange={(v) => setF({ ...f, image_url: v })} label="Hình minh hoạ" />
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 font-semibold text-sm">Hủy</button>
          <button onClick={() => (f.name ? onSave(f) : toast.error('Nhập tên liệu trình'))} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm">Lưu</button>
        </div>
      </div>
    </div>
  );
}