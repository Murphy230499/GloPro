import React, { useEffect, useState } from 'react';
import { Plus, CalendarDays, CheckCircle2, XCircle, UserCheck, Phone, Edit3 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useBranch } from '@/lib/BranchContext';
import { formatVND, todayStr } from '@/lib/format';
import AppointmentModal from '@/components/AppointmentModal';
import AppointmentGrid from '@/components/AppointmentGrid';
import { toast } from '@/components/Layout';
import { LayoutGrid, List } from 'lucide-react';
import Avatar from '@/components/Avatar';

const STATUS_COLORS = {
  pending: '#94A3B8', confirmed: '#60A5FA', checked_in: '#FBBF24',
  in_progress: '#A78BFA', completed: '#34D399', cancelled: '#F87171', no_show: '#FB7185'
};
const STATUS_LABEL = {
  pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', checked_in: 'Đã check-in',
  in_progress: 'Đang làm', completed: 'Hoàn thành', cancelled: 'Đã hủy', no_show: 'Không đến'
};

export default function Appointments() {
  const { currentBranchId } = useBranch();
  const [date, setDate] = useState(todayStr());
  const [appointments, setAppointments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => {
    setLoading(true);
    const filter = { date };
    if (currentBranchId !== 'all') filter.branch_id = currentBranchId;
    Promise.all([
    base44.entities.Appointment.filter(filter),
    base44.entities.Staff.filter(currentBranchId === 'all' ? {} : { branch_id: currentBranchId }),
    base44.entities.Customer.list()]
    ).then(([data, st, cus]) => {
      const cusMap = Object.fromEntries(cus.map((c) => [c.id, c]));
      const enriched = data.map((a) => ({
        ...a,
        customer_avatar_url: a.customer_id ? cusMap[a.customer_id]?.avatar_url : undefined
      }));
      setAppointments(enriched.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')));
      setStaff(st.filter((x) => x.is_active !== false));
      setCustomers(cus);
      setLoading(false);
    });
  };

  useEffect(load, [date, currentBranchId]);

  const updateStatus = async (appt, status) => {
    try {
      await base44.entities.Appointment.update(appt.id, { status });
      toast.success(`Đã chuyển: ${STATUS_LABEL[status]}`);
      load();
    } catch (e) {
      toast.error('Lỗi: ' + (e.message || e));
    }
  };

  const grouped = appointments.reduce((acc, a) => {
    (acc[a.status] = acc[a.status] || []).push(a);
    return acc;
  }, {});
  const orderedStatuses = ['pending', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Lịch hẹn</h1>
          <p className="text-slate-400 text-sm mt-1">Quản lý và điều phối lịch hẹn</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2">
            <CalendarDays className="w-4 h-4 text-pink-500" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-sm outline-none" />
          </div>
          <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1">
            <button onClick={() => setView('list')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${view === 'list' ? 'bg-primary text-white' : 'text-slate-500'}`}>
              <List className="w-4 h-4" /> <span className="hidden sm:inline">Danh sách</span>
            </button>
            <button onClick={() => setView('grid')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${view === 'grid' ? 'bg-primary text-white' : 'text-slate-500'}`}>
              <LayoutGrid className="w-4 h-4" /> <span className="hidden sm:inline">Lưới</span>
            </button>
          </div>
          <button onClick={() => {setEditing(null);setModalOpen(true);}}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm shadow-sm">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Đặt lịch</span>
          </button>
        </div>
      </div>

      {loading ?
      <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" /></div> :
      appointments.length === 0 ?
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <CalendarDays className="w-12 h-12 mx-auto text-slate-200 mb-3" />
          <p className="text-slate-400">Chưa có lịch hẹn nào trong ngày {date}</p>
        </div> :
      view === 'grid' ?
      <AppointmentGrid
        appointments={appointments}
        staff={staff}
        onApptClick={(a) => {setEditing(a);setModalOpen(true);}}
        onEmptyClick={() => {setEditing(null);setModalOpen(true);}} /> :


      <div className="space-y-5">
          {orderedStatuses.map((status) => {
          const list = grouped[status];
          if (!list || !list.length) return null;
          return (
            <div key={status}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[status] }} />
                  <h3 className="font-bold text-sm">{STATUS_LABEL[status]}</h3>
                  <span className="text-xs text-slate-400">({list.length})</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {list.map((a) =>
                <div key={a.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-bold text-sm">{a.start_time?.slice(0, 5)} - {a.end_time?.slice(0, 5) || '?'}</div>
                          <div className="text-xs text-slate-400 mr-16">{a.service_name || 'Chưa chọn dịch vụ'}</div>
                        </div>
                        <span className="text-[10px] font-semibold rounded-full px-5 py-1 mr-4" style={{ background: STATUS_COLORS[status] + '1a', color: STATUS_COLORS[status] }}>
                          {STATUS_LABEL[status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Avatar src={a.customer_avatar_url} name={a.customer_name} size={28} color="#FBBF24" />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-700 text-sm truncate">{a.customer_name}</div>
                          {a.customer_phone && <div className="text-xs text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3" />{a.customer_phone}</div>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        {(() => {
                      const staffIds = (a.services && a.services.length ? a.services : [a]).map((s) => s.staff_id).filter(Boolean);
                      const staffNames = (a.services && a.services.length ? a.services : [a]).map((s) => s.staff_name).filter(Boolean);
                      return staffIds.length > 0 || a.staff_name ?
                      <>
              {Array.from(new Set(staffIds.length ? staffIds : [a.staff_id])).slice(0, 3).map((sid, idx) => {
                          const stf = staff.find((s) => s.id === sid);
                          return <Avatar key={sid || idx} src={stf?.avatar_url} name={staffNames[idx] || stf?.full_name} size={20} color={stf?.avatar_color || '#FF6B9D'} />;
                        })}
              <span className="text-xs text-slate-500 truncate">{a.staff_name || staffNames.join(', ')}</span>
                            </> :
                      null;
                    })()}
                      </div>
                      {a.price > 0 && <div className="text-sm font-semibold text-pink-600 mt-1">{formatVND(a.price)}</div>}
                      {a.note && <div className="text-xs text-slate-400 mt-1 italic line-clamp-2">"{a.note}"</div>}
                      <div className="flex gap-1.5 mt-3 flex-wrap">
                        {status === 'pending' &&
                    <button onClick={() => updateStatus(a, 'confirmed')} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full bg-blue-50 text-blue-600 font-medium"><CheckCircle2 className="w-3.5 h-3.5" />Xác nhận</button>
                    }
                        {(status === 'confirmed' || status === 'checked_in') &&
                    <button onClick={() => updateStatus(a, 'in_progress')} className="text-xs px-2.5 py-1.5 rounded-full bg-purple-50 text-purple-600 font-medium">Bắt đầu</button>
                    }
                        {status === 'in_progress' &&
                    <button onClick={() => updateStatus(a, 'completed')} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full bg-green-50 text-green-600 font-medium"><UserCheck className="w-3.5 h-3.5" />Hoàn thành</button>
                    }
                        {(status === 'confirmed' || status === 'pending') &&
                    <button onClick={() => updateStatus(a, 'checked_in')} className="text-xs px-2.5 py-1.5 rounded-full bg-amber-50 text-amber-600 font-medium">Check-in</button>
                    }
                        {status !== 'cancelled' && status !== 'completed' &&
                    <button onClick={() => updateStatus(a, 'cancelled')} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full bg-red-50 text-red-500 font-medium"><XCircle className="w-3.5 h-3.5" />Hủy</button>
                    }
                        <button onClick={() => {setEditing(a);setModalOpen(true);}} className="text-xs px-2.5 py-1.5 rounded-full bg-slate-100 text-slate-600 font-medium"><Edit3 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                )}
                </div>
              </div>);

        })}
        </div>
      }

      <AppointmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
        branchId={currentBranchId}
        defaultDate={date}
        editing={editing} />
      
    </div>);

}