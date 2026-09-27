import React from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';
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
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 font-body animate-in fade-in duration-150">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-100 p-6 z-10 text-center animate-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 mx-auto flex items-center justify-center mb-3.5 border border-amber-200/60">
          <HelpCircle className="w-6 h-6 stroke-[2]" />
        </div>

        <h3 className="text-base font-bold text-slate-800 mb-1.5">
          {title || t('rooms_beds.delete_confirm_title', 'Bạn chắc chắn muốn xoá vị trí này?')}
        </h3>
        
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          {description || t('rooms_beds.delete_confirm_desc', 'Lưu ý, hành động này không thể hoàn tác!')}
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            {t('common.cancel', 'Huỷ bỏ')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-sm shadow-red-200 cursor-pointer disabled:opacity-50"
          >
            {loading ? t('common.loading', 'Đang xoá...') : t('common.confirm', 'Xác nhận')}
          </button>
        </div>
      </div>
    </div>
  );
}
