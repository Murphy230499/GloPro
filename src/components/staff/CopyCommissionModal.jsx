'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Copy, ChevronDown, Search, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/Layout';
import Avatar from '@/components/Avatar';

export default function CopyCommissionModal({ staff, onClose, onRefresh }) {
  const [sourceStaffId, setSourceStaffId] = useState('');
  const [targetStaffIds, setTargetStaffIds] = useState([]);
  
  // UI states
  const [sourceOpen, setSourceOpen] = useState(false);
  const [targetOpen, setTargetOpen] = useState(false);
  const [searchSource, setSearchSource] = useState('');
  const [searchTarget, setSearchTarget] = useState('');
  const [saving, setSaving] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setSourceOpen(false);
        setTargetOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs" />
      <div className="relative bg-white w-full md:max-w-md rounded-3xl p-6 shadow-2xl relative text-left flex flex-col max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800 font-sans">Sao chép hoa hồng</h2>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-5 relative" ref={dropdownRef}>
          
          {/* Source Employee Select */}
          <div className="space-y-1.5 relative">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nhân viên nguồn (đã có hoa hồng)</label>
            <button
              type="button"
              onClick={() => { setSourceOpen(!sourceOpen); setTargetOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-normal text-slate-500 bg-white hover:bg-slate-50 transition-colors shadow-sm"
            >
              <span className="truncate">
                {sourceStaffId 
                  ? staff.find(s => s.id === sourceStaffId)?.full_name 
                  : 'chọn nhân viên nguồn'
                }
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
            </button>

            {sourceOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xl p-3 z-30 max-h-56 overflow-y-auto space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus-within:border-primary transition-all">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input 
                    type="text"
                    placeholder="tìm kiếm nhân viên nguồn..."
                    value={searchSource}
                    onChange={(e) => setSearchSource(e.target.value)}
                    className="bg-transparent text-xs font-medium outline-none w-full text-slate-700 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-1">
                  {staff
                    .filter(s => s.full_name.toLowerCase().includes(searchSource.toLowerCase()))
                    .map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => { setSourceStaffId(s.id); setSourceOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 hover:bg-slate-50 rounded-xl text-left text-xs font-semibold text-slate-700 transition-colors"
                      >
                        <Avatar src={s.avatar_url} name={s.full_name} size={20} color={s.avatar_color} />
                        <span>{s.full_name}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Target Employees Select */}
          <div className="space-y-1.5 relative">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sao chép đến (chọn nhiều nhân viên)</label>
            <button
              type="button"
              onClick={() => { setTargetOpen(!targetOpen); setSourceOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-normal text-slate-500 bg-white hover:bg-slate-50 transition-colors shadow-sm"
            >
              <span className="truncate">
                {targetStaffIds.length === 0 
                  ? 'chọn nhân viên nhận cấu hình' 
                  : `Đã chọn ${targetStaffIds.length} nhân viên`
                }
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
            </button>

            {targetOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xl p-3 z-30 max-h-56 overflow-y-auto space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus-within:border-primary transition-all">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input 
                    type="text"
                    placeholder="tìm kiếm nhân viên nhận..."
                    value={searchTarget}
                    onChange={(e) => setSearchTarget(e.target.value)}
                    className="bg-transparent text-xs font-medium outline-none w-full text-slate-700 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {staff
                    .filter(s => s.id !== sourceStaffId && s.full_name.toLowerCase().includes(searchTarget.toLowerCase()))
                    .map(s => {
                      const isChecked = targetStaffIds.includes(s.id);
                      return (
                        <label key={s.id} className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-slate-50 rounded-xl cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTargetStaffIds([...targetStaffIds, s.id]);
                              } else {
                                setTargetStaffIds(targetStaffIds.filter(id => id !== s.id));
                              }
                            }}
                            className="w-4 h-4 text-primary border-slate-250 rounded focus:ring-0 cursor-pointer"
                          />
                          <Avatar src={s.avatar_url} name={s.full_name} size={20} color={s.avatar_color} />
                          <span className="text-xs font-semibold text-slate-700">{s.full_name}</span>
                        </label>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="flex gap-2.5 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button 
              type="button" 
              onClick={handleCopy}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-95 disabled:opacity-50 transition-all font-sans shadow-sm flex items-center justify-center gap-1.5"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Sao chép
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
