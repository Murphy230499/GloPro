'use client';
import React from 'react';
import { Target, TrendingUp, Calendar, CheckCircle } from 'lucide-react';
import KPICard from '../KPICard';
import { formatVND } from '@/lib/format';
import { useT } from '@/lib/i18n';

export default function KPIDashboardTab({ invoices = [], appointments = [] }) {
  const t = useT();

  const currentRev = invoices.reduce((s, i) => s + (i.total || 0), 0);
  const targetRev = 150000000;
  const revPercent = Math.min(100, Math.round((currentRev / targetRev) * 100));

  const currentAppts = appointments.length;
  const targetAppts = 200;
  const apptsPercent = Math.min(100, Math.round((currentAppts / targetAppts) * 100));

  const kpis = [
    { title: t('reports.kpi_monthly_target_rev', 'Monthly Target Revenue KPI'), current: formatVND(currentRev), target: formatVND(targetRev), percent: revPercent, color: 'emerald' },
    { title: t('reports.kpi_completed_bookings', 'Completed Bookings KPI'), current: `${currentAppts} ${t('reports.unit_bookings', 'bookings')}`, target: `${targetAppts} ${t('reports.unit_bookings', 'bookings')}`, percent: apptsPercent, color: 'blue' },
    { title: t('reports.kpi_new_cust_target', 'New Customer Acquisition Target'), current: `45 ${t('reports.customers_unit', 'customers')}`, target: `60 ${t('reports.customers_unit', 'customers')}`, percent: 75, color: 'purple' },
    { title: t('reports.kpi_cosmetics_retail_target', 'Cosmetics Retail Revenue Target'), current: '18.500.000đ', target: '25.000.000đ', percent: 74, color: 'amber' }
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard title={t('reports.kpi_rev_progress', 'Revenue KPI Progress')} value={`${revPercent}%`} growth={10} icon={Target} color="emerald" />
        <KPICard title={t('reports.kpi_appt_progress', 'Appointment KPI Progress')} value={`${apptsPercent}%`} growth={8} icon={Calendar} color="blue" />
        <KPICard title={t('reports.kpi_eom_forecast', 'End-of-Month Forecast')} value={formatVND(Math.round(currentRev * 1.15))} growth={15} icon={TrendingUp} color="purple" />
        <KPICard title={t('reports.kpi_overall_achievement', 'Overall KPI Achievement Rate')} value="82%" growth={5} icon={CheckCircle} color="amber" />
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-6">
        <h3 className="text-sm font-bold text-slate-800">{t('reports.kpi_progress_table', 'Detailed Monthly KPI Progress Table')}</h3>
        
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
