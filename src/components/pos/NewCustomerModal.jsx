import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from '@/components/Layout';

export default function NewCustomerModal({ onClose, onCreate }) {
  const [f, setF] = useState({ name: '', phone: '', gender: 'female', note: '' });
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-full md:max-w-sm rounded-t-3xl md:rounded-3xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Thêm khách hàng mới</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Họ tên"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="Số điện thoại"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          <select value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
            <option value="female">Nữ</option><option value="male">Nam</option><option value="other">Khác</option>
          </select>
          <textarea value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Ghi chú" rows={2}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 font-semibold text-sm">Huỷ</button>
          <button onClick={() => f.name && f.phone ? onCreate(f) : toast.error('Nhập tên & SĐT')}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm">Thêm</button>
        </div>
      </div>
    </div>
  );
}