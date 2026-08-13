'use client';

import React, { useState, useEffect, useRef } from 'react';
import Avatar from '@/components/Avatar';
import { useT } from '@/lib/i18n';
import { TIMELINE_SLOTS, timeStringToMinutes, getAppointmentTimes, DEFAULT_FACILITIES } from './constants';
import { formatVND } from '@/lib/format';
import { Clock, Edit3, Trash2, X } from 'lucide-react';

export default function AppointmentCalendarView({
  targetEntity = 'staff', // 'staff' | 'facility'
  appointments = [],
  staffList = [],
  facilityList = DEFAULT_FACILITIES,
  selectedStaff = 'all',
  onUpdateStatus,
  onDeleteAppt,
  onApptClick,
  onSlotClick,
  onApptDrop
}) {
  const { t } = useT();

  const [currentTime, setCurrentTime] = useState('09:48');
  const [currentMinutes, setCurrentMinutes] = useState(588);
  const [hoveredAppt, setHoveredAppt] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const hoverTimeoutRef = useRef(null);

  const headerScrollRef = useRef(null);
  const bodyScrollRef = useRef(null);

  const handleBodyScroll = () => {
    if (headerScrollRef.current && bodyScrollRef.current) {
      headerScrollRef.current.scrollLeft = bodyScrollRef.current.scrollLeft;
    }
  };

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const hrs = now.getHours();
      const mins = now.getMinutes();
      const tot = hrs * 60 + mins;
      setCurrentMinutes(tot);

      const hh = String(hrs).padStart(2, '0');
      const mm = String(mins).padStart(2, '0');
      setCurrentTime(`${hh}:${mm}`);
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleCardMouseEnter = (e, appt) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    let bottom = window.innerHeight - rect.top + 8;
    let left = rect.left + rect.width / 2 - 170;
    if (left < 10) left = 10;
    if (left + 340 > window.innerWidth) left = window.innerWidth - 350;

    setPopoverPos({ bottom, left });
    setHoveredAppt(appt);
  };

  const handleCardMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredAppt(null);
    }, 200);
  };

  const handlePopoverMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  const handlePopoverMouseLeave = () => {
    setHoveredAppt(null);
  };

  const sampleStaffColumns = [
    { id: 'st_john', name: 'John B.', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
    { id: 'st_maria', name: 'Maria A.', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
    { id: 'st_michelle', name: 'Michelle M.', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
    { id: 'st_minh', name: 'Minh P.', avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100' },
    { id: 'st_lisa', name: 'Lisa O.', avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100' },
    { id: 'st_nga', name: 'Nga H.', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
    { id: 'st_jenie', name: 'Jenie K.', avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100' },
    { id: 'st_rose', name: 'Rose H.', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' }
  ];

  let rawColumns = targetEntity === 'staff'
    ? [
        { id: '__unassigned', name: t('appointments.unassigned', 'Chưa phân công'), avatar_url: null },
        ...(staffList.length ? staffList.map(s => ({ id: s.id, name: s.full_name || s.name, avatar_url: s.avatar_url })) : sampleStaffColumns.filter(c => c.id !== '__unassigned'))
      ]
    : facilityList.map(f => ({ id: f.id, name: f.name, icon: f.icon || '📍' }));

  if (selectedStaff && selectedStaff !== 'all') {
    rawColumns = rawColumns.filter(c => 
      c.id === selectedStaff || 
      (c.name && c.name.toLowerCase().includes(selectedStaff.toLowerCase())) ||
      (selectedStaff.toLowerCase().includes((c.name || '').toLowerCase()))
    );
  }

  const columns = rawColumns;

  const START_MINS = 0; // 00:00
  const TOTAL_MINS = 1440; // 24 hours (00:00 - 24:00)
  const MINUTE_HEIGHT_PX = 1.8;
  const TOTAL_GRID_HEIGHT_PX = TOTAL_MINS * MINUTE_HEIGHT_PX;

  useEffect(() => {
    if (bodyScrollRef.current) {
      const now = new Date();
      const actualMinutes = now.getHours() * 60 + now.getMinutes();
      const initialScrollMins = Math.max(0, actualMinutes - 30);
      bodyScrollRef.current.scrollTop = initialScrollMins * MINUTE_HEIGHT_PX;
    }
  }, []);

  const currentLineTopPx = Math.max(0, (currentMinutes - START_MINS) * MINUTE_HEIGHT_PX);

  const getCardStyleByStatus = (status, isBreak) => {
    if (isBreak || status === 'break' || status === 'maintenance') {
      return {
        bg: 'bg-[#f8fafc] border-l-4 border-l-slate-400 border-y border-r border-slate-200 text-slate-700',
        striped: true,
        label: 'Blocktime / Nghỉ'
      };
    }
    switch (status) {
      case 'confirmed':
        return {
          bg: 'bg-[#f0fdf4] border-l-4 border-l-emerald-500 border-y border-r border-emerald-200/80 text-emerald-900',
          label: 'Confirmed'
        };
      case 'checked_in':
      case 'in_progress':
        return {
          bg: 'bg-[#eff6ff] border-l-4 border-l-blue-500 border-y border-r border-blue-200/80 text-blue-900',
          label: 'Checked in'
        };
      case 'completed':
        return {
          bg: 'bg-[#f8fafc] border-l-4 border-l-slate-500 border-y border-r border-slate-200 text-slate-800',
          label: 'Completed'
        };
      case 'no_show':
        return {
          bg: 'bg-orange-50 border-l-4 border-l-orange-500 border-y border-r border-orange-200/80 text-orange-900',
          label: 'Không đến'
        };
      case 'cancelled':
        return {
          bg: 'bg-[#fff1f2] border-l-4 border-l-rose-500 border-y border-r border-rose-200/80 text-rose-900',
          label: 'Đã hủy'
        };
      case 'pending':
      case 'booked':
      default:
        return {
          bg: 'bg-[#fff7ed] border-l-4 border-l-amber-500 border-y border-r border-amber-200/80 text-amber-900',
          label: 'Booked'
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs font-body flex-1 min-h-0 flex flex-col overflow-hidden relative">

      {/* ── Fixed Column Headers (scroll-synced with body) ── */}
      <div className="shrink-0 border-b border-slate-200 shadow-2xs bg-white rounded-t-2xl overflow-hidden z-20 flex">
        {/* Top-Left Frozen Corner Cell ("Giờ") */}
        <div className="w-20 shrink-0 p-3 border-r border-slate-200 bg-slate-50/90 font-bold text-xs text-slate-500 flex items-center justify-center z-30">
          Giờ
        </div>

        {/* Scrollable Staff Column Headers */}
        <div
          ref={headerScrollRef}
          className="flex-1 overflow-x-hidden"
        >
          <div className="flex">
            {columns.map((col) => (
              <div
                key={col.id}
                className="flex-1 min-w-[150px] shrink-0 border-r border-slate-200 py-3 px-2 text-center bg-slate-50/50 flex flex-col items-center gap-1.5"
              >
                {targetEntity === 'staff' ? (
                  <Avatar src={col.avatar_url} name={col.name} size={36} color="#3B82F6" />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                    {col.icon || '📍'}
                  </div>
                )}
                <span className="text-xs font-bold text-slate-800 truncate max-w-full">
                  {col.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Scrollable Body (both x and y) ── */}
      <div
        ref={bodyScrollRef}
        className="overflow-auto flex-1 min-h-0 pb-24 md:pb-0"
        onScroll={handleBodyScroll}
      >
        <div className="flex relative min-w-[1000px]" style={{ height: TOTAL_GRID_HEIGHT_PX }}>

            {/* Horizontal Red Dotted Time Line */}
            {currentLineTopPx > 0 && currentLineTopPx < TOTAL_GRID_HEIGHT_PX && (
              <div
                className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                style={{ top: currentLineTopPx }}
              >
                <div className="bg-[#f43f5e] text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-md ml-1 z-30 animate-pulse">
                  {currentTime}
                </div>
                <div className="flex-1 border-t-2 border-dashed border-[#f43f5e]" />
              </div>
            )}

            {/* Left Time Scale Column (Sticky on Left) */}
            <div className="w-20 shrink-0 border-r border-slate-200 relative bg-slate-50/90 backdrop-blur-sm sticky left-0 z-10">
              {TIMELINE_SLOTS.map((slot, idx) => {
                const topPx = (timeStringToMinutes(slot) - START_MINS) * MINUTE_HEIGHT_PX;
                return (
                  <div
                    key={idx}
                    className="absolute left-0 right-0 text-[11px] font-bold text-slate-500 pr-2 text-right"
                    style={{ top: topPx - 8 }}
                  >
                    {slot}
                  </div>
                );
              })}
            </div>

            {/* Entity Columns */}
            <div className="flex flex-1 relative">
              {columns.map((col) => {
                const colAppts = appointments.filter((a) => {
                  if (targetEntity === 'staff') {
                    return a.staff_id === col.id;
                  } else {
                    return a.facility_id === col.id || a.facility_name === col.name;
                  }
                });

                return (
                  <div key={col.id} className="flex-1 min-w-[150px] shrink-0 border-r border-slate-100 relative">
                    {TIMELINE_SLOTS.map((slot, idx) => (
                      <div
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setHoveredAppt(null);
                          onSlotClick?.(col, slot);
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          try {
                            const data = e.dataTransfer.getData('text/plain');
                            if (!data) return;
                            const appt = JSON.parse(data);
                            onApptDrop?.(appt, col, slot);
                          } catch (err) {
                            console.error('Drop error:', err);
                          }
                        }}
                        className="absolute left-0 right-0 border-t border-slate-100 hover:bg-blue-50/20 cursor-pointer transition-colors"
                        style={{
                          top: (timeStringToMinutes(slot) - START_MINS) * MINUTE_HEIGHT_PX,
                          height: 30 * MINUTE_HEIGHT_PX
                        }}
                        title={`Click tạo lịch lúc ${slot} cho ${col.name}`}
                      />
                    ))}

                    {/* Draggable Vertical Cards */}
                    {colAppts.map((appt, idx) => {
                      const { startMins, durationMins, displayStart, displayEnd } = getAppointmentTimes(appt);
                      const topPx = (Math.max(0, startMins - START_MINS)) * MINUTE_HEIGHT_PX;
                      const heightPx = durationMins * MINUTE_HEIGHT_PX - 4;

                      const isBreak = appt.is_break || appt.status === 'break';
                      const cardStyle = getCardStyleByStatus(appt.status, isBreak);
                      const assignedStaff = staffList.find(s => s.id === appt.staff_id);
                      const staffAvatar = appt.staff_avatar_url || assignedStaff?.avatar_url;
                      const staffName = appt.staff_name || assignedStaff?.full_name || assignedStaff?.name || col.name;

                      return (
                        <div
                          key={appt.id || idx}
                          draggable={!isBreak}
                          onDragStart={(e) => {
                            setHoveredAppt(null);
                            e.dataTransfer.setData('text/plain', JSON.stringify(appt));
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onMouseEnter={(e) => handleCardMouseEnter(e, { ...appt, displayStart, displayEnd, staff_avatar_url: staffAvatar, staff_name: staffName })}
                          onMouseLeave={handleCardMouseLeave}
                          onClick={(e) => {
                            e.stopPropagation();
                            onApptClick?.(appt);
                          }}
                          style={{
                            top: topPx + 2,
                            height: heightPx,
                            left: 4,
                            right: 4,
                            ...(cardStyle.striped ? {
                              background: 'repeating-linear-gradient(135deg, #f8fafc, #f8fafc 10px, #f1f5f9 10px, #f1f5f9 20px)'
                            } : {})
                          }}
                          className={`absolute z-10 p-2.5 rounded-xl shadow-2xs hover:shadow-lg hover:z-30 transition-all cursor-grab active:cursor-grabbing overflow-hidden flex flex-col justify-between font-body ${cardStyle.bg}`}
                        >
                          <div>
                            <div className="text-[10px] font-medium opacity-80 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {displayStart} ➔ {displayEnd}
                            </div>

                            <div className="font-extrabold text-xs truncate mt-0.5">
                              {isBreak ? 'Blocktime / Nghỉ' : (appt.customer_name || 'Anh Ngọc Nguyễn')}
                            </div>

                            {!isBreak && (
                              <div className="text-[11px] font-medium opacity-90 truncate mt-0.5">
                                {appt.service_name || 'Full Press Set (2 hrs)'}
                              </div>
                            )}
                          </div>

                          {!isBreak && (
                            <div className="text-[10px] opacity-80 truncate pt-1 border-t border-black/5">
                              📍 {appt.facility_name || 'Nail Station 1'}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

        </div>

      </div>

      {/* Hover Popover Modal */}
      {hoveredAppt && (
            <div
              onMouseEnter={handlePopoverMouseEnter}
              onMouseLeave={handlePopoverMouseLeave}
              style={{
                position: 'fixed',
                bottom: `${popoverPos.bottom}px`,
                left: `${popoverPos.left}px`,
                zIndex: 60
              }}
              className="bg-white rounded-2xl p-4 shadow-2xl border border-slate-200/90 w-[340px] space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-150 font-body select-none"
            >
              <div className="flex items-center justify-between">
                {hoveredAppt.is_break || hoveredAppt.status === 'break' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>Blocktime / Nghỉ ⌄</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Confirmed ⌄</span>
                  </span>
                )}
                <button
                  onClick={() => setHoveredAppt(null)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <Avatar
                  src={hoveredAppt.customer_avatar_url}
                  name={hoveredAppt.customer_name || 'Khách Hàng'}
                  size={42}
                  color="#3B82F6"
                />
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">
                    {hoveredAppt.customer_name || 'Anh Ngọc Nguyễn'}
                  </h4>
                  <p className="text-xs font-medium text-slate-500">
                    {hoveredAppt.displayStart || hoveredAppt.start_time || '11:00'} - {hoveredAppt.displayEnd || hoveredAppt.end_time || '13:00'}
                  </p>
                </div>
              </div>

              {!hoveredAppt.is_break && (
                <>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <h5 className="font-extrabold text-sm text-slate-900 leading-snug">
                        {hoveredAppt.service_name || 'Full Press Set (2 hrs)'}
                      </h5>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                        <Avatar
                          src={hoveredAppt.staff_avatar_url}
                          name={hoveredAppt.staff_name || 'Nhân viên'}
                          size={18}
                          color="#10B981"
                        />
                        <span>{hoveredAppt.staff_name || 'Nhân viên'}</span>
                      </p>
                    </div>
                    <div className="font-extrabold text-sm text-slate-900">
                      {formatVND(hoveredAppt.price || 450000)}
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 flex items-center gap-2 pt-1 font-medium">
                    <span className="shrink-0">⏱ {hoveredAppt.duration_minutes || hoveredAppt.duration || 60} mins</span>
                    {hoveredAppt.facility_name && (hoveredAppt.raw_appointment?.facility_id || hoveredAppt.raw_appointment?.services?.some(s => s.facility_id)) && (
                      <>
                        <span className="shrink-0">·</span>
                        <span className="truncate">📍 {hoveredAppt.facility_name}</span>
                      </>
                    )}
                  </div>

                  {(hoveredAppt.notes || hoveredAppt.note) && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed font-normal">
                      📝 {hoveredAppt.notes || hoveredAppt.note}
                    </div>
                  )}
                </>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1 text-slate-400">
                  <button
                    onClick={() => {
                      const appt = hoveredAppt;
                      setHoveredAppt(null);
                      onApptClick?.(appt);
                    }}
                    className="p-2 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition"
                    title="Chỉnh sửa"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const appt = hoveredAppt;
                      setHoveredAppt(null);
                      onDeleteAppt?.(appt);
                    }}
                    className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                    title="Xóa lịch hẹn"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {!hoveredAppt.is_break && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const appt = hoveredAppt;
                      setHoveredAppt(null);
                      if (onUpdateStatus) {
                        if (appt.status === 'checked_in' || appt.status === 'in_progress') {
                          onUpdateStatus(appt, 'completed');
                        } else if (appt.status === 'completed') {
                          onUpdateStatus(appt, 'view_invoice');
                        } else {
                          onUpdateStatus(appt, 'checked_in');
                        }
                      } else {
                        onApptClick?.(appt);
                      }
                    }}
                    className={`px-4 py-2 text-white font-bold text-xs rounded-xl shadow-2xs transition ${
                      hoveredAppt.status === 'checked_in' || hoveredAppt.status === 'in_progress'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : hoveredAppt.status === 'completed'
                        ? 'bg-slate-800 hover:bg-slate-900 cursor-pointer'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {hoveredAppt.status === 'checked_in' || hoveredAppt.status === 'in_progress'
                      ? 'Thanh toán'
                      : hoveredAppt.status === 'completed'
                      ? 'Xem hóa đơn'
                      : 'Check in'}
                  </button>
                )}
              </div>
            </div>
          )}
    </div>
  );
}
