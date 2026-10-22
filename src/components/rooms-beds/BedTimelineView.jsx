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

export default function BedTimelineView({
  rooms = [],
  beds = [],
  eventsByBedId = {},
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

  const headerScrollRef = useRef(null);
  const bodyScrollRef = useRef(null);

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
    if (bodyScrollRef.current) {
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();
      // Cuộn để khung giờ hiện tại nằm lùi lại 30 phút cho dễ nhìn
      const scrollMins = Math.max(0, nowMins - TIMELINE_START_MINUTES - 30);
      const scrollPx = (scrollMins / SLOT_INTERVAL_MINUTES) * DEFAULT_SLOT_WIDTH_PX;
      bodyScrollRef.current.scrollLeft = scrollPx;
      if (headerScrollRef.current) {
        headerScrollRef.current.scrollLeft = scrollPx;
      }
    }
  }, []);

  // Đồng bộ thanh cuộn giữa header và body
  const handleBodyScroll = () => {
    if (headerScrollRef.current && bodyScrollRef.current) {
      headerScrollRef.current.scrollLeft = bodyScrollRef.current.scrollLeft;
    }
  };

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

  // Trạng thái thẻ giường bên cột trái
  const getBedStatusBadge = (bed) => {
    const events = eventsByBedId[bed.id] || [];
    const activeNow = events.find(e => isToday && currentMinutes >= e.start_minutes && currentMinutes <= e.end_minutes);

    if (activeNow) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Đang phục vụ
        </span>
      );
    }
    if (bed.status === 'cleaning') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Cần dọn dẹp
        </span>
      );
    }
    if (bed.status === 'maintenance') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          Bảo trì
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-50 text-slate-500 border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        Sẵn sàng
      </span>
    );
  };

  return (
    <div className="relative flex flex-col bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden select-none">
      
      {/* 1. Header Toolbar phụ: Chú thích loại khách & Vạch thời gian */}
      <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-slate-500" />
            Chú giải ca:
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200/80 text-sky-800 text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span>Khách đặt trước (Appointment)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Khách vãng lai / Trực tiếp (Walk-in)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200/80 text-rose-800 text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>Ca làm quá giờ (Overtime)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-500 text-[11px] bg-white px-3 py-1 rounded-xl border border-slate-200/80 shadow-2xs">
          <Info className="w-3.5 h-3.5 text-blue-500" />
          <span>Click vào khung giờ trống để <b>Tiếp nhận khách</b> vào giường</span>
        </div>
      </div>

      {/* 2. Bảng Timeline chính gồm Cột Cố định Giường và Lưới Giờ Cuộn Ngang */}
      <div className="flex flex-1 min-h-[520px] max-h-[720px] overflow-hidden">
        
        {/* CỘT CỐ ĐỊNH TRÁI: Danh sách Phòng & Giường (Width: 240px) */}
        <div className="w-[240px] shrink-0 border-r border-slate-200 bg-slate-50/50 flex flex-col z-20">
          
          {/* Header góc trên bên trái (chiều cao h-14 đồng bộ với thước đo giờ) */}
          <div className="h-14 px-4 border-b border-slate-200/90 bg-slate-50/90 backdrop-blur-xs flex items-center justify-between text-xs font-bold text-slate-800">
            <div className="flex items-center gap-2">
              <DoorOpen className="w-4 h-4 text-blue-600" />
              <span>Phòng & Giường</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
              {beds.length} vị trí
            </span>
          </div>

          {/* Danh sách phòng & giường (cuộn đồng bộ theo trục dọc) */}
          <div className="flex-1 overflow-hidden overflow-y-auto divide-y divide-slate-100">
            {filteredRooms.map(room => {
              const roomBeds = bedsByRoom[room.id] || [];
              if (roomBeds.length === 0) return null;

              return (
                <div key={room.id} className="bg-white">
                  {/* Tiêu đề phòng */}
                  <div className="px-3.5 py-2 bg-slate-100/60 border-b border-slate-200/60 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
                      <DoorOpen className="w-3.5 h-3.5 text-pink-600" />
                      {room.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {roomBeds.length} giường
                    </span>
                  </div>

                  {/* Danh sách các giường trong phòng */}
                  {roomBeds.map(bed => (
                    <div 
                      key={bed.id}
                      onClick={() => onBedClick && onBedClick(bed, room)}
                      className="h-16 px-3.5 py-2 border-b border-slate-100 flex flex-col justify-center hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {bed.name}
                        </span>
                        {getBedStatusBadge(bed)}
                      </div>
                      <span className="text-[10px] text-slate-400 truncate mt-0.5">
                        {bed.display_name || bed.code || `${room.name} • ${bed.name}`}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Giường chưa phân phòng nếu có */}
            {bedsByRoom['__unassigned'] && bedsByRoom['__unassigned'].length > 0 && (
              <div className="bg-white">
                <div className="px-3.5 py-2 bg-slate-100/60 border-b border-slate-200/60">
                  <span className="text-xs font-bold text-slate-700">Chưa gán phòng</span>
                </div>
                {bedsByRoom['__unassigned'].map(bed => (
                  <div 
                    key={bed.id}
                    onClick={() => onBedClick && onBedClick(bed, null)}
                    className="h-16 px-3.5 py-2 border-b border-slate-100 flex flex-col justify-center hover:bg-slate-50 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800 truncate">{bed.name}</span>
                      {getBedStatusBadge(bed)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* KHU VỰC CUỘN NGANG TRỤC THỜI GIAN (X-Axis & Timeline Content) */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* Header Giờ (Scroll đồng bộ, chiều cao h-14, thiết kế hiện đại) */}
          <div 
            ref={headerScrollRef}
            className="h-14 border-b border-slate-200/90 bg-slate-50/90 backdrop-blur-xs overflow-x-hidden shrink-0 relative"
          >
            <div 
              className="h-full flex" 
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
            </div>

            {/* Vạch đỏ chỉ giờ thực tại Header (Capsule dạ quang đẹp mắt) */}
            {currentLineLeftPx !== null && (
              <div 
                className="absolute top-0 bottom-0 z-40 pointer-events-none transition-all duration-300"
                style={{ left: `${currentLineLeftPx}px` }}
              >
                {/* Floating Glow Pill */}
                <div className="absolute top-2.5 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-full shadow-md shadow-rose-500/30 ring-2 ring-white whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <span>{formatMinutesToString(currentMinutes)}</span>
                </div>
                <div className="w-0.5 h-full bg-rose-500 mx-auto" />
              </div>
            )}
          </div>

          {/* Lưới các giường và sự kiện (Cuộn dọc & ngang) */}
          <div 
            ref={bodyScrollRef}
            onScroll={handleBodyScroll}
            className="flex-1 overflow-auto relative bg-white"
          >
            <div 
              className="relative" 
              style={{ width: `${totalGridWidthPx + DEFAULT_SLOT_WIDTH_PX}px` }}
            >
              {/* Vạch đỏ chỉ giờ hiện tại chạy dọc toàn bộ timeline với hiệu ứng viền bóng mờ */}
              {currentLineLeftPx !== null && (
                <div 
                  className="absolute top-0 bottom-0 z-20 pointer-events-none transition-all duration-300"
                  style={{ left: `${currentLineLeftPx}px` }}
                >
                  <div className="w-0.5 h-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.45)]" />
                </div>
              )}

              {/* Render từng nhóm phòng & giường */}
              {filteredRooms.map(room => {
                const roomBeds = bedsByRoom[room.id] || [];
                if (roomBeds.length === 0) return null;

                return (
                  <div key={room.id} className="relative">
                    
                    {/* Hàng Header ngăn cách phòng */}
                    <div className="h-8 bg-slate-50/90 border-b border-slate-200/60 flex items-center px-4 sticky left-0 z-10">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        {room.name}
                      </span>
                    </div>

                    {/* Hàng timeline của từng giường */}
                    {roomBeds.map(bed => {
                      const events = eventsByBedId[bed.id] || [];

                      return (
                        <div 
                          key={bed.id}
                          className="h-16 border-b border-slate-100 flex relative group"
                        >
                          {/* Lưới các slot 30 phút rỗng */}
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
                                {/* Icon cộng mờ khi hover vào slot trống */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-20 hover:!opacity-100 transition-opacity">
                                  <Plus className="w-4 h-4 text-blue-600" />
                                </div>
                              </div>
                            );
                          })}

                          {/* Render các khối sự kiện của giường */}
                          {events.map(event => {
                            const pos = calculateTimelinePosition(event, TIMELINE_START_MINUTES, DEFAULT_SLOT_WIDTH_PX, SLOT_INTERVAL_MINUTES);
                            if (!pos.isVisible) return null;

                            const isWalkIn = event.type === 'walk_in';
                            const isOvertime = event.is_overtime;

                            // Theme màu theo loại sự kiện (Tuân thủ nguyên tắc không dùng màu tím)
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
                                {/* Dòng 1: Badge phân loại + Tên khách + Giờ */}
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
                      );
                    })}
                  </div>
                );
              })}

            </div>
          </div>
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
