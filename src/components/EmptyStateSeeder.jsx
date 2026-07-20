'use client';
import React from 'react';
import { Sparkles, Plus, Loader2 } from 'lucide-react';

/**
 * EmptyStateSeeder — Shared empty-state UI with sample data seed button.
 *
 * Props:
 *   icon        ReactNode    — Icon to display (e.g. <Users className="..." />)
 *   title       string       — e.g. "Chưa có khách hàng nào"
 *   description string       — Short helper text shown below title
 *   onSeed      function     — Called when user clicks "Tạo dữ liệu mẫu"
 *   seeding     boolean      — true while seeding is in progress
 *   seedProgress string      — Progress message shown while seeding
 *   onAdd       function     — Called when user clicks "Thêm thủ công"
 *   addLabel    string       — Label for the manual add button (default: "Thêm thủ công")
 *   seedLabel   string       — Label for the seed button (default: "Tạo dữ liệu mẫu")
 */
export default function EmptyStateSeeder({
  icon,
  title,
  description,
  onSeed,
  seeding = false,
  seedProgress = '',
  onAdd,
  addLabel = 'Thêm thủ công',
  seedLabel = 'Tạo dữ liệu mẫu',
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 gap-5 text-center px-6 min-h-[320px]">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center border border-purple-100/60 shadow-sm">
        {icon}
      </div>

      {/* Text */}
      <div className="max-w-xs">
        <h3 className="font-bold text-slate-700 text-base">{title}</h3>
        {description && (
          <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{description}</p>
        )}
      </div>

      {/* Progress indicator */}
      {seeding && seedProgress && (
        <div className="text-xs text-purple-500 font-semibold animate-pulse flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-full border border-purple-100">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          {seedProgress}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onSeed && (
          <button
            onClick={onSeed}
            disabled={seeding}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {seeding ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo dữ liệu...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> {seedLabel}</>
            )}
          </button>
        )}
        {onAdd && (
          <button
            onClick={onAdd}
            disabled={seeding}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> {addLabel}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * SeedButton — A standalone small seed button for header toolbars.
 */
export function SeedButton({ onSeed, seeding }) {
  return (
    <button
      onClick={onSeed}
      disabled={seeding}
      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 font-semibold text-sm text-amber-700 shadow-xs transition-colors disabled:opacity-50"
      title="Tạo dữ liệu mẫu để dùng thử"
    >
      {seeding ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo...</>
      ) : (
        <><Sparkles className="w-4 h-4" /> Dữ liệu mẫu</>
      )}
    </button>
  );
}
