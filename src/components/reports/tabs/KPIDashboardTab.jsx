'use client';
import React from 'react';
import { Target, TrendingUp, Calendar, CheckCircle } from 'lucide-react';
import KPICard from '../KPICard';
import { formatVND } from '@/lib/format';

export default function KPIDashboardTab({ invoices = [], appointments = [] }) {
  const currentRev = invoices.reduce((s, i) => s + (i.total || 0), 0);
  const targetRev = 150000000; // Target 150M VND
  const revPercent = Math.min(100, Math.round((currentRev / targetRev) * 100));

  const currentAppts = appointments.length;
  const targetAppts = 200;
  const apptsPercent = Math.min(100, Math.round((currentAppts / targetAppts) * 100));

  const kpis = [
    { title: 'Chỉ số Doanh thu Mục tiêu tháng', current: formatVND(currentRev), target: formatVND(targetRev), percent: revPercent, color: 'emerald' },
    { title: 'Chỉ số Lượt Booking hoàn thành', current: `${currentAppts} lượt`, target: `${targetAppts} lượt`, percent: apptsPercent, color: 'blue' },
    { title: 'Mục tiêu Phát triển Khách hàng mới', current: '45 khách', target: '60 khách', percent: 75, color: 'purple' },
    { title: 'Chỉ số Doanh số Bán lẻ Mỹ phẩm', current: '18.500.000đ', target: '25.000.000đ', percent: 74, color: 'amber' }
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard title="Tiến Độ KPI Doanh Thu" value={`${revPercent}%`} growth={10} icon={Target} color="emerald" />
        <KPICard title="Tiến Độ KPI Lịch Hẹn" value={`${apptsPercent}%`} growth={8} icon={Calendar} color="blue" />
        <KPICard title="Dự Báo Cuối Tháng (Forecast)" value={formatVND(Math.round(currentRev * 1.15))} growth={15} icon={TrendingUp} color="purple" />
        <KPICard title="Tỷ Lệ Đạt KPI Chung" value="82%" growth={5} icon={CheckCircle} color="amber" />
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-6">
        <h3 className="text-sm font-bold text-slate-800">Bảng Tiến Độ Chỉ Số KPI Chi Tiết Tháng</h3>
        
        <div className="space-y-5">
          {kpis.map((k, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">{k.title}</span>
                <span className="font-bold text-slate-900">{k.current} / <span className="text-slate-400 font-normal">{k.target}</span> ({k.percent}%)</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    k.color === 'emerald' ? 'bg-emerald-500' : k.color === 'blue' ? 'bg-blue-500' : k.color === 'purple' ? 'bg-purple-500' : 'bg-amber-500'
                  }`} 
                  style={{ width: `${k.percent}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
