'use client';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Check, CalendarCheck, Phone, User, MessageSquare, Loader2, AlertCircle, Clock, MapPin, ChevronDown, CheckCircle2, ChevronUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatVND, todayStr } from '@/lib/format';
import StaffAssignPicker from '@/components/StaffAssignPicker';

// ─── Constants & Helpers ──────────────────────────────────────────────────────

const DAYS_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS_VI = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
const DAY_KEYS = ['sun','mon','tue','wed','thu','fri','sat'];

function generateSlots(open, close, stepMin) {
  const slots = [];
  const [oh, om] = open.split(':').map(Number);
  const [ch, cm] = close.split(':').map(Number);
  let cur = oh * 60 + om;
  const end = ch * 60 + cm;
  while (cur <= end) {
    const h = Math.floor(cur / 60).toString().padStart(2, '0');
    const m = (cur % 60).toString().padStart(2, '0');
    slots.push(`${h}:${m}`);
    cur += stepMin;
  }
  return slots;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function BranchDropdown({ branches, value, onChange, color }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = branches.find(b => b.id === value);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-300 bg-white focus:outline-none transition-all"
        style={{ '--tw-ring-color': color + '50' }}
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-slate-50 transition-colors" style={selected ? { borderColor: color, backgroundColor: color + '15' } : {}}>
          <MapPin className="w-4 h-4" style={selected ? { color } : { color: '#94a3b8' }} />
        </div>
        <div className="flex-1 min-w-0 text-left">
           {selected ? (
             <>
               <div className="text-sm font-medium text-slate-800 truncate">{selected.name}</div>
             </>
           ) : <span className="text-sm text-slate-400 font-medium">Chọn chi nhánh</span>}
        </div>
        <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-white rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.1)] border border-slate-200 py-1.5 max-h-64 overflow-y-auto custom-scrollbar">
          {branches.map(b => {
            const isSelected = selected?.id === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => { onChange(b.id); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 bg-slate-50 transition-colors" style={isSelected ? { borderColor: color, backgroundColor: color + '15' } : {}}>
                   <MapPin className="w-4 h-4" style={isSelected ? { color } : { color: '#94a3b8' }} />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <span className={`text-sm font-medium truncate ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>{b.name}</span>
                  {b.address && <span className="text-[10px] text-slate-400 truncate mt-0.5">{b.address}</span>}
                </div>
                {isSelected && <Check className="w-4 h-4 shrink-0" style={{ color }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PublicBookingPage({ slug }) {
  const [setting, setSetting] = useState(null);
  const [services, setServices] = useState([]);
  const [serviceGroups, setServiceGroups] = useState([]);
  const [branches, setBranches] = useState([]);
  const [staff, setStaff] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form State
  const [selectedBranch, setSelectedBranch] = useState('');
  const [guests, setGuests] = useState([{ id: 1, services: [] }]);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  });
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [form, setForm] = useState({ name: '', phone: '', note: '' });
  
  // UI State
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingCode, setBookingCode] = useState('');

  const color = setting?.primary_color || '#EC4899';

  useEffect(() => {
    if (!slug) return;
    loadData();
  }, [slug]);

  const loadData = async () => {
    try {
      const allSettings = await base44.entities.BookingSetting.list();
      const found = (allSettings || []).find(s => s.slug === slug);
      if (!found || !found.is_active) { setNotFound(!found); setLoading(false); return; }
      setSetting(found);

      const enabledServiceIds = found.enabled_service_ids || [];
      const enabledStaffIds = found.enabled_staff_ids || [];

      const [svcs, stf, appts, groups, allBranches] = await Promise.all([
        base44.entities.Service.list().catch(() => []),
        base44.entities.Staff.list().catch(() => []),
        base44.entities.Appointment.list().catch(() => []),
        base44.entities.ServiceGroup ? base44.entities.ServiceGroup.list().catch(() => []) : Promise.resolve([]),
        base44.entities.Branch ? base44.entities.Branch.list().catch(() => []) : Promise.resolve([]),
      ]);

      let filteredSvcs = (svcs || []).filter(s => s.is_active !== false);
      if (enabledServiceIds.length > 0) filteredSvcs = filteredSvcs.filter(s => enabledServiceIds.includes(s.id));

      let filteredStf = (stf || []).filter(s => s.is_active !== false);
      if (enabledStaffIds.length > 0) filteredStf = filteredStf.filter(s => enabledStaffIds.includes(s.id));

      setServices(filteredSvcs);
      setStaff(filteredStf);
      setAppointments(appts || []);
      
      const activeBranches = (allBranches || []).filter(b => 
        b.is_active !== false && 
        b.id !== 'all' && 
        !b.name?.toLowerCase().includes('tất cả')
      );
      setBranches(activeBranches);
      if (activeBranches.length > 0) {
        const defaultId = found.branch_id || activeBranches[0].id;
        const validDefault = activeBranches.find(b => b.id === defaultId) ? defaultId : activeBranches[0].id;
        setSelectedBranch(validDefault);
      }
      
      const activeGroups = (groups || []).filter(g => filteredSvcs.some(s => s.group_id === g.id));
      setServiceGroups(activeGroups);
      
      // Auto expand first group
      if (activeGroups.length > 0) {
        setExpandedGroup(activeGroups[0].id);
      } else {
        setExpandedGroup('all');
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ─── Logic Helpers ─────────────────────────────────────────────────────────

  const blockedDates = useMemo(() => new Set((setting?.blocked_dates || []).map(b => b.date)), [setting]);
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (setting?.max_advance_days || 30));
    return d.toISOString().slice(0, 10);
  }, [setting]);

  const isDateAvailable = (dateStr) => {
    if (dateStr < todayStr()) return false;
    if (dateStr > maxDate) return false;
    if (blockedDates.has(dateStr)) return false;
    const dow = new Date(dateStr + 'T00:00:00').getDay();
    const key = DAY_KEYS[dow];
    const wh = setting?.working_hours?.[key];
    return wh?.enabled !== false;
  };

  const getAvailableSlots = useCallback(() => {
    if (!selectedDate || !setting) return [];
    const dow = new Date(selectedDate + 'T00:00:00').getDay();
    const key = DAY_KEYS[dow];
    const wh = setting.working_hours?.[key];
    if (!wh?.enabled) return [];

    const slots = generateSlots(wh.open || '09:00', wh.close || '18:00', setting.slot_duration_minutes || 30);
    const now = new Date();
    const minMs = (setting.min_advance_hours || 1) * 3600000;

    return slots.map(slot => {
      let isAvailable = true;
      const slotDate = new Date(selectedDate + `T${slot}:00`);
      if (slotDate - now < minMs) isAvailable = false;
      return { time: slot, available: isAvailable };
    });
  }, [selectedDate, setting, appointments]);

  const disabledStaffIds = useMemo(() => {
    if (!selectedDate || !selectedTime || !setting || !appointments) return [];
    
    const maxAllowed = setting.allow_double_booking ? (setting.max_double_bookings || 2) : 1;
    const [h, m] = selectedTime.split(':').map(Number);
    const selectedTimeMinutes = h * 60 + m;

    const staffCounts = {};

    appointments.filter(a => a.date === selectedDate && a.status !== 'cancelled').forEach(app => {
      if (app.services && Array.isArray(app.services)) {
        app.services.forEach(svc => {
          if (!svc.staff_id) return;
          const [sh, sm] = (svc.start_time || app.start_time || '00:00').split(':').map(Number);
          const startMins = sh * 60 + sm;
          const [eh, em] = (svc.end_time || app.end_time || '00:00').split(':').map(Number);
          const endMins = eh * 60 + em;

          if (selectedTimeMinutes >= startMins && selectedTimeMinutes < endMins) {
             staffCounts[svc.staff_id] = (staffCounts[svc.staff_id] || 0) + 1;
          }
        });
      } else if (app.staff_id) {
          const [sh, sm] = (app.start_time || '00:00').split(':').map(Number);
          const startMins = sh * 60 + sm;
          const [eh, em] = (app.end_time || '00:00').split(':').map(Number);
          const endMins = eh * 60 + em;
          if (selectedTimeMinutes >= startMins && selectedTimeMinutes < endMins) {
             staffCounts[app.staff_id] = (staffCounts[app.staff_id] || 0) + 1;
          }
      }
    });

    return Object.keys(staffCounts).filter(id => staffCounts[id] >= maxAllowed);
  }, [selectedDate, selectedTime, setting, appointments]);

  const isFormValid = !!selectedDate && !!selectedTime && !!form.name.trim() && !!form.phone.trim() && guests.every(g => g.services.length > 0);

  const handleSubmit = async () => {
    if (!isFormValid) return;
    
    if (setting?.require_staff_selection) {
      const missingStaff = guests.some(g => g.services.some(s => !s.selected_staff));
      if (missingStaff) {
        alert('Vui lòng chọn nhân viên thực hiện cho tất cả các dịch vụ.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const code = `BK-${Date.now().toString().slice(-6)}`;
      
      const payloadServices = [];
      let currentStartTime = selectedTime;
      
      guests.forEach((g) => {
        let guestTime = currentStartTime;
        g.services.forEach(svc => {
          const durationMins = svc.duration_minutes || 60;
          const [h, m] = guestTime.split(':').map(Number);
          const endM = m + durationMins;
          const endH = h + Math.floor(endM / 60);
          const finalEndM = endM % 60;
          const endTimeStr = `${String(endH).padStart(2, '0')}:${String(finalEndM).padStart(2, '0')}`;
          
          payloadServices.push({
            service_id: svc.id,
            service_name: svc.name,
            staff_id: svc.selected_staff?.id || null,
            staff_name: svc.selected_staff?.name || 'Chưa phân công',
            start_time: guestTime,
            end_time: endTimeStr,
            price: svc.price || 0
          });
          
          guestTime = endTimeStr;
        });
      });

      const totalPrice = payloadServices.reduce((sum, s) => sum + s.price, 0);

      const phone = form.phone.trim();
      let name = form.name.trim();
      let customerId = null;

      try {
        const existingCustomers = await base44.entities.Customer.filter({ phone });
        if (existingCustomers && existingCustomers.length > 0) {
          customerId = existingCustomers[0].id;
          name = existingCustomers[0].name || name; // Use system name if available
        } else {
          const newCustomer = await base44.entities.Customer.create({
            name: name,
            phone: phone,
            branch_id: selectedBranch || setting?.branch_id || null,
            group: 'Mới',
            total_spending: 0,
            reward_points: 0
          });
          customerId = newCustomer.id;
        }
      } catch (err) {
        console.error('Error linking/creating customer:', err);
      }

      await base44.entities.Appointment.create({
        customer_id: customerId,
        customer_name: name,
        customer_phone: phone,
        note: (form.note || '') + ` (Mã: ${code})`,
        service_name: payloadServices.map(s => s.service_name).join(' + '),
        service_id: payloadServices[0]?.service_id || null,
        staff_id: payloadServices[0]?.staff_id || null,
        staff_name: payloadServices[0]?.staff_name || 'Bất kỳ',
        date: selectedDate,
        start_time: payloadServices[0]?.start_time || '00:00',
        end_time: payloadServices[payloadServices.length-1]?.end_time || '01:00',
        status: setting?.auto_confirm ? 'confirmed' : 'pending',
        source: 'online',
        branch_id: selectedBranch || setting?.branch_id || null,
        price: totalPrice,
        services: payloadServices
      });
      setBookingCode(code);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      alert('Đặt lịch thất bại: ' + (e.message || e));
    } finally {
      setSubmitting(false);
    }
  };

  // ─── UI Renderers ──────────────────────────────────────────────────────────

  const groupedServices = useMemo(() => {
    if (serviceGroups.length === 0) return [{ id: 'all', name: 'Tất cả dịch vụ', services }];
    
    const groups = serviceGroups.map(g => ({
      id: g.id,
      name: g.name,
      services: services.filter(s => s.group_id === g.id)
    }));
    
    const ungrouped = services.filter(s => !s.group_id);
    if (ungrouped.length > 0) {
      groups.push({ id: 'other', name: 'Dịch vụ khác', services: ungrouped });
    }
    return groups;
  }, [services, serviceGroups]);

  const renderCalendar = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];

    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push(dateStr);
    }

    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => setCalendarMonth(new Date(year, month - 1, 1))} className="w-8 h-8 rounded flex items-center justify-center hover:bg-slate-100 transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <span className="font-bold text-slate-800 text-sm">{MONTHS_VI[month]} {year}</span>
          <button onClick={() => setCalendarMonth(new Date(year, month + 1, 1))} className="w-8 h-8 rounded flex items-center justify-center hover:bg-slate-100 transition-colors">
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        <div className="grid grid-cols-7 mb-2">
          {DAYS_VI.map(d => <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1 uppercase tracking-wider">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((dateStr, i) => {
            if (!dateStr) return <div key={i} />;
            const available = isDateAvailable(dateStr);
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === todayStr();
            return (
              <button
                key={dateStr}
                disabled={!available}
                onClick={() => { setSelectedDate(dateStr); setSelectedTime(''); }}
                className={`aspect-square w-full rounded-xl text-sm font-semibold transition-all flex items-center justify-center ${
                  isSelected
                    ? 'text-white shadow-md'
                    : available
                      ? 'text-slate-700 hover:bg-slate-100'
                      : 'text-slate-300 cursor-not-allowed opacity-50'
                }`}
                style={isSelected ? { background: color } : available && isToday ? { color, background: color + '15' } : {}}
              >
                {new Date(dateStr + 'T00:00:00').getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── Loading / Error / Success States ──────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color }} />
        <p className="text-slate-500 font-medium">Đang chuẩn bị trang đặt lịch...</p>
      </div>
    </div>
  );

  if (notFound || !setting) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="bg-white p-8 rounded-3xl shadow-sm text-center max-w-sm">
        <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-slate-800 mb-2">Không tìm thấy trang</h1>
        <p className="text-slate-500">Link đặt lịch không tồn tại hoặc đã bị vô hiệu hoá.</p>
      </div>
    </div>
  );

  if (!setting.is_active) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="bg-white p-8 rounded-3xl shadow-sm text-center max-w-sm w-full">
        <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: color + '15' }}>
          <CalendarCheck className="w-10 h-10" style={{ color }} />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Tạm thời đóng cửa</h1>
        <p className="text-slate-500 mb-6">Salon hiện không nhận đặt lịch online. Vui lòng liên hệ trực tiếp để được hỗ trợ.</p>
        {setting.salon_phone && (
          <a href={`tel:${setting.salon_phone}`} className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-white font-bold transition-transform shadow-md" style={{ background: color }}>
            <Phone className="w-5 h-5" /> Gọi điện ngay
          </a>
        )}
      </div>
    </div>
  );

  if (success) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2" style={{ background: color }} />
        <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: color + '15' }}>
          <Check className="w-12 h-12" style={{ color }} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Đặt lịch thành công!</h2>
        <p className="text-slate-500 mb-6">{setting.auto_confirm ? 'Lịch hẹn của bạn đã được hệ thống xác nhận.' : 'Chúng tôi sẽ liên hệ lại để xác nhận lịch hẹn.'}</p>
        
        <div className="bg-slate-50 rounded-2xl p-5 mb-6 text-left space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200">
            <span className="text-sm font-medium text-slate-500">Mã lịch hẹn</span>
            <span className="font-mono font-bold text-slate-800 bg-white px-2 py-1 rounded shadow-sm border border-slate-100">{bookingCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-slate-500">Dịch vụ</span>
            <span className="font-bold text-slate-800 text-right max-w-[200px] truncate" title={guests.flatMap(g => g.services.map(s => s.name)).join(', ')}>
              {guests.flatMap(g => g.services.map(s => s.name)).join(', ') || 'Đã chọn dịch vụ'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-slate-500">Thời gian</span>
            <span className="font-bold text-slate-800 text-right">{selectedTime}, {new Date(selectedDate + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
          </div>
        </div>

        <button onClick={() => window.location.reload()} className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all" style={{ background: color }}>
          Đặt thêm lịch mới
        </button>
      </div>
    </div>
  );

  // ─── Main Content ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 pb-20 lg:pb-10">
      
      {/* ─── Hero Banner ─── */}
      <div 
        className="relative w-full h-[320px] lg:h-[400px] flex flex-col items-center justify-center text-center px-4"
        style={setting.cover_image_url
          ? { backgroundImage: `url(${setting.cover_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { background: `linear-gradient(135deg, ${color}, #000000)` }
        }
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 max-w-2xl">
          {setting.logo_url && (
            <img src={setting.logo_url} alt="Logo" className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-xl mx-auto mb-6" />
          )}
          <h1 className="text-3xl lg:text-5xl font-extrabold text-white mb-4 drop-shadow-md tracking-tight">Đặt lịch hẹn</h1>
          <p className="text-white/80 text-sm lg:text-base font-medium">Vui lòng điền thông tin bên dưới để đặt lịch hẹn</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative">
          
          {/* ─── Left Column (Forms) ─── */}
          <div className="lg:col-span-8 space-y-10">
            
            
            {/* Customer Information */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Thông tin khách hàng</h2>
              <div className="space-y-4 mb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Họ và tên <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      placeholder="VD: Nguyễn Văn A"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': color + '40' }}
                      onFocus={e => e.target.style.borderColor = color}
                      onBlur={e => e.target.style.borderColor = ''}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Số điện thoại <span className="text-red-500">*</span></label>
                    <input 
                      type="tel" 
                      placeholder="VD: 0901234567"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': color + '40' }}
                      onFocus={e => e.target.style.borderColor = color}
                      onBlur={e => e.target.style.borderColor = ''}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Ghi chú chung (Tuỳ chọn)</label>
                  <textarea 
                    rows={2}
                    placeholder="Yêu cầu đặc biệt..."
                    value={form.note}
                    onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 resize-none"
                    style={{ '--tw-ring-color': color + '40' }}
                    onFocus={e => e.target.style.borderColor = color}
                    onBlur={e => e.target.style.borderColor = ''}
                  />
                </div>
              </div>
            </div>

            {/* Guest Count */}
            {setting?.allow_group_appointments && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Số lượng khách</h2>
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2 shadow-sm w-full">
                  <button 
                    onClick={() => {
                      const newCount = Math.max(1, guests.length - 1);
                      if (newCount < guests.length) setGuests(guests.slice(0, newCount));
                    }}
                    className="w-12 h-10 rounded-lg flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-50"
                    disabled={guests.length <= 1}
                  ><span className="text-xl font-medium leading-none">-</span></button>
                  <span className="text-base text-slate-800 min-w-[30px] text-center">{guests.length}</span>
                  <button 
                    onClick={() => {
                      const newCount = Math.min(10, guests.length + 1);
                      if (newCount > guests.length) setGuests([...guests, { id: Date.now(), services: [] }]);
                    }}
                    className="w-12 h-10 rounded-lg flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-50"
                    disabled={guests.length >= 10}
                  ><span className="text-xl font-medium leading-none">+</span></button>
                </div>
              </div>
            )}

            {/* Branch Selection */}
            {branches.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Chọn chi nhánh</h2>
                <div className="relative">
                  <BranchDropdown 
                    branches={branches}
                    value={selectedBranch}
                    onChange={setSelectedBranch}
                    color={color}
                  />
                </div>
              </div>
            )}

            {/* Date Selection (Global) */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Ngày giờ đặt lịch</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderCalendar()}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm h-full flex flex-col">
                  <h3 className="font-bold text-slate-800 mb-4">Chọn giờ</h3>
                  {(() => {
                    const slots = getAvailableSlots();
                    if (slots.length === 0) return <p className="text-slate-500 bg-slate-50 p-4 rounded-xl text-center text-sm border border-slate-100 flex-1 flex items-center justify-center">Ngày này quán đóng cửa hoặc chưa có giờ trống.</p>;
                    return (
                      <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[450px] pr-2 custom-scrollbar">
                        {slots.map(s => (
                          <button
                            key={s.time}
                            onClick={() => s.available && setSelectedTime(s.time)}
                            disabled={!s.available}
                            className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-colors ${
                              !s.available ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-60' :
                              selectedTime === s.time ? 'text-white' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 shadow-sm'
                            }`}
                            style={selectedTime === s.time ? { background: color, borderColor: color } : {}}
                          >
                            {s.time}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Guests Loop */}
            <div className="space-y-6">
              {guests.map((g, gIdx) => {
                const updateGuest = (field, val) => {
                  const newG = [...guests];
                  if (field === 'service') {
                    const exists = newG[gIdx].services.some(s => s.id === val.id);
                    if (exists) {
                      newG[gIdx].services = newG[gIdx].services.filter(s => s.id !== val.id);
                    } else {
                      newG[gIdx].services.push({ ...val, selected_staff: null });
                    }
                  }
                  setGuests(newG);
                };
                
                const updateServiceStaff = (serviceId, staffObj) => {
                  const newG = [...guests];
                  const sIdx = newG[gIdx].services.findIndex(s => s.id === serviceId);
                  if (sIdx > -1) {
                    newG[gIdx].services[sIdx].selected_staff = staffObj;
                    setGuests(newG);
                  }
                };
                


                return (
                  <div key={g.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                        {gIdx + 1}
                      </div>
                      Khách {gIdx + 1}
                    </h3>

                    {/* Services for Guest */}
                    <div className="mb-6">

                      <div className="space-y-3">
                        {groupedServices.map(group => {
                          return (
                            <div key={group.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                              <div className="w-full flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
                                <span className="font-bold text-slate-700 text-sm">{group.name}</span>
                                <span className="text-xs font-medium text-slate-500">{group.services.length} dịch vụ</span>
                              </div>
                              
                              <div className="bg-white">
                                {group.services.map((s, idx) => {
                                  const isSelected = g.services.some(x => x.id === s.id);
                                  return (
                                    <div key={s.id} className={`p-4 transition-colors ${idx !== group.services.length - 1 ? 'border-b border-slate-100' : ''} ${isSelected ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}>
                                      
                                      <div 
                                        className="flex items-start justify-between cursor-pointer"
                                        onClick={() => updateGuest('service', s)}
                                      >
                                        <div className="flex items-start gap-4 flex-1">
                                          {s.image_url ? (
                                            <img src={s.image_url} alt={s.name} className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-100 shadow-sm" />
                                          ) : (
                                            <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                              <span className="font-bold text-slate-400 text-sm">{s.name?.[0]?.toUpperCase()}</span>
                                            </div>
                                          )}
                                          <div className="pr-4">
                                            <h4 className="font-bold text-slate-800 text-sm">{s.name}</h4>
                                            <p className="text-xs text-slate-500 mt-1">{s.duration_minutes ? `${s.duration_minutes} phút` : '60 phút'} • <span className="font-semibold text-slate-900">{s.price ? formatVND(s.price) : 'Miễn phí'}</span></p>
                                          </div>
                                        </div>
                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-current' : 'border-slate-300'}`} style={isSelected ? { borderColor: color, background: color } : {}}>
                                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div></div>
                                      
                                      {isSelected && (
                                        <div className="mt-4 pt-4 border-t border-slate-100 w-full">
                                          <StaffAssignPicker 
                                            staff={staff.map(s => ({ ...s, full_name: s.name }))} 
                                            value={g.services.find(x => x.id === s.id)?.selected_staff?.id || null} 
                                            onChange={(stId, stName) => updateServiceStaff(s.id, stId ? staff.find(x => x.id === stId) : null)} 
                                            color={color.replace('bg-', '')} 
                                            hideRequestedCheckbox={true}
                                            disabledStaffIds={disabledStaffIds}
                                          />
                                        </div>
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
                  </div>
                );
              })}
            </div>

            {/* Gallery (Inline below forms) */}
            {setting.show_gallery && setting.gallery_images?.length > 0 && (
              <div className="pt-8 border-t border-slate-200">
                <h2 className="text-xl font-bold text-slate-900 mb-6">{setting.gallery_tab_name || 'Thư viện ảnh'}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {setting.gallery_images.slice(0, 4).map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-2xl overflow-hidden shadow-sm">
                      <img src={img} alt="Gallery" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ─── Right Column (Sticky Summary) ─── */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-8 bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[calc(100vh-64px)]">
              <div className="p-6 text-center border-b border-slate-100 bg-slate-50/50 shrink-0">
                <div className="w-16 h-16 mx-auto bg-white rounded-2xl border border-slate-100 flex items-center justify-center mb-3 shadow-sm overflow-hidden">
                  {setting.logo_url ? <img src={setting.logo_url} alt="Logo" className="w-full h-full object-cover" /> : <span className="font-bold text-slate-400 text-xl">{setting.salon_name?.[0]}</span>}
                </div>
                <h3 className="font-bold text-slate-900">{setting.salon_name || 'GloPro Salon'}</h3>
                <p className="text-xs text-slate-500 mt-1">{setting.salon_address}</p>
              </div>

              <div className="p-6 space-y-4 text-sm border-b border-slate-100 border-dashed shrink-0">
                <div className="flex items-start gap-3 text-slate-700">
                  <CalendarCheck className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                  <div>
                    <p className="font-medium">
                      {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Chưa chọn ngày'}
                      {selectedTime ? ` - ${selectedTime}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-slate-700">
                  <User className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                  <div>
                    <p className="font-medium">Số lượng: {guests.length} khách</p>
                  </div>
                </div>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-4">
                {guests.map((g, idx) => {
                  const hasServices = g.services && g.services.length > 0;
                  return (
                    <div key={idx} className="space-y-3">
                      <p className="text-xs font-bold text-slate-400 uppercase border-b border-slate-100 pb-1">Khách {idx + 1}</p>
                      {!hasServices ? (
                        <div className="flex justify-between items-start text-sm">
                          <span className="text-slate-500 italic pr-4">Chưa chọn dịch vụ</span>
                          <span className="font-bold text-slate-900 whitespace-nowrap">0đ</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {g.services.map((svc, sIdx) => (
                            <div key={sIdx} className="space-y-1">
                              <div className="flex justify-between items-start text-sm">
                                <span className="text-slate-700 font-medium pr-4">{svc.name}</span>
                                <span className="font-bold text-slate-900 whitespace-nowrap">{formatVND(svc.price || 0)}</span>
                              </div>
                              <div className="text-xs text-slate-500 flex flex-col gap-0.5">
                                <span>Nhân viên: {svc.selected_staff?.name || 'Bất kỳ'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="p-6 border-t border-slate-100 shrink-0 bg-white">
                <div className="flex justify-between items-center mb-6">
                  <span className="font-bold text-slate-900 text-lg">Tổng cộng</span>
                  <span className="font-bold text-xl" style={{ color }}>
                    {formatVND(guests.reduce((sum, g) => sum + (g.services?.reduce((sSum, svc) => sSum + (svc.price || 0), 0) || 0), 0))}
                  </span>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!isFormValid || submitting}
                  className="w-full py-4 rounded-xl text-white font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                  style={isFormValid ? { background: color } : { background: '#94A3B8' }}
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Hoàn tất đặt lịch'}
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
