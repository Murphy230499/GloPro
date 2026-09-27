'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Building2, Plus, Edit2, Trash2, ChevronDown, ChevronLeft, ChevronRight, 
  Search, Check, Clock, User, Phone, CheckCircle2, ShoppingCart, 
  DoorOpen, Sparkles, Filter, RefreshCw, LayoutGrid, Settings
} from 'lucide-react';
import { useT } from '@/lib/i18n';
import { useBranch } from '@/lib/BranchContext';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/Layout';
import { DEFAULT_FACILITIES, INITIAL_DEMO_ROOMS, INITIAL_DEMO_BEDS, formatMinutesToTime, timeStringToMinutes } from '@/components/appointments/constants';
import RoomModal from '@/components/rooms-beds/RoomModal';
import BedModal from '@/components/rooms-beds/BedModal';
import DeleteConfirmModal from '@/components/rooms-beds/DeleteConfirmModal';
import BedDetailDrawer from '@/components/rooms-beds/BedDetailDrawer';
import QuickAssignBedModal from '@/components/rooms-beds/QuickAssignBedModal';
import { transferBedSession, releaseCustomerBedSessions } from '@/lib/bedSessionHelpers';

export default function RoomsBeds() {
  const { t } = useT();
  const { currentBranchId } = useBranch();

  // Active Tab: 'diagram' (Sơ đồ vị trí) | 'settings' (Cài đặt vị trí)
  const [activeTab, setActiveTab] = useState('diagram');

  // Data States
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bedSessions, setBedSessions] = useState({}); // map bed_id -> active session object
  const [loading, setLoading] = useState(true);

  // Pagination for settings table
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [bedModalOpen, setBedModalOpen] = useState(false);
  const [editingBed, setEditingBed] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: '', id: null, title: '' });
  
  // Drawer & Quick assign
  const [selectedBedForDrawer, setSelectedBedForDrawer] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quickAssignBed, setQuickAssignBed] = useState(null);

  // 1. Initial Load Data
  const loadData = async () => {
    try {
      setLoading(true);
      const branchFilter = currentBranchId === 'all' ? {} : { branch_id: currentBranchId };

      const [rData, fData, sData, stData, cData, aData] = await Promise.all([
        base44.entities.Room ? base44.entities.Room.filter(branchFilter).catch(() => []) : Promise.resolve([]),
        base44.entities.Facility ? base44.entities.Facility.filter(branchFilter).catch(() => []) : Promise.resolve([]),
        base44.entities.Service ? base44.entities.Service.list().catch(() => []) : Promise.resolve([]),
        base44.entities.Staff ? base44.entities.Staff.filter(branchFilter).catch(() => []) : Promise.resolve([]),
        base44.entities.Customer ? base44.entities.Customer.list().catch(() => []) : Promise.resolve([]),
        base44.entities.Appointment ? base44.entities.Appointment.filter(branchFilter).catch(() => []) : Promise.resolve([])
      ]);

      // Handle Rooms
      let finalRooms = rData;
      if (!finalRooms || finalRooms.length === 0) {
        const cached = localStorage.getItem(`gp_rooms_${currentBranchId}`);
        if (cached) {
          try { finalRooms = JSON.parse(cached); } catch (e) {}
        }
        if (!finalRooms || finalRooms.length === 0) {
          finalRooms = INITIAL_DEMO_ROOMS;
          localStorage.setItem(`gp_rooms_${currentBranchId}`, JSON.stringify(finalRooms));
        }
      }
      setRooms(finalRooms);

      // Handle Beds
      let finalBeds = fData;
      if (!finalBeds || finalBeds.length === 0) {
        const cachedBeds = localStorage.getItem(`gp_facilities_${currentBranchId}`);
        if (cachedBeds) {
          try { finalBeds = JSON.parse(cachedBeds); } catch (e) {}
        }
        if (!finalBeds || finalBeds.length === 0) {
          finalBeds = INITIAL_DEMO_BEDS;
          localStorage.setItem(`gp_facilities_${currentBranchId}`, JSON.stringify(finalBeds));
        }
      }
      setBeds(finalBeds);

      setServices(sData || []);
      setStaff(stData || []);
      setCustomers(cData || []);

      // Build active bed sessions
      const sessionMap = {};
      const savedSessions = localStorage.getItem(`gp_active_bed_sessions_${currentBranchId}`);
      if (savedSessions) {
        try {
          Object.assign(sessionMap, JSON.parse(savedSessions));
        } catch (e) {}
      }

      // Merge real in-progress appointments from DB
      const todayISO = new Date().toISOString().split('T')[0];
      (aData || []).forEach(appt => {
        if ((appt.status === 'in_progress' || appt.status === 'checked_in') && appt.facility_id) {
          if (!sessionMap[appt.facility_id]) {
            const cus = (cData || []).find(c => c.id === appt.customer_id);
            sessionMap[appt.facility_id] = {
              id: appt.id,
              bed_id: appt.facility_id,
              customer: cus || { name: appt.customer_name || 'Khách hàng' },
              customer_name: appt.customer_name || cus?.name,
              customer_phone: appt.customer_phone || cus?.phone,
              start_time: appt.start_time || '08:00',
              end_time: appt.end_time || '09:15',
              total_duration_minutes: appt.duration_minutes || 60,
              services: appt.services || [{ name: appt.service_name || 'Dịch vụ', price: appt.price || 0, staff_name: appt.staff_name }]
            };
          }
        }
      });

      // Default demo sessions if brand new (matches Mockup 3!)
      if (Object.keys(sessionMap).length === 0) {
        const now = new Date();
        const startH = String(Math.max(8, now.getHours() - 1)).padStart(2, '0');
        const startM = '00';
        
        // Bed 1 of Room 1: Nearly finished (Sắp trống)
        sessionMap['bed_p1_1'] = {
          id: 'demo_ses_1',
          bed_id: 'bed_p1_1',
          customer: { name: 'Hoàng Yến', phone: '0985667845', birthday: '02/12/1999', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
          customer_name: 'Hoàng Yến',
          customer_phone: '0985667845',
          start_time: `${startH}:${startM}`,
          end_time: `${String(Number(startH) + 1).padStart(2, '0')}:15`,
          total_duration_minutes: 75,
          services: [
            { name: 'Cắt tóc nữ', price: 300000, duration: 45, staff_name: 'Minh Tú' },
            { name: 'Gội thường', price: 100000, duration: 30, staff_name: 'Hoài An' }
          ]
        };

        // Bed 2 of Room 1: Occupied (Đang bận)
        sessionMap['bed_p1_2'] = {
          id: 'demo_ses_2',
          bed_id: 'bed_p1_2',
          customer: { name: 'Nguyễn Văn A', phone: '0901234567' },
          customer_name: 'Nguyễn Văn A',
          start_time: `${startH}:${startM}`,
          end_time: `${String(Number(startH) + 1).padStart(2, '0')}:30`,
          total_duration_minutes: 90,
          services: [
            { name: 'Cắt tóc nam', price: 150000, duration: 30, staff_name: 'Minh Tú' },
            { name: 'Nhuộm highlight', price: 600000, duration: 60, staff_name: 'Ngọc Anh' }
          ]
        };

        // Bed 4 of Room 1: Occupied
        sessionMap['bed_p1_4'] = {
          id: 'demo_ses_4',
          bed_id: 'bed_p1_4',
          customer: { name: 'Trần Thị B', phone: '0988776655' },
          customer_name: 'Trần Thị B',
          start_time: `${startH}:${startM}`,
          end_time: `${String(Number(startH) + 1).padStart(2, '0')}:00`,
          total_duration_minutes: 60,
          services: [
            { name: 'Gội đầu dưỡng sinh', price: 200000, duration: 60, staff_name: 'Lan Anh' }
          ]
        };
      }

      setBedSessions(sessionMap);
      localStorage.setItem(`gp_active_bed_sessions_${currentBranchId}`, JSON.stringify(sessionMap));
    } catch (err) {
      console.error('Error loading rooms and beds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentBranchId]);

  // 2. Real-time Clock Timer for Progress & "Sắp trống" (< 10 mins remaining)
  const [currentTick, setCurrentTick] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTick(Date.now());
    }, 15000); // Check every 15 seconds
    return () => clearInterval(timer);
  }, []);

  // Compute live session stats for each bed
  const enrichedBedSessions = useMemo(() => {
    const res = {};
    const now = new Date();
    const currentMinsNow = now.getHours() * 60 + now.getMinutes();

    Object.entries(bedSessions).forEach(([bedId, session]) => {
      if (!session) return;
      const startMins = timeStringToMinutes(session.start_time);
      const totalDur = session.total_duration_minutes || 60;
      const endMins = startMins + totalDur;

      // Elapsed minutes
      const elapsedMins = Math.max(0, currentMinsNow - startMins);
      const remainingMins = Math.max(0, endMins - currentMinsNow);
      const progressPercent = Math.min(100, Math.round((elapsedMins / totalDur) * 100));

      // Rule: If remaining <= 10 mins, status = 'nearly_finished' (Sắp trống)!
      let status = 'in_progress';
      if (remainingMins <= 10 && remainingMins > 0) {
        status = 'nearly_finished';
      } else if (remainingMins === 0 && elapsedMins >= totalDur) {
        status = 'nearly_finished';
      }

      res[bedId] = {
        ...session,
        elapsed_minutes: elapsedMins,
        remaining_minutes: remainingMins,
        progress_percent: progressPercent,
        status
      };
    });

    return res;
  }, [bedSessions, currentTick]);

  // 3. Handlers for Room
  const handleCreateRoom = async (roomName) => {
    try {
      const newRoom = {
        id: `room_${Date.now()}`,
        name: roomName,
        branch_id: currentBranchId === 'all' ? null : currentBranchId,
        display_order: rooms.length + 1
      };

      if (base44.entities.Room) {
        await base44.entities.Room.create(newRoom).catch(() => null);
      }

      const updated = [...rooms, newRoom];
      setRooms(updated);
      localStorage.setItem(`gp_rooms_${currentBranchId}`, JSON.stringify(updated));
      setRoomModalOpen(false);
      toast.success(t('rooms_beds.create_room_success', 'Tạo phòng thành công'));
    } catch (e) {
      toast.error('Lỗi khi tạo phòng');
    }
  };

  // 4. Handlers for Bed
  const handleSaveBed = async (bedData) => {
    try {
      if (editingBed) {
        // Update
        const updatedBed = {
          ...editingBed,
          name: bedData.name,
          room_id: bedData.room_id || null,
          applicable_services: bedData.applicable_services || [],
          allow_overlap: bedData.allow_overlap
        };

        if (base44.entities.Facility) {
          await base44.entities.Facility.update(editingBed.id, updatedBed).catch(() => null);
        }

        const updatedList = beds.map(b => b.id === editingBed.id ? updatedBed : b);
        setBeds(updatedList);
        localStorage.setItem(`gp_facilities_${currentBranchId}`, JSON.stringify(updatedList));
        toast.success(t('rooms_beds.update_bed_success', 'Cập nhật vị trí thành công'));
      } else {
        // Create
        const newBed = {
          id: `bed_${Date.now()}`,
          name: bedData.name,
          room_id: bedData.room_id || null,
          branch_id: currentBranchId === 'all' ? null : currentBranchId,
          applicable_services: bedData.applicable_services || [],
          allow_overlap: bedData.allow_overlap,
          is_active: true
        };

        if (base44.entities.Facility) {
          await base44.entities.Facility.create(newBed).catch(() => null);
        }

        const updatedList = [...beds, newBed];
        setBeds(updatedList);
        localStorage.setItem(`gp_facilities_${currentBranchId}`, JSON.stringify(updatedList));
        toast.success(t('rooms_beds.create_bed_success', 'Tạo vị trí thành công'));
      }

      setBedModalOpen(false);
      setEditingBed(null);
    } catch (e) {
      toast.error(t('rooms_beds.err_save_bed', 'Lỗi khi lưu vị trí'));
    }
  };

  // 5. Delete Bed Handler
  const handleDeleteBed = async () => {
    if (!deleteConfirm.id) return;
    try {
      if (base44.entities.Facility) {
        await base44.entities.Facility.delete(deleteConfirm.id).catch(() => null);
      }
      const updated = beds.filter(b => b.id !== deleteConfirm.id);
      setBeds(updated);
      localStorage.setItem(`gp_facilities_${currentBranchId}`, JSON.stringify(updated));
      
      // Also clean up session if active
      if (bedSessions[deleteConfirm.id]) {
        const clone = { ...bedSessions };
        delete clone[deleteConfirm.id];
        setBedSessions(clone);
        localStorage.setItem(`gp_active_bed_sessions_${currentBranchId}`, JSON.stringify(clone));
      }

      toast.success(t('rooms_beds.delete_bed_success', 'Xoá vị trí thành công'));
    } catch (e) {
      toast.error(t('rooms_beds.err_delete_bed', 'Lỗi khi xoá vị trí'));
    } finally {
      setDeleteConfirm({ open: false, type: '', id: null, title: '' });
    }
  };

  // 6. Session Handlers: Start Serving & Complete
  const handleStartServing = (newSession) => {
    const updated = {
      ...bedSessions,
      [newSession.bed_id]: newSession
    };
    setBedSessions(updated);
    localStorage.setItem(`gp_active_bed_sessions_${currentBranchId}`, JSON.stringify(updated));
    toast.success(t('rooms_beds.started_serving', 'Đã nhận khách vào vị trí'));
  };

  const handleTransferBed = (transferData) => {
    const { fromBedId, toBedId, targetBed, targetRoom, newServices, startTime } = transferData;
    const updated = transferBedSession(fromBedId, toBedId, bedSessions, {
      targetBed,
      targetRoom,
      newServices,
      startTime
    });
    setBedSessions(updated);
    localStorage.setItem(`gp_active_bed_sessions_${currentBranchId}`, JSON.stringify(updated));
    toast.success(t('rooms_beds.transfer_bed_success', `Đã chuyển khách sang ${targetBed?.name || 'giường mới'}`));
  };

  const handleCompleteSession = (session) => {
    const targetBedId = typeof session === 'string' ? session : session?.bed_id;
    if (!targetBedId) return;

    const updated = { ...bedSessions };
    delete updated[targetBedId];
    setBedSessions(updated);
    localStorage.setItem(`gp_active_bed_sessions_${currentBranchId}`, JSON.stringify(updated));
    toast.success(t('rooms_beds.bed_freed', 'Đã trả giường thành công'));
  };

  const handleReleaseCustomerSessions = async (identifier) => {
    let releasedIds = [];
    setBedSessions(prev => {
      const { updatedSessions, releasedBedIds, releasedCount } = releaseCustomerBedSessions(prev, identifier);
      releasedIds = releasedBedIds;
      if (releasedCount > 0) {
        localStorage.setItem(`gp_active_bed_sessions_${currentBranchId}`, JSON.stringify(updatedSessions));
      }
      return updatedSessions;
    });

    // Cập nhật trạng thái 'completed' cho các lịch hẹn liên quan trong cơ sở dữ liệu nếu có
    if (base44.entities.Appointment && releasedIds.length > 0) {
      try {
        const appts = await base44.entities.Appointment.filter(
          currentBranchId === 'all' ? {} : { branch_id: currentBranchId }
        ).catch(() => []);

        for (const appt of appts) {
          if (
            releasedIds.includes(appt.facility_id) &&
            (appt.status === 'in_progress' || appt.status === 'checked_in')
          ) {
            await base44.entities.Appointment.update(appt.id, { status: 'completed' }).catch(() => null);
          }
        }
      } catch (err) {
        console.warn('Error marking linked appointments completed:', err);
      }
    }
    return releasedIds;
  };

  // 7. Auto-release beds when POS checkout completes
  useEffect(() => {
    const handleCheckoutCompleted = (e) => {
      const { masterSessionId, customerId, customerPhone, customerName, releasedBedIds } = e.detail || {};
      if (!masterSessionId && !customerId && !customerPhone && !customerName && (!releasedBedIds || releasedBedIds.length === 0)) return;

      setBedSessions(prev => {
        const { updatedSessions, releasedCount } = releaseCustomerBedSessions(prev, {
          masterSessionId,
          customerId,
          customerPhone,
          customerName,
          bedIds: releasedBedIds
        });
        if (releasedCount > 0) {
          localStorage.setItem(`gp_active_bed_sessions_${currentBranchId}`, JSON.stringify(updatedSessions));
          toast.success(`Đã thanh toán tại POS và tự động giải phóng ${releasedCount} vị trí`);
        }
        return updatedSessions;
      });
    };

    window.addEventListener('gp_bed_session_checkout_completed', handleCheckoutCompleted);
    return () => window.removeEventListener('gp_bed_session_checkout_completed', handleCheckoutCompleted);
  }, [currentBranchId]);

  // 7. Group Beds by Room for Sơ đồ vị trí
  const bedsByRoom = useMemo(() => {
    const roomMap = {};
    // Seed with existing rooms
    rooms.forEach(r => {
      roomMap[r.id] = { room: r, beds: [] };
    });

    // Unassigned room bucket
    const unassignedRoomKey = '__unassigned';
    roomMap[unassignedRoomKey] = {
      room: { id: unassignedRoomKey, name: t('rooms_beds.unassigned_area', 'Chưa phân phòng / Khu vực chung') },
      beds: []
    };

    beds.forEach(bed => {
      const rId = bed.room_id && roomMap[bed.room_id] ? bed.room_id : unassignedRoomKey;
      roomMap[rId].beds.push(bed);
    });

    // Filter out unassigned if empty
    return Object.values(roomMap).filter(group => group.beds.length > 0 || group.room.id !== unassignedRoomKey);
  }, [rooms, beds, t]);

  // 8. Pagination for Settings Table
  const totalPages = Math.max(1, Math.ceil(beds.length / pageSize));
  const paginatedBeds = useMemo(() => {
    const start = (page - 1) * pageSize;
    return beds.slice(start, start + pageSize);
  }, [beds, page, pageSize]);

  return (
    <div className="space-y-5 font-sans">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            {t('rooms_beds.title', 'Giường / Phòng')}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {t('rooms_beds.subtitle', 'Theo dõi trạng thái phòng, giường/ghế phục vụ khách theo thời gian thực')}
          </p>
        </div>

        {activeTab === 'settings' ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRoomModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-xs transition-colors cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>{t('rooms_beds.add_room', 'Thêm phòng')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingBed(null);
                setBedModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('rooms_beds.add_bed', 'Thêm vị trí')}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadData()}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-xs transition-colors cursor-pointer"
              title={t('common.refresh', 'Làm mới')}
            >
              <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{t('common.refresh', 'Làm mới')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Navigation Tab Bar (Standard GloPro Module Style) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-100 rounded-2xl p-1 shadow-sm">
        <div className="flex overflow-x-auto gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('diagram')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'diagram'
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid className="w-4 h-4 shrink-0" />
            <span>{t('rooms_beds.tab_diagram', 'Sơ đồ vị trí')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>{t('rooms_beds.tab_settings', 'Cài đặt vị trí')}</span>
          </button>
        </div>

        {/* Legend for Sơ đồ vị trí */}
        {activeTab === 'diagram' && (
          <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-slate-600 px-3 py-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              {t('rooms_beds.legend_available', 'Đang trống')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
              {t('rooms_beds.legend_busy', 'Đang bận')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
              {t('rooms_beds.legend_nearly_finished', 'Sắp trống')}
            </span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-xs font-medium">{t('common.loading', 'Đang tải dữ liệu...')}</span>
          </div>
        ) : activeTab === 'diagram' ? (
          /* ========================================================================= */
          /* TAB 1: SƠ ĐỒ VỊ TRÍ (LIVE TRACKING GRID - MOCKUP 3)                       */
          /* ========================================================================= */
          <div className="space-y-8">
            {bedsByRoom.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-sm">
                <DoorOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">{t('rooms_beds.empty_title', 'Chưa có giường phòng nào')}</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {t('rooms_beds.empty_hint', 'Vui lòng sang tab "Cài đặt vị trí" để tạo phòng và các giường/ghế phục vụ khách.')}
                </p>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer inline-flex items-center gap-2"
                >
                  {t('rooms_beds.go_to_settings', 'Đến Cài đặt vị trí')}
                </button>
              </div>
            ) : (
              bedsByRoom.map(group => (
                <div key={group.room.id} className="space-y-3.5">
                  {/* Room Header */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      {group.room.name}
                      <span className="text-xs font-normal text-slate-400">({group.beds.length} {t('rooms_beds.unit_bed', 'vị trí')})</span>
                    </h2>
                  </div>

                  {/* Bed Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {group.beds.map(bed => {
                      const session = enrichedBedSessions[bed.id];
                      const isOccupied = Boolean(session);
                      const isNearlyFinished = session?.status === 'nearly_finished';

                      // Colors based on status
                      let borderClass = 'border-emerald-300 hover:border-emerald-400';
                      let badgeClass = 'bg-emerald-100 text-emerald-800';
                      let badgeText = t('rooms_beds.status_available', 'ĐANG TRỐNG');
                      let progressFillClass = 'bg-emerald-500';

                      if (isNearlyFinished) {
                        borderClass = 'border-amber-400 hover:border-amber-500 shadow-amber-100/50';
                        badgeClass = 'bg-amber-100 text-amber-800';
                        badgeText = t('rooms_beds.status_nearly_finished', 'SẮP TRỐNG');
                        progressFillClass = 'bg-amber-500';
                      } else if (isOccupied) {
                        borderClass = 'border-rose-300 hover:border-rose-400 shadow-rose-100/50';
                        badgeClass = 'bg-rose-100 text-rose-800';
                        badgeText = t('rooms_beds.status_occupied', 'ĐANG BẬN');
                        progressFillClass = 'bg-rose-500';
                      }

                      return (
                        <div
                          key={bed.id}
                          onClick={() => {
                            if (isOccupied) {
                              setSelectedBedForDrawer(bed);
                              setDrawerOpen(true);
                            } else {
                              setQuickAssignBed({ bed, room: group.room });
                            }
                          }}
                          className={`bg-white rounded-2xl border-2 ${borderClass} p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between select-none min-h-[140px]`}
                        >
                          {/* Card Top: Bed Name + Badge */}
                          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                            <span className="font-bold text-slate-800 text-sm">{bed.name}</span>
                            <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${badgeClass}`}>
                              {badgeText}
                            </span>
                          </div>

                          {/* Card Middle: Content */}
                          <div className="py-2.5 space-y-1.5 flex-1 flex flex-col justify-center">
                            {isOccupied ? (
                              <>
                                <div className="text-xs font-semibold text-slate-800 truncate">
                                  {t('rooms_beds.customer', 'Khách Hàng')}: <span className="text-slate-900">{session.customer?.name || session.customer_name || t('rooms_beds.walk_in_customer', 'Khách vãng lai')}</span>
                                </div>
                                <div className="text-[11px] text-slate-500 font-medium">
                                  {t('rooms_beds.start', 'Bắt đầu')}: <span className="font-mono text-slate-700">{session.start_time}</span>
                                  <span className="mx-2 text-slate-300">|</span>
                                  {t('rooms_beds.end', 'Kết thúc')}: <span className="font-mono text-slate-700">{session.end_time}</span>
                                </div>
                              </>
                            ) : (
                              <div className="text-center py-1">
                                <div className="text-xs font-semibold text-emerald-700">
                                  {t('rooms_beds.ready_to_serve', 'Sẵn sàng đón khách')}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  {t('rooms_beds.start', 'Bắt đầu')}: --:--  •  {t('rooms_beds.end', 'Kết thúc')}: --:--
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Card Bottom: Elapsed & Progress Bar */}
                          <div className="pt-2 border-t border-slate-100/80 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span>
                                {t('rooms_beds.elapsed', 'Đã qua')}: <strong className="text-slate-700">{session?.elapsed_minutes || 0} {t('common.minutes', 'phút')}</strong>
                              </span>
                              <span className="font-bold text-slate-700">
                                {session?.progress_percent || 0}% ({session?.total_duration_minutes || 0} {t('common.minutes', 'phút')})
                              </span>
                            </div>
                            
                            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${progressFillClass}`}
                                style={{ width: `${session ? Math.min(100, Math.max(0, session.progress_percent)) : 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* TAB 2: CÀI ĐẶT VỊ TRÍ (MANAGEMENT TABLE & MODALS - MOCKUP 1)               */
          /* ========================================================================= */
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            {/* Table Header Action Bar */}
            <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">{t('rooms_beds.tab_settings', 'Cài đặt vị trí')}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{t('rooms_beds.settings_desc', 'Quản lý danh sách các phòng và giường/ghế trong salon')}</p>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-6">{t('rooms_beds.bed_col', 'Giường')}</th>
                    <th className="py-3.5 px-6">{t('rooms_beds.room_col', 'Phòng')}</th>
                    <th className="py-3.5 px-6">{t('rooms_beds.applicable_services_col', 'Dịch vụ áp dụng')}</th>
                    <th className="py-3.5 px-6 text-right">{t('common.actions', 'Thao tác')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedBeds.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400">
                        {t('rooms_beds.no_beds_configured', 'Chưa có vị trí nào được thiết lập. Bấm nút "+ Thêm vị trí" ở góc trên để bắt đầu.')}
                      </td>
                    </tr>
                  ) : (
                    paginatedBeds.map(bed => {
                      const roomObj = rooms.find(r => r.id === bed.room_id);
                      
                      // Format applicable services text
                      let servicesText = t('rooms_beds.all_services_applied', 'Tất cả dịch vụ');
                      if (bed.applicable_services && bed.applicable_services.length > 0) {
                        const matched = services.filter(s => bed.applicable_services.includes(s.id));
                        servicesText = matched.map(m => m.name).join(', ') || `${bed.applicable_services.length} dịch vụ`;
                      }

                      return (
                        <tr key={bed.id} className="hover:bg-slate-50/70 transition-colors group">
                          <td className="py-4 px-6 font-semibold text-slate-800">
                            {bed.name}
                            {bed.allow_overlap && (
                              <span className="ml-2 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-200/60">
                                {t('rooms_beds.badge_overlap', 'Trùng lịch')}
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-6 text-slate-600">
                            {roomObj ? roomObj.name : <span className="text-slate-400 italic">— {t('rooms_beds.unassigned_room_short', 'Chưa phân phòng')} —</span>}
                          </td>

                          <td className="py-4 px-6 text-slate-600 max-w-md truncate" title={servicesText}>
                            {servicesText}
                          </td>

                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingBed(bed);
                                  setBedModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title={t('common.edit', 'Chỉnh sửa')}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteConfirm({
                                    open: true,
                                    type: 'bed',
                                    id: bed.id,
                                    title: t('rooms_beds.delete_bed_confirm', 'Bạn chắc chắn muốn xoá vị trí "{name}"?', { name: bed.name })
                                  });
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title={t('common.delete', 'Xoá')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination (Mockup 1 footer) */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/40 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                {t('rooms_beds.pagination_info', 'Hiển thị từ')} {beds.length === 0 ? 0 : (page - 1) * pageSize + 1} {t('common.to', 'đến')} {Math.min(page * pageSize, beds.length)} {t('rooms_beds.on_total', 'trên tổng số')} {beds.length}
              </div>

              <div className="flex items-center gap-2">
                {/* Page Prev */}
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                      p === page
                        ? 'border border-blue-500 bg-blue-50 text-blue-600 shadow-2xs'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                {/* Page Next */}
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Page Size Selector */}
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="ml-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none text-slate-700 cursor-pointer"
                >
                  <option value={10}>10 / {t('rooms_beds.page_unit', 'trang')}</option>
                  <option value={20}>20 / {t('rooms_beds.page_unit', 'trang')}</option>
                  <option value={50}>50 / {t('rooms_beds.page_unit', 'trang')}</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {/* 1. Modal Thêm phòng */}
      <RoomModal
        open={roomModalOpen}
        onClose={() => setRoomModalOpen(false)}
        onSave={handleCreateRoom}
      />

      {/* 2. Modal Thêm/Sửa Giường */}
      <BedModal
        open={bedModalOpen}
        onClose={() => {
          setBedModalOpen(false);
          setEditingBed(null);
        }}
        onSave={handleSaveBed}
        editingItem={editingBed}
        rooms={rooms}
        services={services}
      />

      {/* 3. Modal Xoá Vị trí */}
      <DeleteConfirmModal
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, type: '', id: null, title: '' })}
        onConfirm={handleDeleteBed}
        title={deleteConfirm.title}
      />

      {/* 4. Slide-over Drawer Chi tiết Giường */}
      <BedDetailDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedBedForDrawer(null);
        }}
        bed={selectedBedForDrawer}
        room={rooms.find(r => r.id === selectedBedForDrawer?.room_id)}
        activeSession={selectedBedForDrawer ? enrichedBedSessions[selectedBedForDrawer.id] : null}
        allBedSessions={enrichedBedSessions}
        allBeds={beds}
        allRooms={rooms}
        applicableServices={services}
        staff={staff}
        onTransferBed={handleTransferBed}
        onCompleteSession={handleCompleteSession}
        onReleaseCustomerSessions={handleReleaseCustomerSessions}
        onOpenAssignModal={(b) => setQuickAssignBed({ bed: b, room: rooms.find(r => r.id === b.room_id) })}
      />

      {/* 5. Modal Nhận khách trực tiếp vào giường */}
      <QuickAssignBedModal
        open={Boolean(quickAssignBed)}
        onClose={() => setQuickAssignBed(null)}
        bed={quickAssignBed?.bed}
        room={quickAssignBed?.room}
        customers={customers}
        services={services}
        staff={staff}
        allBedSessions={enrichedBedSessions}
        onStartServing={handleStartServing}
      />
    </div>
  );
}
