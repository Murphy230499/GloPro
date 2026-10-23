'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Clock, User, Scissors, Plus, AlertCircle, Phone, Sparkles, 
  DoorOpen, CheckCircle2, Layers, Filter, Info
} from 'lucide-react';
import { useT } from '@/lib/i18n';
import Avatar from '@/components/Avatar';
import { formatVND } from '@/lib/format';
import BedHoverCard from '@/components/rooms-beds/BedHoverCard';
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
  staff = [],
  selectedDate = getTodayDateString(),
  selectedRoomId = 'all',
  onSelectEvent,
  onEmptySlotClick,
  onBedClick,
  onTransferRoom,
  onStartServing,
  onCheckout,
  onReleaseBed,
  onFinishCleaning
}) {
  const { t } = useT();

  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });
  const [hoverCardState, setHoverCardState] = useState(null);
  const hoverTimerRef = useRef(null);
  const isMouseInsideHoverCardRef = useRef(false);

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

  // Đóng hover card khi scroll timeline (nếu chuột không ở trong card)
  useEffect(() => {
    const handleScroll = () => {
      if (!isMouseInsideHoverCardRef.current) {
        setHoverCardState(null);
      }
    };
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll, { passive: true });
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Xác định trạng thái của sự kiện trên timeline
  const getTimelineEventStatus = (event, bed) => {
    // 0. Nếu sự kiện đã hoàn tất hoặc là phiên lịch sử đã trả phòng
    if (event.status === 'completed' || event.type === 'completed_session') {
      return 'completed';
    }

    const session = bedSessions[bed?.id] || 
                    (bed?.db_id && bedSessions[bed.db_id]) ||
                    (bed?.id && ensureValidUuid(bed.id) && bedSessions[ensureValidUuid(bed.id)]);

    const isCurrentSessionEvent = session && (
      (event.type === 'walk_in' && (String(event.originalId) === String(session.id) || !session.appointment_id)) ||
      (session.appointment_id && String(event.originalId) === String(session.appointment_id)) ||
      (isToday && currentMinutes >= event.start_minutes && currentMinutes <= event.end_minutes)
    );

    if (isCurrentSessionEvent && session?.status) {
      if (session.status === 'completed') return 'completed';
      if (session.status === 'overtime' || event.is_overtime) return 'overtime';
      if (session.status === 'nearly_finished') return 'nearly_finished';
      if (session.status === 'cleaning') return 'cleaning';
      if (session.status === 'waiting') return 'waiting';
      if (session.status === 'in_progress') return 'in_progress';
    }

    if (event.is_overtime) return 'overtime';

    if (isToday) {
      if (currentMinutes >= event.start_minutes && currentMinutes <= event.end_minutes) {
        const remaining = event.end_minutes - currentMinutes;
        if (remaining <= 10) return 'nearly_finished';
        return 'in_progress';
      }
      if (currentMinutes > event.end_minutes) {
        return 'completed';
      }
    }

    if (event.type === 'appointment' || event.status === 'reserved' || event.status === 'confirmed') {
      return 'reserved';
    }

    if (event.status === 'in_progress') return 'in_progress';

    return 'in_progress';
  };

  // Màu sắc và giao diện của block timeline đồng bộ chuẩn với trạng thái thực tế
  const getTimelineEventTheme = (status, eventType) => {
    switch (status) {
      case 'overtime':
        return {
          status,
          label: 'QUÁ GIỜ',
          container: 'bg-rose-50 border-rose-400 text-rose-950 hover:bg-rose-100 shadow-xs animate-pulse ring-1 ring-rose-300',
          badge: 'bg-rose-200/90 text-rose-900 border border-rose-300',
          dot: 'bg-rose-500 animate-ping'
        };
      case 'nearly_finished':
        return {
          status,
          label: 'SẮP TRỐNG',
          container: 'bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100 shadow-xs',
          badge: 'bg-amber-200/90 text-amber-900 border border-amber-300',
          dot: 'bg-amber-500'
        };
      case 'cleaning':
        return {
          status,
          label: 'DỌN DẸP',
          container: 'bg-teal-50 border-teal-300 text-teal-950 hover:bg-teal-100 shadow-xs',
          badge: 'bg-teal-200/90 text-teal-900 border border-teal-300',
          dot: 'bg-teal-500'
        };
      case 'waiting':
        return {
          status,
          label: 'CHỜ PHỤC VỤ',
          container: 'bg-blue-50 border-blue-300 text-blue-950 hover:bg-blue-100 shadow-xs',
          badge: 'bg-blue-200/90 text-blue-900 border border-blue-300',
          dot: 'bg-blue-500'
        };
      case 'in_progress':
        return {
          status,
          label: eventType === 'walk_in' ? 'VÃNG LAI' : 'ĐANG BẬN',
          container: 'bg-rose-50 border-rose-300 text-rose-950 hover:bg-rose-100 shadow-xs',
          badge: 'bg-rose-200/90 text-rose-900 border border-rose-300',
          dot: 'bg-rose-500 animate-pulse'
        };
      case 'completed':
        return {
          status,
          label: 'ĐÃ TRẢ PHÒNG',
          container: 'bg-slate-100/95 border-slate-300 text-slate-800 hover:bg-slate-200/80 shadow-2xs opacity-90',
          badge: 'bg-slate-200 text-slate-700 border border-slate-300 font-semibold',
          dot: 'bg-emerald-500'
        };
      case 'reserved':
      default:
        return {
          status: 'reserved',
          label: 'ĐẶT TRƯỚC',
          container: 'bg-sky-50 border-sky-300 text-sky-950 hover:bg-sky-100 shadow-xs',
          badge: 'bg-sky-200/90 text-sky-900 border border-sky-300',
          dot: 'bg-sky-500'
        };
    }
  };

  // Hover handlers mở BedHoverCard thông minh
  const handleEventMouseEnter = (e, event, bed, room) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const cardWidth = 380;
    const cardEstimatedHeight = 440;

    const spaceAbove = rect.top;
    const spaceBelow = vh - rect.bottom;

    let top = rect.bottom + 8;
    let maxHeight = 480;

    if (spaceBelow >= cardEstimatedHeight) {
      top = rect.bottom + 8;
      maxHeight = Math.min(520, spaceBelow - 16);
    } else if (spaceAbove >= cardEstimatedHeight) {
      top = Math.max(12, rect.top - cardEstimatedHeight - 8);
      maxHeight = Math.min(520, spaceAbove - 16);
    } else if (spaceBelow >= spaceAbove) {
      top = rect.bottom + 8;
      maxHeight = Math.max(260, spaceBelow - 16);
    } else {
      top = Math.max(12, rect.top - cardEstimatedHeight - 8);
      maxHeight = Math.max(260, spaceAbove - 16);
    }

    let left = rect.left + rect.width / 2 - cardWidth / 2;
    if (left < 16) left = 16;
    if (left + cardWidth > vw - 16) {
      left = vw - cardWidth - 16;
    }

    const activeSession = bedSessions[bed?.id] || 
                          (bed?.db_id && bedSessions[bed.db_id]) ||
                          (bed?.id && ensureValidUuid(bed.id) && bedSessions[ensureValidUuid(bed.id)]);

    const isCompleted = event.status === 'completed' || event.type === 'completed_session';
    const isCurrentSessionEvent = !isCompleted && activeSession && (
      (event.type === 'walk_in' && (String(event.originalId) === String(activeSession.id) || !activeSession.appointment_id)) ||
      (activeSession.appointment_id && String(event.originalId) === String(activeSession.appointment_id)) ||
      (isToday && currentMinutes >= event.start_minutes && currentMinutes <= event.end_minutes)
    );

    const finalSession = isCurrentSessionEvent ? activeSession : {
      id: event.originalId || event.id,
      customer_id: event.customer_id,
      customer_name: event.customer_name,
      customer_phone: event.customer_phone,
      customer: {
        id: event.customer_id,
        name: event.customer_name,
        phone: event.customer_phone
      },
      services: event.services || [{ 
        service_name: event.service_name, 
        staff_name: event.staff_name, 
        price: event.price || 0 
      }],
      service_name: event.service_name,
      staff_name: event.staff_name,
      staff_id: event.staff_id,
      start_time: event.start_time,
      end_time: event.end_time,
      duration_minutes: event.duration_minutes,
      price: event.price || 0,
      status: isCompleted ? 'completed' : (event.type === 'appointment' ? 'reserved' : (event.status || 'in_progress')),
      elapsed_minutes: Math.max(0, currentMinutes - event.start_minutes),
      remaining_minutes: Math.max(0, event.end_minutes - currentMinutes),
      progress_percent: isCompleted ? 100 : (
        event.duration_minutes > 0 
          ? Math.min(100, Math.max(0, Math.round(((currentMinutes - event.start_minutes) / event.duration_minutes) * 100))) 
          : 0
      )
    };

    const status = getTimelineEventStatus(event, bed);

    setHoverCardState({
      event,
      bed,
      room,
      session: finalSession,
      status,
      pos: { top, left, maxHeight }
    });
  };

  const handleEventMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      if (!isMouseInsideHoverCardRef.current) {
        setHoverCardState(null);
      }
    }, 220);
  };

  // Tính toán màu sắc và trạng thái của giường đồng bộ chính xác với Sơ đồ dạng lưới
  // SỬ DỤNG MÀU NỀN ĐẬM ĐẶC (SOLID OPAQUE) để khi scroll ngang, các block bên dưới hoàn toàn không bị đè lên
  const getBedRealtimeStatusInfo = (bed) => {
    if (!bed) {
      return {
        bgClass: 'bg-white',
        borderLeft: 'border-l-4 border-l-slate-300',
        badgeBg: 'bg-slate-100 text-slate-600',
        dotColor: 'bg-slate-400',
        text: 'KHÔNG XÁC ĐỊNH'
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

    // A. Quá giờ (Fuchsia/Rose)
    if (isOvertime || activeEventNow?.is_overtime) {
      return {
        bgClass: 'bg-[#FDF2F8] hover:bg-[#FCE7F3]',
        borderLeft: 'border-l-4 border-l-rose-500',
        badgeBg: 'bg-rose-100 text-rose-900 border border-rose-300/80',
        dotColor: 'bg-rose-500 animate-ping',
        text: 'QUÁ GIỜ'
      };
    }

    // B. Sắp trống (Amber)
    if (isNearlyFinished) {
      return {
        bgClass: 'bg-[#FFFBEB] hover:bg-[#FEF3C7]',
        borderLeft: 'border-l-4 border-l-amber-500',
        badgeBg: 'bg-amber-100 text-amber-900 border border-amber-300/80',
        dotColor: 'bg-amber-500',
        text: 'SẮP TRỐNG'
      };
    }

    // C. Đang dọn dẹp (Teal)
    if (isCleaning) {
      return {
        bgClass: 'bg-[#F0FDFA] hover:bg-[#CCFBF1]',
        borderLeft: 'border-l-4 border-l-teal-500',
        badgeBg: 'bg-teal-100 text-teal-800 border border-teal-300/80',
        dotColor: 'bg-teal-500',
        text: 'ĐANG DỌN DẸP'
      };
    }

    // D. Chờ phục vụ (Blue)
    if (isWaiting) {
      return {
        bgClass: 'bg-[#EFF6FF] hover:bg-[#DBEAFE]',
        borderLeft: 'border-l-4 border-l-blue-500',
        badgeBg: 'bg-blue-100 text-blue-800 border border-blue-300/80',
        dotColor: 'bg-blue-500',
        text: 'CHỜ PHỤC VỤ'
      };
    }

    // E. Đặt trước (Amber)
    if (isReserved) {
      return {
        bgClass: 'bg-[#FFFBEB] hover:bg-[#FEF3C7]',
        borderLeft: 'border-l-4 border-l-amber-500',
        badgeBg: 'bg-amber-100 text-amber-800 border border-amber-300/80',
        dotColor: 'bg-amber-500',
        text: 'ĐẶT TRƯỚC'
      };
    }

    // F. Đang bận (Rose)
    if (isOccupied || activeEventNow) {
      return {
        bgClass: 'bg-[#FFF1F2] hover:bg-[#FFE4E6]',
        borderLeft: 'border-l-4 border-l-rose-500',
        badgeBg: 'bg-rose-100 text-rose-800 border border-rose-300/80',
        dotColor: 'bg-rose-500 animate-pulse',
        text: 'ĐANG BẬN'
      };
    }

    // G. Giường trống có lịch hẹn sắp tới
    if (windowInfo?.hasNextAppt) {
      if (windowInfo.availableMinutes <= 0) {
        return {
          bgClass: 'bg-[#FFFBEB] hover:bg-[#FEF3C7]',
          borderLeft: 'border-l-4 border-l-amber-400',
          badgeBg: 'bg-amber-100 text-amber-900 border border-amber-300/80',
          dotColor: 'bg-amber-500',
          text: `HẸN ${windowInfo.availableUntil}`
        };
      }
      return {
        bgClass: 'bg-[#F0FDF4] hover:bg-[#DCFCE7]',
        borderLeft: 'border-l-4 border-l-emerald-500',
        badgeBg: 'bg-emerald-100 text-emerald-900 border border-emerald-300/80',
        dotColor: 'bg-emerald-500',
        text: `TRỐNG ĐẾN ${windowInfo.availableUntil}`
      };
    }

    // H. Đang trống (Emerald)
    return {
      bgClass: 'bg-[#F0FDF4] hover:bg-[#DCFCE7]',
      borderLeft: 'border-l-4 border-l-emerald-500',
      badgeBg: 'bg-emerald-100 text-emerald-800 border border-emerald-300/70',
      dotColor: 'bg-emerald-500',
      text: 'ĐANG TRỐNG'
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
            Sắp trống
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
            <span className="w-2.5 h-2.5 rounded bg-slate-200 border border-slate-400 ml-1.5" />
            <span>Đã trả phòng</span>
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
          <div className="sticky top-0 z-30 flex h-14 bg-slate-50 border-b border-slate-200/90">
            {/* Ô góc trên bên trái: Phòng & Giường (Dính cả Top lẫn Left) */}
            <div className="w-[240px] shrink-0 sticky left-0 z-40 bg-slate-50 border-r border-slate-200 px-4 flex items-center justify-between text-xs font-bold text-slate-800 shadow-[4px_0_12px_-2px_rgba(0,0,0,0.08)]">
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
                {/* Hàng Tiêu đề Phòng (Sticky Header góc trái z-25, nền solid) */}
                <div className="flex h-8 bg-slate-100 border-b border-slate-200/80">
                  <div className="w-[240px] shrink-0 sticky left-0 z-25 bg-slate-100 border-r border-slate-200/80 px-3.5 flex items-center justify-between shadow-[4px_0_12px_-2px_rgba(0,0,0,0.08)]">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
                      <DoorOpen className="w-3.5 h-3.5 text-blue-600" />
                      {room.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {roomBeds.length} giường
                    </span>
                  </div>
                  <div className="flex-1 bg-slate-100/60 flex items-center px-4">
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
                      {/* Cột Tên Giường (Sticky Left z-20, nền màu đặc Opaque, che hoàn toàn block timeline khi kéo ngang) */}
                      {(() => {
                        const statusInfo = getBedRealtimeStatusInfo(bed);
                        return (
                          <div 
                            onClick={() => onBedClick && onBedClick(bed, room)}
                            className={`w-[240px] shrink-0 sticky left-0 z-20 border-r border-slate-200/90 px-3.5 py-2 flex flex-col justify-center cursor-pointer transition-colors shadow-[4px_0_12px_-2px_rgba(0,0,0,0.08)] ${statusInfo.bgClass} ${statusInfo.borderLeft}`}
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
                              {bed.display_name || (room ? `${room.name} • ${bed.name}` : bed.name)}
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

                          const eventStatus = getTimelineEventStatus(event, bed);
                          const eventTheme = getTimelineEventTheme(eventStatus, event.type);

                          return (
                            <div
                              key={event.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectEvent) onSelectEvent(event, bed, room);
                              }}
                              onMouseEnter={(e) => handleEventMouseEnter(e, event, bed, room)}
                              onMouseLeave={handleEventMouseLeave}
                              style={{
                                left: `${pos.left}px`,
                                width: `${pos.width}px`
                              }}
                              className={`absolute top-1.5 bottom-1.5 rounded-xl border p-2 flex flex-col justify-between overflow-hidden cursor-pointer transition-all z-10 ${eventTheme.container}`}
                            >
                              {/* Dòng 1: Badge Trạng thái + Tên khách + Giờ */}
                              <div className="flex items-center justify-between gap-1.5 overflow-hidden">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 ${eventTheme.badge}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${eventTheme.dot}`} />
                                    <span>{eventTheme.label}</span>
                                  </span>
                                  <span className="font-bold text-xs truncate">
                                    {event.customer_name}
                                  </span>
                                </div>

                                <span className="text-[10px] font-semibold opacity-85 shrink-0 flex items-center gap-0.5">
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

                                <div className="flex items-center gap-1 shrink-0 text-[10px] bg-white/70 px-1.5 py-0.5 rounded-md font-semibold border border-black/5">
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
              <div className="flex h-8 bg-slate-100 border-b border-slate-200/80">
                <div className="w-[240px] shrink-0 sticky left-0 z-25 bg-slate-100 border-r border-slate-200/80 px-3.5 flex items-center justify-between shadow-[4px_0_12px_-2px_rgba(0,0,0,0.08)]">
                  <span className="text-xs font-bold text-slate-700">Chưa gán phòng</span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {bedsByRoom['__unassigned'].length} giường
                  </span>
                </div>
                <div className="flex-1 bg-slate-100/60 flex items-center px-4">
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
                          className={`w-[240px] shrink-0 sticky left-0 z-20 border-r border-slate-200/90 px-3.5 py-2 flex flex-col justify-center cursor-pointer transition-colors shadow-[4px_0_12px_-2px_rgba(0,0,0,0.08)] ${statusInfo.bgClass} ${statusInfo.borderLeft}`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-slate-900 truncate">{bed.name}</span>
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider shrink-0 ${statusInfo.badgeBg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
                              <span>{statusInfo.text}</span>
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                            {bed.display_name || bed.code || bed.name}
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
                        const eventStatus = getTimelineEventStatus(event, bed);
                        const eventTheme = getTimelineEventTheme(eventStatus, event.type);
                        return (
                          <div 
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectEvent) onSelectEvent(event, bed, null);
                            }}
                            onMouseEnter={(e) => handleEventMouseEnter(e, event, bed, null)}
                            onMouseLeave={handleEventMouseLeave}
                            style={{ left: `${pos.left}px`, width: `${pos.width}px` }}
                            className={`absolute top-1.5 bottom-1.5 rounded-xl border p-2 flex flex-col justify-between overflow-hidden cursor-pointer transition-all z-10 ${eventTheme.container}`}
                          >
                            <div className="flex items-center justify-between gap-1.5 overflow-hidden">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 ${eventTheme.badge}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${eventTheme.dot}`} />
                                  <span>{eventTheme.label}</span>
                                </span>
                                <span className="font-bold text-xs truncate">{event.customer_name}</span>
                              </div>
                              <span className="text-[10px] font-semibold opacity-85 shrink-0 flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {event.start_time} - {event.end_time}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] opacity-90 truncate gap-2">
                              <span className="truncate">{event.service_name}</span>
                              <span className="truncate max-w-[70px] text-[10px] bg-white/70 px-1.5 py-0.5 rounded-md font-semibold border border-black/5">{event.staff_name}</span>
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

      {/* 3. Popover BedHoverCard tương tự như bên View theo dạng lưới */}
      {hoverCardState && (
        <div 
          style={{ 
            top: `${hoverCardState.pos.top}px`, 
            left: `${hoverCardState.pos.left}px`,
            maxHeight: `${hoverCardState.pos.maxHeight}px`
          }}
          className="fixed z-[100] pointer-events-auto"
          onMouseEnter={() => {
            isMouseInsideHoverCardRef.current = true;
            if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
          }}
          onMouseLeave={() => {
            isMouseInsideHoverCardRef.current = false;
            hoverTimerRef.current = setTimeout(() => {
              setHoverCardState(null);
            }, 200);
          }}
        >
          <BedHoverCard
            bed={hoverCardState.bed}
            room={hoverCardState.room}
            session={hoverCardState.session}
            status={hoverCardState.status}
            cleaningInfo={hoverCardState.session?.cleaning_info}
            staff={staff}
            maxHeight={hoverCardState.pos.maxHeight}
            onMouseEnter={() => {
              isMouseInsideHoverCardRef.current = true;
              if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
            }}
            onMouseLeave={() => {
              isMouseInsideHoverCardRef.current = false;
              hoverTimerRef.current = setTimeout(() => {
                setHoverCardState(null);
              }, 200);
            }}
            onTransferRoom={(b, s) => {
              if (onTransferRoom) onTransferRoom(b, s, hoverCardState.room);
              setHoverCardState(null);
              isMouseInsideHoverCardRef.current = false;
            }}
            onStartServing={(b, s) => {
              if (onStartServing) onStartServing(b, s);
              setHoverCardState(null);
              isMouseInsideHoverCardRef.current = false;
            }}
            onCheckout={(b, s) => {
              if (onCheckout) onCheckout(b, s);
              setHoverCardState(null);
              isMouseInsideHoverCardRef.current = false;
            }}
            onReleaseBed={(b, s) => {
              if (onReleaseBed) onReleaseBed(b, s);
              setHoverCardState(null);
              isMouseInsideHoverCardRef.current = false;
            }}
            onFinishCleaning={(b) => {
              if (onFinishCleaning) onFinishCleaning(b);
              setHoverCardState(null);
              isMouseInsideHoverCardRef.current = false;
            }}
          />
        </div>
      )}

    </div>
  );
}
