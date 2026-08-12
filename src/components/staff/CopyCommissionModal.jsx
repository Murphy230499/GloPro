'use client';

import { useT } from '@/lib/i18n';
import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/Layout';
import Avatar from '@/components/Avatar';
import { Checkbox } from '@/components/ui/checkbox';

export default function CopyCommissionModal({ staff, onClose, onRefresh }) {
  const { t } = useT();
  const [sourceStaffId, setSourceStaffId] = useState('');
  const [targetStaffIds, setTargetStaffIds] = useState([]);
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);
  const [isTargetDropdownOpen, setIsTargetDropdownOpen] = useState(false);
  const [searchSource, setSearchSource] = useState('');
  const [searchTarget, setSearchTarget] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.source-dropdown-container')) {
        setIsSourceDropdownOpen(false);
      }
      if (!e.target.closest('.target-dropdown-container')) {
        setIsTargetDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const translateRole = (role) => {
    const rolesMap = {
      manager: 'Quản lý',
      receptionist: 'Lễ tân',
      stylist: 'Thợ chính',
      barber: 'Barber',
      therapist: 'Chuyên viên Spa',
      nail_tech: 'Nail tech',
      technician: 'Kỹ thuật viên',
      cashier: 'Thu ngân',
    };
    return rolesMap[role] || 'Nhóm khác';
  };

  const getGroupedStaff = (list) => {
    return list.reduce((acc, curr) => {
      const roleName = translateRole(curr.role || 'technician');
      if (!acc[roleName]) acc[roleName] = [];
      acc[roleName].push(curr);
      return acc;
    }, {});
  };

  const handleToggleTarget = (id) => {
    if (targetStaffIds.includes(id)) {
      setTargetStaffIds(targetStaffIds.filter(x => x !== id));
    } else {
      setTargetStaffIds([...targetStaffIds, id]);
    }
  };

  const handleSelectAllTargets = (visibleTargets) => {
    const visibleIds = visibleTargets.map(s => s.id);
    const allSelected = visibleIds.every(id => targetStaffIds.includes(id));
    if (allSelected) {
      setTargetStaffIds(targetStaffIds.filter(id => !visibleIds.includes(id)));
    } else {
      const nextIds = [...targetStaffIds];
      visibleIds.forEach(id => {
        if (!nextIds.includes(id)) nextIds.push(id);
      });
      setTargetStaffIds(nextIds);
    }
  };

  const handleToggleTargetGroup = (groupStaffList) => {
    const groupIds = groupStaffList.map(s => s.id);
    const allSelected = groupIds.every(id => targetStaffIds.includes(id));
    if (allSelected) {
      setTargetStaffIds(targetStaffIds.filter(id => !groupIds.includes(id)));
    } else {
      const nextIds = [...targetStaffIds];
      groupIds.forEach(id => {
        if (!nextIds.includes(id)) nextIds.push(id);
      });
      setTargetStaffIds(nextIds);
    }
  };

  const handleSourceSelect = (id) => {
    setSourceStaffId(id);
    setTargetStaffIds([]); // Clear target selections when source changes
    setIsSourceDropdownOpen(false);
  };

  const handleCopy = async () => {
    if (!sourceStaffId) {
      toast.error('Vui lòng chọn nhân viên nguồn!');
      return;
    }
    if (targetStaffIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một nhân viên đích!');
      return;
    }

    setSaving(true);
    try {
      // 1. Fetch rules of source employee
      const allRules = await base44.entities.StaffCommissionRule.list();
      const sourceRules = allRules.filter(r => r.staff_id === sourceStaffId);

      const sourceStaffName = staff.find(s => s.id === sourceStaffId)?.full_name || 'N/A';
      const targetStaffNames = staff.filter(s => targetStaffIds.includes(s.id)).map(s => s.full_name);

      // 2. Perform copy & overwrite for each target employee
      for (const targetId of targetStaffIds) {
        // Delete target's existing rules
        const targetRules = allRules.filter(r => r.staff_id === targetId);
        for (const tr of targetRules) {
          if (tr.id && !String(tr.id).startsWith('local_')) {
            await base44.entities.StaffCommissionRule.delete(tr.id);
          }
        }

        // Create copies of source rules for target
        for (const sr of sourceRules) {
          await base44.entities.StaffCommissionRule.create({
            staff_id: targetId,
            item_type: sr.item_type,
            item_id: sr.item_id,
            commission_type: sr.commission_type,
            commission_value: sr.commission_value
          });
        }
      }

      // 3. Write Log
      const logPayload = {
        user_name: 'Quản trị viên',
        action_type: 'Sao chép hoa hồng',
        description: `Sao chép cấu hình hoa hồng từ nhân viên "${sourceStaffName}" sang: ${targetStaffNames.join(', ')}`,
        created_at: new Date().toISOString()
      };

      try {
        await base44.entities.StaffCommissionLog.create(logPayload);
      } catch (logErr) {
        console.warn('Lỗi ghi log:', logErr);
        const localLogs = JSON.parse(localStorage.getItem('glopro_commission_logs') || '[]');
        localLogs.unshift({ id: 'log_' + Date.now(), ...logPayload });
        localStorage.setItem('glopro_commission_logs', JSON.stringify(localLogs));
      }

      toast.success('Sao chép cấu hình hoa hồng thành công!');
      if (onRefresh) onRefresh();
      onClose();
    } catch (e) {
      console.error('Lỗi khi sao chép hoa hồng:', e);
      toast.error('Lỗi khi sao chép: ' + (e.message || e));
    }
    setSaving(false);
  };

  const sourceStaffObj = staff.find(s => s.id === sourceStaffId);
  const availableTargets = staff.filter(s => sourceStaffId ? s.id !== sourceStaffId : true);
  const groupedSourceStaff = getGroupedStaff(staff);
  const groupedTargetStaff = getGroupedStaff(availableTargets);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white w-full md:max-w-md rounded-3xl p-6 shadow-2xl text-left flex flex-col max-h-[90vh] overflow-visible">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 font-sans">{t('staff.commission.copy_title', 'Sao chép hoa hồng chung')}</h2>
            <p className="text-[10px] text-slate-450 font-medium mt-0.5">{t('staff.commission.copy_subtitle', 'Sao chép cấu hình hoa hồng TẤT CẢ các tab')}</p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-visible space-y-4">
          
          {/* Source Staff Single-Select Dropdown */}
          <div className="space-y-1.5 source-dropdown-container relative">
            <label className="text-[11px] font-normal text-slate-500 block">{t('staff.commission.step_1_source', '1. Nhân viên nguồn (Sao chép từ)')}</label>
            <button
              type="button"
              onClick={() => { setIsSourceDropdownOpen(!isSourceDropdownOpen); setIsTargetDropdownOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-normal text-slate-700 focus:border-orange-500 shadow-sm"
            >
              <div className="flex items-center gap-2 truncate">
                {sourceStaffObj ? (
                  <>
                    <Avatar src={sourceStaffObj.avatar_url} name={sourceStaffObj.full_name} size={20} color={sourceStaffObj.avatar_color} />
                    <span className="font-normal text-slate-700 truncate">{sourceStaffObj.full_name}</span>
                  </>
                ) : (
                  <span className="font-normal text-slate-400">Chọn nhân viên nguồn...</span>
                )}
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {isSourceDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1 bg-white rounded-2xl border border-slate-200 shadow-2xl z-30 flex flex-col max-h-60 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                {/* Search Input */}
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 border-b border-slate-100">
                  <input
                    type="text"
                    placeholder="tìm kiếm nhân viên nguồn..."
                    value={searchSource}
                    onChange={(e) => setSearchSource(e.target.value)}
                    className="w-full bg-transparent text-xs font-medium outline-none text-slate-700 placeholder:text-slate-400/50 placeholder:font-normal placeholder:lowercase"
                  />
                </div>
                {/* Scrollable list */}
                <div className="overflow-y-auto p-2 space-y-2">
                  {Object.entries(groupedSourceStaff).map(([roleName, members]) => {
                    const visibleMembers = members.filter(m => m.full_name.toLowerCase().includes(searchSource.toLowerCase()));
                    if (visibleMembers.length === 0) return null;

                    return (
                      <div key={roleName} className="space-y-0.5">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5">{roleName}</div>
                        <div className="space-y-0.5 pl-2">
                          {visibleMembers.map(m => {
                            const isSelected = m.id === sourceStaffId;
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => handleSourceSelect(m.id)}
                                className={`w-full flex items-center gap-2.5 text-left py-1.5 px-2.5 rounded-lg hover:bg-slate-55 transition-colors ${isSelected ? 'bg-slate-100/60 font-medium' : ''}`}
                              >
                                <Avatar src={m.avatar_url} name={m.full_name} size={20} color={m.avatar_color} />
                                <span className="text-xs font-normal text-slate-700">{m.full_name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Target Staff Multi-Select Dropdown */}
          <div className="space-y-1.5 target-dropdown-container relative animate-in fade-in duration-200">
            <label className="text-[11px] font-normal text-slate-500 block">{t('staff.commission.step_2_target', '2. Nhân viên nhận (Sao chép cho)')}</label>
            <button
                type="button"
              onClick={() => { setIsTargetDropdownOpen(!isTargetDropdownOpen); setIsSourceDropdownOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-normal text-slate-700 focus:border-orange-500 shadow-sm"
            >
              <span className="truncate font-normal text-slate-655">
                  {targetStaffIds.length === 0 
                    ? t('staff.commission.select_target', 'Chọn nhân viên nhận...') 
                    : targetStaffIds.length === availableTargets.length 
                      ? 'Tất cả nhân viên còn lại' 
                      : `Đã chọn ${targetStaffIds.length} nhân viên`}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              {isTargetDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white rounded-2xl border border-slate-200 shadow-2xl z-30 flex flex-col max-h-60 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                  {/* Search Input */}
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 border-b border-slate-100">
                    <input
                      type="text"
                      placeholder="tìm kiếm nhân viên nhận..."
                      value={searchTarget}
                      onChange={(e) => setSearchTarget(e.target.value)}
                      className="w-full bg-transparent text-xs font-medium outline-none text-slate-700 placeholder:text-slate-400/50 placeholder:font-normal placeholder:lowercase"
                    />
                  </div>
                  {/* Scrollable list */}
                  <div className="overflow-y-auto p-2 space-y-2">
                    {/* Select All */}
                    <label className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-50 rounded-xl cursor-pointer select-none">
                      <Checkbox 
                        checked={targetStaffIds.length === availableTargets.length && availableTargets.length > 0}
                        onCheckedChange={() => handleSelectAllTargets(availableTargets)}
                        className="border-slate-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 data-[state=checked]:text-white focus-visible:ring-orange-500 cursor-pointer"
                      />
                      <span className="text-xs font-normal text-slate-755">Chọn tất cả</span>
                    </label>

                    {/* Groups and targets */}
                    {Object.entries(groupedTargetStaff).map(([roleName, members]) => {
                      const visibleMembers = members.filter(m => m.full_name.toLowerCase().includes(searchTarget.toLowerCase()));
                      if (visibleMembers.length === 0) return null;

                      const isGroupAllSelected = visibleMembers.every(m => targetStaffIds.includes(m.id));

                      return (
                        <div key={roleName} className="space-y-0.5">
                          <label className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-50 rounded-xl cursor-pointer select-none">
                            <Checkbox 
                              checked={isGroupAllSelected}
                              onCheckedChange={() => handleToggleTargetGroup(visibleMembers)}
                              className="border-slate-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 data-[state=checked]:text-white focus-visible:ring-orange-500 cursor-pointer"
                            />
                            <span className="text-[10px] font-normal text-slate-400 uppercase tracking-wider">{roleName}</span>
                          </label>
                          
                          <div className="space-y-0.5 pl-4">
                            {visibleMembers.map(m => {
                              const isSelected = targetStaffIds.includes(m.id);
                              return (
                                <label
                                  key={m.id}
                                  className={`flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-50 rounded-xl cursor-pointer select-none ${isSelected ? 'bg-slate-100/60 font-medium' : ''}`}
                                >
                                  <Checkbox 
                                    checked={isSelected}
                                    onCheckedChange={() => handleToggleTarget(m.id)}
                                    className="border-slate-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 data-[state=checked]:text-white focus-visible:ring-orange-500 cursor-pointer"
                                  />
                                  <Avatar src={m.avatar_url} name={m.full_name} size={20} color={m.avatar_color} />
                                  <span className="text-xs font-normal text-slate-700">{m.full_name}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 pt-4 border-t border-slate-150/50 mt-4 shrink-0 font-sans">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-200/50 hover:bg-slate-250 transition-colors font-bold text-xs text-slate-650 font-sans"
          >
            {t('staff.scheduler.cancel', 'Hủy')}
          </button>
          <button 
            type="button" 
            onClick={handleCopy}
            disabled={saving || !sourceStaffId || targetStaffIds.length === 0}
            className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-xs shadow-sm hover:opacity-95 transition-all font-sans flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Xác nhận sao chép'}
          </button>
        </div>

      </div>
    </div>
  );
}
