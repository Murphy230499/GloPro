import React, { useEffect, useState, useRef } from 'react';
import { Bell, CalendarPlus, CalendarX, CheckCircle2, XCircle, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useBranch } from '@/lib/BranchContext';
import { todayStr, formatVND } from '@/lib/format';
import moment from 'moment';

const TYPE = {
  new: { icon: CalendarPlus, color: '#60A5FA', bg: '#DBEAFE' },
  cancel: { icon: CalendarX, color: '#EF4444', bg: '#FEE2E2' },
  paid: { icon: CheckCircle2, color: '#10B981', bg: '#D1FAE5' },
  refund: { icon: XCircle, color: '#F97316', bg: '#FFEDD5' },
  noshift: { icon: UserX, color: '#FBBF24', bg: '#FEF3C7' },
};

export default function NotificationCenter() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('gp_notif_read') || '[]')); } catch { return new Set(); }
  });
  const ref = useRef(null);
  const nav = useNavigate();
  const { currentBranchId } = useBranch();

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    const inBranch = (x) => currentBranchId === 'all' || !x.branch_id || x.branch_id === currentBranchId;
    const today = todayStr();
    Promise.all([
      base44.entities.Appointment.list('-created_date', 60),
      base44.entities.Invoice.list('-created_date', 60),
      base44.entities.Shift.filter({ date: today }),
    ]).then(([appts, invs, shifts]) => {
      const n = [];
      appts.filter(inBranch).forEach((a) => {
        if (a.status === 'cancelled') n.push({ id: 'c' + a.id, type: 'cancel', title: 'Lịch hẹn đã hủy', desc: `${a.customer_name} • ${a.date} ${a.start_time || ''}`, to: '/appointments', time: a.created_date });
        else if (a.status === 'pending') n.push({ id: 'p' + a.id, type: 'new', title: 'Lịch hẹn mới', desc: `${a.customer_name} • ${a.date} ${a.start_time || ''}`, to: '/appointments', time: a.created_date });
      });
      invs.filter(inBranch).forEach((i) => {
        if (i.status === 'paid') n.push({ id: 'ip' + i.id, type: 'paid', title: 'Thanh toán thành công', desc: `${i.customer_name} • ${formatVND(i.total)}`, to: '/pos', time: i.created_date });
        else if (i.status === 'refunded') n.push({ id: 'ir' + i.id, type: 'refund', title: 'Hoá đơn đã hoàn', desc: `${i.customer_name} • ${formatVND(i.total)}`, to: '/reports', time: i.created_date });
      });
      shifts.filter(inBranch).forEach((s) => {
        if (s.status === 'scheduled') n.push({ id: 's' + s.id, type: 'noshift', title: 'Nhân viên chưa check-in', desc: `${s.staff_name} • ca ${s.start_time}`, to: '/staff', time: s.created_date });
      });
      n.sort((a, b) => (b.time || '').localeCompare(a.time || ''));
      setItems(n.slice(0, 20));
    });
  }, [currentBranchId]);

  const unread = items.filter((i) => !readIds.has(i.id)).length;

  const markAllRead = () => {
    const ids = new Set([...readIds, ...items.map((i) => i.id)]);
    setReadIds(ids);
    localStorage.setItem('gp_notif_read', JSON.stringify([...ids]));
  };

  const openItem = (it) => {
    const ids = new Set([...readIds, it.id]);
    setReadIds(ids);
    localStorage.setItem('gp_notif_read', JSON.stringify([...ids]));
    nav(it.to);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button onClick={() => setOpen((v) => !v)} className="relative w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200">
        <Bell className="w-5 h-5 text-slate-600" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 max-h-[70vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="font-bold">Thông báo</span>
            {unread > 0 && <button onClick={markAllRead} className="text-xs font-semibold text-pink-600">Đánh dấu đã đọc</button>}
          </div>
          <div className="overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">Không có thông báo mới</div>
            ) : items.map((it) => {
              const T = TYPE[it.type];
              const Icon = T.icon;
              const isUnread = !readIds.has(it.id);
              return (
                <button key={it.id} onClick={() => openItem(it)} className={`w-full flex gap-3 px-4 py-3 text-left border-b border-slate-50 hover:bg-slate-50 ${isUnread ? 'bg-pink-50/40' : ''}`}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: T.bg }}>
                    <Icon className="w-5 h-5" style={{ color: T.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold truncate">{it.title}</span>
                      {isUnread && <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0" />}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{it.desc}</div>
                    <div className="text-[11px] text-slate-300 mt-0.5">{it.time ? moment(it.time).fromNow() : ''}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}