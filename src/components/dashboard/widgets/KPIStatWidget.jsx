'use client';
import React from 'react';
import { TrendingUp, CalendarDays, Users, UserSquare, ArrowUpRight } from 'lucide-react';
import { formatVND } from '@/lib/format';

export default function KPIStatWidget({ type, value, sub, size = 'small', tintColor = '#FF3B7A' }) {
  let title = 'Chỉ số';
  let Icon = TrendingUp;
  let iconBg = 'bg-emerald-50 text-emerald-600';
  let formattedValue = value;

  if (type === 'kpi_revenue') {
    title = 'Doanh thu hôm nay';
    Icon = TrendingUp;
    iconBg = 'bg-emerald-500/10 text-emerald-600';
    formattedValue = typeof value === 'number' ? formatVND(value) : value;
  } else if (type === 'kpi_appts') {
    title = 'Lịch hẹn hôm nay';
    Icon = CalendarDays;
    iconBg = 'bg-blue-500/10 text-blue-600';
  } else if (type === 'kpi_customers') {
    title = 'Khách hàng toàn chuỗi';
    Icon = Users;
    iconBg = 'bg-amber-500/10 text-amber-600';
  } else if (type === 'kpi_staff') {
    title = 'KTV đang làm việc';
    Icon = UserSquare;
    iconBg = 'bg-orange-500/10 text-orange-600';
  }

  const isSmall = size === 'small';

  return (
    <div className={`ios-glass-card h-full p-4 md:p-5 flex flex-col justify-between relative overflow-hidden group hover:scale-[1.01] transition-all duration-300`}>
      {/* Background ambient glow */}
      <div 
        className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl opacity-15 pointer-events-none transition-all group-hover:opacity-25"
        style={{ background: tintColor }}
      />

      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-bold text-slate-500 tracking-tight">
          {title}
        </span>
        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${iconBg} transition-transform group-hover:scale-110`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-1">
        <div className={`font-extrabold text-slate-800 tracking-tight truncate ${isSmall ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'}`}>
          {formattedValue}
        </div>
        {sub && (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 mt-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="truncate">{sub}</span>
          </div>
        )}
      </div>
    </div>
  );
}
