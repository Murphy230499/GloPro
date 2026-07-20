'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Search, User, CalendarDays, Scissors, Package, UserSquare, LayoutDashboard, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { base44 } from '@/api/base44Client';
import { useBranch } from '@/lib/BranchContext';
import { formatVND } from '@/lib/format';

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const PAGES = [
{ label: 'Tổng quan', to: '/', icon: LayoutDashboard },
{ label: 'Lịch hẹn', to: '/appointments', icon: CalendarDays },
{ label: 'Thu ngân', to: '/pos', icon: Package },
{ label: 'Khách hàng', to: '/customers', icon: User },
{ label: 'Nhân viên', to: '/staff', icon: UserSquare },
{ label: 'Dịch vụ & Sản phẩm', to: '/services', icon: Scissors },
{ label: 'Báo cáo', to: '/reports', icon: BarChart3 },
{ label: 'Cài đặt', to: '/settings', icon: SettingsIcon }];


export default function GlobalSearch() {
  const [q, setQ] = useState('');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { currentBranchId } = useBranch();
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => {if (ref.current && !ref.current.contains(e.target)) setOpen(false);};
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {setGroups([]);setLoading(false);return;}
    let active = true;
    setLoading(true);
    const t = setTimeout(async () => {
      const n = norm(term);
      const inBranch = (x) => currentBranchId === 'all' || !x.branch_id || x.branch_id === currentBranchId;
      try {
        const [cust, appt, svc, prod, stf] = await Promise.all([
        base44.entities.Customer.list('-updated_date', 200),
        base44.entities.Appointment.list('-created_date', 200),
        base44.entities.Service.list('-updated_date', 200),
        base44.entities.Product.list('-updated_date', 200),
        base44.entities.Staff.list('-updated_date', 200)]
        );
        if (!active) return;
        const g = [];
        const pages = PAGES.filter((p) => norm(p.label).includes(n));
        if (pages.length) g.push({ label: 'Trang & Cài đặt', items: pages.map((p) => ({ title: p.label, to: p.to, icon: p.icon })) });

        const cM = cust.filter((c) => inBranch(c) && (norm(c.name).includes(n) || norm(c.phone || '').includes(n))).slice(0, 5);
        if (cM.length) g.push({ label: 'Khách hàng', items: cM.map((c) => ({ title: c.name, sub: c.phone, to: '/customers', icon: User })) });

        const aM = appt.filter((a) => inBranch(a) && norm(a.customer_name || '').includes(n)).slice(0, 5);
        if (aM.length) g.push({ label: 'Lịch hẹn', items: aM.map((a) => ({ title: a.customer_name, sub: `${a.date} ${a.start_time || ''}`, to: '/appointments', icon: CalendarDays })) });

        const sM = svc.filter((s) => inBranch(s) && norm(s.name).includes(n)).slice(0, 5);
        if (sM.length) g.push({ label: 'Dịch vụ', items: sM.map((s) => ({ title: s.name, sub: formatVND(s.price), to: '/services', icon: Scissors })) });

        const pM = prod.filter((p) => inBranch(p) && norm(p.name).includes(n)).slice(0, 5);
        if (pM.length) g.push({ label: 'Sản phẩm', items: pM.map((p) => ({ title: p.name, sub: formatVND(p.price), to: '/services', icon: Package })) });

        const stM = stf.filter((s) => inBranch(s) && norm(s.full_name || '').includes(n)).slice(0, 5);
        if (stM.length) g.push({ label: 'Nhân viên', items: stM.map((s) => ({ title: s.full_name, sub: s.role, to: '/staff', icon: UserSquare })) });

        setGroups(g);
      } finally {if (active) setLoading(false);}
    }, 300);
    return () => {active = false;clearTimeout(t);};
  }, [q, currentBranchId]);

  const go = (to) => {router.push(to);setOpen(false);setQ('');};

  return (
    <div ref={ref} className="relative w-full max-w-xl">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-pink-200 mx-6 rounded-lg bg-slate-100">
        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Tìm khách, lịch hẹn, dịch vụ, nhân viên..."
          className="bg-transparent outline-none text-sm w-full" />
        
        {loading && <div className="w-4 h-4 border-2 border-pink-200 border-t-pink-500 rounded-full animate-spin shrink-0" />}
      </div>
      {open && q.trim().length >= 2 &&
      <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 max-h-[70vh] overflow-y-auto">
          {!loading && groups.length === 0 &&
        <div className="p-6 text-center text-sm text-slate-400">Không tìm thấy kết quả cho "{q}"</div>
        }
          {groups.map((g, gi) =>
        <div key={gi} className={gi > 0 ? 'border-t border-slate-50' : ''}>
              <div className="px-4 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">{g.label}</div>
              {g.items.map((it, i) => {
            const Icon = it.icon;
            return (
              <button key={i} onClick={() => go(it.to)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{it.title}</div>
                      {it.sub && <div className="text-xs text-slate-400 truncate">{it.sub}</div>}
                    </div>
                  </button>);

          })}
            </div>
        )}
        </div>
      }
    </div>);

}