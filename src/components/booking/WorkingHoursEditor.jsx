'use client';
import React from 'react';

const DAYS = [
  { key: 'mon', label: 'Thứ 2' },
  { key: 'tue', label: 'Thứ 3' },
  { key: 'wed', label: 'Thứ 4' },
  { key: 'thu', label: 'Thứ 5' },
  { key: 'fri', label: 'Thứ 6' },
  { key: 'sat', label: 'Thứ 7' },
  { key: 'sun', label: 'CN' },
];

const DEFAULT_HOURS = { open: '09:00', close: '18:00', enabled: true };

export default function WorkingHoursEditor({ value = {}, onChange }) {
  const hours = DAYS.reduce((acc, d) => {
    acc[d.key] = value[d.key] || { ...DEFAULT_HOURS };
    return acc;
  }, {});

  const update = (dayKey, field, val) => {
    onChange({ ...hours, [dayKey]: { ...hours[dayKey], [field]: val } });
  };

  return (
    <div className="space-y-2">
      {DAYS.map(day => {
        const h = hours[day.key];
        return (
          <div
            key={day.key}
            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
              h.enabled ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'
            }`}
          >
            {/* Toggle */}
            <button
              type="button"
              onClick={() => update(day.key, 'enabled', !h.enabled)}
              className={`w-10 h-6 rounded-full transition-all relative shrink-0 ${h.enabled ? 'bg-pink-500' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${h.enabled ? 'left-5' : 'left-1'}`} />
            </button>

            {/* Day label */}
            <span className={`text-sm font-semibold w-14 shrink-0 ${h.enabled ? 'text-slate-800' : 'text-slate-400'}`}>
              {day.label}
            </span>

            {/* Time inputs */}
            {h.enabled ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="time"
                  value={h.open}
                  onChange={e => update(day.key, 'open', e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-pink-400"
                />
                <span className="text-slate-400 text-sm">–</span>
                <input
                  type="time"
                  value={h.close}
                  onChange={e => update(day.key, 'close', e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-pink-400"
                />
              </div>
            ) : (
              <span className="text-xs text-slate-400 italic flex-1">Nghỉ ngày này</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
