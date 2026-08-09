'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useT } from '@/lib/i18n';
import { createPortal } from 'react-dom';
import { X, Plus, PlusCircle, Trash2, ChevronDown, Clock, Maximize2, Minus, Tag, Wand2, Eye, Calendar, Check, Search, User, Users, Scissors, FileText, MoreHorizontal, PiggyBank, Package, Star, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/Layout';
import { formatVND } from '@/lib/format';
import CustomerPicker from '@/components/CustomerPicker';
import Avatar from '@/components/Avatar';
import { PROMOTIONS } from '@/utils/promos';
import { DEFAULT_FACILITIES } from '@/components/appointments/constants';
import POSInvoiceModal from '@/components/POSInvoiceModal';
import PackageUsageModal from '@/components/pos/PackageUsageModal';

// Custom Staff Picker Dropdown Component floating on top layer using React Portal (Drops Downward on Click)
function StaffPickerDropdown({ staffList = [], value, onChange, t }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 240 });
  const containerRef = useRef(null);

  const selectedStaffObj = staffList.find(st => st.id === value);

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 240)
      });
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      updateCoords();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        const popupEl = document.getElementById('staff-picker-portal-popup');
        if (popupEl && popupEl.contains(e.target)) return;
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      if (isOpen) updateCoords();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  // Group staff by role/position
  const groupedStaff = React.useMemo(() => {
    const groups = {};
    staffList.forEach(st => {
      const role = st.role_name || st.position || st.role || t('nav.staff', 'Nhân viên');
      if (!groups[role]) groups[role] = [];
      groups[role].push(st);
    });
    return groups;
  }, [staffList]);

  return (
    <div 
      className="relative flex-1 min-w-[135px]" 
      ref={containerRef}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between pl-2.5 pr-2 py-2.5 rounded-xl border border-slate-200/80 bg-white text-xs font-normal text-slate-800 outline-none focus:border-blue-500 cursor-pointer shadow-2xs hover:border-slate-300 transition-colors"
      >
        <div className="flex items-center gap-2 truncate">
          {selectedStaffObj ? (
            <>
              <Avatar
                src={selectedStaffObj.avatar_url}
                name={selectedStaffObj.full_name || selectedStaffObj.name}
                size={20}
                color="#3B82F6"
              />
              <span className="truncate text-slate-800 font-medium">{selectedStaffObj.full_name || selectedStaffObj.name}</span>
            </>
          ) : (
            <span className="text-slate-400 truncate font-normal">— {t('appt.modal.select_staff', 'Chọn nhân viên...')} —</span>
          )}
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 stroke-[1.8]" />
      </button>

      {/* Portal Popup Dropdown Panel floating on top layer opening DOWNWARDS */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          id="staff-picker-portal-popup"
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            zIndex: 99999
          }}
          className="bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col max-h-64 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 text-left font-sans"
        >
          {/* Search Input */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 border-b border-slate-100 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder={t('appointments.search_staff_placeholder', 'tìm kiếm nhân viên...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs font-medium outline-none text-slate-700 placeholder:text-slate-400 placeholder:font-normal"
              autoFocus
            />
          </div>

          {/* Scrollable list */}
          <div className="overflow-y-auto p-1.5 space-y-1">
            {/* Option to clear selection */}
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 text-left py-1.5 px-2.5 rounded-lg hover:bg-slate-100 text-slate-400 text-xs transition-colors ${!value ? 'bg-blue-50 text-blue-600 font-semibold' : ''}`}
            >
              <span>— {t('appointments.unassigned', 'Chưa phân công')} —</span>
            </button>

            {Object.keys(groupedStaff).length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">{t('appointments.search_no_results', 'Không có nhân viên nào')}</div>
            ) : (
              Object.entries(groupedStaff).map(([roleName, members]) => {
                const visibleMembers = members.filter(m => 
                  (m.full_name || m.name || '').toLowerCase().includes(search.toLowerCase())
                );
                if (visibleMembers.length === 0) return null;

                return (
                  <div key={roleName} className="space-y-0.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1 bg-slate-50/50 rounded-md">
                      {roleName}
                    </div>
                    <div className="space-y-0.5">
                      {visibleMembers.map(m => {
                        const isSelected = m.id === value;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              onChange(m.id);
                              setIsOpen(false);
                            }}
                            className={`w-full flex items-center justify-between text-left py-1.5 px-2.5 rounded-xl hover:bg-blue-50/80 transition-colors ${isSelected ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700'}`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Avatar src={m.avatar_url} name={m.full_name || m.name} size={22} color="#3B82F6" />
                              <span className="text-xs truncate">{m.full_name || m.name}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// Custom Date & Time Picker Popover Component (Drops Downward on Click)
function DateTimePickerPopover({ dateValue, timeValue, onSelect, t }) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const containerRef = useRef(null);

  // Selected date object & current calendar month navigation
  const selectedDateObj = React.useMemo(() => {
    if (!dateValue) return new Date();
    const [y, m, d] = dateValue.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [dateValue]);

  const [viewYear, setViewYear] = useState(selectedDateObj.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDateObj.getMonth());

  useEffect(() => {
    if (dateValue) {
      const [y, m] = dateValue.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    }
  }, [dateValue]);

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 6,
        left: Math.min(Math.max(10, rect.left), typeof window !== 'undefined' ? window.innerWidth - 560 : rect.left)
      });
    }
  };

  const handleToggle = () => {
    if (!isOpen) updateCoords();
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        const popupEl = document.getElementById('date-time-picker-portal-popup');
        if (popupEl && popupEl.contains(e.target)) return;
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      if (isOpen) updateCoords();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  const lang = typeof window !== 'undefined' ? localStorage.getItem('glowpro_branch_language') || 'vi' : 'vi';
  const langCode = lang === 'zh' ? 'zh-CN' : lang === 'ko' ? 'ko-KR' : lang === 'ja' ? 'ja-JP' : lang === 'en' ? 'en-US' : 'vi-VN';
  const monthLabel = React.useMemo(() => {
    return new Date(viewYear, viewMonth).toLocaleDateString(langCode, { month: 'long', year: 'numeric' });
  }, [viewYear, viewMonth, langCode]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const daysGrid = React.useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);

    let startDay = firstDayOfMonth.getDay() - 1;
    if (startDay === -1) startDay = 6;

    const days = [];
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();

    for (let i = startDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthLastDay - i, isCurrentMonth: false, monthOffset: -1 });
    }

    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      days.push({ day: i, isCurrentMonth: true, monthOffset: 0 });
    }

    const remaining = 35 - days.length > 0 ? 35 - days.length : (42 - days.length);
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, isCurrentMonth: false, monthOffset: 1 });
    }

    return days;
  }, [viewYear, viewMonth]);

  const today = new Date();

  const timeSlots = React.useMemo(() => {
    const slots = [];
    for (let hour = 8; hour <= 21; hour++) {
      for (let min = 0; min < 60; min += 15) {
        if (hour === 21 && min > 0) break;
        const hStr = String(hour).padStart(2, '0');
        const mStr = String(min).padStart(2, '0');
        slots.push(`${hStr}:${mStr}`);
      }
    }
    return slots;
  }, []);

  const handleSelectDay = (cell) => {
    let targetYear = viewYear;
    let targetMonth = viewMonth + cell.monthOffset;
    if (targetMonth < 0) {
      targetMonth = 11;
      targetYear -= 1;
    } else if (targetMonth > 11) {
      targetMonth = 0;
      targetYear += 1;
    }

    const formattedDate = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
    onSelect(formattedDate, timeValue || '11:00');
  };

  const handleSelectTime = (t) => {
    onSelect(dateValue || new Date().toISOString().slice(0, 10), t);
  };

  const formattedDisplayDate = dateValue ? dateValue.split('-').reverse().join('/') : '';

  return (
    <div 
      className="relative" 
      ref={containerRef}
    >
      {/* Trigger Input Bar */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between pl-3.5 pr-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-white text-xs font-normal text-slate-800 outline-none focus:border-blue-500 cursor-pointer shadow-2xs hover:border-slate-300 transition-colors"
      >
        <span className="font-normal text-slate-800 text-xs">{timeValue || '11:00'}, {formattedDisplayDate}</span>
        <Calendar className="w-4 h-4 text-blue-600 shrink-0 stroke-[2]" />
      </button>

      {/* Date & Time Picker Portal Popover opening DOWNWARDS on CLICK */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          id="date-time-picker-portal-popup"
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 99999
          }}
          className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-200/90 flex gap-5 font-sans animate-in fade-in slide-in-from-top-1 duration-150 text-left select-none max-w-[560px]"
        >
          {/* Left Column: Calendar Month View */}
          <div className="w-[260px] shrink-0 space-y-4">
            {/* Header Controls: < Month Year > */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer font-bold text-sm"
              >
                ‹
              </button>
              <span className="font-bold text-sm text-slate-900 font-sans">
                {monthLabel}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer font-bold text-sm"
              >
                ›
              </button>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {(() => {
                const baseDate = new Date(2023, 0, 2); // Monday
                const list = [];
                for (let i = 0; i < 7; i++) {
                  const d = new Date(baseDate);
                  d.setDate(baseDate.getDate() + i);
                  list.push(d.toLocaleDateString(langCode, { weekday: 'short' }));
                }
                return list;
              })().map(d => (
                <span key={d} className="text-xs font-semibold text-slate-500 py-1">{d}</span>
              ))}
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {daysGrid.map((cell, idx) => {
                let cellYear = viewYear;
                let cellMonth = viewMonth + cell.monthOffset;
                if (cellMonth < 0) { cellMonth = 11; cellYear -= 1; }
                if (cellMonth > 11) { cellMonth = 0; cellYear += 1; }

                const cellDateStr = `${cellYear}-${String(cellMonth + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
                const isSelected = cellDateStr === dateValue;
                const isToday = cellYear === today.getFullYear() && cellMonth === today.getMonth() && cell.day === today.getDate();

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDay(cell)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all cursor-pointer mx-auto ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : isToday
                        ? 'border border-blue-500 text-blue-600 font-bold bg-blue-50/50'
                        : cell.isCurrentMonth
                        ? 'text-slate-800 font-medium hover:bg-slate-100'
                        : 'text-slate-300 font-normal hover:bg-slate-50'
                    }`}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="w-[1px] bg-slate-100 shrink-0" />

          {/* Right Column: Time Slots List Grid */}
          <div className="w-[200px] shrink-0 space-y-2">
            <div className="text-xs font-bold text-slate-400 lowercase tracking-wider mb-2">
              khung giờ hẹn
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
              {timeSlots.map(t => {
                const isSelected = t === timeValue;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleSelectTime(t)}
                    className={`py-2 px-2.5 rounded-xl text-xs text-center transition-all cursor-pointer truncate ${
                      isSelected
                        ? 'bg-blue-50 text-blue-600 border border-blue-500 font-bold shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200/70'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function addMinutesToTime(timeStr, minutesToAdd) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + (minutesToAdd || 0);
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

export default function AppointmentModal({
  open,
  onClose,
  onSaved,
  branchId,
  defaultDate,
  defaultStartTime,
  defaultStaffId,
  defaultStaffName,
  defaultFacilityId,
  defaultFacilityName,
  editing,
  defaultCustomer,
  onCheckout,
  facilityList = DEFAULT_FACILITIES
}) {
  const { t } = useT();
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  
  // Primary Modal States
  const [mode, setMode] = useState('appointment');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [voucherInput, setVoucherInput] = useState('');
  const [posModalOpen, setPosModalOpen] = useState(false);
  const [posCustomer, setPosCustomer] = useState(null);
  const [posInitialCart, setPosInitialCart] = useState([]);

  // Status Menu & Tab States
  const [activeTab, setActiveTab] = useState('general');
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [showPackageUsageModal, setShowPackageUsageModal] = useState(false);
  const statusMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target)) {
        setIsStatusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerPOSCheckout = (newStatus = 'completed') => {
    const custObj = selectedCustomerObj || {
      id: form.customer_id || '',
      name: form.customer_name || 'Khách vãng lai',
      phone: form.customer_phone || ''
    };

    if (guests && guests.length > 0) {
      guests.forEach((g) => {
        g.items?.forEach((s) => {
          if (s.service_name || s.name) {
            cart.push({
              name: s.service_name || s.name,
              price: Number(s.price) || 0,
              qty: 1,
              type: 'service',
              staff_id: s.staff_id || '',
              staff_name: s.staff_name || '',
              is_from_package: s.is_from_package || false,
              customer_package_id: s.customer_package_id || null,
              package_name: s.package_name || null
            });
          }
        });
      });
    }

    if (cart.length === 0) {
      if (editing?.service_name) {
        cart.push({
          name: editing.service_name,
          price: Number(editing.price) || 0,
          qty: 1,
          type: 'service',
          staff_id: editing.staff_id || '',
          staff_name: editing.staff_name || ''
        });
      } else if (editing?.services && editing.services.length > 0) {
        editing.services.forEach(s => {
          cart.push({
            name: s.service_name || s.name,
            price: Number(s.price) || 0,
            qty: 1,
            type: 'service',
            staff_id: s.staff_id || '',
            staff_name: s.staff_name || '',
            is_from_package: s.is_from_package || false,
            customer_package_id: s.customer_package_id || null,
            package_name: s.package_name || null
          });
        });
      }
    }

    if (onCheckout) {
      onCheckout({ customer: custObj, cart });
    } else {
      setPosCustomer(custObj);
      setPosInitialCart(cart);
      setPosModalOpen(true);
    }
  };

  const getStatusDotColor = (st) => {
    switch (st) {
      case 'pending': return '#94A3B8'; // Slate
      case 'confirmed': return '#60A5FA'; // Blue
      case 'checked_in': return '#FBBF24'; // Amber
      case 'in_progress': return '#A78BFA'; // Purple
      case 'completed': return '#34D399'; // Emerald
      case 'no_show': return '#F97316'; // Orange
      case 'cancelled': return '#F87171'; // Red
      default: return '#94A3B8';
    }
  };

  const getStatusTextColor = (st) => {
    switch (st) {
      case 'pending': return '#475569';
      case 'confirmed': return '#2563EB';
      case 'checked_in': return '#D97706';
      case 'in_progress': return '#7C3AED';
      case 'completed': return '#059669';
      case 'no_show': return '#EA580C';
      case 'cancelled': return '#DC2626';
      default: return '#64748B';
    }
  };

  const getStatusLabel = (st) => {
    switch (st) {
      case 'pending': return t('dashboard.status.pending', 'Chờ xác nhận');
      case 'confirmed': return t('dashboard.status.confirmed', 'Đã xác nhận');
      case 'checked_in': return t('dashboard.status.checked_in', 'Đã check-in');
      case 'in_progress': return t('dashboard.status.in_progress', 'Đang làm');
      case 'completed': return t('dashboard.status.completed', 'Hoàn thành');
      case 'no_show': return t('dashboard.status.no_show', 'Không đến');
      case 'cancelled': return t('dashboard.status.cancelled', 'Đã hủy');
      default: return t('appointments.status.initialized', 'Khởi tạo');
    }
  };

  const recordActivityLog = (action, details = '') => {
    const newLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      action,
      details,
      time: new Date().toISOString(),
      user: 'Lễ tân'
    };

    setForm(prev => {
      let currentLogs = [];
      if (typeof prev.logs === 'string') {
        try { currentLogs = JSON.parse(prev.logs); } catch(e) {}
      } else if (Array.isArray(prev.logs)) {
        currentLogs = prev.logs;
      }
      return { ...prev, logs: [newLog, ...(currentLogs || [])] };
    });

    return newLog;
  };

  const handleStatusChange = async (newStatus) => {
    const log = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      action: 'Thay đổi trạng thái',
      details: `Chuyển sang: ${getStatusLabel(newStatus)}`,
      time: new Date().toISOString(),
      user: 'Lễ tân'
    };

    let updatedLogs = [];
    setForm(prev => {
      let currentLogs = [];
      if (typeof prev.logs === 'string') {
        try { currentLogs = JSON.parse(prev.logs); } catch(e) {}
      } else if (Array.isArray(prev.logs)) {
        currentLogs = prev.logs;
      }
      updatedLogs = [log, ...(currentLogs || [])];
      return { ...prev, status: newStatus, logs: updatedLogs };
    });

    setIsStatusMenuOpen(false);
    toast.success(`Đã cập nhật trạng thái: ${getStatusLabel(newStatus)}`);

    if (editing && editing.id) {
      if (String(editing.id).startsWith('demo_')) {
        toast.info("Lịch hẹn mẫu (Demo) chỉ có thể cập nhật trạng thái bằng cách kéo thả bên ngoài.");
      } else {
        try {
          const res = await base44.entities.Appointment.update(editing.id, { 
            status: newStatus,
            logs: updatedLogs
          });
        } catch (e) {
          console.error('Lỗi cập nhật server:', e);
          toast.error('Lỗi cập nhật server: ' + (e.message || e));
        }
      }
      onSaved?.();
      onClose?.();
    }

    if (newStatus === 'completed') {
      triggerPOSCheckout();
    }
  };

  const getStatusMenuItems = (st) => {
    switch (st) {
      case 'pending':
        return [
          { key: 'confirmed', label: t('appointments.btn_confirm', 'Xác nhận'), dot: '#60A5FA' },
          { key: 'no_show', label: t('dashboard.status.no_show', 'Không đến'), dot: '#F97316' },
          { key: 'cancelled', label: t('appointments.btn_cancel', 'Hủy lịch'), dot: '#F87171' }
        ];
      case 'confirmed':
        return [
          { key: 'pending', label: t('dashboard.status.pending', 'Chờ xác nhận'), dot: '#94A3B8' },
          { key: 'checked_in', label: 'Check-in', dot: '#FBBF24' },
          { key: 'no_show', label: t('dashboard.status.no_show', 'Không đến'), dot: '#F97316' },
          { key: 'cancelled', label: t('appointments.btn_cancel', 'Hủy lịch'), dot: '#F87171' }
        ];
      case 'checked_in':
        return [
          { key: 'pending', label: t('dashboard.status.pending', 'Chờ xác nhận'), dot: '#94A3B8' },
          { key: 'confirmed', label: t('dashboard.status.confirmed', 'Đã xác nhận'), dot: '#60A5FA' },
          { key: 'in_progress', label: t('dashboard.status.in_progress', 'Đang làm'), dot: '#A78BFA' },
          { key: 'no_show', label: t('dashboard.status.no_show', 'Không đến'), dot: '#F97316' },
          { key: 'cancelled', label: t('appointments.btn_cancel', 'Hủy lịch'), dot: '#F87171' }
        ];
      case 'in_progress':
        return [
          { key: 'pending', label: t('dashboard.status.pending', 'Chờ xác nhận'), dot: '#94A3B8' },
          { key: 'confirmed', label: t('dashboard.status.confirmed', 'Đã xác nhận'), dot: '#60A5FA' },
          { key: 'checked_in', label: t('dashboard.status.checked_in', 'Đã check-in'), dot: '#FBBF24' },
          { key: 'no_show', label: t('dashboard.status.no_show', 'Không đến'), dot: '#F97316' },
          { key: 'cancelled', label: t('appointments.btn_cancel', 'Hủy lịch'), dot: '#F87171' }
        ];
      case 'completed':
        return [];
      case 'no_show':
        return [
          { key: 'pending', label: t('appointments.btn_reset', 'Đặt lại'), dot: '#94A3B8' },
          { key: 'cancelled', label: t('appointments.btn_cancel', 'Hủy lịch'), dot: '#F87171' }
        ];
      case 'cancelled':
        return [
          { key: 'pending', label: t('appointments.reset_pending', 'Đặt lại (Chờ xác nhận)'), dot: '#94A3B8' }
        ];
      default:
        return [];
    }
  };

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    start_time: '11:00',
    end_time: '12:15',
    guest_count: 1,
    source: 'reception',
    status: 'confirmed',
    promo_code: '',
    note: '',
    customer_id: '',
    customer_name: '',
    customer_phone: '',
    customer_email: ''
  });

  // Guests List (Khách #1, Khách #2...)
  const [guests, setGuests] = useState([
    {
      id: 1,
      name: 'Khách #1',
      items: [
        {
          service_id: '',
          service_name: '',
          price: 0,
          duration_minutes: 0,
          staff_id: '',
          staff_name: '',
          facility_id: '',
          facility_name: ''
        }
      ]
    }
  ]);

  const [saving, setSaving] = useState(false);
  const [deposit, setDeposit] = useState(null);

  useEffect(() => {
    if (!open || !editing?.id || String(editing.id).startsWith('demo_')) {
      setDeposit(null);
      return;
    }
    base44.entities.Deposit.filter({ appointment_id: editing.id }).then(res => {
      if (res && res.length > 0) setDeposit(res[0]);
      else setDeposit(null);
    });
  }, [open, editing]);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      base44.entities.Customer.list().catch(() => []),
      base44.entities.Service.filter({ is_active: true }).catch(() => []),
      base44.entities.Staff.list().catch(() => [])
    ]).then(([c, s, st]) => {
      setCustomers(c);
      setServices(s.filter((x) => !x.branch_id || x.branch_id === branchId || branchId === 'all' || !branchId));
      const activeStaff = st.filter((x) => 
        x.is_active !== false && 
        x.status !== 'inactive' && 
        (!x.branch_id || x.branch_id === branchId || branchId === 'all' || !branchId)
      );
      setStaff(activeStaff);
    });
  }, [open, branchId]);

  useEffect(() => {
    if (!open) return;

    if (editing) {
      setIsNewCustomer(!editing.customer_id && !!editing.customer_name);
      setVoucherInput(editing.promo_code || '');

      let parsedGuestCount = 1;
      let initialGuests = [];
      if (editing.services && editing.services.length) {
        const guestGroups = {};
        editing.services.forEach(s => {
          const guestMatch = (s.service_name || s.name || '').match(/\(Khách (\d+)\)/i);
          const guestNumber = guestMatch ? parseInt(guestMatch[1]) : 1;
          
          if (!guestGroups[guestNumber]) {
            guestGroups[guestNumber] = [];
            parsedGuestCount = Math.max(parsedGuestCount, guestNumber);
          }
          
          let cleanName = (s.service_name || s.name || '').replace(/\s*\(Khách \d+\)\s*/i, '');
          
          guestGroups[guestNumber].push({
            service_id: s.service_id || '',
            service_name: cleanName,
            price: s.price || 0,
            duration_minutes: s.duration_minutes || s.duration || 0,
            staff_id: s.staff_id || '',
            staff_name: s.staff_name || '',
            facility_id: s.facility_id || '',
            facility_name: s.facility_name || '',
            is_from_package: s.is_from_package || false,
            customer_package_id: s.customer_package_id || null,
            package_name: s.package_name || null
          });
        });

        for (let i = 1; i <= parsedGuestCount; i++) {
          initialGuests.push({
            id: i,
            name: `Khách #${i}`,
            items: guestGroups[i] || []
          });
        }
      } else {
        initialGuests = [{ id: 1, name: 'Khách #1', items: [] }];
      }
      
      setGuests(initialGuests);
      setForm({
        ...editing,
        date: editing.date || defaultDate || new Date().toISOString().slice(0, 10),
        start_time: editing.start_time || defaultStartTime || '11:00',
        guest_count: Math.max(editing.guest_count || 1, parsedGuestCount),
        promo_code: editing.promo_code || '',
        note: editing.note || ''
      });
    } else {
      setVoucherInput('');
      setForm({
        date: defaultDate || new Date().toISOString().slice(0, 10),
        start_time: defaultStartTime || '11:00',
        end_time: '12:00',
        guest_count: 1,
        source: 'reception',
        status: 'confirmed',
        facility_id: defaultFacilityId || '',
        facility_name: defaultFacilityName || '',
        customer_id: defaultCustomer?.id || '',
        customer_name: defaultCustomer?.name || '',
        customer_phone: defaultCustomer?.phone || '',
        customer_email: defaultCustomer?.email || '',
        promo_code: '',
        note: ''
      });
      setIsNewCustomer(false);

      setGuests([
        {
          id: 1,
          name: 'Khách #1',
          items: [
            {
              service_id: '',
              service_name: '',
              price: 0,
              duration_minutes: 0,
              staff_id: defaultStaffId && defaultStaffId !== '__unassigned' ? defaultStaffId : '',
              staff_name: defaultStaffName || '',
              facility_id: defaultFacilityId || '',
              facility_name: defaultFacilityName || ''
            }
          ]
        }
      ]);
    }
  }, [open, editing, defaultDate, defaultStartTime, defaultStaffId, defaultStaffName, defaultFacilityId, defaultFacilityName, defaultCustomer]);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleApplyVoucherInput = () => {
    if (!voucherInput.trim()) return toast.error('Vui lòng nhập mã Voucher');
    const code = voucherInput.trim().toUpperCase();
    setField('promo_code', code);
    toast.success(`Đã áp dụng mã Voucher: ${code}`);
  };

  // Update Guests Count Stepper
  const handleGuestCountChange = (delta) => {
    const newCount = Math.max(1, form.guest_count + delta);
    setField('guest_count', newCount);

    if (newCount > guests.length) {
      const newGuests = [...guests];
      for (let i = guests.length + 1; i <= newCount; i++) {
        newGuests.push({
          id: i,
          name: `Khách #${String(i).padStart(2, '0')}`,
          items: [
            {
              service_id: '',
              service_name: '',
              price: 0,
              duration_minutes: 0,
              staff_id: '',
              staff_name: '',
              facility_id: '',
              facility_name: ''
            }
          ]
        });
      }
      setGuests(newGuests);
    } else if (newCount < guests.length) {
      setGuests(guests.slice(0, newCount));
    }
  };

  // Add Service to specific Guest
  const handleAddServiceToGuest = (guestIdx) => {
    const updated = [...guests];
    updated[guestIdx].items.push({
      service_id: '',
      service_name: '',
      price: 0,
      duration_minutes: 0,
      staff_id: '',
      staff_name: '',
      facility_id: '',
      facility_name: ''
    });
    setGuests(updated);
  };

  // Remove Service from Guest
  const handleRemoveServiceFromGuest = (guestIdx, itemIdx) => {
    const updated = [...guests];
    if (updated[guestIdx].items.length <= 1) {
      toast.error('Mỗi khách phải có ít nhất 1 dịch vụ');
      return;
    }
    updated[guestIdx].items.splice(itemIdx, 1);
    setGuests(updated);
  };

  // Pick Service for Guest
  const handlePickService = (guestIdx, itemIdx, serviceId) => {
    const svc = services.find(s => s.id === serviceId);
    const updated = [...guests];
    if (!svc) {
      updated[guestIdx].items[itemIdx] = {
        ...updated[guestIdx].items[itemIdx],
        service_id: '',
        service_name: '',
        price: 0,
        duration_minutes: 0
      };
    } else {
      updated[guestIdx].items[itemIdx] = {
        ...updated[guestIdx].items[itemIdx],
        service_id: svc.id,
        service_name: svc.name,
        price: svc.price || 0,
        duration_minutes: Number(svc.duration_minutes || svc.duration || 30)
      };
    }
    setGuests(updated);
  };

  // Pick Staff for Guest Item
  const handlePickStaff = (guestIdx, itemIdx, staffId) => {
    const st = staff.find(s => s.id === staffId);
    const updated = [...guests];
    updated[guestIdx].items[itemIdx].staff_id = staffId;
    updated[guestIdx].items[itemIdx].staff_name = st?.full_name || st?.name || '';
    setGuests(updated);
  };

  // Pick Facility for Guest Item
  const handlePickFacility = (guestIdx, itemIdx, facilityId) => {
    const fac = facilityList.find(f => f.id === facilityId);
    const updated = [...guests];
    updated[guestIdx].items[itemIdx].facility_id = facilityId;
    updated[guestIdx].items[itemIdx].facility_name = fac?.name || '';
    setGuests(updated);
  };

  const handleApplyPackageItems = (selectedItems) => {
    const newItems = selectedItems.map(item => {
      const svc = services.find(s => s.name === item.name || s.id === item.id);
      return {
        service_id: svc?.id || item.id,
        service_name: item.name,
        price: 0,
        originalPrice: item.originalPrice || svc?.price || 0,
        duration_minutes: Number(svc?.duration_minutes || svc?.duration || 45),
        staff_id: '',
        staff_name: '',
        facility_id: '',
        facility_name: '',
        is_from_package: true,
        customer_package_id: item.customer_package_id,
        customer_treatment_id: item.customer_treatment_id || null,
        package_name: item.package_name
      };
    });

    const updated = [...guests];
    const existing = updated[0].items.filter(it => it.service_id || it.service_name);
    updated[0].items = [...existing, ...newItems];
    setGuests(updated);
    
    // Log activity
    const pNames = selectedItems.map(it => it.package_name).filter((v, i, a) => a.indexOf(v) === i).join(', ');
    recordActivityLog(t('common.apply', 'Áp dụng') + ' gói/liệu trình', `Đã áp dụng: ${pNames}`);

    setShowPackageUsageModal(false);
    toast.success('Đã áp dụng gói/liệu trình vào lịch hẹn (Giá 0đ)');
  };

  const handleRemovePackage = (packageId) => {
    const targetItem = guests[0]?.items?.find(it => 
      String(it.customer_package_id) === String(packageId) || 
      String(it.customer_treatment_id) === String(packageId)
    );
    const pName = targetItem?.package_name || 'Gói/Liệu trình';

    const updated = [...guests];
    updated[0].items = updated[0].items.filter(it => 
      String(it.customer_package_id) !== String(packageId) && 
      String(it.customer_treatment_id) !== String(packageId)
    );
    if (updated[0].items.length === 0) {
      updated[0].items.push({
        service_id: '',
        service_name: '',
        price: 0,
        duration_minutes: 0,
        staff_id: '',
        staff_name: '',
        facility_id: '',
        facility_name: ''
      });
    }
    setGuests(updated);

    // Log activity
    recordActivityLog('Xóa gói/liệu trình', `Đã loại bỏ: ${pName}`);

    toast.success('Đã loại bỏ gói/liệu trình khỏi lịch hẹn');
  };

  // Auto-Assign Staff Handler
  const handleAutoAssignStaff = () => {
    if (!staff || staff.length === 0) return toast.error('Chưa có nhân viên khả dụng');
    const updated = [...guests];
    let staffIdx = 0;
    updated.forEach(g => {
      g.items.forEach(it => {
        const assigned = staff[staffIdx % staff.length];
        it.staff_id = assigned.id;
        it.staff_name = assigned.full_name || assigned.name || 'Nhân viên';
        staffIdx++;
      });
    });
    setGuests(updated);
    toast.success('Đã tự động sắp xếp nhân viên cho tất cả khách');
  };

  // Calculations
  const allServiceItems = guests.flatMap(g => 
    g.items.map(it => {
      const suffix = `(Khách ${g.id})`;
      const hasSuffix = it.service_name?.includes(suffix);
      return {
        ...it,
        guestId: g.id,
        service_name: it.service_name + (guests.length > 1 && !hasSuffix ? ` ${suffix}` : '')
      };
    })
  );
  const totalPrice = allServiceItems.reduce((sum, it) => sum + (it.price || 0), 0);
  const totalMinutes = guests.reduce((maxGuestDuration, g) => {
    const guestDuration = g.items.reduce((sum, it) => sum + (it.duration_minutes || 0), 0);
    return Math.max(maxGuestDuration, guestDuration);
  }, 0);

  useEffect(() => {
    if (form.start_time) {
      setForm(prev => ({ ...prev, end_time: addMinutesToTime(prev.start_time, totalMinutes) }));
    }
  }, [form.start_time, totalMinutes]);

  const selectedCustomerObj = customers.find(c => c.id === form.customer_id);

  // Derive eligible promotions directly from selected customer details (gifts, tier, vouchers)
  const customerPromos = React.useMemo(() => {
    if (!form.customer_id && !form.customer_name) return [];
    
    const list = [];
    const customerId = selectedCustomerObj?.id || form.customer_id;

    // 1. Customer Gifts & Promotions from LocalStorage (glopro_customer_gifts) & Customer object
    try {
      if (typeof window !== 'undefined' && customerId) {
        const localGiftsRaw = localStorage.getItem('glopro_customer_gifts');
        const localGiftsMap = localGiftsRaw ? JSON.parse(localGiftsRaw) : {};
        const customerGifts = localGiftsMap[customerId] || selectedCustomerObj?.gifts || selectedCustomerObj?.promotions || [];
        
        if (Array.isArray(customerGifts)) {
          customerGifts.filter(g => !g.used).forEach(g => {
            const promoObj = PROMOTIONS.find(p => p.id === g.promo_id) || g;
            list.push({
              code: promoObj.code || promoObj.id || g.promo_id,
              name: `🎁 ${promoObj.name || 'Khuyến mãi quà tặng'}`,
              type: promoObj.valueType || promoObj.type || 'percent',
              value: promoObj.value || 10
            });
          });
        }
      }
    } catch (e) {
      console.error('Error parsing customer gifts:', e);
    }

    // 2. Customer Vouchers from Customer object
    if (selectedCustomerObj?.vouchers && Array.isArray(selectedCustomerObj.vouchers)) {
      selectedCustomerObj.vouchers.filter(v => !v.used).forEach(v => {
        list.push({
          code: v.code || v.id,
          name: `🏷️ ${v.name || v.code}`,
          type: v.valueType || v.type || 'fixed',
          value: v.value || 20000
        });
      });
    }

    // 3. Tier-based discounts from Customer detail profile
    const tierName = String(selectedCustomerObj?.tier || selectedCustomerObj?.customer_tier || (isNewCustomer ? 'Khách mới' : '')).toLowerCase();
    
    if (isNewCustomer || tierName.includes('mới') || tierName.includes('new')) {
      list.push({ code: 'KMNEW', name: '🎁 Khuyến Mãi Khách Mới - Giảm 15%', type: 'percent', value: 15 });
    } else if (tierName.includes('vip') || tierName.includes('kim cương') || tierName.includes('vàng') || (selectedCustomerObj?.total_spent || 0) >= 1000000) {
      list.push({ code: 'VIP10', name: '⭐ Tri Ân VIP - Giảm 10% Hóa Đơn', type: 'percent', value: 10 });
    }

    return list;
  }, [form.customer_id, form.customer_name, selectedCustomerObj, isNewCustomer]);

  // Promotion Discount Calculation
  let discountAmt = 0;
  if (form.promo_code) {
    const matchedPromo = customerPromos.find(p => p.code === form.promo_code);
    if (matchedPromo) {
      if (matchedPromo.type === 'percent') {
        discountAmt = Math.round((totalPrice * matchedPromo.value) / 100);
      } else {
        discountAmt = Math.min(totalPrice, matchedPromo.value);
      }
    } else if (form.promo_code === 'KMNEW') {
      discountAmt = Math.round((totalPrice * 15) / 100);
    } else if (form.promo_code === 'VIP10' || form.promo_code === 'GIAM10PCT') {
      discountAmt = Math.round((totalPrice * 10) / 100);
    } else if (form.promo_code === 'HE2026') {
      discountAmt = Math.round((totalPrice * 20) / 100);
    } else if (form.promo_code === 'GIAM20K') {
      discountAmt = 20000;
    }
  }
  const finalTotalPrice = Math.max(0, totalPrice - discountAmt);

  const handleSave = async (checkoutStatus = 'confirmed') => {
    if (isNewCustomer) {
      if (!form.customer_name?.trim()) return toast.error('Vui lòng nhập tên khách hàng');
    } else if (!form.customer_id && !form.customer_name) {
      return toast.error('Vui lòng chọn hoặc nhập tên khách hàng');
    }

    setSaving(true);
    try {
      const validItems = allServiceItems.filter(it => it.service_id || it.service_name);
      
      const guestTimes = {};
      const cascadedServices = validItems.map(it => {
        const guestMatch = it.service_name?.match(/\(Khách \d+\)/i);
        const guestKey = guestMatch ? guestMatch[0] : 'Khách 1';
        
        const dur = it.duration_minutes || it.duration || 60;
        const currentTime = guestTimes[guestKey] || form.start_time;
        
        // Helper inline
        const [cH, cM] = currentTime.split(':').map(Number);
        const endMins = (cH * 60) + cM + dur;
        const eH = Math.floor(endMins / 60);
        const eM = endMins % 60;
        const endTime = `${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`;

        guestTimes[guestKey] = endTime;

        return {
          ...it,
          staff_id: it.staff_id || '',
          staff_name: it.staff_id ? (it.staff_name || 'Nhân viên') : 'Chưa phân công',
          start_time: currentTime,
          end_time: endTime
        };
      });

      // Update parent end_time to be the maximum of all guest end times
      let maxEndTimeMins = 0;
      let maxEndTimeStr = form.start_time;
      cascadedServices.forEach(it => {
        const [h, m] = it.end_time.split(':').map(Number);
        const mins = h * 60 + m;
        if (mins > maxEndTimeMins) {
          maxEndTimeMins = mins;
          maxEndTimeStr = it.end_time;
        }
      });
      form.end_time = maxEndTimeStr;

      const firstItem = cascadedServices[0];
      const selectedStaffObj = staff.find(s => s.id === firstItem?.staff_id);
      const selectedFacObj = facilityList.find(f => f.id === firstItem?.facility_id);
      
      let updatedLogs = [];
      if (editing?.id) {
        let currentLogs = [];
        if (typeof form.logs === 'string') {
          try { currentLogs = JSON.parse(form.logs); } catch(e) {}
        } else if (Array.isArray(form.logs)) {
          currentLogs = form.logs;
        }
        
        const updateLog = {
          id: 'log_update_' + Date.now(),
          action: 'Cập nhật lịch hẹn',
          details: 'Thay đổi thông tin chung hoặc danh sách dịch vụ',
          time: new Date().toISOString(),
          user: 'Lễ tân'
        };
        updatedLogs = [updateLog, ...(currentLogs || [])];
      } else {
        updatedLogs = [{
          id: 'log_create_' + Date.now(),
          action: 'Tạo lịch hẹn',
          details: `Khởi tạo lịch hẹn cho khách hàng: ${form.customer_name || 'Khách vãng lai'}`,
          time: new Date().toISOString(),
          user: 'Lễ tân'
        }];
      }

      const payload = {
        // Only fields that exist in the 'appointment' Supabase table
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time || null,
        customer_id: form.customer_id || null,
        customer_name: form.customer_name || '',
        customer_phone: form.customer_phone || null,
        note: form.note || null,
        source: form.source || 'reception',
        branch_id: (branchId && branchId !== 'all') ? branchId : null,
        status: checkoutStatus,
        services: cascadedServices,
        service_id: firstItem?.service_id || null,
        service_name: cascadedServices.map(i => i.service_name).filter(Boolean).join(' + ') || 'Dịch vụ Salon',
        price: finalTotalPrice,
        staff_id: firstItem?.staff_id || null,
        staff_name: selectedStaffObj?.full_name || selectedStaffObj?.name || firstItem?.staff_name || 'Chưa phân công',
        logs: updatedLogs
      };

      if (editing?.id) {
        if (String(editing.id).startsWith('demo_')) {
          toast.success(t('appointments.toast_updated_preview', 'Đã cập nhật lịch hẹn (Bản xem trước)'));
        } else {
          await base44.entities.Appointment.update(editing.id, payload);
          toast.success(checkoutStatus === 'checked_in' ? t('appointments.toast_updated_checkin', 'Đã cập nhật & Check-in') : t('appointments.toast_updated_success', 'Đã cập nhật lịch hẹn'));
        }
      } else {
        await base44.entities.Appointment.create(payload);
        toast.success(checkoutStatus === 'checked_in' ? t('appointments.toast_created_checkin', 'Đã tạo lịch & Check-in thành công!') : t('appointments.toast_created_success', 'Đã tạo lịch hẹn thành công!'));
      }

      onSaved?.();
      onClose?.();
    } catch (e) {
      console.error('Appointment save error:', e);
      const detail = e?.message || e?.details || e?.hint || JSON.stringify(e);
      toast.error(t('appointments.toast_err_save_appt', 'Lỗi khi lưu lịch hẹn:') + ' ' + detail);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/40 backdrop-blur-xs font-sans text-slate-800 animate-in fade-in duration-200">
      <div 
        className={`relative bg-white w-full ${isFullScreen ? 'h-full max-w-full rounded-none' : 'max-w-5xl rounded-2xl max-h-[92vh]'} shadow-2xl flex flex-col overflow-hidden text-left border border-slate-200/80`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200/80 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {editing ? t('appt.modal.title_update', 'Cập nhật lịch hẹn') : t('appt.modal.title_create', 'Tạo lịch hẹn')}
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2]" />
            </button>
          </div>
        </div>

        {/* Modal Content Split Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80">
          {/* Left Column: Client Details (5 Cols) */}
          <div className="lg:col-span-5 p-6 space-y-5 bg-white">
            {/* Tab Switcher & Status Bar Container */}
            <div className="space-y-3">
              {/* Tab Switcher: {t('appt.modal.tab_general', 'Thông tin chung')} | {t('appt.modal.tab_activity', 'Nhật ký hoạt động')} */}
              <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setActiveTab('general')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'general' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t('appt.modal.tab_general', 'Thông tin chung')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('activity')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'activity' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t('appt.modal.tab_activity', 'Nhật ký hoạt động')}
                </button>
              </div>

              {/* Status Bar Card Container matching Image 1 & 2 */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3 relative font-sans">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getStatusDotColor(form.status) }} />
                  <span className="font-bold text-xs" style={{ color: getStatusTextColor(form.status) }}>
                    {getStatusLabel(form.status)}
                  </span>
                </div>

                <div className="flex items-center gap-2 relative" ref={statusMenuRef}>
                  {/* Primary Action Button */}
                  {form.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange('confirmed')}
                      className="px-3.5 py-1 rounded-lg border border-blue-500 text-blue-600 font-semibold text-xs hover:bg-blue-50 transition cursor-pointer"
                    >
                      Xác nhận
                    </button>
                  )}
                  {form.status === 'confirmed' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange('checked_in')}
                      className="px-3.5 py-1 rounded-lg border border-amber-500 text-amber-600 font-semibold text-xs hover:bg-amber-50 transition cursor-pointer"
                    >
                      Check-in
                    </button>
                  )}
                  {form.status === 'checked_in' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange('in_progress')}
                      className="px-3.5 py-1 rounded-lg border border-purple-500 text-purple-600 font-semibold text-xs hover:bg-purple-50 transition cursor-pointer"
                    >
                      Bắt đầu
                    </button>
                  )}
                  {form.status === 'in_progress' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange('completed')}
                      className="px-3.5 py-1 rounded-lg border border-emerald-500 text-emerald-600 font-semibold text-xs hover:bg-emerald-50 transition cursor-pointer"
                    >
                      Thanh toán
                    </button>
                  )}
                  {form.status === 'completed' && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose?.();
                        window.location.href = '/invoices';
                      }}
                      className="px-3.5 py-1 rounded-lg border border-emerald-500 text-emerald-600 font-semibold text-xs hover:bg-emerald-50 transition cursor-pointer"
                    >
                      Xem hóa đơn
                    </button>
                  )}
                  {form.status === 'no_show' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange('pending')}
                      className="px-3.5 py-1 rounded-lg border border-orange-500 text-orange-600 font-semibold text-xs hover:bg-orange-50 transition cursor-pointer"
                    >
                      Đặt lại
                    </button>
                  )}
                  {form.status === 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange('pending')}
                      className="px-3.5 py-1 rounded-lg border border-slate-500 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
                    >
                      Đặt lại
                    </button>
                  )}

                  {/* Three Dots Button */}
                  {getStatusMenuItems(form.status).length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                      title={t('appointments.status_options', 'Tùy chọn trạng thái')}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  )}

                  {/* Dropdown Menu Popup */}
                  {isStatusMenuOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl border border-slate-200/90 shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150 font-sans">
                      {getStatusMenuItems(form.status).map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleStatusChange(item.key)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer text-left"
                        >
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.dot }} />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {activeTab === 'general' ? (
              <>
                {/* Client Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      {t('appt.modal.customer_label', 'Khách hàng')}<span className="text-red-500 ml-0.5">*</span>
                    </label>
                  </div>

                  {form.customer_id || form.customer_name ? (
                    <>
                      {/* Selected Client Card */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3">
                        <div 
                          onClick={() => {
                            if (form.customer_id) {
                              onClose?.();
                              window.location.href = `/customers?id=${form.customer_id}`;
                            } else if (form.customer_name) {
                              onClose?.();
                              window.location.href = `/customers?search=${encodeURIComponent(form.customer_name)}`;
                            }
                          }}
                          className="flex items-center gap-3 truncate cursor-pointer group flex-1"
                          title={t('appointments.view_cust_details', 'Click để xem chi tiết khách hàng')}
                        >
                          <Avatar 
                            src={selectedCustomerObj?.avatar_url} 
                            name={form.customer_name || selectedCustomerObj?.name} 
                            size={40} 
                            color="#2563EB" 
                          />
                          <div className="truncate text-left flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-slate-900 group-hover:text-blue-600 group-hover:underline transition-colors truncate">
                                {form.customer_name || selectedCustomerObj?.name || 'Khách hàng'}
                              </span>
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                                {selectedCustomerObj?.tier || selectedCustomerObj?.customer_tier || 'Khách mới'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 truncate mt-0.5 font-normal">
                              {selectedCustomerObj?.email ? `${selectedCustomerObj.email} · ` : ''}{form.customer_phone || selectedCustomerObj?.phone || selectedCustomerObj?.mobile || 'Chưa có sđt'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (form.customer_id) {
                                onClose?.();
                                window.location.href = `/customers?id=${form.customer_id}`;
                              } else {
                                toast.info(`Khách hàng: ${form.customer_name}`);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title={t('appointments.view_cust_details', 'Click để xem chi tiết khách hàng')}
                          >
                            <Eye className="w-4 h-4 stroke-[1.8]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setField('customer_id', '');
                              setField('customer_name', '');
                              setField('customer_phone', '');
                              setIsNewCustomer(false);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title={t('common.unselect', 'Bỏ chọn')}
                          >
                            <X className="w-4 h-4 stroke-[1.8]" />
                          </button>
                        </div>
                      </div>
                      {form.customer_id && (
                        <button
                          type="button"
                          onClick={() => setShowPackageUsageModal(true)}
                          className="w-full mt-2 py-2.5 flex items-center justify-center gap-2 border border-emerald-600 hover:bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Package className="w-4 h-4 stroke-[1.8]" />
                          <span>{t('appt.modal.packages_owned', 'Gói & Liệu trình đã mua')}</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <CustomerPicker
                      customers={customers}
                      value={form.customer_id || ''}
                      onAddNew={(searchQuery) => {
                        setIsNewCustomer(true);
                        setField('customer_id', '');
                        if (searchQuery && typeof searchQuery === 'string') {
                          const qStr = searchQuery.trim();
                          const isPhone = /^[\d\s+\-().]+$/.test(qStr);
                          if (isPhone) {
                            setField('customer_phone', qStr);
                            setField('customer_name', '');
                          } else {
                            setField('customer_name', qStr);
                            setField('customer_phone', '');
                          }
                        }
                      }}
                      onChange={(id, name, phone) => {
                        if (id === 'new') {
                          setIsNewCustomer(true);
                          setField('customer_id', '');
                        } else {
                          setIsNewCustomer(false);
                          setField('customer_id', id);
                          setField('customer_name', name);
                          setField('customer_phone', phone || '');
                        }
                      }}
                    />
                  )}

                  {isNewCustomer && !form.customer_id && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <input
                        type="text"
                        placeholder={t('profile.fullname_label', 'Họ và tên') + ' *'}
                        value={form.customer_name || ''}
                        onChange={(e) => setField('customer_name', e.target.value)}
                        className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-normal text-slate-800 placeholder:text-slate-400 placeholder:font-normal bg-white outline-none focus:border-blue-500 transition-all"
                      />
                      <input
                        type="text"
                        placeholder={t('profile.phone_label', 'Số điện thoại')}
                        value={form.customer_phone || ''}
                        onChange={(e) => setField('customer_phone', e.target.value)}
                        className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-normal text-slate-800 placeholder:text-slate-400 placeholder:font-normal bg-white outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  )}
                </div>

                {/* Number of Guest Stepper */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    {t('appt.modal.guests_count', 'Số lượng khách')}<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <div className="flex items-center justify-between border border-slate-200/90 rounded-xl bg-white overflow-hidden shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleGuestCountChange(-1)}
                      className="w-10 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 font-bold text-base cursor-pointer border-r border-slate-200/80 transition-colors"
                    >
                      −
                    </button>
                    <span className="font-semibold text-slate-800 text-xs flex-1 text-center">{form.guest_count}</span>
                    <button
                      type="button"
                      onClick={() => handleGuestCountChange(1)}
                      className="w-10 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 font-bold text-base cursor-pointer border-l border-slate-200/80 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Availability Date & Time */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    {t('appt.modal.time_label', 'Thời gian hẹn')}<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <DateTimePickerPopover
                    dateValue={form.date}
                    timeValue={form.start_time}
                    onSelect={(d, t) => {
                      setField('date', d);
                      setField('start_time', t);
                    }}
                    t={t}
                  />
                  <div className="text-xs text-slate-500 mt-1 pl-1 font-medium">
                    {t('appt.modal.expected_end', 'Dự kiến kết thúc')}: <span className="font-semibold text-slate-700">{form.end_time || addMinutesToTime(form.start_time, totalMinutes)}</span> ({t('appointments.total', 'Tổng')}: {totalMinutes} {t('appointments.settings.minutes', 'phút')})
                  </div>
                </div>

                {/* Khuyến mãi & Voucher Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      {t('appt.modal.promo_label', 'Khuyến mãi & voucher')}
                    </label>
                    {form.promo_code && (
                      <button
                        type="button"
                        onClick={() => {
                          setField('promo_code', '');
                          setVoucherInput('');
                        }}
                        className="text-xs font-medium text-red-500 hover:text-red-700 hover:underline cursor-pointer"
                      >
                        Bỏ chọn
                      </button>
                    )}
                  </div>

                  {!form.customer_id && !form.customer_name ? (
                    <div className="w-full p-3.5 rounded-xl border border-slate-200/80 bg-white text-center text-slate-400 text-xs font-normal">
                      {t('appt.modal.no_promo', 'Chưa áp dụng mã khuyến mãi nào')}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* CTKM Dropdown Selector */}
                      <div className="relative">
                        <select
                          value={customerPromos.some(p => p.code === form.promo_code) ? form.promo_code : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setField('promo_code', val);
                            if (val) setVoucherInput('');
                          }}
                          className="w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 text-xs font-normal text-slate-800 outline-none focus:border-blue-500 appearance-none cursor-pointer truncate transition-all shadow-2xs"
                        >
                          <option value="">
                            {customerPromos.length > 0 
                              ? '— Chọn CTKM từ thông tin khách hàng —' 
                              : '— Khách hàng chưa có CTKM khả dụng —'
                            }
                          </option>
                          {customerPromos.map((p) => (
                            <option key={p.code} value={p.code}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[1.8]" />
                      </div>

                      {/* Dedicated Embedded Voucher Input Box */}
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          placeholder={t('appt.modal.voucher_placeholder', 'Hoặc nhập mã voucher...')}
                          value={voucherInput}
                          onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleApplyVoucherInput();
                            }
                          }}
                          className="w-full pl-3.5 pr-20 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-normal text-slate-800 outline-none focus:border-blue-500 placeholder:text-slate-400 placeholder:font-normal uppercase tracking-wide transition-all shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={handleApplyVoucherInput}
                          className="absolute right-1 top-1 bottom-1 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-all cursor-pointer shadow-2xs flex items-center justify-center"
                        >
                          Áp dụng
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Appointment Notes */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    {t('appt.modal.notes_label', 'Ghi chú lịch hẹn')}
                  </label>
                  <textarea
                    value={form.note || ''}
                    onChange={(e) => setField('note', e.target.value)}
                    placeholder={t('appt.modal.notes_placeholder', 'Nhập ghi chú...')}
                    rows={3}
                    className="w-full p-3.5 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-blue-500 placeholder:text-slate-400 placeholder:font-normal resize-none h-24 bg-white shadow-2xs transition-all"
                  />
                </div>
              </>
            ) : (
              /* Activity Log Timeline Section */
              <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[50vh]">
                {(() => {
                  let logs = [];
                  if (typeof form.logs === 'string') {
                    try { logs = JSON.parse(form.logs); } catch(e) {}
                  } else if (Array.isArray(form.logs)) {
                    logs = form.logs;
                  }
                  
                  if (!logs || logs.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        {t('appt.modal.no_activity_log', 'Chưa có nhật ký hoạt động nào cho lịch hẹn này')}
                      </div>
                    );
                  }
                  
                  return (
                    <div className="relative pl-4 border-l border-slate-100 space-y-4 text-left">
                      {logs.map((log, idx) => {
                        const logTime = new Date(log.time);
                        const timeStr = isNaN(logTime.getTime()) 
                          ? (log.time || '') 
                          : `${logTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${logTime.toLocaleDateString('vi-VN')}`;
                        
                        let displayAction = log.action;
                        let displayDetails = log.details;
                        if (displayAction === 'Thay đổi trạng thái') {
                          displayAction = t('appointments.activity.status_changed', 'Thay đổi trạng thái');
                        } else if (displayAction === 'Áp dụng gói/liệu trình' || displayAction?.includes('Áp dụng gói/liệu trình')) {
                          displayAction = t('appointments.activity.apply_package', 'Áp dụng gói/liệu trình');
                        } else if (displayAction === 'Xóa gói/liệu trình') {
                          displayAction = t('appointments.activity.remove_package', 'Xóa gói/liệu trình');
                        } else if (displayAction === 'Tạo lịch hẹn' || displayAction === 'Khởi tạo') {
                          displayAction = t('appt.modal.title_create', 'Tạo lịch hẹn');
                        }

                        if (displayDetails) {
                          if (displayDetails.startsWith('Chuyển sang: ')) {
                            const dest = displayDetails.replace('Chuyển sang: ', '').trim();
                            let translatedDest = dest;
                            if (dest === 'Chờ xác nhận') translatedDest = t('dashboard.status.pending', 'Chờ xác nhận');
                            else if (dest === 'Đã xác nhận') translatedDest = t('dashboard.status.confirmed', 'Đã xác nhận');
                            else if (dest === 'Đã check-in') translatedDest = t('dashboard.status.checked_in', 'Đã check-in');
                            else if (dest === 'Đang làm') translatedDest = t('dashboard.status.in_progress', 'Đang làm');
                            else if (dest === 'Hoàn thành') translatedDest = t('dashboard.status.completed', 'Hoàn thành');
                            else if (dest === 'Không đến') translatedDest = t('dashboard.status.no_show', 'Không đến');
                            else if (dest === 'Đã hủy') translatedDest = t('dashboard.status.cancelled', 'Đã hủy');
                            
                            displayDetails = t('appointments.activity.details_changed_to', 'Chuyển sang:') + ' ' + translatedDest;
                          } else if (displayDetails.startsWith('Đã áp dụng: ')) {
                            displayDetails = t('appointments.activity.details_applied', 'Đã áp dụng:') + ' ' + displayDetails.replace('Đã áp dụng: ', '');
                          } else if (displayDetails.startsWith('Đã loại bỏ: ')) {
                            displayDetails = t('appointments.activity.details_removed', 'Đã loại bỏ:') + ' ' + displayDetails.replace('Đã loại bỏ: ', '');
                          }
                        }

                        return (
                          <div key={log.id || idx} className="relative space-y-1">
                            {/* Dot indicator */}
                            <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white shadow-xs" />
                            
                            <div className="text-xs font-bold text-slate-800 flex items-center justify-between gap-2">
                              <span>{displayAction}</span>
                              <span className="text-[10px] font-normal text-slate-400 shrink-0">{timeStr}</span>
                            </div>
                            {displayDetails && (
                              <p className="text-[11px] text-slate-500 font-medium whitespace-pre-wrap">{displayDetails}</p>
                            )}
                            <div className="text-[10px] text-slate-400">{t('appointments.activity.performed_by', 'Thực hiện bởi')}: <span className="font-semibold text-slate-600">{log.user || t('nav.receptionist', 'Lễ tân')}</span></div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Right Column: Service & Guest Breakdown (7 Cols) */}
          <div className="lg:col-span-7 p-6 space-y-4 flex flex-col justify-between bg-white">
            <div className="space-y-4">
              {/* Service Header Controls */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-xs text-slate-700">
                  {t('appt.modal.service_label', 'Dịch vụ')}<span className="text-red-500 ml-0.5">*</span>
                </h3>

                <button
                  type="button"
                  onClick={handleAutoAssignStaff}
                  className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  <Wand2 className="w-3.5 h-3.5 stroke-[2]" /> {t('appt.modal.auto_assign_staff', 'Xếp nhân viên tự động')}
                </button>
              </div>

              {/* Guest Service Cards List */}
              <div className="space-y-5 max-h-[56vh] overflow-y-auto pr-1.5 py-1">
                {guests.map((g, gIdx) => {
                  const guestTotalMins = g.items.reduce((sum, it) => sum + (it.duration_minutes || 0), 0);
                  const guestTotalPrice = g.items.reduce((sum, it) => sum + (it.price || 0), 0);

                  return (
                    <div key={g.id} className="bg-slate-50/60 rounded-2xl p-5 md:p-6 border border-slate-200/90 shadow-2xs space-y-4 hover:border-slate-300 transition-all">
                      {/* Guest Card Header */}
                      <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                          <span className="font-semibold text-xs text-slate-900 tracking-tight">{g.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddServiceToGuest(gIdx)}
                          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                        >
                          <PlusCircle className="w-4 h-4 stroke-[2]" /> {t('appt.modal.add_service', 'Thêm dịch vụ')}
                        </button>
                      </div>

                      {/* Service Items Rows (1 Single Horizontal Line - Comfortable Gaps) */}
                      <div className="space-y-3.5">
                        {(() => {
                          if (gIdx === 0) {
                            const packageGroups = {};
                            const normalItems = [];
                            g.items.forEach((it, itemIdx) => {
                              const groupKey = it.customer_package_id || it.customer_treatment_id;
                              if (it.is_from_package && groupKey) {
                                if (!packageGroups[groupKey]) {
                                  packageGroups[groupKey] = { name: it.package_name, items: [] };
                                }
                                packageGroups[groupKey].items.push({ ...it, itemIdx });
                              } else {
                                normalItems.push({ ...it, itemIdx });
                              }
                            });

                            return (
                              <div className="space-y-4">
                                {/* Render Packages & Treatments */}
                                {Object.keys(packageGroups).map((packageId) => {
                                  const grp = packageGroups[packageId];
                                  const isTreatment = grp.items.some(it => it.customer_treatment_id);
                                  
                                  return (
                                    <div key={packageId} className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4 hover:border-slate-300 transition-all text-left">
                                      {/* Package Header */}
                                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                                        <div className="flex items-center gap-2">
                                          {isTreatment ? (
                                            <div className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center shrink-0">
                                              <Sparkles className="w-3.5 h-3.5 text-white fill-white" />
                                            </div>
                                          ) : (
                                            <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
                                              <Star className="w-3.5 h-3.5 text-white fill-white" />
                                            </div>
                                          )}
                                          <span className="font-bold text-xs text-slate-800">{grp.name}</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleRemovePackage(packageId)}
                                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                                          title={isTreatment ? "Xóa liệu trình" : "Xóa gói"}
                                        >
                                          <Trash2 className="w-4 h-4 stroke-[1.8]" />
                                        </button>
                                      </div>
                                    {/* Package Services */}
                                    <div className="space-y-3.5">
                                      {packageGroups[packageId].items.map((it) => (
                                        <div key={it.itemIdx} className="flex items-center gap-3 flex-nowrap w-full">
                                          {/* Service Name */}
                                          <div className="relative flex-1 min-w-[140px]">
                                            <select
                                              value={it.service_id || ''}
                                              disabled
                                              className="w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-200 text-xs font-normal text-slate-800 bg-slate-50 appearance-none truncate cursor-not-allowed transition-all shadow-2xs"
                                            >
                                              <option value={it.service_id}>{it.service_name}</option>
                                            </select>
                                          </div>
                                          {/* Staff Picker */}
                                          <StaffPickerDropdown
                                            staffList={staff}
                                            value={it.staff_id || ''}
                                            onChange={(staffId) => handlePickStaff(0, it.itemIdx, staffId)}
                                          />
                                          {/* Facility Select */}
                                          <div className="relative w-[130px] shrink-0">
                                            <select
                                              value={it.facility_id || ''}
                                              onChange={(e) => handlePickFacility(0, it.itemIdx, e.target.value)}
                                              className="w-full pl-3 pr-7 py-2.5 rounded-xl border border-slate-200 text-xs font-normal text-slate-700 bg-white hover:border-slate-300 focus:border-blue-500 appearance-none cursor-pointer truncate transition-all shadow-2xs"
                                            >
                                              <option value="">— {t('appointments.facility', 'Vị trí')} —</option>
                                              {facilityList.map(fac => (
                                                <option key={fac.id} value={fac.id}>{fac.name}</option>
                                              ))}
                                            </select>
                                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none stroke-[1.8]" />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )})}

                                {/* Render Normal Services */}
                                {normalItems.map((it) => (
                                  <div key={it.itemIdx} className="flex items-center gap-3 flex-nowrap w-full">
                                    <div className="relative flex-1 min-w-[140px]">
                                      <select
                                        value={it.service_id || ''}
                                        onChange={(e) => handlePickService(0, it.itemIdx, e.target.value)}
                                        className="w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-200 text-xs font-normal text-slate-800 bg-white hover:border-slate-300 focus:border-blue-500 appearance-none cursor-pointer truncate transition-all shadow-2xs"
                                      >
                                        <option value="">— {t('appt.modal.select_service', 'Chọn dịch vụ...')} —</option>
                                        {services.map(s => (
                                          <option key={s.id} value={s.id}>
                                            {s.name} ({s.duration_minutes || s.duration || 30} {t('appointments.settings.minutes', 'phút')})
                                          </option>
                                        ))}
                                      </select>
                                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[1.8]" />
                                    </div>
                                    <StaffPickerDropdown
                                      staffList={staff}
                                      value={it.staff_id || ''}
                                      onChange={(staffId) => handlePickStaff(0, it.itemIdx, staffId)}
                                      t={t}
                                    />
                                    <div className="relative w-[130px] shrink-0">
                                      <select
                                        value={it.facility_id || ''}
                                        onChange={(e) => handlePickFacility(0, it.itemIdx, e.target.value)}
                                        className="w-full pl-3 pr-7 py-2.5 rounded-xl border border-slate-200 text-xs font-normal text-slate-700 bg-white hover:border-slate-300 focus:border-blue-500 appearance-none cursor-pointer truncate transition-all shadow-2xs"
                                      >
                                        <option value="">— {t('appointments.facility', 'Vị trí')} —</option>
                                        {facilityList.map(fac => (
                                          <option key={fac.id} value={fac.id}>{fac.name}</option>
                                        ))}
                                      </select>
                                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none stroke-[1.8]" />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveServiceFromGuest(0, it.itemIdx)}
                                      className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                                      title="Xóa dịch vụ"
                                    >
                                      <Trash2 className="w-4 h-4 stroke-[1.8]" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            );
                          } else {
                            // Non Guest #1 - regular flat list
                            return g.items.map((it, itemIdx) => (
                              <div key={itemIdx} className="flex items-center gap-3 flex-nowrap w-full">
                                <div className="relative flex-1 min-w-[140px]">
                                  <select
                                    value={it.service_id || ''}
                                    onChange={(e) => handlePickService(gIdx, itemIdx, e.target.value)}
                                    className="w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-200 text-xs font-normal text-slate-800 bg-white hover:border-slate-300 focus:border-blue-500 appearance-none cursor-pointer truncate transition-all shadow-2xs"
                                  >
                                    <option value="">— {t('appt.modal.select_service', 'Chọn dịch vụ...')} —</option>
                                    {services.map(s => (
                                      <option key={s.id} value={s.id}>
                                        {s.name} ({s.duration_minutes || s.duration || 30} {t('appointments.settings.minutes', 'phút')})
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[1.8]" />
                                </div>
                                <StaffPickerDropdown
                                  staffList={staff}
                                  value={it.staff_id || ''}
                                  onChange={(staffId) => handlePickStaff(gIdx, itemIdx, staffId)}
                                  t={t}
                                />
                                <div className="relative w-[130px] shrink-0">
                                  <select
                                    value={it.facility_id || ''}
                                    onChange={(e) => handlePickFacility(gIdx, itemIdx, e.target.value)}
                                    className="w-full pl-3 pr-7 py-2.5 rounded-xl border border-slate-200 text-xs font-normal text-slate-700 bg-white hover:border-slate-300 focus:border-blue-500 appearance-none cursor-pointer truncate transition-all shadow-2xs"
                                  >
                                    <option value="">— {t('appointments.facility', 'Vị trí')} —</option>
                                    {facilityList.map(fac => (
                                      <option key={fac.id} value={fac.id}>{fac.name}</option>
                                    ))}
                                  </select>
                                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none stroke-[1.8]" />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveServiceFromGuest(gIdx, itemIdx)}
                                  className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                                  title="Xóa dịch vụ"
                                >
                                  <Trash2 className="w-4 h-4 stroke-[1.8]" />
                                </button>
                              </div>
                            ));
                          }
                        })()}
                      </div>

                      {/* Guest Card Footer Summary */}
                      <div className="flex items-center justify-between text-xs font-normal text-slate-500 pt-3 border-t border-slate-200/60">
                        <span>{g.items.length} {t('appt.modal.services_selected', 'dịch vụ được chọn')}</span>
                        <span className="font-normal text-slate-700">
                          {guestTotalMins} {t('appointments.settings.minutes', 'phút')} · <span className="font-bold text-slate-900">{formatVND(guestTotalPrice)}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Summary & Action Bar */}
        <div className="flex items-center justify-between px-8 py-4 border-t border-slate-200/80 bg-white shrink-0">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-slate-900">{t('appt.modal.total', 'Tổng cộng')}</span>
            <span className="text-xl font-bold text-slate-900">{formatVND(finalTotalPrice)}</span>
            {discountAmt > 0 && (
              <span className="text-xs font-normal text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                -{formatVND(discountAmt)}
              </span>
            )}
            {deposit && deposit.paid_amount > 0 && (
              <span className="text-xs font-normal text-pink-600 bg-pink-50 border border-pink-200/60 px-2 py-0.5 rounded-md flex items-center gap-1 ml-2">
                <PiggyBank className="w-3 h-3" />
                {t('appointments.deposit', 'Đã cọc')}: {formatVND(deposit.paid_amount)}
              </span>
            )}
            <span className="text-xs font-normal text-slate-500 ml-1">{totalMinutes} {t('appointments.settings.minutes', 'phút')}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSave('checked_in')}
              disabled={saving}
              className="px-7 py-3 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-600 font-medium text-xs transition-all cursor-pointer shadow-2xs active:scale-[0.98] disabled:opacity-50"
            >
              {editing ? t('appointments.update_checkin', 'Cập nhật & check-in') : t('appointments.create_checkin', 'Tạo & check-in')}
            </button>
            <button
              type="button"
              onClick={() => handleSave(editing ? (form.status || 'confirmed') : 'confirmed')}
              disabled={saving}
              className="px-9 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              {saving 
                ? (editing ? t('common.saving', 'Đang lưu...') : t('common.creating', 'Đang tạo...')) 
                : (editing ? t('appointments.save_changes', 'Lưu thay đổi') : t('appointments.create_appt', 'Tạo Lịch Hẹn'))
              }
            </button>
          </div>
        </div>
      </div>

      {/* Embedded POS Invoice Modal when checked out inside Appointment Modal */}
      {posModalOpen && (
        <POSInvoiceModal
          open={posModalOpen}
          customer={posCustomer}
          initialCart={posInitialCart}
          onClose={() => setPosModalOpen(false)}
          onSaved={() => {
            setPosModalOpen(false);
            onSaved?.();
            onClose?.();
          }}
        />
      )}

      {/* Package Usage Modal */}
      {showPackageUsageModal && (
        <PackageUsageModal
          customerId={form.customer_id}
          onClose={() => setShowPackageUsageModal(false)}
          onSelect={handleApplyPackageItems}
        />
      )}
    </div>
  );
}