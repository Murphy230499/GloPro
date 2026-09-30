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
import RoomManagerModal from '@/components/rooms-beds/RoomManagerModal';
import BedModal from '@/components/rooms-beds/BedModal';
import DeleteConfirmModal from '@/components/rooms-beds/DeleteConfirmModal';
import BedDetailDrawer from '@/components/rooms-beds/BedDetailDrawer';
import QuickAssignBedModal from '@/components/rooms-beds/QuickAssignBedModal';
import BedHoverCard from '@/components/rooms-beds/BedHoverCard';
import BedTransferModal from '@/components/rooms-beds/BedTransferModal';
import POSInvoiceModal from '@/components/POSInvoiceModal';
import { transferBedSession, releaseCustomerBedSessions } from '@/lib/bedSessionHelpers';
import { BED_BUFFER_MINUTES, calculateBedAvailableWindow, checkSessionOvertime } from '@/lib/bedConflictHelper';
import { getTenantStorageKey, resolveTenantId } from '@/lib/tenantManager';
import { 
  isRoomFacility, 
  parseRoomFromFacility, 
  encodeRoomToFacility, 
  parseBedFromFacility, 
  encodeBedToFacility,
  calculateCleaningCountdown
} from '@/lib/roomBedDbHelper';

export default function RoomsBeds() {
  const { t } = useT();
  const { currentBranchId, branches } = useBranch();

  // Active Tab: 'diagram' (Sơ đồ vị trí) | 'settings' (Cài đặt vị trí)
  const [activeTab, setActiveTab] = useState('diagram');

  // Master Data States (Unified per salon tenant, scoped by branch_id)
  const [allRooms, setAllRooms] = useState([]);
  const [allBeds, setAllBeds] = useState([]);

  // Filtered views strictly for current selected branch
  const rooms = useMemo(() => {
    if (!currentBranchId || currentBranchId === 'all') return allRooms;
    return allRooms.filter(r => !r.branch_id || r.branch_id === currentBranchId);
  }, [allRooms, currentBranchId]);

  const beds = useMemo(() => {
    if (!currentBranchId || currentBranchId === 'all') return allBeds;
    return allBeds.filter(b => !b.branch_id || b.branch_id === currentBranchId);
  }, [allBeds, currentBranchId]);

  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [bedSessions, setBedSessions] = useState({}); // map bed_id -> active session object
  const [loading, setLoading] = useState(true);

  // Pagination for settings table
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoomForModal, setEditingRoomForModal] = useState(null);
  const [bedModalOpen, setBedModalOpen] = useState(false);
  const [editingBed, setEditingBed] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: '', id: null, title: '' });
  
  // Drawer & Quick assign
  const [selectedBedForDrawer, setSelectedBedForDrawer] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quickAssignBed, setQuickAssignBed] = useState(null);

  // Hover Card states
  const [hoveredBedId, setHoveredBedId] = useState(null);
  const hoverTimeoutRef = useRef(null);

  // Transfer Modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferSource, setTransferSource] = useState(null);

  // Direct POS Invoice Modal
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

  // Status Filter for Diagram
  const [statusFilter, setStatusFilter] = useState('all');

  // 1. Initial Load Data
  const loadData = async () => {
    try {
      setLoading(true);
      await resolveTenantId().catch(() => null);
      const branchFilter = currentBranchId === 'all' ? {} : { branch_id: currentBranchId };

      const [rData, fData, sData, stData, cData, aData] = await Promise.all([
        base44.entities.Room ? base44.entities.Room.filter(branchFilter).catch(() => []) : Promise.resolve([]),
        base44.entities.Facility ? base44.entities.Facility.filter({}).catch(() => []) : Promise.resolve([]),
        base44.entities.Service ? base44.entities.Service.list().catch(() => []) : Promise.resolve([]),
        base44.entities.Staff ? base44.entities.Staff.filter(branchFilter).catch(() => []) : Promise.resolve([]),
        base44.entities.Customer ? base44.entities.Customer.list().catch(() => []) : Promise.resolve([]),
        base44.entities.Appointment ? base44.entities.Appointment.filter(branchFilter).catch(() => []) : Promise.resolve([])
      ]);

      // Separate fData into dbRooms and dbBeds
      const dbRoomFacilities = (fData || []).filter(isRoomFacility);
      const dbBedFacilities = (fData || []).filter(f => !isRoomFacility(f));
      const parsedDbRooms = dbRoomFacilities.map(parseRoomFromFacility).filter(Boolean);

      // 1. Rooms: Load master tenant list (prioritizing DB)
      let loadedRooms = null;
      const unifiedRoomsKey = getTenantStorageKey('gp_rooms');
      const cachedUnifiedRooms = localStorage.getItem(unifiedRoomsKey) ||
                                 localStorage.getItem('gp_rooms') ||
                                 localStorage.getItem('gp_rooms_default_');
      if (cachedUnifiedRooms !== null) {
        try { loadedRooms = JSON.parse(cachedUnifiedRooms); } catch (e) {}
      } else {
        const legacyRooms = localStorage.getItem(getTenantStorageKey('gp_rooms', currentBranchId));
        if (legacyRooms !== null) {
          try { loadedRooms = JSON.parse(legacyRooms); } catch (e) {}
        }
      }

      if (parsedDbRooms.length > 0) {
        // DB is primary source of truth. Keep any local unsynced rooms
        const dbRoomIds = new Set(parsedDbRooms.map(r => r.id));
        const unsyncedRooms = (loadedRooms || []).filter(r => !dbRoomIds.has(r.id));
        loadedRooms = [...parsedDbRooms, ...unsyncedRooms];
      } else if (loadedRooms === null) {
        // If salon has never initialized rooms anywhere and has a branch, initialize demo rooms for primary branch
        const primaryBranchId = (branches && branches.length > 0 && branches[0].id !== 'all')
          ? branches[0].id
          : (currentBranchId !== 'all' ? currentBranchId : null);
        if (primaryBranchId) {
          loadedRooms = INITIAL_DEMO_ROOMS.map(r => ({ ...r, branch_id: primaryBranchId }));
          if (base44.entities.Facility) {
            for (const r of loadedRooms) {
              base44.entities.Facility.create(encodeRoomToFacility(r)).catch(() => null);
            }
          }
        } else {
          loadedRooms = [];
        }
      } else if (loadedRooms && loadedRooms.length > 0) {
        // DB had no rooms yet, sync local rooms to database
        if (base44.entities.Facility) {
          for (const r of loadedRooms) {
            base44.entities.Facility.create(encodeRoomToFacility(r)).catch(() => null);
          }
        }
      }

      setAllRooms(loadedRooms || []);
      if (loadedRooms && loadedRooms.length > 0) {
        localStorage.setItem(unifiedRoomsKey, JSON.stringify(loadedRooms));
        localStorage.setItem('gp_rooms', JSON.stringify(loadedRooms));
      }

      // 2. Beds: Load master tenant list and merge with cached room assignments
      const unifiedBedsKey = getTenantStorageKey('gp_facilities');
      const bedRoomMapKey = getTenantStorageKey('gp_bed_room_map');

      let cachedBeds = [];
      const rawCachedBeds = localStorage.getItem(unifiedBedsKey) ||
                            localStorage.getItem('gp_facilities') ||
                            localStorage.getItem(getTenantStorageKey('gp_facilities', currentBranchId));
      if (rawCachedBeds) {
        try { cachedBeds = JSON.parse(rawCachedBeds); } catch (e) {}
      }

      let bedRoomMap = {};
      const rawBedRoomMap = localStorage.getItem(bedRoomMapKey) || localStorage.getItem('gp_bed_room_map');
      if (rawBedRoomMap) {
        try { bedRoomMap = JSON.parse(rawBedRoomMap); } catch (e) {}
      }

      // Populate bedRoomMap from cachedBeds if not already present
      cachedBeds.forEach(b => {
        if (b.id && b.room_id !== undefined && bedRoomMap[b.id] === undefined) {
          bedRoomMap[b.id] = b.room_id;
        }
      });

      let loadedBeds = [];
      if (dbBedFacilities && dbBedFacilities.length > 0) {
        const cachedById = new Map(cachedBeds.map(b => [b.id, b]));
        loadedBeds = dbBedFacilities.map(fb => {
          const parsedBed = parseBedFromFacility(fb, bedRoomMap);
          const cached = cachedById.get(fb.id);
          const assignedRoomId = (parsedBed.room_id !== undefined && parsedBed.room_id !== null)
            ? parsedBed.room_id
            : (bedRoomMap[fb.id] !== undefined
                ? bedRoomMap[fb.id]
                : (cached?.room_id !== undefined ? cached.room_id : null));

          return {
            ...fb,
            ...(cached || {}),
            ...parsedBed,
            room_id: assignedRoomId
          };
        });

        // Keep local beds that haven't synced to backend yet
        cachedBeds.forEach(cb => {
          if (cb.id && !loadedBeds.some(b => b.id === cb.id)) {
            const assignedRoomId = bedRoomMap[cb.id] !== undefined ? bedRoomMap[cb.id] : cb.room_id;
            loadedBeds.push({ ...cb, room_id: assignedRoomId });
          }
        });
      } else {
        loadedBeds = cachedBeds.map(b => ({
          ...b,
          room_id: bedRoomMap[b.id] !== undefined ? bedRoomMap[b.id] : b.room_id
        }));
      }

      // If salon has no beds at all anywhere and has a branch, initialize demo beds for primary branch
      if (!loadedBeds || loadedBeds.length === 0) {
        const primaryBranchId = (branches && branches.length > 0 && branches[0].id !== 'all')
          ? branches[0].id
          : (currentBranchId !== 'all' ? currentBranchId : null);
        if (primaryBranchId) {
          loadedBeds = INITIAL_DEMO_BEDS.map(b => ({ ...b, branch_id: primaryBranchId }));
          if (base44.entities.Facility) {
            for (const b of loadedBeds) {
              base44.entities.Facility.create(encodeBedToFacility(b)).catch(() => null);
            }
          }
          localStorage.setItem(unifiedBedsKey, JSON.stringify(loadedBeds));
          localStorage.setItem('gp_facilities', JSON.stringify(loadedBeds));
        }
      } else if (loadedBeds && loadedBeds.length > 0 && dbBedFacilities.length === 0) {
        // Sync local beds to database
        if (base44.entities.Facility) {
          for (const b of loadedBeds) {
            base44.entities.Facility.create(encodeBedToFacility(b)).catch(() => null);
          }
        }
      }

      setAllBeds(loadedBeds || []);
      if (loadedBeds && loadedBeds.length > 0) {
        localStorage.setItem(unifiedBedsKey, JSON.stringify(loadedBeds));
        localStorage.setItem('gp_facilities', JSON.stringify(loadedBeds));
      }
      if (Object.keys(bedRoomMap).length > 0) {
        localStorage.setItem(bedRoomMapKey, JSON.stringify(bedRoomMap));
        localStorage.setItem('gp_bed_room_map', JSON.stringify(bedRoomMap));
      }

      setServices(sData || []);
      setStaff(stData || []);
      setCustomers(cData || []);

      // 3. Appointments (Tenant & branch isolated)
      let finalAppts = aData || [];
      const apptsKey = getTenantStorageKey('gp_today_appointments', currentBranchId);
      if (finalAppts && finalAppts.length > 0) {
        localStorage.setItem(apptsKey, JSON.stringify(finalAppts));
      } else {
        const cachedAppts = localStorage.getItem(apptsKey);
        if (cachedAppts) {
          try { finalAppts = JSON.parse(cachedAppts); } catch (e) {}
        }
      }
      setAppointments(finalAppts || []);

      // 4. Build active bed sessions
      const sessionMap = {};
      const sessionsKey = getTenantStorageKey('gp_active_bed_sessions');
      const savedSessions = localStorage.getItem(sessionsKey) || localStorage.getItem(getTenantStorageKey('gp_active_bed_sessions', currentBranchId));
      if (savedSessions) {
        try {
          Object.assign(sessionMap, JSON.parse(savedSessions));
        } catch (e) {}
      }

      // Merge real in-progress appointments from DB
      (aData || []).forEach(appt => {
        if (currentBranchId !== 'all' && appt.branch_id && appt.branch_id !== currentBranchId) return;
        const facId = appt.facility_id || appt.services?.[0]?.facility_id;
        if ((appt.status === 'in_progress' || appt.status === 'checked_in') && facId) {
          if (!sessionMap[facId]) {
            const cus = (cData || []).find(c => c.id === appt.customer_id);
            sessionMap[facId] = {
              id: appt.id,
              bed_id: facId,
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

      setBedSessions(sessionMap);
      localStorage.setItem(sessionsKey, JSON.stringify(sessionMap));
    } catch (err) {
      console.error('Error loading rooms and beds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentBranchId]);

  // Listen for external appointment updates
  useEffect(() => {
    const handleApptUpdate = () => {
      const cached = localStorage.getItem(getTenantStorageKey('gp_today_appointments', currentBranchId));
      if (cached) {
        try {
          setAppointments(JSON.parse(cached));
        } catch (e) {}
      }
    };
    window.addEventListener('gp_appointment_updated', handleApptUpdate);
    return () => window.removeEventListener('gp_appointment_updated', handleApptUpdate);
  }, [currentBranchId]);

  // Listen for room changes across views
  useEffect(() => {
    const handleRoomsChanged = () => {
      const unifiedRoomsKey = getTenantStorageKey('gp_rooms');
      const cachedRooms = localStorage.getItem(unifiedRoomsKey);
      if (cachedRooms) {
        try { setAllRooms(JSON.parse(cachedRooms)); } catch (e) {}
      }
      const unifiedBedsKey = getTenantStorageKey('gp_facilities');
      const cachedBeds = localStorage.getItem(unifiedBedsKey);
      if (cachedBeds) {
        try { setAllBeds(JSON.parse(cachedBeds)); } catch (e) {}
      }
    };
    window.addEventListener('gp_rooms_changed', handleRoomsChanged);
    return () => window.removeEventListener('gp_rooms_changed', handleRoomsChanged);
  }, []);

  // 2. Real-time Clock Timer for Progress & Auto-clean expiration
  const [currentTick, setCurrentTick] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setCurrentTick(now);

      // Check auto-expiration for cleaning beds
      let hasExpired = false;
      const clone = { ...bedSessions };
      Object.entries(clone).forEach(([bId, sess]) => {
        if (sess?.status === 'cleaning') {
          const cleanInfo = calculateCleaningCountdown(sess, now);
          if (cleanInfo.isFinished) {
            delete clone[bId];
            hasExpired = true;
          }
        }
      });
      if (hasExpired) {
        setBedSessions(clone);
        localStorage.setItem(getTenantStorageKey('gp_active_bed_sessions'), JSON.stringify(clone));
      }
    }, 15000);
    return () => clearInterval(timer);
  }, [bedSessions]);

  // Compute live session stats for visible beds only
  const enrichedBedSessions = useMemo(() => {
    const res = {};
    const now = new Date();
    const currentMinsNow = now.getHours() * 60 + now.getMinutes();
    const visibleBedIds = new Set(beds.map(b => b.id));

    // 1. Process active bed sessions
    Object.entries(bedSessions).forEach(([bedId, session]) => {
      if (!session || !visibleBedIds.has(bedId)) return;

      if (session.status === 'cleaning') {
        const cleanInfo = calculateCleaningCountdown(session, currentTick);
        res[bedId] = {
          ...session,
          status: 'cleaning',
          cleaning_info: cleanInfo
        };
        return;
      }

      const startMins = timeStringToMinutes(session.start_time);
      const totalDur = session.total_duration_minutes || 60;
      const endMins = startMins + totalDur;

      const elapsedMins = Math.max(0, currentMinsNow - startMins);
      const remainingMins = Math.max(0, endMins - currentMinsNow);
      const progressPercent = Math.min(100, Math.round((elapsedMins / totalDur) * 100));

      let status = session.status || 'in_progress';
      if (status === 'waiting') {
        // Keeps 'waiting' until technician starts serving
      } else {
        const overtimeCheck = checkSessionOvertime(session, currentMinsNow);
        if (overtimeCheck.isOvertime) {
          status = 'overtime';
        } else if (remainingMins <= 10) {
          status = 'nearly_finished';
        } else {
          status = 'in_progress';
        }
      }

      res[bedId] = {
        ...session,
        elapsed_minutes: elapsedMins,
        remaining_minutes: remainingMins,
        progress_percent: progressPercent,
        overtime_minutes: Math.max(0, currentMinsNow - endMins),
        status
      };
    });

    // 2. Scan appointments for unoccupied beds to identify 'reserved' status
    beds.forEach(bed => {
      if (res[bed.id]) return; // already has active session
      // Check if there is an upcoming appointment for this bed today
      const upcomingAppt = appointments.find(a => 
        (a.facility_id === bed.id || a.services?.[0]?.facility_id === bed.id) &&
        a.status !== 'cancelled' && a.status !== 'completed'
      );
      if (upcomingAppt) {
        res[bed.id] = {
          bed_id: bed.id,
          status: 'reserved',
          appointment: upcomingAppt,
          customer: { name: upcomingAppt.customer_name, phone: upcomingAppt.customer_phone },
          customer_name: upcomingAppt.customer_name,
          customer_phone: upcomingAppt.customer_phone,
          start_time: upcomingAppt.start_time || '08:00',
          end_time: upcomingAppt.end_time || '09:00',
          services: [{
            service_name: upcomingAppt.service_name || 'Dịch vụ đã đặt trước',
            staff_name: upcomingAppt.staff_name || '',
            price: upcomingAppt.price || 0
          }],
          elapsed_minutes: 0,
          progress_percent: 0
        };
      }
    });

    return res;
  }, [bedSessions, beds, currentTick, appointments]);

  // 3. Handlers for Room
  const handleCreateRoom = async (roomData) => {
    try {
      const roomObj = typeof roomData === 'string' ? { name: roomData } : (roomData || {});
      const targetBranchId = roomObj.branch_id || ((currentBranchId && currentBranchId !== 'all')
        ? currentBranchId
        : (branches && branches.length > 0 && branches[0].id !== 'all' ? branches[0].id : null));

      const newRoom = {
        id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? `room_${crypto.randomUUID().slice(0, 8)}` : `room_${Date.now()}`,
        name: (roomObj.name || '').trim(),
        color: roomObj.color || '#3B82F6',
        branch_id: targetBranchId,
        display_order: allRooms.length + 1
      };

      if (base44.entities.Facility) {
        await base44.entities.Facility.create(encodeRoomToFacility(newRoom)).catch(err => {
          console.error('Failed to create room in database:', err);
        });
      }

      const updated = [...allRooms, newRoom];
      setAllRooms(updated);
      localStorage.setItem(getTenantStorageKey('gp_rooms'), JSON.stringify(updated));
      localStorage.setItem('gp_rooms', JSON.stringify(updated));
      window.dispatchEvent(new Event('gp_rooms_changed'));
      return newRoom;
    } catch (e) {
      console.error('Error creating room:', e);
      throw e;
    }
  };

  const handleUpdateRoom = async (roomId, roomData) => {
    try {
      let updatedRoom = null;
      const updated = allRooms.map(r => {
        if (r.id === roomId) {
          updatedRoom = {
            ...r,
            name: (roomData.name || r.name).trim(),
            color: roomData.color || r.color || '#3B82F6',
            branch_id: roomData.branch_id !== undefined ? roomData.branch_id : r.branch_id
          };
          return updatedRoom;
        }
        return r;
      });

      if (updatedRoom && base44.entities.Facility) {
        await base44.entities.Facility.update(roomId, encodeRoomToFacility(updatedRoom)).catch(err => {
          console.error('Failed to update room in database:', err);
        });
      }

      setAllRooms(updated);
      localStorage.setItem(getTenantStorageKey('gp_rooms'), JSON.stringify(updated));
      localStorage.setItem('gp_rooms', JSON.stringify(updated));
      window.dispatchEvent(new Event('gp_rooms_changed'));
    } catch (e) {
      console.error('Error updating room:', e);
      throw e;
    }
  };

  const handleDeleteRoom = async (roomId) => {
    try {
      if (base44.entities.Facility) {
        await base44.entities.Facility.delete(roomId).catch(err => {
          console.error('Failed to delete room from database:', err);
        });
      }

      const updatedRooms = allRooms.filter(r => r.id !== roomId);
      setAllRooms(updatedRooms);
      localStorage.setItem(getTenantStorageKey('gp_rooms'), JSON.stringify(updatedRooms));
      localStorage.setItem('gp_rooms', JSON.stringify(updatedRooms));

      // Unassign any beds belonging to this deleted room
      const affectedBeds = allBeds.filter(b => b.room_id === roomId);
      if (affectedBeds.length > 0) {
        const updatedBeds = allBeds.map(b => b.room_id === roomId ? { ...b, room_id: null, room_name: null } : b);
        setAllBeds(updatedBeds);
        localStorage.setItem(getTenantStorageKey('gp_facilities'), JSON.stringify(updatedBeds));
        localStorage.setItem('gp_facilities', JSON.stringify(updatedBeds));

        const bedRoomMapKey = getTenantStorageKey('gp_bed_room_map');
        let bedRoomMap = {};
        try { bedRoomMap = JSON.parse(localStorage.getItem(bedRoomMapKey) || localStorage.getItem('gp_bed_room_map') || '{}'); } catch (e) {}
        affectedBeds.forEach(b => {
          bedRoomMap[b.id] = null;
        });
        localStorage.setItem(bedRoomMapKey, JSON.stringify(bedRoomMap));
        localStorage.setItem('gp_bed_room_map', JSON.stringify(bedRoomMap));

        if (base44.entities.Facility) {
          for (const b of affectedBeds) {
            const unassignedBed = { ...b, room_id: null };
            base44.entities.Facility.update(b.id, encodeBedToFacility(unassignedBed)).catch(() => null);
          }
        }
      }

      window.dispatchEvent(new Event('gp_rooms_changed'));
    } catch (e) {
      console.error('Error deleting room:', e);
      throw e;
    }
  };

  // 4. Handlers for Bed
  const handleSaveBed = async (bedData) => {
    try {
      const roomObj = allRooms.find(r => r.id === bedData.room_id);
      const bedRoomMapKey = getTenantStorageKey('gp_bed_room_map');
      let bedRoomMap = {};
      try { bedRoomMap = JSON.parse(localStorage.getItem(bedRoomMapKey) || localStorage.getItem('gp_bed_room_map') || '{}'); } catch (e) {}

      // Notice: editingBed can be { room_id: group.room.id } without an id when clicking "Thêm vị trí" in diagram
      const isExistingBed = Boolean(editingBed && editingBed.id);

      if (isExistingBed) {
        // Update
        const targetBranchId = roomObj?.branch_id || editingBed.branch_id || (currentBranchId !== 'all' ? currentBranchId : null);
        const updatedBed = {
          ...editingBed,
          name: bedData.name,
          room_id: bedData.room_id || null,
          branch_id: targetBranchId,
          applicable_services: bedData.applicable_services || [],
          allow_overlap: bedData.allow_overlap
        };

        if (base44.entities.Facility) {
          await base44.entities.Facility.update(editingBed.id, encodeBedToFacility(updatedBed)).catch(err => {
            console.error('Failed to update bed in database:', err);
          });
        }

        const updatedList = allBeds.map(b => b.id === editingBed.id ? updatedBed : b);
        setAllBeds(updatedList);
        localStorage.setItem(getTenantStorageKey('gp_facilities'), JSON.stringify(updatedList));
        localStorage.setItem('gp_facilities', JSON.stringify(updatedList));

        bedRoomMap[editingBed.id] = bedData.room_id || null;
        localStorage.setItem(bedRoomMapKey, JSON.stringify(bedRoomMap));
        localStorage.setItem('gp_bed_room_map', JSON.stringify(bedRoomMap));

        toast.success(t('rooms_beds.update_bed_success', 'Cập nhật vị trí thành công'));
      } else {
        // Create
        const targetBranchId = roomObj?.branch_id || editingBed?.branch_id || ((currentBranchId && currentBranchId !== 'all')
          ? currentBranchId
          : (branches && branches.length > 0 && branches[0].id !== 'all' ? branches[0].id : null));

        const bedUuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `bed_${Date.now()}`;
        const newBed = {
          id: bedUuid,
          name: bedData.name,
          room_id: bedData.room_id || editingBed?.room_id || null,
          branch_id: targetBranchId,
          applicable_services: bedData.applicable_services || [],
          allow_overlap: bedData.allow_overlap,
          is_active: true
        };

        if (base44.entities.Facility) {
          await base44.entities.Facility.create(encodeBedToFacility(newBed)).catch(err => {
            console.error('Failed to create bed in database:', err);
          });
        }

        const updatedList = [...allBeds, newBed];
        setAllBeds(updatedList);
        localStorage.setItem(getTenantStorageKey('gp_facilities'), JSON.stringify(updatedList));
        localStorage.setItem('gp_facilities', JSON.stringify(updatedList));

        bedRoomMap[newBed.id] = newBed.room_id || null;
        localStorage.setItem(bedRoomMapKey, JSON.stringify(bedRoomMap));
        localStorage.setItem('gp_bed_room_map', JSON.stringify(bedRoomMap));

        toast.success(t('rooms_beds.create_bed_success', 'Tạo vị trí thành công'));
      }

      setBedModalOpen(false);
      setEditingBed(null);
    } catch (e) {
      console.error('Error saving bed:', e);
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
      const updated = allBeds.filter(b => b.id !== deleteConfirm.id);
      setAllBeds(updated);
      localStorage.setItem(getTenantStorageKey('gp_facilities'), JSON.stringify(updated));
      localStorage.setItem('gp_facilities', JSON.stringify(updated));

      const bedRoomMapKey = getTenantStorageKey('gp_bed_room_map');
      let bedRoomMap = {};
      try { bedRoomMap = JSON.parse(localStorage.getItem(bedRoomMapKey) || localStorage.getItem('gp_bed_room_map') || '{}'); } catch (e) {}
      delete bedRoomMap[deleteConfirm.id];
      localStorage.setItem(bedRoomMapKey, JSON.stringify(bedRoomMap));
      localStorage.setItem('gp_bed_room_map', JSON.stringify(bedRoomMap));
      
      // Also clean up session if active
      if (bedSessions[deleteConfirm.id]) {
        const clone = { ...bedSessions };
        delete clone[deleteConfirm.id];
        setBedSessions(clone);
        localStorage.setItem(getTenantStorageKey('gp_active_bed_sessions'), JSON.stringify(clone));
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
    localStorage.setItem(getTenantStorageKey('gp_active_bed_sessions'), JSON.stringify(updated));
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
    localStorage.setItem(getTenantStorageKey('gp_active_bed_sessions'), JSON.stringify(updated));
    toast.success(t('rooms_beds.transfer_bed_success', `Đã chuyển khách sang ${targetBed?.name || 'giường mới'}`));
  };

  const handleCompleteSession = (session) => {
    const targetBedId = typeof session === 'string' ? session : session?.bed_id;
    if (!targetBedId) return;

    const updated = { ...bedSessions };
    delete updated[targetBedId];
    setBedSessions(updated);
    localStorage.setItem(getTenantStorageKey('gp_active_bed_sessions'), JSON.stringify(updated));
    toast.success(t('rooms_beds.bed_freed', 'Đã trả giường thành công'));
  };

  const handleReleaseCustomerSessions = async (identifier) => {
    let releasedIds = [];
    setBedSessions(prev => {
      const { updatedSessions, releasedBedIds, releasedCount } = releaseCustomerBedSessions(prev, identifier);
      releasedIds = releasedBedIds;
      if (releasedCount > 0) {
        localStorage.setItem(getTenantStorageKey('gp_active_bed_sessions'), JSON.stringify(updatedSessions));
      }
      return updatedSessions;
    });

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
  };

  // Trả phòng: kiểm tra thời gian dọn dẹp -> chuyển sang 'cleaning' hoặc 'available'
  const handleReleaseBed = (bed, session) => {
    if (!bed?.id) return;
    const clone = { ...bedSessions };
    const cleanDuration = bed.cleaning_duration !== undefined ? bed.cleaning_duration : 10;

    if (cleanDuration > 0) {
      clone[bed.id] = {
        ...(session || {}),
        bed_id: bed.id,
        bed_name: bed.name,
        room_id: bed.room_id || null,
        status: 'cleaning',
        cleaning_started_at: Date.now(),
        cleaning_duration_minutes: cleanDuration,
        customer_name: session?.customer_name || 'Khách trước'
      };
      setBedSessions(clone);
      localStorage.setItem(getTenantStorageKey('gp_active_bed_sessions'), JSON.stringify(clone));
      toast.success(`Vị trí ${bed.name} đã chuyển sang trạng thái Đang dọn dẹp (${cleanDuration} phút)`);
    } else {
      delete clone[bed.id];
      setBedSessions(clone);
      localStorage.setItem(getTenantStorageKey('gp_active_bed_sessions'), JSON.stringify(clone));
      toast.success(`Đã trả vị trí ${bed.name} thành công`);
    }

    setHoveredBedId(null);
    setDrawerOpen(false);
  };

  // Hoàn tất dọn dẹp ngay: chuyển về 'available'
  const handleFinishCleaning = (bed) => {
    if (!bed?.id) return;
    const clone = { ...bedSessions };
    delete clone[bed.id];
    setBedSessions(clone);
    localStorage.setItem(getTenantStorageKey('gp_active_bed_sessions'), JSON.stringify(clone));
    toast.success(`Vị trí ${bed.name} đã hoàn tất dọn dẹp, sẵn sàng đón khách`);
    setHoveredBedId(null);
  };

  // Bắt đầu phục vụ ngay từ trạng thái 'waiting'
  const handleStartServingNow = (bed, session) => {
    if (!bed?.id) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const nowTimeStr = `${hh}:${mm}`;

    const nowMins = now.getHours() * 60 + now.getMinutes();
    const dur = session?.total_duration_minutes || 60;
    const endMins = nowMins + dur;
    const newEndTime = formatMinutesToTime(endMins);

    const updatedSession = {
      ...(session || {}),
      status: 'in_progress',
      start_time: nowTimeStr,
      end_time: newEndTime,
      service_start_time: nowTimeStr
    };

    const clone = {
      ...bedSessions,
      [bed.id]: updatedSession
    };
    setBedSessions(clone);
    localStorage.setItem(getTenantStorageKey('gp_active_bed_sessions'), JSON.stringify(clone));
    toast.success(`Đã bắt đầu phục vụ tại ${bed.name}`);
    setHoveredBedId(null);
  };

  // Mở popup thanh toán trực tiếp qua POSInvoiceModal
  const handleOpenCheckout = (bed, session) => {
    if (!session) return;
    const customer = session.customer || {
      name: session.customer_name || 'Khách vãng lai',
      phone: session.customer_phone || ''
    };

    const initialCart = (session.services || []).map((s, idx) => ({
      id: s.service_id || `srv_${idx}`,
      name: s.service_name || 'Dịch vụ',
      price: s.is_from_package ? 0 : (s.price || 0),
      qty: 1,
      staff_id: s.staff_id || null,
      staff_name: s.staff_name || '',
      facility_id: bed.id,
      facility_name: bed.name,
      customer_package_id: s.customer_package_id || null,
      customer_treatment_id: s.customer_treatment_id || null,
      package_name: s.package_name || null,
      is_from_package: Boolean(s.is_from_package)
    }));

    setInvoiceData({
      customer,
      initialCart,
      bed,
      session
    });
    setInvoiceModalOpen(true);
    setHoveredBedId(null);
    setDrawerOpen(false);
  };

  // Callback sau khi lưu hoá đơn POS thành công
  const handleInvoiceSaved = () => {
    if (invoiceData?.bed) {
      handleReleaseBed(invoiceData.bed, invoiceData.session);
    }
    setInvoiceModalOpen(false);
    setInvoiceData(null);
  };

  // Xác nhận chuyển phòng / giường
  const handleConfirmTransfer = (sourceBed, targetBed, session) => {
    if (!sourceBed || !targetBed) return;
    const clone = { ...bedSessions };

    clone[targetBed.id] = {
      ...(session || {}),
      bed_id: targetBed.id,
      bed_name: targetBed.name,
      room_id: targetBed.room_id || null
    };

    const cleanDuration = sourceBed.cleaning_duration !== undefined ? sourceBed.cleaning_duration : 10;
    if (cleanDuration > 0) {
      clone[sourceBed.id] = {
        bed_id: sourceBed.id,
        bed_name: sourceBed.name,
        room_id: sourceBed.room_id || null,
        status: 'cleaning',
        cleaning_started_at: Date.now(),
        cleaning_duration_minutes: cleanDuration,
        customer_name: 'Dọn sau chuyển giường'
      };
    } else {
      delete clone[sourceBed.id];
    }

    setBedSessions(clone);
    localStorage.setItem(getTenantStorageKey('gp_active_bed_sessions'), JSON.stringify(clone));
    toast.success(`Đã chuyển khách từ ${sourceBed.name} sang ${targetBed.name}`);
    setTransferModalOpen(false);
    setTransferSource(null);
  };

  // Hover handlers với delay trơn tru
  const handleBedMouseEnter = (bedId) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredBedId(bedId);
  };

  const handleBedMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredBedId(null);
    }, 250);
  };

  const handleHoverCardMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  // 6.5 Reassign or unassign conflicted appointment (e.g. receptionist overrides bed)
  const handleReassignAppointment = async (appointmentId, newBedId = null) => {
    try {
      const targetBed = newBedId ? beds.find(b => b.id === newBedId) : null;
      const patchData = {
        facility_id: newBedId || null,
        facility_name: targetBed ? targetBed.name : ''
      };

      if (base44.entities.Appointment) {
        await base44.entities.Appointment.update(appointmentId, patchData).catch(() => null);
      }

      setAppointments(prev => {
        const updated = prev.map(a => (a.id === appointmentId ? { ...a, ...patchData } : a));
        localStorage.setItem(getTenantStorageKey('gp_today_appointments', currentBranchId), JSON.stringify(updated));
        return updated;
      });

      window.dispatchEvent(new CustomEvent('gp_appointment_updated', {
        detail: { appointmentId, newBedId, facility_name: targetBed?.name || '' }
      }));
    } catch (err) {
      console.error('Error reassigning appointment bed:', err);
    }
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
          localStorage.setItem(getTenantStorageKey('gp_active_bed_sessions', currentBranchId), JSON.stringify(updatedSessions));
          toast.success(`Đã thanh toán tại POS và tự động giải phóng ${releasedCount} vị trí`);
        }
        return updatedSessions;
      });
    };

    window.addEventListener('gp_bed_session_checkout_completed', handleCheckoutCompleted);
    return () => window.removeEventListener('gp_bed_session_checkout_completed', handleCheckoutCompleted);
  }, [currentBranchId]);

  // Status Counts for Quick Filter
  const statusCounts = useMemo(() => {
    const counts = {
      all: beds.length,
      available: 0,
      waiting: 0,
      reserved: 0,
      in_progress: 0,
      nearly_finished: 0,
      overtime: 0,
      cleaning: 0
    };
    beds.forEach(bed => {
      const sess = enrichedBedSessions[bed.id];
      if (!sess) {
        counts.available++;
      } else {
        const st = sess.status;
        if (counts[st] !== undefined) {
          counts[st]++;
        } else {
          counts.in_progress++;
        }
      }
    });
    return counts;
  }, [beds, enrichedBedSessions]);

  // 7. Group Beds by Room for Sơ đồ vị trí (filtered by statusFilter)
  const bedsByRoom = useMemo(() => {
    const filteredBeds = statusFilter === 'all'
      ? beds
      : beds.filter(bed => {
          const sess = enrichedBedSessions[bed.id];
          if (statusFilter === 'available') return !sess;
          return sess?.status === statusFilter;
        });

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

    filteredBeds.forEach(bed => {
      const rId = bed.room_id && roomMap[bed.room_id] ? bed.room_id : unassignedRoomKey;
      roomMap[rId].beds.push(bed);
    });

    // Filter out empty rooms if a specific status filter is active
    return Object.values(roomMap).filter(group => group.beds.length > 0 || (statusFilter === 'all' && group.room.id !== unassignedRoomKey));
  }, [rooms, beds, enrichedBedSessions, statusFilter, t]);

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

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => loadData()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-xs transition-colors cursor-pointer"
            title={t('common.refresh', 'Làm mới')}
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('common.refresh', 'Làm mới')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingRoomForModal(null);
              setRoomModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-xs transition-colors cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>{t('rooms_beds.manage_rooms', 'Quản lý phòng')}</span>
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
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-fuchsia-500" />
              {t('rooms_beds.legend_overtime', 'Quá giờ')}
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
          <div className="space-y-6">
            {/* Status Quick Filter Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: 'Tất cả', count: statusCounts.all },
                { id: 'available', label: 'Đang trống', count: statusCounts.available, dot: 'bg-emerald-500' },
                { id: 'waiting', label: 'Chờ phục vụ', count: statusCounts.waiting, dot: 'bg-blue-500' },
                { id: 'reserved', label: 'Đặt trước', count: statusCounts.reserved, dot: 'bg-amber-500' },
                { id: 'in_progress', label: 'Đang bận', count: statusCounts.in_progress, dot: 'bg-rose-500' },
                { id: 'nearly_finished', label: 'Sắp trống', count: statusCounts.nearly_finished, dot: 'bg-amber-400' },
                { id: 'overtime', label: 'Quá giờ', count: statusCounts.overtime, dot: 'bg-fuchsia-500' },
                { id: 'cleaning', label: 'Đang dọn dẹp', count: statusCounts.cleaning, dot: 'bg-teal-500' },
              ].map(tab => {
                const isActive = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {tab.dot && <span className={`w-2 h-2 rounded-full ${tab.dot}`} />}
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {bedsByRoom.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-sm">
                <DoorOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">{t('rooms_beds.empty_title', 'Chưa có giường phòng nào')}</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {statusFilter !== 'all' 
                    ? `Không có vị trí nào đang ở trạng thái này.` 
                    : t('rooms_beds.empty_hint', 'Vui lòng sang tab "Cài đặt vị trí" để tạo phòng và các giường/ghế phục vụ khách.')}
                </p>
                {statusFilter !== 'all' ? (
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
                  >
                    Xem tất cả trạng thái
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer inline-flex items-center gap-2"
                  >
                    {t('rooms_beds.go_to_settings', 'Đến Cài đặt vị trí')}
                  </button>
                )}
              </div>
            ) : (
              bedsByRoom.map(group => (
                <div key={group.room.id} className="space-y-3.5">
                  {/* Room Header */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: group.room.color || '#3B82F6' }}
                      />
                      <span>{group.room.name}</span>
                      {currentBranchId === 'all' && group.room.branch_id && (
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-lg">
                          {branches.find(b => b.id === group.room.branch_id)?.name || 'Chi nhánh'}
                        </span>
                      )}
                      <span className="text-xs font-normal text-slate-400">({group.beds.length} {t('rooms_beds.unit_bed', 'vị trí')})</span>
                    </h2>

                    {group.room.id !== '__unassigned' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBed({ room_id: group.room.id });
                            setBedModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title={t('rooms_beds.add_bed_to_room', 'Thêm vị trí vào phòng này')}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{t('rooms_beds.add_bed', 'Thêm vị trí')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRoomForModal(group.room);
                            setRoomModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title={t('rooms_beds.edit_room', 'Chỉnh sửa phòng')}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bed Cards Grid or Empty State */}
                  {group.beds.length === 0 ? (
                    <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 flex flex-col items-center justify-center text-center py-7">
                      <DoorOpen className="w-7 h-7 text-slate-300 mb-1.5" />
                      <p className="text-xs font-semibold text-slate-600">
                        {t('rooms_beds.room_empty_beds', 'Phòng chưa có vị trí (giường / ghế)')}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {t('rooms_beds.room_empty_hint', 'Bấm nút bên dưới để thêm vị trí cho phòng này')}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBed({ room_id: group.room.id });
                          setBedModalOpen(true);
                        }}
                        className="mt-3 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t('rooms_beds.add_bed', 'Thêm vị trí')}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {group.beds.map(bed => {
                      const session = enrichedBedSessions[bed.id];
                      const isOccupied = Boolean(session);
                      const isCleaning = session?.status === 'cleaning';
                      const isWaiting = session?.status === 'waiting';
                      const isReserved = session?.status === 'reserved';
                      const isNearlyFinished = session?.status === 'nearly_finished';
                      const isOvertime = session?.status === 'overtime';

                      // Check appointment conflict & availability window for unoccupied bed
                      const now = new Date();
                      const currentMinsNow = now.getHours() * 60 + now.getMinutes();
                      const windowInfo = !isOccupied
                        ? calculateBedAvailableWindow(bed.id, appointments, currentMinsNow, BED_BUFFER_MINUTES)
                        : null;

                      // Colors based on status
                      let borderClass = 'border-emerald-300 hover:border-emerald-400';
                      let badgeClass = 'bg-emerald-100 text-emerald-800';
                      let badgeText = t('rooms_beds.status_available', 'ĐANG TRỐNG');
                      let progressFillClass = 'bg-emerald-500';
                      let cardExtraClass = '';

                      if (isCleaning) {
                        borderClass = 'border-teal-400 hover:border-teal-500 bg-teal-50/20';
                        badgeClass = 'bg-teal-100 text-teal-800 border border-teal-300/60';
                        badgeText = 'ĐANG DỌN DẸP';
                        progressFillClass = 'bg-teal-500';
                      } else if (isWaiting) {
                        borderClass = 'border-blue-400 hover:border-blue-500 bg-blue-50/20';
                        badgeClass = 'bg-blue-100 text-blue-800 border border-blue-300/60';
                        badgeText = 'CHỜ PHỤC VỤ';
                        progressFillClass = 'bg-blue-500';
                      } else if (isReserved) {
                        borderClass = 'border-amber-400 hover:border-amber-500 bg-amber-50/20';
                        badgeClass = 'bg-amber-100 text-amber-800 border border-amber-300/60';
                        badgeText = 'ĐẶT TRƯỚC';
                        progressFillClass = 'bg-amber-500';
                      } else if (isOvertime) {
                        borderClass = 'border-fuchsia-500 hover:border-fuchsia-600 shadow-fuchsia-100/60 animate-pulse-border';
                        badgeClass = 'bg-fuchsia-100 text-fuchsia-900 border border-fuchsia-300/60';
                        badgeText = t('rooms_beds.status_overtime', 'QUÁ GIỜ');
                        progressFillClass = 'bg-fuchsia-500';
                        cardExtraClass = 'bg-fuchsia-50/30';
                      } else if (isNearlyFinished) {
                        borderClass = 'border-amber-400 hover:border-amber-500 shadow-amber-100/50';
                        badgeClass = 'bg-amber-100 text-amber-800';
                        badgeText = t('rooms_beds.status_nearly_finished', 'SẮP TRỐNG');
                        progressFillClass = 'bg-amber-500';
                      } else if (isOccupied) {
                        borderClass = 'border-rose-300 hover:border-rose-400 shadow-rose-100/50';
                        badgeClass = 'bg-rose-100 text-rose-800';
                        badgeText = t('rooms_beds.status_occupied', 'ĐANG BẬN');
                        progressFillClass = 'bg-rose-500';
                      } else if (windowInfo?.hasNextAppt) {
                        if (windowInfo.availableMinutes <= 0) {
                          borderClass = 'border-amber-300 hover:border-amber-400 bg-amber-50/20';
                          badgeClass = 'bg-amber-100 text-amber-900 border border-amber-300/60';
                          badgeText = `HẸN ${windowInfo.availableUntil}`;
                        } else {
                          borderClass = 'border-emerald-300 hover:border-emerald-400';
                          badgeClass = 'bg-emerald-100 text-emerald-900 border border-emerald-300/60';
                          badgeText = `TRỐNG ĐẾN ${windowInfo.availableUntil}`;
                        }
                      }

                      return (
                        <div
                          key={bed.id}
                          className="relative"
                          onMouseEnter={() => handleBedMouseEnter(bed.id)}
                          onMouseLeave={handleBedMouseLeave}
                        >
                          {/* Hover Popover Card */}
                          {hoveredBedId === bed.id && session && (
                            <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-[100] pointer-events-auto">
                              <BedHoverCard
                                bed={bed}
                                room={group.room}
                                session={session}
                                status={session.status}
                                cleaningInfo={session.cleaning_info}
                                onTransferRoom={(b, s) => {
                                  setTransferSource({ bed: b, room: group.room, session: s });
                                  setTransferModalOpen(true);
                                  setHoveredBedId(null);
                                }}
                                onStartServing={(b, s) => handleStartServingNow(b, s)}
                                onCheckout={(b, s) => handleOpenCheckout(b, s)}
                                onReleaseBed={(b, s) => handleReleaseBed(b, s)}
                                onFinishCleaning={(b) => handleFinishCleaning(b)}
                                onMouseEnter={handleHoverCardMouseEnter}
                                onMouseLeave={handleBedMouseLeave}
                              />
                            </div>
                          )}

                          <div
                            onClick={() => {
                              if (isCleaning) {
                                if (window.confirm(`Vị trí ${bed.name} đang được dọn dẹp (${session.cleaning_info?.remainingMinutes || 0} phút còn lại). Bạn có muốn hoàn tất dọn dẹp ngay?`)) {
                                  handleFinishCleaning(bed);
                                }
                                return;
                              }
                              if (isOccupied && !isReserved) {
                                setSelectedBedForDrawer(bed);
                                setDrawerOpen(true);
                              } else {
                                setQuickAssignBed({ bed, room: group.room });
                              }
                            }}
                            className={`rounded-2xl border-2 ${borderClass} ${cardExtraClass} p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between select-none min-h-[140px] bg-white`}
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
                              {isCleaning ? (
                                <div className="py-1 space-y-1">
                                  <div className="text-xs font-semibold text-teal-800 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-pulse shrink-0" />
                                    <span>Vệ sinh & dọn phòng</span>
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    Còn lại: <strong className="text-teal-700 font-mono">{session.cleaning_info?.remainingMinutes || 0} phút</strong>
                                  </div>
                                </div>
                              ) : isOccupied ? (
                                <>
                                  <div className="text-xs font-semibold text-slate-800 truncate">
                                    {t('rooms_beds.customer', 'Khách Hàng')}: <span className="text-slate-900">{session.customer?.name || session.customer_name || t('rooms_beds.walk_in_customer', 'Khách vãng lai')}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-medium">
                                    {t('rooms_beds.start', 'Bắt đầu')}: <span className="font-mono text-slate-700">{session.start_time}</span>
                                    <span className="mx-2 text-slate-300">|</span>
                                    {t('rooms_beds.end', 'Kết thúc')}: <span className={`font-mono ${isOvertime ? 'text-fuchsia-700 font-bold' : 'text-slate-700'}`}>{session.end_time}</span>
                                  </div>
                                  {isOvertime && (
                                    <div className="flex items-center gap-1 text-[11px] font-bold text-fuchsia-700 bg-fuchsia-100 px-2 py-1 rounded-lg">
                                      <Clock className="w-3 h-3 shrink-0" />
                                      <span>Quá giờ: +{session.overtime_minutes} phút</span>
                                    </div>
                                  )}
                                </>
                              ) : windowInfo?.hasNextAppt ? (
                                <div className="py-0.5 space-y-1.5">
                                  <div className="text-xs font-semibold text-emerald-700 flex items-center justify-between">
                                    <span>{t('rooms_beds.ready_to_serve', 'Sẵn sàng đón khách')}</span>
                                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded-full border border-amber-200">
                                      Còn ~{windowInfo.availableMinutes}p
                                    </span>
                                  </div>
                                  <div className="text-[11px] bg-slate-50/90 rounded-xl p-2 border border-slate-100 space-y-0.5">
                                    <div className="font-semibold text-slate-700 flex items-center gap-1.5 truncate">
                                      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                      <span>Hẹn {windowInfo.availableUntil}: {windowInfo.nextAppt?.customer_name || 'Khách đặt trước'}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate pl-5">
                                      {windowInfo.nextAppt?.service_name || 'Dịch vụ đã đặt'}
                                    </div>
                                  </div>
                                </div>
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
                            {isCleaning ? (
                              <div className="pt-2 border-t border-slate-100/80 space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] text-slate-500">
                                  <span>Đang dọn dẹp</span>
                                  <span className="font-bold text-teal-700 font-mono">
                                    {session.cleaning_info?.remainingSeconds ? `${Math.floor(session.cleaning_info.remainingSeconds / 60)}:${String(session.cleaning_info.remainingSeconds % 60).padStart(2, '0')}` : `${session.cleaning_info?.remainingMinutes || 0}p`}
                                  </span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-500 bg-teal-500"
                                    style={{ width: `${session.cleaning_info?.progressPercent || 50}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="pt-2 border-t border-slate-100/80 space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] text-slate-500">
                                  <span>
                                    {isOccupied ? (
                                      <>
                                        {t('rooms_beds.elapsed', 'Đã qua')}: <strong className={isOvertime ? 'text-fuchsia-700' : 'text-slate-700'}>{session?.elapsed_minutes || 0} {t('common.minutes', 'phút')}</strong>
                                      </>
                                    ) : windowInfo?.hasNextAppt ? (
                                      <span className="text-amber-800 font-medium">
                                        Lịch hẹn: <strong>{windowInfo.availableUntil}</strong>
                                      </span>
                                    ) : (
                                      <span>{t('rooms_beds.elapsed', 'Đã qua')}: <strong className="text-slate-700">0 {t('common.minutes', 'phút')}</strong></span>
                                    )}
                                  </span>
                                  <span className={`font-bold ${isOvertime ? 'text-fuchsia-700' : 'text-slate-700'}`}>
                                    {isOccupied ? (
                                      isOvertime
                                        ? `100% (+${session?.overtime_minutes || 0}p quá giờ)`
                                        : `${session?.progress_percent || 0}% (${session?.total_duration_minutes || 0} ${t('common.minutes', 'phút')})`
                                    ) : windowInfo?.hasNextAppt ? (
                                      <span className="text-[10px] text-slate-500 font-normal">(đệm 15p dọn phòng)</span>
                                    ) : (
                                      <span className="text-emerald-700 font-medium">Trống cả ngày</span>
                                    )}
                                  </span>
                                </div>
                                
                                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${isOccupied ? progressFillClass : 'bg-emerald-500'}`}
                                    style={{ width: `${session ? (isOvertime ? 100 : Math.min(100, Math.max(0, session.progress_percent))) : 0}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                            <div className="flex flex-col gap-0.5">
                              <span>{roomObj ? roomObj.name : <span className="text-slate-400 italic">— {t('rooms_beds.unassigned_room_short', 'Chưa phân phòng')} —</span>}</span>
                              {currentBranchId === 'all' && bed.branch_id && (
                                <span className="text-[10px] text-blue-600 font-medium">
                                  {branches.find(b => b.id === bed.branch_id)?.name}
                                </span>
                              )}
                            </div>
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

      {/* 1. Modal Quản lý phòng (Tạo mới, sửa, xoá phòng) */}
      <RoomManagerModal
        open={roomModalOpen}
        onClose={() => {
          setRoomModalOpen(false);
          setEditingRoomForModal(null);
        }}
        branchId={currentBranchId}
        branches={branches}
        allRooms={allRooms}
        allBeds={allBeds}
        onSaveRoom={handleCreateRoom}
        onUpdateRoom={handleUpdateRoom}
        onDeleteRoom={handleDeleteRoom}
        initialEditingRoom={editingRoomForModal}
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
        onTransferBed={(data) => {
          if (data?.fromBedId && data?.toBedId) {
            handleTransferBed(data);
          } else if (selectedBedForDrawer) {
            const r = rooms.find(rm => rm.id === selectedBedForDrawer.room_id);
            setTransferSource({ bed: selectedBedForDrawer, room: r, session: enrichedBedSessions[selectedBedForDrawer.id] });
            setTransferModalOpen(true);
          }
        }}
        onCompleteSession={(bedId) => {
          const b = beds.find(x => x.id === bedId) || selectedBedForDrawer;
          const sess = b ? enrichedBedSessions[b.id] : null;
          handleReleaseBed(b, sess);
        }}
        onDirectCheckout={(bed, session) => handleOpenCheckout(bed, session)}
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
        allBeds={beds}
        allRooms={rooms}
        appointments={appointments}
        allBedSessions={enrichedBedSessions}
        onStartServing={handleStartServing}
        onReassignAppointment={handleReassignAppointment}
      />

      {/* 6. Modal Chuyển phòng / giường */}
      <BedTransferModal
        open={transferModalOpen}
        onClose={() => {
          setTransferModalOpen(false);
          setTransferSource(null);
        }}
        sourceBed={transferSource?.bed}
        sourceRoom={transferSource?.room}
        session={transferSource?.session}
        allRooms={allRooms}
        allBeds={allBeds}
        activeBedSessions={bedSessions}
        onConfirmTransfer={handleConfirmTransfer}
      />

      {/* 7. Modal Tạo Hoá Đơn Trực Tiếp (POS Checkout) */}
      {invoiceModalOpen && invoiceData && (
        <POSInvoiceModal
          open={invoiceModalOpen}
          customer={invoiceData.customer}
          initialCart={invoiceData.initialCart}
          onClose={() => {
            setInvoiceModalOpen(false);
            setInvoiceData(null);
          }}
          onSaved={handleInvoiceSaved}
        />
      )}
    </div>
  );
}
