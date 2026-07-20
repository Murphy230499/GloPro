'use client';
import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Calendar, Edit3, X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/Layout';
import Avatar from '@/components/Avatar';
import { todayStr } from '@/lib/format';

const STATUS_CONFIG = {
  full: { label: 'Đúng giờ', color: '#3B82F6', bg: '#EFF6FF', border: '#DBEAFE' },
  late: { label: 'Đi trễ', color: '#EF4444', bg: '#FEF2F2', border: '#FEE2E2' },
  early_leave: { label: 'Về sớm', color: '#EF4444', bg: '#FEF2F2', border: '#FEE2E2' },
  late_early: { label: 'Trễ & Sớm', color: '#EF4444', bg: '#FEF2F2', border: '#FEE2E2' },
  missing_in: { label: 'Chưa chấm vào', color: '#D97706', bg: '#FFFBEB', border: '#FEF3C7' },
  missing_out: { label: 'Chưa chấm ra', color: '#D97706', bg: '#FFFBEB', border: '#FEF3C7' },
  no_show: { label: 'Chưa chấm công', color: '#8B5CF6', bg: '#F5F3FF', border: '#EDE9FE' },
  off: { label: 'Nghỉ làm', color: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB' }
};

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

const formatDateHeader = (dateStr) => {
  const d = new Date(dateStr);
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const dayNum = d.getDate().toString().padStart(2, '0');
  const monthNum = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${days[d.getDay()]} - ${dayNum}/${monthNum}`;
};

export default function AttendanceLog({ branchId }) {
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
      console.error('Lỗi khi tải dữ liệu chấm công:', e);
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

      toast.success('Đã điều chỉnh công thành công');
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
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-purple-500" />
              <span>Tuần: {weekDays[0].split('-').reverse().slice(0, 2).join('/')} - {weekDays[6].split('-').reverse().slice(0, 2).join('/')}</span>
            </div>
            <button onClick={() => changeWeek(1)} className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Status Color Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-550" style={{ backgroundColor: '#3B82F6' }} /> Đúng giờ</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-550" style={{ backgroundColor: '#EF4444' }} /> Đi trễ / Về sớm</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-550" style={{ backgroundColor: '#8B5CF6' }} /> Chưa chấm công</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-550" style={{ backgroundColor: '#D97706' }} /> Chấm công thiếu</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-450" style={{ backgroundColor: '#6B7280' }} /> Nghỉ làm</span>
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
                  <th className="text-left py-4 px-4 text-xs font-bold text-slate-500 min-w-[180px] sticky left-0 bg-slate-50 z-10 border-r border-slate-100">Tên nhân viên</th>
                  {weekDays.map(d => (
                    <th key={d} className="text-center py-4 px-3 text-xs font-bold text-slate-600 min-w-[130px]">{formatDateHeader(d)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staff.map(s => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/20 transition-colors">
                    {/* Column 1: Staff Profile */}
                    <td className="p-4 sticky left-0 bg-white z-10 border-r border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={s.avatar_url} name={s.full_name} size={32} color={s.avatar_color} />
                        <div className="min-w-0">
                          <div className="truncate font-bold text-xs text-slate-800">{s.full_name}</div>
                          <span className="inline-block text-[9px] font-bold text-slate-450 capitalize mt-0.5">{s.role}</span>
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
                              <div className="text-[10px] text-slate-300 italic py-3">Không xếp ca</div>
                            ) : (
                              dayScheds.map(sched => {
                                const matchedTmpl = templates.find(t => t.id === sched.shift_template_id);
                                const shiftName = matchedTmpl ? matchedTmpl.name : 'Ca làm';
                                const shiftTime = matchedTmpl ? `${matchedTmpl.start_time}-${matchedTmpl.end_time}` : '';
                                
                                const att = dayAtts.find(a => a.staff_id === s.id);
                                
                                // Determine status config
                                let statusKey = 'no_show';
                                if (sched.is_off) {
                                  statusKey = 'off';
                                } else if (att) {
                                  statusKey = att.status || 'full';
                                }
                                
                                const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.no_show;
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
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-[10px]" style={{ color: cfg.color }}>{shiftName}</span>
                                      
                                      {/* Edit Attendance Button on Hover */}
                                      <button 
                                        onClick={() => openEditModal(s, date, sched, att)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-slate-200/50 text-slate-500"
                                        title="Chỉnh sửa chấm công"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </button>
                                    </div>

                                    {sched.is_off ? (
                                      <>
                                        <span className="text-[9px] text-slate-500 font-bold block mt-0.5">Nghỉ nguyên ngày</span>
                                        <span className="text-[9px] text-slate-400 block font-semibold mt-0.5">💡 Vắng mặt</span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="text-[9px] text-slate-450 font-semibold block mt-0.5">{shiftTime}</span>
                                        <div className="text-[9px] font-bold text-slate-700 mt-1 flex items-center gap-1">
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
              <h3 className="font-bold text-sm text-slate-800">Điều chỉnh chấm công</h3>
              <button onClick={() => setEditingCell(null)} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><X className="w-4.5 h-4.5 text-slate-500" /></button>
            </div>
            
            <div className="space-y-4">
              {/* Staff and Date Info */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-2">
                <Avatar src={editingCell.staff.avatar_url} name={editingCell.staff.full_name} size={36} color={editingCell.staff.avatar_color} />
                <div>
                  <div className="font-bold text-xs text-slate-800">{editingCell.staff.full_name}</div>
                  <div className="text-[10px] text-slate-450 font-semibold mt-0.5">Ngày: {editingCell.date.split('-').reverse().join('/')}</div>
                </div>
              </div>

              {/* Attendance Off Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700">
                <input 
                  type="checkbox"
                  checked={editIsOff}
                  onChange={(e) => setEditIsOff(e.target.checked)}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <span>Nhân viên nghỉ làm hôm nay (Vắng mặt)</span>
              </label>

              {!editIsOff && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Giờ Vào (Check-In)</label>
                    <input 
                      type="time" 
                      value={editCheckIn}
                      onChange={(e) => setEditCheckIn(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 mb-1">Giờ Ra (Check-Out)</label>
                    <input 
                      type="time" 
                      value={editCheckOut}
                      onChange={(e) => setEditCheckOut(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-purple-400"
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
                Hủy
              </button>
              <button 
                onClick={handleSaveEdit} 
                className="flex-1 py-2.5 rounded-xl bg-purple-500 text-white text-xs font-bold hover:bg-purple-600 transition-colors"
              >
                Lưu chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
