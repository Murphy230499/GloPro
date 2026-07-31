'use client';
import React, { useEffect, useState } from 'react';
import { Search, Filter, Printer, ChevronLeft, ChevronRight, CreditCard, Trash2, RotateCcw, Undo2, X, Eye, ShieldCheck, QrCode, User, Users, Calendar, Check, ChevronDown, Edit3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { base44 } from '@/api/base44Client';
import { useBranch } from '@/lib/BranchContext';
import { formatVND } from '@/lib/format';
import { toast } from '@/components/Layout';
import Avatar from '@/components/Avatar';
import CheckoutModal from '@/components/pos/CheckoutModal';
import POSInvoiceModal from '@/components/POSInvoiceModal';

function InvoiceCustomDatePickerPopover({ selectedDate, onSelectDate, onClose, align = 'left' }) {
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

  const getMonthTitle = () => {
    const d = new Date(year, month, 1);
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  };

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
    <div className={`absolute top-full mt-2 ${align === 'right' ? 'right-0' : 'left-0'} w-[310px] bg-white rounded-3xl border border-slate-100 shadow-2xl p-5 z-[70] animate-in fade-in zoom-in-95 duration-150 font-sans`}>
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
          {getMonthTitle()}
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

          let classNames = "w-9 h-9 rounded-full mx-auto flex items-center justify-center cursor-pointer transition-all font-semibold ";

          if (isSelected) {
            classNames += "bg-emerald-600 text-white font-bold shadow-md scale-105";
          } else if (isHighlight) {
            classNames += "bg-emerald-50 text-emerald-900 font-bold hover:bg-emerald-100";
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
                onSelectDate(item.iso);
                onClose();
              }}
              className={classNames}
            >
              {item.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InvoiceDateFilter({ startDate, endDate, onStartDateChange, onEndDateChange }) {
  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);
  const startRef = React.useRef(null);
  const endRef = React.useRef(null);

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

  return (
    <div className="md:col-span-2 font-sans">
      <div className="grid grid-cols-2 gap-2">
        {/* From Date Button & Popover */}
        <div className="relative" ref={startRef}>
          <button
            type="button"
            onClick={() => { setOpenStart(!openStart); setOpenEnd(false); }}
            className={`w-full flex items-center justify-between gap-2 bg-white rounded-xl border ${openStart ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200 hover:border-slate-300'} shadow-2xs transition-all px-3 py-2 text-left cursor-pointer h-9 text-xs`}
          >
            <div className="flex items-center gap-2 truncate min-w-0">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
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
            <InvoiceCustomDatePickerPopover
              selectedDate={startDate}
              onSelectDate={(iso) => onStartDateChange(iso)}
              onClose={() => setOpenStart(false)}
              align="left"
            />
          )}
        </div>

        {/* To Date Button & Popover */}
        <div className="relative" ref={endRef}>
          <button
            type="button"
            onClick={() => { setOpenEnd(!openEnd); setOpenStart(false); }}
            className={`w-full flex items-center justify-between gap-2 bg-white rounded-xl border ${openEnd ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200 hover:border-slate-300'} shadow-2xs transition-all px-3 py-2 text-left cursor-pointer h-9 text-xs`}
          >
            <div className="flex items-center gap-2 truncate min-w-0">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
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
            <InvoiceCustomDatePickerPopover
              selectedDate={endDate}
              onSelectDate={(iso) => onEndDateChange(iso)}
              onClose={() => setOpenEnd(false)}
              align="right"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function InvoiceStaffFilter({ staffList = [], value = [], onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = React.useRef(null);

  // Normalize array input
  const selectedIds = Array.isArray(value) ? value : (value && value !== 'all' ? [value] : []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const filteredStaff = staffList.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (s.full_name || s.name || '').toLowerCase().includes(q) || (s.phone || '').includes(q);
  });

  const staffByGroup = filteredStaff.reduce((acc, item) => {
    const grp = (item.role || item.category || 'NHÂN VIÊN CHUYÊN MÔN').toUpperCase();
    (acc[grp] = acc[grp] || []).push(item);
    return acc;
  }, {});

  const handleToggleStaff = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === staffList.length) {
      onChange([]);
    } else {
      onChange(staffList.map(s => s.id));
    }
  };

  const isAllSelected = staffList.length > 0 && selectedIds.length === staffList.length;

  let staffLabel = 'Chọn nhân viên áp dụng';
  if (selectedIds.length === 1) {
    const s = staffList.find(x => x.id === selectedIds[0]);
    if (s) staffLabel = s.full_name || s.name;
  } else if (selectedIds.length > 1) {
    staffLabel = `Đã chọn (${selectedIds.length}) nhân viên`;
  }

  const firstSelectedStaff = selectedIds.length === 1 ? staffList.find(x => x.id === selectedIds[0]) : null;

  return (
    <div className="relative font-sans" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs transition-all shadow-2xs cursor-pointer h-9 ${
          open || selectedIds.length > 0
            ? 'border-emerald-500 ring-2 ring-emerald-500/10 bg-white text-slate-800 font-semibold'
            : 'border-slate-200 bg-white text-slate-500 font-normal hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-2 truncate min-w-0 flex-1">
          {firstSelectedStaff && (
            <Avatar src={firstSelectedStaff.avatar_url} name={firstSelectedStaff.full_name || firstSelectedStaff.name} size={18} color={firstSelectedStaff.avatar_color || '#10B981'} />
          )}
          <span className={`truncate ${selectedIds.length === 0 ? 'text-slate-500 font-normal' : 'text-slate-800 font-semibold'}`}>{staffLabel}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {selectedIds.length > 0 && (
            <span 
              onClick={(e) => { e.stopPropagation(); onChange([]); }}
              className="text-slate-300 hover:text-slate-600 text-xs px-1 font-bold cursor-pointer"
              title="Xóa lọc nhân viên"
            >
              ×
            </span>
          )}
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </div>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 w-72 bg-white rounded-2xl border border-slate-200/90 shadow-xl z-[100] flex flex-col max-h-80 animate-in fade-in zoom-in-95 duration-150 font-sans">
          {/* Search Header Bar */}
          <div className="bg-[#f8fafc] px-4 py-3 border-b border-slate-100/80">
            <input
              type="text"
              placeholder="Tìm kiếm nhân viên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs font-normal outline-none text-slate-700 placeholder:text-slate-300 placeholder:font-light"
            />
          </div>

          {/* Staff List Items */}
          <div className="overflow-y-auto p-3 space-y-2 flex-1">
            {/* Select All Item */}
            <button
              type="button"
              onClick={handleSelectAll}
              className="w-full flex items-center gap-3 text-left py-1.5 px-2 rounded-xl text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                isAllSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
              }`}>
                {isAllSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className="font-semibold text-slate-800">Chọn tất cả</span>
            </button>

            {/* Grouped Roles / Categories */}
            {Object.entries(staffByGroup).map(([group, items]) => (
              <div key={group} className="space-y-1 pt-1">
                {/* Group Header */}
                <div className="px-2 pt-2 pb-0.5">
                  <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                    {group}
                  </span>
                </div>

                {/* Sub Items */}
                <div className="pl-2 space-y-0.5">
                  {items.map((st) => {
                    const isSelected = selectedIds.includes(st.id);
                    const name = st.full_name || st.name;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleToggleStaff(st.id)}
                        className="w-full flex items-center gap-3 text-left py-1.5 px-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="flex items-center gap-2 truncate">
                          <Avatar src={st.avatar_url} name={name} size={20} color={st.avatar_color || '#10B981'} />
                          <span className="truncate">{name}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InvoiceCustomerFilter({ customerList = [], value = [], onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = React.useRef(null);

  // Normalize array input
  const selectedIds = Array.isArray(value) ? value : (value && value !== 'all' ? [value] : []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCustomers = customerList.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q);
  });

  const handleToggleCustomer = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    const totalItems = customerList.length + 1; // including walk-in
    if (selectedIds.length === totalItems) {
      onChange([]);
    } else {
      onChange([...customerList.map(c => c.id), 'walk-in']);
    }
  };

  const isAllSelected = (customerList.length + 1) > 0 && selectedIds.length === (customerList.length + 1);

  let customerLabel = 'Chọn khách hàng áp dụng';
  if (selectedIds.length === 1) {
    if (selectedIds[0] === 'walk-in') {
      customerLabel = 'Khách vãng lai';
    } else {
      const c = customerList.find(x => x.id === selectedIds[0]);
      if (c) customerLabel = c.name;
    }
  } else if (selectedIds.length > 1) {
    customerLabel = `Đã chọn (${selectedIds.length}) khách hàng`;
  }

  const singleCustomer = selectedIds.length === 1 && selectedIds[0] !== 'walk-in' ? customerList.find(x => x.id === selectedIds[0]) : null;

  return (
    <div className="relative font-sans" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs transition-all shadow-2xs cursor-pointer h-9 ${
          open || selectedIds.length > 0
            ? 'border-emerald-500 ring-2 ring-emerald-500/10 bg-white text-slate-800 font-semibold'
            : 'border-slate-200 bg-white text-slate-500 font-normal hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-2 truncate min-w-0 flex-1">
          {selectedIds.length === 1 && selectedIds[0] === 'walk-in' ? (
            <Avatar name="Khách vãng lai" size={18} color="#94A3B8" />
          ) : singleCustomer ? (
            <Avatar src={singleCustomer.avatar_url} name={singleCustomer.name} size={18} color="#FBBF24" />
          ) : null}
          <span className={`truncate ${selectedIds.length === 0 ? 'text-slate-500 font-normal' : 'text-slate-800 font-semibold'}`}>{customerLabel}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {selectedIds.length > 0 && (
            <span 
              onClick={(e) => { e.stopPropagation(); onChange([]); }}
              className="text-slate-300 hover:text-slate-600 text-xs px-1 font-bold cursor-pointer"
              title="Xóa lọc khách hàng"
            >
              ×
            </span>
          )}
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </div>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 w-72 bg-white rounded-2xl border border-slate-200/90 shadow-xl z-[100] flex flex-col max-h-80 animate-in fade-in zoom-in-95 duration-150 font-sans">
          {/* Search Header Bar */}
          <div className="bg-[#f8fafc] px-4 py-3 border-b border-slate-100/80">
            <input
              type="text"
              placeholder="Tìm kiếm khách hàng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs font-normal outline-none text-slate-700 placeholder:text-slate-300 placeholder:font-light"
            />
          </div>

          {/* Customer List Items */}
          <div className="overflow-y-auto p-3 space-y-1.5 flex-1">
            {/* Select All Item */}
            <button
              type="button"
              onClick={handleSelectAll}
              className="w-full flex items-center gap-3 text-left py-1.5 px-2 rounded-xl text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                isAllSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
              }`}>
                {isAllSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className="font-semibold text-slate-800">Chọn tất cả</span>
            </button>

            {/* Walk-in Customer */}
            <button
              type="button"
              onClick={() => handleToggleCustomer('walk-in')}
              className="w-full flex items-center gap-3 text-left py-1.5 px-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                selectedIds.includes('walk-in')
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : 'border-slate-300 bg-white'
              }`}>
                {selectedIds.includes('walk-in') && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <div className="flex items-center gap-2 truncate">
                <Avatar name="Khách vãng lai" size={20} color="#94A3B8" />
                <span className="truncate">Khách vãng lai</span>
              </div>
            </button>

            {/* Registered Customers List */}
            {filteredCustomers.map((c) => {
              const isSelected = selectedIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleToggleCustomer(c.id)}
                  className="w-full flex items-center gap-3 text-left py-1.5 px-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <Avatar src={c.avatar_url} name={c.name} size={20} color="#FBBF24" />
                    <span className="truncate">{c.name}</span>
                    {c.phone && <span className="text-[11px] text-slate-400 font-normal">({c.phone})</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const formatDateDDMMYYYY = (iso) => {
  if (!iso) return '—';
  const dateOnly = (iso || '').split('T')[0];
  const parts = dateOnly.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return iso;
};

const STATUS_TABS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'unpaid', label: 'Chưa thanh toán' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'cancelled', label: 'Đã huỷ' },
];

const PAGE_SIZE = 10;

export default function Invoices() {
  const router = useRouter();
  const { currentBranchId } = useBranch();
  const [invoices, setInvoices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('all');
  const [page, setPage] = useState(1);

  // Filter states
  const getTodayStr = () => new Date().toISOString().slice(0, 10);
  const [filterOpen, setFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState(getTodayStr());
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);

  // Printing state
  const [printingInvoice, setPrintingInvoice] = useState(null);
  const [isDraftPrint, setIsDraftPrint] = useState(false);

  // POS Invoice Modal states
  const [posModalOpen, setPosModalOpen] = useState(false);
  const [posModalInvoice, setPosModalInvoice] = useState(null);

  // Direct Payment modal states
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutInvoice, setCheckoutInvoice] = useState(null);
  const [checkoutSession, setCheckoutSession] = useState(null);
  const [paying, setPaying] = useState(false);

  const load = () => {
    setLoading(true);
    const filter = currentBranchId === 'all' ? {} : { branch_id: currentBranchId };
    Promise.all([
      base44.entities.Invoice.filter(filter),
      base44.entities.Staff.list(),
      base44.entities.Customer.list(),
    ]).then(([data, st, cust]) => {
      setInvoices(data.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.invoice_code || '').localeCompare(a.invoice_code || '')));
      setStaff(st.filter((x) => x.is_active !== false));
      setCustomers(cust);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    window.addEventListener('reload-data', load);
    return () => window.removeEventListener('reload-data', load);
  }, [currentBranchId]);

  // Base filtering (Search, Date, Staff, Customer) applied to all status tabs
  const baseFilteredInvoices = invoices.filter((inv) => {
    // Search text filter
    if (search) {
      const q = search.toLowerCase();
      const staffNames = (inv.items || []).map((it) => it.staff_name).filter(Boolean).join(' ');
      const codeMatch = (inv.invoice_code || '').toLowerCase().includes(q);
      const custMatch = (inv.customer_name || '').toLowerCase().includes(q);
      const staffMatch = staffNames.toLowerCase().includes(q);
      if (!codeMatch && !custMatch && !staffMatch) return false;
    }

    // Date Range Filter (Default: Today)
    if (startDate && inv.date && inv.date < startDate) return false;
    if (endDate && inv.date && inv.date > endDate) return false;

    // Staff Filter (Multi-select)
    if (selectedStaffIds && selectedStaffIds.length > 0) {
      const hasStaff = (inv.items || []).some(it => selectedStaffIds.includes(it.staff_id));
      const hasTipSplit = (inv.tip_splits || []).some(ts => selectedStaffIds.includes(ts.staff_id));
      if (!hasStaff && !hasTipSplit) return false;
    }

    // Customer Filter (Multi-select)
    if (selectedCustomerIds && selectedCustomerIds.length > 0) {
      const matchesCustomer = selectedCustomerIds.some(cid => {
        if (cid === 'walk-in') return !inv.customer_id;
        return inv.customer_id === cid;
      });
      if (!matchesCustomer) return false;
    }

    return true;
  });

  // Calculate dynamic tab counts based on filtered date range
  const counts = STATUS_TABS.reduce((acc, t) => {
    if (t.value === 'all') {
      acc[t.value] = baseFilteredInvoices.length;
    } else {
      acc[t.value] = baseFilteredInvoices.filter((i) => i.status === t.value).length;
    }
    return acc;
  }, {});

  // Tab-specific filtered list
  const filtered = baseFilteredInvoices.filter((inv) => {
    if (statusTab !== 'all' && inv.status !== statusTab) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getStaffList = (inv) => {
    const list = [];
    (inv.items || []).forEach(it => {
      if (it.staff_name && !list.includes(it.staff_name)) list.push(it.staff_name);
    });
    return list;
  };

  // 1. Actions for Paid Invoices
  const cancelPayment = async (inv) => {
    if (!confirm(`Bạn có chắc muốn huỷ thanh toán cho hoá đơn ${inv.invoice_code}? Hoá đơn sẽ trở về trạng thái chưa thanh toán và chuyển về màn hình Thu ngân.`)) return;
    try {
      await base44.entities.Invoice.update(inv.id, { status: 'unpaid' });
      toast.success('Đã huỷ thanh toán. Đang chuyển về màn hình Thu ngân...');
      router.push(`/pos?edit_invoice_id=${inv.id}`);
    } catch (e) {
      toast.error('Lỗi: ' + (e.message || e));
    }
  };

  const deleteInvoice = async (inv) => {
    if (!confirm(`Bạn có chắc muốn xoá hoá đơn ${inv.invoice_code}?`)) return;
    try {
      await base44.entities.Invoice.update(inv.id, { status: 'cancelled', previous_status: inv.status });
      
      // Update associated memberships to deleted status
      try {
        const relatedMems = await base44.entities.Membership.filter({ invoice_id: inv.id });
        for (const m of relatedMems) {
          await base44.entities.Membership.update(m.id, { is_deleted: true, status: 'deleted' });
        }
      } catch (err) {
        console.error('Lỗi khi cập nhật trạng thái thẻ mua kèm hoá đơn:', err);
      }

      toast.success('Đã huỷ/xoá hoá đơn');
      load();
    } catch (e) {
      toast.error('Lỗi: ' + (e.message || e));
    }
  };

  const permanentlyDeleteInvoice = async (inv) => {
    if (!confirm(`Bạn có chắc muốn xoá vĩnh viễn hoá đơn ${inv.invoice_code}? Hành động này không thể hoàn tác.`)) return;
    try {
      await base44.entities.Invoice.delete(inv.id);
      toast.success('Đã xoá vĩnh viễn hoá đơn');
      load();
    } catch (e) {
      toast.error('Lỗi: ' + (e.message || e));
    }
  };

  // 2. Actions for Unpaid Invoices - Open POS Invoice Modal ("Tạo Hóa Đơn Trực Tiếp")
  const payInvoice = (inv) => {
    setPosModalInvoice(inv);
    setPosModalOpen(true);
  };

  const handleCheckoutConfirm = async (paymentData) => {
    if (!checkoutInvoice) return;
    setPaying(true);
    try {
      const cart = checkoutSession?.cart || [];
      const subtotal = cart.reduce((s, x) => s + (x.price || 0) * (x.qty || 1), 0);
      const discount = paymentData.discount || 0;
      const tip = paymentData.tip || 0;
      const finalTotal = Math.max(0, subtotal - discount) + tip;

      await base44.entities.Invoice.update(checkoutInvoice.id, {
        status: 'paid',
        subtotal: subtotal,
        discount_amount: discount,
        tip: tip,
        tip_splits: paymentData.tipSplits || [],
        total: finalTotal,
        payment_methods: paymentData.payments || [{ method: 'cash', amount: finalTotal }],
        paid_at: new Date().toISOString(),
      });

      toast.success(`Đã thanh toán thành công hóa đơn ${checkoutInvoice.invoice_code}`);
      setCheckoutOpen(false);
      setCheckoutInvoice(null);
      setCheckoutSession(null);
      load();
    } catch (err) {
      console.error('Lỗi khi thanh toán hóa đơn:', err);
      toast.error('Lỗi khi thanh toán: ' + (err.message || err));
    } finally {
      setPaying(false);
    }
  };

  // 3. Actions for Cancelled Invoices
  const restoreInvoice = async (inv) => {
    const targetStatus = inv.previous_status || 'unpaid';
    try {
      await base44.entities.Invoice.update(inv.id, { status: targetStatus, previous_status: '' });
      
      // Restore associated memberships
      try {
        const relatedMems = await base44.entities.Membership.filter({ invoice_id: inv.id });
        for (const m of relatedMems) {
          await base44.entities.Membership.update(m.id, { is_deleted: false, status: 'active' });
        }
      } catch (err) {
        console.error('Lỗi khi khôi phục trạng thái thẻ mua kèm hoá đơn:', err);
      }

      toast.success(`Đã khôi phục hoá đơn về trạng thái ${targetStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}`);
      load();
    } catch (e) {
      toast.error('Lỗi: ' + (e.message || e));
    }
  };

  // Print Preview Dialog Trigger
  const handlePrintPreview = (inv, draft) => {
    setPrintingInvoice(inv);
    setIsDraftPrint(draft);
  };

  // Print all list
  const printList = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/pos')} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Danh sách hoá đơn</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/pos')} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm shadow-sm transition-colors">
            Quay lại thu ngân
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1">
        {STATUS_TABS.map((t) => (
          <button key={t.value} onClick={() => { setStatusTab(t.value); setPage(1); }}
            className={`px-4 py-2 rounded-t-xl text-sm font-semibold transition-colors border-b-2 ${statusTab === t.value ? 'border-emerald-500 text-emerald-600 font-bold bg-emerald-50/30' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            {t.label} <span className="ml-1 opacity-70 text-xs">({counts[t.value] || 0})</span>
          </button>
        ))}
      </div>

      {/* Filter and Table Panel */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm relative z-10 font-sans">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 p-3.5 border-b border-slate-100 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm theo mã đơn, khách hàng hoặc nhân viên..."
              className="bg-transparent outline-none text-xs flex-1 text-slate-700" />
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setFilterOpen(!filterOpen)} 
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${filterOpen ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'}`}
            >
              <Filter className="w-3.5 h-3.5" /> <span>Lọc</span>
            </button>
            <button onClick={printList} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors">
              <Printer className="w-3.5 h-3.5 text-slate-500" /> <span>In danh sách</span>
            </button>
          </div>
        </div>

        {/* Expandable Filter Box */}
        {filterOpen && (
          <div className="bg-slate-50/50 p-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-600 font-sans animate-in fade-in duration-150 relative z-50">
            {/* Date Range Picker */}
            <InvoiceDateFilter
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={(val) => { setStartDate(val); setPage(1); }}
              onEndDateChange={(val) => { setEndDate(val); setPage(1); }}
            />

            {/* Staff Picker Dropdown */}
            <InvoiceStaffFilter
              staffList={staff}
              value={selectedStaffIds}
              onChange={(val) => { setSelectedStaffIds(val); setPage(1); }}
            />

            {/* Customer Picker Dropdown */}
            <InvoiceCustomerFilter
              customerList={customers}
              value={selectedCustomerIds}
              onChange={(val) => { setSelectedCustomerIds(val); setPage(1); }}
            />
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-100 border-t-primary rounded-full animate-spin" /></div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">Chưa có hoá đơn nào.</div>
        ) : pageData.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">Không có hoá đơn nào phù hợp bộ lọc</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-xs">
                  <th className="text-left px-5 py-4 font-bold text-slate-500 text-xs">Mã đơn</th>
                  <th className="text-left px-5 py-4 font-bold text-slate-500 text-xs">Khách hàng</th>
                  <th className="text-left px-5 py-4 font-bold text-slate-500 text-xs">Nhân viên</th>
                  <th className="text-left px-5 py-4 font-bold text-slate-500 text-xs">Ngày tạo</th>
                  <th className="text-right px-5 py-4 font-bold text-slate-500 text-xs">Tổng tiền</th>
                  <th className="text-left px-5 py-4 font-bold text-slate-500 text-xs">Trạng thái</th>
                  <th className="text-left px-5 py-4 font-bold text-slate-500 text-xs">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageData.map((inv) => {
                  const stfList = getStaffList(inv);
                  const custObj = customers.find(c => c.id === inv.customer_id);
                  const phoneNum = custObj?.phone || '';
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => router.push(`/invoices/${inv.id}`)}
                          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                        >
                          {inv.invoice_code || '—'}
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar 
                            src={custObj?.avatar_url} 
                            name={inv.customer_name} 
                            size={28} 
                            color={custObj?.avatar_color || '#E879A9'} 
                            onClick={() => router.push(inv.customer_id ? `/customers?id=${inv.customer_id}` : `/customers?name=${encodeURIComponent(inv.customer_name)}`)}
                            title="Click để xem chi tiết khách hàng"
                          />
                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => router.push(inv.customer_id ? `/customers?id=${inv.customer_id}` : `/customers?name=${encodeURIComponent(inv.customer_name)}`)}
                              className="text-xs font-bold text-slate-800 hover:text-orange-600 hover:underline cursor-pointer text-left leading-tight"
                              title="Click để xem chi tiết khách hàng"
                            >
                              {inv.customer_name || 'Khách vãng lai'}
                            </button>
                            {phoneNum && <span className="text-[10px] text-slate-400 font-normal mt-0.5">{phoneNum}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center">
                          {stfList.slice(0, 3).map((s, i) => {
                            const stf = staff.find((x) => x.id === s.id);
                            return (
                              <div key={i} className="rounded-full ring-2 ring-white" style={{ marginLeft: i > 0 ? '-8px' : 0, zIndex: 3 - i }}>
                                <Avatar src={stf?.avatar_url} name={s.name} size={24} color={stf?.avatar_color || '#FF6B9D'} />
                              </div>
                            );
                          })}
                          {stfList.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-slate-100 ring-2 ring-white flex items-center justify-center text-[10px] font-bold text-slate-500" style={{ marginLeft: '-8px' }}>
                              +{stfList.length - 3}
                            </div>
                          )}
                          {stfList.length === 0 && <span className="text-slate-300 text-xs">—</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs font-normal">{formatDateDDMMYYYY(inv.date)}</td>
                      <td className="px-5 py-3.5 text-right text-xs font-semibold text-slate-700">{formatVND((inv.total || 0))}</td>
                      <td className="px-5 py-3.5 text-left whitespace-nowrap">
                        {inv.status === 'paid' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200/80">
                            Đã thanh toán
                          </span>
                        )}
                        {inv.status === 'unpaid' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-200/80">
                            Chưa thanh toán
                          </span>
                        )}
                        {inv.status === 'cancelled' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-200/80">
                            Đã huỷ
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-start gap-1.5">
                          {/* Render actions according to invoice status */}
                          {inv.status === 'paid' && (
                            <>
                              <button onClick={() => cancelPayment(inv)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-amber-500 hover:bg-amber-50 hover:border-amber-100 transition-colors" title="Huỷ thanh toán & Sửa">
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handlePrintPreview(inv, false)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-650 hover:bg-slate-50 hover:text-slate-850 transition-colors" title="In hoá đơn">
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => deleteInvoice(inv)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-red-500 hover:bg-red-50 hover:border-red-100 transition-colors" title="Xoá hoá đơn">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {inv.status === 'unpaid' && (
                            <>
                              <button onClick={() => payInvoice(inv)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-green-600 hover:bg-green-50 hover:border-green-150 transition-colors" title="Thanh toán hóa đơn">
                                <CreditCard className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => payInvoice(inv)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-blue-600 hover:bg-blue-50 hover:border-blue-100 transition-colors" title="Chỉnh sửa hóa đơn">
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => deleteInvoice(inv)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-red-500 hover:bg-red-50 hover:border-red-100 transition-colors" title="Xoá hoá đơn">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {inv.status === 'cancelled' && (
                            <>
                              <button onClick={() => restoreInvoice(inv)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-blue-500 hover:bg-blue-50 hover:border-blue-100 transition-colors" title="Khôi phục hoá đơn">
                                <Undo2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => permanentlyDeleteInvoice(inv)} className="w-7 h-7 rounded-lg border border-red-200 flex items-center justify-center text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors" title="Xoá vĩnh viễn hoá đơn">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 py-4 border-t border-slate-100">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-2.5 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 10).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-medium ${page === p ? 'bg-primary text-white border border-primary' : 'border border-slate-200 hover:bg-slate-50'}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-2.5 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Invoice Receipt Print Preview Modal Overlay */}
      {printingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 overflow-y-auto">
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 flex flex-col my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 no-print">
              <span className="text-sm font-bold text-slate-700">
                {isDraftPrint ? 'In hoá đơn tạm tính' : 'In hóa đơn thanh toán'}
              </span>
              <button onClick={() => setPrintingInvoice(null)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            {/* Paper Receipt Look */}
            <div className="printable-receipt bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 font-mono text-xs text-slate-800 space-y-5 shadow-inner">
              {/* Header info */}
              <div className="text-center space-y-1 pb-4 border-b border-slate-200">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary mb-2">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div className="font-bold text-sm tracking-tight">GloPro Spa & Beauty</div>
                <div className="text-[10px] text-slate-400">{printingInvoice.date || '—'}</div>
                <div className="font-black text-sm tracking-wider uppercase pt-3 text-slate-750">
                  {isDraftPrint ? 'HÓA ĐƠN TẠM TÍNH' : 'HÓA ĐƠN BÁN HÀNG'}
                </div>
                <div className="inline-block border border-dashed border-slate-300 rounded px-2.5 py-1.5 font-bold tracking-tight bg-white text-[10px] mt-1">
                  {printingInvoice.invoice_code}
                </div>
              </div>

              {/* Customer Details */}
              <div className="space-y-1 border-b border-slate-200 pb-3">
                <div className="flex justify-between"><span>Tên khách hàng:</span><span className="font-bold text-right truncate max-w-[180px]">{printingInvoice.customer_name || 'Khách vãng lai'}</span></div>
                <div className="flex justify-between"><span>Số điện thoại:</span><span>—</span></div>
                <div className="flex justify-between"><span>Mã hóa đơn:</span><span>{printingInvoice.invoice_code}</span></div>
              </div>

              {/* Line Items */}
              <div className="space-y-3 pb-3 border-b border-slate-200">
                {(printingInvoice.items || []).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <span className="truncate pr-2">{item.name} {item.qty > 1 && `x${item.qty}`}</span>
                    <span className="shrink-0 font-semibold">{formatVND(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>

              {/* Calculations */}
              <div className="space-y-1 border-b border-slate-200 pb-3">
                <div className="flex justify-between"><span>Tạm tính:</span><span>{formatVND(printingInvoice.subtotal || 0)}</span></div>
                <div className="flex justify-between"><span>Giảm giá:</span><span>-{formatVND(printingInvoice.discount || 0)}</span></div>
                <div className="flex justify-between"><span>Thuế (Tax):</span><span>0 đ</span></div>
                <div className="flex justify-between"><span>Tiền tip:</span><span>{formatVND(printingInvoice.tip || 0)}</span></div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center text-sm font-black tracking-wider pb-3 border-b border-slate-200 text-slate-900">
                <span>TỔNG THANH TOÁN:</span>
                <span>{formatVND(printingInvoice.total || 0)}</span>
              </div>

              {/* Payments */}
              {!isDraftPrint && (
                <div className="space-y-1">
                  <div className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Phương thức thanh toán</div>
                  {(printingInvoice.payment_methods || []).map((p, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="capitalize">{METHODS.find(m => m.value === p.method)?.label || p.method}</span>
                      <span className="font-semibold">{formatVND(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* QR block code */}
              <div className="text-center space-y-2 pt-4 border-t border-slate-200">
                <div className="text-[10px] text-slate-400 max-w-[200px] mx-auto">Quét mã QR để tải ứng dụng đặt lịch hẹn</div>
                <div className="bg-white border border-slate-200 p-2.5 rounded-xl inline-block shadow-xs">
                  <QrCode className="w-20 h-20 text-slate-700" />
                </div>
                <div className="text-[9px] text-slate-400 max-w-[240px] mx-auto pt-2 leading-relaxed font-sans">
                  Cảm ơn quý khách đã sử dụng dịch vụ tại GloPro Spa & Beauty. Rất hân hạnh được phục vụ quý khách lần sau!
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="mt-5 flex gap-2 w-full shrink-0 no-print">
              <button 
                onClick={() => { window.print(); toast.success('Đang thực thi in...'); }}
                className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 bg-white"
              >
                <Printer className="w-4 h-4" /> In hóa đơn
              </button>
              <button 
                onClick={() => setPrintingInvoice(null)} 
                className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/95 transition-colors flex items-center justify-center gap-1.5"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct POS Invoice Creation / Edit Modal */}
      {posModalOpen && (
        <POSInvoiceModal
          open={posModalOpen}
          existingInvoice={posModalInvoice}
          customer={customers.find(c => c.id === posModalInvoice?.customer_id)}
          onClose={() => {
            setPosModalOpen(false);
            setPosModalInvoice(null);
          }}
          onSaved={() => {
            setPosModalOpen(false);
            setPosModalInvoice(null);
            load();
          }}
        />
      )}

      {/* Direct Payment Checkout Modal */}
      {checkoutOpen && checkoutSession && (
        <CheckoutModal
          open={checkoutOpen}
          onClose={() => {
            setCheckoutOpen(false);
            setCheckoutInvoice(null);
            setCheckoutSession(null);
          }}
          session={checkoutSession}
          staff={staff}
          onConfirm={handleCheckoutConfirm}
          paying={paying}
        />
      )}
    </div>
  );
}