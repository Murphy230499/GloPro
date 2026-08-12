'use client';

import React, { useState, useEffect } from 'react';
import { useT } from '@/lib/i18n';
import {
  List,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Plus,
  ChevronDown,
  Calendar as CalendarIcon,
  CalendarDays,
  Search,
  Check,
  Settings,
  Armchair
} from 'lucide-react';
import Avatar from '@/components/Avatar';

const DEFAULT_DEMO_SERVICES = [
  { id: 'srv_1', name: 'Gội đầu dưỡng sinh', category: 'GỘI ĐẦU' },
  { id: 'srv_2', name: 'Gội đầu thảo dược Spa', category: 'GỘI ĐẦU' },
  { id: 'srv_3', name: 'Nặn mụn chuẩn y khoa', category: 'SKINCARE' },
  { id: 'srv_4', name: 'Chăm sóc da mặt chuyên sâu', category: 'SKINCARE' },
  { id: 'srv_5', name: 'Full Press Set (2h)', category: 'NAIL' },
  { id: 'srv_6', name: 'Sơn Gel cao cấp', category: 'NAIL' },
  { id: 'srv_7', name: 'Cắt tóc Stylist', category: 'TÓC' },
  { id: 'srv_8', name: 'Uốn / Nhuộm Hàn Quốc', category: 'TÓC' }
];

const DEFAULT_DEMO_STAFF = [
  { id: 'st_1', full_name: 'Maria A.', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', role: 'KTV Chuyên nghiệp' },
  { id: 'st_2', full_name: 'Michelle M.', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', role: 'Nail Specialist' },
  { id: 'st_3', full_name: 'Minh P.', avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100', role: 'Chuyên gia Tóc' },
  { id: 'st_4', full_name: 'Ethan O.', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', role: 'Barber & Stylist' },
  { id: 'st_5', full_name: 'Rose H.', avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100', role: 'Spa Specialist' },
  { id: 'st_6', full_name: 'Jenie K.', avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100', role: 'Colorist' },
  { id: 'st_7', full_name: 'Nga H.', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', role: 'Stylist' }
];

export function CustomDatePickerPopover({ selectedDate, onSelectDate, onClose }) {
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

  // Calendar Grid Calculation
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays = [];

  // Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonthDate = new Date(year, month - 1, day);
    const iso = prevMonthDate.toISOString().split('T')[0];
    calendarDays.push({ day, iso, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const iso = `${year}-${mm}-${dd}`;
    calendarDays.push({ day: d, iso, isCurrentMonth: true });
  }

  // Next month leading days to complete grid (multiples of 7)
  const totalCells = Math.ceil(calendarDays.length / 7) * 7;
  const remaining = totalCells - calendarDays.length;
  for (let d = 1; d <= remaining; d++) {
    const nextMonthDate = new Date(year, month + 1, d);
    const iso = nextMonthDate.toISOString().split('T')[0];
    calendarDays.push({ day: d, iso, isCurrentMonth: false });
  }

  const selectedIso = selectedDate || todayISO;

  // Active week highlight logic
  const isHighlightedWeek = (iso) => {
    if (!iso) return false;
    const target = new Date(selectedIso);
    const current = new Date(iso);
    const diffTime = current - target;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= -3 && diffDays <= 3 && current.getMonth() === target.getMonth();
  };

  return (
    <div className="absolute top-full mt-2 right-0 w-[300px] bg-white rounded-xl border border-slate-200 shadow-2xl p-4 z-[60] animate-in fade-in zoom-in-95 duration-150 font-body">
      {/* Month Year Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          type="button"
          onClick={prevMonth}
          className="w-8 h-8 rounded-xl border border-slate-100 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95 shadow-2xs"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.2]" />
        </button>

        <div className="text-base font-bold text-slate-900 tracking-tight">
          {monthNames[month]} {year}
        </div>

        <button
          type="button"
          onClick={nextMonth}
          className="w-8 h-8 rounded-xl border border-slate-100 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95 shadow-2xs"
        >
          <ChevronRight className="w-4 h-4 stroke-[2.2]" />
        </button>
      </div>

      {/* Weekdays Header */}
      <div className="grid grid-cols-7 text-center mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <span key={d} className="text-xs font-semibold text-slate-400 py-1">
            {d}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {calendarDays.map((item, idx) => {
          const isSelected = item.iso === selectedIso;
          const isHighlight = !isSelected && item.isCurrentMonth && isHighlightedWeek(item.iso);

          let classNames = "h-9 rounded-2xl flex items-center justify-center cursor-pointer transition-all font-semibold ";

          if (isSelected) {
            classNames += "bg-blue-500 text-white font-bold shadow-sm scale-105 rounded-full";
          } else if (isHighlight) {
            classNames += "bg-blue-50 text-blue-900 font-bold hover:bg-blue-100 rounded-full";
          } else if (item.isCurrentMonth) {
            classNames += "text-slate-800 hover:bg-slate-100 font-medium rounded-full";
          } else {
            classNames += "text-slate-300 hover:bg-slate-50 font-normal rounded-full";
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

export default function AppointmentHeader({
  targetEntity = 'staff', // 'staff' | 'facility'
  setTargetEntity,
  viewMode = 'timeline', // 'timeline' | 'calendar' | 'list'
  setViewMode,
  selectedDate,
  setSelectedDate,
  selectedService,
  setSelectedService,
  selectedStaff,
  setSelectedStaff,
  servicesList = [],
  staffList = [],
  facilityList = [],
  onAddClick,
  onAddTimeBlockClick,
  onSettingsClick,
  onFacilityManagementClick
}) {
  const { t } = useT();
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [isStaffOpen, setIsStaffOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [searchService, setSearchService] = useState('');
  const [searchStaff, setSearchStaff] = useState('');

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.service-dropdown-container')) {
        setIsServiceOpen(false);
      }
      if (!e.target.closest('.staff-dropdown-container')) {
        setIsStaffOpen(false);
      }
      if (!e.target.closest('.datepicker-dropdown-container')) {
        setIsDatePickerOpen(false);
      }
      if (!e.target.closest('.add-menu-container')) {
        setIsAddMenuOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const todayISO = new Date().toISOString().split('T')[0];

  const handleDateShift = (days) => {
    const baseStr = selectedDate || todayISO;
    const parts = baseStr.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setSelectedDate?.(`${yyyy}-${mm}-${dd}`);
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr || dateStr === todayISO) return t('appointments.period.day', 'Hôm nay');
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Effective Source Data Arrays with Fallbacks
  const effectiveServices = (servicesList && servicesList.length > 0) ? servicesList : DEFAULT_DEMO_SERVICES;
  const effectiveStaffList = targetEntity === 'staff'
    ? ((staffList && staffList.length > 0) ? staffList : DEFAULT_DEMO_STAFF)
    : facilityList;

  // Selected Service Display Text
  const currentServiceObj = effectiveServices.find(s => (s.name || s.service_name || s) === selectedService);
  const serviceLabel = selectedService === 'all'
    ? t('appointments.select_service_applied', 'Chọn dịch vụ áp dụng')
    : (currentServiceObj?.name || currentServiceObj?.service_name || selectedService);

  // Selected Staff/Facility Display Object
  const currentStaffObj = targetEntity === 'staff'
    ? effectiveStaffList.find(st => st.id === selectedStaff)
    : effectiveStaffList.find(f => f.id === selectedStaff);

  const staffLabel = selectedStaff === 'all'
    ? (targetEntity === 'staff' ? t('appointments.select_staff_applied', 'Chọn nhân viên áp dụng') : t('appointments.select_facility_applied', 'Chọn vị trí áp dụng'))
    : (currentStaffObj?.full_name || currentStaffObj?.name || currentStaffObj?.staff_name || selectedStaff);

  // Filtered Services List
  const filteredServices = effectiveServices.filter(s => {
    const name = typeof s === 'string' ? s : (s.name || s.service_name || '');
    return name.toLowerCase().includes(searchService.toLowerCase());
  });

  // Filtered Staffs / Facilities List
  const filteredStaffList = targetEntity === 'staff'
    ? effectiveStaffList.filter(st => (st.full_name || st.name || st.staff_name || '').toLowerCase().includes(searchStaff.toLowerCase()))
    : effectiveStaffList.filter(f => (f.name || f.facility_name || '').toLowerCase().includes(searchStaff.toLowerCase()));

  // Group Services by Category
  const servicesByCategory = filteredServices.reduce((acc, s) => {
    const sName = typeof s === 'string' ? s : (s.name || s.service_name || s);
    const cat = (typeof s === 'object' && (s.category || s.group))
      ? (s.category || s.group).toUpperCase()
      : (sName.toLowerCase().includes('gội') ? 'GỘI ĐẦU' : sName.toLowerCase().includes('da') || sName.toLowerCase().includes('mụn') ? 'SKINCARE' : 'DỊCH VỤ CHÍNH');
    (acc[cat] = acc[cat] || []).push(s);
    return acc;
  }, {});

  // Group Staff / Facility by Role / Category
  const staffByGroup = filteredStaffList.reduce((acc, item) => {
    const grp = (item.role || item.category || (targetEntity === 'staff' ? 'NHÂN VIÊN CHUYÊN MÔN' : 'KHU VỰC DỊCH VỤ')).toUpperCase();
    (acc[grp] = acc[grp] || []).push(item);
    return acc;
  }, {});

  return (
    <div className="relative z-50 bg-white p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs font-body mb-2 sm:mb-4 overflow-visible">
      {/* Responsive Horizontal Container without Overflow Clipping */}
      <div className="flex flex-wrap xl:flex-nowrap items-center gap-2 sm:gap-3 overflow-visible w-full">
        {/* Left Side Items */}
          {/* Target Entity Switcher: Nhân viên | Vị trí */}
          <div className="bg-slate-100 p-0.5 sm:p-1 rounded-lg flex items-center justify-between gap-1 border border-slate-200/60 shrink-0 w-auto order-2 xl:order-1">
            <button
              onClick={() => {
                setTargetEntity?.('staff');
                setSelectedStaff?.('all');
              }}
              className={`flex-1 sm:flex-none justify-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
                targetEntity === 'staff'
                  ? 'bg-blue-500 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('nav.staff', 'Nhân viên')}
            </button>
            <button
              onClick={() => {
                setTargetEntity?.('facility');
                setSelectedStaff?.('all');
              }}
              className={`flex-1 sm:flex-none justify-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
                targetEntity === 'facility'
                  ? 'bg-blue-500 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('appointments.facility', 'Vị trí')}
            </button>
          </div>



          {/* Custom Services Dropdown */}
          <div className="relative shrink-0 service-dropdown-container hidden sm:block w-[calc(50%-4px)] sm:w-auto order-4 sm:order-3">
            <button
              type="button"
              onClick={() => {
                setIsServiceOpen(!isServiceOpen);
                setIsStaffOpen(false);
                setIsDatePickerOpen(false);
              }}
              className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg border text-xs font-medium transition-all shadow-2xs cursor-pointer ${
                isServiceOpen || selectedService !== 'all'
                  ? 'border-orange-500 ring-2 ring-orange-500/10 bg-white text-slate-800 font-semibold'
                  : 'border-slate-300 bg-white text-slate-500 font-normal hover:border-slate-400'
              }`}
            >
              <span className={`truncate ${selectedService === 'all' ? 'text-slate-500 font-normal' : 'text-slate-800 font-semibold'}`}>{serviceLabel}</span>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {isServiceOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-xl border border-slate-200 shadow-2xl z-[60] flex flex-col max-h-80 overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-body">
                {/* Search Header Bar */}
                <div className="bg-[#f8fafc] px-4 py-3 border-b border-slate-100/80">
                  <input
                    type="text"
                    placeholder={t('catalog.search_service_placeholder', 'tìm kiếm dịch vụ...')}
                    value={searchService}
                    onChange={(e) => setSearchService(e.target.value)}
                    className="w-full bg-transparent text-xs font-normal outline-none text-slate-700 placeholder:text-slate-300 placeholder:font-light"
                  />
                </div>

                {/* Service List Items */}
                <div className="overflow-y-auto p-3 space-y-2">
                  {/* Select All Item */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedService?.('all');
                      setIsServiceOpen(false);
                    }}
                    className="w-full flex items-center gap-3 text-left py-1.5 px-2 rounded-xl text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors"
                  >
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                      selectedService === 'all'
                        ? 'border-orange-500 bg-orange-500 text-white'
                        : 'border-slate-300 bg-white'
                    }`}>
                      {selectedService === 'all' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span>{t('common.select_all', 'Chọn tất cả')}</span>
                  </button>

                  {/* Grouped Categories & Items */}
                  {Object.entries(servicesByCategory).map(([category, items]) => (
                    <div key={category} className="space-y-1 pt-1">
                      {/* Group Header */}
                      <div className="flex items-center gap-2 px-2 pt-1">
                        <div className="w-4 h-4 rounded-md border border-slate-300 bg-white shrink-0" />
                        <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                          {category}
                        </span>
                      </div>

                      {/* Sub Items */}
                      <div className="pl-6 space-y-0.5">
                        {items.map((s, idx) => {
                          const sName = typeof s === 'string' ? s : (s.name || s.service_name || s);
                          const isSelected = selectedService === sName;
                          return (
                            <button
                              key={s.id || idx}
                              type="button"
                              onClick={() => {
                                setSelectedService?.(sName);
                                setIsServiceOpen(false);
                              }}
                              className="w-full flex items-center gap-3 text-left py-1.5 px-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'border-orange-500 bg-orange-500 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span className="truncate">{sName}</span>
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

          {/* Custom Staffs / Facilities Dropdown */}
          <div className="relative shrink-0 staff-dropdown-container hidden sm:block w-[calc(50%-4px)] sm:w-auto order-3 sm:order-4">
            <button
              type="button"
              onClick={() => {
                setIsStaffOpen(!isStaffOpen);
                setIsServiceOpen(false);
                setIsDatePickerOpen(false);
              }}
              className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg border text-xs font-medium transition-all shadow-2xs cursor-pointer ${
                isStaffOpen || selectedStaff !== 'all'
                  ? 'border-orange-500 ring-2 ring-orange-500/10 bg-white text-slate-800 font-semibold'
                  : 'border-slate-300 bg-white text-slate-500 font-normal hover:border-slate-400'
              }`}
            >
              <div className="flex items-center gap-2 max-w-[120px] sm:max-w-[180px] truncate">
                {targetEntity === 'staff' && currentStaffObj && selectedStaff !== 'all' && (
                  <Avatar
                    src={currentStaffObj.avatar_url}
                    name={currentStaffObj.full_name || currentStaffObj.name}
                    size={20}
                    color={currentStaffObj.avatar_color || '#3B82F6'}
                  />
                )}
                <span className={`truncate ${selectedStaff === 'all' ? 'text-slate-500 font-normal' : 'text-slate-800 font-semibold'}`}>{staffLabel}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {isStaffOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-xl border border-slate-200 shadow-2xl z-[60] flex flex-col max-h-80 overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-body">
                {/* Search Header Bar */}
                <div className="bg-[#f8fafc] px-4 py-3 border-b border-slate-100/80">
                  <input
                    type="text"
                    placeholder={targetEntity === 'staff' ? t('appointments.search_staff_placeholder', 'tìm kiếm nhân viên...') : t('appointments.search_facility_placeholder', 'tìm kiếm vị trí...')}
                    value={searchStaff}
                    onChange={(e) => setSearchStaff(e.target.value)}
                    className="w-full bg-transparent text-xs font-normal outline-none text-slate-700 placeholder:text-slate-300 placeholder:font-light"
                  />
                </div>

                {/* Staff List Items */}
                <div className="overflow-y-auto p-3 space-y-2">
                  {/* Select All Item */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStaff?.('all');
                      setIsStaffOpen(false);
                    }}
                    className="w-full flex items-center gap-3 text-left py-1.5 px-2 rounded-xl text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors"
                  >
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                      selectedStaff === 'all'
                        ? 'border-orange-500 bg-orange-500 text-white'
                        : 'border-slate-300 bg-white'
                    }`}>
                      {selectedStaff === 'all' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span>{t('common.select_all', 'Chọn tất cả')}</span>
                  </button>

                  {/* Grouped Roles / Categories */}
                  {Object.entries(staffByGroup).map(([group, items]) => (
                    <div key={group} className="space-y-1 pt-1">
                      {/* Group Header */}
                      <div className="flex items-center gap-2 px-2 pt-1">
                        <div className="w-4 h-4 rounded-md border border-slate-300 bg-white shrink-0" />
                        <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                          {group}
                        </span>
                      </div>

                      {/* Sub Items */}
                      <div className="pl-6 space-y-0.5">
                        {items.map((item) => {
                          const isSelected = selectedStaff === item.id;
                          const name = item.full_name || item.name || item.staff_name;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setSelectedStaff?.(item.id);
                                setIsStaffOpen(false);
                              }}
                              className="w-full flex items-center gap-3 text-left py-1.5 px-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'border-orange-500 bg-orange-500 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <div className="flex items-center gap-2 truncate">
                                {targetEntity === 'staff' ? (
                                  <Avatar src={item.avatar_url} name={name} size={20} color={item.avatar_color || '#3B82F6'} />
                                ) : (
                                  <span className="w-4 h-4 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                    {item.icon || '📍'}
                                  </span>
                                )}
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

          {/* Custom Date Picker Navigation Segmented Pill */}
          <div className="relative flex items-center justify-between bg-white rounded-lg border border-slate-300 shadow-2xs divide-x divide-slate-200 font-body shrink-0 datepicker-dropdown-container w-full xl:w-auto order-1 xl:order-5">
            {/* Left Arrow Button: Previous Day */}
            <button
              type="button"
              onClick={() => handleDateShift(-1)}
              title={t('appointments.prev_day', 'Ngày trước')}
              className="px-2.5 py-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors flex items-center justify-center active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 stroke-[1.5]" />
            </button>

            {/* Center Label: Date Display */}
            <button
              type="button"
              onClick={() => {
                setIsDatePickerOpen(!isDatePickerOpen);
                setIsStaffOpen(false);
                setIsServiceOpen(false);
              }}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 hover:bg-slate-50 transition-colors cursor-pointer ${
                isDatePickerOpen ? 'bg-slate-50 text-blue-600 font-semibold' : 'text-slate-700 font-medium'
              }`}
            >
              <CalendarDays className={`w-4 h-4 ${isDatePickerOpen ? 'text-blue-500' : 'text-slate-400'}`} />
              <span className="text-xs whitespace-nowrap">{formatDateDisplay(selectedDate)}</span>
            </button>

            {/* Right Arrow Button: Next Day */}
            <button
              type="button"
              onClick={() => handleDateShift(1)}
              title={t('appointments.next_day', 'Ngày sau')}
              className="px-2.5 py-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors flex items-center justify-center active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 stroke-[1.5]" />
            </button>

            {/* Custom DatePicker Popover Popup matching design */}
            {isDatePickerOpen && (
              <CustomDatePickerPopover
                selectedDate={selectedDate}
                onSelectDate={(iso) => setSelectedDate?.(iso)}
                onClose={() => setIsDatePickerOpen(false)}
              />
            )}
        {/* Right Side Items */}
          {/* Sub-view Mode Icons: Timeline | Calendar | List */}
          <div className="bg-slate-100 p-0.5 sm:p-1 rounded-lg flex items-center justify-center gap-0.5 sm:gap-1 border border-slate-200/60 shrink-0 order-3 xl:order-5 xl:ml-auto">
            <button
              onClick={() => setViewMode?.('timeline')}
              title={t('appointments.timeline_view', 'Dòng thời gian (Timeline)')}
              className={`p-1 sm:p-1.5 rounded-lg transition-all ${
                viewMode === 'timeline'
                  ? 'bg-blue-500 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={() => setViewMode?.('calendar')}
              title={t('appointments.calendar_view', 'Lịch dạng lưới (Calendar Grid)')}
              className={`p-1 sm:p-1.5 rounded-lg transition-all ${
                viewMode === 'calendar'
                  ? 'bg-blue-500 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={() => setViewMode?.('list')}
              title={t('appointments.list_view', 'Danh sách (List)')}
              className={`p-1 sm:p-1.5 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-1.5 sm:gap-2 ml-auto xl:ml-0 order-4 xl:order-6 shrink-0">
            <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={onFacilityManagementClick}
              className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg sm:rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-2xs"
              title={t('appointments.facility_mgmt', 'Quản lý vị trí (ghế/giường)')}
            >
              <Armchair className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
            </button>
            
            <button
              type="button"
              onClick={onSettingsClick}
              className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg sm:rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-2xs"
              title={t('appointments.settings_title', 'Cài đặt lịch hẹn')}
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
            </button>
          </div>
          <div className="relative add-menu-container ml-auto sm:ml-0">
            <div className="flex items-stretch bg-blue-500 hover:bg-blue-600 text-white rounded-lg sm:rounded-xl shadow-2xs transition-all active:scale-95 group">
              <button
                onClick={onAddClick}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold whitespace-nowrap border-r border-blue-400/30"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                <span className="hidden sm:inline">{t('appointments.create_appt', 'Tạo Lịch Hẹn')}</span>
                <span className="sm:hidden">{t('common.add', 'Thêm')}</span>
              </button>
              <button
                onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                className="px-1.5 sm:px-2 py-1.5 sm:py-2 flex items-center justify-center rounded-r-lg sm:rounded-r-xl"
              >
                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>

            {isAddMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-[100] overflow-hidden py-1">
                <button
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    onAddClick?.();
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-500 transition-colors"
                >
                  {t('appointments.create_appt', 'Tạo Lịch Hẹn')}
                </button>
                <button
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    onAddTimeBlockClick?.();
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-500 transition-colors"
                >
                  {t('appointments.create_break', 'Tạo Giờ Nghỉ')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
