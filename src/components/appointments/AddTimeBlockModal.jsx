import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Check, Search, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { CustomDatePickerPopover } from '@/components/appointments/AppointmentHeader';

export default function AddTimeBlockModal({ open, onClose, onSave, onSwitchToAppointment, staffList = [] }) {
  const [formData, setFormData] = useState({
    title: '',
    staff_id: '',
    date: new Date().toISOString().split('T')[0],
    fromTime: '12:00',
    toTime: '13:00',
    repeats: 'none', // none, daily, weekly, monthly
    ends: 'never', // never, on, after
    endDate: '',
    occurrences: 5
  });

  if (!open) return null;

  const [isStaffOpen, setIsStaffOpen] = useState(false);
  const [searchStaff, setSearchStaff] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isFromTimeOpen, setIsFromTimeOpen] = useState(false);
  const [isToTimeOpen, setIsToTimeOpen] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.staff-dropdown-modal-container')) {
        setIsStaffOpen(false);
      }
      if (!e.target.closest('.datepicker-modal-container')) {
        setIsDatePickerOpen(false);
      }
      if (!e.target.closest('.from-time-modal-container')) {
        setIsFromTimeOpen(false);
      }
      if (!e.target.closest('.to-time-modal-container')) {
        setIsToTimeOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const staffByGroup = staffList.reduce((acc, st) => {
    const role = (st.role || 'KHÁC').toUpperCase();
    if (!acc[role]) acc[role] = [];
    acc[role].push(st);
    return acc;
  }, {});

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return 'Chọn ngày';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreate = () => {
    onSave?.(formData);
  };

  const timeOptions = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hourStr = h.toString().padStart(2, '0');
      const minStr = m.toString().padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayHour = h % 12 === 0 ? 12 : h % 12;
      const displayHourStr = displayHour.toString().padStart(2, '0');
      timeOptions.push({
        value: `${hourStr}:${minStr}`,
        label: `${displayHourStr}:${minStr} ${ampm}`
      });
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center font-body" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs" />
      <div className="relative bg-white w-full mx-3 md:mx-0 md:max-w-md rounded-3xl p-6 shadow-2xl flex flex-col max-h-[82vh] md:max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800 font-sans flex items-center gap-2">
            Tạo Giờ Nghỉ <span className="text-xs font-normal text-slate-500">hoặc</span>
            <button 
              onClick={onSwitchToAppointment}
              className="text-sm font-bold text-slate-700 underline decoration-slate-300 hover:text-blue-500 hover:decoration-blue-400 transition-colors"
            >
              Tạo Lịch Hẹn
            </button>
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-3">
          {/* Title */}
          <div>
            <label className="block font-bold text-slate-500 mb-1 text-[11px]">Tiêu đề</label>
            <input 
              type="text" 
              placeholder="Nhập tiêu đề..."
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 text-slate-700 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Staff */}
            <div>
              <label className="block font-bold text-slate-500 mb-1 text-[11px]">Nhân viên</label>
              <div className="relative staff-dropdown-modal-container">
                <button
                  type="button"
                  onClick={() => {
                    setIsStaffOpen(!isStaffOpen);
                    setIsDatePickerOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <span className="truncate">
                    {formData.staff_id === 'all' 
                      ? 'Tất cả nhân viên' 
                      : (staffList.find(s => s.id === formData.staff_id)?.name || staffList.find(s => s.id === formData.staff_id)?.full_name || 'Chọn nhân viên...')}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {isStaffOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-[260px] bg-white rounded-xl border border-slate-200 shadow-xl z-[60] overflow-hidden flex flex-col max-h-[300px]">
                    <div className="bg-[#f8fafc] px-3 py-2.5 border-b border-slate-100/80">
                      <input
                        type="text"
                        placeholder="tìm kiếm nhân viên..."
                        value={searchStaff}
                        onChange={(e) => setSearchStaff(e.target.value)}
                        className="w-full bg-transparent text-xs font-normal outline-none text-slate-700 placeholder:text-slate-300 placeholder:font-light"
                      />
                    </div>
                    <div className="overflow-y-auto p-2 space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          handleChange('staff_id', 'all');
                          setIsStaffOpen(false);
                        }}
                        className="w-full flex items-center gap-3 text-left py-1.5 px-2 rounded-xl text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors"
                      >
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                          formData.staff_id === 'all'
                            ? 'border-orange-500 bg-orange-500 text-white'
                            : 'border-slate-300 bg-white'
                        }`}>
                          {formData.staff_id === 'all' && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span>Chọn tất cả</span>
                      </button>

                      {Object.entries(staffByGroup).map(([group, items]) => (
                        <div key={group} className="space-y-1 pt-1">
                          <div className="flex items-center gap-2 px-2 pt-1">
                            <div className="w-4 h-4 rounded-md border border-slate-300 bg-white shrink-0" />
                            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                              {group}
                            </span>
                          </div>
                          <div className="pl-6 space-y-0.5">
                            {items.filter(item => {
                              const name = (item.full_name || item.name || '').toLowerCase();
                              return name.includes(searchStaff.toLowerCase());
                            }).map((item) => {
                              const isSelected = formData.staff_id === item.id;
                              const name = item.full_name || item.name;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => {
                                    handleChange('staff_id', item.id);
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
                                    <Avatar src={item.avatar_url} name={name} size={20} color={item.avatar_color || '#3B82F6'} />
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
            </div>

            {/* Date */}
            <div>
              <label className="block font-bold text-slate-500 mb-1 text-[11px]">Ngày</label>
              <div className="relative datepicker-modal-container">
                <button
                  type="button"
                  onClick={() => {
                    setIsDatePickerOpen(!isDatePickerOpen);
                    setIsStaffOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <span className="truncate">{formatDateDisplay(formData.date)}</span>
                  <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
                {isDatePickerOpen && (
                  <CustomDatePickerPopover
                    selectedDate={formData.date}
                    onSelectDate={(iso) => {
                      handleChange('date', iso);
                      setIsDatePickerOpen(false);
                    }}
                    onClose={() => setIsDatePickerOpen(false)}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* From */}
            <div>
              <label className="block font-bold text-slate-500 mb-1 text-[11px]">Từ</label>
              <div className="relative from-time-modal-container">
                <button
                  type="button"
                  onClick={() => {
                    setIsFromTimeOpen(!isFromTimeOpen);
                    setIsToTimeOpen(false);
                    setIsStaffOpen(false);
                    setIsDatePickerOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <span className="truncate">
                    {timeOptions.find(t => t.value === formData.fromTime)?.label || 'Chọn giờ'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
                
                {isFromTimeOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-full bg-white rounded-xl border border-slate-200 shadow-xl z-[60] overflow-y-auto max-h-[200px] py-1 custom-scrollbar">
                    {timeOptions.map(t => {
                      const isSelected = formData.fromTime === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => {
                            handleChange('fromTime', t.value);
                            setIsFromTimeOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                            isSelected ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* To */}
            <div>
              <label className="block font-bold text-slate-500 mb-1 text-[11px]">Đến</label>
              <div className="relative to-time-modal-container">
                <button
                  type="button"
                  onClick={() => {
                    setIsToTimeOpen(!isToTimeOpen);
                    setIsFromTimeOpen(false);
                    setIsStaffOpen(false);
                    setIsDatePickerOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <span className="truncate">
                    {timeOptions.find(t => t.value === formData.toTime)?.label || 'Chọn giờ'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
                
                {isToTimeOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-full bg-white rounded-xl border border-slate-200 shadow-xl z-[60] overflow-y-auto max-h-[200px] py-1 custom-scrollbar">
                    {timeOptions.map(t => {
                      const isSelected = formData.toTime === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => {
                            handleChange('toTime', t.value);
                            setIsToTimeOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                            isSelected ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Repeats */}
          <div>
            <label className="block font-bold text-slate-500 mb-1 text-[11px]">Lặp lại</label>
            <div className="relative mb-2">
              <select 
                value={formData.repeats}
                onChange={(e) => handleChange('repeats', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 text-slate-700 bg-white appearance-none cursor-pointer"
              >
                <option value="none">Không lặp lại</option>
                <option value="daily">Mỗi ngày</option>
                <option value="weekly">Mỗi tuần</option>
                <option value="monthly">Mỗi tháng</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            {formData.repeats !== 'none' && (
              <div className="pl-3 border-l-2 border-slate-200 space-y-2 mt-2">
                <div>
                  <label className="block font-bold text-slate-500 mb-1 text-[11px]">Kết thúc</label>
                  <div className="relative">
                    <select 
                      value={formData.ends}
                      onChange={(e) => handleChange('ends', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 text-slate-700 bg-white appearance-none cursor-pointer"
                    >
                      <option value="never">Không bao giờ</option>
                      <option value="on">Vào ngày</option>
                      <option value="after">Sau số lần</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {formData.ends === 'on' && (
                  <div>
                    <input 
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleChange('endDate', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 text-slate-700 bg-white"
                    />
                  </div>
                )}

                {formData.ends === 'after' && (
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      min="1"
                      value={formData.occurrences}
                      onChange={(e) => handleChange('occurrences', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 text-slate-700 text-center bg-white"
                    />
                    <span className="text-[11px] font-bold text-slate-500">lần</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 pt-4 border-t border-slate-150/50 mt-4 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-200/50 hover:bg-slate-250 transition-colors font-bold text-xs text-slate-600 font-sans">
            Hủy
          </button>
          <button onClick={handleCreate} className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs shadow-sm transition-all font-sans">
            Tạo mới
          </button>
        </div>
      </div>
    </div>
  );
}
