import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const COLOR_MAP = {
  emerald: {
    bg: 'bg-emerald-500', bgLight: 'bg-emerald-50', textDark: 'text-emerald-900', hoverBg: 'hover:bg-emerald-100'
  },
  red: {
    bg: 'bg-red-500', bgLight: 'bg-red-50', textDark: 'text-red-900', hoverBg: 'hover:bg-red-100'
  },
  blue: {
    bg: 'bg-blue-500', bgLight: 'bg-blue-50', textDark: 'text-blue-900', hoverBg: 'hover:bg-blue-100'
  },
  pink: {
    bg: 'bg-pink-500', bgLight: 'bg-pink-50', textDark: 'text-pink-900', hoverBg: 'hover:bg-pink-100'
  }
};

export default function DatePickerPopover({ selectedDate, onSelectDate, onClose, align = 'left', color = 'emerald' }) {
  const todayISO = new Date().toISOString().split('T')[0];
  const [viewDate, setViewDate] = useState(() => {
    if (selectedDate) {
      const parts = selectedDate.split('-');
      return new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    }
    return new Date();
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays = [];

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonthDate = new Date(year, month - 1, day);
    const mm = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const iso = `${prevMonthDate.getFullYear()}-${mm}-${dd}`;
    calendarDays.push({ day, iso, isCurrentMonth: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const iso = `${year}-${mm}-${dd}`;
    calendarDays.push({ day: d, iso, isCurrentMonth: true });
  }

  const totalCells = Math.ceil(calendarDays.length / 7) * 7;
  const remaining = totalCells - calendarDays.length;
  for (let d = 1; d <= remaining; d++) {
    const nextMonthDate = new Date(year, month + 1, d);
    const mm = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const iso = `${nextMonthDate.getFullYear()}-${mm}-${dd}`;
    calendarDays.push({ day: d, iso, isCurrentMonth: false });
  }

  const selectedIso = selectedDate || '';

  const isHighlightedWeek = (iso) => {
    if (!selectedIso || !iso) return false;
    const target = new Date(selectedIso);
    const current = new Date(iso);
    const diffTime = current - target;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= -3 && diffDays <= 3 && current.getMonth() === target.getMonth();
  };

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 sm:bg-transparent sm:p-0 sm:block sm:absolute sm:top-full sm:mt-2 ${align === 'right' ? 'sm:right-0' : 'sm:left-0'} sm:w-[310px] sm:shadow-2xl sm:z-[70] animate-in fade-in zoom-in-95 duration-150 font-sans`}
      onClick={(e) => { e.stopPropagation(); onClose?.(); }}
    >
      <div 
        className="w-[310px] sm:w-full bg-white rounded-3xl border border-slate-100 shadow-2xl p-5 sm:shadow-none sm:p-5 sm:border-0 sm:rounded-none sm:bg-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Month Year Header */}
        <div className="flex items-center justify-between mb-4 px-1">
          <button
            type="button"
            onClick={prevMonth}
            className="w-9 h-9 rounded-full border border-slate-100 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95 shadow-2xs cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.2]" />
          </button>

          <div className="text-base font-bold text-slate-900 tracking-tight">
            {monthNames[month]} {year}
          </div>

          <button
            type="button"
            onClick={nextMonth}
            className="w-9 h-9 rounded-full border border-slate-100 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95 shadow-2xs cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Weekdays Header */}
        <div className="grid grid-cols-7 text-center mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <span key={d} className="text-xs font-bold text-slate-400 py-1">
              {d}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {calendarDays.map((item, idx) => {
            const isSelected = item.iso === selectedIso;
            const isHighlight = !isSelected && item.isCurrentMonth && isHighlightedWeek(item.iso);

            const theme = COLOR_MAP[color] || COLOR_MAP.emerald;
            let classNames = "w-9 h-9 rounded-full mx-auto flex items-center justify-center cursor-pointer transition-all font-semibold ";

            if (isSelected) {
              classNames += `${theme.bg} text-white font-bold shadow-md scale-105`;
            } else if (isHighlight) {
              classNames += `${theme.bgLight} ${theme.textDark} font-bold ${theme.hoverBg}`;
            } else if (item.isCurrentMonth) {
              classNames += "text-slate-800 hover:bg-slate-100 font-medium";
            } else {
              classNames += "text-slate-300 hover:bg-slate-50 font-normal";
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (onSelectDate) onSelectDate(item.iso);
                  if (onClose) onClose();
                }}
                className={classNames}
              >
                {item.day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
