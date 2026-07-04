import React, { useEffect, useState } from 'react';
import { TrendingUp, CalendarDays, Users, UserSquare, Clock, Sparkles } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from
'recharts';
import { base44 } from '@/api/base44Client';
import { useBranch } from '@/lib/BranchContext';
import { formatVND, todayStr, last7Days } from '@/lib/format';
import StatCard from '@/components/StatCard';

const STATUS_COLORS = {
  pending: '#94A3B8', confirmed: '#60A5FA', checked_in: '#FBBF24',
  in_progress: '#A78BFA', completed: '#34D399', cancelled: '#F87171', no_show: '#FB7185'
};
const STATUS_LABEL = {
  pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', checked_in: 'Đã check-in',
  in_progress: 'Đang làm', completed: 'Hoàn thành', cancelled: 'Đã hủy', no_show: 'Không đến'
};

export default function Dashboard() {
  const { currentBranchId } = useBranch();
  const [invoices, setInvoices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const filter = currentBranchId === 'all' ? {} : { branch_id: currentBranchId };
    Promise.all([
    base44.entities.Invoice.filter(filter),
    base44.entities.Appointment.filter(filter),
    base44.entities.Customer.list(),
    base44.entities.Staff.filter(filter)]
    ).then(([inv, appts, cus, st]) => {
      setInvoices(inv);
      setAppointments(appts);
      setCustomers(cus);
      setStaff(st);
      setLoading(false);
    });
  }, [currentBranchId]);

  const today = todayStr();
  const todayRevenue = invoices.filter((i) => i.date === today).reduce((s, i) => s + (i.total || 0), 0);
  const todayAppts = appointments.filter((a) => a.date === today);
  const completedToday = todayAppts.filter((a) => a.status === 'completed').length;

  const days = last7Days();
  const chartData = days.map((d) => ({
    name: d.label,
    revenue: invoices.filter((i) => i.date === d.key).reduce((s, i) => s + (i.total || 0), 0)
  }));

  const upcoming = [...todayAppts].
  filter((a) => a.status !== 'cancelled' && a.status !== 'completed' && a.status !== 'no_show').
  sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')).
  slice(0, 6);

  const serviceRevenue = {};
  invoices.forEach((inv) => {
    (inv.items || []).forEach((it) => {
      if (!it.name) return;
      serviceRevenue[it.name] = (serviceRevenue[it.name] || 0) + (it.price || 0) * (it.qty || 1);
    });
  });
  const topServices = Object.entries(serviceRevenue).sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Tổng quan</h1>
        <p className="text-slate-400 text-sm mt-1">Xin chào 👋 Đây là tình hình hôm nay</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={TrendingUp} label="Doanh thu hôm nay" value={formatVND(todayRevenue)} color="#34D399" sub={`${invoices.filter((i) => i.date === today).length} hóa đơn`} />
        <StatCard icon={CalendarDays} label="Lịch hẹn hôm nay" value={todayAppts.length} color="#60A5FA" sub={`${completedToday} hoàn thành`} />
        <StatCard icon={Users} label="Khách hàng" value={customers.length} color="#FBBF24" sub="toàn chuỗi" />
        <StatCard icon={UserSquare} label="Nhân viên" value={staff.length} color="#F97316" sub="đang làm việc" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-bold mb-1 text-xl">Doanh thu 7 ngày qua</h3>
          <p className="text-xs text-slate-400 mb-3">Theo ngày</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={26}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
              <YAxis tickFormatter={(v) => v >= 1000000 ? v / 1000000 + 'tr' : v >= 1000 ? Math.round(v / 1000) + 'k' : v} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} width={40} />
              <Tooltip formatter={(v) => formatVND(v)} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
              <Bar dataKey="revenue" radius={[8, 8, 0, 0]} fill="#FF6B9D" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-bold mb-3 flex items-center gap-2 text-xl">Lịch hẹn sắp tới</h3>
          {upcoming.length === 0 ?
          <div className="text-center py-10 text-slate-400 text-sm">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              Không có lịch hẹn nào sắp tới
            </div> :

          <div className="space-y-2">
              {upcoming.map((a) =>
            <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <div className="text-center w-12">
                    <div className="text-sm font-bold">{a.start_time?.slice(0, 5)}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{a.customer_name}</div>
                    <div className="text-xs text-slate-400 truncate">{a.service_name || 'Chưa chọn dịch vụ'}</div>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-1 rounded-full" style={{ background: STATUS_COLORS[a.status] + '1a', color: STATUS_COLORS[a.status] }}>
                    {STATUS_LABEL[a.status]}
                  </span>
                </div>
            )}
            </div>
          }
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <h3 className="font-bold mb-3 text-xl">Top dịch vụ theo doanh thu</h3>
        {topServices.length === 0 ?
        <p className="text-slate-400 text-sm text-center py-6">Chưa có dữ liệu</p> :

        <div className="space-y-2.5">
            {topServices.map(([name, rev], i) => {
            const max = topServices[0][1];
            return (
              <div key={name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{i + 1}. {name}</span>
                    <span className="font-semibold text-pink-600">{formatVND(rev)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-pink-400 to-purple-500" style={{ width: `${rev / max * 100}%` }} />
                  </div>
                </div>);

          })}
          </div>
        }
      </div>
    </div>);

}