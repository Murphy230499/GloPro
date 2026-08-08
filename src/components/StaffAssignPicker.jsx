'use client';
import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { useT } from '@/lib/i18n';

export default function StaffAssignPicker({ staff, value, isRequested = false, onChange, placeholder, color = 'emerald-500', hideRequestedCheckbox = false, disabledStaffIds = [] }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUp: false });
  const selected = staff.find((s) => s.id === value);
  const displayPlaceholder = placeholder || t('pos.ticket.select_staff_placeholder', '— Phân KTV —');

  const handleToggle = (e) => {
    if (open) {
      setOpen(false);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Dropdown is max-h-56 which is 224px. We need around 240px space.
    const openUp = spaceBelow < 245 && spaceAbove > spaceBelow;

    setCoords({
      top: openUp ? rect.top - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      openUp
    });
    setOpen(true);
  };

  const getFocusBorderClass = () => {
    if (color === 'orange-500') return 'focus:border-orange-500';
    if (color === 'purple-500') return 'focus:border-purple-500';
    if (color === 'pink-500') return 'focus:border-pink-500';
    return 'focus:border-emerald-500';
  };

  const getCheckboxTextClass = () => {
    if (color === 'orange-500') return 'text-orange-500 focus:ring-orange-500';
    if (color === 'purple-500') return 'text-purple-500 focus:ring-purple-500';
    if (color === 'pink-500') return 'text-pink-500 focus:ring-pink-500';
    return 'text-emerald-500 focus:ring-emerald-500';
  };

  return (
    <div className="relative mt-2">
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none ${getFocusBorderClass()} transition-colors`}
      >
        {selected ? (
          <>
            <Avatar src={selected.avatar_url} name={selected.full_name} size={20} color={selected.avatar_color} />
            <span className="font-medium truncate">{selected.full_name}</span>
          </>
        ) : (
          <span className="text-slate-400">{displayPlaceholder}</span>
        )}
        <ChevronDown className="w-3.5 h-3.5 ml-auto text-slate-400 shrink-0 mr-1" />
      </button>
      {selected && !hideRequestedCheckbox && (
        <label className="flex items-center gap-1.5 cursor-pointer select-none pl-1 mt-1.5 mb-0.5 py-0.5 group">
          <input 
            type="checkbox"
            checked={!!isRequested}
            onChange={(e) => onChange(value, selected.full_name, e.target.checked)}
            className={`w-3.5 h-3.5 ${getCheckboxTextClass()} border-slate-300 rounded focus:ring-0 focus:outline-none cursor-pointer transition-all shrink-0`}
          />
          <span className="text-[11px] font-semibold text-slate-500 group-hover:text-slate-700 transition-colors">{t('pos.ticket.customer_requested', 'Yêu cầu')}</span>
        </label>
      )}
      {open && (
        <>
          <div className="fixed inset-0 z-[60] bg-transparent" onClick={() => setOpen(false)} />
          <div
            className={`fixed z-[70] bg-white rounded-xl border border-slate-150 shadow-2xl py-1 max-h-56 overflow-y-auto ${coords.openUp ? '-translate-y-full' : ''}`}
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              minWidth: `${Math.max(coords.width, 240)}px`
            }}
          >
            <button
              type="button"
              onClick={() => { onChange('', '', false); setOpen(false); }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 text-xs text-slate-500"
            >
              <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center"><Check className="w-3 h-3 text-slate-400" /></div>
              {t('appointments.unassigned', 'Chưa phân công')}
            </button>
            {staff.map((s) => {
              const isDisabled = disabledStaffIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => { onChange(s.id, s.full_name, isRequested); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left group transition-colors ${
                    isDisabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <Avatar src={s.avatar_url} name={s.full_name} size={20} color={isDisabled ? 'gray' : s.avatar_color} />
                  <span className={`font-medium truncate flex-1 text-left ${isDisabled ? 'text-slate-400' : ''}`}>{s.full_name}</span>
                  <span className="text-[10px] text-slate-400 text-right truncate max-w-[120px]">
                    {isDisabled ? 'Kẹt lịch' : (s.role ? ({
                      manager: 'Quản lý',
                      receptionist: 'Lễ tân',
                      stylist: 'Stylist',
                      barber: 'Barber',
                      therapist: 'Kỹ thuật viên',
                      nail_tech: 'Nail Tech',
                      cashier: 'Thu ngân',
                      admin: 'Quản trị viên'
                    }[s.role] || s.role) : s.specialties)}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}