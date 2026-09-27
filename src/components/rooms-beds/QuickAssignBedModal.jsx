import React, { useState, useEffect } from 'react';
import { X, User, Phone, Plus, Trash2, Clock, Check, Scissors, Search, UserX } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { toast } from '@/components/Layout';
import { formatMinutesToTime, timeStringToMinutes } from '@/components/appointments/constants';
import Avatar from '@/components/Avatar';
import { formatVND } from '@/lib/format';

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
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [clientQ, setClientQ] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

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
      setSelectedCustomer(null);
      setShowClientSearch(false);
      setClientQ('');
      setCustomerMode('existing');
      setNewCustomerName('');
      setNewCustomerPhone('');
    }
  }, [open, bed, applicableServices, staff]);

  if (!open || !bed) return null;

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
            {/* Customer Selection (Cashier / POS Style) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700">
                  {t('rooms_beds.customer', 'Khách hàng')} <span className="text-rose-500">*</span>
                </label>
                {customerMode === 'new' && (
                  <button
                    type="button"
                    onClick={() => setCustomerMode('existing')}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                  >
                    ← {t('rooms_beds.back_to_existing_customers', 'Chọn khách có sẵn')}
                  </button>
                )}
              </div>

              {customerMode === 'existing' ? (
                selectedCustomer ? (
                  /* Customer Card (Identical to POS Ticket Column) */
                  <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100/80">
                    <Avatar src={selectedCustomer.avatar_url} name={selectedCustomer.name} size={36} color="#34D399" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate text-emerald-900">{selectedCustomer.name}</div>
                      <div className="text-xs text-slate-500">
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
                ) : showClientSearch ? (
                  /* Active Search Input & Results (Identical to POS Ticket Column) */
                  <div className="relative">
                    <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 mb-2 border border-slate-200">
                      <Search className="w-4 h-4 text-slate-400" />
                      <input 
                        autoFocus 
                        value={clientQ} 
                        onChange={(e) => setClientQ(e.target.value)}
                        placeholder={t('pos.ticket.search_cust_input_placeholder', 'Nhập tên, email hoặc SĐT...')}
                        className="bg-transparent outline-none text-sm flex-1 text-slate-800" 
                      />
                      <button 
                        type="button"
                        onClick={() => { setShowClientSearch(false); setClientQ(''); }} 
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar border border-slate-100 rounded-xl p-1 bg-white">
                      {/* Khách vãng lai Button */}
                      <button 
                        type="button"
                        onClick={() => { 
                          setSelectedCustomer({ id: 'walk_in', name: 'Khách vãng lai', phone: '', points: 0, total_spent: 0, is_guest: true }); 
                          setShowClientSearch(false); 
                          setClientQ('');
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 text-left text-sm text-slate-500 cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold">VL</div>
                        <span className="font-medium text-slate-700">{t('pos.ticket.walk_in', 'Khách vãng lai')}</span>
                      </button>

                      {/* Matching Customers */}
                      {clientResults.map((c) => (
                        <button 
                          key={c.id} 
                          type="button"
                          onClick={() => { 
                            setSelectedCustomer(c); 
                            setShowClientSearch(false); 
                            setClientQ(''); 
                          }}
                          className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 text-left cursor-pointer"
                        >
                          <Avatar src={c.avatar_url} name={c.name} size={32} color="#34D399" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate text-slate-800">{c.name}</div>
                            <div className="text-xs text-slate-400">{c.phone || '—'} • {c.points || 0} {t('common.points', 'điểm')}</div>
                          </div>
                        </button>
                      ))}

                      {clientResults.length === 0 && clientQ && (
                        <div className="text-center py-4 text-xs text-slate-400">
                          {t('common.no_results', 'Không tìm thấy khách hàng')}
                        </div>
                      )}
                    </div>

                    <button 
                      type="button"
                      onClick={() => {
                        setCustomerMode('new');
                        setNewCustomerName(clientQ);
                      }} 
                      className="text-sm text-emerald-600 font-semibold flex items-center gap-1.5 mt-2 hover:underline cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> 
                      <span>{t('pos.ticket.add_new_customer', 'Thêm khách hàng mới')}</span>
                    </button>
                  </div>
                ) : (
                  /* Inactive Dashed Search Button (Identical to POS Ticket Column) */
                  <button 
                    type="button"
                    onClick={() => setShowClientSearch(true)}
                    className="w-full flex items-center gap-2 p-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-sm hover:border-emerald-300 hover:text-emerald-600 transition-colors cursor-pointer"
                  >
                    <Search className="w-4 h-4" /> 
                    <span>{t('pos.ticket.search_cust_input_placeholder', 'Nhập tên, email hoặc SĐT khách hàng')}</span>
                  </button>
                )
              ) : (
                /* Add New Customer Form */
                <div className="space-y-2.5">
                  <input
                    type="text"
                    autoFocus
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
                          className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded-lg cursor-pointer"
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
