'use client';
import React, { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/Layout';
import ImageUpload from '@/components/ImageUpload';

const ROLES = {
  manager: { label: 'Quản lý', color: '#FF6B9D' },
  receptionist: { label: 'Lễ tân', color: '#60A5FA' },
  stylist: { label: 'Kỹ thuật viên tóc', color: '#A78BFA' },
  barber: { label: 'Barber', color: '#34D399' },
  therapist: { label: 'Chuyên viên Spa', color: '#FBBF24' },
  nail_tech: { label: 'Nail tech', color: '#F472B6' },
  technician: { label: 'Kỹ thuật viên', color: '#F97316' },
  cashier: { label: 'Thu ngân', color: '#94A3B8' },
};

const COLORS = ['#FF6B9D', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F97316'];

export default function StaffForm({ staff, branchId, onClose, onSave }) {
  const [f, setF] = useState({
    full_name: staff.full_name || '',
    phone: staff.phone || '',
    role: staff.role || 'stylist',
    base_salary: staff.base_salary || 0,
    specialties: staff.specialties || '',
    avatar_color: staff.avatar_color || COLORS[0],
    avatar_url: staff.avatar_url || '',
    group_id: staff.group_id || '',
    service_ids: staff.service_ids || [],
    can_be_booked: staff.can_be_booked !== false,
    max_concurrent_bookings: staff.max_concurrent_bookings || 1,
    branch_id: staff.branch_id || (branchId === 'all' ? '' : branchId),
  });

  const [services, setServices] = useState([]);
  const [serviceGroups, setServiceGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSpecialtiesDropdown, setShowSpecialtiesDropdown] = useState(false);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [svcs, svcGps, branchList] = await Promise.all([
          base44.entities.Service.filter({ is_active: true }),
          base44.entities.ServiceGroup.filter({ type: 'service' }),
          base44.entities.Branch.list()
        ]);
        setServices(svcs);
        setServiceGroups(svcGps);
        setBranches(branchList);
        
        if (!staff.branch_id && !f.branch_id && branchList && branchList.length > 0) {
          setF(prev => ({ ...prev, branch_id: branchList[0].id }));
        }
      } catch (e) {
        console.error('Lỗi tải dữ liệu StaffForm:', e);
      }
      setLoading(false);
    };
    loadData();
  }, [branchId]);

  const handleToggleService = (id) => {
    const list = f.service_ids || [];
    if (list.includes(id)) {
      setF({ ...f, service_ids: list.filter(x => x !== id) });
    } else {
      setF({ ...f, service_ids: [...list, id] });
    }
  };



  const handleSubmit = () => {
    if (!f.full_name.trim()) return toast.error('Nhập họ tên nhân viên');
    if (!f.branch_id) return toast.error('Vui lòng chọn chi nhánh');
    onSave(f);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs" />
      <div className="relative bg-white w-full md:max-w-md rounded-3xl p-6 shadow-2xl relative text-left flex flex-col max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3 shrink-0">
          <h2 className="text-base font-bold text-slate-800 font-sans">{staff.id ? 'Sửa hồ sơ nhân viên' : 'Thêm nhân viên'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-4">
          {/* Section 1: Basic Info */}
          <div className="space-y-3">
            <div className="block font-bold text-slate-400 mb-1 text-[11px] uppercase tracking-wider">Thông tin cơ bản</div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-500 mb-1 text-[11px]">Họ tên *</label>
                <input 
                  value={f.full_name} 
                  onChange={(e) => setF({ ...f, full_name: e.target.value })} 
                  placeholder="Họ tên nhân viên..." 
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" 
                />
              </div>
              <div>
                <label className="block font-bold text-slate-500 mb-1 text-[11px]">Số điện thoại</label>
                <input 
                  value={f.phone} 
                  onChange={(e) => setF({ ...f, phone: e.target.value })} 
                  placeholder="Số điện thoại..." 
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" 
                />
              </div>
            </div>

            {branches.length > 0 && (
              <div>
                <label className="block font-bold text-slate-500 mb-1 text-[11px]">Chi nhánh *</label>
                <div className="relative">
                  <select 
                    value={f.branch_id} 
                    onChange={(e) => setF({ ...f, branch_id: e.target.value })} 
                    className="w-full px-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white font-semibold appearance-none"
                    disabled={branchId !== 'all'}
                  >
                    <option value="">— Chọn chi nhánh —</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            )}
            
            <div>
              <label className="block font-bold text-slate-500 mb-1 text-[11px]">Vai trò</label>
              <div className="relative">
                <select 
                  value={f.role} 
                  onChange={(e) => setF({ ...f, role: e.target.value })} 
                  className="w-full px-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white appearance-none"
                >
                  {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>


            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-500 mb-1 text-[11px]">Lương cơ bản (VNĐ/tháng)</label>
                <input 
                  type="number" 
                  value={f.base_salary || ''} 
                  onChange={(e) => setF({ ...f, base_salary: Number(e.target.value) || 0 })} 
                  placeholder="Lương cơ bản..." 
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" 
                />
              </div>
              <div>
                <label className="block font-bold text-slate-500 mb-1 text-[11px]">Màu đại diện</label>
                <div className="flex items-center gap-1.5 h-[38px]">
                  {COLORS.map((c) => (
                    <button 
                      key={c} 
                      type="button"
                      onClick={() => setF({ ...f, avatar_color: c })} 
                      className="w-5 h-5 rounded-full transition-transform active:scale-95" 
                      style={{ 
                        background: c, 
                        outline: f.avatar_color === c ? '2px solid #fff' : 'none', 
                        boxShadow: f.avatar_color === c ? `0 0 0 2px ${c}` : 'none' 
                      }} 
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-500 mb-1 text-[11px]">Ghi chú</label>
              <textarea 
                value={f.specialties} 
                onChange={(e) => setF({ ...f, specialties: e.target.value })} 
                placeholder="Ghi chú về nhân viên..." 
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" 
              />
            </div>

            <ImageUpload value={f.avatar_url} onChange={(v) => setF({ ...f, avatar_url: v })} label="Ảnh chân dung nhân sự" shape="circle" />
          </div>

          {/* Section 3: Professional Specialties (Services they can perform) */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <label className="block font-bold text-slate-500 mb-1 text-[11px]">Chuyên môn dịch vụ</label>
            <div className="relative">
              <input 
                type="text"
                value={searchTerm} 
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSpecialtiesDropdown(true);
                }}
                onFocus={() => setShowSpecialtiesDropdown(true)}
                placeholder={f.service_ids.length === 0 ? "Chọn dịch vụ chuyên môn" : `Đã chọn ${f.service_ids.length} dịch vụ`}
                className="w-full px-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" 
              />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />

              {showSpecialtiesDropdown && (
                <>
                  <div className="fixed inset-0 z-[60]" onClick={() => setShowSpecialtiesDropdown(false)} />
                  <div className="absolute left-0 right-0 mt-1 z-[70] bg-white rounded-2xl border border-slate-200 shadow-2xl p-3 max-h-64 overflow-y-auto space-y-3">
                    {loading ? (
                      <div className="text-center py-4 text-xs text-slate-400">Đang tải danh sách dịch vụ...</div>
                    ) : services.length === 0 ? (
                      <div className="text-center py-4 text-xs text-slate-400">Không tìm thấy dịch vụ nào</div>
                    ) : (
                      <>
                        {/* 1. Select All Checkbox */}
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer pb-2 border-b border-slate-100 select-none">
                          <input 
                            type="checkbox"
                            checked={services.length > 0 && f.service_ids.length === services.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setF({ ...f, service_ids: services.map(s => s.id) });
                              } else {
                                setF({ ...f, service_ids: [] });
                              }
                            }}
                            className="w-3.5 h-3.5 text-primary border-slate-300 rounded focus:ring-primary"
                          />
                          <span>Tất cả</span>
                        </label>

                        {/* 2. Group Checkboxes & Services */}
                        <div className="space-y-3">
                          {serviceGroups.map((g) => {
                            const groupServices = services.filter(s => s.group_id === g.id);
                            const filteredGroupServices = groupServices.filter(s => 
                              s.name.toLowerCase().includes(searchTerm.toLowerCase())
                            );
                            if (filteredGroupServices.length === 0) return null;
                            
                            const isAllGroupChecked = filteredGroupServices.every(s => f.service_ids.includes(s.id));
                            const isAnyGroupChecked = filteredGroupServices.some(s => f.service_ids.includes(s.id));
                            
                            return (
                              <div key={g.id} className="space-y-1">
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none py-0.5">
                                  <input 
                                    type="checkbox" 
                                    checked={isAllGroupChecked}
                                    ref={el => {
                                      if (el) el.indeterminate = isAnyGroupChecked && !isAllGroupChecked;
                                    }}
                                    onChange={(e) => {
                                      const ids = filteredGroupServices.map(x => x.id);
                                      if (e.target.checked) {
                                        setF({ ...f, service_ids: Array.from(new Set([...f.service_ids, ...ids])) });
                                      } else {
                                        setF({ ...f, service_ids: f.service_ids.filter(id => !ids.includes(id)) });
                                      }
                                    }}
                                    className="w-3.5 h-3.5 text-primary border-slate-300 rounded focus:ring-primary" 
                                  />
                                  <span>{g.name}</span>
                                </label>
                                
                                <div className="pl-6 space-y-1">
                                  {filteredGroupServices.map((s) => (
                                    <label key={s.id} className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none py-0.5">
                                      <input 
                                        type="checkbox" 
                                        checked={f.service_ids.includes(s.id)}
                                        onChange={() => handleToggleService(s.id)}
                                        className="w-3.5 h-3.5 text-primary border-slate-300 rounded focus:ring-primary" 
                                      />
                                      <span className="truncate">{s.name}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 2: Online Scheduling Settings */}
          <div className="border-t border-slate-100 pt-4 space-y-3 pb-12">
            <div className="block font-bold text-slate-400 mb-1 text-[11px] uppercase tracking-wider">Cấu hình Đặt lịch hẹn</div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
              <div>
                <div className="text-xs font-semibold text-slate-700">Cho phép nhận lịch hẹn</div>
                <div className="text-[10px] text-slate-400">Hiển thị nhân viên này trong danh sách đặt lịch hẹn</div>
              </div>
              <input 
                type="checkbox" 
                checked={f.can_be_booked} 
                onChange={(e) => setF({ ...f, can_be_booked: e.target.checked })} 
                className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary" 
              />
            </div>

            {f.can_be_booked && (
              <div className="p-3 rounded-xl bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-500">Số lịch hẹn nhận đồng thời:</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="10" 
                    value={f.max_concurrent_bookings} 
                    onChange={(e) => setF({ ...f, max_concurrent_bookings: Math.max(1, Number(e.target.value) || 1) })} 
                    className="w-16 px-2 py-1 rounded-lg border border-slate-200 text-center text-xs font-bold focus:outline-none focus:border-primary bg-white text-slate-700" 
                  />
                </div>
                <p className="text-[10px] text-slate-400">Thường đặt là 1. Nếu cho phép đặt trùng ca để phục vụ nhiều khách cùng lúc (ví dụ: làm móng hoặc ủ tóc), hãy tăng chỉ số này.</p>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="flex gap-2 pt-4 border-t border-slate-150/50 mt-4 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-200/50 hover:bg-slate-250 transition-colors font-bold text-xs text-slate-600 font-sans">Hủy</button>
          <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-sm hover:opacity-95 transition-all font-sans">Lưu</button>
        </div>

      </div>
    </div>

  );
}
