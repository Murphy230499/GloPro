'use client';

import React, { useState, useEffect, useRef } from 'react';
import Avatar from '@/components/Avatar';
import { useT } from '@/lib/i18n';
import { TIMELINE_SLOTS, timeStringToMinutes, getAppointmentTimes, DEFAULT_FACILITIES } from './constants';
import { formatVND } from '@/lib/format';
import { User, Building2, Edit3, Trash2, X } from 'lucide-react';

export default function AppointmentTimelineView({

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

  const sampleStaffRows = [
    { id: '__unassigned', name: t('appointments.unassigned', 'Chưa phân công'), avatar_url: null, group_name: t('appointments.free_slot', 'Lịch tự do'), group_color: '#94A3B8' },
    { id: 'st_1', name: 'Maria A.', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', group_name: 'KTV Chuyên nghiệp', group_color: '#8b5cf6' },
    { id: 'st_2', name: 'Michelle M.', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', group_name: 'Nail Specialist', group_color: '#f472b6' },
    { id: 'st_3', name: 'Minh P.', avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100', group_name: 'Chuyên gia Tóc', group_color: '#8b5cf6' },
    { id: 'st_4', name: 'Ethan O.', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', group_name: 'Barber & Stylist', group_color: '#10b981' },
    { id: 'st_5', name: 'Rose H.', avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100', group_name: 'Spa Specialist', group_color: '#f59e0b' },
    { id: 'st_6', name: 'Jenie K.', avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100', group_name: 'Colorist', group_color: '#8b5cf6' },
    { id: 'st_7', name: 'Nga H.', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', group_name: 'Stylist', group_color: '#8b5cf6' },
  ];

  let rawRows = targetEntity === 'staff'
    ? (staffList.length ? [
        { id: '__unassigned', name: t('appointments.unassigned', 'Chưa phân công'), avatar_url: null, group_name: t('appointments.free_slot', 'Lịch tự do'), group_color: '#94A3B8' },
        ...staffList.map(s => ({
          id: s.id,
          name: s.full_name || s.name,
          avatar_url: s.avatar_url,
          group_name: s.group_name || t('staff.no_group', 'Chưa có nhóm'),
          group_color: s.group_color || '#3B82F6',
          color: s.avatar_color || '#3B82F6'
        }))
      ] : sampleStaffRows)
    : facilityList;

  if (selectedStaff && selectedStaff !== 'all') {
    rawRows = rawRows.filter(r => 
      r.id === selectedStaff || 
      (r.name && r.name.toLowerCase().includes(selectedStaff.toLowerCase())) ||
      (selectedStaff.toLowerCase().includes((r.name || '').toLowerCase())) ||
      (selectedStaff === '__unassigned' && r.id === '__unassigned')
    );
  }

  const rows = rawRows;

  // Timeline scale constants
  const START_MINS = 0; // 00:00
  const TOTAL_MINS = 1440; // 24 hours (00:00 - 24:00)
  const SLOT_WIDTH_PX = 120; // 120px per 30 minutes slot
  const TOTAL_GRID_WIDTH_PX = TIMELINE_SLOTS.length * SLOT_WIDTH_PX;
  const TOTAL_CONTAINER_WIDTH = TOTAL_GRID_WIDTH_PX;

  useEffect(() => {
    if (bodyScrollRef.current) {
      const now = new Date();
      const actualMinutes = now.getHours() * 60 + now.getMinutes();
      const initialScrollMins = Math.max(0, actualMinutes - 30);
      bodyScrollRef.current.scrollLeft = (initialScrollMins / 30) * SLOT_WIDTH_PX;
    }
  }, []);

  const currentLineLeftPx = Math.max(0, ((currentMinutes - START_MINS) / 30) * SLOT_WIDTH_PX);

  const getRoleBadgeStyle = (color) => {
    if (!color) return { background: '#f8fafc', color: '#64748b' };
    return { background: color + '20', color: color };
  };

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
          badgeBg: 'bg-emerald-500 text-white',
          label: 'Confirmed'
        };
      case 'checked_in':
      case 'in_progress':
        return {
          bg: 'bg-[#eff6ff] border-l-4 border-l-blue-500 border-y border-r border-blue-200/80 text-blue-900',
          badgeBg: 'bg-blue-500 text-white',
          label: 'Checked in'
        };
      case 'completed':
        return {
          bg: 'bg-[#f8fafc] border-l-4 border-l-slate-500 border-y border-r border-slate-200 text-slate-800',
          badgeBg: 'bg-slate-500 text-white',
          label: 'Completed'
        };
      case 'no_show':
        return {
          bg: 'bg-orange-50 border-l-4 border-l-orange-500 border-y border-r border-orange-200/80 text-orange-900',
          badgeBg: 'bg-orange-500 text-white',
          label: 'Không đến'
        };
      case 'cancelled':
        return {
          bg: 'bg-[#fff1f2] border-l-4 border-l-rose-500 border-y border-r border-rose-200/80 text-rose-900',
          badgeBg: 'bg-rose-500 text-white',
          label: 'Đã hủy'
        };
      case 'pending':
      case 'booked':
      default:
        return {
          bg: 'bg-[#fff7ed] border-l-4 border-l-amber-500 border-y border-r border-amber-200/80 text-amber-900',
          badgeBg: 'bg-amber-500 text-white',
          label: 'Booked'
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs font-body flex-1 min-h-0 flex flex-col overflow-hidden relative">

      {/* ── Fixed Time Header (Top Row, scroll-synced with body) ── */}
      <div className="shrink-0 border-b border-slate-200 shadow-sm bg-white rounded-t-2xl overflow-hidden z-40 sticky top-0 flex">
        {/* Top-Left Frozen Corner Cell ("Nhân viên" / "Vị trí") */}
        <div className="w-24 md:w-52 shrink-0 p-2 md:p-4 border-r border-slate-200 bg-slate-50/90 font-bold text-[10px] md:text-xs text-slate-500 uppercase flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 z-40">
          {targetEntity === 'staff' ? (
            <>
              <User className="w-4 h-4 text-blue-600" />
              <span className="text-center">{t('invoices.table.staff', t('invoices.table.staff', 'Nhân viên'))}</span>
            </>
          ) : (
            <>
              <Building2 className="w-4 h-4 text-purple-600" />
              <span>Vị trí</span>
            </>
          )}
        </div>

        {/* Scrollable Time Slot Headers */}
        <div
          ref={headerScrollRef}
          className="flex-1 overflow-x-hidden relative border-b border-slate-200 bg-slate-50/90 backdrop-blur-sm z-10"
        >
          <div className="relative h-[45px]" style={{ width: TOTAL_GRID_WIDTH_PX }}>
            {TIMELINE_SLOTS.map((slot, idx) => (
              <div
                key={idx}
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-500 ${idx === 0 ? 'ml-4' : ''}`}
                style={{ left: idx * SLOT_WIDTH_PX }}
              >
                {slot}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Scrollable Body Area ── */}
      <div
        ref={bodyScrollRef}
        className="overflow-auto flex-1 min-h-0"
        onScroll={handleBodyScroll}
      >
        <div className="relative" style={{ minWidth: 'max-content', width: TOTAL_CONTAINER_WIDTH }}>
          {/* Red Dotted Current Line Indicator */}
          {currentLineLeftPx > 0 && currentLineLeftPx < TOTAL_GRID_WIDTH_PX && (
              <div className="absolute top-0 bottom-0 ml-24 md:ml-52 z-10 pointer-events-none">
                <div
                  className="absolute top-0 bottom-0 flex flex-col items-center"
                  style={{ transform: `translateX(${currentLineLeftPx}px)` }}
                >
                  <div className="bg-[#f43f5e] text-white font-extrabold text-[11px] px-2.5 py-0.5 rounded-full shadow-md whitespace-nowrap animate-pulse">
                    {currentTime}
                  </div>
                  <div className="w-[2px] flex-1 border-l-2 border-dashed border-[#f43f5e]" />
                </div>
              </div>
            )}

            {/* Rows */}
            {rows.map((row) => {
              const rowAppts = appointments.filter((a) => {
                if (targetEntity === 'staff') {
                  return a.staff_id === row.id;
                } else {
                  return a.facility_id === row.id || a.facility_name === row.name;
                }
              });

              return (
                <div
                  key={row.id}
                  className="flex border-b border-slate-100 min-h-[96px] relative group hover:bg-slate-50/30 transition-colors font-body"
                >
                  {/* Left Column: Staff Avatar & Name */}
                  <div className="w-24 md:w-52 shrink-0 px-1 md:px-3 py-3 md:py-4 border-r border-slate-200 bg-white flex flex-col md:flex-row items-center md:items-start justify-center md:justify-start gap-1 md:gap-3 sticky left-0 z-20 font-body">
                    {targetEntity === 'staff' ? (
                      <div className="shrink-0 scale-75 md:scale-100 flex items-center justify-center">
                        <Avatar
                          src={row.avatar_url}
                          name={row.name}
                          size={40}
                          color={row.color || '#3b82f6'}
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0 border border-purple-200">
                        {row.icon || '📍'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1 flex flex-col items-center md:items-start w-full">
                      <h4 className="font-semibold text-[10px] md:text-[13px] text-slate-800 truncate mb-0.5 w-full text-center md:text-left">
                        {row.name}
                      </h4>
                      {targetEntity === 'staff' ? (
                        <span className={`inline-flex items-center px-1.5 md:px-2.5 py-0.5 rounded-full text-[8px] md:text-xs font-semibold max-w-full`} style={getRoleBadgeStyle(row.group_color)}>
                          <span className="truncate">{row.group_name}</span>
                        </span>
                      ) : (
                        <p className="text-[10px] md:text-xs text-slate-400 truncate text-center md:text-left w-full">
                          {row.category || 'Vị trí'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Grid Timeline Slot Area */}
                  <div className="flex flex-1 relative">
                    {TIMELINE_SLOTS.map((slot, idx) => (
                      <div
                        key={idx}
                        style={{ width: SLOT_WIDTH_PX }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setHoveredAppt(null);
                          onSlotClick?.(row, slot);
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          try {
                            const data = e.dataTransfer.getData('text/plain');
                            if (!data) return;
                            const appt = JSON.parse(data);
                            onApptDrop?.(appt, row, slot);
                          } catch (err) {
                            console.error('Drop error:', err);
                          }
                        }}
                        className="shrink-0 border-l border-slate-100 h-full hover:bg-blue-50/20 cursor-pointer transition-colors"
                        title={`Click tạo lịch lúc ${slot} cho ${row.name}`}
                      />
                    ))}

                    {/* Render Draggable Appointment Cards */}
                    {rowAppts.map((appt, idx) => {
                      const { startMins, durationMins, displayStart, displayEnd } = getAppointmentTimes(appt);
                      const leftPx = ((Math.max(0, startMins - START_MINS)) / 30) * SLOT_WIDTH_PX;
                      const widthPx = (durationMins / 30) * SLOT_WIDTH_PX - 4;

                      const isBreak = appt.is_break || appt.status === 'break';
                      const cardStyle = getCardStyleByStatus(appt.status, isBreak);
                      const assignedStaff = staffList.find(s => s.id === appt.staff_id);
                      const staffAvatar = appt.staff_avatar_url || assignedStaff?.avatar_url;
                      const staffName = appt.staff_name || assignedStaff?.full_name || assignedStaff?.name || row.name;

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
                            left: leftPx + 2,
                            width: widthPx,
                            top: 6,
                            bottom: 6,
                            ...(cardStyle.striped ? {
                              background: 'repeating-linear-gradient(135deg, #f8fafc, #f8fafc 10px, #f1f5f9 10px, #f1f5f9 20px)'
                            } : {})
                          }}
                          className={`absolute z-[8] p-2.5 rounded-xl shadow-2xs hover:shadow-lg hover:z-[15] transition-all cursor-grab active:cursor-grabbing overflow-hidden flex flex-col justify-between font-body ${cardStyle.bg}`}
                        >
                          {isBreak ? (
                            <div className="h-full flex flex-col justify-center">
                              <div className="text-[10px] font-semibold text-slate-500">
                                {displayStart} ➔ {displayEnd}
                              </div>
                              <div className="font-bold text-xs text-slate-800">
                                Blocktime / Nghỉ
                              </div>
                            </div>
                          ) : (
                            <>
                              <div>
                                <div className="text-[10px] font-medium opacity-80">
                                  {displayStart} ➔ {displayEnd}
                                </div>

                                <div className="font-extrabold text-xs truncate mt-0.5">
                                  {appt.customer_name || 'Anh Ngọc Nguyễn'}
                                </div>
                              </div>

                              <div className="text-[10px] opacity-90 truncate mt-1">
                                {appt.service_name || 'Full Press Set (2 hrs)'} · {appt.facility_name || 'Nail Station 1'}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
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
              {/* Header Status Badge */}
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

              {/* Customer Avatar & Name */}
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

              {/* Service Details & Actual Price */}
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
                          name={hoveredAppt.staff_name || t('invoices.table.staff', 'Nhân viên')}
                          size={18}
                          color="#10B981"
                        />
                        <span>{hoveredAppt.staff_name || t('invoices.table.staff', 'Nhân viên')}</span>
                      </p>
                    </div>
                    <div className="font-extrabold text-sm text-slate-900">
                      {formatVND(hoveredAppt.price || 450000)}
                    </div>
                  </div>

                  {/* Duration & Station */}
                  <div className="text-xs text-slate-600 flex items-center gap-2 pt-1 font-medium">
                    <span className="shrink-0">⏱ {hoveredAppt.duration_minutes || hoveredAppt.duration || 60} mins</span>
                    {hoveredAppt.facility_name && (hoveredAppt.raw_appointment?.facility_id || hoveredAppt.raw_appointment?.services?.some(s => s.facility_id)) && (
                      <>
                        <span className="shrink-0">·</span>
                        <span className="truncate">📍 {hoveredAppt.facility_name}</span>
                      </>
                    )}
                  </div>

                  {/* Note ONLY rendered if actual note exists */}
                  {(hoveredAppt.notes || hoveredAppt.note) && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed font-normal">
                      📝 {hoveredAppt.notes || hoveredAppt.note}
                    </div>
                  )}
                </>
              )}

              {/* Action Buttons */}
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
