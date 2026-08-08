'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useT } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { useBranch } from '@/lib/BranchContext';
import { formatVND, todayStr } from '@/lib/format';
import AppointmentModal from '@/components/AppointmentModal';
import POSInvoiceModal from '@/components/POSInvoiceModal';
import { toast } from '@/components/Layout';
import Avatar from '@/components/Avatar';
import { Phone, CheckCircle2, UserCheck, XCircle, Edit3, Trash2, Clock } from 'lucide-react';

import AppointmentHeader from '@/components/appointments/AppointmentHeader';
import AppointmentSettingsModal from '@/components/AppointmentSettingsModal';
import AddTimeBlockModal from '@/components/appointments/AddTimeBlockModal';
import FacilityManagementModal from '@/components/appointments/FacilityManagementModal';
import AppointmentTimelineView from '@/components/appointments/AppointmentTimelineView';
import AppointmentCalendarView from '@/components/appointments/AppointmentCalendarView';
import { DEFAULT_FACILITIES } from '@/components/appointments/constants';

const SAMPLE_DEMO_APPOINTMENTS = [
  { id: 'demo_1', customer_name: 'Michael Johnson', service_name: 'Full Press Set (2h)', price: 450000, start_time: '11:00', end_time: '13:30', staff_id: '__unassigned', facility_id: 'fac_nail_1', facility_name: 'Bàn Làm Nail 1', status: 'confirmed' },
  { id: 'demo_2', customer_name: 'Emily Harris', service_name: 'Full Press Set (2h)', price: 450000, start_time: '11:00', end_time: '13:00', staff_id: '__unassigned', facility_id: 'fac_nail_1', facility_name: 'Bàn Làm Nail 1', status: 'pending' },
  { id: 'demo_3', customer_name: 'Jessica Miller', service_name: 'Full Press Set (2h)', price: 450000, start_time: '13:00', end_time: '14:00', staff_id: '__unassigned', facility_id: 'fac_nail_1', facility_name: 'Bàn Làm Nail 1', status: 'checked_in' },
  { id: 'demo_4', customer_name: 'Sarah Wilson', service_name: 'Gội đầu dưỡng sinh (2h)', price: 350000, start_time: '11:00', end_time: '11:30', staff_id: 'st_1', staff_name: 'Maria A.', facility_id: 'fac_nail_1', facility_name: 'Bàn Làm Nail 1', status: 'checked_in' },
  { id: 'demo_5', customer_name: 'Brandon Martinez', service_name: 'Full Press Set (2h)', price: 450000, start_time: '13:00', end_time: '14:30', staff_id: 'st_1', staff_name: 'Maria A.', facility_id: 'fac_nail_1', facility_name: 'Bàn Làm Nail 1', status: 'confirmed' },
  { id: 'demo_6', customer_name: 'Megan Taylor', service_name: 'Full Press Set (2h)', price: 450000, start_time: '11:00', end_time: '13:00', staff_id: 'st_2', staff_name: 'Michelle M.', facility_id: 'fac_nail_1', facility_name: 'Bàn Làm Nail 1', status: 'pending' },
  { id: 'demo_7', customer_name: 'Anh Ngọc Nguyễn', service_name: 'Gội đầu dưỡng sinh (2h)', price: 350000, start_time: '12:30', end_time: '13:30', staff_id: 'st_2', staff_name: 'Michelle M.', facility_id: 'fac_nail_2', facility_name: 'Bàn Làm Nail 2', status: 'checked_in' },
  { id: 'demo_8', customer_name: 'Emma Brown', service_name: 'Full Press Set (2h)', price: 450000, start_time: '13:30', end_time: '14:30', staff_id: 'st_2', staff_name: 'Michelle M.', facility_id: 'fac_nail_2', facility_name: 'Bàn Làm Nail 2', status: 'confirmed' },
  { id: 'demo_9', customer_name: 'Ava Campbell', service_name: 'Full Press Set (2h)', price: 450000, start_time: '11:00', end_time: '13:00', staff_id: 'st_3', staff_name: 'Minh P.', facility_id: 'fac_nail_3', facility_name: 'Bàn Làm Nail 3', status: 'pending' },
  { id: 'demo_10', customer_name: 'Sophia Hernandez', service_name: 'Full Press Set (2h)', price: 450000, start_time: '13:30', end_time: '15:30', staff_id: 'st_3', staff_name: 'Minh P.', facility_id: 'fac_nail_3', facility_name: 'Bàn Làm Nail 3', status: 'checked_in' },
  { id: 'demo_11', customer_name: 'Olivia Thompson', service_name: 'Full Press Set (2h)', price: 450000, start_time: '11:00', end_time: '12:00', staff_id: 'st_4', staff_name: 'Ethan O.', facility_id: 'fac_nail_4', facility_name: 'Bàn Làm Nail 4', status: 'checked_in' },
  { id: 'demo_12', customer_name: 'Kylie Walker', service_name: 'Full Press Set (2h)', price: 450000, start_time: '12:00', end_time: '13:00', staff_id: 'st_4', staff_name: 'Ethan O.', facility_id: 'fac_nail_4', facility_name: 'Bàn Làm Nail 4', status: 'checked_in' },
  { id: 'demo_13', customer_name: 'Andrew Robinson', service_name: 'Full Press Set (2h)', price: 450000, start_time: '13:00', end_time: '14:30', staff_id: 'st_4', staff_name: 'Ethan O.', facility_id: 'fac_nail_4', facility_name: 'Bàn Làm Nail 4', status: 'confirmed' },
  { id: 'demo_14', customer_name: 'Grace Moore', service_name: 'Full Press Set (2h)', price: 450000, start_time: '13:30', end_time: '14:30', staff_id: 'st_5', staff_name: 'Rose H.', facility_id: 'fac_room_1', facility_name: 'Phòng Spa VIP 1', status: 'checked_in' },
  { id: 'demo_15', customer_name: 'Chloe Scott', service_name: 'Full Press Set (2h)', price: 450000, start_time: '11:00', end_time: '13:00', staff_id: 'st_6', staff_name: 'Jenie K.', facility_id: 'fac_room_2', facility_name: 'Phòng Spa VIP 2', status: 'in_progress' },
  { id: 'demo_16', customer_name: 'Madison Baker', service_name: 'Full Press Set (2h)', price: 450000, start_time: '13:00', end_time: '14:30', staff_id: 'st_6', staff_name: 'Jenie K.', facility_id: 'fac_room_2', facility_name: 'Phòng Spa VIP 2', status: 'checked_in' },
  { id: 'demo_17', customer_name: 'Mia Carter', service_name: 'Full Press Set (2h)', price: 450000, start_time: '11:00', end_time: '13:00', staff_id: 'st_7', staff_name: 'Nga H.', facility_id: 'fac_vip_1', facility_name: 'Ghế Cắt Tóc VIP 1', status: 'checked_in' },
  { id: 'demo_18', customer_name: 'Trần Thu Hà', service_name: 'Cắt gội xấy tạo kiểu (1.5h)', price: 250000, start_time: '09:30', end_time: '11:00', staff_id: 'st_1', staff_name: 'Maria A.', facility_id: 'fac_vip_1', facility_name: 'Ghế Cắt Tóc VIP 1', status: 'completed' },
  { id: 'demo_19', customer_name: 'Đặng Văn Lâm', service_name: 'Massage cổ vai gáy (1h)', price: 300000, start_time: '10:00', end_time: '11:00', staff_id: 'st_5', staff_name: 'Rose H.', facility_id: 'fac_room_1', facility_name: 'Phòng Spa VIP 1', status: 'completed' },
  { id: 'demo_20', customer_name: 'Nguyễn Hoàng Nam', service_name: 'Uốn tóc Hàn Quốc (2h)', price: 650000, start_time: '14:00', end_time: '16:00', staff_id: 'st_4', staff_name: 'Ethan O.', facility_id: 'fac_vip_2', facility_name: 'Ghế Cắt Tóc VIP 2', status: 'cancelled' },
  { id: 'demo_21', customer_name: 'Phạm Đức Anh', service_name: 'Chăm sóc da chuyên sâu (1.5h)', price: 500000, start_time: '15:00', end_time: '16:30', staff_id: 'st_6', staff_name: 'Jenie K.', facility_id: 'fac_room_2', facility_name: 'Phòng Spa VIP 2', status: 'no_show' },
  { id: 'demo_break_1', customer_name: 'Nghỉ trưa', service_name: 'Khung giờ bận', price: 0, start_time: '12:00', end_time: '13:00', staff_id: 'st_1', staff_name: 'Maria A.', is_break: true, status: 'break' },
  { id: 'demo_break_2', customer_name: 'Nghỉ trưa', service_name: 'Khung giờ bận', price: 0, start_time: '12:30', end_time: '13:30', staff_id: 'st_3', staff_name: 'Minh P.', is_break: true, status: 'break' }
];

const STATUS_COLORS = {
  pending: '#94A3B8',
  confirmed: '#60A5FA',
  checked_in: '#FBBF24',
  in_progress: '#A78BFA',
  completed: '#34D399',
  cancelled: '#F87171',
  no_show: '#F97316'
};

export default function Appointments() {
  const { t } = useT();
  const STATUS_LABEL = useMemo(() => ({
    pending: t('dashboard.status.pending', 'Chờ xác nhận'),
    confirmed: t('dashboard.status.confirmed', 'Đã xác nhận'),
    checked_in: t('dashboard.status.checked_in', 'Đã check-in'),
    in_progress: t('dashboard.status.in_progress', 'Đang làm'),
    completed: t('dashboard.status.completed', 'Hoàn thành'),
    cancelled: t('dashboard.status.cancelled', 'Đã hủy'),
    no_show: t('dashboard.status.no_show', 'Không đến')
  }), [t]);
  const router = useRouter();
  const { currentBranchId } = useBranch();
  const [date, setDate] = useState(todayStr());

  const handleViewInvoice = async (appt) => {
    try {
      const list = await base44.entities.Invoice.list();
      const matched = list.find(
        (inv) =>
          (inv.customer_id && appt.customer_id && inv.customer_id === appt.customer_id) ||
          (inv.customer_name && appt.customer_name && inv.customer_name === appt.customer_name)
      );
      if (matched) {
        router.push(`/invoices/${matched.id}`);
      } else {
        router.push('/invoices');
      }
    } catch (e) {
      router.push('/invoices');
    }
  };

  // View States
  const [targetEntity, setTargetEntity] = useState('staff'); // 'staff' | 'facility'
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'calendar' | 'list'

  // Filters
  const [selectedService, setSelectedService] = useState('all');
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [bookedOnly, setBookedOnly] = useState(false);
  const [listStatusFilter, setListStatusFilter] = useState('all');

  // Data
  const [demoAppts, setDemoAppts] = useState(() => SAMPLE_DEMO_APPOINTMENTS);
  const [appointments, setAppointments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [timeBlockModalOpen, setTimeBlockModalOpen] = useState(false);
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [posModalOpen, setPosModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [checkoutCustomer, setCheckoutCustomer] = useState(null);
  const [checkoutInitialCart, setCheckoutInitialCart] = useState([]);
  const [checkoutAppointmentId, setCheckoutAppointmentId] = useState(null);

  const load = async () => {
    setLoading(true);

    Promise.all([
      base44.entities.Appointment.list(),
      base44.entities.Staff.filter(currentBranchId === 'all' ? {} : { branch_id: currentBranchId }),
      base44.entities.Customer.list(),
      base44.entities.Service ? base44.entities.Service.list() : Promise.resolve([]),
      base44.entities.Facility.filter(currentBranchId === 'all' ? {} : { branch_id: currentBranchId }).catch(() => [])
    ])
      .then(([allAppts, st, cus, srv, facData]) => {
        const cusMap = Object.fromEntries(cus.map((c) => [c.id, c]));
        const stMap = Object.fromEntries(st.map((s) => [s.id, s]));
        const srvMap = Object.fromEntries(srv.map((s) => [s.id || s.name, s]));
        const effectiveFacilities = facData?.length > 0 ? facData : DEFAULT_FACILITIES;

        
        // Filter out inactive staff for scheduling
        const activeStaffList = st.filter(s => s.is_active !== false);

        // Filter real appointments by date & branch
        const realApptsForDate = (allAppts || []).filter((a) => {
          const matchesDate = !a.date || a.date === date || (typeof a.date === 'string' && a.date.startsWith(date));
          const matchesBranch = currentBranchId === 'all' || !a.branch_id || a.branch_id === currentBranchId;
          return matchesDate && matchesBranch;
        });

        // Merge real created appointments with sample demo appointments (filtering duplicates)
        const realIds = new Set(realApptsForDate.map((a) => a.id));
        const isToday = !date || date === todayStr();
        const demoFiltered = isToday ? demoAppts.filter((d) => !realIds.has(d.id)) : [];
        const combinedList = [...realApptsForDate, ...demoFiltered];

        const enriched = [];
        combinedList.forEach((a, idx) => {
          const defaultFac = effectiveFacilities[idx % effectiveFacilities.length] || effectiveFacilities[0];
          const cusAvatar = a.customer_id ? cusMap[a.customer_id]?.avatar_url : a.customer_avatar_url;
          a.customer_avatar_url = cusAvatar;

          if (a.services && Array.isArray(a.services) && a.services.length > 1) {
            let currentCascadeTime = a.start_time || '09:00';
            a.services.forEach((sItem, sIdx) => {
              // For multi-service appointments, we never fall back to a.staff_id. If missing, it's unassigned.
              const staffId = sItem.staff_id || '__unassigned';
              const stObj = stMap[staffId];
              const srvObj = srvMap[sItem.service_id] || srvMap[sItem.service_name] || srv.find((s) => s.name === sItem.service_name);
              const facId = sItem.facility_id || a.facility_id || defaultFac?.id;
              const facObj = effectiveFacilities.find(f => f.id === facId);

              const sDur = sItem.duration_minutes || sItem.duration || srvObj?.duration_minutes || a.duration_minutes || 60;
              const sStart = sItem.start_time || currentCascadeTime;
              const sEnd = sItem.end_time || (() => {
                 const [h, m] = sStart.split(':').map(Number);
                 const t = h * 60 + m + sDur;
                 return `${String(Math.floor(t/60)%24).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
              })();
              currentCascadeTime = sEnd;

              enriched.push({
                ...a,
                id: `${a.id}_service_${sIdx}`,
                parent_appointment_id: a.id,
                raw_appointment: a,
                _serviceIndex: sIdx,
                service_id: sItem.service_id || '',
                service_name: sItem.service_name || sItem.name || a.service_name,
                staff_id: staffId,
                staff_name: stObj?.full_name || stObj?.name || sItem.staff_name || (staffId === '__unassigned' ? t('appointments.unassigned', 'Chưa phân công') : 'Nhân viên'),
                staff_avatar_url: stObj?.avatar_url || sItem.staff_avatar_url,
                facility_id: facId,
                facility_name: facObj?.name || sItem.facility_name || a.facility_name || defaultFac.name,
                price: sItem.price || srvObj?.price || a.price,
                duration_minutes: sDur,
                start_time: sStart,
                end_time: sEnd,
                customer_avatar_url: cusAvatar
              });
            });
          } else {
            const staffId = a.staff_id || (a.services?.[0]?.staff_id) || '__unassigned';
            const stObj = stMap[staffId];
            const srvObj = srvMap[a.service_id] || srvMap[a.service_name] || srv.find((s) => s.name === a.service_name);
            const finalPrice = a.price || srvObj?.price || 450000;

            enriched.push({
              ...a,
              raw_appointment: a,
              staff_id: staffId,
              facility_id: a.facility_id || defaultFac.id,
              facility_name: a.facility_name || defaultFac.name,
              price: finalPrice,
              staff_name: a.staff_name || stObj?.full_name || stObj?.name || (staffId === '__unassigned' ? t('appointments.unassigned', 'Chưa phân công') : 'Nhân viên'),
              staff_avatar_url: stObj?.avatar_url || a.staff_avatar_url,
              customer_avatar_url: cusAvatar
            });
          }
        });

        setAppointments(enriched.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')));
        setStaff(activeStaffList);
        setCustomers(cus);
        setServices(srv);
        setFacilities(effectiveFacilities);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading appointments:', err);
        setAppointments(SAMPLE_DEMO_APPOINTMENTS);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
    window.addEventListener('reload-data', load);

    // Supabase Realtime (requires table replication enabled in DB)
    const channel = supabase
      .channel('public:appointment')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointment' }, () => {
        load();
      })
      .subscribe();

    return () => {
      window.removeEventListener('reload-data', load);
      supabase.removeChannel(channel);
    };
  }, [date, currentBranchId]);

  const createUnpaidInvoiceFromAppointment = async (appt) => {
    try {
      const list = await base44.entities.Invoice.list();
      const exists = list.some(
        (inv) =>
          inv.customer_id === appt.customer_id &&
          inv.status === 'unpaid' &&
          inv.items.some((x) => x.name === appt.service_name)
      );
      if (exists) return;

      const saleCode = 'SC' + String(Math.floor(100000 + Math.random() * 900000));
      const items = [];

      if (appt.services && appt.services.length) {
        appt.services.forEach((s) => {
          items.push({
            name: s.service_name || s.name || appt.service_name,
            type: 'service',
            price: s.price || appt.price || 0,
            qty: 1,
            staff_id: s.staff_id || appt.staff_id || '',
            staff_name: s.staff_name || appt.staff_name || ''
          });
        });
      } else {
        items.push({
          name: appt.service_name,
          type: 'service',
          price: appt.price || 0,
          qty: 1,
          staff_id: appt.staff_id || '',
          staff_name: appt.staff_name || ''
        });
      }

      const subtotal = items.reduce((sum, i) => sum + i.price, 0);

      await base44.entities.Invoice.create({
        invoice_code: saleCode,
        customer_name: appt.customer_name || 'Khách vãng lai',
        customer_id: appt.customer_id || '',
        branch_id: appt.branch_id || '',
        items,
        subtotal,
        discount: 0,
        total: subtotal,
        tip: 0,
        status: 'unpaid',
        date: todayStr()
      });
      toast.success(`Đã tự động đẩy hóa đơn tạm tính sang POS • ${saleCode}`);
    } catch (e) {
      console.error('Lỗi khi tự động tạo hóa đơn tạm tính:', e);
    }
  };

  const updateStatus = async (appt, status) => {
    const targetAppt = appt.raw_appointment || appt;
    if (status === 'view_invoice') {
      handleViewInvoice(targetAppt);
      return;
    }

    const targetId = targetAppt.parent_appointment_id || targetAppt.id;

    // 1. Instantly update local appointments state
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id === appt.id || a.id === targetId || a.parent_appointment_id === targetId) {
          return {
            ...a,
            status,
            raw_appointment: a.raw_appointment ? { ...a.raw_appointment, status } : undefined
          };
        }
        return a;
      })
    );

    // 2. If demo appointment, update demoAppts state so re-loads preserve status
    if (String(targetId).startsWith('demo_')) {
      setDemoAppts((prev) =>
        prev.map((d) => (d.id === targetId ? { ...d, status } : d))
      );
    } else {
      // 3. Real appointment -> update backend
      try {
        await base44.entities.Appointment.update(targetId, { status });
      } catch (e) {
        toast.error(t('appointments.err_update_status', 'Lỗi khi cập nhật trạng thái trên server:') + ' ' + (e.message || e));
      }
    }

    toast.success(`${t('appointments.status_changed_to', 'Đã chuyển sang:')} ${STATUS_LABEL[status] || status}`);

    if (status === 'checked_in') {
      await createUnpaidInvoiceFromAppointment(targetAppt);
    }

    if (status === 'completed') {
      const cust = customers.find((c) => c.id === targetAppt.customer_id) || {
        id: targetAppt.customer_id,
        name: targetAppt.customer_name,
        phone: targetAppt.customer_phone || ''
      };
      setCheckoutCustomer(cust);

      const initialCart = [];
      if (targetAppt.services && targetAppt.services.length) {
        targetAppt.services.forEach((s) => {
          initialCart.push({
            name: s.service_name || s.name || targetAppt.service_name,
            price: s.price || targetAppt.price || 0,
            type: 'service',
            staff_id: s.staff_id || targetAppt.staff_id || '',
            staff_name: s.staff_name || targetAppt.staff_name || ''
          });
        });
      } else {
        initialCart.push({
          name: targetAppt.service_name,
          price: targetAppt.price || 0,
          type: 'service',
          staff_id: targetAppt.staff_id || '',
          staff_name: targetAppt.staff_name || ''
        });
      }
      setCheckoutInitialCart(initialCart);
      setCheckoutAppointmentId(targetId);
      setPosModalOpen(true);
    }
  };

  const handleDeleteAppt = async (appt, forceDelete = false) => {
    const targetAppt = appt.raw_appointment || appt;
    if (!targetAppt || !targetAppt.id) return;
    
    const targetId = targetAppt.parent_appointment_id || targetAppt.id;
    const currentStaffId = appt.staff_id;
    const services = targetAppt.services || [];
    
    // If clicking from a specific staff's column, we unassign them. 
    // Full delete only happens from Unassigned column (currentStaffId is null) or List View (forceDelete is true)
    if (currentStaffId && !forceDelete) {
      if (!window.confirm(t('appointments.confirm_unassign_staff', 'Bạn có muốn gỡ nhân viên {staffName} khỏi lịch hẹn này (chuyển về Chưa phân công) không?').replace('{staffName}', appt.staff_name || ''))) return;
      
      try {
        const updatedServices = services.map((s, idx) => {
          if (appt._serviceIndex !== undefined && idx === appt._serviceIndex) {
            return { ...s, staff_id: '', staff_name: t('appointments.unassigned', t('appointments.unassigned', 'Chưa phân công')) };
          } else if (appt._serviceIndex === undefined) {
            // fallback if it's a single service without index: just unassign it!
            return { ...s, staff_id: '', staff_name: t('appointments.unassigned', t('appointments.unassigned', 'Chưa phân công')) };
          }
          return s;
        });
        
        const payload = { 
          services: updatedServices,
          staff_id: updatedServices[0]?.staff_id || null,
          staff_name: updatedServices[0]?.staff_name || t('appointments.unassigned', t('appointments.unassigned', 'Chưa phân công'))
        };
        if (!String(targetId).startsWith('demo_')) {
          await base44.entities.Appointment.update(targetId, payload);
        } else {
          setDemoAppts(prev => prev.map(d => d.id === targetId ? { ...d, ...payload } : d));
        }
        
        load(); // reload to reflect changes
        toast.success(t('appointments.unassigned_staff_success', 'Đã gỡ nhân viên khỏi lịch hẹn'));
        return;
      } catch (e) {
        toast.error(t('appointments.err_unassign_staff', 'Lỗi khi gỡ nhân viên:') + ' ' + (e.message || e));
        return;
      }
    }

    if (!window.confirm(t('appointments.confirm_delete_appt', 'Bạn có chắc chắn muốn xóa toàn bộ lịch hẹn của {customerName}?').replace('{customerName}', targetAppt.customer_name || t('appointments.customer_fallback', 'khách hàng')))) return;

    try {
      if (!String(targetId).startsWith('demo_')) {
        await base44.entities.Appointment.delete(targetId);
      } else {
        setDemoAppts((prev) => prev.filter((d) => d.id !== targetId));
      }

      setAppointments((prev) => prev.filter((a) => a.id !== targetId && a.parent_appointment_id !== targetId && a.id !== appt.id));
      toast.success(t('appointments.delete_appt_success', 'Đã xóa lịch hẹn thành công'));
    } catch (e) {
      toast.error(t('appointments.err_delete_appt', 'Lỗi khi xóa lịch hẹn:') + ' ' + (e.message || e));
    }
  };

  // Filter appointments
  const filteredAppointments = appointments.filter((a) => {
    if (a.date !== date) return false;
    
    if (selectedService !== 'all') {
      const targetSrv = selectedService.toLowerCase().trim();
      const targetSrvClean = targetSrv.replace(/\s*\([^)]*\)/g, '').trim();
      const aSrvName = (a.service_name || '').toLowerCase().trim();
      const aSrvClean = aSrvName.replace(/\s*\([^)]*\)/g, '').trim();
      
      const matchName = aSrvName.includes(targetSrvClean) || targetSrvClean.includes(aSrvClean);
      const matchServicesArray = a.services?.some((s) => {
        const sName = (s.service_name || s.name || '').toLowerCase().trim();
        const sClean = sName.replace(/\s*\([^)]*\)/g, '').trim();
        return sName.includes(targetSrvClean) || targetSrvClean.includes(sClean);
      });
      if (!matchName && !matchServicesArray) return false;
    }

    if (selectedStaff !== 'all') {
      if (targetEntity === 'staff') {
        const matchStaffId = a.staff_id === selectedStaff || (selectedStaff === '__unassigned' && (!a.staff_id || a.staff_id === '__unassigned'));
        const matchStaffName = (a.staff_name || '').toLowerCase().includes(selectedStaff.toLowerCase()) ||
          (selectedStaff.toLowerCase().includes((a.staff_name || '').toLowerCase()));
        const matchArray = a.services?.some((s) => s.staff_id === selectedStaff);
        if (!matchStaffId && !matchStaffName && !matchArray) return false;
      } else if (targetEntity === 'facility') {
        const matchFacId = a.facility_id === selectedStaff;
        const matchFacName = (a.facility_name || '').toLowerCase().includes(selectedStaff.toLowerCase()) ||
          (selectedStaff.toLowerCase().includes((a.facility_name || '').toLowerCase()));
        if (!matchFacId && !matchFacName) return false;
      }
    }

    if (bookedOnly && (a.status === 'cancelled' || a.status === 'no_show')) return false;
    return true;
  });

  const [presetSlot, setPresetSlot] = useState(null);

  const handleSlotClick = (row, slotTime) => {
    setEditing(null);
    if (row && slotTime) {
      setPresetSlot({
        startTime: slotTime,
        staffId: targetEntity === 'staff' ? (row.id === '__unassigned' ? '' : row.id) : '',
        staffName: targetEntity === 'staff' ? (row.id === '__unassigned' ? '' : row.name) : '',
        facilityId: targetEntity === 'facility' ? row.id : '',
        facilityName: targetEntity === 'facility' ? row.name : ''
      });
    } else {
      setPresetSlot(null);
    }
    setModalOpen(true);
  };

  const handleApptDrop = async (appt, targetRow, newStartTime) => {
    try {
      const targetAppt = appt.raw_appointment || appt;
      const targetId = targetAppt.parent_appointment_id || targetAppt.id;

      const startMins = timeStringToMinutes(newStartTime || '09:00');
      let duration = 60;
      if (appt.start_time && appt.end_time) {
        const sMins = timeStringToMinutes(appt.start_time);
        const eMins = timeStringToMinutes(appt.end_time);
        if (eMins > sMins) duration = eMins - sMins;
      }
      const newEndTime = formatMinutesToTime(startMins + duration);

      const payload = {
        ...targetAppt,
        start_time: newStartTime,
        end_time: newEndTime
      };

      if (targetEntity === 'staff' && targetRow) {
        payload.staff_id = targetRow.id === '__unassigned' ? '' : targetRow.id;
        payload.staff_name = targetRow.id === '__unassigned' ? '' : targetRow.name;
      } else if (targetEntity === 'facility' && targetRow) {
        payload.facility_id = targetRow.id;
        payload.facility_name = targetRow.name;
      }

      delete payload.customer_avatar_url;
      delete payload.staff_avatar_url;

      if (targetId && !String(targetId).startsWith('demo_')) {
        await base44.entities.Appointment.update(targetId, payload);
        toast.success(`Đã chuyển lịch hẹn sang ${newStartTime} - ${newEndTime}${targetRow ? ` (${targetRow.name})` : ''}`);
        load();
      } else {
        setAppointments((prev) =>
          prev.map((a) => (a.id === targetId ? { ...a, ...payload } : a))
        );
        toast.success(`Đã cập nhật vị trí lịch hẹn ${newStartTime} - ${newEndTime}`);
      }
    } catch (err) {
      toast.error('Không thể chuyển lịch hẹn: ' + (err.message || err));
    }
  };

  const uniqueRawAppointments = [];
  const _rawMap = {};
  filteredAppointments.forEach(a => {
    const rawId = a.parent_appointment_id || a.id;
    if (!_rawMap[rawId]) {
      _rawMap[rawId] = a.raw_appointment || a;
      uniqueRawAppointments.push(a.raw_appointment || a);
    }
  });

  const grouped = uniqueRawAppointments.reduce((acc, a) => {
    (acc[a.status] = acc[a.status] || []).push(a);
    return acc;
  }, {});
  const orderedStatuses = ['pending', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'];

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3 font-body overflow-hidden">
      {/* Header Bar */}
      <div className="shrink-0 bg-slate-50 pb-2 pt-1 border-b border-slate-200/60 shadow-2xs relative z-50">
        <AppointmentHeader
          targetEntity={targetEntity}
          setTargetEntity={setTargetEntity}
          viewMode={viewMode}
          setViewMode={setViewMode}
          selectedDate={date}
          setSelectedDate={setDate}
          selectedService={selectedService}
          setSelectedService={setSelectedService}
          selectedStaff={selectedStaff}
          setSelectedStaff={setSelectedStaff}
          bookedOnly={bookedOnly}
          setBookedOnly={setBookedOnly}
          servicesList={services}
          staffList={staff}
          facilityList={facilities}
          onAddClick={() => {
            setEditing(null);
            setPresetSlot(null);
            setModalOpen(true);
          }}
          onAddTimeBlockClick={() => {
            setTimeBlockModalOpen(true);
          }}
          onSettingsClick={() => setIsSettingsOpen(true)}
          onFacilityManagementClick={() => setIsFacilityModalOpen(true)}
        />
      </div>

      {/* Main Body Views */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : viewMode === 'timeline' ? (
        <AppointmentTimelineView
          targetEntity={targetEntity}
          appointments={filteredAppointments}
          staffList={staff}
          facilityList={facilities}
          selectedStaff={selectedStaff}
          onUpdateStatus={updateStatus}
          onDeleteAppt={handleDeleteAppt}
          onApptClick={(a) => {
            setEditing(a.raw_appointment || a);
            setModalOpen(true);
          }}
          onSlotClick={handleSlotClick}
          onApptDrop={handleApptDrop}
        />
      ) : viewMode === 'calendar' ? (
        <AppointmentCalendarView
          targetEntity={targetEntity}
          appointments={filteredAppointments}
          staffList={staff}
          facilityList={facilities}
          selectedStaff={selectedStaff}
          onUpdateStatus={updateStatus}
          onDeleteAppt={handleDeleteAppt}
          onApptClick={(a) => {
            setEditing(a.raw_appointment || a);
            setModalOpen(true);
          }}
          onSlotClick={handleSlotClick}
          onApptDrop={handleApptDrop}
        />
      ) : (
        /* LIST VIEW */
        <div className="space-y-4 font-body flex-1 overflow-y-auto pr-1">
          {/* Status Tabs Navigation */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200/80 shrink-0">
            <button
              onClick={() => setListStatusFilter('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                listStatusFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-xs border border-transparent'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{t('common.all', 'Tất cả')}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${listStatusFilter === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {uniqueRawAppointments.length}
              </span>
            </button>

            {orderedStatuses.map((stKey) => {
              const count = (grouped[stKey] || []).length;
              const isActive = listStatusFilter === stKey;
              return (
                <button
                  key={stKey}
                  onClick={() => setListStatusFilter(stKey)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? 'shadow-xs border border-transparent text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                  style={isActive ? { backgroundColor: STATUS_COLORS[stKey] } : {}}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isActive ? '#ffffff' : STATUS_COLORS[stKey] }} />
                  <span>{STATUS_LABEL[stKey]}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Status Lists Content */}
          <div className="space-y-6 pt-1">
            {orderedStatuses
              .filter((stKey) => listStatusFilter === 'all' || listStatusFilter === stKey)
              .map((status) => {
                const list = grouped[status] || [];
                return (
                  <div key={status} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ background: STATUS_COLORS[status] }} />
                        <h3 className="font-bold text-sm text-slate-800">{STATUS_LABEL[status]}</h3>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                          {list.length} {t('appointments.count_label', 'lịch hẹn')}
                        </span>
                      </div>
                    </div>

                    {list.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                        {t('appointments.no_appt_in_status', 'Chưa có lịch hẹn nào ở trạng thái')} {STATUS_LABEL[status]}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                        {list.map((a) => {
                          const statusColor = STATUS_COLORS[status] || '#64748B';
                          return (
                            <div
                              key={a.id}
                              onClick={() => {
                                setEditing(a.raw_appointment || a);
                                setModalOpen(true);
                              }}
                              className="rounded-xl border shadow-2xs p-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between overflow-hidden relative cursor-pointer group"
                              style={{
                                borderLeftWidth: '4px',
                                borderLeftColor: statusColor,
                                borderColor: statusColor + '80',
                                backgroundColor: statusColor + '40',
                                backdropFilter: 'blur(8px)'
                              }}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAppt(a, true);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all absolute top-2 right-2 shrink-0 z-10 bg-white/80 shadow-xs border border-red-100 backdrop-blur-sm"
                                title={t('appointments.delete_this_appt', 'Xóa toàn bộ lịch hẹn này')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-2">
                                  <div className="flex items-center gap-1 font-bold text-xs text-slate-800 tracking-tight">
                                    <Clock className="w-3 h-3 text-slate-500" />
                                    <span>
                                      {a.start_time?.slice(0, 5)} - {a.end_time?.slice(0, 5) || '?'}
                                    </span>
                                  </div>
                                  <span
                                    className="text-[9px] font-bold rounded-full py-0.5 px-2 whitespace-nowrap shrink-0 border"
                                    style={{
                                      backgroundColor: statusColor + '40',
                                      color: statusColor,
                                      borderColor: statusColor + '60'
                                    }}
                                  >
                                    {STATUS_LABEL[status]}
                                  </span>
                                </div>

                                <div className="text-[12px] font-semibold text-slate-800 truncate mb-1.5" title={a.service_name}>
                                  {a.service_name || t('dashboard.chua_chon_dich_vu', 'Chưa chọn dịch vụ')}
                                </div>

                                <div className="flex items-center gap-2 my-1.5 bg-white/80 p-1.5 rounded-lg border border-slate-100/80">
                                  <Avatar 
                                    src={a.customer_avatar_url} 
                                    name={a.customer_name} 
                                    size={24} 
                                    color="#E879A9" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(a.customer_id ? `/customers?id=${a.customer_id}` : `/customers?name=${encodeURIComponent(a.customer_name)}`);
                                    }}
                                    title={t('appointments.view_cust_details', 'Click để xem chi tiết khách hàng')}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(a.customer_id ? `/customers?id=${a.customer_id}` : `/customers?name=${encodeURIComponent(a.customer_name)}`);
                                      }}
                                      className="font-semibold text-slate-700 hover:text-orange-600 hover:underline cursor-pointer text-xs truncate text-left block"
                                      title={t('appointments.view_cust_details', 'Click để xem chi tiết khách hàng')}
                                    >
                                      {a.customer_name}
                                    </button>
                                    {a.customer_phone && (
                                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                        <Phone className="w-2.5 h-2.5" />
                                        {a.customer_phone}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between gap-1 mt-1.5 text-[11px]">
                                  <div className="min-w-0 flex items-center gap-1">
                                    {targetEntity === 'facility' && a.facility_name && (
                                      <span className="font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-100 truncate">
                                        📍 {a.facility_name}
                                      </span>
                                    )}
                                    {(() => {
                                      let uniqueStaff = [];
                                      if (a.services && Array.isArray(a.services) && a.services.length > 0) {
                                        const map = new Map();
                                        a.services.forEach(s => {
                                          const sId = s.staff_id || a.staff_id;
                                          const stObj = staff.find(st => st.id === sId);
                                          const name = stObj?.full_name || stObj?.name || s.staff_name || a.staff_name || t('nav.staff', 'Nhân viên');
                                          const avatar = stObj?.avatar_url || s.staff_avatar_url || a.staff_avatar_url;
                                          if (sId && !map.has(sId)) {
                                            map.set(sId, { id: sId, name, avatar });
                                          } else if (!sId && !map.has(name)) {
                                            map.set(name, { id: name, name, avatar });
                                          }
                                        });
                                        uniqueStaff = Array.from(map.values());
                                      } else {
                                        if (a.staff_name) {
                                          uniqueStaff = [{ id: a.staff_id, name: a.staff_name, avatar: a.staff_avatar_url }];
                                        }
                                      }

                                      if (uniqueStaff.length > 1) {
                                        return (
                                          <div className="flex -space-x-1 overflow-hidden" title={uniqueStaff.map(s => s.name).join(', ')}>
                                            {uniqueStaff.map((st, i) => (
                                              <div key={i} className="inline-block rounded-full ring-2 ring-white">
                                                <Avatar src={st.avatar} name={st.name} size={16} color="#10B981" />
                                              </div>
                                            ))}
                                          </div>
                                        );
                                      } else if (uniqueStaff.length === 1) {
                                        const st = uniqueStaff[0];
                                        return (
                                          <span className="text-slate-600 font-medium truncate flex items-center gap-1">
                                            <Avatar src={st.avatar} name={st.name} size={14} color="#10B981" />
                                            <span className="truncate">{st.name}</span>
                                          </span>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                  {a.price > 0 && (
                                    <div className="font-bold text-pink-600 shrink-0 text-xs bg-pink-50/90 border border-pink-100 px-1.5 py-0.2 rounded-md">
                                      {formatVND(a.price)}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-slate-200/60 whitespace-nowrap overflow-x-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-1 shrink-0">
                                  {status === 'pending' && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); updateStatus(a, 'confirmed'); }}
                                      className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 transition cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      {t('appointments.btn_confirm', 'Xác nhận')}
                                    </button>
                                  )}
                                  {(status === 'pending' || status === 'confirmed') && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); updateStatus(a, 'checked_in'); }}
                                      className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-semibold hover:bg-amber-100 transition cursor-pointer"
                                    >
                                      Check-in
                                    </button>
                                  )}
                                  {(status === 'confirmed' || status === 'checked_in') && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); updateStatus(a, 'in_progress'); }}
                                      className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-semibold hover:bg-purple-100 transition cursor-pointer"
                                    >
                                      {t('appointments.btn_start', 'Bắt đầu')}
                                    </button>
                                  )}
                                  {(status === 'checked_in' || status === 'in_progress' || status === 'confirmed') && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); updateStatus(a, 'completed'); }}
                                      className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold hover:emerald-100 transition cursor-pointer"
                                    >
                                      <UserCheck className="w-3 h-3" />
                                      {t('appointments.btn_checkout', 'Thanh toán')}
                                    </button>
                                  )}
                                  {status === 'completed' && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); updateStatus(a, 'view_invoice'); }}
                                      className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-white font-semibold hover:bg-slate-900 transition cursor-pointer"
                                    >
                                      {t('appointments.btn_view_invoice', 'Xem hóa đơn')}
                                    </button>
                                  )}
                                  {(status === 'cancelled' || status === 'no_show') && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); updateStatus(a, 'pending'); }}
                                      className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 transition cursor-pointer"
                                    >
                                      {t('appointments.btn_reset', 'Đặt lại')}
                                    </button>
                                  )}
                                  {status !== 'cancelled' && status !== 'completed' && status !== 'no_show' && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); updateStatus(a, 'cancelled'); }}
                                      className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 font-semibold hover:bg-rose-100 transition cursor-pointer"
                                    >
                                      <XCircle className="w-3 h-3" />
                                      {t('common.cancel', 'Hủy')}
                                    </button>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 shrink-0 ml-auto">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditing(a.raw_appointment || a);
                                      setModalOpen(true);
                                    }}
                                    className="text-[10px] p-1.5 rounded-full bg-white text-slate-600 border border-slate-200 font-semibold hover:bg-slate-100 transition cursor-pointer"
                                    title={t('common.edit', 'Chỉnh sửa')}
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteAppt(a);
                                    }}
                                    className="text-[10px] p-1.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 font-semibold hover:bg-rose-100 transition cursor-pointer"
                                    title={t('appointments.delete_appt', 'Xóa lịch hẹn')}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Appointment Create/Edit Modal */}
      <AppointmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
        branchId={currentBranchId}
        defaultDate={date}
        defaultStartTime={presetSlot?.startTime}
        defaultStaffId={presetSlot?.staffId}
        defaultStaffName={presetSlot?.staffName}
        defaultFacilityId={presetSlot?.facilityId}
        defaultFacilityName={presetSlot?.facilityName}
        facilityList={facilities}
        editing={editing}
        onCheckout={({ customer, cart }) => {
          setModalOpen(false);
          setCheckoutCustomer(customer);
          setCheckoutInitialCart(cart);
          setPosModalOpen(true);
        }}
      />

      {/* POS Invoice Modal */}
      {posModalOpen && (
        <POSInvoiceModal
          open={posModalOpen}
          customer={checkoutCustomer}
          initialCart={checkoutInitialCart}
          appointmentId={checkoutAppointmentId}
          onClose={() => setPosModalOpen(false)}
          onSaved={() => {
            setPosModalOpen(false);
            load();
          }}
        />
      )}

      {isSettingsOpen && (
        <AppointmentSettingsModal 
          open={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}

      {isFacilityModalOpen && (
        <FacilityManagementModal
          open={isFacilityModalOpen}
          onClose={() => setIsFacilityModalOpen(false)}
          services={services}
          onFacilityChange={load}
        />
      )}

      {timeBlockModalOpen && (
        <AddTimeBlockModal
          open={timeBlockModalOpen}
          onClose={() => setTimeBlockModalOpen(false)}
          staffList={staff}
          onSwitchToAppointment={() => {
            setTimeBlockModalOpen(false);
            setEditing(null);
            setPresetSlot(null);
            setModalOpen(true);
          }}
          onSave={(data) => {
            console.log('Saved Time Block:', data);
            toast.success(t('appointments.success_save_timeblock', 'Đã lưu Time Block'));
            setTimeBlockModalOpen(false);
          }}
        />
      )}
    </div>
  );
}