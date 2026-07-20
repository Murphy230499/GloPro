'use client';
import React, { useEffect, useState } from 'react';
import { TrendingUp, ShoppingBag, UserSquare, Calendar } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { base44 } from '@/api/base44Client';
import { useBranch } from '@/lib/BranchContext';
import { formatVND } from '@/lib/format';

const PIE_COLORS = ['#FF6B9D', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F97316', '#94A3B8', '#C084FC'];

export default function Reports() {
  const { currentBranchId, branches, currentBranch } = useBranch();
  const [invoices, setInvoices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    const filter = currentBranchId === 'all' ? {} : { branch_id: currentBranchId };
    Promise.all([
      base44.entities.Invoice.filter(filter),
      base44.entities.Staff.filter(filter),
    ]).then(([inv, st]) => {
      setInvoices(inv);
      setStaff(st);
      setLoading(false);
    });
  }, [currentBranchId]);

  const monthInvoices = invoices.filter((i) => (i.date || '').startsWith(month));
  const totalRevenue = monthInvoices.reduce((s, i) => s + (i.total || 0), 0);
  const totalTip = monthInvoices.reduce((s, i) => s + (i.tip || 0), 0);
  const totalInvoices = monthInvoices.length;

  // By branch (only meaningful when all branches)
  const byBranch = currentBranchId === 'all'
    ? branches.map((b) => ({
        name: b.name.replace('GlowPro ', ''),
        revenue: invoices.filter((i) => i.branch_id === b.id && (i.date || '').startsWith(month)).reduce((s, i) => s + (i.total || 0), 0),
      }))
    : [];

  // By category
  const byCategory = {};
  monthInvoices.forEach((inv) => {
    (inv.items || []).forEach((it) => {
      byCategory[it.name] = (byCategory[it.name] || 0) + (it.price || 0) * (it.qty || 1);
    });
  });
  const categoryData = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));

  // By staff
  const byStaff = staff.map((s) => ({
    name: s.full_name,
    revenue: monthInvoices.reduce((sum, inv) => sum + (inv.items || []).filter((it) => it.staff_id === s.id).reduce((a, it) => a + (it.price || 0) * (it.qty || 1), 0), 0),
  })).sort((a, b) => b.revenue - a.revenue);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Báo cáo</h1>
          <p className="text-slate-400 text-sm mt-1">{currentBranchId === 'all' ? 'Toàn hệ thống' : currentBranch?.name}</p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2">
          <Calendar className="w-4 h-4 text-purple-500" />
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="text-sm outline-none bg-transparent" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl p-5 text-white">
          <TrendingUp className="w-6 h-6 opacity-80" />
          <div className="text-2xl font-bold mt-2">{formatVND(totalRevenue)}</div>
          <div className="text-sm opacity-80">Doanh thu tháng</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <ShoppingBag className="w-6 h-6 text-blue-500" />
          <div className="text-2xl font-bold mt-2">{totalInvoices}</div>
          <div className="text-sm text-slate-400">Hóa đơn</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <UserSquare className="w-6 h-6 text-orange-500" />
          <div className="text-2xl font-bold mt-2">{formatVND(totalTip)}</div>
          <div className="text-sm text-slate-400">Tip</div>
        </div>
      </div>

      {currentBranchId === 'all' && byBranch.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-bold mb-3">Doanh thu theo cơ sở</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byBranch} layout="vertical" barSize={24}>
              <CartesianGrid horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tickFormatter={(v) => v >= 1000000 ? (v / 1000000) + 'tr' : Math.round(v / 1000) + 'k'} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} width={80} />
              <Tooltip formatter={(v) => formatVND(v)} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
              <Bar dataKey="revenue" radius={[0, 8, 8, 0]} fill="#A78BFA" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-bold mb-3">Cơ cấu doanh thu</h3>
          {categoryData.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-10">Chưa có dữ liệu</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
                    {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatVND(v)} contentStyle={{ borderRadius: 12, border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {categoryData.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />{c.name}</span>
                    <span className="font-semibold">{formatVND(c.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-bold mb-3">Hiệu suất nhân viên</h3>
          {byStaff.every((s) => s.revenue === 0) ? (
            <p className="text-slate-400 text-sm text-center py-10">Chưa có dữ liệu doanh thu</p>
          ) : (
            <div className="space-y-3">
              {byStaff.filter((s) => s.revenue > 0).map((s, i) => {
                const max = byStaff[0].revenue || 1;
                return (
                  <div key={s.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{i + 1}. {s.name}</span>
                      <span className="font-semibold text-pink-600">{formatVND(s.revenue)}</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-pink-500" style={{ width: `${(s.revenue / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}