'use client';
import { useT } from '@/lib/i18n';
import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Copy, RefreshCw, AlertCircle, Plus, X, Trash2, CalendarDays, ChevronDown, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/Layout';
import Avatar from '@/components/Avatar';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";




// Helper to perform API operations in small batches to avoid 429 Rate Limits
const batchPromises = async (items, fn, batchSize = 3) => {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  return results;
};
const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  const parts = String(dateStr).split('-').map(Number);
  if (parts.length < 3) return new Date();
  return new Date(parts[0], parts[1] - 1, parts[2]);
};

const formatLocalDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Helper to get Mon-Sun dates for a week (Timezone safe)
const getWeekDays = (baseDateStr) => {
  const current = parseLocalDate(baseDateStr);
  const day = current.getDay();
  // Get Monday
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(current.getFullYear(), current.getMonth(), diff);
  
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const target = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    dates.push(formatLocalDateStr(target));
  }
  return dates;
};

const formatVietnameseDate = (dateStr, t) => {
  const d = parseLocalDate(dateStr);
  const days = [
    t('common.sunday', 'Chủ nhật'), 
    t('common.monday', 'Thứ 2'), 
    t('common.tuesday', 'Thứ 3'), 
    t('common.wednesday', 'Thứ 4'), 
    t('common.thursday', 'Thứ 5'), 
    t('common.friday', 'Thứ 6'), 
    t('common.saturday', 'Thứ 7')
  ];
  const dayLabel = days[d.getDay()];
  const dateNum = d.getDate().toString().padStart(2, '0');
  const monthNum = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return t('common.full_date', '{day} ngày {dd} tháng {mm} năm {yyyy}')
    .replace('{day}', dayLabel)
    .replace('{dd}', dateNum)
    .replace('{mm}', monthNum)
    .replace('{yyyy}', year);
};

const formatDateHeader = (dateStr, t) => {
  const d = parseLocalDate(dateStr);
  const days = [
    t('common.sun', 'CN'), 
    t('common.mon', 'T2'), 
    t('common.tue', 'T3'), 
    t('common.wed', 'T4'), 
    t('common.thu', 'T5'), 
    t('common.fri', 'T6'), 
    t('common.sat', 'T7')
  ];
  const dayLabel = days[d.getDay()];
  const dateNum = d.getDate().toString().padStart(2, '0');
  const monthNum = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${dayLabel} ${dateNum}/${monthNum}`;
};

export default function SchedulerGrid({ branchId }) {
  const { t } = useT();
  const ROLES = {
    manager: { label: t('staff.roles.manager', 'Quản lý'), color: '#FF6B9D' },
    receptionist: { label: t('staff.roles.receptionist', 'Lễ tân'), color: '#60A5FA' },
    stylist: { label: t('staff.roles.stylist', 'Kỹ thuật viên tóc'), color: '#A78BFA' },
    barber: { label: t('staff.roles.barber', 'Barber'), color: '#34D399' },
    therapist: { label: t('staff.roles.therapist', 'Chuyên viên Spa'), color: '#FBBF24' },
    nail_tech: { label: t('staff.roles.nail_tech', 'Nail tech'), color: '#F472B6' },
    technician: { label: t('staff.roles.technician', 'Kỹ thuật viên'), color: '#F97316' },
    cashier: { label: t('staff.roles.cashier', 'Thu ngân'), color: '#94A3B8' },
  };
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
  const [destStaffIds, setDestStaffIds] = useState([]);

  const [copyDayModal, setCopyDayModal] = useState(false);
  const [srcDay, setSrcDay] = useState('');
  const [destDays, setDestDays] = useState([]);

  const [swapModal, setSwapModal] = useState(false);
  const [swapStaffA, setSwapStaffA] = useState('');
  const [swapStaffB, setSwapStaffB] = useState('');
  const [swapDay, setSwapDay] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState('Đang xử lý...');
  const [autoCopyEnabled, setAutoCopyEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('glopro_auto_copy_schedule');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  const handleToggleAutoCopy = (e) => {
    const val = e.target.checked;
    setAutoCopyEnabled(val);
    if (typeof window !== 'undefined') {
      /* localStorage.setItem('glopro_auto_copy_schedule') removed */
    }
    toast.success(val ? t('staff.scheduler.msg_auto_copy_on', 'Đã BẬT tự động sao chép lịch tuần mới') : t('staff.scheduler.msg_auto_copy_off', 'Đã TẮT tự động sao chép lịch tuần mới'));
  };

  const weekDays = getWeekDays(baseDate);

  const loadData = async () => {
    setLoading(true);
    const filter = branchId === 'all' ? {} : { branch_id: branchId };
    
    try {
      const [stListRaw, tmplListRaw, allScheds] = await Promise.all([
        base44.entities.Staff.filter(filter).catch(() => []),
        base44.entities.ShiftTemplate.list().catch(() => []),
        base44.entities.StaffSchedule.list().catch(() => [])
      ]);

      let stList = stListRaw;
      const localStaff = localStorage.getItem('glopro_staff');
      if (stList.length === 0 && localStaff) {
        const parsed = JSON.parse(localStaff);
        const idMap = {};
        for (const st of parsed) {
          const { id, ...data } = st;
          const created = await base44.entities.Staff.create(data);
          if (created && created.id) {
            idMap[id] = created.id;
          }
        }
        /* localStorage.setItem('glopro_staff_id_map') removed */
        stList = await base44.entities.Staff.filter(filter);
      }

      let tmplList = tmplListRaw;
      const localTemplates = localStorage.getItem('glopro_shift_templates');
      if (tmplList.length === 0 && localTemplates) {
        const parsed = JSON.parse(localTemplates);
        const idMap = {};
        for (const t of parsed) {
          const { id, ...data } = t;
          const created = await base44.entities.ShiftTemplate.create(data);
          if (created && created.id) {
            idMap[id] = created.id;
          }
        }
        /* localStorage.setItem('glopro_tmpl_id_map') removed */
        tmplList = await base44.entities.ShiftTemplate.list();
      }

      let schedList = allScheds.filter(s => weekDays.includes(s.date));

      // AUTO-COPY FEATURE: Only run if autoCopyEnabled is true
      if (autoCopyEnabled && schedList.length === 0 && allScheds.length > 0) {
        const minCurrentDate = weekDays[0];
        // Find prior schedules (dates earlier than current week's Monday)
        const priorScheds = allScheds.filter(s => s.date < minCurrentDate);
        if (priorScheds.length > 0) {
          // Find the most recent date in prior schedules
          const maxPriorDate = priorScheds.reduce((max, s) => s.date > max ? s.date : max, priorScheds[0].date);
          const sourceWeekDays = getWeekDays(maxPriorDate);
          const sourceScheds = priorScheds.filter(s => sourceWeekDays.includes(s.date));

          if (sourceScheds.length > 0) {
            // Build create payloads mapping each day index (0-6) from source week to current week
            const createPayloads = sourceScheds.map(s => {
              const dayIdx = sourceWeekDays.indexOf(s.date);
              if (dayIdx !== -1) {
                return {
                  staff_id: s.staff_id,
                  date: weekDays[dayIdx],
                  shift_template_id: s.shift_template_id || '',
                  is_off: s.is_off,
                  off_type: s.off_type || ''
                };
              }
              return null;
            }).filter(Boolean);

            if (createPayloads.length > 0) {
              await batchPromises(createPayloads, data => base44.entities.StaffSchedule.create(data), 3);
              toast.success(t('staff.scheduler.msg_auto_copy_success', 'Đã tự động sao chép {n} ca xếp từ tuần trước sang tuần này').replace('{n}', createPayloads.length));
              // Re-fetch fresh schedules list
              const freshAll = await base44.entities.StaffSchedule.list().catch(() => []);
              schedList = freshAll.filter(s => weekDays.includes(s.date));
            }
          }
        }
      }

      setStaff(stList.filter(x => x.is_active !== false));
      setTemplates(tmplList);
      setSchedules(schedList);
    } catch (e) {
      console.error('Lỗi khi tải dữ liệu xếp lịch:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [baseDate, branchId]);

  const changeWeek = (direction) => {
    const d = parseLocalDate(baseDate);
    d.setDate(d.getDate() + (direction * 7));
    setBaseDate(formatLocalDateStr(d));
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
          try {
            await base44.entities.StaffSchedule.delete(old.id);
          } catch (err) {
            console.warn(`Failed to delete schedule ${old.id}, might already be deleted:`, err);
          }
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
      /* localStorage.setItem('glopro_staff_schedules') removed */
      setAssignModalCell(null);
      loadData();
      toast.success('Đã lưu ca làm việc (offline)');
    }
  };

  // --- Copy operations ---

  const handleCopyWeek = async () => {
    if (!window.confirm(t('staff.scheduler.msg_copy_week_confirm', 'Sao chép toàn bộ lịch xếp ca của tuần hiện tại sang tuần tiếp theo?'))) return;
    
    // Calculate next week days
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 7);
    const nextWeekDays = getWeekDays(d.toISOString().slice(0, 10));

    setIsProcessing(true);
    setProcessingMsg(t('staff.scheduler.msg_copy_week_processing', 'Đang sao chép lịch sang tuần tiếp theo...'));
    try {
      // Clear existing schedules in the target week in parallel
      const allScheds = await base44.entities.StaffSchedule.list();
      const targetExisting = allScheds.filter(s => nextWeekDays.includes(s.date));
      await batchPromises(targetExisting, async (old) => {
        try {
          await base44.entities.StaffSchedule.delete(old.id);
        } catch (e) {
          console.warn("Delete failed:", old.id, e);
        }
      }, 3);

      // Copy each schedule in parallel
      const createPayloads = [];
      for (const s of schedules) {
        const curIdx = weekDays.indexOf(s.date);
        if (curIdx !== -1) {
          const targetDate = nextWeekDays[curIdx];
          createPayloads.push({
            staff_id: s.staff_id,
            date: targetDate,
            shift_template_id: s.shift_template_id || '',
            is_off: s.is_off,
            off_type: s.off_type || ''
          });
        }
      }
      await batchPromises(createPayloads, data => base44.entities.StaffSchedule.create(data), 3);
      
      toast.success(t('staff.scheduler.msg_copy_week_success', 'Đã sao chép thành công {n} ca xếp sang tuần tiếp theo').replace('{n}', createPayloads.length));
      await loadData();
    } catch (e) {
      toast.error(t('staff.scheduler.msg_copy_err', 'Lỗi khi sao chép lịch: ') + (e.message || e));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyStaff = async () => {
    if (!srcStaffId || destStaffIds.length === 0) return toast.error(t('staff.scheduler.error_select_src_dest', 'Vui lòng chọn nhân sự nguồn và ít nhất một nhân sự đích'));

    setIsProcessing(true);
    setProcessingMsg(t('staff.scheduler.msg_copy_staff_processing', 'Đang sao chép lịch nhân sự...'));
    try {
      // Get all current week's schedules for source staff
      const srcScheds = schedules.filter(s => s.staff_id === srcStaffId);
      
      // Perform copies in parallel for target staff members
      await Promise.all(destStaffIds.map(async (destStaffId) => {
        // Delete existing dest staff schedules for this week
        const destExisting = schedules.filter(s => s.staff_id === destStaffId);
        await batchPromises(destExisting, async (old) => {
          try {
            await base44.entities.StaffSchedule.delete(old.id);
          } catch (e) {
            console.warn("Delete failed:", old.id, e);
          }
        }, 3);

        // Create new schedules in parallel
        const createPayloads = srcScheds.map(s => ({
          staff_id: destStaffId,
          date: s.date,
          shift_template_id: s.shift_template_id || '',
          is_off: s.is_off,
          off_type: s.off_type || ''
        }));
        await batchPromises(createPayloads, data => base44.entities.StaffSchedule.create(data), 3);
      }));

      toast.success(t('staff.scheduler.msg_copy_staff_success', 'Đã sao chép lịch làm việc thành công'));
      setCopyStaffModal(false);
      setSrcStaffId('');
      setDestStaffIds([]);
      await loadData();
    } catch (e) {
      toast.error(t('staff.scheduler.msg_copy_err', 'Lỗi sao chép: ') + (e.message || e));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyDay = async () => {
    if (!srcDay || destDays.length === 0) return toast.error('Vui lòng chọn ngày nguồn và ít nhất một ngày đích');

    const srcScheds = schedules.filter(s => s.date === srcDay);
    if (srcScheds.length === 0) {
      return toast.error(t('staff.scheduler.msg_copy_day_empty', 'Ngày nguồn ({date}) chưa có lịch làm việc nào để sao chép').replace('{date}', formatDateHeader(srcDay, t)));
    }

    setIsProcessing(true);
    setProcessingMsg(t('staff.scheduler.msg_copy_day_processing', 'Đang sao chép ca ngày...'));
    try {
      const allScheds = await base44.entities.StaffSchedule.list();
      // Filter by branch to avoid cross-branch deletions
      const branchFilter = branchId === 'all' ? allScheds : allScheds.filter(s => {
        // Match by staff branch — only delete schedules belonging to our staff
        const staffIds = srcScheds.map(x => x.staff_id);
        return staffIds.includes(s.staff_id);
      });
      
      // Perform copies in parallel for target days
      await Promise.all(destDays.map(async (destDay) => {
        // Delete target date existing schedules (only for same staff)
        const targetExisting = branchFilter.filter(s => s.date === destDay);
        await batchPromises(targetExisting, async (old) => {
          try {
            await base44.entities.StaffSchedule.delete(old.id);
          } catch (e) {
            console.warn("Delete failed:", old.id, e);
          }
        }, 3);

        // Create copy in parallel
        const createPayloads = srcScheds.map(s => ({
          staff_id: s.staff_id,
          date: destDay,
          shift_template_id: s.shift_template_id || '',
          is_off: s.is_off,
          off_type: s.off_type || ''
        }));
        await batchPromises(createPayloads, data => base44.entities.StaffSchedule.create(data), 3);
      }));

      toast.success(t('staff.scheduler.msg_copy_day_success', 'Đã sao chép {n1} ca từ {d1} sang {n2} ngày').replace('{n1}', srcScheds.length).replace('{d1}', formatDateHeader(srcDay, t)).replace('{n2}', destDays.length));
      setCopyDayModal(false);
      setSrcDay('');
      setDestDays([]);
      await loadData();
    } catch (e) {
      toast.error(t('staff.scheduler.msg_copy_err', 'Lỗi sao chép ngày: ') + (e.message || e));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSwapShifts = async () => {
    if (!swapStaffA || !swapStaffB || !swapDay) return toast.error('Vui lòng chọn đầy đủ nhân sự và ngày đổi ca');
    if (swapStaffA === swapStaffB) return toast.error('Vui lòng chọn 2 nhân sự khác nhau');

    setIsProcessing(true);
    setProcessingMsg('Đang đổi ca nhân sự...');
    try {
      const schedsA = getCellSchedules(swapStaffA, swapDay);
      const schedsB = getCellSchedules(swapStaffB, swapDay);

      // Delete old schedules
      for (const oldA of schedsA) {
        if (!oldA.id.toString().startsWith('local_')) {
          await base44.entities.StaffSchedule.delete(oldA.id).catch(() => {});
        }
      }
      for (const oldB of schedsB) {
        if (!oldB.id.toString().startsWith('local_')) {
          await base44.entities.StaffSchedule.delete(oldB.id).catch(() => {});
        }
      }

      // Create swapped schedules for staff A (give A what B had)
      for (const b of schedsB) {
        await base44.entities.StaffSchedule.create({
          staff_id: swapStaffA,
          date: swapDay,
          shift_template_id: b.shift_template_id || '',
          is_off: b.is_off,
          off_type: b.off_type || ''
        });
      }

      // Create swapped schedules for staff B (give B what A had)
      for (const a of schedsA) {
        await base44.entities.StaffSchedule.create({
          staff_id: swapStaffB,
          date: swapDay,
          shift_template_id: a.shift_template_id || '',
          is_off: a.is_off,
          off_type: a.off_type || ''
        });
      }

      toast.success('Đã hoán đổi ca làm việc thành công');
      setSwapModal(false);
      setSwapStaffA('');
      setSwapStaffB('');
      setSwapDay('');
      await loadData();
    } catch (e) {
      toast.error('Lỗi hoán đổi ca: ' + (e.message || e));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearAllSchedules = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa TOÀN BỘ lịch xếp ca của TUẦN HÀNG ĐANG XEM?')) return;
    
    setIsProcessing(true);
    setProcessingMsg('Đang xóa lịch của tuần hiện tại...');
    try {
      const allSchedules = await base44.entities.StaffSchedule.list();
      // Filter schedules to only target days in current week
      const currentWeekSchedules = allSchedules.filter(s => weekDays.includes(s.date));
      
      await batchPromises(currentWeekSchedules, async (s) => {
        try {
          await base44.entities.StaffSchedule.delete(s.id);
        } catch (e) {
          console.warn("Delete failed:", s.id, e);
        }
      }, 3);
      
      // Update local storage fallback if any
      const local = localStorage.getItem('glopro_staff_schedules');
      if (local) {
        const parsed = JSON.parse(local);
        const filtered = parsed.filter(s => !weekDays.includes(s.date));
        /* localStorage.setItem('glopro_staff_schedules') removed */
      }
      
      toast.success(`Đã xóa sạch ${currentWeekSchedules.length} ca làm việc của tuần hiện tại`);
      await loadData();
    } catch (e) {
      toast.error('Lỗi khi xóa lịch: ' + (e.message || e));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-3xl border border-slate-100 shadow-sm overflow-x-auto whitespace-nowrap scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto">
            <button onClick={() => changeWeek(-1)} className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 shrink-0" title="Tuần trước">
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-xs font-semibold text-slate-700 shrink-0 transition-colors shadow-none"
                >
                  <CalendarDays className="shrink-0 w-3.5 h-3.5 text-orange-500" />
                  <span className="truncate">{t('staff.scheduler.week', 'Tuần:')} {weekDays[0].split('-').reverse().slice(0, 2).join('/')} - {weekDays[6].split('-').reverse().slice(0, 2).join('/')}</span>
                  <ChevronDown className="shrink-0 w-3 h-3 text-slate-400 ml-auto sm:ml-0" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border-slate-200" align="start">
                <Calendar
                  mode="single"
                  selected={parseLocalDate(baseDate)}
                  onSelect={(date) => {
                    if (date) {
                      setBaseDate(formatLocalDateStr(date));
                      setActiveCell(null);
                    }
                  }}
                  modifiers={{
                    // Highlight all days in the currently selected week
                    selectedWeek: (date) => {
                      const selectedMon = new Date(baseDate);
                      const day = selectedMon.getDay();
                      const diff = selectedMon.getDate() - day + (day === 0 ? -6 : 1);
                      const mon = new Date(selectedMon.setDate(diff));
                      mon.setHours(0,0,0,0);

                      const sun = new Date(mon);
                      sun.setDate(mon.getDate() + 6);
                      sun.setHours(23,59,59,999);

                      return date >= mon && date <= sun;
                    }
                  }}
                  modifiersClassNames={{
                    selectedWeek: "bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-none first:rounded-l-md last:rounded-r-md font-semibold"
                  }}
                  className="p-3"
                />
              </PopoverContent>
            </Popover>

            <button onClick={() => changeWeek(1)} className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 shrink-0" title="Tuần sau">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50/70 border border-orange-100 cursor-pointer select-none shrink-0">
            <input 
              type="checkbox" 
              checked={autoCopyEnabled} 
              onChange={handleToggleAutoCopy}
              className="w-3.5 h-3.5 text-orange-600 rounded border-orange-300 focus:ring-0 cursor-pointer"
            />
            <span className="text-xs font-bold text-orange-700">{t('staff.scheduler.auto_schedule', 'Tự động lập lịch')}</span>
          </label>
          <button 
            disabled={isProcessing}
            onClick={handleCopyWeek} 
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-50 text-orange-600 font-semibold text-xs hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Copy className="w-3.5 h-3.5" /> {t('staff.scheduler.copy_next_week', 'Sao chép tuần sau')}
          </button>
          <button 
            disabled={isProcessing}
            onClick={() => { setSrcStaffId(''); setDestStaffIds([]); setCopyStaffModal(true); }} 
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 font-semibold text-xs hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Copy className="w-3.5 h-3.5" /> {t('staff.scheduler.copy_staff', 'Sao chép nhân sự')}
          </button>
          <button 
            disabled={isProcessing}
            onClick={() => { setSrcDay(''); setDestDays([]); setCopyDayModal(true); }} 
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 font-semibold text-xs hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Copy className="w-3.5 h-3.5" /> {t('staff.scheduler.copy_day', 'Sao chép ca ngày')}
          </button>
          <button 
            disabled={isProcessing}
            onClick={() => { setSwapStaffA(''); setSwapStaffB(''); setSwapDay(''); setSwapModal(true); }} 
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-50 text-orange-600 font-semibold text-xs hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" /> {t('staff.scheduler.swap_staff', 'Đổi ca nhân sự')}
          </button>
          <button 
            disabled={isProcessing}
            onClick={handleClearAllSchedules} 
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 font-semibold text-xs hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" /> {t('staff.scheduler.clear_week', 'Xóa lịch tuần này')}
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
                  <th className="p-0 sm:py-4 sm:px-4 text-left text-xs font-bold text-slate-500 sm:min-w-[200px] sticky left-0 bg-slate-50 z-10 border-r border-slate-100 align-middle">
                    {/* Mobile Header Layout */}
                    <div className="sm:hidden w-24 py-2 px-1 flex flex-col items-center justify-center gap-1 mx-auto text-center">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span className="uppercase text-[10px]">{t('staff.scheduler.staff_column', 'Nhân sự')}</span>
                    </div>
                    {/* Desktop Header Content (Original) */}
                    <span className="hidden sm:inline">
                      {t('staff.scheduler.staff_column', 'Nhân sự')}
                    </span>
                  </th>
                  {weekDays.map(d => (
                    <th key={d} className="text-center py-4 px-3 text-xs font-bold text-slate-600 min-w-[120px]">{formatDateHeader(d, t)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staff.map(s => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    {/* Column 1: Staff Profile */}
                    <td className="p-0 sm:py-3 sm:px-4 font-semibold text-sm text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-100 align-top sm:align-middle">
                      {/* Mobile Layout (Strictly w-24 = 96px) */}
                      <div className="sm:hidden w-24 py-2 px-1 flex flex-col items-center gap-1 mx-auto overflow-hidden">
                        <div className="shrink-0 flex items-center justify-center">
                          <Avatar src={s.avatar_url} name={s.full_name} size={32} color={s.avatar_color} />
                        </div>
                        <div className="min-w-0 flex flex-col items-center w-full">
                          <div className="truncate font-semibold text-[10px] text-slate-800 w-full text-center mb-0.5">{s.full_name}</div>
                          <span 
                            className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold max-w-full"
                            style={{ background: (ROLES[s.role]?.color || '#94A3B8') + '15', color: ROLES[s.role]?.color || '#94A3B8' }}
                          >
                            <span className="truncate">{ROLES[s.role]?.label || s.role}</span>
                          </span>
                        </div>
                      </div>
                      
                      {/* Desktop Layout (Exactly original) */}
                      <div className="hidden sm:flex items-center gap-3">
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
                              className="w-full py-3.5 px-2.5 rounded-xl border border-dashed border-slate-200 text-slate-300 hover:text-slate-650 hover:border-solid hover:border-orange-300 transition-all flex flex-col items-center justify-center min-h-[64px]"
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
              <h3 className="font-bold text-sm text-slate-800">{t('staff.scheduler.copy_staff', 'Sao chép lịch nhân sự')}</h3>
              <button onClick={() => setCopyStaffModal(false)} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><X className="w-4.5 h-4.5 text-slate-500" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{t('staff.scheduler.src_staff', 'Nhân sự nguồn (Sao chép từ)')}</label>
                <div className="relative">
                  <select value={srcStaffId} onChange={(e) => { setSrcStaffId(e.target.value); setDestStaffIds([]); }} className={`w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-xs appearance-none outline-none focus:border-orange-400 transition-colors ${!srcStaffId ? 'text-slate-400 font-medium' : 'text-slate-700'}`}>
                  <option value="">{t('staff.scheduler.select_src_staff', '— Chọn nhân sự nguồn —')}</option>
                  {staff.map(x => <option key={x.id} value={x.id}>{x.full_name}</option>)}
                </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{t('staff.scheduler.dest_staff_label', 'Nhân sự đích (Chọn các nhân sự dán lịch đến)')}</label>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2.5 space-y-1.5 bg-slate-50/50">
                  {staff.filter(x => x.id !== srcStaffId).map(x => (
                    <label key={x.id} className="flex items-center gap-2 text-xs text-slate-750 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={destStaffIds.includes(x.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDestStaffIds([...destStaffIds, x.id]);
                          } else {
                            setDestStaffIds(destStaffIds.filter(id => id !== x.id));
                          }
                        }}
                        className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 w-3.5 h-3.5"
                      />
                      <span>{x.full_name}</span>
                    </label>
                  ))}
                  {staff.filter(x => x.id !== srcStaffId).length === 0 && (
                    <span className="text-[10px] text-slate-400 italic">{t('staff.scheduler.select_src_first', 'Chọn nhân sự nguồn trước')}</span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={handleCopyStaff} className="w-full py-2.5 bg-orange-500 text-white rounded-xl text-xs font-semibold mt-4 hover:bg-orange-600 transition-colors">{t('staff.scheduler.start_copy', 'Bắt đầu sao chép')}</button>
          </div>
        </div>
      )}

      {/* Copy Day Modal */}
      {copyDayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setCopyDayModal(false)}>
          <div className="relative bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-slate-800">{t('staff.scheduler.copy_day', 'Sao chép ca ngày')}</h3>
              <button onClick={() => setCopyDayModal(false)} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><X className="w-4.5 h-4.5 text-slate-500" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{t('staff.scheduler.src_day', 'Ngày nguồn (Sao chép từ)')}</label>
                <div className="relative">
                  <select value={srcDay} onChange={(e) => { setSrcDay(e.target.value); setDestDays([]); }} className={`w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-xs appearance-none outline-none focus:border-orange-400 transition-colors ${!srcDay ? 'text-slate-400 font-medium' : 'text-slate-700'}`}>
                  <option value="">{t('staff.scheduler.select_src_day', '— Chọn ngày nguồn —')}</option>
                  {weekDays.map(d => <option key={d} value={d}>{formatDateHeader(d, t)}</option>)}
                </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{t('staff.scheduler.dest_day_label', 'Ngày đích (Chọn các ngày dán lịch đến)')}</label>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2.5 space-y-1.5 bg-slate-50/50">
                  {weekDays.filter(d => d !== srcDay).map(d => (
                    <label key={d} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={destDays.includes(d)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDestDays([...destDays, d]);
                          } else {
                            setDestDays(destDays.filter(day => day !== d));
                          }
                        }}
                        className="rounded border-slate-300 text-orange-500 focus:ring-orange-500 w-3.5 h-3.5"
                      />
                      <span>{formatDateHeader(d, t)}</span>
                    </label>
                  ))}
                  {!srcDay && (
                    <span className="text-[10px] text-slate-400 italic">{t('staff.scheduler.select_day_first', 'Chọn ngày nguồn trước')}</span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={handleCopyDay} className="w-full py-2.5 bg-orange-500 text-white rounded-xl text-xs font-semibold mt-4 hover:bg-orange-600 transition-colors">{t('staff.scheduler.start_copy', 'Bắt đầu sao chép')}</button>
          </div>
        </div>
      )}
      {/* Swap Shifts Modal */}
      {swapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setSwapModal(false)}>
          <div className="relative bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-slate-800">{t('staff.scheduler.swap_staff', 'Đổi ca nhân sự')}</h3>
              <button onClick={() => setSwapModal(false)} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><X className="w-4.5 h-4.5 text-slate-500" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{t('staff.scheduler.select_swap_day_label', 'Chọn ngày đổi ca')}</label>
                <div className="relative">
                  <select value={swapDay} onChange={(e) => setSwapDay(e.target.value)} className={`w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-xs appearance-none outline-none focus:border-orange-400 transition-colors ${!swapDay ? 'text-slate-400 font-medium' : 'text-slate-700'}`}>
                  <option value="">{t('staff.scheduler.select_swap_day', '— Chọn ngày đổi ca —')}</option>
                  {weekDays.map(d => <option key={d} value={d}>{formatDateHeader(d, t)}</option>)}
                </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t('staff.scheduler.staff_a', 'Nhân sự A')}</label>
                  <div className="relative">
                  <select value={swapStaffA} onChange={(e) => setSwapStaffA(e.target.value)} className={`w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-xs appearance-none outline-none focus:border-orange-400 transition-colors ${!swapStaffA ? 'text-slate-400 font-medium' : 'text-slate-700'}`}>
                    <option value="">{t('staff.scheduler.select_staff_a', '— Chọn nhân sự A —')}</option>
                    {staff.map(x => <option key={x.id} value={x.id}>{x.full_name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t('staff.scheduler.staff_b', 'Nhân sự B')}</label>
                  <div className="relative">
                  <select value={swapStaffB} onChange={(e) => setSwapStaffB(e.target.value)} className={`w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-xs appearance-none outline-none focus:border-orange-400 transition-colors ${!swapStaffB ? 'text-slate-400 font-medium' : 'text-slate-700'}`}>
                    <option value="">{t('staff.scheduler.select_staff_b', '— Chọn nhân sự B —')}</option>
                    {staff.map(x => <option key={x.id} value={x.id}>{x.full_name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
                </div>
              </div>
            </div>
            <button onClick={handleSwapShifts} className="w-full py-2.5 bg-orange-500 text-white rounded-xl text-xs font-semibold mt-4 hover:bg-orange-600 transition-colors">{t('staff.scheduler.confirm_swap', 'Xác nhận đổi ca')}</button>
          </div>
        </div>
      )}

      {/* Assign Shift Modal (Multiple Shifts per day) */}
      {assignModalCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setAssignModalCell(null)}>
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs" />
          <div className="relative bg-white w-full md:max-w-md rounded-3xl p-6 shadow-2xl relative text-left flex flex-col max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-800 font-sans">{t('staff.scheduler.assign_modal_title', 'Xếp lịch làm việc')}</h2>
                <p className="text-slate-400 text-[10px] mt-0.5 font-medium font-sans">
                  Nhân viên: <span className="text-slate-600 font-bold">{assignModalCell.staff.full_name}</span> - {formatVietnameseDate(assignModalCell.date, t)}
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
                  <div>{t('staff.scheduler.shift_label', 'Ca làm việc')}</div>
                  <div className="text-center">{t('staff.scheduler.work_time', 'Thời gian làm việc')}</div>
                  <div className="text-right">{t('staff.scheduler.add_action', 'Thêm')}</div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-slate-100">
                  {templates.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 font-medium">{t('staff.scheduler.no_templates', 'Chưa định nghĩa ca làm việc nào. Hãy định nghĩa ca trước.')}</div>
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
                              selectedShiftIds.includes(t.id) && !isOff ? 'bg-orange-500' : 'bg-slate-200'
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
                    <span className="font-bold text-slate-800 text-xs">{t('staff.scheduler.register_off', 'Đăng ký nghỉ ngày này')}</span>
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
                    <span className="font-bold text-slate-500 text-[11px]">{t('staff.scheduler.off_reason_label', 'Lý do nghỉ:')}</span>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-1.5 font-semibold text-xs text-slate-700 cursor-pointer">
                        <input 
                          type="radio" 
                          name="offType" 
                          checked={offType === 'vacation'} 
                          onChange={() => setOffType('vacation')}
                          className="text-red-500 focus:ring-red-400"
                        />
                        <span>{t('staff.scheduler.off_vacation', 'Nghỉ phép')}</span>
                      </label>
                      <label className="flex items-center gap-1.5 font-semibold text-xs text-slate-700 cursor-pointer">
                        <input 
                          type="radio" 
                          name="offType" 
                          checked={offType === 'sick'} 
                          onChange={() => setOffType('sick')}
                          className="text-red-500 focus:ring-red-400"
                        />
                        <span>{t('staff.scheduler.off_sick', 'Nghỉ ốm')}</span>
                      </label>
                      <label className="flex items-center gap-1.5 font-semibold text-xs text-slate-700 cursor-pointer">
                        <input 
                          type="radio" 
                          name="offType" 
                          checked={offType === 'other'} 
                          onChange={() => setOffType('other')}
                          className="text-red-500 focus:ring-red-400"
                        />
                        <span>{t('staff.scheduler.off_other', 'Khác')}</span>
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
                className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-xs shadow-sm hover:opacity-95 transition-all font-sans"
              >
                Lưu
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Global AJAX Loading Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-3 border border-slate-100 max-w-xs w-full text-center">
            <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
            <div>
              <p className="text-sm font-bold text-slate-800 font-sans">{processingMsg}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 font-sans">{t('staff.scheduler.please_wait', 'Vui lòng chờ trong giây lát...')}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
