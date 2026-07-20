'use client';
import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import Avatar from '@/components/Avatar';

export default function StaffAssignPicker({ staff, value, isRequested = false, onChange, placeholder = '— Phân KTV —' }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUp: false });
  const selected = staff.find((s) => s.id === value);

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

  return (
    <div className="relative mt-2">
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-primary transition-colors"
      >
        {selected ? (
          <>
            <Avatar src={selected.avatar_url} name={selected.full_name} size={20} color={selected.avatar_color} />
            <span className="font-medium truncate">{selected.full_name}</span>
          </>
        ) : (
          <span className="text-slate-400">{placeholder}</span>
        )}
        <ChevronDown className="w-3.5 h-3.5 ml-auto text-slate-400 shrink-0 mr-1" />
      </button>
      {selected && (
        <label className="flex items-center gap-1.5 cursor-pointer select-none pl-1 mt-1">
          <input 
            type="checkbox"
            checked={isRequested}
            onChange={(e) => onChange(value, selected.full_name, e.target.checked)}
            className="w-3.5 h-3.5 text-pink-500 border-slate-200 rounded focus:ring-0 focus:outline-none cursor-pointer"
          />
          <span className="text-[10px] font-medium text-slate-500">Khách yêu cầu</span>
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
              width: `${coords.width}px`
            }}
          >
            <button
              type="button"
              onClick={() => { onChange('', '', false); setOpen(false); }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 text-xs text-slate-500"
            >
              <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center"><Check className="w-3 h-3 text-slate-400" /></div>
              Bất kỳ / Chưa phân
            </button>
            {staff.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => { onChange(s.id, s.full_name, false); setOpen(false); }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 text-xs"
              >
                <Avatar src={s.avatar_url} name={s.full_name} size={20} color={s.avatar_color} />
                <span className="font-medium truncate flex-1 text-left">{s.full_name}</span>
                <span className="text-[10px] text-slate-400">{s.specialties}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}