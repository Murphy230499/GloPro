import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Check, ChevronDown } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { toast } from '@/components/Layout';

export default function BedModal({
  open,
  onClose,
  onSave,
  editingItem = null,
  rooms = [],
  services = [],
  loading = false
}) {
  const { t } = useT();

  const [formData, setFormData] = useState({
    name: '',
    room_id: '',
    applicable_services: [],
    allow_overlap: false
  });

  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name || '',
        room_id: editingItem.room_id || '',
        applicable_services: editingItem.applicable_services || [],
        allow_overlap: Boolean(editingItem.allow_overlap)
      });
    } else {
      setFormData({
        name: '',
        room_id: rooms[0]?.id || '',
        applicable_services: [],
        allow_overlap: false
      });
    }
    setServiceDropdownOpen(false);
    setServiceSearch('');
  }, [editingItem, open, rooms]);

  // Click outside service dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setServiceDropdownOpen(false);
      }
    };
    if (serviceDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [serviceDropdownOpen]);

  if (!open) return null;

  const isEditing = Boolean(editingItem);

  // Group services by category
  const filteredServices = services.filter(s =>
    (s.name || '').toLowerCase().includes(serviceSearch.toLowerCase()) ||
    (s.category || '').toLowerCase().includes(serviceSearch.toLowerCase())
  );

  const servicesByCategory = filteredServices.reduce((acc, s) => {
    const cat = s.category || s.group || t('rooms_beds.other_services_group', 'Dịch vụ khác');
    (acc[cat] = acc[cat] || []).push(s);
    return acc;
  }, {});

  const allSelected = services.length > 0 && formData.applicable_services.length === services.length;

  const handleToggleAllServices = () => {
    if (allSelected) {
      setFormData(prev => ({ ...prev, applicable_services: [] }));
    } else {
      setFormData(prev => ({ ...prev, applicable_services: services.map(s => s.id) }));
    }
  };

  const handleToggleService = (serviceId) => {
    setFormData(prev => {
      const exists = prev.applicable_services.includes(serviceId);
      return {
        ...prev,
        applicable_services: exists
          ? prev.applicable_services.filter(id => id !== serviceId)
          : [...prev.applicable_services, serviceId]
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return toast.error(t('rooms_beds.err_bed_name', 'Vui lòng nhập tên giường / vị trí'));
    }

    onSave({
      ...formData,
      name: formData.name.trim(),
      room_id: formData.room_id || null
    });
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
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {isEditing ? t('rooms_beds.edit_bed', 'Chỉnh sửa vị trí') : t('rooms_beds.add_bed', 'Thêm vị trí')}
          </h2>
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col min-h-0">
          <div className="p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
            {/* Tên Giường */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('rooms_beds.bed_label', 'Tên giường / ghế')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                autoFocus
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('rooms_beds.bed_placeholder', 'Nhập tên vị trí (VD: Giường 1, Ghế Nail 2)')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white text-slate-800 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Chọn Phòng */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('rooms_beds.room_label', 'Phòng')} <span className="text-slate-400 font-normal">({t('common.optional', 'Tùy chọn')})</span>
              </label>
              <div className="relative">
                <select
                  value={formData.room_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, room_id: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white text-slate-800 transition-all appearance-none cursor-pointer pr-9"
                >
                  <option value="">— {t('rooms_beds.unassigned_room', 'Chưa phân phòng / Khu vực chung')} —</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>{room.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Dịch vụ áp dụng Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('rooms_beds.applicable_services', 'Dịch vụ áp dụng')} <span className="text-rose-500">*</span>
              </label>
              
              <button
                type="button"
                onClick={() => setServiceDropdownOpen(!serviceDropdownOpen)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm flex items-center justify-between text-left text-slate-800 hover:border-slate-300 focus:border-blue-500 transition-all cursor-pointer"
              >
                <span className="truncate">
                  {formData.applicable_services.length === 0
                    ? t('rooms_beds.select_services_placeholder', 'Chọn dịch vụ áp dụng (mặc định tất cả)')
                    : formData.applicable_services.length === services.length
                    ? t('rooms_beds.all_services_selected', 'Đã chọn tất cả dịch vụ')
                    : `${t('rooms_beds.selected_count', 'Đã chọn')} ${formData.applicable_services.length} ${t('rooms_beds.services_unit', 'dịch vụ')}`}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
              </button>

              {/* Popup dropdown */}
              {serviceDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-72 animate-in fade-in zoom-in-95 duration-100">
                  {/* Search */}
                  <div className="p-2.5 border-b border-slate-100 bg-slate-50/70">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder={t('rooms_beds.search_services', 'Tìm kiếm dịch vụ...')}
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-slate-800 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* List with Groups */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {/* Select all checkbox */}
                    <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs font-semibold text-slate-800 select-none border-b border-slate-100 pb-2">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        allSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {allSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span>{t('rooms_beds.select_all_services', 'Tất cả dịch vụ')}</span>
                    </label>

                    {Object.entries(servicesByCategory).map(([category, sList]) => (
                      <div key={category} className="space-y-1">
                        <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase px-2 pt-1">
                          {category}
                        </div>
                        <div className="pl-1 space-y-0.5">
                          {sList.map(s => {
                            const isSelected = formData.applicable_services.includes(s.id);
                            return (
                              <label
                                key={s.id}
                                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs text-slate-700 select-none"
                              >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                                  isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                                }`}>
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span className="truncate">{s.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {filteredServices.length === 0 && (
                      <div className="text-center py-4 text-xs text-slate-400">
                        {t('common.no_results', 'Không tìm thấy dịch vụ phù hợp')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Switch: Cho phép đặt trùng lịch */}
            <div className="pt-2">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <label className="text-xs font-semibold text-slate-800 cursor-pointer block" onClick={() => setFormData(prev => ({ ...prev, allow_overlap: !prev.allow_overlap }))}>
                    {t('rooms_beds.allow_overlap', 'Cho phép đặt trùng lịch')}
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {formData.allow_overlap 
                      ? t('rooms_beds.overlap_enabled_hint', 'Nhiều khách có thể sử dụng cùng vị trí trong cùng thời điểm.')
                      : t('rooms_beds.overlap_disabled_hint', 'Hệ thống sẽ cảnh báo khi có lịch hẹn trùng khung giờ trên vị trí này.')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, allow_overlap: !prev.allow_overlap }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.allow_overlap ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      formData.allow_overlap ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
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
              {loading ? t('common.loading', 'Đang lưu...') : isEditing ? t('common.save', 'Lưu') : t('common.create', 'Tạo')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
