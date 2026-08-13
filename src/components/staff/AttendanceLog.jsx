'use client';
import { useT } from '@/lib/i18n';
import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Calendar, Edit3, X, ChevronLeft, ChevronRight, Check, CalendarDays, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/Layout';
import Avatar from '@/components/Avatar';
import { todayStr } from '@/lib/format';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";

const getWeekDays = (baseDateStr) => {
  const current = new Date(baseDateStr);
  const day = current.getDay();
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

const formatDateHeader = (dateStr, t) => {
  const d = new Date(dateStr);
  const days = [
    t('common.sunday', 'Chủ nhật'), 
    t('common.monday', 'Thứ 2'), 
    t('common.tuesday', 'Thứ 3'), 
    t('common.wednesday', 'Thứ 4'), 
    t('common.thursday', 'Thứ 5'), 
    t('common.friday', 'Thứ 6'), 
    t('common.saturday', 'Thứ 7')
  ];
  const dayNum = d.getDate().toString().padStart(2, '0');
  const monthNum = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${days[d.getDay()]} - ${dayNum}/${monthNum}`;
};

export default function AttendanceLog({ branchId, staffData }) {
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

  const STATUS_CONFIG = {
    full: { label: t('staff.attendance.on_time', 'Đúng giờ'), color: '#3B82F6', bg: '#EFF6FF', border: '#DBEAFE' },
    late: { label: t('staff.attendance.late', 'Đi trễ'), color: '#EF4444', bg: '#FEF2F2', border: '#FEE2E2' },
    early_leave: { label: t('staff.attendance.early_leave', 'Về sớm'), color: '#EF4444', bg: '#FEF2F2', border: '#FEE2E2' },
    late_and_early: { label: t('staff.attendance.late_and_early', 'Trễ & Sớm'), color: '#EF4444', bg: '#FEF2F2', border: '#FEE2E2' },
    missing_in: { label: t('staff.attendance.missing_in', 'Chưa chấm vào'), color: '#F59E0B', bg: '#FEF3C7', border: '#FDE68A' },
    missing_out: { label: t('staff.attendance.missing_out', 'Chưa chấm ra'), color: '#F59E0B', bg: '#FEF3C7', border: '#FDE68A' },
    no_attendance: { label: t('staff.attendance.no_attendance', 'Chưa chấm công'), color: '#8B5CF6', bg: '#F5F3FF', border: '#EDE9FE' },
    absent: { label: t('staff.attendance.absent', 'Nghỉ làm'), color: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB' }
  };

  const [baseDate, setBaseDate] = useState(todayStr());
  const [staff, setStaff] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit attendance state
  const [editingCell, setEditingCell] = useState(null); // { staff, date, schedule, attendance }
  const [editCheckIn, setEditCheckIn] = useState('');
  const [editCheckOut, setEditCheckOut] = useState('');
  const [editIsOff, setEditIsOff] = useState(false);

  const weekDays = getWeekDays(baseDate);

  const loadData = async () => {
    setLoading(true);
    const filter = branchId === 'all' ? {} : { branch_id: branchId };
    try {
      const [stList, tmplList] = await Promise.all([
        base44.entities.Staff.filter(filter),
        base44.entities.ShiftTemplate.list()
      ]);
      setStaff(stList.filter(x => x.is_active !== false));
      setTemplates(tmplList);

      // Load weekly schedules & attendances using single list calls to avoid rate limiting
      const [allScheds, allAtts] = await Promise.all([
        base44.entities.StaffSchedule.list(),
        base44.entities.StaffAttendance.list()
      ]);

      setSchedules(allScheds.filter(s => weekDays.includes(s.date)));
      setAttendances(allAtts.filter(a => weekDays.includes(a.date)));
    } catch (e) {
      console.error(t('staff.attendance.load_error', 'Lỗi khi tải dữ liệu chấm công:'), e);
      const localStaff = localStorage.getItem('glopro_staff');
      setStaff(localStaff ? JSON.parse(localStaff) : []);
      const localTemplates = localStorage.getItem('glopro_shift_templates');
      setTemplates(localTemplates ? JSON.parse(localTemplates) : []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [baseDate, branchId]);

  const changeWeek = (direction) => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + (direction * 7));
    setBaseDate(d.toISOString().slice(0, 10));
  };

  const getCellData = (staffId, date) => {
    const dayScheds = schedules.filter(s => s.staff_id === staffId && s.date === date);
    const dayAtts = attendances.filter(a => a.staff_id === staffId && a.date === date);
    return { dayScheds, dayAtts };
  };

  const computeFinalStatus = (inTime, outTime, shift) => {
    if (!shift) return 'full';
    if (!inTime) return 'missing_in';
    if (!outTime) return 'missing_out';

    const [shStartH, shStartM] = shift.start_time.split(':').map(Number);
    const [shEndH, shEndM] = shift.end_time.split(':').map(Number);
    
    const [inH, inM] = inTime.split(':').map(Number);
    const [outH, outM] = outTime.split(':').map(Number);

    const inDiff = (inH * 60 + inM) - (shStartH * 60 + shStartM);
    const outDiff = (shEndH * 60 + shEndM) - (outH * 60 + outM);
    
    const isLate = inDiff > 10;
    const isEarly = outDiff > 0;
    const isOT = (outH * 60 + outM) - (shEndH * 60 + shEndM) > 30;

    if (isLate && isEarly) return 'late_early';
    if (isLate) return 'late';
    if (isEarly) return 'early_leave';
    if (isOT) return 'overtime';
    return 'full';
  };



  const openEditModal = (staffMember, dateStr, sched, att) => {
    setEditingCell({ staff: staffMember, date: dateStr, schedule: sched, attendance: att });
    setEditCheckIn(att?.check_in || '');
    setEditCheckOut(att?.check_out || '');
    setEditIsOff(sched?.is_off || false);
  };

  const handleSaveEdit = async () => {
    if (!editingCell) return;
    const { staff, date, schedule, attendance } = editingCell;

    try {
      // 1. Update Schedule Off State if changed
      if (schedule && schedule.is_off !== editIsOff) {
        await base44.entities.StaffSchedule.update(schedule.id, {
          ...schedule,
          is_off: editIsOff,
          off_type: editIsOff ? 'vacation' : ''
        });
      }

      // 2. Update/Create Attendance
      if (editIsOff) {
        // If marked off, delete attendance if exists
        if (attendance) {
          await base44.entities.StaffAttendance.delete(attendance.id);
        }
      } else {
        const shift = schedule ? templates.find(t => t.id === schedule.shift_template_id) : null;
        let otMinutes = 0;
        if (shift && editCheckOut) {
          const [shEndH, shEndM] = shift.end_time.split(':').map(Number);
          const [nowH, nowM] = editCheckOut.split(':').map(Number);
          const diffMins = (nowH * 60 + nowM) - (shEndH * 60 + shEndM);
          if (diffMins > 30) otMinutes = diffMins;
        }

        const payload = {
          staff_id: staff.id,
          date,
          check_in: editCheckIn,
          check_out: editCheckOut,
          status: computeFinalStatus(editCheckIn, editCheckOut, shift),
          ot_minutes: otMinutes
        };

        if (attendance) {
          await base44.entities.StaffAttendance.update(attendance.id, payload);
        } else {
          await base44.entities.StaffAttendance.create(payload);
        }
      }

      toast.success(t('staff.attendance.update_success', 'Đã điều chỉnh công thành công'));
      setEditingCell(null);
      loadData();
    } catch (e) {
      toast.error('Lỗi khi lưu điều chỉnh: ' + (e.message || e));
    }
  };

  return (
    <div className="space-y-6">

      {/* Grid Log View */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => changeWeek(-1)} className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-xs font-semibold text-slate-700 transition-colors shadow-none"
                >
                  <CalendarDays className="w-3.5 h-3.5 text-orange-500" />
                  <span>{t('staff.scheduler.week', 'Tuần:')} {weekDays[0].split('-').reverse().slice(0, 2).join('/')} - {weekDays[6].split('-').reverse().slice(0, 2).join('/')}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border-slate-200" align="start">
                <CalendarUI
                  mode="single"
                  selected={new Date(baseDate)}
                  onSelect={(date) => {
                    if (date) {
                      setBaseDate(date.toISOString().slice(0, 10));
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
            <button onClick={() => changeWeek(1)} className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Status Color Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-550" style={{ backgroundColor: '#3B82F6' }} /> {t('staff.attendance.on_time', 'Đúng giờ')}</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-550" style={{ backgroundColor: '#EF4444' }} /> {t('staff.attendance.late_early', 'Đi trễ / Về sớm')}</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-550" style={{ backgroundColor: '#8B5CF6' }} /> {t('staff.attendance.no_attendance', 'Chưa chấm công')}</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-550" style={{ backgroundColor: '#D97706' }} /> {t('staff.attendance.missing_punch', 'Chấm công thiếu')}</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-450" style={{ backgroundColor: '#6B7280' }} /> {t('staff.attendance.absent', 'Nghỉ làm')}</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20"><div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto" /></div>
        ) : staff.length === 0 ? (
          <div className="text-center py-20 text-xs text-slate-400">Không tìm thấy dữ liệu nhân viên</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-0 sm:py-4 sm:px-4 text-left text-xs font-bold text-slate-500 sm:min-w-[200px] sticky left-0 bg-slate-50 z-10 border-r border-slate-100 align-middle">
                    {/* Mobile Header Layout */}
                    <div className="sm:hidden w-24 py-2 px-1 flex flex-col items-center justify-center gap-1 mx-auto text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <span className="uppercase text-[10px]">{t('staff.scheduler.staff_column', 'Nhân sự')}</span>
                    </div>
                    {/* Desktop Header Content (Original) */}
                    <span className="hidden sm:inline">
                      {t('staff.scheduler.staff_column', 'Nhân sự')}
                    </span>
                  </th>
                  {weekDays.map(d => (
                    <th key={d} className="text-center py-4 px-3 text-xs font-bold text-slate-600 min-w-[160px]">{formatDateHeader(d, t)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staff.map(s => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/20 transition-colors">
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
                      const { dayScheds, dayAtts } = getCellData(s.id, date);
                      
                      return (
                        <td key={date} className="p-2 text-center relative group min-h-[70px]">
                          <div className="flex flex-col gap-1.5">
                            {dayScheds.length === 0 ? (
                              <div className="text-[10px] text-slate-300 italic py-3">{t('staff.attendance.no_shift', 'Không xếp ca')}</div>
                            ) : (
                              dayScheds.map(sched => {
                                const matchedTmpl = templates.find(t => t.id === sched.shift_template_id);
                                const shiftName = matchedTmpl ? matchedTmpl.name : 'Ca làm';
                                const shiftTime = matchedTmpl ? `${matchedTmpl.start_time}-${matchedTmpl.end_time}` : '';
                                
                                const att = dayAtts.find(a => a.staff_id === s.id);
                                
                                // Determine status config
                                let statusKey = 'no_attendance';
                                if (sched.is_off) {
                                  statusKey = 'off';
                                } else if (att) {
                                  statusKey = att.status || 'full';
                                }
                                
                                const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.no_attendance;
                                const checkInLabel = att?.check_in || '--:--';
                                const checkOutLabel = att?.check_out || '--:--';

                                return (
                                  <div 
                                    key={sched.id}
                                    className="relative w-full p-2 rounded-xl border text-left border-l-4 transition-all"
                                    style={{
                                      backgroundColor: cfg.bg,
                                      borderColor: cfg.border,
                                      borderLeftColor: cfg.color
                                    }}
                                  >
                                    <div className="flex items-center justify-between gap-1 w-full text-[10px]">
                                      <span className="font-bold truncate max-w-[70px]" style={{ color: cfg.color }} title={shiftName}>{shiftName}</span>
                                      <span className="text-[9px] text-slate-550 font-semibold shrink-0">{shiftTime}</span>
                                      
                                      {/* Edit Attendance Button on Hover */}
                                      <button 
                                        onClick={() => openEditModal(s, date, sched, att)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-md hover:bg-slate-200/50 text-slate-500 shrink-0"
                                        title={t('staff.attendance.edit_tooltip', 'Chỉnh sửa chấm công')}
                                      >
                                        <Edit3 className="w-2.5 h-2.5" />
                                      </button>
                                    </div>

                                    {sched.is_off ? (
                                      <div className="text-[9px] text-slate-400 font-semibold mt-0.5">Nghỉ nguyên ngày</div>
                                    ) : (
                                      <>
                                        <div className="text-[9px] font-bold text-slate-700 mt-0.5 flex items-center gap-1">
                                          <span>⏰ {checkInLabel} - {checkOutLabel}</span>
                                        </div>
                                        
                                        {/* Status Text Label */}
                                        <span className="text-[8px] font-extrabold uppercase tracking-wider block mt-1" style={{ color: cfg.color }}>
                                          {cfg.label}
                                          {att?.status === 'late' && ' (Trễ)'}
                                          {att?.status === 'early_leave' && ' (Sớm)'}
                                          {att?.ot_minutes > 0 && ` (+${att.ot_minutes}m OT)`}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Attendance Adjustment Modal */}
      {editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setEditingCell(null)}>
          <div className="relative bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-slate-800">{t('staff.attendance.update_modal_title', 'Điều chỉnh chấm công')}</h3>
              <button onClick={() => setEditingCell(null)} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><X className="w-4.5 h-4.5 text-slate-500" /></button>
            </div>
            
            <div className="space-y-4">
              {/* Staff and Date Info */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-2">
                <Avatar src={editingCell.staff.avatar_url} name={editingCell.staff.full_name} size={36} color={editingCell.staff.avatar_color} />
                <div>
                  <div className="font-bold text-xs text-slate-800">{editingCell.staff.full_name}</div>
                  <div className="text-[10px] text-slate-450 font-semibold mt-0.5">{t('staff.attendance.date_label', 'Ngày:')} {editingCell.date.split('-').reverse().join('/')}</div>
                </div>
              </div>

              {/* Attendance Off Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700">
                <input 
                  type="checkbox"
                  checked={editIsOff}
                  onChange={(e) => setEditIsOff(e.target.checked)}
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 w-4 h-4"
                />
                <span>{t('staff.attendance.mark_absent_long', 'Nhân viên nghỉ làm hôm nay (Vắng mặt)')}</span>
              </label>

              {!editIsOff && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">{t('staff.attendance.check_in_long', 'Giờ Vào (Check-In)')}</label>
                    <input 
                      type="time" 
                      value={editCheckIn}
                      onChange={(e) => setEditCheckIn(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-orange-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 mb-1">{t('staff.attendance.check_out_long', 'Giờ Ra (Check-Out)')}</label>
                    <input 
                      type="time" 
                      value={editCheckOut}
                      onChange={(e) => setEditCheckOut(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-orange-400"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2.5 mt-5">
              <button 
                onClick={() => setEditingCell(null)} 
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                {t('staff.scheduler.cancel', 'Hủy')}
              </button>
              <button 
                onClick={handleSaveEdit} 
                className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors"
              >
                {t('staff.attendance.save_changes', 'Lưu chỉnh sửa')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
