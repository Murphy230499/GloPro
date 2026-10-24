'use client';
import React from 'react';

export default function StatCard({ icon: Icon, label, value, color = '#FF6B9D', sub }) {
  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-3 md:p-4 border border-slate-200/60 dark:border-slate-800/80 shadow-xs transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700">
      <div className="flex items-center justify-between">
        <div
          className="w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: color + '1a' }}
        >
          <Icon className="w-4 h-4 md:w-5 md:h-5" style={{ color }} />
        </div>
        {sub && (
          <span className="font-medium text-slate-400 dark:text-slate-400 text-xs md:text-sm max-w-[60%] text-right leading-tight truncate">
            {sub}
          </span>
        )}
      </div>
      <div className="mt-2 md:mt-3 text-lg md:text-2xl font-bold tracking-tight text-slate-800 dark:text-white truncate">
        {value}
      </div>
      <div className="text-[11px] md:text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
        {label}
      </div>
    </div>
  );
}