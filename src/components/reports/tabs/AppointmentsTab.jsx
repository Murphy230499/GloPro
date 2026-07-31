'use client';
import React from 'react';
import { Calendar, CheckCircle2, Clock, XCircle, AlertCircle, UserCheck, Play } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import KPICard from '../KPICard';
import DataTable from '../DataTable';

const STATUS_THEMES = {
  pending: { label: 'Chờ xác nhận', color: '#F59E0B', bg: 'bg-amber-50 text-amber-700' },
  confirmed: { label: 'Đã xác nhận', color: '#3B82F6', bg: 'bg-blue-50 text-blue-700' },
  checked_in: { label: 'Đã check-in', color: '#F97316', bg: 'bg-orange-50 text-orange-700' },
  in_progress: { label: 'Đang thực hiện', color: '#8B5CF6', bg: 'bg-purple-50 text-purple-700' },
  completed: { label: 'Hoàn thành', color: '#10B981', bg: 'bg-emerald-50 text-emerald-700' },
  cancelled: { label: 'Đã hủy', color: '#EF4444', bg: 'bg-rose-50 text-rose-700' },
  no_show: { label: 'Không đến (No-show)', color: '#64748B', bg: 'bg-slate-100 text-slate-700' }
};

export default function AppointmentsTab({ appointments = [] }) {
  const total = appointments.length;
  
  const pending = appointments.filter(a => a.status === 'pending').length;
  const confirmed = appointments.filter(a => a.status === 'confirmed').length;
  const checkedIn = appointments.filter(a => a.status === 'checked_in').length;
  const inProgress = appointments.filter(a => a.status === 'in_progress').length;
  const completed = appointments.filter(a => a.status === 'completed').length;
  const cancelled = appointments.filter(a => a.status === 'cancelled').length;
  const noShow = appointments.filter(a => a.status === 'no_show').length;

  const completedRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const cancelRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;
  const noShowRate = total > 0 ? Math.round((noShow / total) * 100) : 0;

  const statusData = [
    { name: 'Chờ xác nhận', count: pending, fill: STATUS_THEMES.pending.color },
    { name: 'Đã xác nhận', count: confirmed, fill: STATUS_THEMES.confirmed.color },
    { name: 'Đã check-in', count: checkedIn, fill: STATUS_THEMES.checked_in.color },
    { name: 'Đang làm', count: inProgress, fill: STATUS_THEMES.in_progress.color },
    { name: 'Hoàn thành', count: completed, fill: STATUS_THEMES.completed.color },
    { name: 'Đã hủy', count: cancelled, fill: STATUS_THEMES.cancelled.color },
    { name: 'Không đến', count: noShow, fill: STATUS_THEMES.no_show.color }
  ];

  const columns = [
    { key: 'customer_name', label: 'Khách hàng' },
    { key: 'service_name', label: 'Dịch vụ' },
    { key: 'staff_name', label: 'Kỹ thuật viên' },
    { key: 'date', label: 'Ngày hẹn' },
    { key: 'start_time', label: 'Giờ' },
    { 
      key: 'status', 
      label: 'Trạng thái', 
      render: (v) => {
        const theme = STATUS_THEMES[v] || { label: v || 'Đã đặt', bg: 'bg-blue-50 text-blue-700' };
        return (
          <span className={`px-2.5 py-0.5 rounded-md font-semibold text-[11px] ${theme.bg}`}>
            {theme.label}
          </span>
        );
      }
    }
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <KPICard title="Tổng Lượt Booking" value={`${total} đơn`} growth={10} icon={Calendar} color="blue" />
        <KPICard title="Tỷ Lệ Hoàn Thành" value={`${completedRate}%`} growth={4} icon={CheckCircle2} color="emerald" />
        <KPICard title="Tỷ Lệ Hủy Lịch" value={`${cancelRate}%`} growth={-2} icon={XCircle} color="rose" />
        <KPICard title="Tỷ Lệ No-show" value={`${noShowRate}%`} growth={0} icon={AlertCircle} color="amber" />
        <KPICard title="Đang thực hiện" value={`${inProgress} lịch`} growth={2} icon={Play} color="purple" />
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3 min-w-0">
        <h3 className="text-sm font-bold text-slate-800">Phân Phối Chi Tiết Trạng Thế Lịch Hẹn</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={statusData} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => [`${v} lượt`, 'Số lượng']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 11 }} />
            <Bar dataKey="count" name="Số lượng" radius={[6, 6, 0, 0]}>
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <DataTable columns={columns} data={appointments} emptyText="Không có lịch hẹn trong kỳ" />
    </div>
  );
}
