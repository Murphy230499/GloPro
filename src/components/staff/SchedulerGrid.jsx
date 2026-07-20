'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Copy, RefreshCw, AlertCircle, Plus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/Layout';
import Avatar from '@/components/Avatar';

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


// Helper to get Mon-Sun dates for a week
const getWeekDays = (baseDateStr) => {
  const current = new Date(baseDateStr);
  const day = current.getDay();
  // Get Monday
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(current.setDate(diff));
  
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
};

const formatVietnameseDate = (dateStr) => {
  const d = new Date(dateStr);
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const dayLabel = days[d.getDay()];
  const dateNum = d.getDate().toString().padStart(2, '0');
  const monthNum = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${dayLabel} ngày ${dateNum} tháng ${monthNum} năm ${year}`;
};

const formatDateHeader = (dateStr) => {
  const d = new Date(dateStr);
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const dayLabel = days[d.getDay()];
  const dateNum = d.getDate().toString().padStart(2, '0');
  const monthNum = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${dayLabel} ${dateNum}/${monthNum}`;
};

export default function SchedulerGrid({ branchId }) {
  const [baseDate, setBaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [staff, setStaff] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assignment Modal states for multiple shifts per day
  const [assignModalCell, setAssignModalCell] = useState(null); // { staff, date }
  const [selectedShiftIds, setSelectedShiftIds] = useState([]);
  const [isOff, setIsOff] = useState(false);
  const [offType, setOffType] = useState('vacation');

  // Selector state for individual cell updates
  const [activeCell, setActiveCell] = useState(null); // { staffId, date }
  
  // Dialog modal states for Copy Operations
  const [copyStaffModal, setCopyStaffModal] = useState(false);
  const [srcStaffId, setSrcStaffId] = useState('');
  const [destStaffId, setDestStaffId] = useState('');

  const [copyDayModal, setCopyDayModal] = useState(false);
  const [srcDay, setSrcDay] = useState('');
  const [destDay, setDestDay] = useState('');

  const [swapModal, setSwapModal] = useState(false);
  const [swapStaffA, setSwapStaffA] = useState('');
  const [swapStaffB, setSwapStaffB] = useState('');
  const [swapDay, setSwapDay] = useState('');

  const weekDays = getWeekDays(baseDate);

  const loadData = async () => {
    setLoading(true);
    const filter = branchId === 'all' ? {} : { branch_id: branchId };
    
    let stList = [];
    try {
      stList = await base44.entities.Staff.filter(filter);
    } catch (e) {
      console.error('Lỗi khi tải danh sách nhân viên xếp lịch từ API:', e);
      const localStaff = localStorage.getItem('glopro_staff');
      stList = localStaff ? JSON.parse(localStaff) : [];
    }

    let tmplList = [];
    try {
      tmplList = await base44.entities.ShiftTemplate.list();
    } catch (e) {
      console.error('Lỗi khi tải ca làm việc mẫu từ API:', e);
      const localTemplates = localStorage.getItem('glopro_shift_templates');
      tmplList = localTemplates ? JSON.parse(localTemplates) : [];
    }

    let schedList = [];
    try {
      schedList = await base44.entities.StaffSchedule.filter({
        date_gte: weekDays[0],
        date_lte: weekDays[6]
      });
    } catch (e) {
      console.error('Lỗi khi tải lịch làm việc từ API:', e);
      const localSchedules = localStorage.getItem('glopro_staff_schedules');
      schedList = localSchedules ? JSON.parse(localSchedules) : [];
    }

    setStaff(stList.filter(x => x.is_active !== false));
    setTemplates(tmplList);
    setSchedules(schedList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [baseDate, branchId]);

  const changeWeek = (direction) => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + (direction * 7));
    setBaseDate(d.toISOString().slice(0, 10));
    setActiveCell(null);
  };

  const getCellSchedules = (staffId, date) => {
    return schedules.filter(s => s.staff_id === staffId && s.date === date);
  };

  const openAssignModal = (s, date) => {
    const dayScheds = schedules.filter(sc => sc.staff_id === s.id && sc.date === date);
    const activeIds = dayScheds.filter(sc => !sc.is_off && sc.shift_template_id).map(sc => sc.shift_template_id);
    const offRecord = dayScheds.find(sc => sc.is_off);
    
    setAssignModalCell({ staff: s, date });
    setSelectedShiftIds(activeIds);
    setIsOff(!!offRecord);
    setOffType(offRecord ? offRecord.off_type : 'vacation');
  };

  const handleAssignShifts = async (staffId, date, selectedIds, isOffMode, offReason) => {
    const dayScheds = schedules.filter(s => s.staff_id === staffId && s.date === date);
    try {
      // Delete existing schedules for this staff & day on the server
      for (const old of dayScheds) {
        if (!old.id.toString().startsWith('local_')) {
          await base44.entities.StaffSchedule.delete(old.id);
        }
      }

      // Create new ones
      if (isOffMode) {
        await base44.entities.StaffSchedule.create({
          staff_id: staffId,
          date,
          is_off: true,
          off_type: offReason,
          shift_template_id: ''
        });
      } else {
        for (const id of selectedIds) {
          await base44.entities.StaffSchedule.create({
            staff_id: staffId,
            date,
            is_off: false,
            off_type: '',
            shift_template_id: id
          });
        }
      }
      toast.success('Đã lưu lịch làm việc thành công');
      setAssignModalCell(null);
      loadData();
    } catch (e) {
      console.error('Lỗi xếp lịch API:', e);
      // Local storage fallback for offline support
      const local = localStorage.getItem('glopro_staff_schedules');
      let list = local ? JSON.parse(local) : [];

      // Filter out existing day records
      list = list.filter(x => !(x.staff_id === staffId && x.date === date));

      if (isOffMode) {
        list.push({
          id: 'local_' + Date.now() + '_off',
          staff_id: staffId,
          date,
          is_off: true,
          off_type: offReason,
          shift_template_id: ''
        });
      } else {
        selectedIds.forEach((id, idx) => {
          list.push({
            id: 'local_' + Date.now() + '_' + idx,
            staff_id: staffId,
            date,
            is_off: false,
            off_type: '',
            shift_template_id: id
          });
        });
      }
      localStorage.setItem('glopro_staff_schedules', JSON.stringify(list));
      setAssignModalCell(null);
      loadData();
      toast.success('Đã lưu ca làm việc (offline)');
    }
  };

  // --- Copy operations ---

  const handleCopyWeek = async () => {
    if (!window.confirm('Sao chép toàn bộ lịch xếp ca của tuần hiện tại sang tuần tiếp theo?')) return;
    
    // Calculate next week days
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 7);
    const nextWeekDays = getWeekDays(d.toISOString().slice(0, 10));

    let count = 0;
    try {
      // Clear existing schedules in the target week first to avoid duplicates
      const targetExisting = await base44.entities.StaffSchedule.filter({
        date_gte: nextWeekDays[0],
        date_lte: nextWeekDays[6]
      });
      for (const old of targetExisting) {
        await base44.entities.StaffSchedule.delete(old.id);
      }

      // Copy each schedule
      for (const s of schedules) {
        const curIdx = weekDays.indexOf(s.date);
        if (curIdx !== -1) {
          const targetDate = nextWeekDays[curIdx];
          await base44.entities.StaffSchedule.create({
            staff_id: s.staff_id,
            date: targetDate,
            shift_template_id: s.shift_template_id || '',
            is_off: s.is_off,
            off_type: s.off_type || ''
          });
          count++;
        }
      }
      toast.success(`Đã sao chép thành công ${count} ca xếp sang tuần tiếp theo`);
      loadData();
    } catch (e) {
      toast.error('Lỗi khi sao chép lịch: ' + (e.message || e));
    }
  };

  const handleCopyStaff = async () => {
    if (!srcStaffId || !destStaffId) return toast.error('Vui lòng chọn đầy đủ nhân sự nguồn và nhân sự đích');
    if (srcStaffId === destStaffId) return toast.error('Nhân sự nguồn và đích không được trùng nhau');

    try {
      // Get all current week's schedules for source staff
      const srcScheds = schedules.filter(s => s.staff_id === srcStaffId);
      
      // Delete existing dest staff schedules for this week
      const destExisting = schedules.filter(s => s.staff_id === destStaffId);
      for (const old of destExisting) {
        await base44.entities.StaffSchedule.delete(old.id);
      }

      // Create new schedules
      for (const s of srcScheds) {
        await base44.entities.StaffSchedule.create({
          staff_id: destStaffId,
          date: s.date,
          shift_template_id: s.shift_template_id || '',
          is_off: s.is_off,
          off_type: s.off_type || ''
        });
      }

      toast.success('Đã sao chép ca xếp thành công');
      setCopyStaffModal(false);
      setSrcStaffId('');
      setDestStaffId('');
      loadData();
    } catch (e) {
      toast.error('Lỗi sao chép: ' + (e.message || e));
    }
  };

  const handleCopyDay = async () => {
    if (!srcDay || !destDay) return toast.error('Vui lòng chọn ngày nguồn và ngày đích');
    if (srcDay === destDay) return toast.error('Ngày nguồn và ngày đích không được trùng nhau');

    try {
      // Get source schedules
      const srcScheds = schedules.filter(s => s.date === srcDay);

      // Delete target date existing schedules
      const targetExisting = await base44.entities.StaffSchedule.filter({ date: destDay });
      for (const old of targetExisting) {
        await base44.entities.StaffSchedule.delete(old.id);
      }

      // Create copy
      for (const s of srcScheds) {
        await base44.entities.StaffSchedule.create({
          staff_id: s.staff_id,
          date: destDay,
          shift_template_id: s.shift_template_id || '',
          is_off: s.is_off,
          off_type: s.off_type || ''
        });
      }

      toast.success('Đã sao chép ca ngày thành công');
      setCopyDayModal(false);
      setSrcDay('');
      setDestDay('');
      loadData();
    } catch (e) {
      toast.error('Lỗi sao chép ngày: ' + (e.message || e));
    }
  };

  const handleSwapShifts = async () => {
    if (!swapStaffA || !swapStaffB || !swapDay) return toast.error('Vui lòng chọn đầy đủ nhân sự và ngày đổi ca');
    if (swapStaffA === swapStaffB) return toast.error('Vui lòng chọn 2 nhân sự khác nhau');

    try {
      const schedA = getCellSchedule(swapStaffA, swapDay);
      const schedB = getCellSchedule(swapStaffB, swapDay);

      // Store temp values
      const valA = schedA ? {
        shift_template_id: schedA.shift_template_id || '',
        is_off: schedA.is_off,
        off_type: schedA.off_type || ''
      } : null;

      const valB = schedB ? {
        shift_template_id: schedB.shift_template_id || '',
        is_off: schedB.is_off,
        off_type: schedB.off_type || ''
      } : null;

      // Delete old
      if (schedA) await base44.entities.StaffSchedule.delete(schedA.id);
      if (schedB) await base44.entities.StaffSchedule.delete(schedB.id);

      // Create swapped
      if (valB) {
        await base44.entities.StaffSchedule.create({
          staff_id: swapStaffA,
          date: swapDay,
          ...valB
        });
      }
      if (valA) {
        await base44.entities.StaffSchedule.create({
          staff_id: swapStaffB,
          date: swapDay,
          ...valA
        });
      }

      toast.success('Đã hoán đổi ca làm việc thành công');
      setSwapModal(false);
      setSwapStaffA('');
      setSwapStaffB('');
      setSwapDay('');
      loadData();
    } catch (e) {
      toast.error('Lỗi hoán đổi ca: ' + (e.message || e));
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={() => changeWeek(-1)} className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-purple-500" />
            <span>Tuần: {weekDays[0].split('-').reverse().slice(0, 2).join('/')} - {weekDays[6].split('-').reverse().slice(0, 2).join('/')}</span>
          </div>
          <button onClick={() => changeWeek(1)} className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleCopyWeek} 
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-600 font-semibold text-xs hover:bg-purple-100 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" /> Sao chép tuần sau
          </button>
          <button 
            onClick={() => { setSrcStaffId(''); setDestStaffId(''); setCopyStaffModal(true); }} 
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 font-semibold text-xs hover:bg-blue-100 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" /> Sao chép nhân sự
          </button>
          <button 
            onClick={() => { setSrcDay(''); setDestDay(''); setCopyDayModal(true); }} 
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 font-semibold text-xs hover:bg-emerald-100 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" /> Sao chép ca ngày
          </button>
          <button 
            onClick={() => { setSwapStaffA(''); setSwapStaffB(''); setSwapDay(''); setSwapModal(true); }} 
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-50 text-orange-600 font-semibold text-xs hover:bg-orange-100 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Đổi ca nhân sự
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100"><div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto" /></div>
      ) : staff.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 text-slate-400 text-sm">Chưa có nhân viên nào hoạt động tại chi nhánh này</div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left py-4 px-4 text-xs font-bold text-slate-500 min-w-[200px] sticky left-0 bg-slate-50 z-10 border-r border-slate-100">Nhân sự</th>
                  {weekDays.map(d => (
                    <th key={d} className="text-center py-4 px-3 text-xs font-bold text-slate-600 min-w-[120px]">{formatDateHeader(d)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staff.map(s => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    {/* Column 1: Staff Profile */}
                    <td className="py-3 px-4 font-semibold text-sm text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-100">
                      <div className="flex items-center gap-3">
                        <Avatar src={s.avatar_url} name={s.full_name} size={32} color={s.avatar_color} />
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-xs text-slate-800">{s.full_name}</div>
                          <span 
                            className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5"
                            style={{ background: (ROLES[s.role]?.color || '#94A3B8') + '15', color: ROLES[s.role]?.color || '#94A3B8' }}
                          >
                            {ROLES[s.role]?.label || s.role}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Columns 2-8: Days of the week */}
                    {weekDays.map(date => {
                      const cellSchedules = getCellSchedules(s.id, date);
                      
                      return (
                        <td key={date} className="p-2 text-center relative">
                          {cellSchedules.length > 0 ? (
                            <button
                              onClick={() => openAssignModal(s, date)}
                              className="w-full p-1.5 rounded-xl border border-slate-150/70 text-xs text-left transition-all flex flex-col gap-1 min-h-[64px] bg-slate-50/50 hover:bg-slate-50 hover:shadow-xs"
                            >
                              {cellSchedules.map(sched => {
                                if (sched.is_off) {
                                  const typeLabel = sched.off_type === 'vacation' ? 'Phép' : sched.off_type === 'sick' ? 'Ốm' : 'Nghỉ';
                                  return (
                                    <div 
                                      key={sched.id}
                                      className="w-full py-1.5 px-2 rounded-lg border text-left border-l-4"
                                      style={{
                                        backgroundColor: '#FEF2F2',
                                        borderColor: '#FEE2E2',
                                        borderLeftColor: '#EF4444',
                                        color: '#991B1B'
                                      }}
                                    >
                                      <span className="font-bold text-[10px] block leading-tight">Nghỉ ({typeLabel})</span>
                                      <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">💡 Vắng mặt</span>
                                    </div>
                                  );
                                }
                                
                                const matched = templates.find(t => t.id === sched.shift_template_id);
                                const shiftName = matched ? matched.name : 'Ca làm';
                                const shiftTime = matched ? `${matched.start_time}-${matched.end_time}` : '';
                                const c = (matched && matched.color) ? matched.color : '#B088F9';
                                
                                return (
                                  <div 
                                    key={sched.id}
                                    className="w-full py-1.5 px-2 rounded-lg border text-left border-l-4"
                                    style={{
                                      backgroundColor: c + '12',
                                      borderColor: c + '25',
                                      borderLeftColor: c,
                                      color: c
                                    }}
                                  >
                                    <span className="font-bold text-[10px] block leading-tight truncate">{shiftName}</span>
                                    {shiftTime && (
                                      <span className="text-[9px] text-slate-550 font-semibold block mt-0.5">⏰ {shiftTime}</span>
                                    )}
                                  </div>
                                );
                              })}
                            </button>
                          ) : (
                            <button
                              onClick={() => openAssignModal(s, date)}
                              className="w-full py-3.5 px-2.5 rounded-xl border border-dashed border-slate-200 text-slate-300 hover:text-slate-650 hover:border-solid hover:border-purple-300 transition-all flex flex-col items-center justify-center min-h-[64px]"
                            >
                              <Plus className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Copy Staff Modal */}
      {copyStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setCopyStaffModal(false)}>
          <div className="relative bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-slate-800">Sao chép lịch nhân sự</h3>
              <button onClick={() => setCopyStaffModal(false)} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><X className="w-4.5 h-4.5 text-slate-500" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Nhân sự nguồn (Sao chép từ)</label>
                <select value={srcStaffId} onChange={(e) => setSrcStaffId(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs">
                  <option value="">— Chọn nhân sự nguồn —</option>
                  {staff.map(x => <option key={x.id} value={x.id}>{x.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Nhân sự đích (Dán lịch đến)</label>
                <select value={destStaffId} onChange={(e) => setDestStaffId(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs">
                  <option value="">— Chọn nhân sự đích —</option>
                  {staff.map(x => <option key={x.id} value={x.id}>{x.full_name}</option>)}
                </select>
              </div>
            </div>
            <button onClick={handleCopyStaff} className="w-full py-2.5 bg-purple-500 text-white rounded-xl text-xs font-semibold mt-4 hover:bg-purple-600 transition-colors">Bắt đầu sao chép</button>
          </div>
        </div>
      )}

      {/* Copy Day Modal */}
      {copyDayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setCopyDayModal(false)}>
          <div className="relative bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-slate-800">Sao chép ca ngày</h3>
              <button onClick={() => setCopyDayModal(false)} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><X className="w-4.5 h-4.5 text-slate-500" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Ngày nguồn (Sao chép từ)</label>
                <select value={srcDay} onChange={(e) => setSrcDay(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs">
                  <option value="">— Chọn ngày nguồn —</option>
                  {weekDays.map(d => <option key={d} value={d}>{formatDateHeader(d)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Ngày đích (Dán lịch đến)</label>
                <select value={destDay} onChange={(e) => setDestDay(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs">
                  <option value="">— Chọn ngày đích —</option>
                  {weekDays.map(d => <option key={d} value={d}>{formatDateHeader(d)}</option>)}
                </select>
              </div>
            </div>
            <button onClick={handleCopyDay} className="w-full py-2.5 bg-purple-500 text-white rounded-xl text-xs font-semibold mt-4 hover:bg-purple-600 transition-colors">Bắt đầu sao chép</button>
          </div>
        </div>
      )}

      {/* Swap Shifts Modal */}
      {swapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setSwapModal(false)}>
          <div className="relative bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-slate-800">Đổi ca nhân sự</h3>
              <button onClick={() => setSwapModal(false)} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><X className="w-4.5 h-4.5 text-slate-500" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Chọn ngày đổi ca</label>
                <select value={swapDay} onChange={(e) => setSwapDay(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs">
                  <option value="">— Chọn ngày đổi ca —</option>
                  {weekDays.map(d => <option key={d} value={d}>{formatDateHeader(d)}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Nhân sự A</label>
                  <select value={swapStaffA} onChange={(e) => setSwapStaffA(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs">
                    <option value="">— Chọn nhân sự A —</option>
                    {staff.map(x => <option key={x.id} value={x.id}>{x.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Nhân sự B</label>
                  <select value={swapStaffB} onChange={(e) => setSwapStaffB(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs">
                    <option value="">— Chọn nhân sự B —</option>
                    {staff.map(x => <option key={x.id} value={x.id}>{x.full_name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <button onClick={handleSwapShifts} className="w-full py-2.5 bg-purple-500 text-white rounded-xl text-xs font-semibold mt-4 hover:bg-purple-600 transition-colors">Xác nhận đổi ca</button>
          </div>
        </div>
      )}

      {/* Assign Shift Modal (Multiple Shifts per day) */}
      {assignModalCell && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={() => setAssignModalCell(null)}>
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs" />
          <div className="relative bg-white w-full md:max-w-md rounded-3xl p-6 shadow-2xl relative text-left flex flex-col max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-800 font-sans">Xếp lịch làm việc</h2>
                <p className="text-slate-400 text-[10px] mt-0.5 font-medium font-sans">
                  Nhân viên: <span className="text-slate-600 font-bold">{assignModalCell.staff.full_name}</span> - {formatVietnameseDate(assignModalCell.date)}
                </p>
              </div>
              <button onClick={() => setAssignModalCell(null)} className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 pb-4">
              {/* Shift Selection List Table */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white font-sans text-xs">
                {/* Table Header */}
                <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-100 py-3 px-4 text-slate-500 font-bold text-[11px]">
                  <div>Ca làm việc</div>
                  <div className="text-center">Thời gian làm việc</div>
                  <div className="text-right">Thêm</div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-slate-100">
                  {templates.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 font-medium">Chưa định nghĩa ca làm việc nào. Hãy định nghĩa ca trước.</div>
                  ) : (
                    templates.map(t => (
                      <div key={t.id} className="grid grid-cols-3 items-center py-3.5 px-4">
                        {/* Ca làm việc */}
                        <div className="flex items-center gap-2.5">
                          <div className="w-5 h-5 rounded-lg border border-slate-100 shrink-0" style={{ background: t.color || '#B088F9' }} />
                          <span className="text-slate-700 text-xs font-normal">{t.name}</span>
                        </div>
                        
                        {/* Thời gian làm việc */}
                        <div className="text-center text-slate-550 text-xs font-normal">
                          {t.start_time} - {t.end_time}
                        </div>

                        {/* Toggle Switch */}
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              if (isOff) setIsOff(false);
                              setSelectedShiftIds(prev => 
                                prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id]
                              );
                            }}
                            className={`w-11 h-6 rounded-full transition-colors relative outline-none shrink-0 ${
                              selectedShiftIds.includes(t.id) && !isOff ? 'bg-blue-600' : 'bg-slate-200'
                            }`}
                          >
                            <div 
                              className="w-5 h-5 rounded-full bg-white absolute top-0.5 left-0.5 transition-transform shadow-sm"
                              style={{ transform: selectedShiftIds.includes(t.id) && !isOff ? 'translateX(20px)' : 'translateX(0px)' }}
                            />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Day off registration */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-3 font-sans text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                      <span className="text-red-600 font-bold text-[10px]">✕</span>
                    </div>
                    <span className="font-bold text-slate-800 text-xs">Đăng ký nghỉ ngày này</span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setIsOff(!isOff);
                      if (!isOff) setSelectedShiftIds([]);
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative outline-none shrink-0 ${
                      isOff ? 'bg-red-500' : 'bg-slate-200'
                    }`}
                  >
                    <div 
                      className="w-5 h-5 rounded-full bg-white absolute top-0.5 left-0.5 transition-transform shadow-sm"
                      style={{ transform: isOff ? 'translateX(20px)' : 'translateX(0px)' }}
                    />
                  </button>
                </div>

                {isOff && (
                  <div className="flex gap-4 pl-7.5 items-center">
                    <span className="font-bold text-slate-500 text-[11px]">Lý do nghỉ:</span>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-1.5 font-semibold text-xs text-slate-700 cursor-pointer">
                        <input 
                          type="radio" 
                          name="offType" 
                          checked={offType === 'vacation'} 
                          onChange={() => setOffType('vacation')}
                          className="text-red-500 focus:ring-red-400"
                        />
                        <span>Nghỉ phép</span>
                      </label>
                      <label className="flex items-center gap-1.5 font-semibold text-xs text-slate-700 cursor-pointer">
                        <input 
                          type="radio" 
                          name="offType" 
                          checked={offType === 'sick'} 
                          onChange={() => setOffType('sick')}
                          className="text-red-500 focus:ring-red-400"
                        />
                        <span>Nghỉ ốm</span>
                      </label>
                      <label className="flex items-center gap-1.5 font-semibold text-xs text-slate-700 cursor-pointer">
                        <input 
                          type="radio" 
                          name="offType" 
                          checked={offType === 'other'} 
                          onChange={() => setOffType('other')}
                          className="text-red-500 focus:ring-red-400"
                        />
                        <span>Khác</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 pt-4 border-t border-slate-150/50 mt-4 shrink-0">
              <button 
                onClick={() => setAssignModalCell(null)} 
                className="flex-1 py-2.5 rounded-xl bg-slate-200/50 hover:bg-slate-250 transition-colors font-bold text-xs text-slate-600 font-sans"
              >
                Hủy
              </button>
              <button 
                onClick={() => handleAssignShifts(assignModalCell.staff.id, assignModalCell.date, selectedShiftIds, isOff, offType)} 
                className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-sm hover:opacity-95 transition-all font-sans"
              >
                Lưu
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
