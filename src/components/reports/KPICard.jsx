'use client';
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useT } from '@/lib/i18n';

export default function KPICard({ title, value, growth, compareText, icon: Icon, color = 'blue', onClick }) {
  const t = useT();
  const isPositive = growth > 0;
  const isNegative = growth < 0;

  const colorStyles = {
    blue: 'bg-blue-50/80 text-blue-600 border-blue-100',
    purple: 'bg-purple-50/80 text-purple-600 border-purple-100',
    emerald: 'bg-emerald-50/80 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50/80 text-amber-600 border-amber-100',
    rose: 'bg-rose-50/80 text-rose-600 border-rose-100',
    indigo: 'bg-indigo-50/80 text-indigo-600 border-indigo-100',
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer group ${onClick ? 'hover:border-blue-300' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-xl border ${colorStyles[color] || colorStyles.blue} transition-transform group-hover:scale-105`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 min-w-0">
        <div className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 tracking-tight leading-snug break-all" title={typeof value === 'string' ? value : undefined}>{value}</div>
        
        <div className="flex items-center gap-1.5 mt-2 text-xs">
          {growth !== undefined && growth !== null && (
            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md font-semibold text-[11px] ${
              isPositive 
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' 
                : isNegative 
                ? 'bg-rose-50 text-rose-600 border border-rose-200/60' 
                : 'bg-slate-100 text-slate-600'
            }`}>
              {isPositive && <TrendingUp className="w-3 h-3" />}
              {isNegative && <TrendingDown className="w-3 h-3" />}
              {!isPositive && !isNegative && <Minus className="w-3 h-3" />}
              {Math.abs(growth)}%
            </span>
          )}
          <span className="text-slate-400 text-[11px] font-normal truncate">{compareText || t('reports.vs_prev_period', 'vs previous period')}</span>
        </div>
      </div>
    </div>
  );
}
