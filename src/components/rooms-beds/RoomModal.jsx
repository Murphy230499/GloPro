import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { toast } from '@/components/Layout';

export default function RoomModal({ open, onClose, onSave, loading = false }) {
  const { t } = useT();
  const [name, setName] = useState('');

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      return toast.error(t('rooms_beds.err_room_name', 'Vui lòng nhập tên phòng'));
    }
    onSave(name.trim());
    setName('');
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 font-body animate-in fade-in duration-150">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-10" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">{t('rooms_beds.add_room', 'Thêm phòng')}</h2>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t('rooms_beds.room_name', 'Tên phòng')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('rooms_beds.room_name_placeholder', 'Nhập tên phòng')}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white text-slate-800 transition-all placeholder:text-slate-400 shadow-2xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              {t('common.cancel', 'Huỷ bỏ')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm shadow-blue-200 cursor-pointer disabled:opacity-50"
            >
              {loading ? t('common.loading', 'Đang tạo...') : t('common.create', 'Tạo')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
