import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';
import DatePickerPopover from './DatePickerPopover';

const FILTER_COLOR_MAP = {
  emerald: {
    border: 'border-emerald-500', ring: 'ring-emerald-500/10', icon: 'text-emerald-600'
  },
  red: {
    border: 'border-red-500', ring: 'ring-red-500/10', icon: 'text-red-600'
  },
  blue: {
    border: 'border-blue-500', ring: 'ring-blue-500/10', icon: 'text-blue-600'
  },
  pink: {
    border: 'border-pink-500', ring: 'ring-pink-500/10', icon: 'text-pink-600'
  }
};

export default function DateRangeFilter({ startDate, endDate, onStartDateChange, onEndDateChange, color = 'emerald' }) {
  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);
  const startRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (startRef.current && !startRef.current.contains(e.target)) {
        setOpenStart(false);
      }
      if (endRef.current && !endRef.current.contains(e.target)) {
        setOpenEnd(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);
  
  const handlePreset = (type) => {
    const today = new Date();
    if (type === 'today') {
      onStartDateChange(todayStr);
      onEndDateChange(todayStr);
    } else if (type === 'this_week') {
      const first = new Date(today.setDate(today.getDate() - today.getDay() + 1));
      onStartDateChange(first.toISOString().slice(0, 10));
      onEndDateChange(new Date().toISOString().slice(0, 10));
    } else if (type === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
      onStartDateChange(firstDay);
      onEndDateChange(new Date().toISOString().slice(0, 10));
    } else if (type === 'all') {
      onStartDateChange('');
      onEndDateChange('');
    }
  };

  const formatDateLabel = (iso) => {
    if (!iso) return 'Chọn ngày';
    const parts = iso.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return iso;
  };

  const theme = FILTER_COLOR_MAP[color] || FILTER_COLOR_MAP.emerald;
  
  return (
    <div className="font-sans flex flex-col gap-2">
      <div className="flex gap-2">
        {/* From Date Button & Popover */}
        <div className="relative w-36" ref={startRef}>
          <button
            type="button"
            onClick={() => { setOpenStart(!openStart); setOpenEnd(false); }}
            className={`w-full flex items-center justify-between gap-2 bg-white rounded-xl border ${openStart ? `${theme.border} ring-2 ${theme.ring}` : 'border-slate-200 hover:border-slate-300'} shadow-2xs transition-all px-3 py-2 text-left cursor-pointer h-9 text-xs`}
          >
            <div className="flex items-center gap-2 truncate min-w-0">
              <Calendar className={`w-3.5 h-3.5 ${theme.icon} shrink-0`} />
              <span className="text-[11px] text-slate-400 font-medium shrink-0">Từ:</span>
              <span className="font-semibold text-slate-800 truncate">
                {formatDateLabel(startDate)}
              </span>
            </div>
            {startDate && (
              <span 
                onClick={(e) => { e.stopPropagation(); onStartDateChange(''); }} 
                className="text-slate-300 hover:text-slate-500 text-xs px-1 font-bold shrink-0"
                title="Xóa ngày"
              >
                ×
              </span>
            )}
          </button>

          {openStart && (
            <DatePickerPopover
              selectedDate={startDate}
              color={color}
              onSelectDate={(iso) => {
                onStartDateChange(iso);
                setOpenStart(false);
                if (!endDate || iso > endDate) {
                  onEndDateChange(iso);
                }
              }}
              onClose={() => setOpenStart(false)}
            />
          )}
        </div>

        {/* To Date Button & Popover */}
        <div className="relative w-36" ref={endRef}>
          <button
            type="button"
            onClick={() => { setOpenEnd(!openEnd); setOpenStart(false); }}
            className={`w-full flex items-center justify-between gap-2 bg-white rounded-xl border ${openEnd ? `${theme.border} ring-2 ${theme.ring}` : 'border-slate-200 hover:border-slate-300'} shadow-2xs transition-all px-3 py-2 text-left cursor-pointer h-9 text-xs`}
          >
            <div className="flex items-center gap-2 truncate min-w-0">
              <Calendar className={`w-3.5 h-3.5 ${theme.icon} shrink-0`} />
              <span className="text-[11px] text-slate-400 font-medium shrink-0">Đến:</span>
              <span className="font-semibold text-slate-800 truncate">
                {formatDateLabel(endDate)}
              </span>
            </div>
            {endDate && (
              <span 
                onClick={(e) => { e.stopPropagation(); onEndDateChange(''); }} 
                className="text-slate-300 hover:text-slate-500 text-xs px-1 font-bold shrink-0"
                title="Xóa ngày"
              >
                ×
              </span>
            )}
          </button>

          {openEnd && (
            <DatePickerPopover
              selectedDate={endDate}
              color={color}
              onSelectDate={(iso) => {
                onEndDateChange(iso);
                setOpenEnd(false);
                if (!startDate || iso < startDate) {
                  onStartDateChange(iso);
                }
              }}
              onClose={() => setOpenEnd(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
