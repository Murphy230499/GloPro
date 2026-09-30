'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, User, Phone, Plus, Trash2, Clock, Check, Scissors, Search, UserX, ChevronDown, Sparkles, AlertTriangle } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { toast } from '@/components/Layout';
import { formatMinutesToTime, timeStringToMinutes } from '@/components/appointments/constants';
import Avatar from '@/components/Avatar';
import { formatVND } from '@/lib/format';
import { findCustomerActiveSessions, generateMasterSessionId } from '@/lib/bedSessionHelpers';
import { 
  BED_BUFFER_MINUTES, 
  calculateBedAvailableWindow, 
  checkBedAssignmentConflict, 
  findAlternativeAvailableBeds 
} from '@/lib/bedConflictHelper';
import ServicePickerDropdown from './ServicePickerDropdown';
import StaffPickerDropdown from './StaffPickerDropdown';
import BedConflictOverrideModal from './BedConflictOverrideModal';
import PackageUsageModal from '@/components/pos/PackageUsageModal';

export default function QuickAssignBedModal({
  open,
  onClose,
  bed,
  room,
  customers = [],
  services = [],
  staff = [],
  allBeds = [],
  allRooms = [],
  appointments = [],
  allBedSessions = {},
  onStartServing,
  onReassignAppointment,
  loading = false
}) {
  const { t } = useT();

  const [activeBed, setActiveBed] = useState(bed);
  const [customerMode, setCustomerMode] = useState('existing'); // 'existing' | 'new'
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [clientQ, setClientQ] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [showPackageModal, setShowPackageModal] = useState(false);
  const customerPickerRef = useRef(null);

  // Conflict modal states
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictData, setConflictData] = useState(null);
  const [alternativeBeds, setAlternativeBeds] = useState([]);
  const [pendingPayload, setPendingPayload] = useState(null);

  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  });

  const [selectedServices, setSelectedServices] = useState([
    { service_id: '', staff_id: '' }
  ]);

  // Current active bed (can be switched if user chooses alternative bed)
  const currentBed = activeBed || bed;

  // Filter available services by bed.applicable_services
  const applicableServices = useMemo(() => {
    if (!currentBed?.applicable_services?.length) return services;
    return services.filter(s => currentBed.applicable_services.includes(s.id));
  }, [currentBed, services]);

  // Check if selected customer is currently in another bed session
  const existingCustomerSessions = useMemo(() => {
    if (!selectedCustomer) return [];
    return findCustomerActiveSessions(allBedSessions, selectedCustomer);
  }, [allBedSessions, selectedCustomer]);

  useEffect(() => {
    if (open) {
      setActiveBed(bed);
      setConflictModalOpen(false);
      setConflictData(null);
      setPendingPayload(null);
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setStartTime(`${hh}:${mm}`);
      setSelectedServices([{ service_id: applicableServices[0]?.id || '', staff_id: staff[0]?.id || '' }]);
      setSelectedCustomer(null);
      setShowClientSearch(false);
      setClientQ('');
      setCustomerMode('existing');
      setNewCustomerName('');
      setNewCustomerPhone('');
    }
  }, [open, bed, applicableServices, staff]);

  // Close floating customer dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (customerPickerRef.current && !customerPickerRef.current.contains(e.target)) {
        setShowClientSearch(false);
      }
    };
    if (showClientSearch) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showClientSearch]);

  // Filter customers matching search query (like in Cashier / POS)
  const clientResults = clientQ
    ? customers.filter((c) => 
        (c.name || '').toLowerCase().includes(clientQ.toLowerCase()) || 
        (c.phone || '').includes(clientQ)
      ).slice(0, 8)
    : customers.slice(0, 8);

  // Calculate total duration & end time
  const totalDuration = selectedServices.reduce((sum, item) => {
    const sObj = services.find(s => s.id === item.service_id);
    return sum + (sObj?.duration_minutes || sObj?.duration || 30);
  }, 0);

  const startMins = timeStringToMinutes(startTime);
  const endMins = startMins + totalDuration;
  const endTime = formatMinutesToTime(endMins);

  // Tính toán khung giờ trống thông minh cho giường hiện tại
  const availableWindow = useMemo(() => {
    if (!currentBed?.id) return { hasNextAppt: false };
    return calculateBedAvailableWindow(
      currentBed.id, 
      appointments, 
      startMins, 
      BED_BUFFER_MINUTES
    );
  }, [currentBed?.id, appointments, startMins]);

  // Kiểm tra thời gian thực xem các dịch vụ đã chọn có vượt quá giờ trống không
  const isCurrentlyOverlapping = availableWindow.hasNextAppt && 
    (totalDuration + BED_BUFFER_MINUTES > availableWindow.availableMinutes);

  const handleAddServiceRow = () => {
    setSelectedServices(prev => [...prev, { service_id: applicableServices[0]?.id || '', staff_id: staff[0]?.id || '' }]);
  };

  const handleRemoveServiceRow = (idx) => {
    if (selectedServices.length <= 1) return;
    setSelectedServices(prev => prev.filter((_, i) => i !== idx));
  };

  const handleServiceChange = (idx, field, val) => {
    setSelectedServices(prev => {
      const clone = [...prev];
      clone[idx] = { ...clone[idx], [field]: val };
      return clone;
    });
  };

  const handleApplyPackageItems = (selectedItems) => {
    const newItems = selectedItems.map(item => {
      const svc = services.find(s => s.name === item.name || s.id === item.id);
      return {
        service_id: svc?.id || item.id,
        service_name: item.name,
        price: 0,
        duration_minutes: Number(svc?.duration_minutes || svc?.duration || 30),
        staff_id: staff[0]?.id || '',
        is_from_package: true,
        customer_package_id: item.customer_package_id || null,
        customer_treatment_id: item.customer_treatment_id || null,
        package_name: item.package_name || ''
      };
    });

    setSelectedServices(prev => {
      const cleaned = prev.filter(r => Boolean(r.service_id));
      return [...cleaned, ...newItems];
    });
    setShowPackageModal(false);
    toast.success('Đã áp dụng dịch vụ từ gói / liệu trình của khách');
  };

  const handleSubmit = (targetStatus = 'in_progress', e = null) => {
    if (e && e.preventDefault) e.preventDefault();

    let customerObj = null;
    if (customerMode === 'existing') {
      if (!selectedCustomer) {
        return toast.error(t('rooms_beds.err_select_customer', 'Vui lòng chọn khách hàng hoặc khách vãng lai'));
      }
      customerObj = selectedCustomer;
    } else {
      if (!newCustomerName.trim()) {
        return toast.error(t('rooms_beds.err_customer_name', 'Vui lòng nhập tên khách hàng'));
      }
      customerObj = {
        id: `walkin_${Date.now()}`,
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim() || '—',
        is_guest: true
      };
    }

    // Validate services
    const validServices = selectedServices.filter(s => Boolean(s.service_id));
    if (validServices.length === 0) {
      return toast.error(t('rooms_beds.err_select_service', 'Vui lòng chọn ít nhất 1 dịch vụ'));
    }

    const enrichedServices = validServices.map(item => {
      const sObj = services.find(s => s.id === item.service_id) || {};
      const stObj = staff.find(st => st.id === item.staff_id) || {};
      return {
        service_id: item.service_id,
        service_name: item.service_name || sObj.name || '',
        price: item.is_from_package ? 0 : (item.price ?? sObj.price ?? 0),
        duration_minutes: item.duration_minutes || sObj.duration_minutes || sObj.duration || 30,
        staff_id: item.staff_id || null,
        staff_name: stObj.full_name || stObj.name || '',
        is_from_package: Boolean(item.is_from_package),
        customer_package_id: item.customer_package_id || null,
        customer_treatment_id: item.customer_treatment_id || null,
        package_name: item.package_name || ''
      };
    });

    // Link into existing master session if customer is already in another bed
    const masterSessionId = existingCustomerSessions[0]?.master_session_id || generateMasterSessionId();

    const payload = {
      bed_id: currentBed.id,
      bed_name: currentBed.name,
      room_id: currentBed.room_id || null,
      room_name: room?.name || '',
      master_session_id: masterSessionId,
      customer: customerObj,
      customer_id: customerObj.id,
      customer_name: customerObj.name,
      customer_phone: customerObj.phone,
      start_time: startTime,
      end_time: endTime,
      total_duration_minutes: totalDuration,
      services: enrichedServices.map(s => ({
        ...s,
        bed_id: currentBed.id,
        bed_name: currentBed.name,
        room_name: room?.name || ''
      })),
      status: targetStatus, // 'waiting' or 'in_progress'
      service_start_time: targetStatus === 'in_progress' ? startTime : null,
      created_at: new Date().toISOString()
    };

    // KIỂM TRA RÀNG BUỘC XUNG ĐỘT THỜI GIAN VỚI LỊCH HẸN TIẾP THEO TRÊN GIƯỜNG
    const conflictCheck = checkBedAssignmentConflict({
      bedId: currentBed.id,
      serviceDurationMinutes: totalDuration,
      startTimeStr: startTime,
      appointments,
      bufferMinutes: BED_BUFFER_MINUTES
    });

    if (conflictCheck.hasConflict) {
      // Tìm các giường trống khác trong salon không bị xung đột
      const alternatives = findAlternativeAvailableBeds({
        beds: allBeds.length > 0 ? allBeds : [currentBed],
        rooms: allRooms,
        appointments,
        bedSessions: allBedSessions,
        requiredMinutes: totalDuration,
        currentBedId: currentBed.id,
        nowMinutes: startMins,
        bufferMinutes: BED_BUFFER_MINUTES
      });

      setPendingPayload(payload);
      setConflictData(conflictCheck);
      setAlternativeBeds(alternatives);
      setConflictModalOpen(true);
      return;
    }

    // Không có xung đột -> Nhận khách phục vụ bình thường
    onStartServing(payload);
    onClose();
  };

  if (!open || !bed) return null;

  return (
    <>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs font-sans text-slate-800 animate-in fade-in duration-200">
        <div className="absolute inset-0" onClick={onClose} />
        <div 
          className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200/80 overflow-visible z-10 flex flex-col max-h-[90vh] text-left" 
          onClick={e => e.stopPropagation()}
        >
          {/* Header with generous, comfortable height & spacing */}
          <div className="flex items-center justify-between px-6 sm:px-7 py-5 sm:py-6 bg-white border-b border-slate-100 shrink-0 rounded-t-3xl">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
                {t('rooms_beds.assign_bed_title', 'Nhận khách vào giường')}
              </h2>
              <div className="text-xs text-blue-600 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                <span>{currentBed.name}</span>
                {room?.name && <span className="text-slate-400 font-normal">({room.name})</span>}
              </div>
            </div>
            <button 
              type="button" 
              onClick={onClose} 
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col min-h-0">
            <div className="p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar">

              {/* Thông báo thông minh thời gian khả dụng nếu có lịch hẹn sắp tới */}
              {availableWindow.hasNextAppt && (
                <div className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 transition-all ${
                  isCurrentlyOverlapping
                    ? 'bg-rose-50/95 border-rose-300 text-rose-950 shadow-2xs'
                    : 'bg-amber-50/90 border-amber-200 text-amber-950'
                }`}>
                  <Clock className={`w-4 h-4 shrink-0 mt-0.5 ${
                    isCurrentlyOverlapping ? 'text-rose-600' : 'text-amber-600'
                  }`} />
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        <span>Lịch hẹn kế tiếp:</span>
                        <span className="underline font-mono">{availableWindow.availableUntil}</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isCurrentlyOverlapping
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        Khả dụng: ~{availableWindow.availableMinutes}p (sau đệm)
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-700 truncate">
                      Khách hẹn: <strong>{availableWindow.nextAppt?.customer_name || 'Khách đặt hẹn'}</strong>
                      {availableWindow.nextAppt?.service_name && ` • DV: ${availableWindow.nextAppt.service_name}`}
                    </div>
                    {isCurrentlyOverlapping && (
                      <div className="text-[11px] font-semibold text-rose-700 pt-1 border-t border-rose-200 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Dịch vụ chọn ({totalDuration}p + 15p dọn dẹp) sẽ đè vào giờ khách hẹn! Khi bấm tiếp tục, bạn có thể đổi giường hoặc dời lịch hẹn.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Customer Selection (Cashier / POS Style with Floating Dropdown) */}
              <div className="relative" ref={customerPickerRef}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700">
                    {t('rooms_beds.customer', 'Khách hàng')} <span className="text-rose-500">*</span>
                  </label>
                  {customerMode === 'new' && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerMode('existing');
                        setShowClientSearch(true);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                    >
                      ← {t('rooms_beds.back_to_existing_customers', 'Chọn khách có sẵn')}
                    </button>
                  )}
                </div>

                {customerMode === 'existing' ? (
                  selectedCustomer ? (
                    <>
                      {/* Customer Card (Identical to POS Ticket Column) */}
                      <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100/80">
                      <Avatar src={selectedCustomer.avatar_url} name={selectedCustomer.name} size={36} color="#34D399" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate text-emerald-900">{selectedCustomer.name}</div>
                        <div className="text-xs text-slate-500 truncate">
                          {selectedCustomer.phone ? `${selectedCustomer.phone} • ` : ''}
                          {selectedCustomer.points || 0} {t('common.points', 'điểm')} • {t('pos.ticket.total_spent', 'Tổng chi tiêu:')} {formatVND(selectedCustomer.total_spent || 0)}
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(null);
                          setShowClientSearch(true);
                        }} 
                        className="text-slate-400 hover:text-rose-500 shrink-0 ml-1 p-1 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
                        title={t('pos.ticket.clear_customer', 'Bỏ chọn khách')}
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Multi-room linked session smart indicator */}
                    {existingCustomerSessions.length > 0 && (
                      <div className="mt-2.5 p-3 rounded-2xl bg-blue-50/90 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-2.5 animate-in fade-in duration-200">
                        <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-blue-950">
                            {t('rooms_beds.active_in_other_bed', 'Khách đang phục vụ tại')}: {existingCustomerSessions.map(s => `${s.bed_name}${s.room_name ? ` (${s.room_name})` : ''}`).join(', ')}
                          </div>
                          <div className="text-[11px] text-blue-700 mt-0.5">
                            {t('rooms_beds.multi_room_notice', 'Dịch vụ tại vị trí này sẽ được tự động liên kết chung vào cùng 1 hoá đơn khi thanh toán tại quầy thu ngân.')}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                  ) : (
                    /* Search Input & Floating Dropdown (Does NOT stretch or break layout) */
                    <div className="relative">
                      {/* Search Input Box */}
                      <div 
                        onClick={() => setShowClientSearch(true)}
                        className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 border transition-all cursor-text ${
                          showClientSearch 
                            ? 'border-blue-500 bg-white ring-2 ring-blue-500/10' 
                            : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <Search className="w-4 h-4 text-slate-400 shrink-0" />
                        <input 
                          value={clientQ} 
                          onChange={(e) => {
                            setClientQ(e.target.value);
                            setShowClientSearch(true);
                          }}
                          onFocus={() => setShowClientSearch(true)}
                          placeholder={t('pos.ticket.search_cust_input_placeholder', 'Nhập tên, email hoặc SĐT khách hàng...')}
                          className="bg-transparent outline-none text-sm flex-1 text-slate-800 placeholder:text-slate-400" 
                        />
                        {clientQ && (
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setClientQ('');
                            }} 
                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Floating Dropdown (Absolute Positioned) */}
                      {showClientSearch && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto">
                          {clientResults.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedCustomer(c);
                                setShowClientSearch(false);
                                setClientQ('');
                              }}
                              className="w-full flex items-center justify-between p-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors text-left cursor-pointer group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Avatar src={c.avatar_url} name={c.name} size={32} color="#34D399" />
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 truncate">{c.name}</div>
                                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">{c.phone || t('common.no_phone', 'Không có SĐT')}</div>
                                </div>
                              </div>
                              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                                {c.points || 0} đ
                              </span>
                            </button>
                          ))}

                          {clientResults.length === 0 && (
                            <div className="p-4 text-center text-xs text-slate-400">
                              {t('common.no_results', 'Không tìm thấy khách hàng phù hợp')}
                            </div>
                          )}

                          {/* Quick Create Walk-in Guest Button */}
                          <div className="p-2 bg-slate-50 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                setCustomerMode('new');
                                setShowClientSearch(false);
                                setNewCustomerName(clientQ.trim() || t('rooms_beds.walk_in_guest', 'Khách vãng lai'));
                              }}
                              className="w-full py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{t('rooms_beds.add_quick_walk_in', 'Tạo nhanh khách vãng lai')}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  /* New Customer Form */
                  <div className="space-y-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 mb-1 block">
                        {t('rooms_beds.customer_name', 'Tên khách hàng')} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                        placeholder="VD: Chị Mai, Anh Hùng..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 text-slate-800"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 mb-1 block">
                        {t('rooms_beds.customer_phone', 'Số điện thoại')} ({t('common.optional', 'tùy chọn')})
                      </label>
                      <input
                        type="text"
                        value={newCustomerPhone}
                        onChange={(e) => setNewCustomerPhone(e.target.value)}
                        placeholder="VD: 0988xxxxxx"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 text-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Services & Staff Assignment */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold text-slate-800">
                    Chọn dịch vụ và kĩ thuật viên <span className="text-rose-500">*</span>
                  </label>
                  
                  <div className="flex items-center gap-2">
                    {/* Nút dùng Gói / Liệu trình đã mua của khách */}
                    {selectedCustomer?.id && (
                      <button
                        type="button"
                        onClick={() => setShowPackageModal(true)}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Dùng Gói / Liệu trình</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleAddServiceRow}
                      className="w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                      title={t('rooms_beds.add_service_btn', 'Thêm dịch vụ')}
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {selectedServices.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                      {/* Service Picker with Custom Unified Dropdown */}
                      <div className="flex-1 min-w-0">
                        {row.is_from_package ? (
                          <div className="px-3 py-2 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center justify-between">
                            <span className="truncate">{row.service_name}</span>
                            <span className="text-[10px] bg-emerald-200/70 text-emerald-900 px-1.5 py-0.5 rounded font-bold shrink-0">
                              {row.package_name || 'Gói/Liệu trình'} (0 ₫)
                            </span>
                          </div>
                        ) : (
                          <ServicePickerDropdown
                            servicesList={applicableServices}
                            services={applicableServices}
                            value={row.service_id}
                            onChange={(val) => handleServiceChange(idx, 'service_id', val)}
                            placeholder={t('rooms_beds.select_service_placeholder', '— Chọn dịch vụ —')}
                            t={t}
                          />
                        )}
                      </div>

                      {/* Staff Picker with Custom Unified Dropdown */}
                      <div className="w-36 shrink-0">
                        <StaffPickerDropdown
                          staffList={staff}
                          staff={staff}
                          value={row.staff_id}
                          onChange={(val) => handleServiceChange(idx, 'staff_id', val)}
                          placeholder={t('rooms_beds.select_staff_placeholder', '— Chọn KTV —')}
                          t={t}
                        />
                      </div>

                      {/* Remove Row Button */}
                      {(selectedServices.length > 1 || row.is_from_package) && (
                        <button
                          type="button"
                          onClick={() => handleRemoveServiceRow(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-white transition-colors cursor-pointer shrink-0"
                          title={t('common.delete', 'Xóa')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Time Settings: 2 Pill Boxes Matching Mockup */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Giờ vào box */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50/60 border border-blue-200 rounded-2xl">
                  <span className="text-xs font-bold text-blue-700">Giờ vào:</span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="bg-transparent text-xs font-bold text-blue-700 outline-none text-right cursor-pointer"
                  />
                </div>

                {/* Kết thúc box */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-rose-50/60 border border-rose-200 rounded-2xl">
                  <span className="text-xs font-bold text-rose-700">Kết thúc:</span>
                  <span className="text-xs font-bold text-rose-700">{endTime}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-2 rounded-b-3xl shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                {t('common.cancel', 'Huỷ bỏ')}
              </button>

              <div className="flex items-center gap-2">
                {/* Nút 1: Chờ phục vụ (Xanh dương) */}
                <button
                  type="button"
                  onClick={(e) => handleSubmit('waiting', e)}
                  disabled={loading}
                  className="px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {t('rooms_beds.waiting_service', 'Chờ phục vụ')}
                </button>

                {/* Nút 2: Bắt đầu phục vụ (Xanh lá) */}
                <button
                  type="button"
                  onClick={(e) => handleSubmit('in_progress', e)}
                  disabled={loading}
                  className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                    isCurrentlyOverlapping 
                      ? 'bg-amber-600 hover:bg-amber-700' 
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isCurrentlyOverlapping && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                  <span>
                    {loading 
                      ? t('common.loading', 'Đang xử lý...') 
                      : isCurrentlyOverlapping 
                      ? 'Tiếp tục (Kiểm tra xung đột)' 
                      : t('rooms_beds.start_serving_btn', 'Bắt đầu phục vụ')}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Modal Cảnh báo & Ghi đè Xung đột Thời gian với Lịch hẹn */}
      {conflictModalOpen && conflictData && (
        <BedConflictOverrideModal
          open={conflictModalOpen}
          onClose={() => setConflictModalOpen(false)}
          targetBed={currentBed}
          targetRoom={room}
          conflictData={conflictData}
          alternativeBeds={alternativeBeds}
          onSwitchBed={(altBed) => {
            setActiveBed(altBed);
            setConflictModalOpen(false);
            toast.success(`Đã đổi sang ${altBed.name} (${altBed.room_name})`);
            if (pendingPayload) {
              onStartServing({
                ...pendingPayload,
                bed_id: altBed.id,
                bed_name: altBed.name,
                room_name: altBed.room_name,
                services: (pendingPayload.services || []).map(s => ({
                  ...s,
                  bed_id: altBed.id,
                  bed_name: altBed.name,
                  room_name: altBed.room_name
                }))
              });
            }
            onClose();
          }}
          onConfirmOverride={async () => {
            if (conflictData?.conflictedAppointment?.id) {
              await onReassignAppointment?.(conflictData.conflictedAppointment.id, null);
              toast.warning(
                `Đã dời lịch hẹn của "${conflictData.customerName}" (${conflictData.nextApptStartTime}) về trạng thái Chưa xếp giường để ưu tiên ca này.`
              );
            }
            setConflictModalOpen(false);
            if (pendingPayload) {
              onStartServing(pendingPayload);
            }
            onClose();
          }}
        />
      )}

      {/* Modal Chọn Gói / Liệu trình đã mua của khách hàng */}
      {showPackageModal && selectedCustomer && (
        <PackageUsageModal
          customerId={selectedCustomer.id}
          onClose={() => setShowPackageModal(false)}
          onSelect={handleApplyPackageItems}
        />
      )}
    </>
  );
}
