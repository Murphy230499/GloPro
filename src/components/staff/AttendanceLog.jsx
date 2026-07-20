'use client';
import React, { useState, useEffect } from 'react';
import { Play, Square, Clock, AlertTriangle, Calendar, UserCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/Layout';
import Avatar from '@/components/Avatar';
import { todayStr } from '@/lib/format';

const STATUS_LABELS = {
  full: { label: 'Đủ công', color: 'bg-green-50 text-green-600 border-green-200' },
  late: { label: 'Đi muộn', color: 'bg-orange-50 text-orange-600 border-orange-200' },
  early_leave: { label: 'Về sớm', color: 'bg-amber-50 text-amber-600 border-amber-200' },
  late_early: { label: 'Muộn & Sớm', color: 'bg-red-50 text-red-500 border-red-200' },
  missing_in: { label: 'Thiếu Giờ Vào', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
  missing_out: { label: 'Thiếu Giờ Ra', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
  no_show: { label: 'Chưa Chấm', color: 'bg-slate-50 text-slate-400 border-slate-200' },
  overtime: { label: 'Tăng ca', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
};

export default function AttendanceLog({ branchId }) {
  const [date, setDate] = useState(todayStr());
  const [staff, setStaff] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [templates, setTemplates] = useState([]);
  // Legacy Shift data from previous version
  const [legacyShifts, setLegacyShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Kiosk console state
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const filter = branchId === 'all' ? {} : { branch_id: branchId };
    try {
      const [stList, tmplList, schedList, attList] = await Promise.all([
        base44.entities.Staff.filter(filter),
        base44.entities.ShiftTemplate.list(),
        base44.entities.StaffSchedule.filter({ date }),
        base44.entities.StaffAttendance.filter({ date })
      ]);
      setStaff(stList.filter(x => x.is_active !== false));
      setTemplates(tmplList);
      setSchedules(schedList);
      setAttendances(attList);

      // Also load legacy Shift data (from previous version) for same date
      try {
        const legacyFilter = { date, ...(branchId !== 'all' ? { branch_id: branchId } : {}) };
        const legacy = await base44.entities.Shift.filter(legacyFilter);
        setLegacyShifts(legacy);
      } catch (_e) {
        // Shift entity may not exist yet, ignore silently
        setLegacyShifts([]);
      }
    } catch (e) {
      console.error('Lỗi khi tải dữ liệu chấm công:', e);
      const localStaff = localStorage.getItem('glopro_staff');
      setStaff(localStaff ? JSON.parse(localStaff) : []);
      const localTemplates = localStorage.getItem('glopro_shift_templates');
      setTemplates(localTemplates ? JSON.parse(localTemplates) : []);
      setLegacyShifts([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [date, branchId]);

  const handleKioskCheck = async (type) => {
    if (!selectedStaffId) return toast.error('Vui lòng chọn nhân viên trước');
    setProcessing(true);

    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 8); // "HH:MM:SS"
    const existing = attendances.find(a => a.staff_id === selectedStaffId);
    
    // Find scheduled shift
    const sched = schedules.find(s => s.staff_id === selectedStaffId && !s.is_off);
    const shift = sched ? templates.find(t => t.id === sched.shift_template_id) : null;

    let payload = {};
    
    if (type === 'in') {
      if (existing && existing.check_in) {
        setProcessing(false);
        return toast.error('Nhân viên này đã check-in hôm nay rồi');
      }

      // Compute status based on shift start
      let status = 'full';
      if (shift) {
        const [shHour, shMin] = shift.start_time.split(':').map(Number);
        const [nowHour, nowMin] = timeStr.split(':').map(Number);
        const diffMins = (nowHour * 60 + nowMin) - (shHour * 60 + shMin);
        if (diffMins > 10) {
          status = 'late';
        }
      }

      payload = {
        staff_id: selectedStaffId,
        date,
        check_in: timeStr,
        check_out: existing?.check_out || '',
        status: existing?.check_out ? computeFinalStatus(timeStr, existing.check_out, shift) : 'missing_out',
        ot_minutes: existing?.ot_minutes || 0
      };

      try {
        if (existing) {
          await base44.entities.StaffAttendance.update(existing.id, payload);
        } else {
          await base44.entities.StaffAttendance.create(payload);
        }
        toast.success('Chấm công VÀO CA thành công!');
      } catch (e) {
        toast.error('Lỗi check-in: ' + (e.message || e));
      }
    } else {
      // Check-out
      if (existing && existing.check_out) {
        setProcessing(false);
        return toast.error('Nhân viên này đã check-out hôm nay rồi');
      }

      const checkInTime = existing?.check_in || '';
      
      // Calculate status and Overtime
      let status = 'full';
      let otMinutes = 0;
      if (shift) {
        const [shEndHour, shEndMin] = shift.end_time.split(':').map(Number);
        const [nowHour, nowMin] = timeStr.split(':').map(Number);
        const diffMins = (nowHour * 60 + nowMin) - (shEndHour * 60 + shEndMin);
        
        if (diffMins > 30) {
          status = 'overtime';
          otMinutes = diffMins;
        } else if (diffMins < 0) {
          status = 'early_leave';
        }
      }

      payload = {
        staff_id: selectedStaffId,
        date,
        check_in: checkInTime,
        check_out: timeStr,
        status: computeFinalStatus(checkInTime, timeStr, shift),
        ot_minutes: otMinutes
      };

      try {
        if (existing) {
          await base44.entities.StaffAttendance.update(existing.id, payload);
        } else {
          await base44.entities.StaffAttendance.create(payload);
        }
        toast.success('Chấm công RA CA thành công!');
      } catch (e) {
        toast.error('Lỗi check-out: ' + (e.message || e));
      }
    }

    setSelectedStaffId('');
    setProcessing(false);
    loadData();
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

  return (
    <div className="space-y-6">
      {/* Kiosk Section */}
      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold flex items-center gap-1.5"><UserCheck className="w-5 h-5" /> Kiosk Chấm Công Nhanh</h3>
          <p className="text-xs text-purple-100 mt-1">Dành cho nhân viên tự chấm công vào ca và tan ca tại cơ sở</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select 
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            disabled={processing}
            className="px-3 py-2.5 rounded-xl border-none text-slate-800 text-xs font-semibold focus:outline-none min-w-[180px] shadow-sm bg-white"
          >
            <option value="">— Chọn tên nhân viên —</option>
            {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>

          <button
            onClick={() => handleKioskCheck('in')}
            disabled={processing || !selectedStaffId}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Vào Ca
          </button>
          
          <button
            onClick={() => handleKioskCheck('out')}
            disabled={processing || !selectedStaffId}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 disabled:opacity-50 transition-colors shadow-sm"
          >
            <Square className="w-3.5 h-3.5 fill-current" /> Tan Ca
          </button>
        </div>
      </div>

      {/* History Log View */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Nhật ký chấm công ngày</h4>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
            <Calendar className="w-4 h-4 text-purple-500" />
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="text-xs font-semibold outline-none bg-transparent text-slate-700" 
            />
          </div>
        </div>

          {loading ? (
          <div className="text-center py-10"><div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto" /></div>
        ) : staff.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400">Không tìm thấy dữ liệu nhân viên</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs">
                  <th className="pb-3 min-w-[200px]">Nhân viên</th>
                  <th className="pb-3 text-center">Ca làm việc</th>
                  <th className="pb-3 text-center">Giờ Vào (Check-In)</th>
                  <th className="pb-3 text-center">Giờ Ra (Check-Out)</th>
                  <th className="pb-3 text-center">Trạng thái chấm</th>
                  <th className="pb-3 text-center">Tăng ca (OT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map(s => {
                  const sched = schedules.find(sc => sc.staff_id === s.id);
                  const att = attendances.find(a => a.staff_id === s.id);
                  // Fall back to legacy Shift data if no new attendance record exists
                  const legacyShift = legacyShifts.find(ls => ls.staff_id === s.id);
                  
                  let shiftLabel = 'Không xếp ca';
                  if (sched) {
                    if (sched.is_off) {
                      shiftLabel = sched.off_type === 'vacation' ? 'Nghỉ phép' : sched.off_type === 'sick' ? 'Nghỉ ốm' : 'Nghỉ';
                    } else {
                      const matched = templates.find(t => t.id === sched.shift_template_id);
                      shiftLabel = matched ? `${matched.name} (${matched.start_time}-${matched.end_time})` : 'Ca làm';
                    }
                  } else if (legacyShift) {
                    // Show legacy shift info
                    shiftLabel = `${legacyShift.start_time || '?'} - ${legacyShift.end_time || '?'}${legacyShift.is_overtime ? ' (Tăng ca)' : ''}`;
                  }

                  const checkInLabel = att?.check_in || '—';
                  const checkOutLabel = att?.check_out || '—';
                  
                  // Determine status — prefer new attendance, fall back to legacy Shift status
                  let statusKey = 'no_show';
                  if (sched?.is_off) {
                    statusKey = 'full';
                  } else if (att) {
                    statusKey = att.status || 'full';
                  } else if (legacyShift) {
                    // Map old Shift statuses → new status keys
                    const legacyMap = {
                      checked_in: 'missing_out',
                      checked_out: 'full',
                      scheduled: 'no_show',
                      absent: 'no_show',
                    };
                    statusKey = legacyMap[legacyShift.status] || 'no_show';
                  }

                  const badge = STATUS_LABELS[statusKey] || STATUS_LABELS.no_show;
                  const otLabel = att?.ot_minutes ? `+${att.ot_minutes} phút` : legacyShift?.is_overtime ? 'Tăng ca' : '—';
                  const isLegacy = !att && !!legacyShift;

                  return (
                    <tr key={s.id} className={`hover:bg-slate-50/30 transition-colors ${isLegacy ? 'opacity-75' : ''}`}>
                      <td className="py-3 flex items-center gap-3">
                        <Avatar src={s.avatar_url} name={s.full_name} size={32} color={s.avatar_color} />
                        <div>
                          <div className="font-semibold text-sm text-slate-800 flex items-center gap-1.5">
                            {s.full_name}
                            {isLegacy && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-500 border border-amber-100">Dữ liệu cũ</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 capitalize">{s.role}</div>
                        </div>
                      </td>
                      <td className="py-3 text-center text-xs font-semibold text-slate-600">{shiftLabel}</td>
                      <td className="py-3 text-center text-xs font-bold text-slate-700">{checkInLabel}</td>
                      <td className="py-3 text-center text-xs font-bold text-slate-700">{checkOutLabel}</td>
                      <td className="py-3 text-center">
                        <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 text-center text-xs font-bold text-emerald-600">{otLabel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

