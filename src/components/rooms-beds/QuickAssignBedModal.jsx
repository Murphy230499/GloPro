import React, { useState, useEffect } from 'react';
import { X, User, Phone, Plus, Trash2, Clock, Check, Scissors } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { toast } from '@/components/Layout';
import { formatMinutesToTime, timeStringToMinutes } from '@/components/appointments/constants';
import Avatar from '@/components/Avatar';

export default function QuickAssignBedModal({
  open,
  onClose,
  bed,
  room,
  customers = [],
  services = [],
  staff = [],
  onStartServing,
  loading = false
}) {
  const { t } = useT();

  const [customerMode, setCustomerMode] = useState('existing'); // 'existing' | 'new'
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  });

  const [selectedServices, setSelectedServices] = useState([
    { service_id: '', staff_id: '' }
  ]);

  // Filter available services by bed.applicable_services
  const applicableServices = React.useMemo(() => {
    if (!bed?.applicable_services?.length) return services;
    return services.filter(s => bed.applicable_services.includes(s.id));
  }, [bed, services]);

  useEffect(() => {
    if (open) {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setStartTime(`${hh}:${mm}`);
      setSelectedServices([{ service_id: applicableServices[0]?.id || '', staff_id: staff[0]?.id || '' }]);
      setSelectedCustomerId(customers[0]?.id || '');
      setNewCustomerName('');
      setNewCustomerPhone('');
      setCustomerSearch('');
    }
  }, [open, bed, applicableServices, customers, staff]);

  if (!open || !bed) return null;

  // Calculate total duration & end time
  const totalDuration = selectedServices.reduce((sum, item) => {
    const sObj = services.find(s => s.id === item.service_id);
    return sum + (sObj?.duration_minutes || sObj?.duration || 30);
  }, 0);

  const startMins = timeStringToMinutes(startTime);
  const endMins = startMins + totalDuration;
  const endTime = formatMinutesToTime(endMins);

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

  const handleSubmit = (e) => {
    e.preventDefault();

    let customerObj = null;
    if (customerMode === 'existing') {
      customerObj = customers.find(c => c.id === selectedCustomerId);
      if (!customerObj) {
        return toast.error(t('rooms_beds.err_select_customer', 'Vui lòng chọn khách hàng'));
      }
    } else {
      if (!newCustomerName.trim()) {
        return toast.error(t('rooms_beds.err_customer_name', 'Vui lòng nhập tên khách hàng'));
      }
      customerObj = {
        id: `guest_${Date.now()}`,
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim()
      };
    }

    const validServices = selectedServices.filter(s => Boolean(s.service_id));
    if (validServices.length === 0) {
      return toast.error(t('rooms_beds.err_select_at_least_one_service', 'Vui lòng chọn ít nhất 1 dịch vụ'));
    }

    const enrichedServices = validServices.map(item => {
      const sObj = services.find(s => s.id === item.service_id);
      const stObj = staff.find(st => st.id === item.staff_id);
      return {
        service_id: item.service_id,
        name: sObj?.name || t('common.service', 'Dịch vụ'),
        price: sObj?.price || 0,
        duration: sObj?.duration_minutes || sObj?.duration || 30,
        staff_id: item.staff_id || null,
        staff_name: stObj?.full_name || stObj?.name || t('rooms_beds.unassigned_staff', 'Chưa phân công')
      };
    });

    onStartServing({
      bed_id: bed.id,
      bed_name: bed.name,
      room_id: room?.id || null,
      room_name: room?.name || t('rooms_beds.common_area', 'Khu vực chung'),
      customer: customerObj,
      customer_id: customerObj.id,
      customer_name: customerObj.name,
      customer_phone: customerObj.phone,
      start_time: startTime,
      end_time: endTime,
      total_duration_minutes: totalDuration,
      services: enrichedServices,
      status: 'in_progress',
      created_at: new Date().toISOString()
    });

    onClose();
  };

  const filteredCustomers = customers.filter(c => 
    (c.name || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone || '').includes(customerSearch)
  );

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 font-body animate-in fade-in duration-150">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-10 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              {t('rooms_beds.assign_bed_title', 'Nhận khách vào giường')}
            </h2>
            <div className="text-xs text-blue-600 font-medium mt-0.5">
              {bed.name} {room?.name ? `• ${room.name}` : ''}
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* Customer Selection Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">
                {t('rooms_beds.customer', 'Khách hàng')} <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setCustomerMode('existing')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    customerMode === 'existing' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  {t('rooms_beds.existing_customer', 'Khách có sẵn')}
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode('new')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    customerMode === 'new' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  {t('rooms_beds.new_customer', 'Khách mới / Vãng lai')}
                </button>
              </div>
            </div>

            {customerMode === 'existing' ? (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder={t('rooms_beds.search_customer_hint', 'Tìm theo tên hoặc số điện thoại...')}
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-slate-800 placeholder:text-slate-400 shadow-2xs"
                />
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 text-slate-800 shadow-2xs"
                >
                  {filteredCustomers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <option value="" disabled>{t('common.no_results', 'Không tìm thấy khách hàng')}</option>
                  )}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder={t('rooms_beds.customer_name_placeholder', 'Tên khách hàng *')}
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 text-slate-800 placeholder:text-slate-400 shadow-2xs"
                />
                <input
                  type="text"
                  placeholder={t('rooms_beds.customer_phone_placeholder', 'Số điện thoại')}
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 text-slate-800 placeholder:text-slate-400 shadow-2xs"
                />
              </div>
            )}
          </div>

          {/* Service & Staff Rows */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">
                {t('rooms_beds.services_and_staff', 'Dịch vụ & Kỹ thuật viên')} <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddServiceRow}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg"
              >
                <Plus className="w-3 h-3" /> {t('rooms_beds.add_service', 'Thêm dịch vụ')}
              </button>
            </div>

            <div className="space-y-2.5">
              {selectedServices.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50/70 rounded-xl border border-slate-200/80">
                  <div className="flex-1 min-w-0">
                    <select
                      value={row.service_id}
                      onChange={(e) => handleServiceChange(idx, 'service_id', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 text-slate-800"
                    >
                      <option value="">— {t('rooms_beds.select_service', 'Chọn dịch vụ')} —</option>
                      {applicableServices.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.duration_minutes || s.duration || 30}p)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-36 shrink-0">
                    <select
                      value={row.staff_id}
                      onChange={(e) => handleServiceChange(idx, 'staff_id', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 text-slate-800"
                    >
                      <option value="">— {t('rooms_beds.select_staff', 'Chọn KTV')} —</option>
                      {staff.map(st => (
                        <option key={st.id} value={st.id}>{st.full_name || st.name}</option>
                      ))}
                    </select>
                  </div>

                  {selectedServices.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveServiceRow(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Time Calculation Banner */}
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <div>
                <span className="text-slate-500">{t('rooms_beds.start_time', 'Giờ vào')}: </span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="font-bold text-slate-800 bg-white border border-slate-200 rounded-md px-1.5 py-0.5 text-xs outline-none ml-1"
                />
              </div>
            </div>

            <div className="text-right">
              <div className="text-slate-500">
                {t('rooms_beds.estimated_end_time', 'Giờ ra dự kiến')}: <strong className="text-blue-700 font-mono text-sm">{endTime}</strong>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {t('rooms_beds.total_time', 'Tổng thời lượng')}: {totalDuration} {t('common.minutes', 'phút')}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              {t('common.cancel', 'Huỷ bỏ')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm shadow-blue-200 cursor-pointer disabled:opacity-50"
            >
              {loading ? t('common.loading', 'Đang xử lý...') : t('rooms_beds.start_service_btn', 'Bắt đầu phục vụ')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
