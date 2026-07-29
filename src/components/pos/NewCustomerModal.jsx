'use client';
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from '@/components/Layout';

export default function NewCustomerModal({ onClose, onCreate, initialQuery = '', initialName = '', initialPhone = '' }) {
  const queryStr = (initialQuery || '').trim();
  const isPhone = queryStr ? /^[\d\s+\-().]+$/.test(queryStr) : false;
  const defaultName = initialName || (!isPhone ? queryStr : '');
  const defaultPhone = initialPhone || (isPhone ? queryStr : '');

  const [f, setF] = useState({ 
    name: defaultName, 
    phone: defaultPhone, 
    gender: 'female', 
    note: '' 
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/65 backdrop-blur-xs pointer-events-auto select-none" onClick={onClose}>
      <div className="relative bg-white w-full md:max-w-sm rounded-t-3xl md:rounded-3xl p-5 shadow-2xl transition-all select-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">Thêm khách hàng mới</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Họ tên <span className="text-red-500">*</span></label>
            <input 
              autoFocus={!defaultName && !!defaultPhone}
              value={f.name} 
              onChange={(e) => setF({ ...f, name: e.target.value })} 
              placeholder="Nhập họ tên khách hàng..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
            <input 
              autoFocus={!!defaultName && !defaultPhone}
              value={f.phone} 
              onChange={(e) => setF({ ...f, phone: e.target.value })} 
              placeholder="Nhập số điện thoại..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Giới tính</label>
            <select 
              value={f.gender} 
              onChange={(e) => setF({ ...f, gender: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 bg-white"
            >
              <option value="female">Nữ</option>
              <option value="male">Nam</option>
              <option value="other">Khác</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Ghi chú</label>
            <textarea 
              value={f.note} 
              onChange={(e) => setF({ ...f, note: e.target.value })} 
              placeholder="Ghi chú thêm..." 
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500" 
            />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold text-sm text-slate-600 transition-colors">Huỷ</button>
          <button onClick={() => f.name && f.phone ? onCreate(f) : toast.error('Vui lòng nhập tên & SĐT')}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-2xs transition-colors">Thêm mới</button>
        </div>
      </div>
    </div>
  );
}