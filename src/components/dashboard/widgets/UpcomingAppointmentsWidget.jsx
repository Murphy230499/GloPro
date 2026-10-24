'use client';
import React from 'react';
import { CalendarDays, Sparkles, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useT } from '@/lib/i18n';

const STATUS_COLORS = {
  pending: '#94A3B8',
  confirmed: '#60A5FA',
  checked_in: '#FBBF24',
  in_progress: '#A78BFA',
  completed: '#34D399',
  cancelled: '#F87171',
  no_show: '#F97316'
};

export default function UpcomingAppointmentsWidget({ appointments = [], statusLabels = {}, tintColor = '#FF3B7A' }) {
  const { t } = useT();

  return (
    <div className="ios-glass-card p-4 md:p-5 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${tintColor}15`, color: tintColor }}>
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm md:text-base leading-tight">
              {t('dashboard.lich_hen_sap_toi', 'Lịch hẹn sắp tới')}
            </h3>
            <p className="text-[11px] text-slate-400">
              {appointments.length} ca chờ phục vụ
            </p>
          </div>
        </div>

        <Link
          href="/appointments"
          className="text-[11px] font-bold flex items-center gap-1 hover:underline text-slate-500 hover:text-slate-800"
        >
          Xem tất cả <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[220px] space-y-2 pr-1 no-scrollbar">
        {appointments.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            <Sparkles className="w-7 h-7 mx-auto mb-2 text-slate-300" />
            {t('dashboard.khong_co_lich_hen_sap_toi', 'Không có lịch hẹn nào sắp tới')}
          </div>
        ) : (
          appointments.map((a) => {
            const statusColor = STATUS_COLORS[a.status] || '#94A3B8';
            return (
              <div 
                key={a.id} 
                className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/70 border border-slate-100 hover:border-slate-200 hover:bg-white transition-all shadow-2xs"
              >
                <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center shrink-0">
                  <Clock className="w-3 h-3 text-slate-400 mb-0.5" />
                  <span className="text-xs font-extrabold text-slate-700">
                    {a.start_time?.slice(0, 5) || '--:--'}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs md:text-sm text-slate-800 truncate">
                    {a.customer_name || 'Khách vãng lai'}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {a.service_name || t('dashboard.chua_chon_dich_vu', 'Dịch vụ làm đẹp')}
                  </div>
                </div>

                <span 
                  className="text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0 border"
                  style={{ 
                    background: `${statusColor}18`, 
                    color: statusColor,
                    borderColor: `${statusColor}35`
                  }}
                >
                  {statusLabels[a.status] || a.status}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
