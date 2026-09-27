import React, { useState, useMemo } from 'react';
import { X, ArrowRightLeft, Sparkles, Clock, Check, Plus, Trash2, ChevronDown, BedDouble } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { toast } from '@/components/Layout';
import Avatar from '@/components/Avatar';
import ServicePickerDropdown from './ServicePickerDropdown';
import StaffPickerDropdown from './StaffPickerDropdown';

export default function BedTransferModal({
  open,
  onClose,
  currentBed,
  currentRoom,
  activeSession,
  allBeds = [],
  allRooms = [],
  bedSessions = {},
  applicableServices = [],
  staff = [],
  onConfirmTransfer
}) {
  const { t } = useT();

  const [targetBedId, setTargetBedId] = useState('');
  const [changeServices, setChangeServices] = useState(false);
  const [selectedServices, setSelectedServices] = useState(() => {
    return activeSession?.services?.length
      ? activeSession.services.map(s => ({
          service_id: s.service_id || '',
          staff_id: s.staff_id || ''
        }))
      : [{ service_id: '', staff_id: '' }];
  });

  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

  // Filter available target beds (only vacant beds, excluding current bed)
  const availableBeds = useMemo(() => {
    return allBeds.filter(b => b.id !== currentBed?.id && !bedSessions[b.id]);
  }, [allBeds, currentBed, bedSessions]);

  // Group available beds by room
  const bedsByRoom = useMemo(() => {
    const map = {};
    allRooms.forEach(r => {
      map[r.id] = { room: r, beds: [] };
    });
    map['__unassigned'] = {
      room: { id: '__unassigned', name: t('rooms_beds.unassigned_area', 'Chưa phân phòng / Khu vực chung') },
      beds: []
    };

    availableBeds.forEach(b => {
      const rId = b.room_id && map[b.room_id] ? b.room_id : '__unassigned';
      map[rId].beds.push(b);
    });

    return Object.values(map).filter(group => group.beds.length > 0);
  }, [allRooms, availableBeds, t]);

  const targetBedObj = useMemo(() => {
    return allBeds.find(b => b.id === targetBedId);
  }, [allBeds, targetBedId]);

  const targetRoomObj = useMemo(() => {
    if (!targetBedObj?.room_id) return null;
    return allRooms.find(r => r.id === targetBedObj.room_id);
  }, [allRooms, targetBedObj]);

  if (!open || !currentBed || !activeSession) return null;

  const handleAddServiceRow = () => {
    setSelectedServices(prev => [...prev, { service_id: applicableServices[0]?.id || '', staff_id: staff[0]?.id || '' }]);
  };

  const handleRemoveServiceRow = (index) => {
    if (selectedServices.length <= 1) return;
    setSelectedServices(prev => prev.filter((_, i) => i !== index));
  };

  const handleServiceChange = (index, field, value) => {
    setSelectedServices(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    if (!targetBedId) {
      return toast.error(t('rooms_beds.err_select_target_bed', 'Vui lòng chọn giường / phòng muốn chuyển đến'));
    }

    let finalServices = activeSession.services || [];
    if (changeServices) {
      const valid = selectedServices.filter(s => Boolean(s.service_id));
      if (valid.length === 0) {
        return toast.error(t('rooms_beds.err_select_service', 'Vui lòng chọn ít nhất 1 dịch vụ'));
      }
      finalServices = valid.map(row => {
        const srv = applicableServices.find(s => s.id === row.service_id);
        const stf = staff.find(st => st.id === row.staff_id);
        return {
          service_id: row.service_id,
          name: srv?.name || 'Dịch vụ',
          price: srv?.price || 0,
          duration: Number(srv?.duration_minutes || srv?.duration || 30),
          staff_id: row.staff_id || '',
          staff_name: stf?.full_name || stf?.name || ''
        };
      });
    }

    onConfirmTransfer({
      fromBedId: currentBed.id,
      toBedId: targetBedId,
      targetBed: targetBedObj,
      targetRoom: targetRoomObj,
      newServices: finalServices,
      startTime
    });

    toast.success(t('rooms_beds.transfer_success', 'Đã chuyển giường thành công'));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs font-sans text-slate-800 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div 
        className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200/80 overflow-visible z-10 flex flex-col max-h-[90vh] text-left"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-7 py-5 sm:py-6 bg-white border-b border-slate-100 shrink-0 rounded-t-3xl">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-snug flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-blue-600" />
              <span>{t('rooms_beds.transfer_bed_title', 'Chuyển giường / phòng')}</span>
            </h2>
            <p className="text-xs text-slate-500">
              {t('rooms_beds.transfer_subtitle', 'Chuyển khách sang phòng hoặc giường khác, tự động bảo lưu hoá đơn')}
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="flex-1 overflow-y-auto flex flex-col min-h-0">
          <div className="p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
            {/* Customer & Current Bed Summary Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar 
                  name={activeSession.customer?.name || activeSession.customer_name} 
                  src={activeSession.customer?.avatar_url} 
                  size={40} 
                  color="#3B82F6" 
                />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">
                    {activeSession.customer?.name || activeSession.customer_name || t('rooms_beds.walk_in_customer', 'Khách vãng lai')}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {activeSession.customer?.phone || '—'}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {t('rooms_beds.current_location', 'Vị trí hiện tại')}
                </div>
                <div className="text-xs font-bold text-blue-600 mt-0.5">
                  {currentBed.name} {currentRoom?.name ? `(${currentRoom.name})` : ''}
                </div>
              </div>
            </div>

            {/* Target Bed Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('rooms_beds.select_target_bed', 'Chọn giường / phòng chuyển đến')} <span className="text-rose-500">*</span>
              </label>

              {availableBeds.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <BedDouble className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{t('rooms_beds.no_vacant_beds', 'Hiện không có giường nào khác đang trống để chuyển.')}</span>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={targetBedId}
                    onChange={(e) => setTargetBedId(e.target.value)}
                    className="w-full pl-3.5 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 cursor-pointer appearance-none"
                  >
                    <option value="">— {t('rooms_beds.select_bed_placeholder', 'Chọn giường trống')} —</option>
                    {bedsByRoom.map(group => (
                      <optgroup key={group.room.id} label={group.room.name}>
                        {group.beds.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({group.room.name})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}
            </div>

            {/* Transfer Time */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>{t('rooms_beds.transfer_start_time', 'Giờ bắt đầu tại giường mới')}:</span>
              </div>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-blue-700 outline-none focus:border-blue-500"
              />
            </div>

            {/* Toggle Change Services */}
            <div className="pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={changeServices}
                  onChange={(e) => setChangeServices(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span>{t('rooms_beds.change_service_at_new_bed', 'Khách đổi hoặc làm thêm dịch vụ mới tại phòng này')}</span>
              </label>
            </div>

            {/* Service & Staff Selection when toggle is ON */}
            {changeServices && (
              <div className="space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {t('rooms_beds.services_for_new_bed', 'Dịch vụ tại giường mới')}
                  </span>
                  <button
                    type="button"
                    onClick={handleAddServiceRow}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('rooms_beds.add_service_row', 'Thêm dịch vụ')}</span>
                  </button>
                </div>

                {selectedServices.map((row, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <ServicePickerDropdown
                        servicesList={applicableServices}
                        value={row.service_id}
                        onChange={(val) => handleServiceChange(idx, 'service_id', val)}
                        t={t}
                        placeholder={`— ${t('rooms_beds.select_service', 'Chọn dịch vụ')} —`}
                      />

                      <StaffPickerDropdown
                        staffList={staff}
                        value={row.staff_id}
                        onChange={(val) => handleServiceChange(idx, 'staff_id', val)}
                        t={t}
                        placeholder={`— ${t('rooms_beds.select_staff', 'Chọn nhân viên')} —`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-3xl shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              {t('common.cancel', 'Huỷ')}
            </button>
            <button
              type="submit"
              disabled={!targetBedId || availableBeds.length === 0}
              className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {t('rooms_beds.confirm_transfer', 'Xác nhận chuyển')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
