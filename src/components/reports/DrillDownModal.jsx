'use client';
import React from 'react';
import { X, FileText, User, Tag, Calendar, DollarSign } from 'lucide-react';
import { formatVND } from '@/lib/format';
import { useT } from '@/lib/i18n';

export default function DrillDownModal({ open, title, data = [], onClose }) {
  const t = useT();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-body p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" />

      <div
        className="relative bg-white w-full max-w-3xl rounded-3xl p-6 shadow-2xl text-left flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>{t('reports.drilldown_title', 'Detail Traceability')}: {title}</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">{t('reports.drilldown_count', 'Showing {count} detailed records', { count: data.length })}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-2.5">
          {data.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              {t('reports.drilldown_empty', 'No detailed records available')}
            </div>
          ) : (
            data.map((item, idx) => (
              <div key={item.id || idx} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition flex items-center justify-between gap-3 text-xs">
                <div className="space-y-1 truncate">
                  <div className="font-bold text-slate-800 flex items-center gap-2">
                    <span>{item.invoice_code || item.name || item.customer_name || `Item #${idx + 1}`}</span>
                    {item.status && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold">
                        {item.status}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                    {item.customer_name && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {item.customer_name}
                      </span>
                    )}
                    {item.date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {item.date}
                      </span>
                    )}
                    {item.category && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {item.category}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-extrabold text-sm text-emerald-600">
                    {formatVND(item.total || item.price || item.amount || 0)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 text-right shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            {t('reports.btn_close', 'Close')}
          </button>
        </div>

      </div>
    </div>
  );
}
