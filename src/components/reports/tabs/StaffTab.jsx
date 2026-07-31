'use client';
import React from 'react';
import { UserCheck, DollarSign, Award, Gift } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import KPICard from '../KPICard';
import DataTable from '../DataTable';
import { formatVND } from '@/lib/format';

export default function StaffTab({ staff = [], invoices = [] }) {
  const totalStaff = staff.length;
  const totalTip = invoices.reduce((s, i) => s + (i.tip || 0), 0);

  const staffStats = staff.map(st => {
    let rev = 0;
    let serviceRev = 0;
    let productRev = 0;

    invoices.forEach(inv => {
      (inv.items || []).forEach(it => {
        if (it.staff_id === st.id) {
          const itemVal = (it.price || 0) * (it.qty || 1);
          rev += itemVal;
          if (it.type === 'product') productRev += itemVal;
          else serviceRev += itemVal;
        }
      });
    });

    const comm = Math.round(rev * 0.1); // 10% average commission
    return {
      id: st.id,
      name: st.full_name,
      role: st.role || 'Kỹ thuật viên',
      revenue: rev,
      serviceRev,
      productRev,
      commission: comm
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const totalComm = staffStats.reduce((s, x) => s + x.commission, 0);
  const totalRev = staffStats.reduce((s, x) => s + x.revenue, 0);

  const columns = [
    { key: 'name', label: 'Họ tên Nhân viên' },
    { key: 'role', label: 'Vị trí / Chức danh' },
    { key: 'serviceRev', label: 'Doanh số Dịch vụ', align: 'right', render: (v) => formatVND(v) },
    { key: 'productRev', label: 'Doanh số Sản phẩm', align: 'right', render: (v) => formatVND(v) },
    { key: 'revenue', label: 'Tổng Doanh Số', align: 'right', render: (v) => <span className="font-bold text-blue-600">{formatVND(v)}</span> },
    { key: 'commission', label: 'Hoa hồng Ước tính', align: 'right', render: (v) => <span className="font-bold text-emerald-600">{formatVND(v)}</span> }
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard title="Tổng Nhân Viên Hoạt Động" value={totalStaff} growth={0} icon={UserCheck} color="blue" />
        <KPICard title="Tổng Doanh Số Tạo Ra" value={formatVND(totalRev)} growth={14} icon={DollarSign} color="emerald" />
        <KPICard title="Tổng Hoa Hồng Phát Sinh" value={formatVND(totalComm)} growth={12} icon={Award} color="purple" />
        <KPICard title="Tổng Tiền Tip Từ Khách" value={formatVND(totalTip)} growth={18} icon={Gift} color="amber" />
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3 min-w-0">
        <h3 className="text-sm font-bold text-slate-800">Cơ Cấu Doanh Số Nhân Viên (Dịch vụ vs Sản phẩm)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={staffStats.slice(0, 8)} barSize={22}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => v >= 1000000 ? (v / 1000000) + 'tr' : v} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => formatVND(v)} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 11 }} />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 9 }} />
            <Bar dataKey="serviceRev" name="Doanh số Dịch vụ" stackId="a" fill="#3B82F6" />
            <Bar dataKey="productRev" name="Doanh số Sản phẩm" stackId="a" fill="#10B981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <DataTable columns={columns} data={staffStats} emptyText="Không có dữ liệu nhân viên" />
    </div>
  );
}
