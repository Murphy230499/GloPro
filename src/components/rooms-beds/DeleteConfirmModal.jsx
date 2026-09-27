import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useT } from '@/lib/i18n';

export default function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  loading = false
}) {
  const { t } = useT();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs font-sans text-slate-800 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div 
        className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200/80 p-6 z-10 text-center animate-in zoom-in-95 duration-150" 
        onClick={e => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center mb-4 border border-amber-200/60">
          <HelpCircle className="w-7 h-7 stroke-[2]" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2">
          {title || t('rooms_beds.delete_confirm_title', 'Bạn chắc chắn muốn xoá vị trí này?')}
        </h3>
        
        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          {description || t('rooms_beds.delete_confirm_desc', 'Lưu ý, hành động này không thể hoàn tác!')}
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            {t('common.cancel', 'Huỷ bỏ')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm shadow-rose-200 cursor-pointer disabled:opacity-50"
          >
            {loading ? t('common.loading', 'Đang xoá...') : t('common.confirm', 'Xác nhận')}
          </button>
        </div>
      </div>
    </div>
  );
}
