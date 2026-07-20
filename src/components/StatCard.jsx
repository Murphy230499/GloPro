'use client';
import React from 'react';

export default function StatCard({ icon: Icon, label, value, color = '#FF6B9D', sub }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: color + '1a' }}>
          
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {sub && <span className="font-medium text-slate-400 text-xl">{sub}</span>}
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight text-slate-800">{value}</div>
      <div className="text-sm text-slate-400 mt-0.5">{label}</div>
    </div>);

}