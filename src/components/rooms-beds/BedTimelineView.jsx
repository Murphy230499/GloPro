'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Clock, User, Scissors, Plus, AlertCircle, Phone, Sparkles, 
  DoorOpen, CheckCircle2, Layers, Filter, Info
} from 'lucide-react';
import { useT } from '@/lib/i18n';
import Avatar from '@/components/Avatar';
import { formatVND } from '@/lib/format';
import { 
  TIMELINE_START_HOUR, 
  TIMELINE_END_HOUR, 
  TIMELINE_START_MINUTES, 
  TIMELINE_END_MINUTES,
  SLOT_INTERVAL_MINUTES,
  DEFAULT_SLOT_WIDTH_PX,
  generateTimelineSlots,
  calculateTimelinePosition,
  formatMinutesToString,
  isSameDay,
  getTodayDateString
} from '@/lib/bedTimelineHelper';
import { ensureValidUuid } from '@/lib/roomBedDbHelper';
import { calculateBedAvailableWindow, BED_BUFFER_MINUTES } from '@/lib/bedConflictHelper';

export default function BedTimelineView({
  rooms = [],
  beds = [],
  eventsByBedId = {},
  bedSessions = {},
  appointments = [],
  selectedDate = getTodayDateString(),
  selectedRoomId = 'all',
  onSelectEvent,
  onEmptySlotClick,
  onBedClick
}) {
  const { t } = useT();

  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const hoverTimerRef = useRef(null);

  const scrollContainerRef = useRef(null);

  const isToday = isSameDay(selectedDate, getTodayDateString());

  // 1. Sinh danh sách mốc thời gian trục X (07:00 -> 22:00)
  const timelineSlots = useMemo(() => {
    return generateTimelineSlots(TIMELINE_START_HOUR, TIMELINE_END_HOUR, SLOT_INTERVAL_MINUTES);
  }, []);

  const totalGridWidthPx = (timelineSlots.length - 1) * DEFAULT_SLOT_WIDTH_PX;

  // 2. Cập nhật đồng hồ thời gian thực mỗi phút
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // 3. Tự động cuộn đến khung giờ hiện tại khi mở giao diện
  useEffect(() => {
    if (scrollContainerRef.current) {
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();
      // Cuộn để khung giờ hiện tại nằm lùi lại 30 phút cho dễ nhìn
      const scrollMins = Math.max(0, nowMins - TIMELINE_START_MINUTES - 30);
      const scrollPx = (scrollMins / SLOT_INTERVAL_MINUTES) * DEFAULT_SLOT_WIDTH_PX;
      scrollContainerRef.current.scrollLeft = scrollPx;
    }
  }, []);

  // 4. Lọc và nhóm Giường theo Phòng
  const filteredRooms = useMemo(() => {
    if (!selectedRoomId || selectedRoomId === 'all') return rooms;
    return rooms.filter(r => r.id === selectedRoomId);
  }, [rooms, selectedRoomId]);

  const bedsByRoom = useMemo(() => {
    const map = {};
    // Khởi tạo phòng - map theo id, db_id, và valid UUID
    filteredRooms.forEach(r => {
      const arr = [];
      if (r.id) map[r.id] = arr;
      if (r.db_id) map[r.db_id] = arr;
      const validUuid = ensureValidUuid(r.id);
      if (validUuid) map[validUuid] = arr;
    });
    // Giường chưa gán phòng
    map['__unassigned'] = [];

    beds.forEach(b => {
      const rId = b.room_id;
      const targetBeds = rId ? (map[rId] || map[ensureValidUuid(rId)]) : null;
      if (targetBeds) {
        targetBeds.push(b);
      } else if (!selectedRoomId || selectedRoomId === 'all') {
        map['__unassigned'].push(b);
      }
    });

    Object.values(map).forEach(arr => {
      arr.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' }));
    });

    return map;
  }, [filteredRooms, beds, selectedRoomId]);

  // Vị trí vạch đỏ hiển thị giờ hiện tại
  const currentLineLeftPx = isToday && currentMinutes >= TIMELINE_START_MINUTES && currentMinutes <= TIMELINE_END_MINUTES
    ? ((currentMinutes - TIMELINE_START_MINUTES) / SLOT_INTERVAL_MINUTES) * DEFAULT_SLOT_WIDTH_PX
    : null;

  // Tooltip hover handlers
  const handleEventMouseEnter = (e, event) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      top: rect.bottom + 8,
      left: Math.max(10, Math.min(window.innerWidth - 320, rect.left + rect.width / 2 - 150))
    });
    setHoveredEvent(event);
  };

  const handleEventMouseLeave = () => {
    hoverTimerRef.current = setTimeout(() => {
      setHoveredEvent(null);
    }, 200);
  };

  // Tính toán màu sắc và trạng thái của giường đồng bộ chính xác với Sơ đồ dạng lưới
  const getBedRealtimeStatusInfo = (bed) => {
    if (!bed) {
      return {
        bgClass: 'bg-white',
        borderLeft: 'border-l-4 border-l-slate-300',
        badgeBg: 'bg-slate-100 text-slate-600',
        dotColor: 'bg-slate-400',
        text: 'KHÔNG XÁC ĐỊNH',
        subText: null
      };
    }

    // 1. Tìm phiên phục vụ hiện tại từ bedSessions
    const session = bedSessions[bed.id] || 
                    (bed.db_id && bedSessions[bed.db_id]) ||
                    (ensureValidUuid(bed.id) && bedSessions[ensureValidUuid(bed.id)]);

    const isOccupied = Boolean(session);
    const isCleaning = session?.status === 'cleaning' || bed.status === 'cleaning';
    const isWaiting = session?.status === 'waiting';
    const isReserved = session?.status === 'reserved';
    const isNearlyFinished = session?.status === 'nearly_finished';
    const isOvertime = session?.status === 'overtime';

    // 2. Kiểm tra sự kiện đang diễn ra trong ngày hôm nay
    const now = new Date();
    const currentMinsNow = now.getHours() * 60 + now.getMinutes();
    const bedEvents = eventsByBedId[bed.id] || [];
    const activeEventNow = isToday ? bedEvents.find(e => currentMinsNow >= e.start_minutes && currentMinsNow <= e.end_minutes) : null;

    // 3. Khung thời gian trống cho giường chưa có khách
    let windowInfo = null;
    if (!isOccupied && appointments && appointments.length > 0) {
      windowInfo = calculateBedAvailableWindow(bed.id, appointments, currentMinsNow, BED_BUFFER_MINUTES);
    }

    // A. Quá giờ (Fuchsia/Rose neon)
    if (isOvertime || activeEventNow?.is_overtime) {
      return {
        bgClass: 'bg-fuchsia-50/40 hover:bg-fuchsia-50/60',
        borderLeft: 'border-l-4 border-l-fuchsia-500',
        badgeBg: 'bg-fuchsia-100 text-fuchsia-900 border border-fuchsia-300/80',
        dotColor: 'bg-fuchsia-500 animate-ping',
        text: 'QUÁ GIỜ',
        subText: session?.customer_name || activeEventNow?.customer_name || null
      };
    }

    // B. Sắp trống (Amber)
    if (isNearlyFinished) {
      return {
        bgClass: 'bg-amber-50/40 hover:bg-amber-50/60',
        borderLeft: 'border-l-4 border-l-amber-500',
        badgeBg: 'bg-amber-100 text-amber-900 border border-amber-300/80',
        dotColor: 'bg-amber-500',
        text: 'SẮP TRỐNG',
        subText: session?.customer_name || null
      };
    }

    // C. Đang dọn dẹp (Teal)
    if (isCleaning) {
      return {
        bgClass: 'bg-teal-50/40 hover:bg-teal-50/60',
        borderLeft: 'border-l-4 border-l-teal-500',
        badgeBg: 'bg-teal-100 text-teal-800 border border-teal-300/80',
        dotColor: 'bg-teal-500',
        text: 'ĐANG DỌN DẸP',
        subText: null
      };
    }

    // D. Chờ phục vụ (Blue)
    if (isWaiting) {
      return {
        bgClass: 'bg-blue-50/40 hover:bg-blue-50/60',
        borderLeft: 'border-l-4 border-l-blue-500',
        badgeBg: 'bg-blue-100 text-blue-800 border border-blue-300/80',
        dotColor: 'bg-blue-500',
        text: 'CHỜ PHỤC VỤ',
        subText: session?.customer_name || null
      };
    }

    // E. Đặt trước (Amber)
    if (isReserved) {
      return {
        bgClass: 'bg-amber-50/40 hover:bg-amber-50/60',
        borderLeft: 'border-l-4 border-l-amber-500',
        badgeBg: 'bg-amber-100 text-amber-800 border border-amber-300/80',
        dotColor: 'bg-amber-500',
        text: 'ĐẶT TRƯỚC',
        subText: session?.customer_name || null
      };
    }

    // F. Đang bận (Rose)
    if (isOccupied || activeEventNow) {
      return {
        bgClass: 'bg-rose-50/30 hover:bg-rose-50/50',
        borderLeft: 'border-l-4 border-l-rose-500',
        badgeBg: 'bg-rose-100 text-rose-800 border border-rose-300/80',
        dotColor: 'bg-rose-500 animate-pulse',
        text: 'ĐANG BẬN',
        subText: session?.customer_name || activeEventNow?.customer_name || null
      };
    }

    // G. Giường trống có lịch hẹn sắp tới
    if (windowInfo?.hasNextAppt) {
      if (windowInfo.availableMinutes <= 0) {
        return {
          bgClass: 'bg-amber-50/30 hover:bg-amber-50/50',
          borderLeft: 'border-l-4 border-l-amber-400',
          badgeBg: 'bg-amber-100 text-amber-900 border border-amber-300/80',
          dotColor: 'bg-amber-500',
          text: `HẸN ${windowInfo.availableUntil}`,
          subText: null
        };
      }
      return {
        bgClass: 'bg-emerald-50/20 hover:bg-emerald-50/40',
        borderLeft: 'border-l-4 border-l-emerald-500',
        badgeBg: 'bg-emerald-100 text-emerald-900 border border-emerald-300/80',
        dotColor: 'bg-emerald-500',
        text: `TRỐNG ĐẾN ${windowInfo.availableUntil}`,
        subText: null
      };
    }

    // H. Đang trống (Emerald)
    return {
      bgClass: 'bg-emerald-50/15 hover:bg-emerald-50/30',
      borderLeft: 'border-l-4 border-l-emerald-500',
      badgeBg: 'bg-emerald-100 text-emerald-800 border border-emerald-300/70',
      dotColor: 'bg-emerald-500',
      text: 'ĐANG TRỐNG',
      subText: null
    };
  };

  return (
    <div className="relative flex flex-col bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden select-none">
      
      {/* 1. Header Toolbar phụ: Chú thích trạng thái vị trí & loại khách */}
      <div className="px-5 py-2.5 bg-slate-50/70 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            Trạng thái giường:
          </span>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Đang trống
          </span>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Đang bận
          </span>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Sắp trống / Hẹn
          </span>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-fuchsia-50 px-2 py-0.5 rounded border border-fuchsia-200">
            <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse" />
            Quá giờ
          </span>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            Dọn dẹp
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="w-2.5 h-2.5 rounded bg-sky-200 border border-sky-400" />
            <span>Đặt trước</span>
            <span className="w-2.5 h-2.5 rounded bg-emerald-200 border border-emerald-400 ml-1.5" />
            <span>Vãng lai</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
            <Info className="w-3.5 h-3.5 text-blue-500" />
            <span>Click ô trống để tiếp nhận</span>
          </div>
        </div>
      </div>

      {/* 2. Bảng Timeline chính (Hợp nhất 1 container cuộn duy nhất: Giường & Timeline cuộn cùng nhau) */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-auto relative bg-white min-h-[520px] max-h-[720px] select-none"
      >
        <div 
          className="min-w-max relative"
          style={{ width: `${240 + totalGridWidthPx + DEFAULT_SLOT_WIDTH_PX}px` }}
        >
          {/* Vạch đỏ chỉ giờ hiện tại chạy dọc toàn bộ chiều cao của bảng timeline */}
          {currentLineLeftPx !== null && (
            <div 
              className="absolute top-0 bottom-0 z-15 pointer-events-none transition-all duration-300"
              style={{ left: `${240 + currentLineLeftPx}px` }}
            >
              <div className="w-0.5 h-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.45)]" />
            </div>
          )}

          {/* HÀNG HEADER DÍNH TRÊN CÙNG (Sticky Top Header Row) */}
          <div className="sticky top-0 z-30 flex h-14 bg-slate-50/95 backdrop-blur-xs border-b border-slate-200/90">
            {/* Ô góc trên bên trái: Phòng & Giường (Dính cả Top lẫn Left) */}
            <div className="w-[240px] shrink-0 sticky left-0 z-40 bg-slate-50/95 backdrop-blur-xs border-r border-slate-200 px-4 flex items-center justify-between text-xs font-bold text-slate-800 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-blue-600" />
                <span>Phòng & Giường</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                {beds.length} vị trí
              </span>
            </div>

            {/* Thước đo giờ trục X (bên phải góc cố định) */}
            <div 
              className="flex relative"
              style={{ width: `${totalGridWidthPx + DEFAULT_SLOT_WIDTH_PX}px` }}
            >
              {timelineSlots.map((slot, idx) => {
                const isHour = slot.minutes % 60 === 0;
                return (
                  <div 
                    key={slot.time}
                    style={{ width: `${DEFAULT_SLOT_WIDTH_PX}px` }}
                    className={`h-full shrink-0 px-2.5 flex flex-col justify-center select-none transition-colors ${
                      isHour 
                        ? 'border-r border-slate-200 bg-slate-100/50' 
                        : 'border-r border-slate-200/40 bg-transparent'
                    }`}
                  >
                    <div className="flex items-baseline gap-1">
                      <span className={`text-xs tracking-tight ${
                        isHour ? 'font-bold text-slate-900' : 'font-medium text-slate-500'
                      }`}>
                        {slot.time}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`h-1 rounded-full ${
                        isHour ? 'w-3 bg-blue-600' : 'w-1.5 bg-slate-300'
                      }`} />
                      <span className={`text-[9px] font-medium ${isHour ? 'text-blue-700 font-bold' : 'text-slate-400'}`}>
                        {isHour ? ':00' : ':30'}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Viên capsule hiển thị giờ thực tại Header */}
              {currentLineLeftPx !== null && (
                <div 
                  className="absolute top-0 bottom-0 z-40 pointer-events-none transition-all duration-300"
                  style={{ left: `${currentLineLeftPx}px` }}
                >
                  <div className="absolute top-2.5 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-full shadow-md shadow-rose-500/30 ring-2 ring-white whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    <span>{formatMinutesToString(currentMinutes)}</span>
                  </div>
                  <div className="w-0.5 h-full bg-rose-500 mx-auto" />
                </div>
              )}
            </div>
          </div>

          {/* THÂN BẢNG: CÁC NHÓM PHÒNG & GIƯỜNG (Mỗi hàng gắn liền cả Cột Tên Giường và Lưới Timeline) */}
          {filteredRooms.map(room => {
            const roomBeds = bedsByRoom[room.id] || [];
            if (roomBeds.length === 0) return null;

            return (
              <div key={room.id} className="relative">
                {/* Hàng Tiêu đề Phòng */}
                <div className="flex h-8 bg-slate-100/80 border-b border-slate-200/80">
                  <div className="w-[240px] shrink-0 sticky left-0 z-20 bg-slate-100/95 border-r border-slate-200/80 px-3.5 flex items-center justify-between shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
                      <DoorOpen className="w-3.5 h-3.5 text-blue-600" />
                      {room.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {roomBeds.length} giường
                    </span>
                  </div>
                  <div className="flex-1 bg-slate-100/40 flex items-center px-4">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {room.name}
                    </span>
                  </div>
                </div>

                {/* Danh sách các Giường trong Phòng: Mỗi giường là 1 flex row duy nhất */}
                {roomBeds.map(bed => {
                  const events = eventsByBedId[bed.id] || [];

                  return (
                    <div 
                      key={bed.id}
                      className="flex h-16 border-b border-slate-100 hover:bg-slate-50/30 transition-colors group"
                    >
                      {/* Cột Tên Giường (Sticky Left, hiển thị màu sắc theo trạng thái của giường như ở dạng lưới) */}
                      {(() => {
                        const statusInfo = getBedRealtimeStatusInfo(bed);
                        return (
                          <div 
                            onClick={() => onBedClick && onBedClick(bed, room)}
                            className={`w-[240px] shrink-0 sticky left-0 z-10 border-r border-slate-200 px-3.5 py-2 flex flex-col justify-center cursor-pointer transition-colors shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)] ${statusInfo.bgClass} ${statusInfo.borderLeft}`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {bed.name}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider shrink-0 ${statusInfo.badgeBg}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
                                <span>{statusInfo.text}</span>
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                              {statusInfo.subText ? `Khách: ${statusInfo.subText}` : (bed.display_name || bed.code || `${room.name} • ${bed.name}`)}
                            </span>
                          </div>
                        );
                      })()}

                      {/* Lưới Timeline của Giường này */}
                      <div 
                        className="relative shrink-0 flex"
                        style={{ width: `${totalGridWidthPx + DEFAULT_SLOT_WIDTH_PX}px` }}
                      >
                        {/* Các slot 30 phút rỗng */}
                        {timelineSlots.slice(0, -1).map((slot, sIdx) => {
                          const isHour = slot.minutes % 60 === 0;
                          return (
                            <div 
                              key={slot.time}
                              onClick={() => {
                                if (onEmptySlotClick) {
                                  onEmptySlotClick({
                                    bed,
                                    room,
                                    time: slot.time,
                                    minutes: slot.minutes
                                  });
                                }
                              }}
                              style={{ width: `${DEFAULT_SLOT_WIDTH_PX}px` }}
                              title={`Bấm để tiếp nhận khách vào ${bed.name} lúc ${slot.time}`}
                              className={`h-full shrink-0 transition-colors cursor-pointer relative hover:bg-blue-50/40 ${
                                isHour ? 'border-r border-slate-200/70' : 'border-r border-slate-100'
                              }`}
                            >
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-20 hover:!opacity-100 transition-opacity">
                                <Plus className="w-4 h-4 text-blue-600" />
                              </div>
                            </div>
                          );
                        })}

                        {/* Các khối sự kiện */}
                        {events.map(event => {
                          const pos = calculateTimelinePosition(event, TIMELINE_START_MINUTES, DEFAULT_SLOT_WIDTH_PX, SLOT_INTERVAL_MINUTES);
                          if (!pos.isVisible) return null;

                          const isWalkIn = event.type === 'walk_in';
                          const isOvertime = event.is_overtime;

                          let cardTheme = isWalkIn
                            ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950 hover:bg-emerald-100/90 hover:border-emerald-400 shadow-xs'
                            : 'bg-sky-50/95 border-sky-300 text-sky-950 hover:bg-sky-100/90 hover:border-sky-400 shadow-xs';

                          if (isOvertime) {
                            cardTheme = 'bg-rose-50/95 border-rose-400 text-rose-950 hover:bg-rose-100 shadow-xs animate-pulse ring-1 ring-rose-300';
                          }

                          return (
                            <div
                              key={event.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectEvent) onSelectEvent(event, bed, room);
                              }}
                              onMouseEnter={(e) => handleEventMouseEnter(e, event)}
                              onMouseLeave={handleEventMouseLeave}
                              style={{
                                left: `${pos.left}px`,
                                width: `${pos.width}px`
                              }}
                              className={`absolute top-1.5 bottom-1.5 rounded-xl border p-2 flex flex-col justify-between overflow-hidden cursor-pointer transition-all z-10 ${cardTheme}`}
                            >
                              {/* Dòng 1: Badge + Tên khách + Giờ */}
                              <div className="flex items-center justify-between gap-1.5 overflow-hidden">
                                <div className="flex items-center gap-1 truncate">
                                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 ${
                                    isWalkIn ? 'bg-emerald-200/70 text-emerald-800' : 'bg-sky-200/70 text-sky-800'
                                  }`}>
                                    {event.typeLabel}
                                  </span>
                                  <span className="font-bold text-xs truncate">
                                    {event.customer_name}
                                  </span>
                                </div>

                                <span className="text-[10px] font-semibold opacity-80 shrink-0 flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  {event.start_time} - {event.end_time}
                                </span>
                              </div>

                              {/* Dòng 2: KTV phụ trách + Dịch vụ */}
                              <div className="flex items-center justify-between text-[11px] opacity-90 truncate gap-2">
                                <div className="flex items-center gap-1 truncate font-medium">
                                  <Scissors className="w-3 h-3 shrink-0 opacity-70" />
                                  <span className="truncate">{event.service_name}</span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0 text-[10px] bg-white/60 px-1.5 py-0.5 rounded-md font-semibold border border-black/5">
                                  <User className="w-2.5 h-2.5" />
                                  <span className="truncate max-w-[70px]">{event.staff_name}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Giường chưa phân phòng nếu có */}
          {bedsByRoom['__unassigned'] && bedsByRoom['__unassigned'].length > 0 && (
            <div className="relative">
              <div className="flex h-8 bg-slate-100/80 border-b border-slate-200/80">
                <div className="w-[240px] shrink-0 sticky left-0 z-20 bg-slate-100/95 border-r border-slate-200/80 px-3.5 flex items-center justify-between shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
                  <span className="text-xs font-bold text-slate-700">Chưa gán phòng</span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {bedsByRoom['__unassigned'].length} giường
                  </span>
                </div>
                <div className="flex-1 bg-slate-100/40 flex items-center px-4">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Chưa gán phòng
                  </span>
                </div>
              </div>

              {bedsByRoom['__unassigned'].map(bed => {
                const events = eventsByBedId[bed.id] || [];
                return (
                  <div 
                    key={bed.id}
                    className="flex h-16 border-b border-slate-100 hover:bg-slate-50/30 transition-colors group"
                  >
                    {/* Cột Tên Giường chưa gán phòng */}
                    {(() => {
                      const statusInfo = getBedRealtimeStatusInfo(bed);
                      return (
                        <div 
                          onClick={() => onBedClick && onBedClick(bed, null)}
                          className={`w-[240px] shrink-0 sticky left-0 z-10 border-r border-slate-200 px-3.5 py-2 flex flex-col justify-center cursor-pointer transition-colors shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)] ${statusInfo.bgClass} ${statusInfo.borderLeft}`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-slate-900 truncate">{bed.name}</span>
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider shrink-0 ${statusInfo.badgeBg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
                              <span>{statusInfo.text}</span>
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                            {statusInfo.subText ? `Khách: ${statusInfo.subText}` : (bed.display_name || bed.code || bed.name)}
                          </span>
                        </div>
                      );
                    })()}

                    <div 
                      className="relative shrink-0 flex"
                      style={{ width: `${totalGridWidthPx + DEFAULT_SLOT_WIDTH_PX}px` }}
                    >
                      {timelineSlots.slice(0, -1).map((slot, sIdx) => {
                        const isHour = slot.minutes % 60 === 0;
                        return (
                          <div 
                            key={slot.time}
                            onClick={() => {
                              if (onEmptySlotClick) {
                                onEmptySlotClick({
                                  bed,
                                  room: null,
                                  time: slot.time,
                                  minutes: slot.minutes
                                });
                              }
                            }}
                            style={{ width: `${DEFAULT_SLOT_WIDTH_PX}px` }}
                            className={`h-full shrink-0 transition-colors cursor-pointer relative hover:bg-blue-50/40 ${
                              isHour ? 'border-r border-slate-200/70' : 'border-r border-slate-100'
                            }`}
                          >
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-20 hover:!opacity-100 transition-opacity">
                              <Plus className="w-4 h-4 text-blue-600" />
                            </div>
                          </div>
                        );
                      })}

                      {events.map(event => {
                        const pos = calculateTimelinePosition(event, TIMELINE_START_MINUTES, DEFAULT_SLOT_WIDTH_PX, SLOT_INTERVAL_MINUTES);
                        if (!pos.isVisible) return null;
                        const isWalkIn = event.type === 'walk_in';
                        return (
                          <div 
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectEvent) onSelectEvent(event, bed, null);
                            }}
                            onMouseEnter={(e) => handleEventMouseEnter(e, event)}
                            onMouseLeave={handleEventMouseLeave}
                            style={{ left: `${pos.left}px`, width: `${pos.width}px` }}
                            className={`absolute top-1.5 bottom-1.5 rounded-xl border p-2 flex flex-col justify-between overflow-hidden cursor-pointer transition-all z-10 ${
                              isWalkIn ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950' : 'bg-sky-50/95 border-sky-300 text-sky-950'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-xs truncate">{event.customer_name}</span>
                              <span className="text-[10px] opacity-80">{event.start_time} - {event.end_time}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] opacity-90 truncate">
                              <span className="truncate">{event.service_name}</span>
                              <span className="truncate max-w-[70px] text-[10px]">{event.staff_name}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* 3. Popover Tooltip khi Hover vào Event */}
      {hoveredEvent && (
        <div 
          style={{ top: `${tooltipPos.top}px`, left: `${tooltipPos.left}px` }}
          className="fixed z-50 w-72 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl p-3.5 text-xs pointer-events-none animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              hoveredEvent.type === 'walk_in' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
            }`}>
              {hoveredEvent.type === 'walk_in' ? 'Khách vãng lai / Trực tiếp' : 'Khách đặt trước qua lịch'}
            </span>
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {hoveredEvent.start_time} - {hoveredEvent.end_time} ({hoveredEvent.duration_minutes}p)
            </span>
          </div>

          <div className="space-y-1.5 text-slate-600">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Khách hàng:</span>
              <span className="font-bold text-slate-900">{hoveredEvent.customer_name}</span>
            </div>
            {hoveredEvent.customer_phone && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Số điện thoại:</span>
                <span className="font-medium text-slate-700">{hoveredEvent.customer_phone}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Kỹ thuật viên:</span>
              <span className="font-semibold text-slate-800">{hoveredEvent.staff_name}</span>
            </div>
            <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-100">
              <span className="text-slate-400 shrink-0">Dịch vụ:</span>
              <span className="font-semibold text-slate-900 text-right">{hoveredEvent.service_name}</span>
            </div>
            {hoveredEvent.price > 0 && (
              <div className="flex items-center justify-between pt-1 text-pink-600 font-bold">
                <span>Giá dịch vụ:</span>
                <span>{formatVND(hoveredEvent.price)}</span>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
