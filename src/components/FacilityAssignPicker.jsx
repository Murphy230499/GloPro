'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronDown, Check, X, Search, Lock, AlertCircle, Sparkles, Building2 } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { useBranch } from '@/lib/BranchContext';
import { toast } from '@/components/Layout';
import { 
  DEFAULT_FACILITIES, 
  INITIAL_DEMO_ROOMS, 
  INITIAL_DEMO_BEDS, 
  timeStringToMinutes, 
  formatMinutesToTime 
} from '@/components/appointments/constants';
import { BED_BUFFER_MINUTES, calculateBedAvailableWindow } from '@/lib/bedConflictHelper';
import { base44 } from '@/api/base44Client';
import { getTenantStorageKey } from '@/lib/tenantManager';

/**
 * FacilityAssignPicker
 * Component chọn vị trí giường / phòng trực quan từ màn hình Thu ngân (POS).
 * 
 * Tính năng chính:
 * 1. Kiểm tra thời gian thực trạng thái tại Sơ đồ giường phòng:
 *    - Đang trống (🟢 Available): CÓ THỂ CHỌN
 *    - Trống có lịch hẹn sắp tới (🟢 Trống đến HH:mm): CÓ THỂ CHỌN nếu đủ thời gian
 *    - Đang bận (🔴 In Progress / Occupied): KHÔNG THỂ CHỌN (Disabled)
 *    - Sắp xong (🟡 Nearly Finished <= 10 phút): KHÔNG THỂ CHỌN (Disabled)
 * 2. Hiển thị badge trạng thái, thời gian dự kiến xong, thông tin khách đang phục vụ.
 * 3. Gom nhóm theo từng Phòng (Room) rõ ràng, hỗ trợ tìm kiếm nhanh theo tên giường / phòng.
 */
export default function FacilityAssignPicker({
  value = '',
  onChange,
  facilities = [],
  placeholder,
  disabled = false,
  className = '',
  showRoomGroup = true,
  hideClear = false,
  buttonSize = 'sm' // 'xs' | 'sm' | 'md'
}) {
  const { t } = useT();
  const { currentBranchId } = useBranch();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUp: false });
  const [searchQ, setSearchQ] = useState('');
  const [nowMinutes, setNowMinutes] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  const buttonRef = useRef(null);

  // 1. Data states
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [bedSessions, setBedSessions] = useState({});
  const [appointments, setAppointments] = useState([]);

  // 2. Đồng bộ dữ liệu giường, phòng và phiên hoạt động từ Bed/Room Management
  const syncData = async () => {
    try {
      const branchKey = currentBranchId || 'all';

      // Load Rooms
      let loadedRooms = [];
      const unifiedRoomsKey = getTenantStorageKey('gp_rooms');
      const branchRoomsKey = getTenantStorageKey('gp_rooms', branchKey);
      const savedRooms = localStorage.getItem(unifiedRoomsKey) || localStorage.getItem(branchRoomsKey);
      if (savedRooms) {
        try { loadedRooms = JSON.parse(savedRooms); } catch (e) {}
      }
      if (!loadedRooms || loadedRooms.length === 0) {
        loadedRooms = INITIAL_DEMO_ROOMS;
      }
      // Filter strictly by branch if a specific branch is selected
      if (branchKey && branchKey !== 'all') {
        loadedRooms = loadedRooms.filter(r => !r.branch_id || r.branch_id === branchKey);
      }
      setRooms(loadedRooms);

      // Load Beds
      let loadedBeds = facilities && facilities.length > 0 ? facilities : [];
      if (!loadedBeds || loadedBeds.length === 0) {
        const unifiedBedsKey = getTenantStorageKey('gp_facilities');
        const branchBedsKey = getTenantStorageKey('gp_facilities', branchKey);
        const savedBeds = localStorage.getItem(unifiedBedsKey) || localStorage.getItem(branchBedsKey);
        if (savedBeds) {
          try { loadedBeds = JSON.parse(savedBeds); } catch (e) {}
        }
      }
      if (!loadedBeds || loadedBeds.length === 0) {
        loadedBeds = INITIAL_DEMO_BEDS;
      }
      // Filter strictly by branch if a specific branch is selected
      if (branchKey && branchKey !== 'all') {
        loadedBeds = loadedBeds.filter(b => !b.branch_id || b.branch_id === branchKey);
      }
      setBeds(loadedBeds);

      // Load Active Bed Sessions
      const sessionMap = {};
      const sessionsKey = getTenantStorageKey('gp_active_bed_sessions', branchKey);
      const savedSessions = localStorage.getItem(sessionsKey);
      if (savedSessions) {
        try { Object.assign(sessionMap, JSON.parse(savedSessions)); } catch (e) {}
      }
      setBedSessions(sessionMap);

      // Load Today Appointments for conflict check
      let loadedAppts = [];
      const apptsKey = getTenantStorageKey('gp_today_appointments', branchKey);
      const cachedAppts = localStorage.getItem(apptsKey);
      if (cachedAppts) {
        try { loadedAppts = JSON.parse(cachedAppts); } catch (e) {}
      }
      if (loadedAppts.length === 0 && base44.entities.Appointment) {
        base44.entities.Appointment.filter(branchKey === 'all' ? {} : { branch_id: branchKey })
          .then(res => {
            if (Array.isArray(res)) {
              setAppointments(res);
              localStorage.setItem(apptsKey, JSON.stringify(res));
            }
          })
          .catch(() => {});
      } else {
        setAppointments(loadedAppts);
      }
    } catch (err) {
      console.warn('FacilityAssignPicker syncData error:', err);
    }
  };

  useEffect(() => {
    syncData();
  }, [currentBranchId, facilities]);

  // Lắng nghe các sự kiện cập nhật giường phòng trên toàn hệ thống
  useEffect(() => {
    const handleSyncEvent = () => syncData();
    window.addEventListener('gp_bed_session_checkout_completed', handleSyncEvent);
    window.addEventListener('gp_bed_session_updated', handleSyncEvent);
    window.addEventListener('gp_appointment_updated', handleSyncEvent);
    window.addEventListener('storage', handleSyncEvent);

    // Cập nhật đồng hồ mỗi 15 giây
    const interval = setInterval(() => {
      const d = new Date();
      setNowMinutes(d.getHours() * 60 + d.getMinutes());
      syncData();
    }, 15000);

    return () => {
      window.removeEventListener('gp_bed_session_checkout_completed', handleSyncEvent);
      window.removeEventListener('gp_bed_session_updated', handleSyncEvent);
      window.removeEventListener('gp_appointment_updated', handleSyncEvent);
      window.removeEventListener('storage', handleSyncEvent);
      clearInterval(interval);
    };
  }, [currentBranchId]);

  // 3. Tính toán trạng thái chi tiết của từng giường
  const enrichedBeds = useMemo(() => {
    return beds.map(b => {
      const session = bedSessions[b.id];
      if (!session) {
        // Kiểm tra xem giường này có lịch hẹn nào sắp tới trong ngày không
        const windowInfo = calculateBedAvailableWindow(b.id, appointments, nowMinutes, BED_BUFFER_MINUTES);

        if (windowInfo.hasNextAppt) {
          if (windowInfo.availableMinutes <= 0) {
            // Khách hẹn sắp đến trong vòng 15 phút (hoặc quá giờ hẹn) -> Khóa không cho chọn
            return {
              ...b,
              status: 'nearly_finished',
              statusLabel: 'Sắp có hẹn',
              badgeText: `SẮP CÓ HẸN (${windowInfo.availableUntil})`,
              badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
              dotClass: 'bg-amber-500 animate-pulse',
              selectable: false, // Không thể chọn
              details: `Khách hẹn: ${windowInfo.nextAppt.customer_name || 'Khách đặt trước'} (${windowInfo.availableUntil})`,
              remainingMinutes: 0
            };
          }

          // Giường trống nhưng có hẹn kế tiếp -> Hiển thị thời gian khả dụng
          return {
            ...b,
            status: 'available_window',
            statusLabel: 'Đang trống',
            badgeText: `Trống đến ${windowInfo.availableUntil} (~${windowInfo.availableMinutes}p)`,
            badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
            dotClass: 'bg-emerald-500',
            selectable: true,
            details: `Hẹn kế tiếp: ${windowInfo.availableUntil} (${windowInfo.nextAppt.customer_name || 'Khách hẹn'})`,
            remainingMinutes: windowInfo.availableMinutes,
            availableUntil: windowInfo.availableUntil
          };
        }

        return {
          ...b,
          status: 'available',
          statusLabel: 'Đang trống',
          badgeText: t('rooms_beds.status_available', 'ĐANG TRỐNG'),
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          dotClass: 'bg-emerald-500',
          selectable: true,
          details: 'Trống cả ngày',
          remainingMinutes: 999
        };
      }

      const startMins = timeStringToMinutes(session.start_time);
      const totalDur = session.total_duration_minutes || 60;
      const endMins = startMins + totalDur;
      const remainingMins = Math.max(0, endMins - nowMinutes);

      // Quy tắc: Còn <= 10 phút là Sắp trống (Nearly finished)
      if (remainingMins <= 10) {
        const timeDesc = remainingMins > 0 ? `Còn ~${remainingMins}p` : 'Quá giờ';
        return {
          ...b,
          status: 'nearly_finished',
          statusLabel: 'Sắp xong',
          badgeText: `${t('rooms_beds.status_nearly_finished', 'SẮP XONG')} (${timeDesc})`,
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
          dotClass: 'bg-amber-500 animate-pulse',
          selectable: false, // Người dùng KHÔNG THỂ CHỌN
          details: session.customer_name ? `Khách: ${session.customer_name}` : 'Đang hoàn thành',
          endTime: session.end_time || formatMinutesToTime(endMins),
          remainingMinutes: remainingMins,
          customerName: session.customer_name
        };
      }

      // Còn > 10 phút là Đang bận (In progress)
      return {
        ...b,
        status: 'in_progress',
        statusLabel: 'Đang bận',
        badgeText: `${t('rooms_beds.status_occupied', 'ĐANG BẬN')} (Xong ${session.end_time || formatMinutesToTime(endMins)})`,
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
        dotClass: 'bg-rose-500',
        selectable: false, // Người dùng KHÔNG THỂ CHỌN
        details: session.customer_name ? `Khách: ${session.customer_name}` : 'Đang phục vụ',
        endTime: session.end_time || formatMinutesToTime(endMins),
        remainingMinutes: remainingMins,
        customerName: session.customer_name
      };
    });
  }, [beds, bedSessions, nowMinutes, t]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    let available = 0;
    let nearly = 0;
    let busy = 0;
    enrichedBeds.forEach(b => {
      if (b.status === 'available') available++;
      else if (b.status === 'nearly_finished') nearly++;
      else busy++;
    });
    return { available, nearly, busy, total: enrichedBeds.length };
  }, [enrichedBeds]);

  // Giường đang được chọn
  const selectedBed = useMemo(() => {
    if (!value) return null;
    return enrichedBeds.find(b => b.id === value || b.name === value || b.display_name === value);
  }, [value, enrichedBeds]);

  // Danh sách giường lọc theo tìm kiếm và gom theo phòng
  const groupedBeds = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    const filtered = enrichedBeds.filter(b => {
      if (!q) return true;
      const bName = (b.name || '').toLowerCase();
      const rName = (b.room_name || '').toLowerCase();
      const cName = (b.customerName || '').toLowerCase();
      const stName = (b.statusLabel || '').toLowerCase();
      return bName.includes(q) || rName.includes(q) || cName.includes(q) || stName.includes(q);
    });

    if (!showRoomGroup) {
      return [{ room: null, beds: filtered }];
    }

    // Nhóm theo Room
    const roomMap = new Map();
    rooms.forEach(r => roomMap.set(r.id, { room: r, beds: [] }));
    const defaultGroup = { room: { id: '__other', name: 'Vị trí khác' }, beds: [] };

    filtered.forEach(b => {
      if (b.room_id && roomMap.has(b.room_id)) {
        roomMap.get(b.room_id).beds.push(b);
      } else {
        const foundByName = rooms.find(r => r.name === b.room_name);
        if (foundByName && roomMap.has(foundByName.id)) {
          roomMap.get(foundByName.id).beds.push(b);
        } else {
          defaultGroup.beds.push(b);
        }
      }
    });

    const result = Array.from(roomMap.values()).filter(g => g.beds.length > 0);
    if (defaultGroup.beds.length > 0) result.push(defaultGroup);
    return result;
  }, [enrichedBeds, rooms, searchQ, showRoomGroup]);

  // Xử lý mở đóng dropdown và đo vị trí viewport
  const handleToggle = (e) => {
    if (disabled) return;
    if (open) {
      setOpen(false);
      return;
    }

    syncData(); // Cập nhật ngay dữ liệu mới nhất khi mở dropdown
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    const dropdownHeight = 360;
    const openUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    setCoords({
      top: openUp ? rect.top - 4 : rect.bottom + 4,
      left: Math.max(10, Math.min(rect.left, window.innerWidth - 320)),
      width: Math.max(rect.width, 280),
      openUp
    });
    setSearchQ('');
    setOpen(true);
  };

  // Click vào giường
  const handleSelectBed = (bed) => {
    // Nếu giường ĐANG BẬN hoặc SẮP XONG -> KHÔNG ĐƯỢC CHỌN
    if (!bed.selectable) {
      toast.warning(
        `Giường "${bed.name}" ${bed.statusLabel.toLowerCase()} (${bed.details || ''}). Vui lòng chọn giường đang trống!`
      );
      return;
    }

    const displayName = bed.room_name && !bed.name.includes(bed.room_name)
      ? `${bed.name} (${bed.room_name})`
      : bed.name;

    onChange?.(bed.id, displayName);
    setOpen(false);
  };

  // Bỏ chọn vị trí
  const handleClear = (e) => {
    e?.stopPropagation();
    onChange?.('', '');
    setOpen(false);
  };

  // Xác định text hiển thị trên nút
  const renderButtonContent = () => {
    if (selectedBed) {
      const roomTag = selectedBed.room_name ? ` • ${selectedBed.room_name}` : '';
      return (
        <span className="flex items-center gap-1.5 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${selectedBed.dotClass}`} />
          <span className="font-semibold text-slate-800 truncate">
            {selectedBed.name}{roomTag}
          </span>
        </span>
      );
    }

    return (
      <span className="text-slate-400 truncate">
        {placeholder || t('rooms_beds.select_facility', '— Chọn giường —')}
      </span>
    );
  };

  const btnPadding = buttonSize === 'xs' 
    ? 'px-2.5 py-0 h-7 text-xs' 
    : buttonSize === 'sm' 
    ? 'px-2.5 py-1.5 text-xs' 
    : 'px-3 py-2 text-xs';

  return (
    <div className={`relative inline-block w-full ${className}`}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full flex items-center justify-between gap-1.5 rounded-lg border transition-all text-left bg-white cursor-pointer select-none ${btnPadding} ${
          open 
            ? 'border-blue-500 ring-2 ring-blue-500/10 shadow-xs' 
            : 'border-slate-200 hover:border-slate-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="text-sm shrink-0">🛏️</span>
          {renderButtonContent()}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {selectedBed && !hideClear && !disabled && (
            <span
              onClick={handleClear}
              className="p-0.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              title="Bỏ chọn vị trí"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180 text-blue-600' : ''}`} />
        </div>
      </button>

      {/* Floating Dropdown Modal/Popover */}
      {open && (
        <>
          {/* Backdrop Click Dismiss */}
          <div 
            className="fixed inset-0 z-[120] bg-transparent" 
            onClick={() => setOpen(false)} 
          />

          <div
            className={`fixed z-[130] bg-white rounded-2xl border border-slate-200/90 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
              coords.openUp ? '-translate-y-full' : ''
            }`}
            style={{
              top: `${coords.top}px`,
              left: `${Math.max(8, Math.min(coords.left, window.innerWidth - 280 - 8))}px`,
              width: `${Math.max(coords.width, 280)}px`,
              maxHeight: '380px'
            }}
          >
            {/* Header: Title & Quick Stats */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t('rooms_beds.select_bed_title', 'Chọn vị trí phục vụ')}</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  {stats.total} {t('rooms_beds.unit_bed', 'vị trí')}
                </span>
              </div>

              {/* Status Counters Indicator */}
              <div className="flex items-center gap-2 text-[10px] font-semibold">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{stats.available} trống (chọn được)</span>
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>{stats.nearly} sắp xong</span>
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>{stats.busy} đang bận</span>
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative mt-2.5">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder={t('rooms_beds.search_bed_placeholder', 'Tìm tên giường, phòng, trạng thái...')}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-slate-800"
                  autoFocus
                />
              </div>
            </div>

            {/* List Beds by Room */}
            <div className="flex-1 overflow-y-auto p-2 space-y-3 divide-y divide-slate-100">
              {/* Option to clear / unassign */}
              {value && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-rose-50 text-xs text-slate-500 hover:text-rose-600 transition-colors text-left cursor-pointer group"
                >
                  <span className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-rose-100 flex items-center justify-center text-slate-400 group-hover:text-rose-500 shrink-0 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </span>
                  <span className="font-medium text-slate-500 italic">
                    {t('rooms_beds.unassign_bed', '— Bỏ chọn vị trí —')}
                  </span>
                </button>
              )}

              {groupedBeds.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  {t('common.no_results', 'Không tìm thấy vị trí nào phù hợp')}
                </div>
              ) : (
                groupedBeds.map(group => (
                  <div key={group.room?.id || 'all'} className="pt-2 first:pt-0 space-y-1">
                    {/* Room Group Header */}
                    {group.room && (
                      <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>{group.room.name}</span>
                        <span className="font-normal text-[10px] text-slate-400">
                          {group.beds.length} vị trí
                        </span>
                      </div>
                    )}

                    {/* Beds in this room */}
                    <div className="space-y-1">
                      {group.beds.map(bed => {
                        const isSelected = value && (bed.id === value || bed.name === value);
                        const isSelectable = bed.selectable;

                        return (
                          <div
                            key={bed.id}
                            onClick={() => handleSelectBed(bed)}
                            className={`w-full flex items-center justify-between p-2 rounded-xl border text-xs transition-all text-left ${
                              isSelected
                                ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-500/20 shadow-2xs'
                                : isSelectable
                                ? 'bg-white border-slate-100 hover:border-blue-200 hover:bg-slate-50/80 cursor-pointer'
                                : 'bg-slate-50/70 border-slate-150 opacity-60 cursor-not-allowed select-none'
                            }`}
                          >
                            {/* Left: Bed Name + Occupant / Room info */}
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                {!isSelectable ? (
                                  <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                                ) : (
                                  <span className="text-xs">🛏️</span>
                                )}
                                <span className={`font-bold truncate ${
                                  !isSelectable ? 'text-slate-600' : 'text-slate-800'
                                }`}>
                                  {bed.name}
                                </span>
                                {bed.room_name && !group.room && (
                                  <span className="text-[10px] text-slate-400">({bed.room_name})</span>
                                )}
                              </div>

                              {/* Details if occupied or nearly finished */}
                              {bed.details && (
                                <div className="text-[10px] text-slate-500 mt-0.5 truncate pl-4">
                                  {bed.details}
                                </div>
                              )}
                            </div>

                            {/* Right: Status Badge & Selection Indicator */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${bed.badgeClass}`}>
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${bed.dotClass}`} />
                                <span className="truncate">{bed.badgeText}</span>
                              </span>

                              {isSelected && (
                                <Check className="w-4 h-4 text-blue-600 shrink-0 ml-0.5" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Advice */}
            <div className="p-2 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-blue-600 shrink-0" />
                <span>Giường bận hoặc sắp xong sẽ không thể chọn</span>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-blue-600 font-semibold hover:underline cursor-pointer"
              >
                {t('common.done', 'Xong')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
