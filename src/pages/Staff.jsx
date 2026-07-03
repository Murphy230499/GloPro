import React, { useEffect, useState } from 'react';
import { Plus, X, Phone, Scissors, Clock, CheckCircle2, CalendarDays, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useBranch } from '@/lib/BranchContext';
import { formatVND, todayStr } from '@/lib/format';
import { toast } from '@/components/Layout';
import Avatar from '@/components/Avatar';
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

export default function StaffPage() {
  const { currentBranchId } = useBranch();
  const [staff, setStaff] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [date, setDate] = useState(todayStr());
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = () => {
    const filter = currentBranchId === 'all' ? {} : { branch_id: currentBranchId };
    Promise.all([
      base44.entities.Staff.filter(filter),
      base44.entities.Shift.filter(filter),
      base44.entities.Invoice.filter(filter),
    ]).then(([s, sh, inv]) => {
      setStaff(s.filter(x => x.is_active !== false));
      setShifts(sh);
      setInvoices(inv);
      setLoading(false);
    });
  };
  useEffect(load, [currentBranchId]);

  const dayShifts = shifts.filter((s) => s.date === date);

  // commission: sum items where staff_id == staff.id, commission = price * qty * service.commission_rate/100
  const computeCommission = (staffId) => {
    let total = 0;
    invoices.forEach((inv) => {
      (inv.items || []).forEach((it) => {
        if (it.staff_id === staffId) {
          // estimate commission 30% if unknown
          total += (it.price || 0) * (it.qty || 1) * 0.3;
        }
      });
    });
    return total;
  };

  const checkInOut = async (shift) => {
    const next = shift.status === 'scheduled' ? 'checked_in' : shift.status === 'checked_in' ? 'checked_out' : 'scheduled';
    try {
      await base44.entities.Shift.update(shift.id, { status: next });
      toast.success(next === 'checked_in' ? 'Đã check-in' : next === 'checked_out' ? 'Đã check-out' : 'Đã đặt lại');
      load();
    } catch (e) { toast.error('Lỗi: ' + (e.message || e)); }
  };

  const addShift = async (staffMember) => {
    try {
      await base44.entities.Shift.create({
        staff_id: staffMember.id, staff_name: staffMember.full_name,
        branch_id: currentBranchId === 'all' ? staffMember.branch_id : currentBranchId,
        date, start_time: '09:00', end_time: '17:00', status: 'scheduled',
      });
      toast.success('Đã thêm ca');
      load();
    } catch (e) { toast.error('Lỗi: ' + (e.message || e)); }
  };

  const saveStaff = async (data) => {
    const payload = { ...data, branch_id: data.branch_id || (currentBranchId === 'all' ? '' : currentBranchId) };
    if (editing.id) {
      await base44.entities.Staff.update(editing.id, payload);
      toast.success('Đã cập nhật');
    } else {
      await base44.entities.Staff.create(payload);
      toast.success('Đã thêm nhân viên');
    }
    setEditing(null);
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Nhân viên & Ca làm</h1>
          <p className="text-slate-400 text-sm mt-1">{staff.length} nhân viên</p>
        </div>
        <button onClick={() => setEditing({})} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm">
          <Plus className="w-4 h-4" /> Thêm nhân viên
        </button>
      </div>

      {/* Shifts for the day */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-bold flex items-center gap-2"><CalendarDays className="w-4 h-4 text-orange-500" /> Ca làm việc</h3>
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-sm outline-none bg-transparent" />
          </div>
        </div>
        {dayShifts.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">Chưa có ca nào trong ngày {date}. Thêm ca từ danh sách nhân viên bên dưới.</p>
        ) : (
          <div className="space-y-2">
            {dayShifts.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                <Avatar src={staff.find(x => x.id === s.staff_id)?.avatar_url} name={s.staff_name} size={36} color={staff.find(x => x.id === s.staff_id)?.avatar_color || '#FF6B9D'} />
                <div className="flex-1">
                  <div className="font-semibold text-sm">{s.staff_name}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{s.start_time} - {s.end_time} {s.is_overtime && <span className="text-orange-500 font-medium">• Tăng ca</span>}</div>
                </div>
                <span className="text-[11px] font-semibold px-2 py-1 rounded-full" style={{
                  background: s.status === 'checked_in' ? '#34D3991a' : s.status === 'checked_out' ? '#94A3B81a' : '#FBBF241a',
                  color: s.status === 'checked_in' ? '#34D399' : s.status === 'checked_out' ? '#94A3B8' : '#FBBF24',
                }}>
                  {s.status === 'checked_in' ? 'Đang làm' : s.status === 'checked_out' ? 'Đã tan' : 'Chưa check-in'}
                </span>
                <button onClick={() => checkInOut(s)} className="text-xs px-3 py-1.5 rounded-full bg-white border border-slate-200 font-medium">
                  {s.status === 'scheduled' ? 'Check-in' : s.status === 'checked_in' ? 'Check-out' : 'Reset'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Staff list */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {staff.map((s) => {
          const hasShiftToday = dayShifts.some((sh) => sh.staff_id === s.id);
          const commission = computeCommission(s.id);
          const role = ROLES[s.role] || { label: s.role, color: '#94A3B8' };
          return (
            <div key={s.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar src={s.avatar_url} name={s.full_name} size={48} color={s.avatar_color || '#FF6B9D'} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{s.full_name}</div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: role.color + '1a', color: role.color }}>{role.label}</span>
                </div>
              </div>
              {s.phone && <div className="text-xs text-slate-400 flex items-center gap-1 mt-2"><Phone className="w-3 h-3" />{s.phone}</div>}
              {s.specialties && <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Scissors className="w-3 h-3" />{s.specialties}</div>}
              <div className="flex items-center justify-between mt-3 text-sm">
                <div><span className="text-slate-400 text-xs">Lương: </span><span className="font-semibold">{formatVND(s.base_salary || 0)}</span></div>
                <div className="flex items-center gap-1 text-green-600 font-semibold"><TrendingUp className="w-3.5 h-3.5" />{formatVND(commission)}</div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => addShift(s)} disabled={hasShiftToday}
                  className={`flex-1 text-xs px-2.5 py-2 rounded-full font-medium ${hasShiftToday ? 'bg-slate-100 text-slate-400' : 'bg-orange-50 text-orange-600'}`}>
                  {hasShiftToday ? <span className="flex items-center justify-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Đã có ca</span> : '+ Thêm ca'}
                </button>
                <button onClick={() => setEditing(s)} className="text-xs px-3 py-2 rounded-full bg-slate-100 font-medium">Sửa</button>
              </div>
            </div>
          );
        })}
      </div>

      {editing && <StaffForm staff={editing} branches={[]} onClose={() => setEditing(null)} onSave={saveStaff} />}
    </div>
  );
}

function StaffForm({ staff, onClose, onSave }) {
  const [f, setF] = useState({
    full_name: staff.full_name || '', phone: staff.phone || '', role: staff.role || 'stylist',
    base_salary: staff.base_salary || 0, specialties: staff.specialties || '',
    avatar_color: staff.avatar_color || '#FF6B9D', avatar_url: staff.avatar_url || '',
  });
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{staff.id ? 'Sửa nhân viên' : 'Thêm nhân viên'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} placeholder="Họ tên" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="Số điện thoại" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          <select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
            {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <input type="number" value={f.base_salary || ''} onChange={(e) => setF({ ...f, base_salary: Number(e.target.value) || 0 })} placeholder="Lương cơ bản (VNĐ/tháng)" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          <input value={f.specialties} onChange={(e) => setF({ ...f, specialties: e.target.value })} placeholder="Chuyên môn (vd: cắt nam, uốn...)" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Màu đại diện</span>
            {['#FF6B9D', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F97316'].map((c) => (
              <button key={c} onClick={() => setF({ ...f, avatar_color: c })} className="w-7 h-7 rounded-full" style={{ background: c, outline: f.avatar_color === c ? '3px solid #fff' : 'none', boxShadow: f.avatar_color === c ? `0 0 0 2px ${c}` : 'none' }} />
            ))}
          </div>
          <ImageUpload value={f.avatar_url} onChange={(v) => setF({ ...f, avatar_url: v })} label="Ảnh nhân viên" shape="circle" />
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 font-semibold text-sm">Hủy</button>
          <button onClick={() => f.full_name ? onSave(f) : toast.error('Nhập họ tên')} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm">Lưu</button>
        </div>
      </div>
    </div>
  );
}