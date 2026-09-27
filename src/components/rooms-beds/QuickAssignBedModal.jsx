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
        service_name: sObj.name || '',
        price: sObj.price || 0,
        duration_minutes: sObj.duration_minutes || sObj.duration || 30,
        staff_id: item.staff_id || null,
        staff_name: stObj.full_name || stObj.name || ''
      };
    });

    onStartServing({
      bed_id: bed.id,
      room_id: bed.room_id || null,
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs font-sans text-slate-800 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div 
        className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden z-10 flex flex-col max-h-[90vh] text-left" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-white border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {t('rooms_beds.assign_bed_title', 'Nhận khách vào giường')}
            </h2>
            <div className="text-xs text-blue-600 font-semibold mt-0.5">
              {bed.name} {room?.name ? `• ${room.name}` : ''}
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col min-h-0">
          <div className="p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
            {/* Customer Selection Tabs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700">
                  {t('rooms_beds.customer', 'Khách hàng')} <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setCustomerMode('existing')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      customerMode === 'existing' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t('rooms_beds.existing_customer', 'Khách có sẵn')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerMode('new')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      customerMode === 'new' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t('rooms_beds.new_customer', 'Khách mới / Vãng lai')}
                  </button>
                </div>
              </div>

              {customerMode === 'existing' ? (
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={t('rooms_beds.search_customer', 'Tìm khách theo tên hoặc SĐT...')}
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white text-slate-800 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-white custom-scrollbar">
                    {filteredCustomers.slice(0, 15).map(c => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCustomerId(c.id)}
                        className={`flex items-center justify-between p-2.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                          selectedCustomerId === c.id ? 'bg-blue-50/70' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar name={c.name} src={c.avatar_url} size="sm" />
                          <div className="truncate">
                            <div className="text-xs font-bold text-slate-800 truncate">{c.name}</div>
                            <div className="text-[11px] text-slate-400">{c.phone || '—'}</div>
                          </div>
                        </div>
                        {selectedCustomerId === c.id && (
                          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <div className="text-center py-4 text-xs text-slate-400">
                        {t('common.no_results', 'Không tìm thấy khách hàng')}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <input
                    type="text"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder={t('rooms_beds.customer_name_placeholder', 'Họ tên khách hàng *')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white text-slate-800 transition-all placeholder:text-slate-400"
                  />
                  <input
                    type="tel"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    placeholder={t('rooms_beds.customer_phone_placeholder', 'Số điện thoại (tùy chọn)')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white text-slate-800 transition-all placeholder:text-slate-400"
                  />
                </div>
              )}
            </div>

            {/* Service & Staff Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700">
                  {t('rooms_beds.service_and_staff', 'Dịch vụ & Nhân viên thực hiện')} <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddServiceRow}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('rooms_beds.add_service_row', 'Thêm dịch vụ')}</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {selectedServices.map((row, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {t('rooms_beds.service_item', 'Dịch vụ')} {idx + 1}
                      </span>
                      {selectedServices.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveServiceRow(idx)}
                          className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Service Picker */}
                      <div>
                        <select
                          value={row.service_id}
                          onChange={(e) => handleServiceChange(idx, 'service_id', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="">— {t('rooms_beds.select_service', 'Chọn dịch vụ')} —</option>
                          {applicableServices.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.duration_minutes || s.duration || 30}p)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Staff Picker */}
                      <div>
                        <select
                          value={row.staff_id}
                          onChange={(e) => handleServiceChange(idx, 'staff_id', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="">— {t('rooms_beds.select_staff', 'Chọn nhân viên')} —</option>
                          {staff.map(st => (
                            <option key={st.id} value={st.id}>
                              {st.full_name || st.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Settings */}
            <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-700">{t('rooms_beds.start_time', 'Giờ vào')}:</span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="ml-2 px-2.5 py-1 bg-white border border-blue-200 rounded-lg text-xs font-bold text-blue-700 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-slate-600">
                  {t('rooms_beds.estimated_duration', 'Thời lượng')}: <span className="font-bold text-slate-800">{totalDuration} {t('common.minutes', 'phút')}</span>
                </div>
                <div className="bg-white px-3 py-1.5 rounded-xl border border-blue-200 font-bold text-blue-700">
                  {t('rooms_beds.estimated_finish', 'Xong lúc')}: {endTime}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-3xl shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              {t('common.cancel', 'Huỷ bỏ')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? t('common.loading', 'Đang xử lý...') : t('rooms_beds.start_serving_btn', 'Bắt đầu phục vụ')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
